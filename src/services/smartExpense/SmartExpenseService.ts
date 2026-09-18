import { apiRequest } from '../../utils/api.js';
import {
  DetectedTransaction,
  SmartCaptureSettings,
  PermissionState,
  ParsedTransactionResult,
  SmsPermissionDetail,
  SmartExpenseDiagnostics,
  TransactionLocationContext,
} from './types.js';
import { AndroidSmsCaptureProvider, WebCaptureProvider, TransactionCaptureProvider } from './TransactionCaptureProvider.js';
import { TransactionParserPipeline } from './TransactionParser.js';
import { ExpenseLocationService } from './ExpenseLocationService.js';

class SmartExpenseManager {
  private provider: TransactionCaptureProvider = new AndroidSmsCaptureProvider();
  private webProvider: TransactionCaptureProvider = new WebCaptureProvider();
  private isCapturing: boolean = false;

  // Get active capture provider
  public getProvider = async (): Promise<TransactionCaptureProvider> => {
    if (await this.provider.isAvailable()) {
      return this.provider;
    }
    return this.webProvider;
  };

  // Check detailed SMS permissions
  public checkDetailedPermissions = async (): Promise<SmsPermissionDetail> => {
    const provider = await this.getProvider();
    if (provider.checkDetailedPermissions) {
      return await provider.checkDetailedPermissions();
    }
    const state = await provider.getPermissionState();
    return {
      readSmsGranted: state === 'GRANTED',
      receiveSmsGranted: state === 'GRANTED',
      permissionState: state,
    };
  };

  // Request detailed runtime SMS permissions
  public requestDetailedPermissions = async (): Promise<SmsPermissionDetail> => {
    const provider = await this.getProvider();
    if (provider.requestDetailedPermissions) {
      return await provider.requestDetailedPermissions();
    }
    const state = await provider.requestPermission();
    return {
      readSmsGranted: state === 'GRANTED',
      receiveSmsGranted: state === 'GRANTED',
      permissionState: state,
    };
  };

  // Query SMS Inbox count via ContentResolver (Diagnostic)
  public getRecentSmsCount = async (): Promise<{ accessible: boolean; count: number; error?: string }> => {
    const provider = await this.getProvider();
    if (provider.getRecentSmsCount) {
      return await provider.getRecentSmsCount();
    }
    return { accessible: false, count: 0, error: 'Provider does not support SMS count' };
  };

  // Run full system diagnostics (SMS + Location + Native Plugin)
  public runDiagnostics = async (): Promise<SmartExpenseDiagnostics> => {
    const provider = await this.getProvider();
    let diag: SmartExpenseDiagnostics = {
      readSmsPermission: false,
      receiveSmsPermission: false,
      smsInboxAccessible: false,
      smsInboxCount: 0,
      receiverConfigured: false,
      receiverTriggerCount: 0,
      capacitorPluginLoaded: false,
      pendingQueueCount: 0,
      notificationCaptureImplemented: false,
      notificationStatusMessage: 'Web mode',
    };

    if (provider.runDiagnostics) {
      diag = await provider.runDiagnostics();
    }

    try {
      const locDiag = await ExpenseLocationService.getLocationDiagnostics();
      diag.locationPermissionGranted = locDiag.locationPermissionGranted;
      diag.locationServicesEnabled = locDiag.locationServicesEnabled;
      diag.locationPrecision = locDiag.locationPrecision;
      diag.lastLocationSnapshot = locDiag.lastLocationSnapshot;
      diag.snapshotStoreCount = locDiag.snapshotStoreCount;
    } catch (e) {
      console.warn('Diagnostics location check error:', e);
    }

    return diag;
  };

  // Drain pending SMS captured while app was closed or in background
  public drainPendingOfflineSms = async (familyId: string): Promise<number> => {
    if (!familyId) return 0;
    try {
      const provider = await this.getProvider();
      if (provider.getPendingIncomingSms) {
        const offlinePending = await provider.getPendingIncomingSms();
        if (offlinePending.length > 0) {
          const res = await this.ingestDetectedTransactions(familyId, offlinePending);
          return res.ingestedCount;
        }
      }
    } catch (err) {
      console.warn('Failed to drain pending offline SMS:', err);
    }
    return 0;
  };

