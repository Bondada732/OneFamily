import express from 'express';
import db from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { logActivity } from '../services/auditService.js';

const router = express.Router();
router.use(authMiddleware);

// Get Shared Calendar Events & Reminders
router.get('/:id/calendar', (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const events = db.find('calendar_events', (e) => e.family_id === familyId);
  const reminders = db.find('reminders', (r) => r.family_id === familyId);

  res.json({
    events: events.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()),
    reminders: reminders.filter((r) => !r.is_dismissed),
  });
});

// Add Calendar Event
router.post('/:id/calendar', requirePermission('CALENDAR_EDIT'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const { title, type, start_date, end_date, is_all_day, assigned_member_id, assigned_member_name, is_recurring, visibility, notes } = req.body;

  const newEvent = {
    id: `evt_${Date.now()}`,
    family_id: familyId,
    created_by_id: req.user!.id,
    title,
    type: type || 'FUNCTION',
    start_date,
    end_date: end_date || start_date,
    is_all_day: is_all_day !== false,
    assigned_member_id: assigned_member_id || null,
    assigned_member_name: assigned_member_name || req.user!.name,
    is_recurring: Boolean(is_recurring),
    visibility: visibility || 'FAMILY',
    notes: notes || '',
    created_at: new Date().toISOString(),
  };

  db.insert('calendar_events', newEvent);
  logActivity(familyId, req.user!.id, req.user!.name, 'Created Calendar Event', 'TASK', `Added event "${title}" on ${start_date}`);

  res.status(201).json(newEvent);
});

// Add / Dismiss Smart Reminder
router.post('/:id/reminders', (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const { title, due_date, category, lead_days } = req.body;

  const newReminder = {
    id: `rem_${Date.now()}`,
    family_id: familyId,
    title,
    due_date,
    category: category || 'GENERAL',
    lead_days: lead_days || 3,
    is_dismissed: false,
    created_at: new Date().toISOString(),
  };

  db.insert('reminders', newReminder);
  res.status(201).json(newReminder);
});

router.patch('/:id/reminders/:remId/dismiss', (req: AuthRequest, res) => {
  const { remId } = req.params;
  const updated = db.update('reminders', (r) => r.id === remId, { is_dismissed: true });
  res.json({ success: true, reminder: updated });
});

export default router;
