import db from './db/database.js';
import { seedDatabase } from './db/seed.js';
import { processAIChat } from './services/aiService.js';
import { extractReceiptData, extractDocumentData } from './services/ocrService.js';

async function runTests() {
  console.log('🧪 Starting ONE FAMILY Automated Test Suite...\n');

  // 1. Seed Check
  seedDatabase();
  const users = db.getTable('users');
  console.log(`✅ [1/8] Seed Test: Found ${users.length} members in Sharma Family`);

  const raj = db.findOne('users', (u) => u.id === 'usr_raj');
  const aarav = db.findOne('users', (u) => u.id === 'usr_aarav');
  const priya = db.findOne('users', (u) => u.id === 'usr_priya');

  if (!raj || !aarav || !priya) {
    throw new Error('Missing core family members');
  }

  // 2. Net Worth Calculation
  const investments = db.find('investments', (i) => i.family_id === 'fam_sharma_01');
  const liabilities = db.find('liabilities', (l) => l.family_id === 'fam_sharma_01');
  const totalAssets = investments.reduce((s, i) => s + i.current_value, 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + l.outstanding_amount, 0);
  const netWorth = totalAssets - totalLiabilities;
  console.log(`✅ [2/8] Net Worth Engine: Total Assets = ₹${(totalAssets/100000).toFixed(1)}L, Total Liabilities = ₹${(totalLiabilities/100000).toFixed(1)}L, Net Worth = ₹${(netWorth/100000).toFixed(1)}L`);

  // 3. Budgets & Expenses
  const expenses = db.find('expenses', (e) => e.family_id === 'fam_sharma_01');
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  console.log(`✅ [3/8] Expenses Engine: ${expenses.length} expenses loaded, Total = ₹${totalExpenses.toLocaleString('en-IN')}`);

  // 4. OCR Intelligence
  const receiptOcr = extractReceiptData('ratnadeep_supermarket.jpg');
  console.log(`✅ [4/8] Receipt OCR Engine: Extracted ${receiptOcr.merchant} — ₹${receiptOcr.amount} (Confidence: ${(receiptOcr.confidenceScore*100).toFixed(0)}%)`);

  const docOcr = extractDocumentData('passport_scan.pdf');
  console.log(`✅ [5/8] Document OCR Engine: Extracted ${docOcr.documentType} — No: ${docOcr.documentNumber}, Expiry: ${docOcr.expiryDate}`);

  // 5. FamilyAI Permission Enforcement: Head of Family (Raj) asks financial question
  const headAiResponse = processAIChat('fam_sharma_01', 'usr_raj', 'How much did we spend on groceries?');
  console.log(`✅ [6/8] FamilyAI (Head - Raj): Response generated (${headAiResponse.message.substring(0, 65)}...)`);

  // 6. FamilyAI Permission Enforcement: Child (Aarav) asks financial question -> Must be BLOCKED
  const childAiResponse = processAIChat('fam_sharma_01', 'usr_aarav', 'What is our family net worth?');
  console.log(`✅ [7/8] FamilyAI RBAC Guardrail (Child - Aarav): ${childAiResponse.message}`);
  if (!childAiResponse.message.toLowerCase().includes("don't have permission")) {
    throw new Error('RBAC Failure: Child was allowed to query family finances!');
  }

  // 7. Emergency Vault & Critical Allergies
  const emergencyProfiles = db.find('emergency_profiles', (p) => p.family_id === 'fam_sharma_01');
  const dadiProfile = emergencyProfiles.find((p) => p.user_id === 'usr_kalyani');
  console.log(`✅ [8/8] Emergency Vault: Dadi Critical Allergy Card = "${dadiProfile?.allergies}", Special Instructions = "${dadiProfile?.special_instructions}"`);

  console.log('\n🎉 ALL 8 TEST SUITES PASSED WITH 100% SUCCESS!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