  // 1. Fetch All Transactions for Family
  public async fetchAllTransactions(familyId: string): Promise<{
    pending: DetectedTransaction[];
    confirmed: DetectedTransaction[];
    ignored: DetectedTransaction[];
    summary: { pendingCount: number; pendingTotal: number; confirmedCount: number };
  }> {
    if (!familyId) return { pending: [], confirmed: [], ignored: [], summary: { pendingCount: 0, pendingTotal: 0, confirmedCount: 0 } };
    try {
      // First, attempt to drain any offline pending SMS into backend
      await this.drainPendingOfflineSms(familyId);

      const data = await apiRequest(`/smart-expenses/${familyId}/all`);
      return {
        pending: (data.pending || []).map(this.mapServerToClient),
        confirmed: (data.confirmed || []).map(this.mapServerToClient),
        ignored: (data.ignored || []).map(this.mapServerToClient),
        summary: data.summary || { pendingCount: 0, pendingTotal: 0, confirmedCount: 0 },
      };
    } catch (err) {
      console.error('Failed to fetch smart expenses:', err);
      return { pending: [], confirmed: [], ignored: [], summary: { pendingCount: 0, pendingTotal: 0, confirmedCount: 0 } };
    }
  }

  // 2. Ingest Batch of Newly Detected Transactions (with Location Enrichment)
  public async ingestDetectedTransactions(
    familyId: string,
    parsedList: ParsedTransactionResult[]
  ): Promise<{ ingestedCount: number; duplicatesCount: number }> {
    if (!familyId || !parsedList || parsedList.length === 0) {
      return { ingestedCount: 0, duplicatesCount: 0 };
    }

    const settings = await this.getSettings(familyId);

    // Location enrichment pipeline
    const enrichedList: ParsedTransactionResult[] = [];
    for (const p of parsedList) {
      let locContext = p.location;
      if (!locContext && settings.locationCaptureEnabled) {
        try {
          locContext = await ExpenseLocationService.findBestLocationForTransaction(
            p.transactionDateTime,
            p.smsReceivedDateTime,
            true,
            settings.locationRetentionHours
          );
        } catch (locErr) {
          console.warn('Location enrichment failed for transaction, continuing without location:', locErr);
        }
      }

      enrichedList.push({
        ...p,
        location: locContext || {
          latitude: null,
          longitude: null,
          accuracyMeters: null,
          capturedAt: null,
          source: 'NONE',
          confidence: 'NONE',
          status: settings.locationCaptureEnabled ? 'UNAVAILABLE' : 'NOT_CAPTURED',
          locationLabel: '',
          matchTimestampType: 'NONE',
          timeDifferenceSeconds: null,
        },
      });
    }

    const payload = enrichedList.map((p) => ({
      source_type: 'SMS',
      source_hash: p.rawSourceHash,
      transaction_type: p.transactionType || 'UPI',
      direction: p.direction || 'DEBIT',
      amount: p.amount,
      currency: p.currency || 'INR',
      merchant_raw: p.merchantRaw,
      merchant_normalized: p.merchantNormalized,
      upiId: p.upiId,
      bank_name: p.bankName,
      account_last4: p.accountLast4,
      transaction_reference: p.transactionReference,
      transaction_datetime: p.transactionDateTime || new Date().toISOString(),
      sms_received_datetime: p.smsReceivedDateTime || new Date().toISOString(),
      category_suggested: p.categorySuggested,
      category_confidence: p.categoryConfidence,
      visibility: 'PRIVATE',
      location: p.location,
    }));

    try {
      const res = await apiRequest(`/smart-expenses/${familyId}/detected`, {
        method: 'POST',
        body: JSON.stringify({ transactions: payload }),
      });
      return {
        ingestedCount: res.ingestedCount || 0,
        duplicatesCount: res.duplicatesCount || 0,
      };
    } catch (err) {
      console.error('Failed to ingest detected transactions:', err);
      return { ingestedCount: 0, duplicatesCount: 0 };
    }
  }

  // 3. Confirm Transaction -> Creates Real Expense in Ledger
  public async confirmTransaction(
    familyId: string,
    transactionId: string,
    overrides?: {
      amount?: number;
      merchant?: string;
      category_name?: string;
      date?: string;
      notes?: string;
      location?: string;
      savePreference?: boolean;
    }
  ): Promise<boolean> {
    if (!familyId || !transactionId) return false;
    try {
      const res = await apiRequest(`/smart-expenses/${familyId}/confirm/${transactionId}`, {
        method: 'POST',
        body: JSON.stringify(overrides || {}),
      });
      return !!res.success;
    } catch (err) {
      console.error('Failed to confirm smart expense:', err);
      return false;
    }
  }

  // 4. Bulk Confirm Transactions
  public async bulkConfirmTransactions(familyId: string, transactionIds?: string[]): Promise<number> {
    if (!familyId) return 0;
    try {
      const res = await apiRequest(`/smart-expenses/${familyId}/bulk-confirm`, {
        method: 'POST',
        body: JSON.stringify({ transactionIds }),
      });
      return res.confirmedCount || 0;
    } catch (err) {
      console.error('Failed to bulk confirm smart expenses:', err);
      return 0;
    }
  }

