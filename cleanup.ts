import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.AZURE_POSTGRES_URL, ssl: { rejectUnauthorized: false } });
await pool.query('DELETE FROM investments WHERE id = ', ['inv_cas_test_debug_001']);
console.log('Cleaned up test record');
await pool.end();
