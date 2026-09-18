import React, { useState, useEffect } from 'react';
import { X, Zap, Smartphone, Clock, MapPin, Trash2, ShieldCheck, Check, Navigation, AlertCircle } from 'lucide-react';
import { SmartCaptureSettings, PermissionState, LocationPermissionDetail } from '../../services/smartExpense/types.js';
import { SmartExpenseService } from '../../services/smartExpense/SmartExpenseService.js';
import { ExpenseLocationService } from '../../services/smartExpense/ExpenseLocationService.js';

interface SmartExpenseSettingsModalProps {
  isOpen: boolean;
  familyId?: string;
  settings?: SmartCaptureSettings;
  onClose: () => void;
  onSettingsSaved?: () => void;
  onSaveSettings?: (settings: Partial<SmartCaptureSettings>) => void;
  onTriggerScan?: (days?: number) => Promise<void> | void;
  onRequestPermission?: () => void;
}

export const SmartExpenseSettingsModal: React.FC<SmartExpenseSettingsModalProps> = ({
  isOpen,
  familyId = '',
  settings: initialSettings,
  onClose,
  onSettingsSaved,
  onSaveSettings,
  onTriggerScan,
  onRequestPermission,
}) => {
  if (!isOpen) return null;

  const [settings, setSettings] = useState<SmartCaptureSettings>(
    initialSettings || {
      enabled: true,
      smsEnabled: true,
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
    }
  );
  const [locationPerms, setLocationPerms] = useState<LocationPermissionDetail | null>(null);
  const [clearLocationMsg, setClearLocationMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    } else if (familyId) {
      SmartExpenseService.getSettings(familyId).then(setSettings);
    }
    ExpenseLocationService.checkLocationPermissions().then(setLocationPerms);
  }, [familyId, initialSettings]);

  const handleToggle = async (key: keyof SmartCaptureSettings) => {
    const updated = { ...settings, [key]: !settings[key] };

    // If enabling location capture, proactively request OS location permissions
    if (key === 'locationCaptureEnabled' && updated.locationCaptureEnabled) {
      const perms = await ExpenseLocationService.requestLocationPermissions();
      setLocationPerms(perms);
      if (perms.precision === 'PRECISE') {
        updated.locationPrecision = 'PRECISE';
      }
      // Take an immediate snapshot to initialize context
      ExpenseLocationService.captureCurrentLocationSnapshot('LOCATION_SNAPSHOT', updated.locationRetentionHours || 72);
    }

    setSettings(updated);
    if (onSaveSettings) {
      onSaveSettings(updated);
    } else if (familyId) {
      SmartExpenseService.updateSettings(familyId, updated);
    }
    onSettingsSaved?.();
  };

  const handleUpdateField = <K extends keyof SmartCaptureSettings>(key: K, value: SmartCaptureSettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    if (onSaveSettings) {
      onSaveSettings(updated);
    } else if (familyId) {
      SmartExpenseService.updateSettings(familyId, updated);
    }
    onSettingsSaved?.();
  };

  const handleClearLocationData = () => {
    ExpenseLocationService.clearStoredLocationData();
    setClearLocationMsg('Stored location snapshots cleared.');
    setTimeout(() => setClearLocationMsg(null), 3000);
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
              <h3 className="text-base font-extrabold text-white tracking-tight">Smart Expense Settings</h3>
              <p className="text-[10px] text-slate-400">Manage transaction & location intelligence</p>
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
        <div className="space-y-3 text-xs">
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

          {/* Location Context Section */}
          <div className="p-3 rounded-2xl bg-slate-800/90 border border-[#16C7F2]/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#16C7F2]" />
                  <span>Location Context</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Help remember where you spent money
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('locationCaptureEnabled')}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  settings.locationCaptureEnabled ? 'bg-[#16C7F2]' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                    settings.locationCaptureEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {settings.locationCaptureEnabled && (
              <div className="space-y-2.5 pt-2 border-t border-slate-700/80 text-[11px] animate-fadeIn">
                {/* Precision */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium">Precision Mode</span>
                  <select
                    value={settings.locationPrecision || 'APPROXIMATE'}
                    onChange={(e) => handleUpdateField('locationPrecision', e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:border-[#16C7F2]"
                  >
                    <option value="APPROXIMATE">Approximate (Area / Locality)</option>
                    <option value="PRECISE">Precise (Neighborhood / Landmark)</option>
                  </select>
                </div>

                {/* Retention */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium">Snapshot Retention</span>
                  <select
                    value={settings.locationRetentionHours || 72}
                    onChange={(e) => handleUpdateField('locationRetentionHours', Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:border-[#16C7F2]"
                  >
                    <option value={24}>24 Hours</option>
                    <option value={72}>72 Hours (Default)</option>
                    <option value={168}>7 Days</option>
                  </select>
                </div>

                {/* Privacy Guarantee Note */}
                <div className="p-2 rounded-xl bg-[#16C7F2]/10 border border-[#16C7F2]/20 text-[10px] text-slate-300 flex items-start gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#16C7F2] shrink-0 mt-0.5" />
                  <span>
                    Privacy First: Only periodic snapshots around payment times are matched locally. Continuous tracking is never enabled.
                  </span>
                </div>

                {/* Clear Location Snapshots */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleClearLocationData}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-red-400 text-[10px] font-semibold border border-slate-700 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear Stored Snapshots</span>
                  </button>
                  {clearLocationMsg && (
                    <span className="text-[10px] text-[#55D98A] font-semibold">{clearLocationMsg}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Daily Review Reminder */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 border border-slate-700/70">
            <div className="space-y-0.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Daily Review Reminder</span>
              </div>
              <p className="text-[10px] text-slate-400">Evening digest for unconfirmed spends</p>
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

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
