import express from 'express';
import db from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { logActivity } from '../services/auditService.js';

const router = express.Router();
router.use(authMiddleware);

// Get Complete Wealth & Net Worth Overview
router.get('/:id/investments', requirePermission('INVESTMENT_VIEW'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;

  const investments = db.find('investments', (i) => i.family_id === familyId);
  const insurancePolicies = db.find('insurance_policies', (p) => p.family_id === familyId);
  const liabilities = db.find('liabilities', (l) => l.family_id === familyId);

  // Asset Totals
  const totalInvested = investments.reduce((sum, i) => sum + i.invested_amount, 0);
  const totalAssetValue = investments.reduce((sum, i) => sum + i.current_value, 0);
  const totalGainLoss = totalAssetValue - totalInvested;
  const overallReturnPct = totalInvested > 0 ? ((totalGainLoss / totalInvested) * 100).toFixed(1) : '0';

  // Breakdown by Asset Type
  const assetAllocation = {
    mutualFunds: investments.filter((i) => i.type === 'MUTUAL_FUND').reduce((s, i) => s + i.current_value, 0),
    stocks: investments.filter((i) => i.type === 'STOCK').reduce((s, i) => s + i.current_value, 0),
    fixedDeposits: investments.filter((i) => i.type === 'FIXED_DEPOSIT').reduce((s, i) => s + i.current_value, 0),
    gold: investments.filter((i) => i.type === 'GOLD').reduce((s, i) => s + i.current_value, 0),
    ppf: investments.filter((i) => i.type === 'PPF').reduce((s, i) => s + i.current_value, 0),
    other: investments.filter((i) => !['MUTUAL_FUND', 'STOCK', 'FIXED_DEPOSIT', 'GOLD', 'PPF'].includes(i.type)).reduce((s, i) => s + i.current_value, 0),
  };

  // Liabilities Total
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.outstanding_amount, 0);
  const totalMonthlyEMI = liabilities.reduce((sum, l) => sum + l.monthly_emi, 0);

  // Insurance Protection Total
  const totalLifeCover = insurancePolicies.filter((p) => p.policy_type === 'LIFE').reduce((s, p) => s + p.sum_insured, 0);
  const totalHealthCover = insurancePolicies.filter((p) => p.policy_type === 'HEALTH').reduce((s, p) => s + p.sum_insured, 0);

  // Net Worth
  const netWorth = totalAssetValue - totalLiabilities;

  // Historical Growth Simulation
  const netWorthHistory = [
    { month: 'Apr 2026', assets: 56.4, liabilities: 22.0, netWorth: 34.4 },
    { month: 'May 2026', assets: 57.8, liabilities: 21.5, netWorth: 36.3 },
    { month: 'Jun 2026', assets: 59.2, liabilities: 21.0, netWorth: 38.2 },
    { month: 'Jul 2026', assets: 60.5, liabilities: 20.6, netWorth: 39.9 },
    { month: 'Aug 2026', assets: 61.9, liabilities: 20.2, netWorth: 41.7 },
    { month: 'Sep 2026', assets: 62.8, liabilities: 20.0, netWorth: 42.8 },
  ];

  res.json({
    netWorth,
    totalAssetValue,
    totalInvested,
    totalGainLoss,
    overallReturnPct,
    totalLiabilities,
    totalMonthlyEMI,
    protectionSummary: {
      totalLifeCover,
      totalHealthCover,
      activePoliciesCount: insurancePolicies.length,
    },
    assetAllocation,
    investments,
    insurancePolicies,
    liabilities,
    netWorthHistory,
  });
});

// Add New Investment Record
router.post('/:id/investments', requirePermission('INVESTMENT_EDIT'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const { title, type, institution, invested_amount, current_value, maturity_date, folio_number, nominee, notes } = req.body;

  const invested = Number(invested_amount) || 0;
  const current = Number(current_value) || invested;

  const newInvestment = {
    id: `inv_${Date.now()}`,
    family_id: familyId,
    user_id: req.user!.id,
    owner_name: req.user!.name,
    type: type || 'MUTUAL_FUND',
    title,
    institution: institution || '',
    invested_amount: invested,
    current_value: current,
    gain_loss: current - invested,
    maturity_date: maturity_date || '',
    folio_number: folio_number || '',
    nominee: nominee || '',
    notes: notes || '',
    updated_at: new Date().toISOString(),
  };

  db.insert('investments', newInvestment);
  logActivity(familyId, req.user!.id, req.user!.name, 'Added Investment', 'FINANCE', `Added ${title} (${type}) worth ₹${current}`);

  res.status(201).json(newInvestment);
});

