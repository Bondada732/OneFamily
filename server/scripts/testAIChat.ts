import { processAIChat } from '../services/aiService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function run() {
  console.log('Testing processAIChat with query...');
  const res = await processAIChat('fam_1789381570680', 'usr_head_1789381570680', 'Suggest good gift for friend birthday');
  console.log('Result:', JSON.stringify(res, null, 2));
}

run().catch(console.error);
