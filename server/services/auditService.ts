import db from '../db/database.js';

export function logActivity(
  familyId: string,
  userId: string,
  userName: string,
  action: string,
  category: 'ADMIN' | 'FINANCE' | 'DOCUMENT' | 'EMERGENCY' | 'SECURITY' | 'TASK' | 'MEMORY',
  details?: string
) {
  const log = {
    id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    family_id: familyId,
    user_id: userId,
    user_name: userName,
    action,
    category,
    details: details || '',
    created_at: new Date().toISOString(),
  };

  db.insert('audit_logs', log);
  return log;
}
