import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AZURE_DB_URL = process.env.AZURE_POSTGRES_URL || 'postgresql://kinoraadmin:KinoraSecure2026!@kinoraone-db.postgres.database.azure.com/postgres?sslmode=require';

async function initAzurePostgres() {
  console.log('🚀 Connecting to Azure PostgreSQL Flexible Server...');
  console.log('📍 Host: kinoraone-db.postgres.database.azure.com');
  console.log('🌍 Region: Central India');

  const client = new Client({
    connectionString: AZURE_DB_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully to Azure PostgreSQL!');

    const schemaPath = path.resolve(__dirname, '../db/schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    console.log('📋 Applying database schema (25+ tables)...');
    await client.query(schemaSql);

    // Ensure all optional / dynamic columns exist
    await client.query(`
      ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE;
      ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
      ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS last_login TEXT;
      ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE;
      ALTER TABLE IF EXISTS expenses ADD COLUMN IF NOT EXISTS detected_transaction_id TEXT;
      ALTER TABLE IF EXISTS expenses ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'FAMILY';
      ALTER TABLE IF EXISTS expenses ADD COLUMN IF NOT EXISTS updated_at TEXT;
      ALTER TABLE IF EXISTS grocery_items ADD COLUMN IF NOT EXISTS estimated_cost REAL;
      ALTER TABLE IF EXISTS grocery_items ADD COLUMN IF NOT EXISTS notes TEXT;
      ALTER TABLE IF EXISTS devices ADD COLUMN IF NOT EXISTS device_type TEXT;
      ALTER TABLE IF EXISTS audit_logs ADD COLUMN IF NOT EXISTS module TEXT;
      ALTER TABLE IF EXISTS audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
      ALTER TABLE IF EXISTS document_categories ADD COLUMN IF NOT EXISTS family_id TEXT;
    `);

    console.log('✅ All tables and indexes created successfully in Azure PostgreSQL!');

    // Load seed / persistent data from store.json
    const storePath = path.resolve(__dirname, '../data/store.json');
    if (fs.existsSync(storePath)) {
      const store = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
      console.log('\n🔄 Migrating existing data to Azure PostgreSQL...');

      const tableOrder = [
        'families',
        'users',
        'permissions',
        'member_permissions',
        'devices',
        'audit_logs',
        'expense_categories',
        'expenses',
        'budgets',
        'investments',
        'insurance_policies',
        'liabilities',
        'goals',
        'calendar_events',
        'reminders',
        'document_categories',
        'documents',
        'emergency_contacts',
        'emergency_profiles',
        'memories',
        'tasks',
        'grocery_items',
        'maintenance_items',
        'notifications',
        'ai_conversations',
      ];

      for (const table of tableOrder) {
        const records = store[table] || [];
        if (records.length === 0) continue;

        let insertedCount = 0;
        for (const record of records) {
          const keys = Object.keys(record);
          if (keys.length === 0) continue;

          const values = keys.map((k) => {
            const v = record[k];
            if (v !== null && typeof v === 'object') {
              return JSON.stringify(v);
            }
            return v;
          });

          const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
          const columns = keys.map((k) => `"${k}"`).join(', ');

          const conflictTarget = table === 'member_permissions' ? '("user_id", "permission_code")' : '("id")';
          const updateSet = keys
            .filter((k) => k !== 'id' && (table !== 'member_permissions' || (k !== 'user_id' && k !== 'permission_code')))
            .map((k) => `"${k}" = EXCLUDED."${k}"`)
            .join(', ');

          const upsertSql = updateSet
            ? `INSERT INTO "${table}" (${columns}) VALUES (${placeholders}) ON CONFLICT ${conflictTarget} DO UPDATE SET ${updateSet}`
            : `INSERT INTO "${table}" (${columns}) VALUES (${placeholders}) ON CONFLICT ${conflictTarget} DO NOTHING`;

          try {
            await client.query(upsertSql, values);
            insertedCount++;
          } catch (insertErr: any) {
            console.warn(`  ⚠️ Row warning in [${table}]:`, insertErr.message);
          }
        }
        console.log(`  📦 [${table}]: Migrated ${insertedCount} record(s).`);
      }
    }

    // Verify row counts
    console.log('\n📊 Database Row Counts:');
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    for (const row of tablesRes.rows) {
      const countRes = await client.query(`SELECT COUNT(*) FROM "${row.table_name}";`);
      console.log(`  • ${row.table_name}: ${countRes.rows[0].count} rows`);
    }

    console.log('\n🎉 ALL DONE! Azure PostgreSQL database is fully initialized and operational.');
  } catch (err: any) {
    console.error('❌ Migration Error:', err.message);
  } finally {
    await client.end();
  }
}

initAzurePostgres();
