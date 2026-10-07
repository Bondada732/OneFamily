import { getAzurePool } from '../db/azurePostgres.js';
import db from '../db/database.js';

async function main() {
  console.log('=== LOCAL DB STORE.JSON PERMISSIONS ===');
  const localPerms = db.getTable('member_permissions');
  console.log(`Total local permissions: ${localPerms.length}`);
  const localGrouped: Record<string, string[]> = {};
  localPerms.forEach((x: any) => {
    localGrouped[x.user_id] = (localGrouped[x.user_id] || []).concat(x.permission_code);
  });
  console.log('Local permissions grouped by user:');
  console.log(JSON.stringify(localGrouped, null, 2));

  console.log('\n=== AZURE POSTGRES PERMISSIONS ===');
  const pool = getAzurePool();
  if (!pool) {
    console.log('No Azure Pool configured');
    return;
  }
  try {
    const r = await pool.query('SELECT user_id, permission_code FROM member_permissions');
    console.log(`Azure permissions count: ${r.rows.length}`);
    const azureGrouped: Record<string, string[]> = {};
    r.rows.forEach((x: any) => {
      azureGrouped[x.user_id] = (azureGrouped[x.user_id] || []).concat(x.permission_code);
    });
    console.log(JSON.stringify(azureGrouped, null, 2));
  } catch (err: any) {
    console.error('Azure Postgres Error:', err.message);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
