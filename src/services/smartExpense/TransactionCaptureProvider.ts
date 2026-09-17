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

// 2. Web / Desktop Fallback Provider (No dummy data - returns empty list)
export class WebCaptureProvider implements TransactionCaptureProvider {
  id = 'web_capture';
  name = 'Web SMS Provider (No SMS Access)';

  async isAvailable(): Promise<boolean> {
    return false;
  }

  async getPermissionState(): Promise<PermissionState> {
    return 'DENIED';
  }

  async requestPermission(): Promise<PermissionState> {
    return 'DENIED';
  }

  async startCapture(): Promise<void> {}

  async scanHistorical(): Promise<ParsedTransactionResult[]> {
    return []; // No dummy transactions
  }

  async stopCapture(): Promise<void> {}
}
