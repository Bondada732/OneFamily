import express from 'express';
import db from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { extractReceiptData } from '../services/ocrService.js';
import { logActivity } from '../services/auditService.js';
import { getOrCreateExpenseCategories, addExpenseCategory, deleteExpenseCategory } from '../services/categoryService.js';

const router = express.Router();
router.use(authMiddleware);

// Get All Expenses & Categories
router.get('/:id/expenses', requirePermission('FINANCE_VIEW'), async (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;

  const expenses = db.find('expenses', (e) => e.family_id === familyId);
  const categories = getOrCreateExpenseCategories(familyId);

  res.json({
    expenses: expenses.sort((a, b) => {
      const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (diff !== 0) return diff;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    }),
    categories,
    totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
  });
});

// Get Categories
router.get('/:id/categories', requirePermission('FINANCE_VIEW'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const categories = getOrCreateExpenseCategories(familyId);
  res.json({ categories });
});

// Add Custom Category
router.post('/:id/categories', requirePermission('FINANCE_EDIT'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const { name, icon, color } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  // Ensure default categories exist first
  getOrCreateExpenseCategories(familyId);

  const newCat = addExpenseCategory(familyId, name.trim(), icon, color);
  logActivity(familyId, req.user!.id, req.user!.name, 'Created Category', 'FINANCE', `Added custom expense category "${newCat.name}"`);

  res.status(201).json(newCat);
});

// Delete Category
router.delete('/:id/categories/:catId', requirePermission('FINANCE_EDIT'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const { catId } = req.params;

  const deleted = deleteExpenseCategory(familyId, catId);
  if (deleted) {
    logActivity(familyId, req.user!.id, req.user!.name, 'Deleted Category', 'FINANCE', `Removed category ${catId}`);
  }

  res.json({ success: deleted });
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

// Update Expense
router.patch('/:id/expenses/:expenseId', requirePermission('FINANCE_EDIT'), (req: AuthRequest, res) => {
  const { expenseId } = req.params;
  const familyId = req.params.id || req.familyId!;
  const { category_id, category_name, amount, payment_method, merchant, notes, location, receipt_url, split_type, date } = req.body;

  const existing = db.findOne('expenses', (e) => e.id === expenseId && e.family_id === familyId);
  if (!existing) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  const updated = db.update('expenses', (e) => e.id === expenseId && e.family_id === familyId, {
    category_id: category_id !== undefined ? category_id : existing.category_id,
    category_name: category_name !== undefined ? category_name : existing.category_name,
    amount: amount !== undefined ? Number(amount) : existing.amount,
    payment_method: payment_method !== undefined ? payment_method : existing.payment_method,
    merchant: merchant !== undefined ? merchant : existing.merchant,
    notes: notes !== undefined ? notes : existing.notes,
    location: location !== undefined ? location : existing.location,
    receipt_url: receipt_url !== undefined ? receipt_url : existing.receipt_url,
    split_type: split_type !== undefined ? split_type : existing.split_type,
    date: date !== undefined ? date : existing.date,
    updated_at: new Date().toISOString(),
  });

  logActivity(familyId, req.user!.id, req.user!.name, 'Updated Expense', 'FINANCE', `Updated expense: ₹${amount || existing.amount} for ${category_name || existing.category_name} (${merchant || existing.merchant})`);

  res.json(updated[0] || existing);
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

