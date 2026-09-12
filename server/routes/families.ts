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
    const userPerms = permissions
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

// Family Tree hierarchy data
router.get('/:id/tree', (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId;
  const members = db.find('users', (u) => u.family_id === familyId);

  // Build tree node mapping
  const treeNodes = [
    {
      id: 'gen_1',
      generation: 1,
      title: 'Grandparents Generation',
      members: members.filter((m) => m.role === 'VIEWER' || m.relationship.toLowerCase().includes('grand')),
    },
    {
      id: 'gen_2',
      generation: 2,
      title: 'Parents Generation',
      members: members.filter((m) => m.role === 'FAMILY_HEAD' || m.role === 'SPOUSE' || (m.role === 'ADULT' && !m.relationship.toLowerCase().includes('grand'))),
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
