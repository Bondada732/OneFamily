import { PermissionState, ParsedTransactionResult, SmsPermissionDetail, SmartExpenseDiagnostics } from './types.js';
import { TransactionParserPipeline } from './TransactionParser.js';

export interface TransactionCaptureProvider {
  id: string;
  name: string;
  isAvailable(): Promise<boolean>;
  getPermissionState(): Promise<PermissionState>;
  requestPermission(): Promise<PermissionState>;
  checkDetailedPermissions?(): Promise<SmsPermissionDetail>;
  requestDetailedPermissions?(): Promise<SmsPermissionDetail>;
  getRecentSmsCount?(): Promise<{ accessible: boolean; count: number; error?: string }>;
  getPendingIncomingSms?(): Promise<ParsedTransactionResult[]>;
  runDiagnostics?(): Promise<SmartExpenseDiagnostics>;
  startCapture(onTransactionDetected: (tx: ParsedTransactionResult) => void): Promise<void>;
  scanHistorical(days: number): Promise<ParsedTransactionResult[]>;
  stopCapture(): Promise<void>;
}

// 1. Android Native Financial SMS Capture Provider
export class AndroidSmsCaptureProvider implements TransactionCaptureProvider {
  id = 'android_sms';
  name = 'Android Financial SMS Capture';

  async isAvailable(): Promise<boolean> {
    const isNative = (window as any).Capacitor?.isNativePlatform?.() || false;
    const hasPlugin = !!(window as any).Capacitor?.Plugins?.SmsTransactionPlugin;
    return isNative && hasPlugin;
  }

  async getPermissionState(): Promise<PermissionState> {
    try {
      const plugin = (window as any).Capacitor?.Plugins?.SmsTransactionPlugin;
      if (!plugin) return 'NOT_REQUESTED';
      const res = await plugin.checkPermission();
      return res.permissionState || 'NOT_REQUESTED';
    } catch {
      return 'NOT_REQUESTED';
    }
  }

  async checkDetailedPermissions(): Promise<SmsPermissionDetail> {
    try {
      const plugin = (window as any).Capacitor?.Plugins?.SmsTransactionPlugin;
      if (!plugin) {
        return { readSmsGranted: false, receiveSmsGranted: false, permissionState: 'NOT_REQUESTED' };
      }
      const res = await plugin.checkSmsPermissions();
      return {
        readSmsGranted: !!res.readSmsGranted,
        receiveSmsGranted: !!res.receiveSmsGranted,
        permissionState: res.permissionState || (res.readSmsGranted && res.receiveSmsGranted ? 'GRANTED' : 'DENIED'),
      };
    } catch {
      return { readSmsGranted: false, receiveSmsGranted: false, permissionState: 'NOT_REQUESTED' };
    }
  }

  async requestPermission(): Promise<PermissionState> {
    try {
      const plugin = (window as any).Capacitor?.Plugins?.SmsTransactionPlugin;
      if (!plugin) return 'DENIED';
      const res = await plugin.requestPermission();
      return res.permissionState || 'DENIED';
    } catch {
      return 'DENIED';
    }
  }

  async requestDetailedPermissions(): Promise<SmsPermissionDetail> {
    try {
      const plugin = (window as any).Capacitor?.Plugins?.SmsTransactionPlugin;
      if (!plugin) {
        return { readSmsGranted: false, receiveSmsGranted: false, permissionState: 'DENIED' };
      }
      const res = await plugin.requestSmsPermissions();
      return {
        readSmsGranted: !!res.readSmsGranted,
        receiveSmsGranted: !!res.receiveSmsGranted,
        permissionState: res.permissionState || (res.readSmsGranted && res.receiveSmsGranted ? 'GRANTED' : 'DENIED'),
      };
    } catch {
      return { readSmsGranted: false, receiveSmsGranted: false, permissionState: 'DENIED' };
    }
  }

  async getRecentSmsCount(): Promise<{ accessible: boolean; count: number; error?: string }> {
    try {
      const plugin = (window as any).Capacitor?.Plugins?.SmsTransactionPlugin;
      if (!plugin) return { accessible: false, count: 0, error: 'Plugin not loaded' };
      const res = await plugin.getRecentSmsCount();
      return {
        accessible: !!res.accessible,
        count: res.count || 0,
        error: res.error,
      };
    } catch (err: any) {
      return { accessible: false, count: 0, error: err?.message || 'Error querying inbox' };
    }
  }

  async getPendingIncomingSms(): Promise<ParsedTransactionResult[]> {
    try {
      const plugin = (window as any).Capacitor?.Plugins?.SmsTransactionPlugin;
      if (!plugin) return [];

      const res = await plugin.getPendingIncomingSms();
      const messages: Array<{ body: string; sender: string; timestamp?: string }> = res.messages || [];

      const parsedList: ParsedTransactionResult[] = [];
      for (const msg of messages) {
        const parsed = TransactionParserPipeline.parse(msg.body, msg.sender, {}, msg.timestamp);
        if (parsed) {
          parsedList.push(parsed);
        }
      }
      return parsedList;
    } catch (err) {
      console.warn('Could not drain pending SMS queue:', err);
      return [];
    }
  }

