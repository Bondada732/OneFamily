import db from './server/db/database.js';
await db.hydrateFromSupabase();
console.log('Local store.json synced with Azure Postgres!');
