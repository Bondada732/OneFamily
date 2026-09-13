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
  const deleted = db.delete('grocery_items', (g) => g.id === itemId);
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

// Household Maintenance: Delete Item
router.delete('/:id/maintenance/:maintId', requirePermission('TASK_EDIT'), (req: AuthRequest, res) => {
  const { maintId } = req.params;
  const deleted = db.delete('maintenance_items', (m) => m.id === maintId);
  res.json({ success: deleted });
});

export default router;

