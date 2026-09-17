import { apiRequest } from '../../utils/api.js';
import { DetectedTransaction, SmartCaptureSettings, PermissionState, ParsedTransactionResult } from './types.js';
import { AndroidSmsCaptureProvider, WebCaptureProvider, TransactionCaptureProvider } from './TransactionCaptureProvider.js';

class SmartExpenseManager {
  private provider: TransactionCaptureProvider = new AndroidSmsCaptureProvider();
  private webProvider: TransactionCaptureProvider = new WebCaptureProvider();

  // Get active capture provider
  public async getProvider(): Promise<TransactionCaptureProvider> {
    if (await this.provider.isAvailable()) {
      return this.provider;
    }
    return this.webProvider;
  }

  // 1. Fetch All Transactions for Family
  public async fetchAllTransactions(familyId: string): Promise<{
    pending: DetectedTransaction[];
    confirmed: DetectedTransaction[];
    ignored: DetectedTransaction[];
    summary: { pendingCount: number; pendingTotal: number; confirmedCount: number };
  }> {
    if (!familyId) return { pending: [], confirmed: [], ignored: [], summary: { pendingCount: 0, pendingTotal: 0, confirmedCount: 0 } };
    try {
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

  // 2. Ingest Batch of Newly Detected Transactions
  public async ingestDetectedTransactions(familyId: string, parsedList: ParsedTransactionResult[]): Promise<{ ingestedCount: number; duplicatesCount: number }> {
    if (!familyId || !parsedList || parsedList.length === 0) {
      return { ingestedCount: 0, duplicatesCount: 0 };
    }

    const payload = parsedList.map((p) => ({
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
      category_suggested: p.categorySuggested,
      category_confidence: p.categoryConfidence,
      visibility: 'PRIVATE',
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

  // 6. Get Settings
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
      };
    } catch {
      return defaultSettings;
    }
  }

  // 7. Update Settings
  public async updateSettings(familyId: string, settings: Partial<SmartCaptureSettings>): Promise<boolean> {
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

      await apiRequest(`/smart-expenses/${familyId}/settings`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return true;
    } catch (err) {
      console.error('Failed to update smart capture settings:', err);
      return false;
    }
  }

  // 8. Run Historical Scan
  public async runHistoricalScan(familyId: string, days: number = 7): Promise<{ detectedCount: number; message?: string }> {
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
      message: 'No eligible financial SMS messages found on device.',
    };
  }

  private mapServerToClient(item: any): DetectedTransaction {
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
      detectedAt: item.created_at,
      categorySuggested: item.category_suggested || 'Miscellaneous',
      categoryConfidence: typeof item.category_confidence === 'number' ? item.category_confidence : 0.85,
      status: item.status,
      visibility: item.visibility || 'PRIVATE',
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
  }
}

export const SmartExpenseService = new SmartExpenseManager();
