import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const AZURE_POSTGRES_URL =
  process.env.AZURE_POSTGRES_URL ||
  process.env.DATABASE_URL;

let pool: pg.Pool | null = null;

if (AZURE_POSTGRES_URL && AZURE_POSTGRES_URL.includes('postgres.database.azure.com')) {
  try {
    pool = new Pool({
      connectionString: AZURE_POSTGRES_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    console.log('⚡ Azure PostgreSQL Client pool initialized.');
  } catch (err) {
    console.error('⚠️ Failed to initialize Azure PostgreSQL pool:', err);
    pool = null;
  }
}

export function isAzurePostgresConfigured(): boolean {
  return pool !== null;
}

export function getAzurePool(): pg.Pool | null {
  return pool;
}

export async function fetchAllFromAzurePostgres(tableName: string): Promise<any[]> {
  if (!pool) return [];
  try {
    const res = await pool.query(`SELECT * FROM "${tableName}"`);
    return res.rows || [];
  } catch (err: any) {
    console.warn(`[Azure Postgres] Fetch error on ${tableName}:`, err.message);
    return [];
  }
}

const tableColumnsCache: Record<string, Set<string>> = {};

async function getTableColumns(tableName: string): Promise<Set<string>> {
  if (tableColumnsCache[tableName]) {
    return tableColumnsCache[tableName];
  }
  if (!pool) return new Set();
  try {
    const res = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
      [tableName]
    );
    const cols = new Set(res.rows.map((r) => r.column_name));
    tableColumnsCache[tableName] = cols;
    return cols;
  } catch (err: any) {
    console.warn(`[Azure Postgres] Error fetching schema for ${tableName}:`, err.message);
    return new Set();
  }
}

export async function syncRecordToAzurePostgres(
  tableName: string,
  record: any,
  action: 'insert' | 'update' | 'delete'
): Promise<boolean> {
  if (!pool || !record) return false;

  try {
    if (action === 'delete') {
      if (tableName === 'member_permissions') {
        await pool.query(
          `DELETE FROM "${tableName}" WHERE "user_id" = $1 AND "permission_code" = $2`,
          [record.user_id, record.permission_code]
        );
      } else if (record.id) {
        await pool.query(`DELETE FROM "${tableName}" WHERE "id" = $1`, [record.id]);
      }
      return true;
    }

    const tableCols = await getTableColumns(tableName);
    let keys = Object.keys(record);
    if (tableCols.size > 0) {
      keys = keys.filter((k) => tableCols.has(k));
    }
    if (keys.length === 0) return false;

    const values = keys.map((k) => {
      const v = record[k];
      if (v !== null && typeof v === 'object') {
        return JSON.stringify(v);
      }
      return v;
    });

    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.map((k) => `"${k}"`).join(', ');

    const conflictTarget =
      tableName === 'member_permissions' ? '("user_id", "permission_code")' : '("id")';
    const updateSet = keys
      .filter(
        (k) =>
          k !== 'id' &&
          (tableName !== 'member_permissions' ||
            (k !== 'user_id' && k !== 'permission_code'))
      )
      .map((k) => `"${k}" = EXCLUDED."${k}"`)
      .join(', ');

    const upsertSql = updateSet
      ? `INSERT INTO "${tableName}" (${columns}) VALUES (${placeholders}) ON CONFLICT ${conflictTarget} DO UPDATE SET ${updateSet}`
      : `INSERT INTO "${tableName}" (${columns}) VALUES (${placeholders}) ON CONFLICT ${conflictTarget} DO NOTHING`;

    await pool.query(upsertSql, values);
    return true;
  } catch (err: any) {
    console.warn(`[Azure Postgres] Sync error on [${tableName}]:`, err.message);
    return false;
  }
}
