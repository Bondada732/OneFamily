import express from 'express';
import db from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { logActivity } from '../services/auditService.js';

const router = express.Router();
router.use(authMiddleware);

// Get All Tasks, Grocery, Maintenance
router.get('/:id/tasks', (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const tasks = db.find('tasks', (t) => t.family_id === familyId);
  const groceryItems = db.find('grocery_items', (g) => g.family_id === familyId);
  const maintenanceItems = db.find('maintenance_items', (m) => m.family_id === familyId);

  res.json({
    tasks: tasks.sort((a, b) => (a.status === 'COMPLETED' ? 1 : -1)),
    groceryItems,
    maintenanceItems,
  });
});

// Add Task
router.post('/:id/tasks', requirePermission('TASK_EDIT'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const { title, category, priority, assigned_to_id, assigned_to_name, due_date, is_recurring } = req.body;

  const newTask = {
    id: `tsk_${Date.now()}`,
    family_id: familyId,
    title,
    category: category || 'CHORE',
    priority: priority || 'MEDIUM',
    status: 'PENDING',
    assigned_to_id: assigned_to_id || null,
    assigned_to_name: assigned_to_name || 'All Family',
    due_date: due_date || new Date().toISOString().split('T')[0],
    is_recurring: Boolean(is_recurring),
    created_at: new Date().toISOString(),
  };

  db.insert('tasks', newTask);
  logActivity(familyId, req.user!.id, req.user!.name, 'Created Task', 'TASK', `Added task "${title}"`);

  res.status(201).json(newTask);
});

