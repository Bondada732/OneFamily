import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../db/database.js';
import { JWT_SECRET, DEFAULT_PERMISSIONS } from '../config.js';
import { logActivity } from '../services/auditService.js';
import { sendEmailOtp, verifyEmailOtp } from '../services/emailService.js';

const router = express.Router();

// Helper to generate a clean, unique Family Key (e.g. FAM-8492)
function generateUniqueFamilyKey(prefix = 'FAM'): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  const key = `${prefix.toUpperCase().slice(0, 3)}-${randomPart}`;
  // Check collision
  const existing = db.findOne('families', (f) => f.family_key === key);
  if (existing) {
    return `${prefix.toUpperCase().slice(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  return key;
}

// Get current user and active family
router.get('/me', (req, res) => {
  const activeUserId = req.headers['x-active-user-id'] as string;
  const authHeader = req.headers.authorization;

  let userId: string | null = null;
  if (activeUserId) {
    userId = activeUserId;
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      userId = decoded.id;
    } catch (err) {}
  }

  if (!userId) {
    userId = 'usr_raj';
  }

  let user = db.findOne('users', (u) => u.id === userId);
  if (!user) {
    user = db.findOne('users', (u) => u.id === 'user_rajesh_01') || db.getTable('users')[0];
  }
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  let family = db.findOne('families', (f) => f.id === user.family_id);
  if (family && !family.family_key) {
    const key = family.id === 'fam_sharma_01' ? 'FAM-SHARMA-01' : generateUniqueFamilyKey(family.name || 'FAM');
    family = db.update('families', (f) => f.id === family!.id, { family_key: key });
  }

  const isHead = user.role === 'FAMILY_HEAD';
  const isApproved = isHead || (user.is_approved !== false && user.status !== 'PENDING_APPROVAL');

  // Fetch permissions for user (Family head always has full master access)
  const permissions: string[] = isHead
    ? DEFAULT_PERMISSIONS.FAMILY_HEAD
    : isApproved
    ? db.find('member_permissions', (mp) => mp.user_id === user.id).map((mp) => mp.permission_code)
    : [];

  const allMembers = db.find('users', (u) => u.family_id === user.family_id).map((m) => {
    const mIsHead = m.role === 'FAMILY_HEAD';
    const mApproved = mIsHead || (m.is_approved !== false && m.status !== 'PENDING_APPROVAL');
    const perms = mIsHead
      ? DEFAULT_PERMISSIONS.FAMILY_HEAD
      : mApproved
      ? db.find('member_permissions', (mp) => mp.user_id === m.id).map((mp) => mp.permission_code)
      : [];

    return {
      ...m,
      is_approved: mApproved,
      status: m.status || (mApproved ? 'ACTIVE' : 'PENDING_APPROVAL'),
      permissions: perms,
    };
  });

  res.json({
    user: {
      ...user,
      is_approved: isApproved,
      status: user.status || (isApproved ? 'ACTIVE' : 'PENDING_APPROVAL'),
      permissions,
    },
    family,
    familyMembers: allMembers,
  });
});

// Switch active member (Strictly restricted to Family Head only for RBAC testing)
router.post('/switch-member', (req, res) => {
  const activeUserId = req.headers['x-active-user-id'] as string;
  const requester = db.findOne('users', (u) => u.id === activeUserId);

  if (!requester || requester.role !== 'FAMILY_HEAD') {
    return res.status(403).json({ error: 'Permission denied: Account switching is disabled for family members.' });
  }

  const { userId } = req.body;
  const targetUser = db.findOne('users', (u) => u.id === userId);
  if (!targetUser) {
    return res.status(404).json({ error: 'Target user not found' });
  }

  const family = db.findOne('families', (f) => f.id === targetUser.family_id);
  const targetApproved = targetUser.role === 'FAMILY_HEAD' || (targetUser.is_approved !== false && targetUser.status !== 'PENDING_APPROVAL');
  let permissions = targetApproved
    ? db.find('member_permissions', (mp) => mp.user_id === targetUser.id).map((mp) => mp.permission_code)
    : [];

  if (targetUser.role === 'FAMILY_HEAD' && permissions.length === 0) {
    permissions = DEFAULT_PERMISSIONS.FAMILY_HEAD;
    permissions.forEach((code) => {
      db.insert('member_permissions', { user_id: targetUser.id, permission_code: code });
    });
  }

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
    `Family Head switched active preview session to ${targetUser.name} (${targetUser.role})`
  );

  res.json({
    token,
    user: {
      ...targetUser,
      is_approved: targetApproved,
      status: targetUser.status || (targetApproved ? 'ACTIVE' : 'PENDING_APPROVAL'),
      permissions,
    },
    family,
  });
});

// Login (by Email, Phone, or PIN)
router.post('/login', async (req, res) => {
  const { email, password, pin } = req.body;
  const identifier = (email || '').trim().toLowerCase();
  const pinInput = (pin || password || '').trim();

  const candidates = db.find('users', (u) => {
    if (identifier) {
      const matchEmail = u.email && u.email.toLowerCase() === identifier;
      const matchName = u.name && u.name.toLowerCase() === identifier;
      const matchPhone = u.phone && u.phone.includes(identifier);
      return Boolean(matchEmail || matchName || matchPhone);
    }
    return Boolean(pinInput);
  });

  let user: any;
  for (const candidate of candidates) {
    if (!pinInput) continue;
    let pinMatches = candidate.pin_code && candidate.pin_code === pinInput;
    if (!pinMatches && candidate.pin_code) {
      try {
        pinMatches = await bcrypt.compare(pinInput, candidate.pin_code);
      } catch {}
    }
    let passwordMatches = candidate.password_hash && candidate.password_hash === pinInput;
    if (!passwordMatches && candidate.password_hash) {
      try {
        passwordMatches = await bcrypt.compare(pinInput, candidate.password_hash);
      } catch {}
    }
    if (pinMatches || passwordMatches) {
      user = candidate;
      break;
    }
  }

  if (!user) {
    return res.status(401).json({ error: 'Invalid email, name or PIN code. (Demo PIN: 1234)' });
  }

  let family = db.findOne('families', (f) => f.id === user.family_id);
  if (family && !family.family_key) {
    const key = family.id === 'fam_sharma_01' ? 'FAM-SHARMA-01' : generateUniqueFamilyKey(family.name || 'FAM');
    family = db.update('families', (f) => f.id === family!.id, { family_key: key });
  }

  const isHead = user.role === 'FAMILY_HEAD';
  const isApproved = isHead || (user.is_approved !== false && user.status !== 'PENDING_APPROVAL');

  const token = jwt.sign(
    { id: user.id, family_id: user.family_id, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const permissions: string[] = isHead
    ? DEFAULT_PERMISSIONS.FAMILY_HEAD
    : isApproved
    ? db.find('member_permissions', (mp) => mp.user_id === user.id).map((mp) => mp.permission_code)
    : [];

  const allMembers = db.find('users', (u) => u.family_id === user.family_id).map((m) => {
    const mIsHead = m.role === 'FAMILY_HEAD';
    const mApproved = mIsHead || (m.is_approved !== false && m.status !== 'PENDING_APPROVAL');
    const perms = mIsHead
      ? DEFAULT_PERMISSIONS.FAMILY_HEAD
      : mApproved
      ? db.find('member_permissions', (mp) => mp.user_id === m.id).map((mp) => mp.permission_code)
      : [];
    return {
      ...m,
      is_approved: mApproved,
      status: m.status || (mApproved ? 'ACTIVE' : 'PENDING_APPROVAL'),
      permissions: perms,
    };
  });

  res.json({
    token,
    user: {
      ...user,
      is_approved: isApproved,
      status: user.status || (isApproved ? 'ACTIVE' : 'PENDING_APPROVAL'),
      permissions,
    },
    family,
    familyMembers: allMembers,
  });
});

// 1. Send OTP for Family Creation Registration
router.post('/send-registration-otp', async (req, res) => {
  const { email, familyName, headName } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Valid Email address is required to receive OTP.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'Please enter a valid email address format (e.g. name@example.com).' });
  }

  // Check if an existing Family Head is already registered with this email
  const existingHead = db.findOne('users', (u) => u.email && u.email.toLowerCase() === email.trim().toLowerCase() && u.role === 'FAMILY_HEAD');
  if (existingHead) {
    return res.status(409).json({
      error: `A family is already registered with email "${email}". Please sign in instead or use another email.`,
    });
  }

  try {
    const result = await sendEmailOtp(email.trim(), familyName || 'New Family', headName || 'Family Head');
    res.json(result);
  } catch (err: any) {
    console.error('Failed to send registration OTP:', err);
    res.status(500).json({ error: 'Failed to send OTP email. Please try again.' });
  }
});

// 2. Verify OTP & Complete Family Creation Registration
router.post('/verify-registration-otp', async (req, res) => {
  const { otp, familyName, location, currency, language, headName, headEmail, pinCode, relationship, phone } = req.body;

  if (!headEmail?.trim()) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  if (!otp?.trim()) {
    return res.status(400).json({ error: 'Please enter the 6-digit verification code.' });
  }

  if (!familyName?.trim() || !headName?.trim()) {
    return res.status(400).json({ error: 'Family name and Family Head name are required.' });
  }

  // Verify the OTP
  const verification = verifyEmailOtp(headEmail.trim(), otp.trim());
  if (!verification.success) {
    return res.status(400).json({ error: verification.error || 'Invalid OTP code' });
  }

  // OTP verified! Proceed with Family Creation
  const familyId = `fam_${Date.now()}`;
  const userId = `usr_head_${Date.now()}`;
  const familyKey = generateUniqueFamilyKey(familyName.trim().replace(/[^a-zA-Z]/g, '').slice(0, 3) || 'FAM');

  const family = {
    id: familyId,
    name: familyName.trim(),
    family_key: familyKey,
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
    email: headEmail.trim().toLowerCase(),
    phone: phone || '',
    name: headName.trim(),
    password_hash: await bcrypt.hash(pinCode || '1234', 10),
    pin_code: await bcrypt.hash(pinCode || '1234', 10),
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    role: 'FAMILY_HEAD',
    relationship: relationship || 'Family Head / Father',
    birth_date: '1985-01-01',
    is_email_verified: true,
    created_at: new Date().toISOString(),
  };

  db.insert('families', family);
  db.insert('users', headUser);

  // Grant ALL master permissions to Family Head
  const headPermissions = DEFAULT_PERMISSIONS.FAMILY_HEAD;
  headPermissions.forEach((code) => {
    db.insert('member_permissions', { user_id: userId, permission_code: code });
  });

  // Initialize Default Expense Categories for the new family
  const defaultExpenseCategories = [
    { id: `cat_groceries_${familyId}`, family_id: familyId, name: 'Groceries', icon: 'ShoppingCart', color: '#10B981' },
    { id: `cat_dining_${familyId}`, family_id: familyId, name: 'Food & Dining', icon: 'Utensils', color: '#F59E0B' },
    { id: `cat_utilities_${familyId}`, family_id: familyId, name: 'Utilities & Bills', icon: 'Zap', color: '#6366F1' },
    { id: `cat_rent_${familyId}`, family_id: familyId, name: 'Rent & Maintenance', icon: 'Home', color: '#8B5CF6' },
    { id: `cat_education_${familyId}`, family_id: familyId, name: 'Education & School', icon: 'GraduationCap', color: '#EC4899' },
    { id: `cat_transport_${familyId}`, family_id: familyId, name: 'Transport & Fuel', icon: 'Car', color: '#3B82F6' },
    { id: `cat_healthcare_${familyId}`, family_id: familyId, name: 'Healthcare & Medicine', icon: 'HeartPulse', color: '#EF4444' },
    { id: `cat_shopping_${familyId}`, family_id: familyId, name: 'Shopping', icon: 'ShoppingBag', color: '#14B8A6' },
    { id: `cat_entertainment_${familyId}`, family_id: familyId, name: 'Entertainment', icon: 'Film', color: '#F97316' },
    { id: `cat_travel_${familyId}`, family_id: familyId, name: 'Travel & Trips', icon: 'Plane', color: '#06B6D4' },
    { id: `cat_insurance_${familyId}`, family_id: familyId, name: 'Insurance Premiums', icon: 'ShieldCheck', color: '#059669' },
    { id: `cat_investments_${familyId}`, family_id: familyId, name: 'Investments / SIP', icon: 'TrendingUp', color: '#4F46E5' },
    { id: `cat_emi_${familyId}`, family_id: familyId, name: 'Loan EMI', icon: 'CreditCard', color: '#7C3AED' },
    { id: `cat_misc_${familyId}`, family_id: familyId, name: 'Miscellaneous', icon: 'MoreHorizontal', color: '#64748B' },
  ];
  defaultExpenseCategories.forEach((cat) => db.insert('expense_categories', cat));

  // Initialize Default Document Categories
  const defaultDocCategories = [
    { id: `doc_cat_id_${familyId}`, family_id: familyId, name: 'Identity & KYC', icon: 'CreditCard', description: 'Aadhaar, PAN, Passport, Voter ID' },
    { id: `doc_cat_health_${familyId}`, family_id: familyId, name: 'Health & Medical', icon: 'HeartPulse', description: 'Insurance policies, prescriptions, reports' },
    { id: `doc_cat_prop_${familyId}`, family_id: familyId, name: 'Property & Assets', icon: 'Home', description: 'Sale deeds, property tax receipts, rent agreements' },
    { id: `doc_cat_veh_${familyId}`, family_id: familyId, name: 'Vehicle & Transport', icon: 'Car', description: 'RC Books, driving licenses, vehicle insurance' },
    { id: `doc_cat_edu_${familyId}`, family_id: familyId, name: 'Education & Certificates', icon: 'GraduationCap', description: 'Degrees, marksheets, certificates' },
    { id: `doc_cat_fin_${familyId}`, family_id: familyId, name: 'Financial & Tax', icon: 'TrendingUp', description: 'ITR filings, mutual fund statements, FD receipts' },
  ];
  defaultDocCategories.forEach((cat) => db.insert('document_categories', cat));

  const token = jwt.sign({ id: userId, family_id: familyId, role: 'FAMILY_HEAD' }, JWT_SECRET, { expiresIn: '7d' });

  logActivity(familyId, userId, headName, 'Family Created (Email Verified)', 'ADMIN', `Family "${familyName}" registered with Key: ${familyKey} via Email OTP verification.`);

  res.json({
    success: true,
    token,
    family,
    familyKey,
    user: {
      ...headUser,
      permissions: headPermissions,
    },
    familyMembers: [{ ...headUser, permissions: headPermissions }],
  });
});

// Register Family & Family Head (Direct/Fallback with optional OTP)
router.post(['/register-head', '/register-family'], async (req, res) => {
  const { familyName, location, currency, language, headName, headEmail, pinCode, relationship, phone } = req.body;

  if (!familyName?.trim() || !headName?.trim()) {
    return res.status(400).json({ error: 'Family name and Family Head name are required.' });
  }

  const familyId = `fam_${Date.now()}`;
  const userId = `usr_head_${Date.now()}`;
  const familyKey = generateUniqueFamilyKey(familyName.trim().replace(/[^a-zA-Z]/g, '').slice(0, 3) || 'FAM');

  const family = {
    id: familyId,
    name: familyName.trim(),
    family_key: familyKey,
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
    email: headEmail || `${headName.toLowerCase().replace(/\s+/g, '')}@family.com`,
    phone: phone || '',
    name: headName.trim(),
    password_hash: await bcrypt.hash(pinCode || '1234', 10),
    pin_code: await bcrypt.hash(pinCode || '1234', 10),
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    role: 'FAMILY_HEAD',
    relationship: relationship || 'Family Head / Father',
    birth_date: '1985-01-01',
    created_at: new Date().toISOString(),
  };

  db.insert('families', family);
  db.insert('users', headUser);

  // Grant ALL master permissions to Family Head
  const headPermissions = DEFAULT_PERMISSIONS.FAMILY_HEAD;
  headPermissions.forEach((code) => {
    db.insert('member_permissions', { user_id: userId, permission_code: code });
  });

  // Initialize Default Expense Categories for the new family
  const defaultExpenseCategories = [
    { id: `cat_groceries_${familyId}`, family_id: familyId, name: 'Groceries', icon: 'ShoppingCart', color: '#10B981' },
    { id: `cat_dining_${familyId}`, family_id: familyId, name: 'Food & Dining', icon: 'Utensils', color: '#F59E0B' },
    { id: `cat_utilities_${familyId}`, family_id: familyId, name: 'Utilities & Bills', icon: 'Zap', color: '#6366F1' },
    { id: `cat_rent_${familyId}`, family_id: familyId, name: 'Rent & Maintenance', icon: 'Home', color: '#8B5CF6' },
    { id: `cat_education_${familyId}`, family_id: familyId, name: 'Education & School', icon: 'GraduationCap', color: '#EC4899' },
    { id: `cat_transport_${familyId}`, family_id: familyId, name: 'Transport & Fuel', icon: 'Car', color: '#3B82F6' },
    { id: `cat_healthcare_${familyId}`, family_id: familyId, name: 'Healthcare & Medicine', icon: 'HeartPulse', color: '#EF4444' },
    { id: `cat_shopping_${familyId}`, family_id: familyId, name: 'Shopping', icon: 'ShoppingBag', color: '#14B8A6' },
    { id: `cat_entertainment_${familyId}`, family_id: familyId, name: 'Entertainment', icon: 'Film', color: '#F97316' },
    { id: `cat_travel_${familyId}`, family_id: familyId, name: 'Travel & Trips', icon: 'Plane', color: '#06B6D4' },
    { id: `cat_insurance_${familyId}`, family_id: familyId, name: 'Insurance Premiums', icon: 'ShieldCheck', color: '#059669' },
    { id: `cat_investments_${familyId}`, family_id: familyId, name: 'Investments / SIP', icon: 'TrendingUp', color: '#4F46E5' },
    { id: `cat_emi_${familyId}`, family_id: familyId, name: 'Loan EMI', icon: 'CreditCard', color: '#7C3AED' },
    { id: `cat_misc_${familyId}`, family_id: familyId, name: 'Miscellaneous', icon: 'MoreHorizontal', color: '#64748B' },
  ];
  defaultExpenseCategories.forEach((cat) => db.insert('expense_categories', cat));

  // Initialize Default Document Categories
  const defaultDocCategories = [
    { id: `doc_cat_id_${familyId}`, family_id: familyId, name: 'Identity & KYC', icon: 'CreditCard', description: 'Aadhaar, PAN, Passport, Voter ID' },
    { id: `doc_cat_health_${familyId}`, family_id: familyId, name: 'Health & Medical', icon: 'HeartPulse', description: 'Insurance policies, prescriptions, reports' },
    { id: `doc_cat_prop_${familyId}`, family_id: familyId, name: 'Property & Assets', icon: 'Home', description: 'Sale deeds, property tax receipts, rent agreements' },
    { id: `doc_cat_veh_${familyId}`, family_id: familyId, name: 'Vehicle & Transport', icon: 'Car', description: 'RC Books, driving licenses, vehicle insurance' },
    { id: `doc_cat_edu_${familyId}`, family_id: familyId, name: 'Education & Certificates', icon: 'GraduationCap', description: 'Degrees, marksheets, certificates' },
    { id: `doc_cat_fin_${familyId}`, family_id: familyId, name: 'Financial & Tax', icon: 'TrendingUp', description: 'ITR filings, mutual fund statements, FD receipts' },
  ];
  defaultDocCategories.forEach((cat) => db.insert('document_categories', cat));

  const token = jwt.sign({ id: userId, family_id: familyId, role: 'FAMILY_HEAD' }, JWT_SECRET, { expiresIn: '7d' });

  logActivity(familyId, userId, headName, 'Family Created', 'ADMIN', `Family "${familyName}" registered with Key: ${familyKey}`);

  res.json({
    token,
    family,
    user: {
      ...headUser,
      permissions: headPermissions,
    },
    familyMembers: [{ ...headUser, permissions: headPermissions }],
  });
});

// Join Family by Secret Family Key (For Family Members)
router.post('/join-family', async (req, res) => {
  const { familyKey, name, email, pinCode, relationship, role, phone, birth_date, avatar_url } = req.body;

  if (!familyKey?.trim() || !name?.trim()) {
    return res.status(400).json({ error: 'Family Key and your name are required.' });
  }

  const normalizedKey = familyKey.trim().toUpperCase();

  // Find target family by key
  const family = db.findOne('families', (f) => {
    if (f.family_key && f.family_key.toUpperCase() === normalizedKey) return true;
    if (f.id && f.id.toUpperCase() === normalizedKey) return true;
    return false;
  });

  if (!family) {
    return res.status(404).json({
      error: `Invalid Family Key "${normalizedKey}". Please ask your Family Head for the correct invitation key (e.g. FAM-8492).`,
    });
  }

  const userId = `usr_m_${Date.now()}`;
  const memberRole = role || 'ADULT';
  const memberRel = relationship || 'Family Member';

  const newMember = {
    id: userId,
    family_id: family.id,
    email: email?.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@family.com`,
    phone: phone || '',
    name: name.trim(),
    password_hash: await bcrypt.hash(pinCode || '1234', 10),
    pin_code: await bcrypt.hash(pinCode || '1234', 10),
    avatar_url: avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    role: memberRole,
    relationship: memberRel,
    birth_date: birth_date || '1995-01-01',
    is_approved: false,
    status: 'PENDING_APPROVAL',
    created_at: new Date().toISOString(),
  };

  db.insert('users', newMember);

  // New members joining via secret key have ZERO permissions by default until Family Head approves
  const token = jwt.sign({ id: userId, family_id: family.id, role: memberRole }, JWT_SECRET, { expiresIn: '7d' });

  logActivity(family.id, userId, name, 'Member Joined (Pending Approval)', 'ADMIN', `${name} joined the family (${memberRel}) using Family Key and is awaiting approval from Family Head.`);

  // Get full updated member list
  const allMembers = db.find('users', (u) => u.family_id === family.id).map((m) => {
    const mIsHead = m.role === 'FAMILY_HEAD';
    const mApproved = mIsHead || (m.is_approved !== false && m.status !== 'PENDING_APPROVAL');
    const perms = mApproved
      ? db.find('member_permissions', (mp) => mp.user_id === m.id).map((mp) => mp.permission_code)
      : [];
    return {
      ...m,
      is_approved: mApproved,
      status: m.status || (mApproved ? 'ACTIVE' : 'PENDING_APPROVAL'),
      permissions: perms,
    };
  });

  res.json({
    token,
    family,
    user: {
      ...newMember,
      is_approved: false,
      status: 'PENDING_APPROVAL',
      permissions: [],
    },
    familyMembers: allMembers,
  });
});

