import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';
import db from '../db/database.js';

export interface AuthenticatedUser {
  id: string;
  family_id: string;
  name: string;
  email?: string;
  role: string;
  permissions: string[];
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  familyId?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  // Allow simulated member switcher header or JWT token
  const activeUserId = req.headers['x-active-user-id'] as string;
  const authHeader = req.headers.authorization;

  let userId: string | null = null;
  let familyId: string | null = null;

  if (activeUserId) {
    const user = db.findOne('users', (u) => u.id === activeUserId);
    if (user) {
      userId = user.id;
      familyId = user.family_id;
    }
  }

  if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      userId = decoded.id;
      familyId = decoded.family_id;
    } catch (err) {
      // Invalid token, fall back to default user if available
    }
  }

  // If no user found, default to Raj (Family Head) for effortless testing
  if (!userId) {
    const defaultUser = db.findOne('users', (u) => u.id === 'usr_raj') || db.getTable('users')[0];
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

  // Fetch permissions for this user
  const userPerms = db
    .find('member_permissions', (mp) => mp.user_id === user.id)
    .map((mp) => mp.permission_code);

  req.user = {
    id: user.id,
    family_id: user.family_id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: userPerms,
  };
  req.familyId = user.family_id;

  next();
}
