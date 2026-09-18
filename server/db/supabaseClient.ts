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
 * Remove non-schema fields and format data types before sending to Supabase
 */
export function sanitizeForSupabase(tableName: string, record: any): any {
  if (!record || typeof record !== 'object') return record;
  const copy: any = { ...record };

  // Convert complex objects/arrays to string for text columns
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

  // Remove columns that don't exist in the current Supabase SQL schema
  if (tableName === 'users') {
    delete copy.is_email_verified;
  } else if (tableName === 'expense_categories') {
    delete copy.created_at;
  } else if (tableName === 'expenses') {
    delete copy.updated_at;
    delete copy.detected_transaction_id;
    delete copy.visibility;
    delete copy.savePreference;
  } else if (tableName === 'emergency_profiles') {
    delete copy.created_at;
  }

  return copy;
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
    const sanitized = sanitizeForSupabase(tableName, record);
    if (action === 'insert' || action === 'update') {
      const conflictKey = tableName === 'member_permissions' ? 'user_id,permission_code' : 'id';
      let { error } = await supabase
        .from(tableName)
        .upsert(sanitized, { onConflict: conflictKey });

      if (error && tableName === 'grocery_items' && (error.message.includes('estimated_cost') || error.message.includes('notes'))) {
        // Fallback for grocery_items if optional columns do not exist yet in Supabase
        const fallback = { ...sanitized };
        delete fallback.estimated_cost;
        delete fallback.notes;
        const retryRes = await supabase.from(tableName).upsert(fallback, { onConflict: conflictKey });
        error = retryRes.error;
      }

      if (error) {
        console.warn(`[Supabase Sync] Error upserting into ${tableName}:`, error.message);
        return false;
      }
      return true;
    } else if (action === 'delete') {
      if (tableName === 'member_permissions') {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .match({ user_id: record.user_id, permission_code: record.permission_code });
        return !error;
      }
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
    const sanitized = records.map((r) => sanitizeForSupabase(tableName, r));
    const conflictKey = tableName === 'member_permissions' ? 'user_id,permission_code' : 'id';
    
    // Chunking to prevent large payload errors
    const chunkSize = 100;
    for (let i = 0; i < sanitized.length; i += chunkSize) {
      const chunk = sanitized.slice(i, i + chunkSize);
      const { error } = await supabase
        .from(tableName)
        .upsert(chunk, { onConflict: conflictKey });

      if (error) {
        console.error(`[Supabase Bulk Sync] Error for ${tableName}:`, error);
        return { count: 0, error: error.message };
      }
    }
    return { count: records.length };
  } catch (err: any) {
    console.error(`[Supabase Bulk Sync] Exception for ${tableName}:`, err);
    return { count: 0, error: err?.message || 'Sync failed' };
  }
}

/**
 * Fetch all records for a table from Supabase
 */
export async function fetchAllFromSupabase(tableName: string): Promise<any[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) {
      console.warn(`[Supabase Fetch] Error fetching ${tableName}:`, error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn(`[Supabase Fetch] Exception fetching ${tableName}:`, err);
    return [];
  }
}

export { supabase };
export default supabase;
