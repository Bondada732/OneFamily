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
const ownerName = 'Rambabu';

const sampleInvestments = [
  {
    id: 'inv_mf_1',
    family_id: familyId,
    user_id: userId,
    owner_name: ownerName,
    type: 'MUTUAL_FUND',
    title: 'Parag Parikh Flexi Cap Fund - Direct Plan - Growth',
    institution: 'PPFAS Mutual Fund',
    invested_amount: 800000,
    current_value: 1250000,
    gain_loss: 450000,
    folio_number: '10928374/2',
    nominee: 'Swathi (100%)',
    notes: 'Monthly SIP ₹15,000 active • CAS Verified',
    maturity_date: '',
  },
  {
    id: 'inv_mf_2',
    family_id: familyId,
    user_id: userId,
    owner_name: ownerName,
    type: 'MUTUAL_FUND',
    title: 'Mirae Asset Large Cap Fund - Direct Growth',
    institution: 'Mirae Asset AMC',
    invested_amount: 450000,
    current_value: 600000,
    gain_loss: 150000,
    folio_number: '99281726/1',
    nominee: 'Swathi (100%)',
    notes: 'Monthly SIP ₹10,000 active • CAS Verified',
    maturity_date: '',
  },
  {
    id: 'inv_mf_3',
    family_id: familyId,
    user_id: userId,
    owner_name: ownerName,
    type: 'MUTUAL_FUND',
    title: 'HDFC Flexi Cap Fund - Direct Plan',
    institution: 'HDFC Mutual Fund',
    invested_amount: 200000,
    current_value: 250000,
    gain_loss: 50000,
    folio_number: '3819204/5',
    nominee: 'Swathi',
    notes: 'Lump sum investment • CAS Verified',
    maturity_date: '',
  },
  {
    id: 'inv_eq_1',
    family_id: familyId,
    user_id: userId,
    owner_name: ownerName,
    type: 'STOCK',
    title: 'Direct Equity Portfolio (TCS, Infosys, Reliance, HDFC Bank)',
    institution: 'Zerodha Kite',
    invested_amount: 650000,
    current_value: 869840,
    gain_loss: 219840,
    folio_number: '120816000293847',
    nominee: 'Swathi',
    notes: 'Blue chip long term dividend stocks',
    maturity_date: '',
  },
  {
    id: 'inv_pf_1',
    family_id: familyId,
    user_id: userId,
    owner_name: ownerName,
    type: 'PF',
    title: 'Employee Provident Fund (EPFO)',
    institution: 'EPFO India',
    invested_amount: 420000,
    current_value: 579200,
    gain_loss: 159200,
    folio_number: 'UAN: 100928374615',
    nominee: 'Swathi',
    notes: 'Monthly payroll EPF & VPF contribution',
    maturity_date: '',
  },
  {
    id: 'inv_ppf_1',
    family_id: familyId,
    user_id: userId,
    owner_name: ownerName,
    type: 'PPF',
    title: 'Public Provident Fund (PPF)',
    institution: 'ICICI Bank',
    invested_amount: 310000,
    current_value: 386450,
    gain_loss: 76450,
    folio_number: 'PPF-0029182',
    nominee: 'Swathi',
    notes: 'Tax-free compound interest, 7.1%',
    maturity_date: '2036-03-31',
  },
  {
    id: 'inv_nps_1',
    family_id: familyId,
    user_id: userId,
    owner_name: ownerName,
    type: 'NPS',
    title: 'National Pension Scheme (Tier 1)',
    institution: 'NSDL / HDFC Pension',
    invested_amount: 280000,
    current_value: 338770,
    gain_loss: 58770,
    folio_number: 'PRAN: 110029384756',
    nominee: 'Swathi',
    notes: 'Active Choice (75% Equity, 25% Corp Bonds)',
    maturity_date: '2050-12-31',
  },
  {
    id: 'inv_fd_1',
    family_id: familyId,
    user_id: userId,
    owner_name: ownerName,
    type: 'FIXED_DEPOSIT',
    title: 'SBI Cumulative Fixed Deposit',
    institution: 'State Bank of India',
    invested_amount: 250000,
    current_value: 289500,
    gain_loss: 39500,
    folio_number: 'SBI-FD-482910',
    nominee: 'Swathi',
    notes: 'Interest Rate 7.2% p.a.',
    maturity_date: '2026-12-15',
  },
  {
    id: 'inv_rd_1',
    family_id: familyId,
    user_id: userId,
    owner_name: ownerName,
    type: 'RD',
    title: 'HDFC Bank Recurring Deposit',
    institution: 'HDFC Bank',
    invested_amount: 110000,
    current_value: 124600,
    gain_loss: 14600,
    folio_number: 'HDFC-RD-928172',
    nominee: 'Swathi',
    notes: 'Monthly ₹5,000 installment',
    maturity_date: '2027-06-30',
  },
  {
    id: 'inv_ss_1',
    family_id: familyId,
    user_id: userId,
    owner_name: ownerName,
    type: 'SMALL_SAVINGS',
    title: 'Post Office Time Deposit / NSC',
    institution: 'India Post',
    invested_amount: 95000,
    current_value: 105740,
    gain_loss: 10740,
    folio_number: 'PO-NSC-827163',
    nominee: 'Swathi',
    notes: 'Government guaranteed 7.7% return',
    maturity_date: '2028-03-31',
  },
  {
    id: 'inv_bonds_1',
    family_id: familyId,
    user_id: userId,
    owner_name: ownerName,
    type: 'BONDS',
    title: 'RBI Floating Rate Savings Bonds',
    institution: 'RBI / HDFC Sec',
    invested_amount: 70000,
    current_value: 78300,
    gain_loss: 8300,
    folio_number: 'RBI-FRB-2024',
    nominee: 'Swathi',
    notes: 'Half-yearly interest payout',
    maturity_date: '2031-08-31',
  },
  {
    id: 'inv_gold_1',
    family_id: familyId,
    user_id: userId,
    owner_name: ownerName,
    type: 'GOLD',
    title: 'Sovereign Gold Bonds (SGB 2021-22 Series IX)',
    institution: 'RBI / HDFC Sec',
    invested_amount: 125000,
    current_value: 162590,
    gain_loss: 37590,
    folio_number: 'SGB-2021-HYD',
    nominee: 'Swathi',
    notes: '25 grams gold + 2.5% p.a. interest',
    maturity_date: '2029-11-30',
  },
  {
    id: 'inv_oth_1',
    family_id: familyId,
    user_id: userId,
    owner_name: ownerName,
    type: 'OTHER',
    title: 'Real Estate & Agricultural Land Share',
    institution: 'Family Holding',
    invested_amount: 110000,
    current_value: 131688,
    gain_loss: 21688,
    folio_number: 'DOC-8271-AP',
    nominee: 'Swathi',
    notes: 'Appreciating asset',
    maturity_date: '',
  },
];

