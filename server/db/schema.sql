-- ONE FAMILY Database Schema
-- Multi-tenant Family Operating System

CREATE TABLE IF NOT EXISTS families (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  photo_url TEXT,
  location TEXT,
  currency TEXT DEFAULT 'INR',
  language TEXT DEFAULT 'en',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  pin_code TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'ADULT', -- FAMILY_HEAD, SPOUSE, ADULT, CHILD, VIEWER
  relationship TEXT,
  birth_date TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS member_permissions (
  user_id TEXT NOT NULL,
  permission_code TEXT NOT NULL,
  PRIMARY KEY (user_id, permission_code),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  device_name TEXT NOT NULL,
  browser TEXT,
  os TEXT,
  ip_address TEXT,
  last_active TEXT NOT NULL,
  is_current BOOLEAN DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  category TEXT NOT NULL,
  details TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS expense_categories (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT 0
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  paid_by_name TEXT NOT NULL,
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'INR',
  date TEXT NOT NULL,
  payment_method TEXT NOT NULL, -- UPI, CASH, CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, WALLET
  merchant TEXT,
  notes TEXT,
  location TEXT,
  receipt_url TEXT,
  split_type TEXT DEFAULT 'EQUAL', -- NONE, EQUAL, CUSTOM
  created_at TEXT NOT NULL,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  monthly_limit REAL NOT NULL,
  month_year TEXT NOT NULL, -- e.g. 2026-09
  created_at TEXT NOT NULL,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS investments (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  type TEXT NOT NULL, -- MUTUAL_FUND, STOCK, SIP, FIXED_DEPOSIT, GOLD, PPF, BONDS, OTHER
  title TEXT NOT NULL,
  institution TEXT,
  invested_amount REAL NOT NULL,
  current_value REAL NOT NULL,
  gain_loss REAL NOT NULL,
  maturity_date TEXT,
  folio_number TEXT,
  nominee TEXT,
  notes TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS insurance_policies (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  insured_person TEXT NOT NULL,
  policy_type TEXT NOT NULL, -- LIFE, HEALTH, VEHICLE, HOME, OTHER
  provider TEXT NOT NULL,
  policy_number TEXT,
  sum_insured REAL NOT NULL,
  premium_amount REAL NOT NULL,
  renewal_date TEXT NOT NULL,
  nominee TEXT,
  status TEXT DEFAULT 'ACTIVE',
  document_url TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS liabilities (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  type TEXT NOT NULL, -- HOME_LOAN, PERSONAL_LOAN, VEHICLE_LOAN, CREDIT_CARD, OTHER
  title TEXT NOT NULL,
  lender TEXT NOT NULL,
  total_loan REAL NOT NULL,
  outstanding_amount REAL NOT NULL,
  monthly_emi REAL NOT NULL,
  interest_rate REAL,
  end_date TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- EMERGENCY_FUND, EDUCATION, HOUSE, VACATION, RETIREMENT, MARRIAGE, CAR, OTHER
  target_amount REAL NOT NULL,
  current_amount REAL NOT NULL,
  monthly_contribution REAL NOT NULL,
  target_date TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'MEDIUM', -- HIGH, MEDIUM, LOW
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
  contributors TEXT, -- JSON array of member names
  created_at TEXT NOT NULL,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  created_by_id TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- BIRTHDAY, ANNIVERSARY, SCHOOL, BILL, INSURANCE, SIP, MEDICAL, TRAVEL, FUNCTION, RELIGIOUS, OTHER
  start_date TEXT NOT NULL,
  end_date TEXT,
  is_all_day BOOLEAN DEFAULT 1,
  assigned_member_id TEXT,
  assigned_member_name TEXT,
  is_recurring BOOLEAN DEFAULT 0,
  recurrence_rule TEXT,
  visibility TEXT DEFAULT 'FAMILY', -- FAMILY, PRIVATE
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  title TEXT NOT NULL,
  due_date TEXT NOT NULL,
  category TEXT NOT NULL,
  lead_days INTEGER DEFAULT 3,
  is_dismissed BOOLEAN DEFAULT 0,
  linked_entity_type TEXT,
  linked_entity_id TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS document_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  is_sensitive BOOLEAN DEFAULT 0
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  uploaded_by_id TEXT NOT NULL,
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
  is_verified BOOLEAN DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT NOT NULL,
  secondary_phone TEXT,
  email TEXT,
  type TEXT NOT NULL DEFAULT 'PERSONAL', -- PERSONAL, DOCTOR, HOSPITAL, AMBULANCE, POLICE, INSURANCE
  address TEXT,
  is_primary BOOLEAN DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS emergency_profiles (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  blood_group TEXT NOT NULL,
  allergies TEXT,
  chronic_conditions TEXT,
  medications TEXT,
  primary_doctor TEXT,
  insurance_summary TEXT,
  special_instructions TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  location TEXT,
  album TEXT,
  description TEXT,
  photos TEXT, -- JSON array of image URLs
  tagged_members TEXT, -- JSON array of names
  created_at TEXT NOT NULL,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS voice_memories (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  speaker_name TEXT NOT NULL,
  speaker_relationship TEXT NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  transcript TEXT NOT NULL,
  translation_hindi TEXT,
  translation_telugu TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- CHORE, GROCERY, BILL, MAINTENANCE, SCHOOL, OTHER
  priority TEXT NOT NULL DEFAULT 'MEDIUM', -- HIGH, MEDIUM, LOW
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED
  assigned_to_id TEXT,
  assigned_to_name TEXT,
  due_date TEXT,
  is_recurring BOOLEAN DEFAULT 0,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS grocery_items (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity TEXT NOT NULL,
  category TEXT NOT NULL, -- PRODUCE, DAIRY, STAPLES, SNACKS, HOUSEHOLD, OTHER
  is_purchased BOOLEAN DEFAULT 0,
  added_by_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS maintenance_items (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  service_type TEXT NOT NULL, -- AC, CAR, RO_FILTER, GAS, APPLIANCE, PLUMBING, ELECTRICAL
  last_service_date TEXT NOT NULL,
  next_service_due TEXT NOT NULL,
  service_provider TEXT,
  contact_phone TEXT,
  recurring_interval_months INTEGER DEFAULT 6,
  notes TEXT,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  user_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- URGENT, WARNING, SUCCESS, INFO, REMINDER
  link_tab TEXT,
  is_read BOOLEAN DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_conversations (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role_at_time TEXT NOT NULL,
  user_query TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  tools_called TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);
