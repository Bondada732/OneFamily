export type SourceType =
  | 'SMS'
  | 'NOTIFICATION'
  | 'BANK_API'
  | 'ACCOUNT_AGGREGATOR'
  | 'STATEMENT_IMPORT'
  | 'MANUAL';

export type TransactionType =
  | 'UPI'
  | 'CARD'
  | 'BANK_TRANSFER'
  | 'ATM'
  | 'CASH'
  | 'NEFT'
  | 'IMPS'
  | 'RTGS'
  | 'UNKNOWN';

export type Direction = 'DEBIT' | 'CREDIT';

export type TransactionStatus =
  | 'DETECTED'
  | 'PENDING_REVIEW'
  | 'CONFIRMED'
  | 'EDITED_CONFIRMED'
  | 'IGNORED'
  | 'DUPLICATE'
  | 'REJECTED';

export type PermissionState =
  | 'NOT_REQUESTED'
  | 'GRANTED'
  | 'DENIED'
  | 'PERMANENTLY_DENIED'
  | 'DISABLED_BY_USER';

export type NotificationMode = 'INSTANT' | 'BATCH' | 'OFF';

export type VisibilityMode = 'PRIVATE' | 'SHARED_WITH_ADMIN' | 'FAMILY_SHARED';

export type LocationStatus =
  | 'AVAILABLE'
  | 'APPROXIMATE'
  | 'STALE'
  | 'UNAVAILABLE'
  | 'PERMISSION_DENIED'
  | 'NOT_CAPTURED';

export type LocationSource =
  | 'LIVE_LOCATION'
  | 'LOCATION_SNAPSHOT'
  | 'CACHED_LOCATION'
  | 'NONE';

export type LocationConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

export type LocationMatchTimestampType =
  | 'TRANSACTION_TIME'
  | 'SMS_RECEIVED_TIME'
  | 'NONE';

export interface TransactionLocationContext {
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  capturedAt: string | null;
  source: LocationSource;
  confidence: LocationConfidence;
  status: LocationStatus;
  locationLabel: string;
  matchTimestampType: LocationMatchTimestampType;
  timeDifferenceSeconds: number | null;
}

export interface LocationSnapshot {
  id?: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  capturedAt: string; // ISO 8601 string
  source: LocationSource;
  status?: LocationStatus;
  locationLabel?: string;
}

export interface LocationPermissionDetail {
  fineLocationGranted: boolean;
  coarseLocationGranted: boolean;
  locationServicesEnabled: boolean;
  permissionState: PermissionState;
  precision: 'PRECISE' | 'APPROXIMATE' | 'NONE';
}

export interface DetectedTransaction {
  id: string;
  userId: string;
  familyId: string;

  sourceType: SourceType;
  sourceIdentifier?: string;
  rawSourceHash: string;

  transactionType: TransactionType;
  direction: Direction;

  amount: number;
  currency: string;

  merchantRaw: string;
  merchantNormalized: string;

  upiId?: string;
  bankName?: string;
  accountLast4?: string;

  transactionReference?: string;
  transactionDateTime: string;
  smsReceivedDateTime?: string;
  detectedAt: string;

  categorySuggested: string;
  categoryConfidence: number; // 0.00 - 1.00

  status: TransactionStatus;
  duplicateOfTransactionId?: string;
  visibility: VisibilityMode;

  location?: TransactionLocationContext;

  sourceMetadata?: {
    sender?: string;
    parserUsed?: string;
    isTransfer?: boolean;
    isRefund?: boolean;
    matchedOriginalExpenseId?: string;
  };

  createdAt?: string;
  updatedAt?: string;
}

export interface ParsedTransactionResult {
  isFinancial: boolean;
  amount?: number;
  currency?: string;
  direction?: Direction;
  transactionType?: TransactionType;
  merchantRaw?: string;
  merchantNormalized?: string;
  upiId?: string;
  bankName?: string;
  accountLast4?: string;
  transactionReference?: string;
  transactionDateTime?: string;
  smsReceivedDateTime?: string;
  categorySuggested?: string;
  categoryConfidence?: number;
  isTransfer?: boolean;
  isRefund?: boolean;
  parserUsed?: string;
  rawSourceHash?: string;
  location?: TransactionLocationContext;
}

export interface SmartCaptureSettings {
  enabled: boolean;
  smsEnabled: boolean;
  notificationEnabled: boolean;
  autoCategorization: boolean;
  dailyReview: boolean;
  notificationMode: NotificationMode;
  privacyMode: boolean;
  historicalScanDays: number;
  locationCaptureEnabled: boolean;
  locationPrecision: 'APPROXIMATE' | 'PRECISE';
  locationRetentionHours: number; // 24, 72, 168 (7 days)
  showLocationOnExpenses: boolean;
}

export interface SmsPermissionDetail {
  readSmsGranted: boolean;
  receiveSmsGranted: boolean;
  permissionState: PermissionState;
}

export interface SmartExpenseDiagnostics {
  androidVersion?: string;
  apiLevel?: number;
  targetSdk?: number;
  manufacturer?: string;
  model?: string;
  readSmsPermission: boolean;
  receiveSmsPermission: boolean;
  smsInboxAccessible: boolean;
  smsInboxCount: number;
  inboxError?: string;
  receiverConfigured: boolean;
  receiverTriggerCount: number;
  lastSmsTimestamp?: string | null;
  capacitorPluginLoaded: boolean;
  pendingQueueCount: number;
  notificationCaptureImplemented: boolean;
  notificationStatusMessage: string;
  // Location Diagnostics
  locationPermissionGranted?: boolean;
  locationServicesEnabled?: boolean;
  locationPrecision?: 'PRECISE' | 'APPROXIMATE' | 'NONE';
  lastLocationSnapshot?: LocationSnapshot | null;
  lastMatchedLocation?: string;
  lastMatchConfidence?: LocationConfidence;
  lastTimeDifferenceSeconds?: number | null;
  snapshotStoreCount?: number;
}
