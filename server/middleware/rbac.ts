import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';

export function requirePermission(permissionCode: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }

    // Only Family Head has automatic full master access
    if (req.user.role === 'FAMILY_HEAD') {
      return next();
    }

    // Check approval status
    if (req.user.is_approved === false || req.user.status === 'PENDING_APPROVAL') {
      return res.status(403).json({
        error: 'Access Denied: Account is awaiting approval from Family Head',
        userRole: req.user.role,
        message: 'Your Family Head has not yet approved your access and granted permissions.',
      });
    }

    const hasPermission = Array.isArray(req.user.permissions) && req.user.permissions.includes(permissionCode);
    if (!hasPermission) {
      return res.status(403).json({
        error: `Access Denied: Missing required permission (${permissionCode})`,
        requiredPermission: permissionCode,
        userRole: req.user.role,
        message: `You do not have permission to view or modify this area (${permissionCode}). Please ask your Family Head to grant access.`,
      });
    }

    next();
  };
}
