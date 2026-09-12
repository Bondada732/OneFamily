import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';

export function requirePermission(permissionCode: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }

    // Family Head has full master access
    if (req.user.role === 'FAMILY_HEAD') {
      return next();
    }

    const hasPermission = req.user.permissions.includes(permissionCode);
    if (!hasPermission) {
      return res.status(403).json({
        error: `Access Denied: Missing required permission (${permissionCode})`,
        requiredPermission: permissionCode,
        userRole: req.user.role,
        message: `Your current family role (${req.user.role}) does not have permission to view or modify this area. Please ask your Family Head to grant access.`,
      });
    }

    next();
  };
}
