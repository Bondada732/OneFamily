import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function addMissingCols() {
  const client = new Client({
    connectionString: process.env.AZURE_POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const tables = [
    'families', 'users', 'memories', 'voice_memories', 'expenses', 
    'budgets', 'investments', 'insurance_policies', 'liabilities', 
    'goals', 'calendar_events', 'reminders', 'documents', 
    'emergency_contacts', 'tasks', 'grocery_items', 'maintenance_items', 
    'notifications', 'family_contacts'
  ];

  for (const t of tables) {
    try {
      await client.query(`ALTER TABLE "${t}" ADD COLUMN IF NOT EXISTS "updated_at" TEXT;`);
      console.log('✅ Added / verified updated_at for', t);
    } catch (e: any) {
      console.log('Error on table', t, e.message);
    }
  }

  await client.end();
  console.log('Done!');
}
addMissingCols().catch(console.error);
