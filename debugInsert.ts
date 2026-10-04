import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';
const pool = new pg.Pool({
  connectionString: process.env.AZURE_POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
});

// Simulate exactly what casParserService sends
const newInv = {
  id: 'inv_cas_test_debug_001',
  family_id: 'fam_1789381570680',
  title: 'DEBUG TEST FUND',
  type: 'MUTUAL_FUND',
  institution: 'Test AMC',
  invested_amount: 10000,
  current_value: 12000,
  folio_number: '999999',
  maturity_date: '',
  nominee: 'Family Nominee',
  notes: 'Units: 100 NAV: 120 CAS Real Auto-Sync',
  owner_name: 'Rambabu',
  user_id: 'usr_head_1789381570680',
  gain_loss: 2000,
  created_at: '2026-10-04T05:00:00.000Z',
  updated_at: '2026-10-04T05:00:00.000Z',
};

// Filter to only columns that exist in DB (same logic as azurePostgres.ts)
const schemaRes = await pool.query(
  "SELECT column_name FROM information_schema.columns WHERE table_name = 'investments'"
);
const dbCols = new Set(schemaRes.rows.map(r => r.column_name));
console.log('DB columns:', [...dbCols]);

const keys = Object.keys(newInv).filter(k => dbCols.has(k));
console.log('Filtered keys:', keys);

const values = keys.map(k => newInv[k]);
console.log('Values:', values);

const placeholders = keys.map((_, i) => '$' + (i + 1)).join(', ');
const columns = keys.map(k => '"' + k + '"').join(', ');
const updateSet = keys.filter(k => k !== 'id').map(k => '"' + k + '" = EXCLUDED."' + k + '"').join(', ');
const sql = 'INSERT INTO \"investments\" (' + columns + ') VALUES (' + placeholders + ') ON CONFLICT (\"id\") DO UPDATE SET ' + updateSet;
console.log('SQL:', sql);

try {
  await pool.query(sql, values);
  console.log('INSERT SUCCESS');
} catch (err) {
  console.error('INSERT FAILED:', err.message);
}

// Verify
const check = await pool.query('SELECT * FROM investments WHERE id = ', ['inv_cas_test_debug_001']);
console.log('Verify row:', JSON.stringify(check.rows));

// Cleanup
await pool.query('DELETE FROM investments WHERE id = ', ['inv_cas_test_debug_001']);
await pool.end();
