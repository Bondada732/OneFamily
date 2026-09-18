import React, { useState, useEffect } from 'react';
import { SmartExpenseService } from '../../services/smartExpense/SmartExpenseService.js';
import { SmartExpenseDiagnostics, SmsPermissionDetail } from '../../services/smartExpense/types.js';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Smartphone,
  RefreshCw,
  Inbox,
  Radio,
  BellOff,
  Layers,
  X,
  Zap,
} from 'lucide-react';

interface SmartExpenseDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyId?: string;
  onRefreshData?: () => void;
}

export const SmartExpenseDiagnosticsModal: React.FC<SmartExpenseDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  familyId = '',
  onRefreshData,
}) => {
  const [diagnostics, setDiagnostics] = useState<SmartExpenseDiagnostics | null>(null);
  const [permissions, setPermissions] = useState<SmsPermissionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastEventTime, setLastEventTime] = useState<string | null>(null);

  const runAllDiagnostics = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const [diag, perms] = await Promise.all([
        SmartExpenseService.runDiagnostics(),
        SmartExpenseService.checkDetailedPermissions(),
      ]);
      setDiagnostics(diag);
      setPermissions(perms);
      if (diag.lastSmsTimestamp) {
        setLastEventTime(new Date(Number(diag.lastSmsTimestamp)).toLocaleTimeString());
      }
    } catch (err: any) {
      setStatusMessage(`Diagnostics failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runAllDiagnostics();

      // Listen for diagnostic events from native plugin if available
      try {
        const plugin = (window as any).Capacitor?.Plugins?.SmsTransactionPlugin;
        if (plugin?.addListener) {
          plugin.addListener('smsReceivedDiagnostic', (evt: any) => {
            setLastEventTime(new Date().toLocaleTimeString());
            runAllDiagnostics();
          });
        }
      } catch (ignored) {}
    }
  }, [isOpen]);

  const isNative = (window as any).Capacitor?.isNativePlatform?.() || false;

  const handleRequestPermissions = async () => {
    setIsLoading(true);
    try {
      if (!isNative) {
        setStatusMessage(
          '📱 Desktop Web Mode: Native Android system permission dialogs and SMS hardware listeners only execute when running inside the KinoraOne APK on a physical Android phone.'
        );
        setIsLoading(false);
        return;
      }

      const perms = await SmartExpenseService.requestDetailedPermissions();
      setPermissions(perms);
      setStatusMessage(
        perms.readSmsGranted && perms.receiveSmsGranted
          ? '✓ SMS Permissions successfully granted by user.'
          : 'Permission request completed. One or more permissions were not granted in Android Settings.'
      );
      await runAllDiagnostics();
    } catch (err: any) {
      setStatusMessage(`Failed to request permissions: ${err?.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrainQueue = async () => {
    setIsLoading(true);
    try {
      const count = await SmartExpenseService.drainPendingOfflineSms(familyId);
      setStatusMessage(`Drained and ingested ${count} pending offline SMS message(s).`);
      if (onRefreshData) onRefreshData();
      await runAllDiagnostics();
    } catch (err: any) {
      setStatusMessage(`Failed to drain queue: ${err?.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 pt-6 pb-[max(env(safe-area-inset-bottom,0px),36px)] sm:p-4 overflow-y-auto">
      <div className="bg-[#0B132B] border border-cyan-500/30 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0D152D]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Smart Expense Diagnostics
              </h2>
              <p className="text-[11px] text-slate-400">Native Android SMS Pipeline Auditor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Web Environment Notice */}
          {!isNative && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-200">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Desktop Web Browser Mode</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                You are currently running in a web browser. Android Telephony APIs, system permission prompts, and background SMS receivers only run when the app is installed as an APK on a physical Android mobile phone.
              </p>
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-300">
              {statusMessage}
            </div>
          )}

          {/* 1. Device & Android Platform */}
          <div className="bg-[#0D152D] border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-200">
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-sky-400" />
                <span>Device & Android Platform</span>
              </span>
              <span className="text-[10px] text-slate-400">
                {diagnostics?.capacitorPluginLoaded ? 'Capacitor Native Bridge' : 'Web Fallback'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Android OS</span>
                <span className="font-semibold text-white">
                  v{diagnostics?.androidVersion || 'N/A'} (API {diagnostics?.apiLevel || 'N/A'})
                </span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Device Model</span>
                <span className="font-semibold text-white truncate block">
                  {diagnostics?.manufacturer || ''} {diagnostics?.model || 'Browser / Web'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Permissions Status */}
          <div className="bg-[#0D152D] border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between font-bold text-slate-200">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Android Runtime Permissions</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                permissions?.permissionState === 'GRANTED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {permissions?.permissionState || 'UNKNOWN'}
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-300">RECEIVE_SMS (Broadcast Listener)</span>
                <span className="flex items-center gap-1 font-bold">
                  {permissions?.receiveSmsGranted ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> GRANTED
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> DENIED
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-300">READ_SMS (Inbox Scanner)</span>
                <span className="flex items-center gap-1 font-bold">
                  {permissions?.readSmsGranted ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> GRANTED
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> DENIED
                    </span>
                  )}
                </span>
              </div>
            </div>

            {(!permissions?.readSmsGranted || !permissions?.receiveSmsGranted) && (
              <button
                onClick={handleRequestPermissions}
                className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-lg shadow transition-all"
              >
                Request Native Android Permissions
              </button>
            )}
          </div>

          {/* 3. Live BroadcastReceiver & Inbox Access */}
          <div className="bg-[#0D152D] border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between font-bold text-slate-200">
              <span className="flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-amber-400" />
                <span>Live BroadcastReceiver & ContentResolver</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Manifest Receiver</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Configured
                </span>
                <span className="text-[9px] text-slate-400 block mt-1">
                  Triggers: {diagnostics?.receiverTriggerCount || 0} times
                </span>
              </div>

              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">SMS Inbox Access</span>
                <span className="font-semibold text-white block mt-0.5">
                  {diagnostics?.smsInboxAccessible ? (
                    <span className="text-emerald-400">✓ {diagnostics.smsInboxCount} SMS found</span>
                  ) : (
                    <span className="text-rose-400">✗ Inaccessible</span>
                  )}
                </span>
                {diagnostics?.inboxError && (
                  <span className="text-[9px] text-rose-400 block mt-1 truncate">
                    {diagnostics.inboxError}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px]">
              <span className="text-slate-400">Last SMS Event Received</span>
              <span className="font-bold text-cyan-300">
                {lastEventTime || 'None yet in this session'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px]">
              <span className="text-slate-400">Offline Pending Queue (Closed App)</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-300">
                  {diagnostics?.pendingQueueCount || 0} queued
                </span>
                {(diagnostics?.pendingQueueCount || 0) > 0 && (
                  <button
                    onClick={handleDrainQueue}
                    className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded"
                  >
                    Sync Queue
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 4. Location Context Engine Diagnostics */}
          <div className="bg-[#0D152D] border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between font-bold text-slate-200">
              <span className="flex items-center gap-1.5">
                <span className="text-[#16C7F2]">📍</span>
                <span>Location Context & Geocoding Engine</span>
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                diagnostics?.locationPermissionGranted
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-700 text-slate-300'
              }`}>
                {diagnostics?.locationPermissionGranted ? 'ACTIVE' : 'OFF / DENIED'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Location Services</span>
                <span className="font-semibold text-white block mt-0.5">
                  {diagnostics?.locationServicesEnabled ? (
                    <span className="text-emerald-400">✓ Enabled (GPS/Net)</span>
                  ) : (
                    <span className="text-amber-400">Disabled in OS</span>
                  )}
                </span>
                <span className="text-[9px] text-slate-400 block mt-1">
                  Precision: {diagnostics?.locationPrecision || 'APPROXIMATE'}
                </span>
              </div>

              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Stored Snapshots</span>
                <span className="font-semibold text-white block mt-0.5">
                  {diagnostics?.snapshotStoreCount || 0} snapshots in store
                </span>
                <span className="text-[9px] text-slate-400 block mt-1">
                  Retention: 72h max cache
                </span>
              </div>
            </div>

            {diagnostics?.lastLocationSnapshot && (
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Latest Context:</span>
                  <span className="font-bold text-[#16C7F2]">
                    📍 {diagnostics.lastLocationSnapshot.locationLabel || 'Nearby Area'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Accuracy: ±{Math.round(diagnostics.lastLocationSnapshot.accuracyMeters)}m</span>
                  <span>Captured: {new Date(diagnostics.lastLocationSnapshot.capturedAt).toLocaleTimeString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* 5. Notification Capture Note */}
          <div className="bg-[#0D152D] border border-slate-800 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <BellOff className="w-4 h-4 text-slate-400" />
                <span>Notification Capture Engine</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400">Not Implemented</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              NotificationListenerService is not active. The app uses dedicated Android Manifest BroadcastReceiver (`android.provider.Telephony.SMS_RECEIVED`) for reliable bank/UPI SMS capture without battery drain.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0D152D] flex items-center justify-between">
          <button
            onClick={runAllDiagnostics}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Re-run Audit</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
