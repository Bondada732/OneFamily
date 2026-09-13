import { createClient, SupabaseClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_KEY && SUPABASE_URL.startsWith('http')) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
      realtime: {
        transport: WebSocket,
      },
    });
    console.log('⚡ Supabase Client initialized successfully with URL:', SUPABASE_URL);
  } catch (err) {
    console.error('⚠️ Failed to initialize Supabase client:', err);
    supabase = null;
  }
} else {
  console.log('ℹ️ Supabase credentials not set in .env. Running in local persistence mode.');
}

export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

export function getSupabaseClient(): SupabaseClient | null {
  return supabase;
}

/**
 * Asynchronously sync an individual record action to Supabase
 */
export async function syncRecordToSupabase(
  tableName: string,
  record: any,
  action: 'insert' | 'update' | 'delete'
): Promise<boolean> {
  if (!supabase) return false;

  try {
    if (action === 'insert' || action === 'update') {
      const { error } = await supabase
        .from(tableName)
        .upsert(record, { onConflict: 'id' });

      if (error) {
        console.warn(`[Supabase Sync] Error upserting into ${tableName}:`, error.message);
        return false;
      }
      return true;
    } else if (action === 'delete') {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', record.id);

      if (error) {
        console.warn(`[Supabase Sync] Error deleting from ${tableName}:`, error.message);
        return false;
      }
      return true;
    }
  } catch (err: any) {
    console.warn(`[Supabase Sync] Unexpected error for ${tableName}:`, err?.message || err);
    return false;
  }
  return false;
}

/**
 * Bulk sync a collection of records to Supabase
 */
export async function syncBatchToSupabase(
  tableName: string,
  records: any[]
): Promise<{ count: number; error?: string }> {
  if (!supabase) return { count: 0, error: 'Supabase client not configured' };
  if (!records || records.length === 0) return { count: 0 };

  try {
    const { data, error } = await supabase
      .from(tableName)
      .upsert(records, { onConflict: tableName === 'member_permissions' ? 'user_id,permission_code' : 'id' });

    if (error) {
      console.error(`[Supabase Bulk Sync] Error for ${tableName}:`, error);
      return { count: 0, error: error.message };
    }
    return { count: records.length };
  } catch (err: any) {
    console.error(`[Supabase Bulk Sync] Exception for ${tableName}:`, err);
    return { count: 0, error: err?.message || 'Sync failed' };
  }
}

export { supabase };
export default supabase;
