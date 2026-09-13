import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, DEFAULT_PERMISSIONS } from '../config.js';
import db from '../db/database.js';

export interface AuthenticatedUser {
  id: string;
  family_id: string;
  name: string;
  email?: string;
  role: string;
  permissions: string[];
  is_approved?: boolean;
  status?: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  familyId?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const activeUserId = req.headers['x-active-user-id'] as string;

  let userId: string | null = null;
  let familyId: string | null = null;

  // 1. Primary: Verify JWT Bearer Token if present
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded && decoded.id) {
        userId = decoded.id;
        familyId = decoded.family_id;
      }
    } catch (err) {
      // Invalid/expired token
    }
  }

  // 2. Secondary fallback: Header switcher (only if no JWT token was provided)
  if (!userId && activeUserId) {
    const user = db.findOne('users', (u) => u.id === activeUserId);
    if (user) {
      userId = user.id;
      familyId = user.family_id;
    }
  }

  // 3. Fallback for initial dev setup / seed data
  if (!userId) {
    const defaultUser = db.findOne('users', (u) => u.role === 'FAMILY_HEAD') || db.getTable('users')[0];
    if (defaultUser) {
      userId = defaultUser.id;
      familyId = defaultUser.family_id;
    }
  }

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: No active user session found' });
  }

  const user = db.findOne('users', (u) => u.id === userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  const isHead = user.role === 'FAMILY_HEAD';
  const isApproved = isHead || (user.is_approved !== false && user.status !== 'PENDING_APPROVAL');

  // Fetch permissions for this user
  let userPerms = db
    .find('member_permissions', (mp) => mp.user_id === user.id)
    .map((mp) => mp.permission_code);

  if (isHead) {
    // Family Head always has full set of permissions
    userPerms = Array.from(new Set([...userPerms, ...DEFAULT_PERMISSIONS.FAMILY_HEAD]));
  }

  req.user = {
    id: user.id,
    family_id: user.family_id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: userPerms,
    is_approved: isApproved,
    status: user.status || (isApproved ? 'ACTIVE' : 'PENDING_APPROVAL'),
  };
  req.familyId = user.family_id;

  next();
}