  async runDiagnostics(): Promise<SmartExpenseDiagnostics> {
    try {
      const plugin = (window as any).Capacitor?.Plugins?.SmsTransactionPlugin;
      if (!plugin) {
        return {
          readSmsPermission: false,
          receiveSmsPermission: false,
          smsInboxAccessible: false,
          smsInboxCount: 0,
          receiverConfigured: false,
          receiverTriggerCount: 0,
          capacitorPluginLoaded: false,
          pendingQueueCount: 0,
          notificationCaptureImplemented: false,
          notificationStatusMessage: 'Plugin not available in web mode',
        };
      }
      return await plugin.runSmartExpenseDiagnostics();
    } catch (err: any) {
      return {
        readSmsPermission: false,
        receiveSmsPermission: false,
        smsInboxAccessible: false,
        smsInboxCount: 0,
        inboxError: err?.message,
        receiverConfigured: false,
        receiverTriggerCount: 0,
        capacitorPluginLoaded: true,
        pendingQueueCount: 0,
        notificationCaptureImplemented: false,
        notificationStatusMessage: 'Diagnostic failed: ' + err?.message,
      };
    }
  }

  async startCapture(onTransactionDetected: (tx: ParsedTransactionResult) => void): Promise<void> {
    try {
      const plugin = (window as any).Capacitor?.Plugins?.SmsTransactionPlugin;
      if (!plugin) return;

      // Listen to both event names for maximum compatibility
      plugin.addListener('smsReceived', (event: { body: string; sender: string; timestamp?: string }) => {
        if (!event || !event.body) return;
        const parsed = TransactionParserPipeline.parse(event.body, event.sender, {}, event.timestamp);
        if (parsed) {
          onTransactionDetected(parsed);
        }
      });

      plugin.addListener('transactionSmsReceived', (event: { body: string; sender: string; timestamp?: string }) => {
        if (!event || !event.body) return;
        const parsed = TransactionParserPipeline.parse(event.body, event.sender, {}, event.timestamp);
        if (parsed) {
          onTransactionDetected(parsed);
        }
      });

      await plugin.startListener();
    } catch (err) {
      console.warn('Could not start SMS listener:', err);
    }
  }

  async scanRecent(days: number = 14): Promise<ParsedTransactionResult[]> {
    return this.scanHistorical(days);
  }

  async scanHistorical(days: number = 14): Promise<ParsedTransactionResult[]> {
    try {
      const plugin = (window as any).Capacitor?.Plugins?.SmsTransactionPlugin;
      if (!plugin) return [];

      const res = await plugin.scanRecentSms({ days });
      const rawMessages: Array<{ body: string; sender: string; timestamp?: string }> = res.messages || [];

      const results: ParsedTransactionResult[] = [];
      for (const msg of rawMessages) {
        const parsed = TransactionParserPipeline.parse(msg.body, msg.sender, {}, msg.timestamp);
        if (parsed) {
          results.push(parsed);
        }
      }
      return results;
    } catch (err) {
      console.warn('Historical scan error:', err);
      return [];
    }
  }

  async stopCapture(): Promise<void> {
    try {
      const plugin = (window as any).Capacitor?.Plugins?.SmsTransactionPlugin;
      if (plugin) {
        await plugin.stopListener();
      }
    } catch {}
  }
}

// 2. Web / Desktop Fallback Provider
export class WebCaptureProvider implements TransactionCaptureProvider {
  id = 'web_capture';
  name = 'Web SMS Provider (No Native SMS Access)';

  async isAvailable(): Promise<boolean> {
    return false;
  }

  async getPermissionState(): Promise<PermissionState> {
    return 'DENIED';
  }

  async requestPermission(): Promise<PermissionState> {
    return 'DENIED';
  }

  async checkDetailedPermissions(): Promise<SmsPermissionDetail> {
    return { readSmsGranted: false, receiveSmsGranted: false, permissionState: 'DENIED' };
  }

  async requestDetailedPermissions(): Promise<SmsPermissionDetail> {
    return { readSmsGranted: false, receiveSmsGranted: false, permissionState: 'DENIED' };
  }

  async getRecentSmsCount(): Promise<{ accessible: boolean; count: number; error?: string }> {
    return { accessible: false, count: 0, error: 'Web environment does not have native SMS inbox access' };
  }

  async getPendingIncomingSms(): Promise<ParsedTransactionResult[]> {
    return [];
  }

  async runDiagnostics(): Promise<SmartExpenseDiagnostics> {
    return {
      readSmsPermission: false,
      receiveSmsPermission: false,
      smsInboxAccessible: false,
      smsInboxCount: 0,
      inboxError: 'Web environment',
      receiverConfigured: false,
      receiverTriggerCount: 0,
      capacitorPluginLoaded: false,
      pendingQueueCount: 0,
      notificationCaptureImplemented: false,
      notificationStatusMessage: 'Running in browser/web mode (no Android telephony framework).',
    };
  }

  async startCapture(): Promise<void> {}

  async scanHistorical(): Promise<ParsedTransactionResult[]> {
    return [];
  }

  async stopCapture(): Promise<void> {}
}
