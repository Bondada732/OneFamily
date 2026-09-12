import express from 'express';
import db from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// Universal Cross-Module Search (Permission Enforced)
router.get('/universal', (req: AuthRequest, res) => {
  const familyId = req.familyId!;
  const user = req.user!;
  const q = ((req.query.q as string) || '').trim().toLowerCase();

  if (!q) {
    return res.json({ results: [] });
  }

  const hasFinance = user.role === 'FAMILY_HEAD' || user.permissions.includes('FINANCE_VIEW');
  const hasInvestments = user.role === 'FAMILY_HEAD' || user.permissions.includes('INVESTMENT_VIEW');
  const hasDocuments = user.role === 'FAMILY_HEAD' || user.permissions.includes('DOCUMENT_VIEW');
  const hasEmergency = user.role === 'FAMILY_HEAD' || user.permissions.includes('EMERGENCY_VIEW');

  const results: any[] = [];

  // 1. Members
  const members = db.find('users', (u) => u.family_id === familyId);
  members.forEach((m) => {
    if (m.name.toLowerCase().includes(q) || m.relationship.toLowerCase().includes(q) || m.role.toLowerCase().includes(q)) {
      results.push({
        type: 'MEMBER',
        title: m.name,
        subtitle: `${m.relationship} (${m.role})`,
        tab: 'family',
        id: m.id,
      });
    }
  });

  // 2. Documents (if authorized)
  if (hasDocuments) {
    const docs = db.find('documents', (d) => d.family_id === familyId);
    docs.forEach((d) => {
      if (
        d.title.toLowerCase().includes(q) ||
        d.document_number.toLowerCase().includes(q) ||
        (d.tags && d.tags.toLowerCase().includes(q)) ||
        d.owner_name.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'DOCUMENT',
          title: d.title,
          subtitle: `Vault Document • ${d.owner_name} • ${d.expiry_date ? `Exp: ${d.expiry_date}` : 'No Expiry'}`,
          tab: 'vault',
          id: d.id,
        });
      }
    });
  }

  // 3. Expenses (if authorized)
  if (hasFinance) {
    const expenses = db.find('expenses', (e) => e.family_id === familyId);
    expenses.forEach((e) => {
      if (
        e.merchant.toLowerCase().includes(q) ||
        e.category_name.toLowerCase().includes(q) ||
        (e.notes && e.notes.toLowerCase().includes(q))
      ) {
        results.push({
          type: 'EXPENSE',
          title: `${e.merchant} — ₹${e.amount.toLocaleString('en-IN')}`,
          subtitle: `${e.category_name} • Paid by ${e.paid_by_name} on ${e.date}`,
          tab: 'money',
          id: e.id,
        });
      }
    });
  }

  // 4. Goals (if authorized)
  if (hasFinance) {
    const goals = db.find('goals', (g) => g.family_id === familyId);
    goals.forEach((g) => {
      if (g.title.toLowerCase().includes(q) || g.category.toLowerCase().includes(q)) {
        results.push({
          type: 'GOAL',
          title: g.title,
          subtitle: `Goal Target: ₹${g.target_amount.toLocaleString('en-IN')} (Saved: ₹${g.current_amount.toLocaleString('en-IN')})`,
          tab: 'money',
          id: g.id,
        });
      }
    });
  }

  // 5. Tasks
  const tasks = db.find('tasks', (t) => t.family_id === familyId);
  tasks.forEach((t) => {
    if (t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.assigned_to_name.toLowerCase().includes(q)) {
      results.push({
        type: 'TASK',
        title: t.title,
        subtitle: `Task • Assigned to ${t.assigned_to_name} • Status: ${t.status}`,
        tab: 'family',
        id: t.id,
      });
    }
  });

  // 6. Calendar & Reminders
  const events = db.find('calendar_events', (e) => e.family_id === familyId);
  events.forEach((e) => {
    if (e.title.toLowerCase().includes(q) || e.type.toLowerCase().includes(q)) {
      results.push({
        type: 'CALENDAR',
        title: e.title,
        subtitle: `Event on ${e.start_date} (${e.type})`,
        tab: 'home',
        id: e.id,
      });
    }
  });

  // 7. Memories
  const memories = db.find('memories', (m) => m.family_id === familyId);
  memories.forEach((m) => {
    if (m.title.toLowerCase().includes(q) || m.album.toLowerCase().includes(q) || m.location.toLowerCase().includes(q)) {
      results.push({
        type: 'MEMORY',
        title: m.title,
        subtitle: `Memory Album: ${m.album} • ${m.location}`,
        tab: 'memories',
        id: m.id,
      });
    }
  });

  // 8. Emergency Contacts (if authorized)
  if (hasEmergency) {
    const emergencyContacts = db.find('emergency_contacts', (c) => c.family_id === familyId);
    emergencyContacts.forEach((c) => {
      if (c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q) || c.relationship.toLowerCase().includes(q)) {
        results.push({
          type: 'EMERGENCY',
          title: `🚨 ${c.name}`,
          subtitle: `${c.relationship} • Phone: ${c.phone}`,
          tab: 'family',
          id: c.id,
        });
      }
    });
  }

  res.json({
    query: q,
    count: results.length,
    results,
  });
});

// Notifications List
router.get('/notifications', (req: AuthRequest, res) => {
  const familyId = req.familyId!;
  const notifs = db.find('notifications', (n) => n.family_id === familyId);
  res.json(notifs);
});

// Mark Notification as Read
router.patch('/notifications/:notifId/read', (req: AuthRequest, res) => {
  const { notifId } = req.params;
  const updated = db.update('notifications', (n) => n.id === notifId, { is_read: true });
  res.json(updated);
});

// Audit Logs
router.get('/audit-logs', (req: AuthRequest, res) => {
  const familyId = req.familyId!;
  const logs = db.find('audit_logs', (l) => l.family_id === familyId);
  res.json(logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
});

export default router;
