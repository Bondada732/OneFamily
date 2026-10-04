import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.AZURE_POSTGRES_URL, ssl: { rejectUnauthorized: false } });
const res = await pool.query("SELECT id, title, updated_at FROM investments WHERE id LIKE 'inv_cas_%' ORDER BY updated_at DESC");
console.log('CAS investments in Azure:', res.rows.length);
res.rows.forEach(r => console.log(r.id, '|', r.title, '|', r.updated_at));
await pool.end();