  // 5. Ignore Transaction
  public async ignoreTransaction(familyId: string, transactionId: string): Promise<boolean> {
    if (!familyId || !transactionId) return false;
    try {
      const res = await apiRequest(`/smart-expenses/${familyId}/ignore/${transactionId}`, {
        method: 'POST',
      });
      return !!res.success;
    } catch (err) {
      console.error('Failed to ignore smart expense:', err);
      return false;
    }
  }

  // 6. Remove Location from a Detected Expense
  public async removeTransactionLocation(familyId: string, transactionId: string): Promise<boolean> {
    if (!familyId || !transactionId) return false;
    try {
      const res = await apiRequest(`/smart-expenses/${familyId}/detected/${transactionId}/location`, {
        method: 'DELETE',
      });
      return !!res.success;
    } catch (err) {
      console.error('Failed to remove location from transaction:', err);
      return false;
    }
  }

  // 7. Get Settings
  public async getSettings(familyId: string): Promise<SmartCaptureSettings> {
    const defaultSettings: SmartCaptureSettings = {
      enabled: false,
      smsEnabled: false,
      notificationEnabled: false,
      autoCategorization: true,
      dailyReview: true,
      notificationMode: 'BATCH',
      privacyMode: false,
      historicalScanDays: 7,
      locationCaptureEnabled: false,
      locationPrecision: 'APPROXIMATE',
      locationRetentionHours: 72,
      showLocationOnExpenses: true,
    };

    if (!familyId) return defaultSettings;
    try {
      const res = await apiRequest(`/smart-expenses/${familyId}/settings`);
      const s = res.settings || {};
      return {
        enabled: !!s.enabled,
        smsEnabled: !!s.sms_enabled,
        notificationEnabled: !!s.notification_enabled,
        autoCategorization: s.auto_categorization !== false,
        dailyReview: s.daily_review !== false,
        notificationMode: s.notification_mode || 'BATCH',
        privacyMode: !!s.privacy_mode,
        historicalScanDays: s.historical_scan_days || 7,
        locationCaptureEnabled: !!s.location_capture_enabled,
        locationPrecision: s.location_precision || 'APPROXIMATE',
        locationRetentionHours: s.location_retention_hours || 72,
        showLocationOnExpenses: s.show_location_on_expenses !== false,
      };
    } catch {
      return defaultSettings;
    }
  }

