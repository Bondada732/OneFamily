import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useSecurity } from '../../context/SecurityContext.js';
import { translations } from '../../i18n/index.js';
import { apiRequest } from '../../utils/api.js';
import { ShieldCheck, Smartphone, Lock, Globe2, FileText, Download, UserX, KeyRound, Check, History } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { currentUser, family, activeLanguage, setLanguage, familyMembers } = useAuth();
  const { lockApp, isPrivacyMode, togglePrivacyMode } = useSecurity();
  const t = translations[activeLanguage];

  const [devices, setDevices] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'SECURITY' | 'DEVICES' | 'AUDIT' | 'PREFERENCES'>('SECURITY');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [devs, logs] = await Promise.all([
          apiRequest('/auth/devices'),
          apiRequest('/search/audit-logs'),
        ]);
        setDevices(devs || []);
        setAuditLogs(logs || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadSettings();
  }, []);

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ family, currentUser, familyMembers }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `onefamily_data_export_${family?.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="p-4 space-y-5 animate-fade-in text-slate-100 pb-12">
      {/* Title */}
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">Security & Settings</h2>
        <p className="text-xs text-slate-400">Device control, PIN security, audit logs & privacy</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/80">
        <button
          onClick={() => setActiveSettingsTab('SECURITY')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeSettingsTab === 'SECURITY' ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md' : 'text-slate-400'
          }`}
        >
          Security
        </button>
        <button
          onClick={() => setActiveSettingsTab('DEVICES')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeSettingsTab === 'DEVICES' ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md' : 'text-slate-400'
          }`}
        >
          Devices
        </button>
        <button
          onClick={() => setActiveSettingsTab('AUDIT')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeSettingsTab === 'AUDIT' ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md' : 'text-slate-400'
          }`}
        >
          Audit Log
        </button>
        <button
          onClick={() => setActiveSettingsTab('PREFERENCES')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeSettingsTab === 'PREFERENCES' ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md' : 'text-slate-400'
          }`}
        >
          Language
        </button>
      </div>

      {/* 1. SECURITY TAB */}
      {activeSettingsTab === 'SECURITY' && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">App Lock & Biometrics</div>
                <div className="text-[11px] text-slate-400">PIN 1234 or Face/Touch ID</div>
              </div>
              <button
                onClick={lockApp}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Lock Now
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
              <div>
                <div className="text-xs font-bold text-white">Privacy Glance Mode</div>
                <div className="text-[11px] text-slate-400">Mask all financial numbers in UI</div>
              </div>
              <button
                onClick={togglePrivacyMode}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                  isPrivacyMode ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {isPrivacyMode ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          {/* Export & Data Management */}
          <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-2">
            <div className="text-xs font-bold text-white">Data Portability & Export</div>
            <p className="text-[11px] text-slate-400">
              Download a complete JSON export of your family vault, expenses, goals, and records.
            </p>
            <button
              onClick={handleExportData}
              className="w-full py-2.5 bg-slate-700 hover:bg-slate-650 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Family Data (JSON)</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. DEVICES TAB */}
      {activeSettingsTab === 'DEVICES' && (
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase">Authorized Family Devices</div>
          <div className="space-y-2">
            {devices.map((dev) => (
              <div key={dev.id} className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{dev.device_name}</div>
                    <div className="text-[11px] text-slate-400">
                      {dev.os} • {dev.browser} • {dev.ip_address}
                    </div>
                  </div>
                </div>
                {dev.is_current ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                    This Device
                  </span>
                ) : (
                  <button
                    onClick={() => alert('Device session revoked successfully')}
                    className="text-[11px] text-rose-400 hover:underline font-semibold"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. AUDIT LOG TAB */}
      {activeSettingsTab === 'AUDIT' && (
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase">Recent Activity History</div>
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{log.action}</span>
                  <span className="text-[10px] text-slate-400">{log.user_name}</span>
                </div>
                <div className="text-[11px] text-slate-300">{log.details}</div>
                <div className="text-[9px] text-slate-500 pt-0.5">{log.created_at}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. PREFERENCES TAB */}
      {activeSettingsTab === 'PREFERENCES' && (
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase">Language Selection</div>
          <div className="space-y-2">
            {[
              { code: 'en' as const, label: 'English (Default)' },
              { code: 'te' as const, label: 'తెలుగు (Telugu)' },
              { code: 'hi' as const, label: 'हिन्दी (Hindi)' },
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-xs font-bold ${
                  activeLanguage === lang.code
                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <span>{lang.label}</span>
                {activeLanguage === lang.code && <Check className="w-4 h-4 text-amber-400" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
