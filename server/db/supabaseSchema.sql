-- ==============================================================================
-- FAMORA (ONE FAMILY) - OFFICIAL SUPABASE POSTGRESQL SCHEMA (CLEAN SETUP)
-- ==============================================================================
-- Run this complete script in Supabase Dashboard -> SQL Editor -> New Query
-- ==============================================================================

-- Drop old tables cleanly to avoid column mismatches
DROP TABLE IF EXISTS ai_conversations CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS maintenance_items CASCADE;
DROP TABLE IF EXISTS grocery_items CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS voice_memories CASCADE;
DROP TABLE IF EXISTS memories CASCADE;
DROP TABLE IF EXISTS emergency_profiles CASCADE;
DROP TABLE IF EXISTS emergency_contacts CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS document_categories CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS liabilities CASCADE;
DROP TABLE IF EXISTS insurance_policies CASCADE;
DROP TABLE IF EXISTS investments CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS expense_categories CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS member_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS families CASCADE;

-- 1. FAMILIES
CREATE TABLE families (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  family_key TEXT UNIQUE,
  photo_url TEXT,
  location TEXT,
  currency TEXT DEFAULT 'INR',
  language TEXT DEFAULT 'en',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 2. USERS
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  name TEXT NOT NULL,
  password_hash TEXT DEFAULT 'demo_hash',
  pin_code TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'ADULT',
  relationship TEXT,
  birth_date TEXT,
  is_approved BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL
);

-- 3. PERMISSIONS
CREATE TABLE permissions (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL
);

-- 4. MEMBER PERMISSIONS
CREATE TABLE member_permissions (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_code TEXT NOT NULL,
  PRIMARY KEY (user_id, permission_code)
);

-- 5. DEVICES
CREATE TABLE devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_name TEXT,
  device_type TEXT,
  platform TEXT,
  browser TEXT,
  os TEXT,
  ip_address TEXT,
  last_active TEXT NOT NULL,
  is_current BOOLEAN DEFAULT FALSE,
  is_trusted BOOLEAN DEFAULT FALSE
);

-- 6. AUDIT LOGS
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id TEXT,
  user_name TEXT,
  action TEXT NOT NULL,
  category TEXT,
  module TEXT,
  details TEXT,
  created_at TEXT NOT NULL
);

-- 7. EXPENSE CATEGORIES
CREATE TABLE expense_categories (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT FALSE
);

-- 8. EXPENSES / TRANSACTIONS
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id TEXT,
  paid_by_name TEXT NOT NULL,
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  date TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  merchant TEXT,
  notes TEXT,
  location TEXT,
  receipt_url TEXT,
  split_type TEXT DEFAULT 'EQUAL',
  created_at TEXT NOT NULL
);

-- 9. BUDGETS
CREATE TABLE budgets (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  monthly_limit NUMERIC(12, 2) NOT NULL,
  month_year TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- 10. INVESTMENTS
CREATE TABLE investments (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id TEXT,
  owner_name TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  institution TEXT,
  invested_amount NUMERIC(14, 2) NOT NULL,
  current_value NUMERIC(14, 2) NOT NULL,
  gain_loss NUMERIC(14, 2) DEFAULT 0,
  maturity_date TEXT,
  folio_number TEXT,
  nominee TEXT,
  notes TEXT,
  updated_at TEXT NOT NULL
);

-- 11. INSURANCE POLICIES
CREATE TABLE insurance_policies (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id TEXT,
  insured_person TEXT NOT NULL,
  policy_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  policy_number TEXT,
  sum_insured NUMERIC(14, 2) NOT NULL,
  premium_amount NUMERIC(10, 2) NOT NULL,
  renewal_date TEXT NOT NULL,
  nominee TEXT,
  status TEXT DEFAULT 'ACTIVE',
  document_url TEXT,
  created_at TEXT NOT NULL
);

-- 12. LIABILITIES
CREATE TABLE liabilities (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id TEXT,
  owner_name TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  lender TEXT NOT NULL,
  total_loan NUMERIC(14, 2) NOT NULL,
  outstanding_amount NUMERIC(14, 2) NOT NULL,
  monthly_emi NUMERIC(10, 2) NOT NULL,
  interest_rate NUMERIC(5, 2),
  end_date TEXT,
  created_at TEXT NOT NULL
);

-- 13. GOALS
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL,
  current_amount NUMERIC(12, 2) NOT NULL,
  monthly_contribution NUMERIC(10, 2) NOT NULL,
  target_date TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
  contributors TEXT,
  created_at TEXT NOT NULL
);

