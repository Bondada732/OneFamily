import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';
const pool = new pg.Pool({
  connectionString: process.env.AZURE_POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
});

// Check total investments count
const allInv = await pool.query('SELECT COUNT(*) as cnt FROM investments');
console.log('Total investments in DB:', allInv.rows[0].cnt);

// Check CAS investments specifically
const casInv = await pool.query("SELECT id, title, updated_at FROM investments WHERE id LIKE 'inv_cas_%' ORDER BY updated_at DESC");
console.log('CAS investments:', casInv.rows.length);
casInv.rows.forEach(r => console.log(' -', r.id, '|', r.title, '|', r.updated_at));

// Check ALL investments
const all = await pool.query('SELECT id, title, updated_at FROM investments ORDER BY updated_at DESC');
console.log('\nAll investments:', all.rows.length);
all.rows.forEach(r => console.log(' -', r.id, '|', r.title, '|', r.updated_at));

await pool.end();
