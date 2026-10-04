import { fetchAllFromAzurePostgres } from './server/db/azurePostgres.js';
import dotenv from 'dotenv';
dotenv.config();
fetchAllFromAzurePostgres('audit_logs').then(logs => {
  const casLogs = logs.filter(l => l.details.includes('Imported'));
  console.log(JSON.stringify(casLogs.slice(-2), null, 2));
}).catch(console.error);