// Add New Liability / Loan Record
router.post('/:id/liabilities', requirePermission('INVESTMENT_EDIT'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const { title, type, lender, total_loan, outstanding_amount, monthly_emi, interest_rate, end_date, owner_name } = req.body;

  const total = Number(total_loan) || Number(outstanding_amount) || 0;
  const outstanding = Number(outstanding_amount) || total;
  const emi = Number(monthly_emi) || 0;
  const rate = Number(interest_rate) || 8.5;

  const newLiability = {
    id: `lia_${Date.now()}`,
    family_id: familyId,
    owner_name: owner_name || req.user!.name,
    type: type || 'HOME_LOAN',
    title: title || 'Family Loan',
    lender: lender || '',
    total_loan: total,
    outstanding_amount: outstanding,
    monthly_emi: emi,
    interest_rate: rate,
    end_date: end_date || '',
    created_at: new Date().toISOString(),
  };

  db.insert('liabilities', newLiability);
  logActivity(familyId, req.user!.id, req.user!.name, 'Added Liability', 'FINANCE', `Added ${title} with outstanding ₹${outstanding}`);

  res.status(201).json(newLiability);
});

// Update Investment
router.put('/:id/investments/:invId', requirePermission('INVESTMENT_EDIT'), (req: AuthRequest, res) => {
  const { invId } = req.params;
  const familyId = req.params.id || req.familyId!;
  const { title, type, institution, invested_amount, current_value, maturity_date, folio_number, nominee, notes, owner_name } = req.body;

  const existing = db.findOne('investments', (i) => i.id === invId && i.family_id === familyId);
  if (!existing) {
    return res.status(404).json({ error: 'Investment not found' });
  }

  const invested = invested_amount !== undefined ? Number(invested_amount) : existing.invested_amount;
  const current = current_value !== undefined ? Number(current_value) : existing.current_value;

  const updated = db.update('investments', (i) => i.id === invId && i.family_id === familyId, {
    title: title ?? existing.title,
    type: type ?? existing.type,
    institution: institution ?? existing.institution,
    invested_amount: invested,
    current_value: current,
    gain_loss: current - invested,
    maturity_date: maturity_date ?? existing.maturity_date,
    folio_number: folio_number ?? existing.folio_number,
    nominee: nominee ?? existing.nominee,
    notes: notes ?? existing.notes,
    owner_name: owner_name ?? existing.owner_name,
    updated_at: new Date().toISOString(),
  });

  logActivity(familyId, req.user!.id, req.user!.name, 'Updated Investment', 'FINANCE', `Updated ${title || existing.title}`);
  res.json(updated[0] || existing);
});

// Delete Investment
router.delete('/:id/investments/:invId', requirePermission('INVESTMENT_EDIT'), (req: AuthRequest, res) => {
  const { invId } = req.params;
  const familyId = req.params.id || req.familyId!;

  const deleted = db.delete('investments', (i) => i.id === invId && i.family_id === familyId);
  if (deleted) {
    logActivity(familyId, req.user!.id, req.user!.name, 'Deleted Investment', 'FINANCE', `Removed investment ${invId}`);
  }
  res.json({ success: deleted });
});

// Delete Liability
router.delete('/:id/liabilities/:liaId', requirePermission('INVESTMENT_EDIT'), (req: AuthRequest, res) => {
  const { liaId } = req.params;
  const familyId = req.params.id || req.familyId!;

  const deleted = db.delete('liabilities', (l) => l.id === liaId && l.family_id === familyId);
  if (deleted) {
    logActivity(familyId, req.user!.id, req.user!.name, 'Deleted Liability', 'FINANCE', `Removed loan/liability ${liaId}`);
  }
  res.json({ success: deleted });
});

// Add Insurance Policy Record
router.post('/:id/insurance', requirePermission('INVESTMENT_EDIT'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const { policy_name, policy_type, provider, policy_number, sum_insured, premium_amount, renewal_date, covered_members } = req.body;

  const newPolicy = {
    id: `pol_${Date.now()}`,
    family_id: familyId,
    policy_name,
    policy_type: policy_type || 'HEALTH',
    provider: provider || '',
    policy_number: policy_number || '',
    sum_insured: Number(sum_insured) || 0,
    premium_amount: Number(premium_amount) || 0,
    renewal_date: renewal_date || '',
    covered_members: JSON.stringify(covered_members || [req.user!.name]),
    created_at: new Date().toISOString(),
  };

  db.insert('insurance_policies', newPolicy);
  logActivity(familyId, req.user!.id, req.user!.name, 'Added Insurance', 'FINANCE', `Added policy "${policy_name}"`);

  res.status(201).json(newPolicy);
});

export default router;

