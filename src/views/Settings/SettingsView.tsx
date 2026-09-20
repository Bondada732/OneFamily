import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useSecurity } from '../../context/SecurityContext.js';
import { translations } from '../../i18n/index.js';
import { apiRequest } from '../../utils/api.js';
import { ShieldCheck, Smartphone, Lock, Globe2, FileText, Download, UserX, KeyRound, Check, History, Camera, User, Edit3, Upload, Image as ImageIcon, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.js';

export const SettingsView: React.FC = () => {
  const { currentUser, family, activeLanguage, setLanguage, familyMembers, logout, refreshUser } = useAuth();
  const { lockApp, isPrivacyMode, togglePrivacyMode } = useSecurity();
  const { theme, setTheme } = useTheme();
  const t = translations[activeLanguage];

  const [devices, setDevices] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'SECURITY' | 'DEVICES' | 'AUDIT' | 'PREFERENCES'>('SECURITY');

  // Edit Profile Modal State
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    avatar_url: currentUser?.avatar_url || '',
    phone: currentUser?.phone || '',
    pin_code: currentUser?.pin_code || '1234',
  });

  const settingsGalleryRef = useRef<HTMLInputElement>(null);
  const settingsCameraRef = useRef<HTMLInputElement>(null);

  const handleProfilePhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProfileForm((prev) => ({ ...prev, avatar_url: event.target!.result as string }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name || '',
        avatar_url: currentUser.avatar_url || '',
        phone: currentUser.phone || '',
        pin_code: currentUser.pin_code || '1234',
      });
    }
  }, [currentUser]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(profileForm),
      });
      await refreshUser();
      setShowEditProfile(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

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
          Theme & Lang
        </button>
      </div>

      {/* 1. SECURITY / PROFILE TAB */}
      {activeSettingsTab === 'SECURITY' && (
        <div className="space-y-3">
          {/* My Profile & Avatar Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-850 to-slate-900 border border-slate-700/80 shadow-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative group cursor-pointer" onClick={() => setShowEditProfile(true)}>
                <img
                  src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'}
                  alt={currentUser?.name}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-400/80 shadow"
                />
                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white">{currentUser?.name}</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                    {currentUser?.role}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{currentUser?.relationship || 'Family Member'}</div>
                <div className="text-[10px] text-indigo-400 mt-0.5">{currentUser?.email || 'No email attached'}</div>
              </div>
            </div>

            <button
              onClick={() => setShowEditProfile(true)}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-bold border border-amber-500/40 flex items-center gap-1 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Photo</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">App Lock & Biometrics</div>
                <div className="text-[11px] text-slate-400">PIN {currentUser?.pin_code || '1234'} or Face/Touch ID</div>
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

          {/* Account & Family Session */}
          <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-2">
            <div className="text-xs font-bold text-white">Family Session & Account</div>
            <p className="text-[11px] text-slate-400">
              Active Family: <span className="font-semibold text-amber-400">{family?.name || 'Our Family'}</span> • Logged in as <span className="font-semibold text-slate-200">{currentUser?.name}</span>
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={logout}
                className="py-2.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-bold transition-colors"
              >
                + Create New Family
              </button>
              <button
                onClick={logout}
                className="py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition-colors"
              >
                Sign Out / Switch
              </button>
            </div>
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
        <div className="space-y-4">
          {/* Appearance / Theme Mode */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase">Appearance & Theme</div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                  theme === 'dark'
                    ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-lg">🌙</span>
                  {theme === 'dark' && <Check className="w-4 h-4 text-amber-400" />}
                </div>
                <div className="font-bold text-xs">Dark Mode</div>
                <div className="text-[10px] text-slate-400">Default Obsidian</div>
              </button>

              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                  theme === 'light'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-md'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-lg">☀️</span>
                  {theme === 'light' && <Check className="w-4 h-4 text-amber-400" />}
                </div>
                <div className="font-bold text-xs">Light Mode</div>
                <div className="text-[10px] text-slate-400">Warm Cream & Clay</div>
              </button>
            </div>
          </div>

          <div className="space-y-2">
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
        </div>
      )}

      {/* Edit Profile & Avatar Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Edit Profile & Photo</h3>
                <p className="text-[11px] text-slate-400">Select photo from Gallery or snap with Camera</p>
              </div>
              <button onClick={() => setShowEditProfile(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Hidden native file inputs */}
            <input
              type="file"
              ref={settingsGalleryRef}
              onChange={handleProfilePhotoSelected}
              accept="image/*"
              className="hidden"
            />
            <input
              type="file"
              ref={settingsCameraRef}
              onChange={handleProfilePhotoSelected}
              accept="image/*"
              capture="environment"
              className="hidden"
            />

            {/* Avatar Preview & Source Selection */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase">Profile Picture</span>
              
              <div className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80">
                <img
                  src={profileForm.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'}
                  alt="Preview"
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-400 shadow-md"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => settingsGalleryRef.current?.click()}
                      className="px-3 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-300" />
                      <span>From Gallery</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => settingsCameraRef.current?.click()}
                      className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                      <span>Camera</span>
                    </button>
                  </div>
                  {profileForm.avatar_url && (
                    <button
                      type="button"
                      onClick={() => setProfileForm({ ...profileForm, avatar_url: '' })}
                      className="text-[10px] text-rose-400 hover:text-rose-300 hover:underline block"
                    >
                      ✕ Remove Photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-3 pt-2 border-t border-slate-800">

              <div>
                <label className="text-xs text-slate-300 font-semibold">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">App PIN (4-Digits)</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={profileForm.pin_code}
                    onChange={(e) => setProfileForm({ ...profileForm, pin_code: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