// Toggle Task Completion
router.patch('/:id/tasks/:taskId/toggle', requirePermission('TASK_EDIT'), (req: AuthRequest, res) => {
  const { taskId } = req.params;
  const task = db.findOne('tasks', (t) => t.id === taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
  const updated = db.update('tasks', (t) => t.id === taskId, {
    status: newStatus,
    completed_at: newStatus === 'COMPLETED' ? new Date().toISOString() : null,
  });

  res.json(updated);
});

// Update Task
router.patch('/:id/tasks/:taskId', requirePermission('TASK_EDIT'), (req: AuthRequest, res) => {
  const { taskId } = req.params;
  const familyId = req.params.id || req.familyId!;
  const { title, category, priority, assigned_to_id, assigned_to_name, due_date, is_recurring, status } = req.body;

  const existing = db.findOne('tasks', (t) => t.id === taskId && t.family_id === familyId);
  if (!existing) return res.status(404).json({ error: 'Task not found' });

  const updated = db.update('tasks', (t) => t.id === taskId && t.family_id === familyId, {
    title: title ?? existing.title,
    category: category ?? existing.category,
    priority: priority ?? existing.priority,
    assigned_to_id: assigned_to_id !== undefined ? assigned_to_id : existing.assigned_to_id,
    assigned_to_name: assigned_to_name ?? existing.assigned_to_name,
    due_date: due_date ?? existing.due_date,
    is_recurring: is_recurring !== undefined ? Boolean(is_recurring) : existing.is_recurring,
    status: status ?? existing.status,
    updated_at: new Date().toISOString(),
  });

  logActivity(familyId, req.user!.id, req.user!.name, 'Updated Task', 'TASK', `Updated task "${title || existing.title}"`);
  res.json(updated[0] || existing);
});

// Delete Task
router.delete('/:id/tasks/:taskId', requirePermission('TASK_EDIT'), (req: AuthRequest, res) => {
  const { taskId } = req.params;
  const familyId = req.params.id || req.familyId!;

  const existing = db.findOne('tasks', (t) => t.id === taskId && t.family_id === familyId);
  if (!existing) return res.status(404).json({ error: 'Task not found' });

  const deleted = db.delete('tasks', (t) => t.id === taskId && t.family_id === familyId);
  if (deleted) {
    logActivity(familyId, req.user!.id, req.user!.name, 'Deleted Task', 'TASK', `Deleted task "${existing.title}"`);
  }
  res.json({ success: deleted });
});

// Grocery / Wishlist: Add Item
router.post('/:id/grocery', requirePermission('TASK_EDIT'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const { item_name, quantity, category, estimated_cost, notes } = req.body;

  const newItem = {
    id: `g_${Date.now()}`,
    family_id: familyId,
    item_name,
    quantity: quantity || '1 unit',
    category: category || 'WISH',
    estimated_cost: Number(estimated_cost) || 0,
    notes: notes || '',
    is_purchased: false,
    added_by_name: req.user!.name.split(' ')[0],
    created_at: new Date().toISOString(),
  };

  db.insert('grocery_items', newItem);
  res.status(201).json(newItem);
});

// Grocery / Wishlist: Update Item
router.patch('/:id/grocery/:itemId', requirePermission('TASK_EDIT'), (req: AuthRequest, res) => {
  const { itemId } = req.params;
  const familyId = req.params.id || req.familyId!;
  const { item_name, quantity, category, estimated_cost, notes, is_purchased } = req.body;

  const existing = db.findOne('grocery_items', (g) => g.id === itemId && g.family_id === familyId);
  if (!existing) return res.status(404).json({ error: 'Wish list item not found' });

  const updated = db.update('grocery_items', (g) => g.id === itemId && g.family_id === familyId, {
    item_name: item_name ?? existing.item_name,
    quantity: quantity ?? existing.quantity,
    category: category ?? existing.category,
    estimated_cost: estimated_cost !== undefined ? Number(estimated_cost) : existing.estimated_cost,
    notes: notes ?? existing.notes,
    is_purchased: is_purchased !== undefined ? Boolean(is_purchased) : existing.is_purchased,
    updated_at: new Date().toISOString(),
  });

  logActivity(familyId, req.user!.id, req.user!.name, 'Updated Wishlist Item', 'TASK', `Updated "${item_name || existing.item_name}"`);
  res.json(updated[0] || existing);
});

// Grocery / Wishlist: Toggle Item
router.patch('/:id/grocery/:itemId/toggle', requirePermission('TASK_EDIT'), (req: AuthRequest, res) => {
  const { itemId } = req.params;
  const item = db.findOne('grocery_items', (g) => g.id === itemId);
  if (!item) return res.status(404).json({ error: 'Wish list item not found' });

  const updated = db.update('grocery_items', (g) => g.id === itemId, {
    is_purchased: !item.is_purchased,
  });

  res.json(updated);
});

// Grocery / Wishlist: Delete Item
router.delete('/:id/grocery/:itemId', requirePermission('TASK_EDIT'), (req: AuthRequest, res) => {
  const { itemId } = req.params;
  const familyId = req.params.id || req.familyId!;

  const existing = db.findOne('grocery_items', (g) => g.id === itemId && g.family_id === familyId);
  const deleted = db.delete('grocery_items', (g) => g.id === itemId && g.family_id === familyId);
  if (deleted && existing) {
    logActivity(familyId, req.user!.id, req.user!.name, 'Deleted Wishlist Item', 'TASK', `Deleted "${existing.item_name}"`);
  }
  res.json({ success: deleted });
});

// Household Maintenance: Add / Service update
router.post('/:id/maintenance', requirePermission('TASK_EDIT'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const { item_name, service_type, last_service_date, next_service_due, service_provider, contact_phone, recurring_interval_months, notes } = req.body;

  const newItem = {
    id: `maint_${Date.now()}`,
    family_id: familyId,
    item_name,
    service_type: service_type || 'APPLIANCE',
    last_service_date: last_service_date || new Date().toISOString().split('T')[0],
    next_service_due: next_service_due || '',
    service_provider: service_provider || '',
    contact_phone: contact_phone || '',
    recurring_interval_months: Number(recurring_interval_months) || 6,
    notes: notes || '',
  };

  db.insert('maintenance_items', newItem);
  res.status(201).json(newItem);
});

// Household Maintenance: Update Item
router.patch('/:id/maintenance/:maintId', requirePermission('TASK_EDIT'), (req: AuthRequest, res) => {
  const { maintId } = req.params;
  const familyId = req.params.id || req.familyId!;
  const { item_name, service_type, last_service_date, next_service_due, service_provider, contact_phone, recurring_interval_months, notes } = req.body;

  const existing = db.findOne('maintenance_items', (m) => m.id === maintId && m.family_id === familyId);
  if (!existing) return res.status(404).json({ error: 'Maintenance item not found' });

  const updated = db.update('maintenance_items', (m) => m.id === maintId && m.family_id === familyId, {
    item_name: item_name ?? existing.item_name,
    service_type: service_type ?? existing.service_type,
    last_service_date: last_service_date ?? existing.last_service_date,
    next_service_due: next_service_due ?? existing.next_service_due,
    service_provider: service_provider ?? existing.service_provider,
    contact_phone: contact_phone ?? existing.contact_phone,
    recurring_interval_months: recurring_interval_months !== undefined ? Number(recurring_interval_months) : existing.recurring_interval_months,
    notes: notes ?? existing.notes,
    updated_at: new Date().toISOString(),
  });

  logActivity(familyId, req.user!.id, req.user!.name, 'Updated Maintenance Item', 'TASK', `Updated appliance "${item_name || existing.item_name}"`);
  res.json(updated[0] || existing);
});

// Household Maintenance: Delete Item
router.delete('/:id/maintenance/:maintId', requirePermission('TASK_EDIT'), (req: AuthRequest, res) => {
  const { maintId } = req.params;
  const familyId = req.params.id || req.familyId!;

  const existing = db.findOne('maintenance_items', (m) => m.id === maintId && m.family_id === familyId);
  const deleted = db.delete('maintenance_items', (m) => m.id === maintId && m.family_id === familyId);
  if (deleted && existing) {
    logActivity(familyId, req.user!.id, req.user!.name, 'Deleted Maintenance Item', 'TASK', `Deleted appliance record "${existing.item_name}"`);
  }
  res.json({ success: deleted });
});

export default router;

