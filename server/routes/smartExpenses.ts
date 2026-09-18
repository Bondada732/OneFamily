import express from 'express';
import db from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { logActivity } from '../services/auditService.js';

const router = express.Router();
router.use(authMiddleware);

// 1. Get Pending Detected Transactions
router.get('/:id/pending', requirePermission('FINANCE_VIEW'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const userId = req.user!.id;

  const items = db.find('detected_transactions', (t) => {
    if (t.family_id !== familyId) return false;
    // Check visibility (Private to user or shared)
    if (t.visibility === 'PRIVATE' && t.user_id !== userId && req.user!.role !== 'FAMILY_HEAD') {
      return false;
    }
    return t.status === 'PENDING_REVIEW' || t.status === 'DETECTED';
  });

  res.json({
    pending: items.sort((a, b) => new Date(b.transaction_datetime || b.created_at).getTime() - new Date(a.transaction_datetime || a.created_at).getTime()),
    count: items.length,
    totalAmount: items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
  });
});

// 2. Get All Detected Transactions (Grouped by tab)
router.get('/:id/all', requirePermission('FINANCE_VIEW'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const userId = req.user!.id;

  const all = db.find('detected_transactions', (t) => {
    if (t.family_id !== familyId) return false;
    if (t.visibility === 'PRIVATE' && t.user_id !== userId && req.user!.role !== 'FAMILY_HEAD') {
      return false;
    }
    return true;
  });

  const pending = all.filter((t) => t.status === 'PENDING_REVIEW' || t.status === 'DETECTED');
  const confirmed = all.filter((t) => t.status === 'CONFIRMED' || t.status === 'EDITED_CONFIRMED');
  const ignored = all.filter((t) => t.status === 'IGNORED' || t.status === 'REJECTED');

  res.json({
    pending: pending.sort((a, b) => new Date(b.transaction_datetime || b.created_at).getTime() - new Date(a.transaction_datetime || a.created_at).getTime()),
    confirmed: confirmed.sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()),
    ignored: ignored.sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()),
    summary: {
      pendingCount: pending.length,
      pendingTotal: pending.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
      confirmedCount: confirmed.length,
    },
  });
});

