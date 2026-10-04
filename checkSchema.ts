import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';
const pool = new pg.Pool({
  connectionString: process.env.AZURE_POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
});
const res = await pool.query(
  "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'investments' ORDER BY ordinal_position"
);
console.log(JSON.stringify(res.rows, null, 2));
await pool.end();
