import { getAzurePool, deleteMemberPermissionsFromAzurePostgres } from '../db/azurePostgres.js';
import { deleteMemberPermissionsFromSupabase } from '../db/supabaseClient.js';
import db from '../db/database.js';

async function main() {
  const targetFamilyId = 'fam_1789381570680';
  const members = db.find('users', (u) => u.family_id === targetFamilyId && u.role !== 'FAMILY_HEAD');

  console.log(`Found ${members.length} non-head family members to clear blocked permissions:`);
  for (const m of members) {
    console.log(`- Purging permissions for: ${m.name} (${m.id}, role: ${m.role})`);
    
    // 1. In memory & store.json
    const remaining = db.getTable('member_permissions').filter((mp: any) => mp.user_id !== m.id);
    db.resetTable('member_permissions', remaining);

    // 2. Azure Postgres
    await deleteMemberPermissionsFromAzurePostgres(m.id);

    // 3. Supabase
    await deleteMemberPermissionsFromSupabase(m.id);
  }

  console.log('\nVerifying Azure Postgres permissions:');
  const pool = getAzurePool();
  if (pool) {
    const r = await pool.query('SELECT user_id, permission_code FROM member_permissions');
    console.log(`Total remaining permissions in Azure Postgres: ${r.rows.length}`);
    const grouped: Record<string, string[]> = {};
    r.rows.forEach((x: any) => {
      grouped[x.user_id] = (grouped[x.user_id] || []).concat(x.permission_code);
    });
    console.log(JSON.stringify(grouped, null, 2));
    await pool.end();
  }

  console.log('✅ Purge complete! Only Family Head has permissions.');
}

main().catch(console.error);
