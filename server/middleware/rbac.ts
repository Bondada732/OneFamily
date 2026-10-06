import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';

export function requirePermission(...permissionCodes: string[]) {
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

    const userPerms = Array.isArray(req.user.permissions) ? req.user.permissions : [];

    // Check if user has explicit permission, or if FINANCE_EDIT grants INVESTMENT_EDIT, or FINANCE_VIEW grants INVESTMENT_VIEW
    const hasPermission =
      permissionCodes.some((code) => userPerms.includes(code)) ||
      (userPerms.includes('FINANCE_EDIT') && permissionCodes.includes('INVESTMENT_EDIT')) ||
      (userPerms.includes('FINANCE_VIEW') && permissionCodes.includes('INVESTMENT_VIEW')) ||
      (userPerms.includes('INVESTMENT_EDIT') && permissionCodes.includes('FINANCE_EDIT')) ||
      (userPerms.includes('INVESTMENT_VIEW') && permissionCodes.includes('FINANCE_VIEW'));

    if (!hasPermission) {
      return res.status(403).json({
        error: `Access Denied: Missing required permission (${permissionCodes.join(' or ')})`,
        requiredPermission: permissionCodes[0],
        userRole: req.user.role,
        message: `You do not have permission to view or modify this area. Please ask your Family Head to grant access in Family settings.`,
      });
    }

    next();
  };
}
