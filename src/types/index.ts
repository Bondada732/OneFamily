export type FamilyRole = 'FAMILY_HEAD' | 'SPOUSE' | 'ADULT' | 'CHILD' | 'VIEWER';

export interface FamilyMember {
  id: string;
  family_id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  role: FamilyRole;
  relationship: string;
  birth_date?: string;
  permissions: string[];
}

export interface Family {
  id: string;
  name: string;
  photo_url?: string;
  location?: string;
  currency: string;
  language: 'en' | 'te' | 'hi';
  created_at: string;
  updated_at: string;
}

export interface ExpenseCategory {
  id: string;
  family_id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Expense {
  id: string;
  family_id: string;
  user_id: string;
  paid_by_name: string;
  category_id: string;
  category_name: string;
  amount: number;
  currency: string;
  date: string;
  payment_method: 'UPI' | 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'WALLET';
  merchant: string;
  notes?: string;
  location?: string;
  receipt_url?: string;
  split_type?: string;
  created_at: string;
}

export interface BudgetReport {
  categoryId: string;
  categoryName: string;
  icon: string;
  color: string;
  limit: number;
  spent: number;
  remaining: number;
  utilizationPct: number;
  alertStatus: 'NORMAL' | 'WARNING' | 'EXCEEDED';
  budgetId?: string;
}

export interface Investment {
  id: string;
  family_id: string;
  user_id: string;
  owner_name: string;
  type: 'MUTUAL_FUND' | 'STOCK' | 'SIP' | 'FIXED_DEPOSIT' | 'GOLD' | 'PPF' | 'BONDS' | 'OTHER';
  title: string;
  institution?: string;
  invested_amount: number;
  current_value: number;
  gain_loss: number;
  maturity_date?: string;
  folio_number?: string;
  nominee?: string;
  notes?: string;
}

export interface InsurancePolicy {
  id: string;
  family_id: string;
  insured_person: string;
  policy_type: 'LIFE' | 'HEALTH' | 'VEHICLE' | 'HOME' | 'OTHER';
  provider: string;
  policy_number?: string;
  sum_insured: number;
  premium_amount: number;
  renewal_date: string;
  nominee?: string;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'LAPSED';
}

export interface Liability {
  id: string;
  family_id: string;
  owner_name: string;
  type: 'HOME_LOAN' | 'PERSONAL_LOAN' | 'VEHICLE_LOAN' | 'CREDIT_CARD' | 'OTHER';
  title: string;
  lender: string;
  total_loan: number;
  outstanding_amount: number;
  monthly_emi: number;
  interest_rate?: number;
  end_date?: string;
}

export interface Goal {
  id: string;
  family_id: string;
  title: string;
  category: string;
  target_amount: number;
  current_amount: number;
  monthly_contribution: number;
  target_date: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: string;
  progressPct: number;
  shortfall: number;
  monthsRemaining: number;
  isOnTrack: boolean;
  contributorsList?: string[];
}

export interface CalendarEvent {
  id: string;
  family_id: string;
  title: string;
  type: 'BIRTHDAY' | 'ANNIVERSARY' | 'SCHOOL' | 'BILL' | 'INSURANCE' | 'SIP' | 'MEDICAL' | 'TRAVEL' | 'FUNCTION' | 'RELIGIOUS' | 'OTHER';
  start_date: string;
  end_date?: string;
  is_all_day?: boolean;
  assigned_member_name?: string;
  notes?: string;
}

export interface Reminder {
  id: string;
  family_id: string;
  title: string;
  due_date: string;
  category: string;
  lead_days: number;
  is_dismissed: boolean;
}

export interface DocumentRecord {
  id: string;
  family_id: string;
  owner_name: string;
  title: string;
  category_id: string;
  document_number?: string;
  issue_date?: string;
  expiry_date?: string;
  issuer?: string;
  file_url: string;
  file_type: string;
  tags?: string;
  notes?: string;
  daysUntilExpiry?: number | null;
  expiryStatus: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';
}

export interface TaskItem {
  id: string;
  family_id: string;
  title: string;
  category: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  assigned_to_name?: string;
  due_date?: string;
  is_recurring?: boolean;
}

export interface GroceryItem {
  id: string;
  item_name: string;
  quantity: string;
  category: string;
  is_purchased: boolean;
  added_by_name: string;
}

export interface MaintenanceItem {
  id: string;
  item_name: string;
  service_type: string;
  last_service_date: string;
  next_service_due: string;
  service_provider?: string;
  contact_phone?: string;
  notes?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  secondary_phone?: string;
  email?: string;
  type: 'PERSONAL' | 'DOCTOR' | 'HOSPITAL' | 'INSURANCE';
  address?: string;
  is_primary?: boolean;
}

export interface EmergencyProfile {
  id: string;
  user_id: string;
  full_name: string;
  blood_group: string;
  allergies?: string;
  chronic_conditions?: string;
  medications?: string;
  primary_doctor?: string;
  insurance_summary?: string;
  special_instructions?: string;
}

export interface Memory {
  id: string;
  title: string;
  date: string;
  location?: string;
  album: string;
  description?: string;
  photosList: string[];
  taggedMembersList: string[];
}

export interface VoiceMemory {
  id: string;
  speaker_name: string;
  speaker_relationship: string;
  title: string;
  date: string;
  audio_url: string;
  duration_seconds: number;
  transcript: string;
  translation_hindi?: string;
  translation_telugu?: string;
}

export interface AttentionItem {
  id: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  badgeColor: string;
  icon: string;
  title: string;
  description: string;
  actionTab: 'home' | 'money' | 'family' | 'vault' | 'ai';
}

export interface HomeDashboardData {
  userGreeting: string;
  role: FamilyRole;
  snapshot: {
    membersCount: number;
    netWorth: number | null;
    monthlySpending: number | null;
    savingsGoalPct: number | null;
  };
  attentionItems: AttentionItem[];
  today: {
    events: CalendarEvent[];
    tasks: TaskItem[];
    reminders: Reminder[];
  };
  goals: Goal[];
  recentMemories: Memory[];
  aiInsight: {
    id: string;
    type: string;
    title: string;
    message: string;
    amountSaved?: number;
    category: string;
  };
}
