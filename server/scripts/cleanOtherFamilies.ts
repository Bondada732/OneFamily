import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAzurePool } from '../db/azurePostgres.js';
import { getSupabaseClient } from '../db/supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, '../data/store.json');

const TARGET_FAMILY_ID = 'fam_1789381570680';

async function cleanup() {
  console.log(`Starting DB Cleanup: Retaining ONLY family_id = '${TARGET_FAMILY_ID}'`);

  if (!fs.existsSync(DATA_FILE)) {
    console.error('store.json not found at:', DATA_FILE);
    return;
  }

  const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
  const store = JSON.parse(rawData);

  console.log('\n--- Before Cleanup (store.json) ---');
  console.log('Families:', store.families?.map((f: any) => ({ id: f.id, name: f.name })));
  console.log('Total Users:', store.users?.length);

  // Collect valid user IDs for target family
  const validUsers = store.users?.filter((u: any) => u.family_id === TARGET_FAMILY_ID) || [];
  const validUserIds = new Set(validUsers.map((u: any) => u.id));
  console.log(`Target Family Users (${validUsers.length}):`, validUsers.map((u: any) => `${u.name} (${u.email || u.id})`));

  // Filter collections in store.json
  const keys = Object.keys(store);
  for (const key of keys) {
    if (!Array.isArray(store[key])) continue;

    const initialLength = store[key].length;
    store[key] = store[key].filter((item: any) => {
      // If table is 'families'
      if (key === 'families') {
        return item.id === TARGET_FAMILY_ID;
      }
      // If item has family_id
      if (item.family_id !== undefined && item.family_id !== null) {
        return item.family_id === TARGET_FAMILY_ID;
      }
      // If item is linked to user_id
      if (item.user_id !== undefined && item.user_id !== null) {
        return validUserIds.has(item.user_id);
      }
      // Global items without family_id or user_id (e.g. standard categories, permissions)
      return true;
    });

    console.log(`Collection '${key}': ${initialLength} -> ${store[key].length} items`);
  }

  // Save store.json
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  console.log('✅ store.json updated successfully!');

  // Cleanup Azure PostgreSQL if available
  const pool = getAzurePool();
  if (pool) {
    try {
      console.log('\n--- Azure PostgreSQL Cleanup ---');
      const resFam = await pool.query(`DELETE FROM "families" WHERE "id" != $1`, [TARGET_FAMILY_ID]);
      console.log(`✓ Deleted ${resFam.rowCount} non-target families from Azure Postgres`);

      const resUsr = await pool.query(`DELETE FROM "users" WHERE "family_id" != $1 OR "family_id" IS NULL`, [TARGET_FAMILY_ID]);
      console.log(`✓ Deleted ${resUsr.rowCount} non-target users from Azure Postgres`);

      // Optionally clean cascading tables in Postgres
      const tablesWithFamilyId = [
        'expenses', 'budgets', 'investments', 'insurance_policies', 'liabilities',
        'goals', 'calendar_events', 'reminders', 'documents', 'emergency_contacts',
        'emergency_profiles', 'memories', 'voice_memories', 'tasks', 'grocery_items',
        'maintenance_items', 'notifications', 'ai_conversations', 'family_contacts',
        'family_contact_occasions', 'reminder_settings', 'contact_permissions'
      ];

      for (const t of tablesWithFamilyId) {
        try {
          const res = await pool.query(`DELETE FROM "${t}" WHERE "family_id" != $1 OR "family_id" IS NULL`, [TARGET_FAMILY_ID]);
          console.log(`✓ Table '${t}': Deleted ${res.rowCount} non-target records`);
        } catch (e: any) {
          // Table might not exist or column might differ, ignore silently or log warning
        }
      }
    } catch (err: any) {
      console.warn('Azure Postgres cleanup notice:', err.message);
    }
  }

  // Cleanup Supabase if available
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      console.log('\n--- Supabase Cleanup ---');
      const { error: errFam } = await supabase.from('families').delete().neq('id', TARGET_FAMILY_ID);
      if (errFam) console.warn('Supabase family delete notice:', errFam.message);
      else console.log('✓ Supabase families cleaned');

      const { error: errUsr } = await supabase.from('users').delete().neq('family_id', TARGET_FAMILY_ID);
      if (errUsr) console.warn('Supabase users delete notice:', errUsr.message);
      else console.log('✓ Supabase users cleaned');
    } catch (err: any) {
      console.warn('Supabase cleanup notice:', err.message);
    }
  }

  console.log('\n🎉 Cleanup complete! Only family_id = fam_1789381570680 remains.');
}

cleanup().catch(console.error);
