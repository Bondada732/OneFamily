import { Client } from 'pg';

const client = new Client({
  connectionString: 'postgresql://kinoraadmin:KinoraSecure2026!@kinoraone-db.postgres.database.azure.com/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function checkExpenses() {
  await client.connect();
  const res = await client.query(`
    SELECT id, paid_by_name, category_name, amount, currency, payment_method, merchant, notes, date, created_at 
    FROM expenses 
    ORDER BY created_at DESC 
    LIMIT 20;
  `);

  console.log('=== LATEST EXPENSES IN AZURE POSTGRESQL ===');
  console.log(`Total rows retrieved: ${res.rows.length}`);
  console.table(res.rows.map(r => ({
    ID: r.id,
    'Paid By': r.paid_by_name,
    Category: r.category_name,
    Amount: `₹${r.amount}`,
    Merchant: r.merchant,
    Date: r.date,
    Created: r.created_at
  })));

  await client.end();
}

checkExpenses().catch(console.error);
