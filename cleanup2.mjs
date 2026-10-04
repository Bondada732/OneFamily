import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.AZURE_POSTGRES_URL, ssl: { rejectUnauthorized: false } });
await pool.query("DELETE FROM investments WHERE id = 'inv_cas_1791092825919_0_tbvo'");
console.log('Test record cleaned up');
await pool.end();
