import express from 'express';
import db from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { logActivity } from '../services/auditService.js';
import { getOrCreateExpenseCategories } from '../services/categoryService.js';

const router = express.Router();
router.use(authMiddleware);

// Get Monthly Budgets with actual spending & utilization percentage
router.get('/:id/budget', requirePermission('FINANCE_VIEW'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const monthYear = (req.query.month as string) || '2026-09';

  const budgets = db.find('budgets', (b) => b.family_id === familyId && b.month_year === monthYear);
  const expenses = db.find('expenses', (e) => e.family_id === familyId);

  // Compute spending per category (auto-initialized if empty)
  const categories = getOrCreateExpenseCategories(familyId);
  const budgetReports = categories.map((cat) => {
    const budget = budgets.find((b) => b.category_id === cat.id);
    const catExpenses = expenses.filter((e) => e.category_id === cat.id);
    const spent = catExpenses.reduce((sum, e) => sum + e.amount, 0);
    const limit = budget ? budget.monthly_limit : 0;
    const remaining = Math.max(0, limit - spent);
    const utilizationPct = limit > 0 ? Math.round((spent / limit) * 100) : 0;

    let alertStatus: 'NORMAL' | 'WARNING' | 'EXCEEDED' = 'NORMAL';
    if (utilizationPct > 100) alertStatus = 'EXCEEDED';
    else if (utilizationPct >= 80) alertStatus = 'WARNING';

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      icon: cat.icon,
      color: cat.color,
      limit,
      spent,
      remaining,
      utilizationPct,
      alertStatus,
      budgetId: budget ? budget.id : null,
    };
  });

  const totalBudget = budgetReports.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgetReports.reduce((sum, b) => sum + b.spent, 0);
  const overallUtilization = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  res.json({
    monthYear,
    totalBudget,
    totalSpent,
    totalRemaining: Math.max(0, totalBudget - totalSpent),
    overallUtilization,
    categories: budgetReports,
  });
});

// Update or Set Category Budget Limit
router.post('/:id/budget', requirePermission('FINANCE_EDIT'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const { category_id, category_name, monthly_limit, month_year } = req.body;
  const targetMonth = month_year || '2026-09';

  const existing = db.findOne(
    'budgets',
    (b) => b.family_id === familyId && b.category_id === category_id && b.month_year === targetMonth
  );

  let result;
  if (existing) {
    result = db.update('budgets', (b) => b.id === existing.id, {
      monthly_limit: Number(monthly_limit),
    });
  } else {
    result = db.insert('budgets', {
      id: `b_${Date.now()}`,
      family_id: familyId,
      category_id,
      category_name: category_name || 'Category',
      monthly_limit: Number(monthly_limit),
      month_year: targetMonth,
      created_at: new Date().toISOString(),
    });
  }

  logActivity(
    familyId,
    req.user!.id,
    req.user!.name,
    'Updated Budget',
    'FINANCE',
    `Set ${category_name || category_id} limit to ₹${monthly_limit}`
  );

  res.json(result);
});

export default router;
