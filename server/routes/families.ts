import express from 'express';
import db from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { logActivity } from '../services/auditService.js';
import { DEFAULT_PERMISSIONS } from '../config.js';

const router = express.Router();
router.use(authMiddleware);

// Get Family Details & Members
router.get('/:id', (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId;
  const family = db.findOne('families', (f) => f.id === familyId);
  if (!family) {
    return res.status(404).json({ error: 'Family not found' });
  }

  const members = db.find('users', (u) => u.family_id === familyId);
  const permissions = db.find('member_permissions', (mp) => members.some((m) => m.id === mp.user_id));

  const membersWithPerms = members.map((m) => {
    const mIsHead = m.role === 'FAMILY_HEAD';
    const userPerms = mIsHead
      ? DEFAULT_PERMISSIONS.FAMILY_HEAD
      : permissions
          .filter((p) => p.user_id === m.id)
          .map((p) => p.permission_code);

    return {
      ...m,
      permissions: userPerms,
    };
  });

  res.json({
    family,
    members: membersWithPerms,
  });
});

// Update Family Details (Family Head only)
router.patch('/:id', requirePermission('FAMILY_MANAGE'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId;
  const { name, location, currency, language, photo_url } = req.body;

  const updated = db.update(
    'families',
    (f) => f.id === familyId,
    { name, location, currency, language, photo_url, updated_at: new Date().toISOString() }
  );

  logActivity(req.familyId!, req.user!.id, req.user!.name, 'Updated Family Profile', 'ADMIN', `Updated family settings for ${name}`);

  res.json(updated);
});

// Add New Family Member
router.post('/:id/members', requirePermission('FAMILY_MANAGE'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId;
  const { name, email, phone, role, relationship, birth_date, avatar_url } = req.body;

  const newId = `usr_${Date.now()}`;
  const newMember = {
    id: newId,
    family_id: familyId,
    name,
    email: email || '',
    phone: phone || '',
    password_hash: 'hash',
    pin_code: '1234',
    avatar_url: avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    role: role || 'ADULT',
    relationship: relationship || 'Family Member',
    birth_date: birth_date || '',
    created_at: new Date().toISOString(),
  };

  db.insert('users', newMember);

  // Assign default permissions according to role
  const defaultCodes = DEFAULT_PERMISSIONS[role as keyof typeof DEFAULT_PERMISSIONS] || DEFAULT_PERMISSIONS.ADULT;
  defaultCodes.forEach((code) => {
    db.insert('member_permissions', { user_id: newId, permission_code: code });
  });

  logActivity(req.familyId!, req.user!.id, req.user!.name, 'Added Family Member', 'ADMIN', `Added ${name} as ${role}`);

  res.status(201).json({
    member: {
      ...newMember,
      permissions: defaultCodes,
    },
  });
});

// Update Member Permissions
router.put('/:id/members/:userId/permissions', requirePermission('FAMILY_MANAGE'), (req: AuthRequest, res) => {
  const { userId } = req.params;
  const { permissions } = req.body; // array of permission codes

  if (!Array.isArray(permissions)) {
    return res.status(400).json({ error: 'Permissions must be an array of string codes' });
  }

  // Remove existing permissions
  db.delete('member_permissions', (mp) => mp.user_id === userId);

  // Insert new permissions
  permissions.forEach((code) => {
    db.insert('member_permissions', { user_id: userId, permission_code: code });
  });

  const member = db.findOne('users', (u) => u.id === userId);
  logActivity(
    req.familyId!,
    req.user!.id,
    req.user!.name,
    'Updated Permissions',
    'ADMIN',
    `Updated permissions for ${member ? member.name : userId} (${permissions.length} granted)`
  );

  res.json({ success: true, userId, permissions });
});

// Update Member Profile (Avatar photo, name, phone, birth_date, relationship)
router.patch('/:id/members/:userId', requirePermission('FAMILY_MANAGE'), (req: AuthRequest, res) => {
  const { userId } = req.params;
  const { name, avatar_url, phone, pin_code, birth_date, relationship, role } = req.body;

  const member = db.findOne('users', (u) => u.id === userId);
  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }

  const updated = db.update('users', (u) => u.id === userId, {
    ...(name && { name }),
    ...(avatar_url && { avatar_url }),
    ...(phone && { phone }),
    ...(pin_code && { pin_code }),
    ...(birth_date && { birth_date }),
    ...(relationship && { relationship }),
    ...(role && { role }),
  });

  logActivity(
    req.familyId!,
    req.user!.id,
    req.user!.name,
    'Updated Member Profile',
    'ADMIN',
    `Updated profile for ${updated?.name || userId}`
  );

  res.json({ success: true, member: updated });
});

// Approve Pending Family Member & Assign Permissions (Family Head only)
router.post('/:id/members/:userId/approve', requirePermission('FAMILY_MANAGE'), (req: AuthRequest, res) => {
  const { userId } = req.params;
  const { permissions, role, relationship } = req.body;

  const member = db.findOne('users', (u) => u.id === userId);
  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }

  // Update member status to approved
  const updated = db.update('users', (u) => u.id === userId, {
    is_approved: true,
    status: 'ACTIVE',
    ...(role && { role }),
    ...(relationship && { relationship }),
  });

  // Assign permissions
  db.delete('member_permissions', (mp) => mp.user_id === userId);
  const grantedPerms: string[] = Array.isArray(permissions) ? permissions : [];
  grantedPerms.forEach((code) => {
    db.insert('member_permissions', { user_id: userId, permission_code: code });
  });

  logActivity(
    req.familyId!,
    req.user!.id,
    req.user!.name,
    'Approved Member Access',
    'ADMIN',
    `Approved access for ${member.name} (${role || member.role}) with ${grantedPerms.length} permissions.`
  );

  res.json({
    success: true,
    member: {
      ...updated,
      is_approved: true,
      status: 'ACTIVE',
      permissions: grantedPerms,
    },
  });
});

// Reject / Delete Pending Member (Family Head only)
router.delete('/:id/members/:userId/reject', requirePermission('FAMILY_MANAGE'), (req: AuthRequest, res) => {
  const { userId } = req.params;
  const member = db.findOne('users', (u) => u.id === userId);
  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }

  db.delete('member_permissions', (mp) => mp.user_id === userId);
  db.delete('users', (u) => u.id === userId);

  logActivity(
    req.familyId!,
    req.user!.id,
    req.user!.name,
    'Rejected Member Request',
    'ADMIN',
    `Rejected and removed registration request for ${member.name}.`
  );

  res.json({ success: true, message: `Registration for ${member.name} has been rejected.` });
});

// Family Tree hierarchy data
router.get('/:id/tree', (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId;
  const members = db.find('users', (u) => u.family_id === familyId);

  // Build tree node mapping with null-safe relationship checks
  const treeNodes = [
    {
      id: 'gen_1',
      generation: 1,
      title: 'Grandparents Generation',
      members: members.filter((m) => m.role === 'VIEWER' || (m.relationship && m.relationship.toLowerCase().includes('grand'))),
    },
    {
      id: 'gen_2',
      generation: 2,
      title: 'Parents Generation',
      members: members.filter((m) => m.role === 'FAMILY_HEAD' || m.role === 'SPOUSE' || (m.role === 'ADULT' && !(m.relationship && m.relationship.toLowerCase().includes('grand')))),
    },
    {
      id: 'gen_3',
      generation: 3,
      title: 'Children Generation',
      members: members.filter((m) => m.role === 'CHILD'),
    },
  ];

  res.json({ familyId, treeNodes });
});

export default router;
