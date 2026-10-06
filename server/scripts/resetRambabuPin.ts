import db from '../db/database.js';
import bcrypt from 'bcryptjs';
import { getAzurePool } from '../db/azurePostgres.js';

async function main() {
  const hash = await bcrypt.hash('1234', 10);
  const familyId = 'fam_1789381570680';

  console.log(`[PIN Sync] Resetting PIN to 1234 for all members in Family ${familyId}...`);

  const members = db.find('users', (u: any) => u.family_id === familyId);
  for (const m of members) {
    db.update('users', (x: any) => x.id === m.id, {
      pin_code: hash,
      password_hash: hash,
    });
    console.log(`✓ [Local DB] ${m.name} (${m.email || m.phone}) -> PIN set to 1234`);
  }

  const pool = getAzurePool();
  if (pool) {
    try {
      const res = await pool.query(
        `UPDATE "users" SET "pin_code" = $1, "password_hash" = $2 WHERE "family_id" = $3`,
        [hash, hash, familyId]
      );
      console.log(`✓ [Azure Postgres] Updated ${res.rowCount} family members to PIN 1234`);
    } catch (err: any) {
      console.error('[Azure Postgres Error]:', err.message);
    }
  }

  console.log('✅ Family PIN sync complete!');
}

main().catch(console.error);
