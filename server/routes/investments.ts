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

export default router;