// 3. Ingest Batch of Detected Transactions from Client
router.post('/:id/detected', requirePermission('FINANCE_EDIT'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const userId = req.user!.id;
  const { transactions } = req.body;

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return res.status(400).json({ error: 'transactions array is required' });
  }

  const saved: any[] = [];
  const duplicates: any[] = [];

  for (const t of transactions) {
    // Duplicate check 1: Exact source hash
    if (t.source_hash) {
      const existingHash = db.findOne('detected_transactions', (dt) => dt.family_id === familyId && dt.source_hash === t.source_hash);
      if (existingHash) {
        duplicates.push({ source_hash: t.source_hash, reason: 'HASH_EXISTS' });
        continue;
      }
    }

    // Duplicate check 2: Reference number
    if (t.transaction_reference) {
      const existingRef = db.findOne('detected_transactions', (dt) => dt.family_id === familyId && dt.transaction_reference === t.transaction_reference);
      if (existingRef) {
        duplicates.push({ reference: t.transaction_reference, reason: 'REFERENCE_EXISTS' });
        continue;
      }
    }

    // Duplicate check 3: Same amount + merchant within 5 minutes
    const tTime = new Date(t.transaction_datetime || Date.now()).getTime();
    const existingTimeMatch = db.findOne('detected_transactions', (dt) => {
      if (dt.family_id !== familyId) return false;
      if (dt.amount !== t.amount) return false;
      if ((dt.merchant_normalized || '').toLowerCase() !== (t.merchant_normalized || '').toLowerCase()) return false;
      const existingTime = new Date(dt.transaction_datetime || dt.created_at).getTime();
      return Math.abs(existingTime - tTime) <= 5 * 60 * 1000;
    });

    if (existingTimeMatch) {
      duplicates.push({ reason: 'TIME_AMOUNT_MERCHANT_MATCH' });
      continue;
    }

    const locObj = t.location || null;
    const newRecord = {
      id: t.id || `dt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      family_id: familyId,
      source_type: t.source_type || 'SMS',
      source_hash: t.source_hash || '',
      transaction_type: t.transaction_type || 'UPI',
      direction: t.direction || 'DEBIT',
      amount: Number(t.amount) || 0,
      currency: t.currency || 'INR',
      merchant_raw: t.merchant_raw || '',
      merchant_normalized: t.merchant_normalized || t.merchant_raw || 'Unknown Merchant',
      upi_id: t.upi_id || '',
      bank_name: t.bank_name || '',
      account_last4: t.account_last4 || '',
      transaction_reference: t.transaction_reference || '',
      transaction_datetime: t.transaction_datetime || new Date().toISOString(),
      sms_received_datetime: t.sms_received_datetime || new Date().toISOString(),
      category_suggested: t.category_suggested || 'Miscellaneous',
      category_confidence: typeof t.category_confidence === 'number' ? t.category_confidence : 0.85,
      status: 'PENDING_REVIEW',
      duplicate_of: null,
      visibility: t.visibility || 'PRIVATE',
      location: locObj,
      location_latitude: locObj?.latitude ?? t.location_latitude ?? null,
      location_longitude: locObj?.longitude ?? t.location_longitude ?? null,
      location_accuracy_meters: locObj?.accuracyMeters ?? t.location_accuracy_meters ?? null,
      location_captured_at: locObj?.capturedAt ?? t.location_captured_at ?? null,
      location_source: locObj?.source ?? t.location_source ?? 'NONE',
      location_confidence: locObj?.confidence ?? t.location_confidence ?? 'NONE',
      location_status: locObj?.status ?? t.location_status ?? 'NOT_CAPTURED',
      location_label: locObj?.locationLabel ?? t.location_label ?? '',
      location_match_timestamp_type: locObj?.matchTimestampType ?? t.location_match_timestamp_type ?? 'NONE',
      location_time_difference_seconds: locObj?.timeDifferenceSeconds ?? t.location_time_difference_seconds ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.insert('detected_transactions', newRecord);
    saved.push(newRecord);
  }

  res.status(201).json({
    message: `Ingested ${saved.length} detected transactions (${duplicates.length} duplicates skipped)`,
    ingestedCount: saved.length,
    duplicatesCount: duplicates.length,
    saved,
  });
});

// 4. Confirm a Single Transaction -> Convert to Real Ledger Expense
router.post('/:id/confirm/:transactionId', requirePermission('FINANCE_EDIT'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const { transactionId } = req.params;
  const {
    category_name,
    category_id,
    amount,
    merchant,
    date,
    notes,
    savePreference,
    visibility,
  } = req.body;

  const dt = db.findOne('detected_transactions', (t) => t.id === transactionId && t.family_id === familyId);
  if (!dt) {
    return res.status(404).json({ error: 'Detected transaction not found' });
  }

  const finalAmount = amount !== undefined ? Number(amount) : Number(dt.amount);
  const finalMerchant = merchant || dt.merchant_normalized || dt.merchant_raw || 'Merchant';
  const finalCategoryName = category_name || dt.category_suggested || 'Miscellaneous';
  const finalDate = date || (dt.transaction_datetime ? dt.transaction_datetime.split('T')[0] : new Date().toISOString().split('T')[0]);

  const finalLocation = req.body.location !== undefined ? req.body.location : (dt.location?.locationLabel || dt.location_label || '');

  // Create real expense in Ledger
  const newExpense = {
    id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    family_id: familyId,
    user_id: req.user!.id,
    paid_by_name: req.user!.name.split(' ')[0],
    category_id: category_id || 'cat_misc',
    category_name: finalCategoryName,
    amount: finalAmount,
    currency: dt.currency || 'INR',
    date: finalDate,
    payment_method: dt.transaction_type === 'UPI' ? 'UPI' : 'Bank Transfer',
    merchant: finalMerchant,
    notes: notes || `Auto-captured via ${dt.source_type}${dt.transaction_reference ? ` (Ref: ${dt.transaction_reference})` : ''}`,
    location: finalLocation,
    receipt_url: '',
    split_type: 'EQUAL',
    detected_transaction_id: dt.id,
    visibility: visibility || 'FAMILY_SHARED',
    created_at: new Date().toISOString(),
  };

  db.insert('expenses', newExpense);

  // Update detected transaction status
  const isEdited = finalAmount !== Number(dt.amount) || finalCategoryName !== dt.category_suggested || finalMerchant !== dt.merchant_normalized;
  db.update('detected_transactions', (t) => t.id === transactionId, {
    status: isEdited ? 'EDITED_CONFIRMED' : 'CONFIRMED',
    category_suggested: finalCategoryName,
    merchant_normalized: finalMerchant,
    amount: finalAmount,
    location_label: finalLocation,
    updated_at: new Date().toISOString(),
  });

  // Learn user merchant category preference if requested
  if (savePreference && finalMerchant && finalCategoryName) {
    const existingPref = db.findOne('merchant_preferences', (p) => p.user_id === req.user!.id && p.merchant.toLowerCase() === finalMerchant.toLowerCase());
    if (existingPref) {
      db.update('merchant_preferences', (p) => p.id === existingPref.id, {
        preferred_category: finalCategoryName,
        updated_at: new Date().toISOString(),
      });
    } else {
      db.insert('merchant_preferences', {
        id: `mpref_${Date.now()}`,
        user_id: req.user!.id,
        merchant: finalMerchant,
        preferred_category: finalCategoryName,
        created_at: new Date().toISOString(),
      });
    }
  }

  logActivity(familyId, req.user!.id, req.user!.name, 'Confirmed Smart Expense', 'FINANCE', `Approved smart expense ₹${finalAmount} for ${finalMerchant} (${finalCategoryName})${finalLocation ? ` at ${finalLocation}` : ''}`);

  res.json({
    success: true,
    expense: newExpense,
    detectedTransactionId: dt.id,
  });
});

// 5. Bulk Confirm Multiple Transactions
router.post('/:id/bulk-confirm', requirePermission('FINANCE_EDIT'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const { transactionIds } = req.body;

  let candidates: any[] = [];
  if (Array.isArray(transactionIds) && transactionIds.length > 0) {
    candidates = db.find('detected_transactions', (t) => t.family_id === familyId && transactionIds.includes(t.id) && (t.status === 'PENDING_REVIEW' || t.status === 'DETECTED'));
  } else {
    // Confirm all high confidence items (>= 0.80)
    candidates = db.find('detected_transactions', (t) => t.family_id === familyId && (t.status === 'PENDING_REVIEW' || t.status === 'DETECTED') && (t.category_confidence || 0) >= 0.80);
  }

  const createdExpenses: any[] = [];

  for (const dt of candidates) {
    const newExpense = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      family_id: familyId,
      user_id: req.user!.id,
      paid_by_name: req.user!.name.split(' ')[0],
      category_id: 'cat_misc',
      category_name: dt.category_suggested || 'Miscellaneous',
      amount: Number(dt.amount) || 0,
      currency: dt.currency || 'INR',
      date: dt.transaction_datetime ? dt.transaction_datetime.split('T')[0] : new Date().toISOString().split('T')[0],
      payment_method: dt.transaction_type === 'UPI' ? 'UPI' : 'Bank Transfer',
      merchant: dt.merchant_normalized || dt.merchant_raw || 'Merchant',
      notes: `Auto-captured via ${dt.source_type}`,
      location: dt.location?.locationLabel || dt.location_label || '',
      receipt_url: '',
      split_type: 'EQUAL',
      detected_transaction_id: dt.id,
      visibility: 'FAMILY_SHARED',
      created_at: new Date().toISOString(),
    };

    db.insert('expenses', newExpense);
    db.update('detected_transactions', (t) => t.id === dt.id, {
      status: 'CONFIRMED',
      updated_at: new Date().toISOString(),
    });
    createdExpenses.push(newExpense);
  }

  if (createdExpenses.length > 0) {
    logActivity(familyId, req.user!.id, req.user!.name, 'Bulk Confirmed Expenses', 'FINANCE', `Approved ${createdExpenses.length} smart expenses in batch.`);
  }

  res.json({
    success: true,
    confirmedCount: createdExpenses.length,
    expenses: createdExpenses,
  });
});

// 6. Delete / Remove Location from a Detected Transaction
router.delete('/:id/detected/:transactionId/location', requirePermission('FINANCE_EDIT'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const { transactionId } = req.params;

  const dt = db.findOne('detected_transactions', (t) => t.id === transactionId && t.family_id === familyId);
  if (!dt) {
    return res.status(404).json({ error: 'Detected transaction not found' });
  }

  db.update('detected_transactions', (t) => t.id === transactionId, {
    location: null,
    location_latitude: null,
    location_longitude: null,
    location_accuracy_meters: null,
    location_captured_at: null,
    location_source: 'NONE',
    location_confidence: 'NONE',
    location_status: 'NOT_CAPTURED',
    location_label: '',
    location_match_timestamp_type: 'NONE',
    location_time_difference_seconds: null,
    updated_at: new Date().toISOString(),
  });

  res.json({ success: true, message: 'Location removed from detected transaction' });
});

// 7. Ignore a Detected Transaction
router.post('/:id/ignore/:transactionId', requirePermission('FINANCE_EDIT'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const { transactionId } = req.params;

  const dt = db.findOne('detected_transactions', (t) => t.id === transactionId && t.family_id === familyId);
  if (!dt) {
    return res.status(404).json({ error: 'Detected transaction not found' });
  }

  db.update('detected_transactions', (t) => t.id === transactionId, {
    status: 'IGNORED',
    updated_at: new Date().toISOString(),
  });

  res.json({ success: true, message: 'Transaction ignored' });
});

// 7. Edit Draft Fields on Detected Transaction
router.patch('/:id/:transactionId', requirePermission('FINANCE_EDIT'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const { transactionId } = req.params;
  const updates = req.body;

  const dt = db.findOne('detected_transactions', (t) => t.id === transactionId && t.family_id === familyId);
  if (!dt) {
    return res.status(404).json({ error: 'Detected transaction not found' });
  }

  db.update('detected_transactions', (t) => t.id === transactionId, {
    ...updates,
    updated_at: new Date().toISOString(),
  });

  res.json({ success: true, transaction: { ...dt, ...updates } });
});

// 8. Get Smart Capture Settings
router.get('/:id/settings', (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const settings = db.findOne('smart_capture_settings', (s) => s.user_id === userId) || {
    user_id: userId,
    enabled: false,
    sms_enabled: false,
    notification_enabled: false,
    auto_categorization: true,
    daily_review: true,
    notification_mode: 'BATCH',
    privacy_mode: false,
    historical_scan_days: 7,
    location_capture_enabled: false,
    location_precision: 'APPROXIMATE',
    location_retention_hours: 72,
    show_location_on_expenses: true,
  };

  res.json({ settings });
});

// 9. Update Smart Capture Settings
router.put('/:id/settings', (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const newSettings = req.body;

  const existing = db.findOne('smart_capture_settings', (s) => s.user_id === userId);
  if (existing) {
    db.update('smart_capture_settings', (s) => s.user_id === userId, {
      ...newSettings,
      updated_at: new Date().toISOString(),
    });
  } else {
    db.insert('smart_capture_settings', {
      user_id: userId,
      enabled: false,
      sms_enabled: false,
      notification_enabled: false,
      auto_categorization: true,
      daily_review: true,
      notification_mode: 'BATCH',
      privacy_mode: false,
      historical_scan_days: 7,
      location_capture_enabled: false,
      location_precision: 'APPROXIMATE',
      location_retention_hours: 72,
      show_location_on_expenses: true,
      ...newSettings,
      created_at: new Date().toISOString(),
    });
  }

  res.json({ success: true, settings: newSettings });
});

// 10. Save / Update Merchant Category Preference
router.post('/:id/preferences', (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { merchant, preferred_category } = req.body;

  if (!merchant || !preferred_category) {
    return res.status(400).json({ error: 'merchant and preferred_category are required' });
  }

  const existing = db.findOne('merchant_preferences', (p) => p.user_id === userId && p.merchant.toLowerCase() === merchant.toLowerCase());
  if (existing) {
    db.update('merchant_preferences', (p) => p.id === existing.id, {
      preferred_category,
      updated_at: new Date().toISOString(),
    });
  } else {
    db.insert('merchant_preferences', {
      id: `mpref_${Date.now()}`,
      user_id: userId,
      merchant,
      preferred_category,
      created_at: new Date().toISOString(),
    });
  }

  res.json({ success: true, message: `Preference saved: ${merchant} -> ${preferred_category}` });
});

export default router;
