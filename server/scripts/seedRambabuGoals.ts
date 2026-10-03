import { Client } from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const familyId = 'fam_1789381570680';
const userId = 'usr_head_1789381570680';

const sampleGoals = [
  {
    id: 'goal_vacation_1',
    family_id: familyId,
    title: 'Goa / Kerala / Srinagar trip',
    category: 'TRAVEL',
    subtitle: 'Family vacation',
    target_amount: 100000,
    current_amount: 0,
    monthly_contribution: 4760,
    target_date: '2028-06-30',
    priority: 'MEDIUM',
    status: 'ACTIVE',
    beneficiary: 'Family Goal',
    owner_name: 'Family',
  },
  {
    id: 'goal_emergency_1',
    family_id: familyId,
    title: 'Emergency Fund',
    category: 'EMERGENCY',
    subtitle: 'For unexpected expenses',
    target_amount: 200000,
    current_amount: 160000,
    monthly_contribution: 10000,
    target_date: '2028-12-31',
    priority: 'HIGH',
    status: 'ACTIVE',
    beneficiary: 'Family Goal',
    owner_name: 'Family',
  },
  {
    id: 'goal_education_1',
    family_id: familyId,
    title: 'Child Education',
    category: 'EDUCATION',
    subtitle: 'Higher education fund',
    target_amount: 2500000,
    current_amount: 842500,
    monthly_contribution: 12000,
    target_date: '2032-06-30',
    priority: 'HIGH',
    status: 'ACTIVE',
    beneficiary: 'For Aarav',
    owner_name: 'Aarav',
  },
  {
    id: 'goal_home_1',
    family_id: familyId,
    title: 'Home Down Payment',
    category: 'HOUSE',
    subtitle: 'Our dream home',
    target_amount: 2100000,
    current_amount: 950000,
    monthly_contribution: 25000,
    target_date: '2030-12-31',
    priority: 'HIGH',
    status: 'ACTIVE',
    beneficiary: 'Family Goal',
    owner_name: 'Family',
  },
  {
    id: 'goal_retirement_1',
    family_id: familyId,
    title: 'Retirement Fund',
    category: 'RETIREMENT',
    subtitle: 'Financial freedom',
    target_amount: 4500000,
    current_amount: 1240000,
    monthly_contribution: 20000,
    target_date: '2045-01-01',
    priority: 'HIGH',
    status: 'ACTIVE',
    beneficiary: 'Family Goal',
    owner_name: 'Rambabu',
  },
  {
    id: 'goal_car_1',
    family_id: familyId,
    title: 'New Car',
    category: 'LIFESTYLE',
    subtitle: 'Upgrade in 2027',
    target_amount: 1000000,
    current_amount: 600000,
    monthly_contribution: 15000,
    target_date: '2027-03-31',
    priority: 'MEDIUM',
    status: 'ACTIVE',
    beneficiary: 'Family Goal',
    owner_name: 'Rambabu',
  },
];

async function seedGoals() {
  console.log('Seeding Rambabu family goals...');
  const client = new Client({
    connectionString: process.env.AZURE_POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    // Delete existing goals for this family
    await client.query('DELETE FROM goals WHERE family_id = $1', [familyId]);

    for (const g of sampleGoals) {
      await client.query(
        `INSERT INTO goals (id, family_id, title, category, target_amount, current_amount, monthly_contribution, target_date, priority, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           category = EXCLUDED.category,
           target_amount = EXCLUDED.target_amount,
           current_amount = EXCLUDED.current_amount,
           monthly_contribution = EXCLUDED.monthly_contribution,
           target_date = EXCLUDED.target_date,
           priority = EXCLUDED.priority,
           status = EXCLUDED.status`,
        [
          g.id,
          g.family_id,
          g.title,
          g.category,
          g.target_amount,
          g.current_amount,
          g.monthly_contribution,
          g.target_date,
          g.priority,
          g.status,
        ]
      );
    }
    console.log('SUCCESS: Seeded all 6 family goals in Azure PostgreSQL!');
    await client.end();
  } catch (err) {
    console.warn('Postgres seeding warning (continuing with store.json):', err);
  }

  // Update store.json
  const storePath = path.resolve(__dirname, '../data/store.json');
  if (fs.existsSync(storePath)) {
    const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    store.goals = (store.goals || []).filter((g: any) => g.family_id !== familyId);
    store.goals.push(...sampleGoals);
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
    console.log('SUCCESS: Updated store.json with all 6 goals!');
  }
}

seedGoals();