-- 14. CALENDAR EVENTS
CREATE TABLE calendar_events (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_by_id TEXT,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  is_all_day BOOLEAN DEFAULT TRUE,
  assigned_member_id TEXT,
  assigned_member_name TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,
  visibility TEXT DEFAULT 'FAMILY',
  notes TEXT,
  created_at TEXT NOT NULL
);

-- 15. REMINDERS
CREATE TABLE reminders (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date TEXT NOT NULL,
  category TEXT NOT NULL,
  lead_days INTEGER DEFAULT 3,
  is_dismissed BOOLEAN DEFAULT FALSE,
  linked_entity_type TEXT,
  linked_entity_id TEXT,
  created_at TEXT NOT NULL
);

-- 16. DOCUMENT CATEGORIES & DOCUMENTS
CREATE TABLE document_categories (
  id TEXT PRIMARY KEY,
  family_id TEXT,
  name TEXT NOT NULL,
  icon TEXT,
  is_sensitive BOOLEAN DEFAULT FALSE,
  description TEXT
);

CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  uploaded_by_id TEXT,
  owner_name TEXT NOT NULL,
  title TEXT NOT NULL,
  category_id TEXT NOT NULL,
  document_number TEXT,
  issue_date TEXT,
  expiry_date TEXT,
  issuer TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_kb INTEGER,
  tags TEXT,
  notes TEXT,
  ocr_extracted_text TEXT,
  is_verified BOOLEAN DEFAULT TRUE,
  created_at TEXT NOT NULL
);

-- 17. EMERGENCY CONTACTS & MEDICAL PROFILES
CREATE TABLE emergency_contacts (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT NOT NULL,
  secondary_phone TEXT,
  email TEXT,
  type TEXT NOT NULL DEFAULT 'PERSONAL',
  address TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TEXT NOT NULL
);

CREATE TABLE emergency_profiles (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id TEXT,
  full_name TEXT NOT NULL,
  blood_group TEXT NOT NULL,
  allergies TEXT,
  chronic_conditions TEXT,
  medications TEXT,
  primary_doctor TEXT,
  insurance_summary TEXT,
  special_instructions TEXT,
  updated_at TEXT NOT NULL
);

-- 18. MEMORIES & VOICE MEMORIES
CREATE TABLE memories (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  location TEXT,
  album TEXT,
  description TEXT,
  photos TEXT,
  tagged_members TEXT,
  created_at TEXT NOT NULL
);

-- 19. TASKS & GROCERIES & MAINTENANCE
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  status TEXT NOT NULL DEFAULT 'PENDING',
  assigned_to_id TEXT,
  assigned_to_name TEXT,
  due_date TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  completed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE grocery_items (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity TEXT NOT NULL,
  category TEXT NOT NULL,
  is_purchased BOOLEAN DEFAULT FALSE,
  added_by_name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE maintenance_items (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  last_service_date TEXT NOT NULL,
  next_service_due TEXT NOT NULL,
  service_provider TEXT,
  contact_phone TEXT,
  recurring_interval_months INTEGER DEFAULT 6,
  notes TEXT
);

-- 20. NOTIFICATIONS & AI CONVERSATIONS
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  link_tab TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TEXT NOT NULL
);

CREATE TABLE ai_conversations (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role_at_time TEXT NOT NULL,
  user_query TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  tools_called TEXT,
  created_at TEXT NOT NULL
);

-- ==============================================================================
-- DISABLE RLS TO ALLOW ACCESS VIA BOTH ANON AND SERVICE_ROLE KEYS
-- ==============================================================================
ALTER TABLE families DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE member_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE investments DISABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE liabilities DISABLE ROW LEVEL SECURITY;
ALTER TABLE goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE document_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE memories DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations DISABLE ROW LEVEL SECURITY;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
