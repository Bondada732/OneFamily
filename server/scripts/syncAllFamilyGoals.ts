import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const GOALS_TEMPLATE = [
  {
    suffix: 'vacation_1',
    title: 'Goa / Kerala / Srinagar trip',
    category: 'TRAVEL',
    target_amount: 100000,
    current_amount: 0,
    monthly_contribution: 4760,
    target_date: '2028-06-30',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    contributors: JSON.stringify(['Family']),
  },
  {
    suffix: 'emergency_1',
    title: 'Emergency Fund',
    category: 'EMERGENCY',
    target_amount: 200000,
    current_amount: 160000,
    monthly_contribution: 10000,
    target_date: '2028-12-31',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    contributors: JSON.stringify(['Family']),
  },
  {
    suffix: 'education_1',
    title: 'Child Education',
    category: 'EDUCATION',
    target_amount: 2500000,
    current_amount: 842500,
    monthly_contribution: 12000,
    target_date: '2032-06-30',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    contributors: JSON.stringify(['Aarav']),
  },
  {
    suffix: 'home_1',
    title: 'Home Down Payment',
    category: 'HOUSE',
    target_amount: 2100000,
    current_amount: 950000,
    monthly_contribution: 25000,
    target_date: '2030-12-31',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    contributors: JSON.stringify(['Family']),
  },
  {
    suffix: 'retirement_1',
    title: 'Retirement Fund',
    category: 'RETIREMENT',
    target_amount: 4500000,
    current_amount: 1240000,
    monthly_contribution: 20000,
    target_date: '2045-01-01',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    contributors: JSON.stringify(['Self']),
  },
  {
    suffix: 'car_1',
    title: 'New Car',
    category: 'LIFESTYLE',
    target_amount: 1000000,
    current_amount: 600000,
    monthly_contribution: 15000,
    target_date: '2027-03-31',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    contributors: JSON.stringify(['Family']),
  },
];

const TARGET_FAMILIES = ['fam_1789193802598', 'fam_1789381570680'];

async function syncGoals() {
  console.log('🚀 Syncing rich family goals to Azure PostgreSQL and local store...');

  // 1. Update Azure PostgreSQL
  const client = new Client({
    connectionString: process.env.AZURE_POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to Azure PostgreSQL.');

    for (const famId of TARGET_FAMILIES) {
      console.log(`\nSyncing goals for family: ${famId}`);
      for (const t of GOALS_TEMPLATE) {
        const goalId = `goal_${famId}_${t.suffix}`;
        const query = `
          INSERT INTO goals (id, family_id, title, category, target_amount, current_amount, monthly_contribution, target_date, priority, status, contributors, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (id) DO UPDATE SET
            family_id = EXCLUDED.family_id,
            title = EXCLUDED.title,
            category = EXCLUDED.category,
            target_amount = EXCLUDED.target_amount,
            current_amount = EXCLUDED.current_amount,
            monthly_contribution = EXCLUDED.monthly_contribution,
            target_date = EXCLUDED.target_date,
            priority = EXCLUDED.priority,
            status = EXCLUDED.status,
            contributors = EXCLUDED.contributors,
            updated_at = EXCLUDED.updated_at
        `;

        await client.query(query, [
          goalId,
          famId,
          t.title,
          t.category,
          t.target_amount,
          t.current_amount,
          t.monthly_contribution,
          t.target_date,
          t.priority,
          t.status,
          t.contributors,
          new Date().toISOString(),
          new Date().toISOString(),
        ]);
        console.log(`  ✓ Synced Goal in Postgres: ${t.title} (ID: ${goalId})`);
      }
    }

    const checkRes = await client.query('SELECT count(*) FROM goals');
    console.log(`\nTotal Goals in Postgres now: ${checkRes.rows[0].count}`);
    await client.end();
  } catch (err) {
    console.error('Error with Azure PostgreSQL sync:', err);
  }

  // 2. Update store.json
  const storePath = path.resolve('server/data/store.json');
  if (fs.existsSync(storePath)) {
    const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    if (!store.goals) store.goals = [];

    // Remove existing template goals for these families
    store.goals = store.goals.filter((g: any) => !TARGET_FAMILIES.includes(g.family_id) || !g.id.startsWith('goal_fam_'));

    for (const famId of TARGET_FAMILIES) {
      for (const t of GOALS_TEMPLATE) {
        const goalId = `goal_${famId}_${t.suffix}`;
        store.goals.push({
          id: goalId,
          family_id: famId,
          title: t.title,
          category: t.category,
          target_amount: t.target_amount,
          current_amount: t.current_amount,
          monthly_contribution: t.monthly_contribution,
          target_date: t.target_date,
          priority: t.priority,
          status: t.status,
          contributors: t.contributors,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
    console.log('✓ Successfully updated store.json with goals for both Rambabu family accounts.');
  }

  console.log('\n🎉 All goals are now persisted in Azure Postgres and local store!');
}

syncGoals().catch(console.error);
