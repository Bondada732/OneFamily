import express from 'express';
import db from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { extractReceiptData } from '../services/ocrService.js';
import { logActivity } from '../services/auditService.js';

const router = express.Router();
router.use(authMiddleware);

// Get All Expenses
router.get('/:id/expenses', requirePermission('FINANCE_VIEW'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const expenses = db.find('expenses', (e) => e.family_id === familyId);
  const categories = db.find('expense_categories', (c) => c.family_id === familyId);

  res.json({
    expenses: expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    categories,
    totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
  });
});

// Add New Expense
router.post('/:id/expenses', requirePermission('FINANCE_EDIT'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const { category_id, category_name, amount, payment_method, merchant, notes, location, receipt_url, split_type, date } = req.body;

  const newExpense = {
    id: `exp_${Date.now()}`,
    family_id: familyId,
    user_id: req.user!.id,
    paid_by_name: req.user!.name.split(' ')[0],
    category_id: category_id || 'cat_misc',
    category_name: category_name || 'Miscellaneous',
    amount: Number(amount) || 0,
    currency: 'INR',
    date: date || new Date().toISOString().split('T')[0],
    payment_method: payment_method || 'UPI',
    merchant: merchant || 'Local Merchant',
    notes: notes || '',
    location: location || '',
    receipt_url: receipt_url || '',
    split_type: split_type || 'EQUAL',
    created_at: new Date().toISOString(),
  };

  db.insert('expenses', newExpense);
  logActivity(familyId, req.user!.id, req.user!.name, 'Recorded Expense', 'FINANCE', `Added ₹${newExpense.amount} for ${newExpense.category_name} (${newExpense.merchant})`);

  res.status(201).json(newExpense);
});

// Scan Receipt (OCR Intelligence Simulation)
router.post('/:id/expenses/scan-receipt', requirePermission('FINANCE_EDIT'), (req: AuthRequest, res) => {
  const { fileName } = req.body;
  const extracted = extractReceiptData(fileName || 'grocery_receipt.jpg');

  res.json({
    extracted,
    message: 'Receipt parsed successfully. Please verify information before confirming.',
  });
});

// Delete Expense
router.delete('/:id/expenses/:expenseId', requirePermission('FINANCE_EDIT'), (req: AuthRequest, res) => {
  const { expenseId } = req.params;
  const familyId = req.params.id || req.familyId!;

  const deleted = db.delete('expenses', (e) => e.id === expenseId && e.family_id === familyId);
  if (deleted) {
    logActivity(familyId, req.user!.id, req.user!.name, 'Deleted Expense', 'FINANCE', `Deleted expense record ${expenseId}`);
  }

  res.json({ success: deleted });
});

export default router;
