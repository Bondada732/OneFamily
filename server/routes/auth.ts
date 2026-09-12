import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../db/database.js';
import { JWT_SECRET } from '../config.js';
import { logActivity } from '../services/auditService.js';

const router = express.Router();

// Get current user and active family
router.get('/me', (req, res) => {
  const activeUserId = req.headers['x-active-user-id'] as string;
  const user = db.findOne('users', (u) => u.id === (activeUserId || 'usr_raj'));
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const family = db.findOne('families', (f) => f.id === user.family_id);
  const permissions = db
    .find('member_permissions', (mp) => mp.user_id === user.id)
    .map((mp) => mp.permission_code);

  const allMembers = db.find('users', (u) => u.family_id === user.family_id);

  res.json({
    user: {
      ...user,
      permissions,
    },
    family,
    familyMembers: allMembers,
  });
});

// Switch active member (for frictionless demo & role testing)
router.post('/switch-member', (req, res) => {
  const { userId } = req.body;
  const targetUser = db.findOne('users', (u) => u.id === userId);
  if (!targetUser) {
    return res.status(404).json({ error: 'Target user not found' });
  }

  const family = db.findOne('families', (f) => f.id === targetUser.family_id);
  const permissions = db
    .find('member_permissions', (mp) => mp.user_id === targetUser.id)
    .map((mp) => mp.permission_code);

  const token = jwt.sign(
    { id: targetUser.id, family_id: targetUser.family_id, role: targetUser.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  logActivity(
    targetUser.family_id,
    targetUser.id,
    targetUser.name,
    'Active Member Switched',
    'SECURITY',
    `Switched active session to ${targetUser.name} (${targetUser.role})`
  );

  res.json({
    token,
    user: {
      ...targetUser,
      permissions,
    },
    family,
  });
});

// Login
router.post('/login', (req, res) => {
  const { email, password, pin } = req.body;
  const user = db.findOne('users', (u) => u.email === email || (pin && u.pin_code === pin));

  if (!user) {
    return res.status(401).json({ error: 'Invalid email, password or PIN' });
  }

  const token = jwt.sign(
    { id: user.id, family_id: user.family_id, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const permissions = db
    .find('member_permissions', (mp) => mp.user_id === user.id)
    .map((mp) => mp.permission_code);

  res.json({
    token,
    user: {
      ...user,
      permissions,
    },
  });
});

// Register Family & Family Head
router.post('/register-family', (req, res) => {
  const { familyName, location, currency, language, headName, headEmail, pinCode } = req.body;

  const familyId = `fam_${Date.now()}`;
  const userId = `usr_head_${Date.now()}`;

  const family = {
    id: familyId,
    name: familyName || 'Our Family',
    photo_url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600',
    location: location || 'India',
    currency: currency || 'INR',
    language: language || 'en',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const headUser = {
    id: userId,
    family_id: familyId,
    email: headEmail || `${headName.toLowerCase().replace(/\s+/g, '')}@example.com`,
    name: headName || 'Family Head',
    password_hash: 'hash',
    pin_code: pinCode || '1234',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    role: 'FAMILY_HEAD',
    relationship: 'Family Head',
    birth_date: '1985-01-01',
    created_at: new Date().toISOString(),
  };

  db.insert('families', family);
  db.insert('users', headUser);

  // Grant all permissions
  const allPermissions = db.getTable('permissions');
  allPermissions.forEach((p) => {
    db.insert('member_permissions', { user_id: userId, permission_code: p.code });
  });

  const token = jwt.sign({ id: userId, family_id: familyId, role: 'FAMILY_HEAD' }, JWT_SECRET, { expiresIn: '7d' });

  logActivity(familyId, userId, headName, 'Family Created', 'ADMIN', `Family "${familyName}" registered successfully.`);

  res.json({
    token,
    family,
    user: {
      ...headUser,
      permissions: allPermissions.map((p) => p.code),
    },
  });
});

// Devices list
router.get('/devices', (req, res) => {
  const devices = db.getTable('devices');
  res.json(devices);
});

export default router;
