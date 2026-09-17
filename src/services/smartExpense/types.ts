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
  detectedAt: string;

  categorySuggested: string;
  categoryConfidence: number; // 0.00 - 1.00

  status: TransactionStatus;
  duplicateOfTransactionId?: string;
  visibility: VisibilityMode;

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
  categorySuggested?: string;
  categoryConfidence?: number;
  isTransfer?: boolean;
  isRefund?: boolean;
  parserUsed?: string;
  rawSourceHash?: string;
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
}

