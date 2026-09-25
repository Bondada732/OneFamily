import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 64) {
  throw new Error('JWT_SECRET must be configured with at least 64 characters.');
}

export const JWT_SECRET = process.env.JWT_SECRET;
export const PORT = parseInt(process.env.PORT || '4000', 10);
export const APP_NAME = 'ONE FAMILY';
export const TAGLINE = 'One Home. One Family. One Future.';
export const SUPABASE_URL = process.env.SUPABASE_URL || '';
export const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

export const DEFAULT_PERMISSIONS = {
  FAMILY_HEAD: [
    'FINANCE_VIEW', 'FINANCE_EDIT',
    'INVESTMENT_VIEW', 'INVESTMENT_EDIT',
    'DOCUMENT_VIEW', 'DOCUMENT_UPLOAD', 'DOCUMENT_DELETE',
    'EMERGENCY_VIEW', 'EMERGENCY_EDIT',
    'MEMORY_VIEW', 'MEMORY_UPLOAD',
    'CALENDAR_VIEW', 'CALENDAR_EDIT',
    'TASK_VIEW', 'TASK_EDIT',
    'AI_USE', 'FAMILY_MANAGE',
  ],
  SPOUSE: [
    'FINANCE_VIEW', 'FINANCE_EDIT',
    'INVESTMENT_VIEW', 'INVESTMENT_EDIT',
    'DOCUMENT_VIEW', 'DOCUMENT_UPLOAD', 'DOCUMENT_DELETE',
    'EMERGENCY_VIEW', 'EMERGENCY_EDIT',
    'MEMORY_VIEW', 'MEMORY_UPLOAD',
    'CALENDAR_VIEW', 'CALENDAR_EDIT',
    'TASK_VIEW', 'TASK_EDIT',
    'AI_USE', 'FAMILY_MANAGE',
  ],
  ADULT: [
    'FINANCE_VIEW',
    'DOCUMENT_VIEW', 'DOCUMENT_UPLOAD',
    'EMERGENCY_VIEW',
    'MEMORY_VIEW', 'MEMORY_UPLOAD',
    'CALENDAR_VIEW', 'CALENDAR_EDIT',
    'TASK_VIEW', 'TASK_EDIT',
    'AI_USE',
  ],
  CHILD: [
    'MEMORY_VIEW', 'MEMORY_UPLOAD',
    'CALENDAR_VIEW', 'CALENDAR_EDIT',
    'TASK_VIEW', 'TASK_EDIT',
    'AI_USE',
  ],
  VIEWER: [
    'MEMORY_VIEW', 'MEMORY_UPLOAD',
    'CALENDAR_VIEW',
    'EMERGENCY_VIEW',
    'AI_USE',
  ],
};