async function run() {
  if (process.env.AZURE_POSTGRES_URL) {
    try {
      const client = new Client({
        connectionString: process.env.AZURE_POSTGRES_URL,
        ssl: { rejectUnauthorized: false },
      });
      await client.connect();

      for (const inv of sampleInvestments) {
        await client.query(
          `INSERT INTO investments (id, family_id, user_id, owner_name, type, title, institution, invested_amount, current_value, gain_loss, maturity_date, folio_number, nominee, notes, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
           ON CONFLICT (id) DO UPDATE SET
             current_value = EXCLUDED.current_value,
             invested_amount = EXCLUDED.invested_amount,
             gain_loss = EXCLUDED.gain_loss,
             owner_name = EXCLUDED.owner_name,
             family_id = EXCLUDED.family_id,
             updated_at = NOW()`,
          [
            inv.id,
            inv.family_id,
            inv.user_id,
            inv.owner_name,
            inv.type,
            inv.title,
            inv.institution,
            inv.invested_amount,
            inv.current_value,
            inv.gain_loss,
            inv.maturity_date || null,
            inv.folio_number || null,
            inv.nominee || null,
            inv.notes || null,
          ]
        );
      }
      console.log('SUCCESS: Seeded all 13 family investments in Azure PostgreSQL!');
      await client.end();
    } catch (e: any) {
      console.warn('Azure PostgreSQL seeding warning:', e.message);
    }
  }

  // Also update store.json
  const storePath = path.resolve(__dirname, '../data/store.json');
  if (fs.existsSync(storePath)) {
    const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    store.investments = store.investments || [];
    for (const inv of sampleInvestments) {
      const idx = store.investments.findIndex((i: any) => i.id === inv.id);
      if (idx >= 0) {
        store.investments[idx] = { ...store.investments[idx], ...inv };
      } else {
        store.investments.push(inv);
      }
    }
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
    console.log('SUCCESS: Updated store.json with all 13 investments!');
  }
}

run();
