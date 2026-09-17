import { PermissionState, ParsedTransactionResult } from './types.js';
import { TransactionParserPipeline } from './TransactionParser.js';

export interface TransactionCaptureProvider {
  id: string;
  name: string;
  isAvailable(): Promise<boolean>;
  getPermissionState(): Promise<PermissionState>;
  requestPermission(): Promise<PermissionState>;
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

  async startCapture(onTransactionDetected: (tx: ParsedTransactionResult) => void): Promise<void> {
    try {
      const plugin = (window as any).Capacitor?.Plugins?.SmsTransactionPlugin;
      if (!plugin) return;

      plugin.addListener('smsReceived', (event: { body: string; sender: string; timestamp?: string }) => {
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

  async scanRecent(days: number = 7): Promise<ParsedTransactionResult[]> {
    return this.scanHistorical(days);
  }

  async scanHistorical(days: number = 7): Promise<ParsedTransactionResult[]> {
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

// 2. Synthetic Test / Statement Import Provider (for Web Preview & Unit Testing)
export class MockStatementProvider implements TransactionCaptureProvider {
  id = 'mock_statement';
  name = 'Sample Transaction Import';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async getPermissionState(): Promise<PermissionState> {
    return 'GRANTED';
  }

  async requestPermission(): Promise<PermissionState> {
    return 'GRANTED';
  }

  async startCapture(onTransactionDetected: (tx: ParsedTransactionResult) => void): Promise<void> {
    // Simulator trigger
  }

  async scanHistorical(days: number = 7): Promise<ParsedTransactionResult[]> {
    const now = Date.now();
    const syntheticMessages = [
      { sender: 'VM-HDFCBK', body: 'Rs 450.00 debited from A/c **1978 via UPI to swiggy@upi. Ref 425619876231', timestamp: String(now - 2 * 3600 * 1000) },
      { sender: 'VK-SBIINB', body: 'Dear SBI User, A/C 1978 debited by Rs 1280.00 on 17Sep26 transfer to AMAZON UPI Ref 425619876232', timestamp: String(now - 5 * 3600 * 1000) },
      { sender: 'AD-ICICIB', body: 'ICICI Bank Acct XX1978 debited for Rs 320.00 on 16-Sep-26; Uber credited. UPI:425619876233', timestamp: String(now - 24 * 3600 * 1000) },
      { sender: 'BW-KOTAKB', body: 'Kotak Bank: Rs 150 debited from A/c XX1978 via UPI to Blinkit on 15-Sep-26. Ref 425619876234', timestamp: String(now - 48 * 3600 * 1000) },
      { sender: 'VM-AXISBK', body: 'Axis Bank: INR 650.00 paid to Apollo Pharmacy via UPI on 14-Sep-26. Ref 425619876235', timestamp: String(now - 72 * 3600 * 1000) },
    ];

    const results: ParsedTransactionResult[] = [];
    for (const msg of syntheticMessages) {
      const parsed = TransactionParserPipeline.parse(msg.body, msg.sender, {}, msg.timestamp);
      if (parsed) {
        results.push(parsed);
      }
    }
    return results;
  }

  async stopCapture(): Promise<void> {}
}