  // 8. Update Settings
  public updateSettings = async (familyId: string, settings: Partial<SmartCaptureSettings>): Promise<boolean> => {
    if (!familyId) return false;
    try {
      const payload: any = {};
      if (settings.enabled !== undefined) payload.enabled = settings.enabled;
      if (settings.smsEnabled !== undefined) payload.sms_enabled = settings.smsEnabled;
      if (settings.notificationEnabled !== undefined) payload.notification_enabled = settings.notificationEnabled;
      if (settings.autoCategorization !== undefined) payload.auto_categorization = settings.autoCategorization;
      if (settings.dailyReview !== undefined) payload.daily_review = settings.dailyReview;
      if (settings.notificationMode !== undefined) payload.notification_mode = settings.notificationMode;
      if (settings.privacyMode !== undefined) payload.privacy_mode = settings.privacyMode;
      if (settings.historicalScanDays !== undefined) payload.historical_scan_days = settings.historicalScanDays;
      if (settings.locationCaptureEnabled !== undefined) payload.location_capture_enabled = settings.locationCaptureEnabled;
      if (settings.locationPrecision !== undefined) payload.location_precision = settings.locationPrecision;
      if (settings.locationRetentionHours !== undefined) payload.location_retention_hours = settings.locationRetentionHours;
      if (settings.showLocationOnExpenses !== undefined) payload.show_location_on_expenses = settings.showLocationOnExpenses;

      await apiRequest(`/smart-expenses/${familyId}/settings`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return true;
    } catch (err) {
      console.error('Failed to update smart capture settings:', err);
      return false;
    }
  };

  // 9. Run Historical Scan
  public runHistoricalScan = async (familyId: string, days: number = 7): Promise<{ detectedCount: number; message?: string }> => {
    const isNative = (window as any).Capacitor?.isNativePlatform?.() || false;
    const hasPlugin = !!(window as any).Capacitor?.Plugins?.SmsTransactionPlugin;

    if (!isNative || !hasPlugin) {
      return {
        detectedCount: 0,
        message: 'No messages to read: SMS capture is only active on Android mobile devices with SMS access.',
      };
    }

    const provider = await this.getProvider();
    const detected = await provider.scanHistorical(days);
    if (detected.length > 0) {
      const res = await this.ingestDetectedTransactions(familyId, detected);
      return {
        detectedCount: res.ingestedCount,
        message: res.ingestedCount > 0
          ? `Found & synced ${res.ingestedCount} eligible transaction(s).`
          : 'No new financial SMS transactions found in the selected period.',
      };
    }

    return {
      detectedCount: 0,
      message: 'No financial SMS transactions found in the selected period.',
    };
  };

  // 10. Parse and Ingest Single Raw SMS Text (for manual testing / paste)
  public parseAndIngestRawSms = async (
    familyId: string,
    text: string
  ): Promise<{ success: boolean; transaction?: any; message: string }> => {
    if (!text || !text.trim()) {
      return { success: false, message: 'Please paste a valid SMS message text.' };
    }

    const effectiveFamilyId =
      familyId ||
      localStorage.getItem('onefamily_family_id') ||
      (() => {
        try {
          return JSON.parse(localStorage.getItem('onefamily_user') || '{}')?.family_id;
        } catch {
          return '';
        }
      })();

    if (!effectiveFamilyId) {
      return { success: false, message: 'Active household/family not found. Please log in again.' };
    }

    const parsed = TransactionParserPipeline.parse(text);
    if (!parsed) {
      return {
        success: false,
        message: 'Could not extract financial transaction details from the pasted message. Ensure it has an amount (e.g. Rs 500) and debit/transfer information.',
      };
    }

    const res = await this.ingestDetectedTransactions(effectiveFamilyId, [parsed]);
    if (res.ingestedCount > 0) {
      return {
        success: true,
        transaction: parsed,
        message: `Successfully captured: ${parsed.merchantNormalized || 'Payee'} ₹${parsed.amount}`,
      };
    }
    return {
      success: false,
      message: 'This transaction was already ingested previously (duplicate reference/hash).',
    };
  };

  // 11. Real-time Live SMS listener on device
  public startLiveCapture = async (familyId: string, onNewTransaction?: () => void): Promise<void> => {
    if (this.isCapturing || !familyId) return;

    try {
      const isNative = (window as any).Capacitor?.isNativePlatform?.() || false;
      const hasPlugin = !!(window as any).Capacitor?.Plugins?.SmsTransactionPlugin;
      if (!isNative || !hasPlugin) return;

      const provider = await this.getProvider();
      this.isCapturing = true;

      await provider.startCapture(async (tx) => {
        try {
          const res = await this.ingestDetectedTransactions(familyId, [tx]);
          if (res.ingestedCount > 0 && onNewTransaction) {
            onNewTransaction();
          }
        } catch (e) {
          console.error('Error ingesting live detected SMS transaction:', e);
        }
      });
    } catch (err) {
      console.warn('Failed to start live SMS capture:', err);
      this.isCapturing = false;
    }
  };

  public stopLiveCapture = async (): Promise<void> => {
    if (!this.isCapturing) return;
    try {
      const provider = await this.getProvider();
      await provider.stopCapture();
      this.isCapturing = false;
    } catch (err) {
      console.warn('Failed to stop live capture:', err);
    }
  };

  private mapServerToClient(item: any): DetectedTransaction {
    let locContext: TransactionLocationContext | undefined = undefined;

    if (item.location && typeof item.location === 'object') {
      locContext = item.location;
    } else if (item.location_label || item.location_status || item.location_latitude) {
      locContext = {
        latitude: item.location_latitude ?? null,
        longitude: item.location_longitude ?? null,
        accuracyMeters: item.location_accuracy_meters ?? null,
        capturedAt: item.location_captured_at ?? null,
        source: item.location_source || 'NONE',
        confidence: item.location_confidence || 'NONE',
        status: item.location_status || 'NOT_CAPTURED',
        locationLabel: item.location_label || '',
        matchTimestampType: item.location_match_timestamp_type || 'NONE',
        timeDifferenceSeconds: item.location_time_difference_seconds ?? null,
      };
    }

    return {
      id: item.id,
      userId: item.user_id,
      familyId: item.family_id,
      sourceType: item.source_type,
      rawSourceHash: item.source_hash,
      transactionType: item.transaction_type,
      direction: item.direction,
      amount: Number(item.amount) || 0,
      currency: item.currency || 'INR',
      merchantRaw: item.merchant_raw,
      merchantNormalized: item.merchant_normalized || item.merchant_raw,
      upiId: item.upi_id,
      bankName: item.bank_name,
      accountLast4: item.account_last4,
      transactionReference: item.transaction_reference,
      transactionDateTime: item.transaction_datetime,
      smsReceivedDateTime: item.sms_received_datetime,
      detectedAt: item.created_at,
      categorySuggested: item.category_suggested || 'Miscellaneous',
      categoryConfidence: typeof item.category_confidence === 'number' ? item.category_confidence : 0.85,
      status: item.status,
      visibility: item.visibility || 'PRIVATE',
      location: locContext,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
  }
}

export const SmartExpenseService = new SmartExpenseManager();
