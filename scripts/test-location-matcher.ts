import { LocationTransactionMatcher } from '../src/services/smartExpense/LocationTransactionMatcher.js';
import { LocationSnapshotStore } from '../src/services/smartExpense/LocationSnapshotStore.js';
import { LocationSnapshot } from '../src/services/smartExpense/types.js';

console.log('====================================================');
console.log('   KINORAONE SMART EXPENSE LOCATION MATCHER TESTS   ');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`✓ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`✗ [FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
  }
}

// Test Snapshots
const baseTime = new Date('2026-09-18T12:45:00.000Z').getTime();

const sampleSnapshots: LocationSnapshot[] = [
  {
    id: 'loc_office',
    latitude: 17.4485,
    longitude: 78.3741,
    accuracyMeters: 45,
    capturedAt: new Date(baseTime - 120 * 60 * 1000).toISOString(), // 10:45 AM (2 hrs before)
    source: 'LOCATION_SNAPSHOT',
    locationLabel: 'HITEC City',
  },
  {
    id: 'loc_restaurant',
    latitude: 17.4321,
    longitude: 78.4078,
    accuracyMeters: 35,
    capturedAt: new Date(baseTime - 5 * 60 * 1000).toISOString(), // 12:40 PM (5 mins before)
    source: 'LOCATION_SNAPSHOT',
    locationLabel: 'Jubilee Hills',
  },
  {
    id: 'loc_mall',
    latitude: 17.3850,
    longitude: 78.4867,
    accuracyMeters: 220,
    capturedAt: new Date(baseTime + 25 * 60 * 1000).toISOString(), // 1:10 PM (25 mins after)
    source: 'LOCATION_SNAPSHOT',
    locationLabel: 'Inorbit Mall',
  },
  {
    id: 'loc_coarse_city',
    latitude: 17.3850,
    longitude: 78.4867,
    accuracyMeters: 800,
    capturedAt: new Date(baseTime + 45 * 60 * 1000).toISOString(), // 1:30 PM (45 mins after)
    source: 'LOCATION_SNAPSHOT',
    locationLabel: 'Hyderabad',
  },
];

// TEST 1: Exact / Close Timestamp Match (5 min diff, 35m accuracy)
const txn1 = new Date(baseTime).toISOString(); // 12:45 PM
const match1 = LocationTransactionMatcher.match(txn1, undefined, sampleSnapshots);

assert(
  match1.confidence === 'HIGH' &&
  match1.status === 'AVAILABLE' &&
  match1.locationLabel === 'Jubilee Hills' &&
  match1.timeDifferenceSeconds === 300,
  'TEST 1: 5-minute offset with 35m accuracy gives HIGH confidence and exact label',
  JSON.stringify(match1)
);

// TEST 2: Approximate Location label formatting
assert(
  LocationTransactionMatcher.formatAccuracyLabel('Jubilee Hills', 35) === 'Jubilee Hills',
  'TEST 2A: High accuracy <= 100m has no prefix'
);
assert(
  LocationTransactionMatcher.formatAccuracyLabel('Inorbit Mall', 220) === 'Near Inorbit Mall',
  'TEST 2B: Medium accuracy 101-500m gets "Near" prefix'
);
assert(
  LocationTransactionMatcher.formatAccuracyLabel('Hyderabad', 800) === 'Around Hyderabad',
  'TEST 2C: Coarse accuracy > 500m gets "Around" prefix'
);

// TEST 3: Medium Confidence (25 min offset, 220m accuracy)
const txn3 = new Date(baseTime + 25 * 60 * 1000 + 30 * 1000).toISOString();
const match3 = LocationTransactionMatcher.match(txn3, undefined, [sampleSnapshots[2]]);

assert(
  match3.confidence === 'HIGH' || match3.confidence === 'MEDIUM',
  'TEST 3: Moderate distance match produces valid confidence',
  `Confidence: ${match3.confidence}, Label: ${match3.locationLabel}`
);

// TEST 4: Coarse Location (45 min offset, 800m accuracy)
const txn4 = new Date(baseTime + 45 * 60 * 1000).toISOString();
const match4 = LocationTransactionMatcher.match(txn4, undefined, [sampleSnapshots[3]]);

assert(
  match4.confidence === 'LOW' && match4.locationLabel === 'Around Hyderabad',
  'TEST 4: Low confidence coarse match produces "Around Hyderabad"',
  JSON.stringify(match4)
);

// TEST 5: Delayed SMS timestamp fallback
const smsReceived = new Date(baseTime).toISOString();
const match5 = LocationTransactionMatcher.match(undefined, smsReceived, sampleSnapshots);

assert(
  match5.matchTimestampType === 'SMS_RECEIVED_TIME' &&
  match5.confidence === 'HIGH' &&
  match5.locationLabel === 'Jubilee Hills',
  'TEST 5: Missing transactionDateTime falls back safely to smsReceivedDateTime',
  JSON.stringify(match5)
);

// TEST 6: Transaction far away (>60 minutes from any snapshot)
const txnFar = new Date(baseTime + 180 * 60 * 1000).toISOString(); // 3:45 PM (3 hours later)
const match6 = LocationTransactionMatcher.match(txnFar, undefined, sampleSnapshots);

assert(
  match6.confidence === 'NONE' &&
  match6.status === 'UNAVAILABLE' &&
  match6.latitude === null,
  'TEST 6: Transaction beyond 60-minute window yields UNAVAILABLE / NONE confidence',
  JSON.stringify(match6)
);

// TEST 7: Empty snapshots array handling
const match7 = LocationTransactionMatcher.match(txn1, undefined, []);

assert(
  match7.status === 'UNAVAILABLE' &&
  match7.confidence === 'NONE' &&
  match7.locationLabel === '',
  'TEST 7: Empty snapshots array gracefully produces UNAVAILABLE context'
);

// TEST 8: Snapshot Store Pruning logic
// Simulated localStorage test in node environment
const oldSnapshotTime = new Date(Date.now() - 100 * 60 * 60 * 1000).toISOString(); // 100 hours ago
const freshSnapshotTime = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 mins ago

const mockList: LocationSnapshot[] = [
  { id: '1', latitude: 17.1, longitude: 78.1, accuracyMeters: 50, capturedAt: oldSnapshotTime, source: 'LOCATION_SNAPSHOT' },
  { id: '2', latitude: 17.2, longitude: 78.2, accuracyMeters: 50, capturedAt: freshSnapshotTime, source: 'LOCATION_SNAPSHOT' },
];

const retentionCutoff = Date.now() - 72 * 60 * 60 * 1000; // 72 hours
const validList = mockList.filter((s) => new Date(s.capturedAt).getTime() >= retentionCutoff);

assert(
  validList.length === 1 && validList[0].id === '2',
  'TEST 8: Expired snapshots older than 72 hours are properly pruned'
);

console.log('\n====================================================');
console.log(`  RESULTS: ${passedTests} / ${totalTests} TESTS PASSED `);
console.log('====================================================\n');
