import { syncRecordToAzurePostgres } from './server/db/azurePostgres.js';
import dotenv from 'dotenv';
dotenv.config();

const newInv = {
  id: 'inv_cas_test',
  family_id: 'fam_1789381570680',
  title: 'Test',
  type: 'MUTUAL_FUND',
  institution: 'Test AMC',
  invested_amount: 1000,
  current_value: 1000,
  folio_number: '123',
  maturity_date: '',
  nominee: 'Family Nominee',
  notes: 'Test',
  owner_name: 'Rambabu',
  user_id: 'usr_head_1789381570680',
  gain_loss: NaN,
  updated_at: new Date().toISOString(),
};

syncRecordToAzurePostgres('investments', newInv, 'insert').then(console.log).catch(console.error);
