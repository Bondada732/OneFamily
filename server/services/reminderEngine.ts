import { DBStore } from '../db/database.js';

export interface OccasionCalculationResult {
  contactId: string;
  occasionId: string;
  name: string;
  photo_url?: string;
  mobile_number: string;
  relationship: string;
  occasion_type: string;
  custom_occasion_name?: string;
  displayTitle: string;
  occasionDateFormatted: string; // e.g. "25 September"
  nextOccurrenceIso: string; // "2026-09-25"
  daysRemaining: number;
  countdownText: string;
  isToday: boolean;
  isActiveReminder: boolean;
  milestoneText?: string;
  notes?: string;
  visibility: string;
  created_by?: string;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Calculates occasion occurrence and reminder status for a single occasion against a reference date.
 */
export function calculateOccasionStatus(
  contact: any,
  occasion: any,
  referenceDate: Date = new Date()
): OccasionCalculationResult {
  const today = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  const rawDateStr = occasion.occasion_date; // "YYYY-MM-DD" or "MM-DD"
  const parts = rawDateStr.split('-');
  let origMonth = 1;
  let origDay = 1;
  let storedYear: number | undefined = occasion.original_year;

  if (parts.length === 3) {
    if (!storedYear && parseInt(parts[0], 10) > 1900) {
      storedYear = parseInt(parts[0], 10);
    }
    origMonth = parseInt(parts[1], 10);
    origDay = parseInt(parts[2], 10);
  } else if (parts.length === 2) {
    origMonth = parseInt(parts[0], 10);
    origDay = parseInt(parts[1], 10);
  }

  const currentYear = today.getFullYear();

  // Helper to safely get date taking leap year into account
  const getSafeDate = (year: number, month: number, day: number): Date => {
    if (month === 2 && day === 29 && !isLeapYear(year)) {
      // Leap year birthday on non-leap year falls on Feb 28
      return new Date(year, 1, 28);
    }
    return new Date(year, month - 1, day);
  };

  let targetOccurrence = getSafeDate(currentYear, origMonth, origDay);
  let occurrenceYear = currentYear;

  // If recurring and this year's date has strictly passed (today > occurrence)
  if (occasion.is_recurring !== false && today.getTime() > targetOccurrence.getTime()) {
    occurrenceYear = currentYear + 1;
    targetOccurrence = getSafeDate(occurrenceYear, origMonth, origDay);
  }

  // Calculate reminder offset
  const reminderDaysBefore =
    typeof occasion.reminder_days_before === 'number'
      ? occasion.reminder_days_before
      : 3;

  const reminderStartDate = new Date(targetOccurrence);
  reminderStartDate.setDate(reminderStartDate.getDate() - reminderDaysBefore);

  // Active window check: reminder_start_date <= today <= targetOccurrence
  const todayTime = today.getTime();
  const startTime = reminderStartDate.getTime();
  const occurrenceTime = targetOccurrence.getTime();

  const isToday = todayTime === occurrenceTime;
  const isActiveReminder = todayTime >= startTime && todayTime <= occurrenceTime;

  // Days remaining calculation
  const diffMs = targetOccurrence.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  // Countdown text
  let countdownText = `In ${daysRemaining} days`;
  if (daysRemaining === 0) {
    countdownText = 'Today 🎉';
  } else if (daysRemaining === 1) {
    countdownText = 'Tomorrow';
  }

  // Milestone text (e.g. "Turns 41", "16th Anniversary")
  let milestoneText: string | undefined = undefined;
  if (storedYear && storedYear > 1900 && storedYear < occurrenceYear) {
    const elapsed = occurrenceYear - storedYear;
    if (occasion.occasion_type === 'BIRTHDAY') {
      milestoneText = `Turns ${elapsed}`;
    } else if (
      occasion.occasion_type === 'MARRIAGE_ANNIVERSARY' ||
      occasion.occasion_type === 'ENGAGEMENT_ANNIVERSARY' ||
      occasion.occasion_type === 'GRADUATION_ANNIVERSARY'
    ) {
      milestoneText = `${getOrdinalSuffix(elapsed)} Anniversary`;
    }
  }

  // Display title
  let displayTitle = `${contact.name}'s ${occasion.custom_occasion_name || 'Special Day'}`;
  if (occasion.occasion_type === 'BIRTHDAY') {
    displayTitle = `${contact.name}'s Birthday`;
  } else if (occasion.occasion_type === 'MARRIAGE_ANNIVERSARY') {
    displayTitle = `${contact.name}'s Marriage Anniversary`;
  } else if (occasion.occasion_type === 'ENGAGEMENT_ANNIVERSARY') {
    displayTitle = `${contact.name}'s Engagement Anniversary`;
  } else if (occasion.occasion_type === 'GRADUATION_ANNIVERSARY') {
    displayTitle = `${contact.name}'s Graduation Anniversary`;
  }

  const monthName = MONTH_NAMES[origMonth - 1] || '';
  const occasionDateFormatted = `${origDay} ${monthName}`;
  const pad = (n: number) => String(n).padStart(2, '0');
  const nextOccurrenceIso = `${targetOccurrence.getFullYear()}-${pad(targetOccurrence.getMonth() + 1)}-${pad(targetOccurrence.getDate())}`;

  return {
    contactId: contact.id,
    occasionId: occasion.id,
    name: contact.name,
    photo_url: contact.photo_url,
    mobile_number: contact.mobile_number,
    relationship: contact.relationship,
    occasion_type: occasion.occasion_type,
    custom_occasion_name: occasion.custom_occasion_name,
    displayTitle,
    occasionDateFormatted,
    nextOccurrenceIso,
    daysRemaining,
    countdownText,
    isToday,
    isActiveReminder,
    milestoneText,
    notes: contact.notes,
    visibility: contact.visibility || 'FAMILY',
    created_by: contact.created_by,
  };
}

/**
 * Filter contacts and permissions based on the active user role and privacy.
 */
export function canUserViewContact(
  contact: any,
  user: { id?: string; role?: string } | undefined,
  permissions: any[] = []
): { canView: boolean; canEdit: boolean; canViewPhone: boolean; canViewNotes: boolean } {
  if (!contact) {
    return { canView: false, canEdit: false, canViewPhone: false, canViewNotes: false };
  }
  if (!user) {
    return { canView: true, canEdit: true, canViewPhone: true, canViewNotes: true };
  }

  // Family Head has full master access
  if (user.role === 'FAMILY_HEAD') {
    return { canView: true, canEdit: true, canViewPhone: true, canViewNotes: true };
  }

  // Creator has full access to their own contact
  if (user.id && contact.created_by === user.id) {
    return { canView: true, canEdit: true, canViewPhone: true, canViewNotes: true };
  }

  // Check visibility setting
  if (contact.visibility === 'PRIVATE' && user.id && contact.created_by !== user.id) {
    return { canView: false, canEdit: false, canViewPhone: false, canViewNotes: false };
  }

  if (contact.visibility === 'SELECTED' && user.id) {
    const visibleMembers = Array.isArray(contact.visible_to_members)
      ? contact.visible_to_members
      : [];
    if (!visibleMembers.includes(user.id) && contact.created_by !== user.id) {
      return { canView: false, canEdit: false, canViewPhone: false, canViewNotes: false };
    }
  }

  // Check specific contact_permissions record if present
  if (user.id && Array.isArray(permissions)) {
    const customPerm = permissions.find(
      (p) => p.contact_id === contact.id && p.family_member_id === user.id
    );

    if (customPerm) {
      return {
        canView: customPerm.can_view ?? true,
        canEdit: customPerm.can_edit ?? true,
        canViewPhone: customPerm.can_view_phone ?? true,
        canViewNotes: customPerm.can_view_notes ?? true,
      };
    }
  }

  // Default family member access
  return {
    canView: true,
    canEdit: true,
    canViewPhone: true,
    canViewNotes: true,
  };
}

/**
 * Main dashboard query: returns active reminders within reminder window,
 * sorted by 1) Today's occasions, 2) Days remaining ascending, 3) Name.
 */
export function getActiveFamilyOccasionReminders(
  familyId: string,
  user: { id: string; role: string },
  dbData: DBStore,
  referenceDate: Date = new Date()
): OccasionCalculationResult[] {
  const contacts = (dbData.family_contacts || []).filter(
    (c) => c.family_id === familyId && c.is_active !== false
  );
  const occasions = (dbData.family_contact_occasions || []).filter(
    (o) => o.family_id === familyId && o.is_active !== false
  );
  const permissions = dbData.contact_permissions || [];

  const results: OccasionCalculationResult[] = [];

  for (const contact of contacts) {
    const perm = canUserViewContact(contact, user, permissions);
    if (!perm.canView) continue;

    const contactOccasions = occasions.filter((o) => o.contact_id === contact.id);

    for (const occasion of contactOccasions) {
      const calc = calculateOccasionStatus(contact, occasion, referenceDate);
      if (calc.isActiveReminder) {
        // Redact phone/notes if not permitted
        if (!perm.canViewPhone) {
          calc.mobile_number = '';
        }
        if (!perm.canViewNotes) {
          calc.notes = '';
        }
        results.push(calc);
      }
    }
  }

  // Sort: 1) Today, 2) Soonest days remaining, 3) Name
  return results.sort((a, b) => {
    if (a.isToday && !b.isToday) return -1;
    if (!a.isToday && b.isToday) return 1;
    if (a.daysRemaining !== b.daysRemaining) return a.daysRemaining - b.daysRemaining;
    return a.name.localeCompare(b.name);
  });
}
