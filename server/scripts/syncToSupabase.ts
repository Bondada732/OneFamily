import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !SUPABASE_URL.startsWith('http')) {
  console.error('\n❌ ERROR: Supabase credentials not found in .env file!');
  console.error('Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) in .env\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
  realtime: {
    transport: WebSocket,
  },
});

const DATA_FILE = path.resolve(__dirname, '../data/store.json');

async function syncAllToSupabase() {
  console.log('🚀 Starting Famora -> Supabase Data Migration...\n');

  if (!fs.existsSync(DATA_FILE)) {
    console.error(`❌ Data store file not found at ${DATA_FILE}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  const store = JSON.parse(raw);

  const tablesToSync: { name: string; key: keyof typeof store; conflictKey?: string }[] = [
    { name: 'families', key: 'families', conflictKey: 'id' },
    { name: 'users', key: 'users', conflictKey: 'id' },
    { name: 'permissions', key: 'permissions', conflictKey: 'id' },
    { name: 'member_permissions', key: 'member_permissions', conflictKey: 'user_id,permission_code' },
    { name: 'devices', key: 'devices', conflictKey: 'id' },
    { name: 'audit_logs', key: 'audit_logs', conflictKey: 'id' },
    { name: 'expense_categories', key: 'expense_categories', conflictKey: 'id' },
    { name: 'expenses', key: 'expenses', conflictKey: 'id' },
    { name: 'budgets', key: 'budgets', conflictKey: 'id' },
    { name: 'investments', key: 'investments', conflictKey: 'id' },
    { name: 'insurance_policies', key: 'insurance_policies', conflictKey: 'id' },
    { name: 'liabilities', key: 'liabilities', conflictKey: 'id' },
    { name: 'goals', key: 'goals', conflictKey: 'id' },
    { name: 'calendar_events', key: 'calendar_events', conflictKey: 'id' },
    { name: 'reminders', key: 'reminders', conflictKey: 'id' },
    { name: 'document_categories', key: 'document_categories', conflictKey: 'id' },
    { name: 'documents', key: 'documents', conflictKey: 'id' },
    { name: 'emergency_contacts', key: 'emergency_contacts', conflictKey: 'id' },
    { name: 'emergency_profiles', key: 'emergency_profiles', conflictKey: 'id' },
    { name: 'memories', key: 'memories', conflictKey: 'id' },
    { name: 'tasks', key: 'tasks', conflictKey: 'id' },
    { name: 'grocery_items', key: 'grocery_items', conflictKey: 'id' },
    { name: 'maintenance_items', key: 'maintenance_items', conflictKey: 'id' },
    { name: 'notifications', key: 'notifications', conflictKey: 'id' },
    { name: 'ai_conversations', key: 'ai_conversations', conflictKey: 'id' },
  ];

  let totalSynced = 0;
  let failedTables: string[] = [];

  const validUserIds = new Set((store.users || []).map((u: any) => u.id));

  for (const t of tablesToSync) {
    let records = store[t.key] || [];
    if (records.length === 0) {
      continue;
    }

    // Filter orphaned records that violate foreign keys
    if (t.name === 'member_permissions') {
      records = records.filter((mp: any) => validUserIds.has(mp.user_id));
    }

    try {
      // Clean and sanitize records
      const sanitized = records.map((r: any) => {
        const copy: any = { ...r };

        // Convert objects/arrays to text where applicable
        if (copy.contributors && typeof copy.contributors !== 'string') {
          copy.contributors = JSON.stringify(copy.contributors);
        }
        if (copy.photos && typeof copy.photos !== 'string') {
          copy.photos = JSON.stringify(copy.photos);
        }
        if (copy.tagged_members && typeof copy.tagged_members !== 'string') {
          copy.tagged_members = JSON.stringify(copy.tagged_members);
        }
        if (copy.tools_called && typeof copy.tools_called !== 'string') {
          copy.tools_called = JSON.stringify(copy.tools_called);
        }
        if (copy.is_current !== undefined) {
          copy.is_current = Boolean(copy.is_current);
        }
        if (copy.is_trusted !== undefined) {
          copy.is_trusted = Boolean(copy.is_trusted);
        }
        if (copy.is_custom !== undefined) {
          copy.is_custom = Boolean(copy.is_custom);
        }
        if (copy.is_all_day !== undefined) {
          copy.is_all_day = Boolean(copy.is_all_day);
        }
        if (copy.is_recurring !== undefined) {
          copy.is_recurring = Boolean(copy.is_recurring);
        }
        if (copy.is_dismissed !== undefined) {
          copy.is_dismissed = Boolean(copy.is_dismissed);
        }
        if (copy.is_sensitive !== undefined) {
          copy.is_sensitive = Boolean(copy.is_sensitive);
        }
        if (copy.is_verified !== undefined) {
          copy.is_verified = Boolean(copy.is_verified);
        }
        if (copy.is_primary !== undefined) {
          copy.is_primary = Boolean(copy.is_primary);
        }
        if (copy.is_purchased !== undefined) {
          copy.is_purchased = Boolean(copy.is_purchased);
        }
        if (copy.is_read !== undefined) {
          copy.is_read = Boolean(copy.is_read);
        }
        if (copy.is_approved !== undefined) {
          copy.is_approved = Boolean(copy.is_approved);
        }

        // Remove columns that don't exist in Supabase SQL tables
        if (t.name === 'users') {
          delete copy.is_email_verified;
        } else if (t.name === 'expense_categories') {
          delete copy.created_at;
        } else if (t.name === 'expenses') {
          delete copy.updated_at;
        } else if (t.name === 'emergency_profiles') {
          delete copy.created_at;
        }

        return copy;
      });

      // Split into smaller chunks for large binary columns (like avatar_url) to avoid timeouts
      const chunkSize = t.name === 'users' ? 1 : 50;
      for (let i = 0; i < sanitized.length; i += chunkSize) {
        const chunk = sanitized.slice(i, i + chunkSize);
        const { error } = await supabase
          .from(t.name)
          .upsert(chunk, { onConflict: t.conflictKey || 'id' });

        if (error) {
          throw error;
        }
      }

      console.log(`✅ Table [${t.name}]: Successfully synced ${records.length} records.`);
      totalSynced += records.length;
    } catch (err: any) {
      console.error(`❌ Table [${t.name}] sync error: ${err?.message || err}`);
      failedTables.push(t.name);
    }
  }

  if (failedTables.length > 0) {
    console.log(`\n⚠️ Sync finished with ${failedTables.length} table issue(s): ${failedTables.join(', ')}`);
    console.log('💡 TIP: If you see "permission denied", ensure you copy the "service_role" secret key from Supabase Project Settings -> API into SUPABASE_SERVICE_ROLE_KEY in your .env file, or run the updated schema script.');
  } else {
    console.log(`\n🎉 Data Migration Complete! All ${totalSynced} records synced to Supabase successfully.`);
  }
}

syncAllToSupabase().catch((err) => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
