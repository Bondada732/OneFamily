import { ActiveOccasionReminder, FamilyContact, FamilyContactOccasion, ContactVisibility } from '../types/index.js';

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

export function calculateClientOccasionStatus(
  contact: FamilyContact,
  occasion: FamilyContactOccasion,
  referenceDate: Date = new Date()
): {
  calc: ActiveOccasionReminder;
  isActiveReminder: boolean;
} {
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

  const getSafeDate = (year: number, month: number, day: number): Date => {
    if (month === 2 && day === 29 && !isLeapYear(year)) {
      return new Date(year, 1, 28);
    }
    return new Date(year, month - 1, day);
  };

  let targetOccurrence = getSafeDate(currentYear, origMonth, origDay);
  let occurrenceYear = currentYear;

  if (occasion.is_recurring !== false && today.getTime() > targetOccurrence.getTime()) {
    occurrenceYear = currentYear + 1;
    targetOccurrence = getSafeDate(occurrenceYear, origMonth, origDay);
  }

  const reminderDaysBefore =
    typeof occasion.reminder_days_before === 'number'
      ? occasion.reminder_days_before
      : 3;

  const reminderStartDate = new Date(targetOccurrence);
  reminderStartDate.setDate(reminderStartDate.getDate() - reminderDaysBefore);

  const todayTime = today.getTime();
  const startTime = reminderStartDate.getTime();
  const occurrenceTime = targetOccurrence.getTime();

  const isToday = todayTime === occurrenceTime;
  const isActiveReminder = todayTime >= startTime && todayTime <= occurrenceTime;

  const diffMs = targetOccurrence.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  let countdownText = `In ${daysRemaining} days`;
  if (daysRemaining === 0) {
    countdownText = 'Today 🎉';
  } else if (daysRemaining === 1) {
    countdownText = 'Tomorrow';
  }

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
  const occasionDateStr = `${origDay} ${monthName}`;
  const pad = (n: number) => String(n).padStart(2, '0');
  const nextOccurrenceIso = `${targetOccurrence.getFullYear()}-${pad(targetOccurrence.getMonth() + 1)}-${pad(targetOccurrence.getDate())}`;

  const calc: ActiveOccasionReminder = {
    contactId: contact.id,
    occasionId: occasion.id,
    name: contact.name,
    photo_url: contact.photo_url,
    mobile_number: contact.mobile_number,
    relationship: contact.relationship,
    occasion_type: occasion.occasion_type,
    custom_occasion_name: occasion.custom_occasion_name,
    displayTitle,
    occasionDateStr,
    nextOccurrenceIso,
    daysRemaining,
    countdownText,
    isToday,
    milestoneText,
    notes: contact.notes,
    visibility: contact.visibility || 'FAMILY',
    canViewPhone: true,
    canViewNotes: true,
    canEdit: true,
  };

  return { calc, isActiveReminder };
}
