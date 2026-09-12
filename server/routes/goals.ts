import express from 'express';
import db from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { logActivity } from '../services/auditService.js';

const router = express.Router();
router.use(authMiddleware);

// Get Goals
router.get('/:id/goals', (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const goals = db.find('goals', (g) => g.family_id === familyId);

  const enrichedGoals = goals.map((g) => {
    const target = g.target_amount;
    const current = g.current_amount;
    const progressPct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
    const shortfall = Math.max(0, target - current);
    const monthsRemaining = Math.ceil(shortfall / (g.monthly_contribution || 10000));

    return {
      ...g,
      progressPct,
      shortfall,
      monthsRemaining,
      isOnTrack: progressPct >= 50,
      contributorsList: typeof g.contributors === 'string' ? JSON.parse(g.contributors || '[]') : g.contributors,
    };
  });

  res.json(enrichedGoals);
});

// Create Goal
router.post('/:id/goals', requirePermission('FINANCE_EDIT'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const { title, category, target_amount, current_amount, monthly_contribution, target_date, priority, contributors } = req.body;

  const newGoal = {
    id: `goal_${Date.now()}`,
    family_id: familyId,
    title,
    category: category || 'OTHER',
    target_amount: Number(target_amount) || 0,
    current_amount: Number(current_amount) || 0,
    monthly_contribution: Number(monthly_contribution) || 5000,
    target_date: target_date || '2027-12-31',
    priority: priority || 'MEDIUM',
    status: 'IN_PROGRESS',
    contributors: JSON.stringify(contributors || [req.user!.name]),
    created_at: new Date().toISOString(),
  };

  db.insert('goals', newGoal);
  logActivity(familyId, req.user!.id, req.user!.name, 'Created Goal', 'FINANCE', `Created goal "${title}" targeting ₹${newGoal.target_amount}`);

  res.status(201).json(newGoal);
});

// Update Goal Progress / Contribution
router.patch('/:id/goals/:goalId', requirePermission('FINANCE_EDIT'), (req: AuthRequest, res) => {
  const { goalId } = req.params;
  const familyId = req.params.id || req.familyId!;
  const { current_amount, monthly_contribution, status } = req.body;

  const updated = db.update(
    'goals',
    (g) => g.id === goalId && g.family_id === familyId,
    {
      ...(current_amount !== undefined && { current_amount: Number(current_amount) }),
      ...(monthly_contribution !== undefined && { monthly_contribution: Number(monthly_contribution) }),
      ...(status && { status }),
    }
  );

  logActivity(familyId, req.user!.id, req.user!.name, 'Updated Goal', 'FINANCE', `Contributed to goal ${goalId}`);

  res.json(updated);
});

export default router;
