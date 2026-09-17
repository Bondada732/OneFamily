import React, { useState, useEffect } from 'react';
import { X, Check, Zap, ShieldCheck, Clock, RefreshCw, Smartphone, Bell, Eye, EyeOff } from 'lucide-react';
import { SmartCaptureSettings, PermissionState } from '../../services/smartExpense/types.js';
import { SmartExpenseService } from '../../services/smartExpense/SmartExpenseService.js';

interface SmartExpenseSettingsModalProps {
  isOpen: boolean;
  familyId: string;
  onClose: () => void;
  onSettingsSaved: () => void;
  onRunScan: (days: number) => void;
  onRequestPermission: () => void;
}

export const SmartExpenseSettingsModal: React.FC<SmartExpenseSettingsModalProps> = ({
  isOpen,
  familyId,
  onClose,
  onSettingsSaved,
  onRunScan,
  onRequestPermission,
}) => {
  if (!isOpen) return null;

  const [settings, setSettings] = useState<SmartCaptureSettings>({
    enabled: true,
    smsEnabled: true,
    notificationEnabled: false,
    autoCategorization: true,
    dailyReview: true,
    notificationMode: 'BATCH',
    privacyMode: false,
    historicalScanDays: 7,
  });
  const [permissionState, setPermissionState] = useState<PermissionState>('NOT_REQUESTED');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  useEffect(() => {
    SmartExpenseService.getSettings(familyId).then(setSettings);
    SmartExpenseService.getProvider().then((p) => p.getPermissionState().then(setPermissionState));
  }, [familyId]);

  const handleToggle = (key: keyof SmartCaptureSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    SmartExpenseService.updateSettings(familyId, updated);
  };

  const handleScan = async (days: number) => {
    setIsScanning(true);
    setScanResult(null);
    try {
      const res = await SmartExpenseService.runHistoricalScan(familyId, days);
      setScanResult(`Found & synced ${res.detectedCount} eligible transaction(s).`);
      onSettingsSaved();
    } catch (err: any) {
      setScanResult(`Scan error: ${err.message || 'Check permissions'}`);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn select-none">
      <div className="w-full max-w-sm rounded-3xl bg-[#0D152D] border border-slate-700/80 shadow-2xl p-5 space-y-4 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#16C7F2]/15 border border-[#16C7F2]/30 flex items-center justify-center text-[#16C7F2]">
              <Zap className="w-4 h-4 fill-[#16C7F2]/30" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">Smart Capture Settings</h3>
              <p className="text-[10px] text-slate-400">Manage device SMS & transaction detection</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toggles List */}
        <div className="space-y-2.5 text-xs">
          {/* SMS Detection Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 border border-slate-700/70">
            <div className="space-y-0.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#16C7F2]" />
                <span>SMS Transaction Detection</span>
              </div>
              <p className="text-[10px] text-slate-400">Detect eligible bank/UPI messages</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('smsEnabled')}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.smsEnabled ? 'bg-[#10B981]' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.smsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Auto Categorization Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 border border-slate-700/70">
            <div className="space-y-0.5">
              <div className="font-bold text-white">Smart Categorization</div>
              <p className="text-[10px] text-slate-400">Suggest category using rules & history</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('autoCategorization')}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.autoCategorization ? 'bg-[#10B981]' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.autoCategorization ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Daily Review Reminder */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 border border-slate-700/70">
            <div className="space-y-0.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Daily Review Reminder</span>
              </div>
              <p className="text-[10px] text-slate-400">Summary card of today's detected spends</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('dailyReview')}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.dailyReview ? 'bg-[#10B981]' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.dailyReview ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Historical Scan Section */}
        <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-[11px] uppercase tracking-wider">
              Find Recent Transactions
            </span>
            <RefreshCw className={`w-3.5 h-3.5 text-[#16C7F2] ${isScanning ? 'animate-spin' : ''}`} />
          </div>
          <p className="text-[10px] text-slate-400">
            Scan your device's recent bank SMS to populate the review queue:
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              disabled={isScanning}
              onClick={() => handleScan(7)}
              className="flex-1 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-[11px] transition-colors disabled:opacity-50"
            >
              Last 7 Days
            </button>
            <button
              type="button"
              disabled={isScanning}
              onClick={() => handleScan(30)}
              className="flex-1 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-[11px] transition-colors disabled:opacity-50"
            >
              Last 30 Days
            </button>
          </div>

          {scanResult && (
            <p className="text-[10.5px] font-semibold text-[#55D98A] pt-1">
              {scanResult}
            </p>
          )}
        </div>

        {/* Permissions & Security Badge */}
        <div className="p-3 rounded-2xl bg-[#0869E8]/10 border border-[#0869E8]/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#16C7F2]" />
            <span className="text-[11px] text-slate-300">Device SMS Permission</span>
          </div>
          <button
            type="button"
            onClick={onRequestPermission}
            className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold"
          >
            {permissionState === 'GRANTED' ? 'Granted ✓' : 'Check / Grant'}
          </button>
        </div>

        {/* Done Button */}
        <button
          type="button"
          onClick={() => {
            onSettingsSaved();
            onClose();
          }}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#168BFF] to-[#16C7F2] text-slate-950 hover:text-white font-black text-xs shadow-lg shadow-[#168BFF]/20 transition-all"
        >
          Done
        </button>
      </div>
    </div>
  );
};
