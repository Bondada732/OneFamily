import db from './server/db/database.js';
const res = await db.hydrateFromAzurePostgres();
console.log('Hydration result:', res);