// Regenerate Family Key (Family Head only)
router.post('/regenerate-family-key', (req, res) => {
  const activeUserId = req.headers['x-active-user-id'] as string;
  const user = db.findOne('users', (u) => u.id === (activeUserId || 'usr_raj'));
  if (!user || user.role !== 'FAMILY_HEAD') {
    return res.status(403).json({ error: 'Only the Family Head can regenerate the family key.' });
  }

  const family = db.findOne('families', (f) => f.id === user.family_id);
  if (!family) {
    return res.status(404).json({ error: 'Family not found.' });
  }

  const newKey = generateUniqueFamilyKey(family.name || 'FAM');
  const updatedFamily = db.update('families', (f) => f.id === family.id, {
    family_key: newKey,
    updated_at: new Date().toISOString(),
  });

  logActivity(family.id, user.id, user.name, 'Regenerated Family Key', 'SECURITY', `Family Key rotated to ${newKey}`);

  res.json({
    success: true,
    family_key: newKey,
    family: updatedFamily,
  });
});

// Update User Profile (Avatar photo, name, phone, PIN)
router.patch('/profile', async (req, res) => {
  const activeUserId = req.headers['x-active-user-id'] as string;
  const authHeader = req.headers.authorization;
  let userId = activeUserId;
  if (!userId && authHeader?.startsWith('Bearer ')) {
    try {
      const decoded: any = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      userId = decoded.id;
    } catch {}
  }
  if (!userId) {
    const defaultUser = db.getTable('users')[0];
    userId = defaultUser?.id;
  }
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: User ID required' });
  }

  const { name, avatar_url, phone, pin_code, birth_date, relationship } = req.body;
  const user = db.findOne('users', (u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const hashedPin = pin_code ? await bcrypt.hash(pin_code, 10) : undefined;
  const updated = db.update(
    'users',
    (u) => u.id === userId,
    {
      ...(name && { name }),
      ...(avatar_url && { avatar_url }),
      ...(phone && { phone }),
      ...(hashedPin && { pin_code: hashedPin }),
      ...(birth_date && { birth_date }),
      ...(relationship && { relationship }),
    }
  );

  res.json({ success: true, user: updated });
});

// Get Trusted Devices
router.get('/devices', (req, res) => {
  const activeUserId = req.headers['x-active-user-id'] as string;
  let user = db.findOne('users', (u) => u.id === (activeUserId || 'usr_raj'));
  if (!user) user = db.getTable('users')[0];

  let devices = db.find('devices', (d) => d.user_id === user?.id);
  if (devices.length === 0) {
    const defaultDev = {
      id: `dev_${Date.now()}`,
      user_id: user?.id,
      device_name: 'Primary Mobile Device (Current)',
      device_type: 'MOBILE',
      platform: 'Android / Web',
      ip_address: '192.168.1.5',
      last_active: new Date().toISOString(),
      is_current: true,
      is_trusted: true,
    };
    db.insert('devices', defaultDev);
    devices = [defaultDev];
  }

  res.json(devices);
});

export default router;
