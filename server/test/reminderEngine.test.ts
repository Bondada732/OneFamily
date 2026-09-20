import { calculateOccasionStatus } from '../services/reminderEngine.js';

function runTests() {
  console.log('🧪 Running Family & Friends Reminder Calculation Tests...\n');

  let passed = 0;
  let failed = 0;

  const mockContact = {
    id: 'cnt_ravi',
    name: 'Ravi Kumar',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    mobile_number: '+91 98765 43210',
    relationship: 'Uncle',
    notes: 'Likes books and sweets',
    visibility: 'FAMILY',
  };

  const mockOccasion = {
    id: 'occ_birthday',
    contact_id: 'cnt_ravi',
    occasion_type: 'BIRTHDAY',
    occasion_date: '1985-09-25',
    original_year: 1985,
    is_recurring: true,
    reminder_type: 'OFFSET_DAYS',
    reminder_days_before: 5,
    is_active: true,
  };

  function assert(testName: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}${details ? ` - ${details}` : ''}`);
      failed++;
    }
  }

  // Test 1: Date 19 September (Before reminder period: 20-25 Sep)
  {
    const res = calculateOccasionStatus(mockContact, mockOccasion, new Date(2026, 8, 19)); // Month is 0-indexed (8 = Sep)
    assert('Test 1: 19 September is inactive (before 5-day reminder window)', res.isActiveReminder === false && res.isToday === false, `Got active=${res.isActiveReminder}`);
  }

  // Test 2: Date 20 September (Start of reminder period)
  {
    const res = calculateOccasionStatus(mockContact, mockOccasion, new Date(2026, 8, 20));
    assert('Test 2: 20 September is active with 5 days remaining', res.isActiveReminder === true && res.daysRemaining === 5 && res.countdownText === 'In 5 days', `Got active=${res.isActiveReminder}, daysRemaining=${res.daysRemaining}`);
  }

  // Test 3: Date 24 September (1 day before)
  {
    const res = calculateOccasionStatus(mockContact, mockOccasion, new Date(2026, 8, 24));
    assert('Test 3: 24 September is active with Tomorrow countdown', res.isActiveReminder === true && res.daysRemaining === 1 && res.countdownText === 'Tomorrow', `Got active=${res.isActiveReminder}, daysRemaining=${res.daysRemaining}, text=${res.countdownText}`);
  }

  // Test 4: Date 25 September (Day of occasion: TODAY)
  {
    const res = calculateOccasionStatus(mockContact, mockOccasion, new Date(2026, 8, 25));
    assert('Test 4: 25 September is active with isToday=true and Today 🎉 countdown', res.isActiveReminder === true && res.isToday === true && res.daysRemaining === 0 && res.countdownText === 'Today 🎉' && res.milestoneText === 'Turns 41', `Got active=${res.isActiveReminder}, isToday=${res.isToday}, milestone=${res.milestoneText}`);
  }

  // Test 5: Date 26 September (Day after occasion: cycles to next year, currently inactive)
  {
    const res = calculateOccasionStatus(mockContact, mockOccasion, new Date(2026, 8, 26));
    assert('Test 5: 26 September is inactive (moved to next year 25 Sep 2027)', res.isActiveReminder === false && res.nextOccurrenceIso === '2027-09-25', `Got active=${res.isActiveReminder}, nextOccurrence=${res.nextOccurrenceIso}`);
  }

  // Test 6: Date 1 January next year (Inactive)
  {
    const res = calculateOccasionStatus(mockContact, mockOccasion, new Date(2027, 0, 1));
    assert('Test 6: 1 January next year is inactive', res.isActiveReminder === false && res.daysRemaining > 200, `Got active=${res.isActiveReminder}, daysRemaining=${res.daysRemaining}`);
  }

  // Test 7: Next year reminder period (20 September 2027)
  {
    const res = calculateOccasionStatus(mockContact, mockOccasion, new Date(2027, 8, 20));
    assert('Test 7: Next year reminder period correctly activates on 20 Sep 2027 with milestone Turns 42', res.isActiveReminder === true && res.daysRemaining === 5 && res.milestoneText === 'Turns 42', `Got active=${res.isActiveReminder}, daysRemaining=${res.daysRemaining}, milestone=${res.milestoneText}`);
  }

  // Test 8: Marriage Anniversary Milestone calculation (e.g. 12 Feb 2010 -> 16th Anniversary in 2026)
  {
    const mockAnnivOccasion = {
      id: 'occ_anniv',
      contact_id: 'cnt_ravi',
      occasion_type: 'MARRIAGE_ANNIVERSARY',
      occasion_date: '2010-02-12',
      original_year: 2010,
      is_recurring: true,
      reminder_type: 'OFFSET_DAYS',
      reminder_days_before: 7,
      is_active: true,
    };
    const res = calculateOccasionStatus(mockContact, mockAnnivOccasion, new Date(2026, 1, 12));
    assert('Test 8: Anniversary milestone calculated as 16th Anniversary', res.milestoneText === '16th Anniversary' && res.isToday === true, `Got milestone=${res.milestoneText}`);
  }

  // Test 9: Leap year Feb 29 on non-leap year (e.g. 2026) -> Safe date handled on Feb 28
  {
    const leapBirthday = {
      id: 'occ_leap',
      contact_id: 'cnt_ravi',
      occasion_type: 'BIRTHDAY',
      occasion_date: '2000-02-29',
      original_year: 2000,
      is_recurring: true,
      reminder_type: 'OFFSET_DAYS',
      reminder_days_before: 1,
      is_active: true,
    };
    const res = calculateOccasionStatus(leapBirthday, leapBirthday, new Date(2026, 1, 28));
    assert('Test 9: Leap year Feb 29 Birthday safely mapped to Feb 28 in non-leap year 2026', res.isToday === true && res.milestoneText === 'Turns 26', `Got isToday=${res.isToday}, milestone=${res.milestoneText}`);
  }

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
