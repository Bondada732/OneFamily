import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useSecurity } from '../../context/SecurityContext.js';
import { translations } from '../../i18n/index.js';
import { apiRequest } from '../../utils/api.js';
import { ShieldCheck, Smartphone, Lock, Globe2, FileText, Download, UserX, KeyRound, Check, History, Camera, User, Edit3, Upload, Image as ImageIcon, Sun, Moon, Key, Eye, EyeOff, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
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

  // Change PIN Modal State
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [pinForm, setPinForm] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: '',
  });
  const [showPinCurrent, setShowPinCurrent] = useState(false);
  const [showPinNew, setShowPinNew] = useState(false);
  const [showPinConfirm, setShowPinConfirm] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);

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

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    if (!pinForm.newPin || pinForm.newPin.trim().length < 4) {
      setPinError('New PIN must be at least 4 digits.');
      return;
    }

    if (pinForm.newPin.trim() !== pinForm.confirmPin.trim()) {
      setPinError('New PIN and Confirm PIN do not match.');
      return;
    }

    setIsUpdatingPin(true);
    try {
      const res = await apiRequest('/auth/change-pin', {
        method: 'POST',
        body: JSON.stringify({
          currentPin: pinForm.currentPin.trim(),
          newPin: pinForm.newPin.trim(),
        }),
      });

      if (res.success) {
        setPinSuccess('Your App PIN has been updated successfully!');
        await refreshUser();
        setTimeout(() => {
          setShowChangePinModal(false);
          setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
          setPinSuccess('');
        }, 1500);
      } else {
        setPinError(res.error || 'Failed to update PIN.');
      }
    } catch (err: any) {
      setPinError(err.message || 'Failed to update PIN. Please verify your current PIN.');
    } finally {
      setIsUpdatingPin(false);
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
    <div className={`p-4 space-y-5 animate-fade-in pb-12 ${isLight ? 'text-[#1F1F1F]' : 'text-slate-100'}`}>
      {/* Title */}
      <div>
        <h2 className={`text-xl font-extrabold tracking-tight ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>Security & Settings</h2>
        <p className={`text-xs ${isLight ? 'text-[#6B6B6B]' : 'text-slate-400'}`}>Device control, PIN security, audit logs & privacy</p>
      </div>

      {/* Tabs */}
      <div className={`flex items-center gap-1 p-1 rounded-2xl border ${
        isLight ? 'bg-[#EAD6C4]/60 border-[#DEC8B2] shadow-xs' : 'bg-slate-800/80 border-slate-700/80'
      }`}>
        <button
          onClick={() => setActiveSettingsTab('SECURITY')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeSettingsTab === 'SECURITY'
              ? isLight
                ? 'bg-gradient-to-r from-[#F05A28] to-[#D3542F] text-white shadow-md'
                : 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md'
              : isLight ? 'text-[#634B3F] hover:text-[#1F1F1F]' : 'text-slate-400 hover:text-white'
          }`}
        >
          Security
        </button>
        <button
          onClick={() => setActiveSettingsTab('DEVICES')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeSettingsTab === 'DEVICES'
              ? isLight
                ? 'bg-gradient-to-r from-[#F05A28] to-[#D3542F] text-white shadow-md'
                : 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md'
              : isLight ? 'text-[#634B3F] hover:text-[#1F1F1F]' : 'text-slate-400 hover:text-white'
          }`}
        >
          Devices
        </button>
        <button
          onClick={() => setActiveSettingsTab('AUDIT')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeSettingsTab === 'AUDIT'
              ? isLight
                ? 'bg-gradient-to-r from-[#F05A28] to-[#D3542F] text-white shadow-md'
                : 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md'
              : isLight ? 'text-[#634B3F] hover:text-[#1F1F1F]' : 'text-slate-400 hover:text-white'
          }`}
        >
          Audit Log
        </button>
        <button
          onClick={() => setActiveSettingsTab('PREFERENCES')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeSettingsTab === 'PREFERENCES'
              ? isLight
                ? 'bg-gradient-to-r from-[#F05A28] to-[#D3542F] text-white shadow-md'
                : 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md'
              : isLight ? 'text-[#634B3F] hover:text-[#1F1F1F]' : 'text-slate-400 hover:text-white'
          }`}
        >
          Theme & Lang
        </button>
      </div>

      {/* 1. SECURITY / PROFILE TAB */}
      {activeSettingsTab === 'SECURITY' && (
        <div className="space-y-3">
          {/* My Profile & Avatar Card */}
          <div className={`p-4 rounded-2xl border shadow-md flex items-center justify-between ${
            isLight
              ? 'bg-[#F3E3D3] border-[#EAD6C4] border-t-white/95 border-b-[3px] border-b-[#DEC8B2] shadow-[0_12px_28px_-4px_rgba(130,80,45,0.14)]'
              : 'bg-gradient-to-tr from-slate-900 via-slate-850 to-slate-900 border-slate-700/80'
          }`}>
            <div className="flex items-center gap-3">
              <div className="relative group cursor-pointer" onClick={() => setShowEditProfile(true)}>
                <img
                  src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'}
                  alt={currentUser?.name}
                  className={`w-14 h-14 rounded-2xl object-cover shadow ${
                    isLight ? 'ring-2 ring-[#F05A28]' : 'ring-2 ring-amber-400/80'
                  }`}
                />
                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>{currentUser?.name}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                    isLight ? 'bg-[#F7D4BC] text-[#B84A1E] border-[#E8BC9E]' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}>
                    {currentUser?.role}
                  </span>
                </div>
                <div className={`text-[11px] mt-0.5 ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>{currentUser?.relationship || 'Family Member'}</div>
                <div className={`text-[10px] mt-0.5 font-medium ${isLight ? 'text-[#B84A1E]' : 'text-indigo-400'}`}>{currentUser?.email || 'No email attached'}</div>
              </div>
            </div>

            <button
              onClick={() => setShowEditProfile(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 transition-all ${
                isLight
                  ? 'bg-[#FFF8F1] hover:bg-[#F8EDE0] text-[#B84A1E] border-[#E8BC9E] shadow-xs'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Photo</span>
            </button>
          </div>

          <div className={`p-4 rounded-2xl border space-y-3 ${
            isLight
              ? 'bg-[#F3E3D3] border-[#EAD6C4] border-t-white/95 border-b-[3px] border-b-[#DEC8B2] shadow-[0_12px_28px_-4px_rgba(130,80,45,0.14)]'
              : 'bg-slate-800/90 border-slate-700/80'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-xs font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>App Lock & Biometrics</div>
                <div className={`text-[11px] ${isLight ? 'text-[#6B6B6B]' : 'text-slate-400'}`}>PIN security & instant screen lock</div>
              </div>
              <button
                onClick={lockApp}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all ${
                  isLight ? 'bg-[#0D47A1] hover:bg-[#1565C0] text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                Lock Now
              </button>
            </div>

            <div className={`flex items-center justify-between pt-2.5 border-t ${isLight ? 'border-[#DEC8B2]' : 'border-slate-700/60'}`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${
                  isLight ? 'bg-[#F7D4BC] border-[#E8BC9E] text-[#B84A1E]' : 'bg-[#168BFF]/20 border-[#168BFF]/30 text-[#16C7F2]'
                }`}>
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <div className={`text-xs font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>Change App Login PIN</div>
                  <div className={`text-[11px] ${isLight ? 'text-[#6B6B6B]' : 'text-slate-400'}`}>Update your 4-digit personal sign-in PIN</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
                  setPinError('');
                  setPinSuccess('');
                  setShowChangePinModal(true);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer ${
                  isLight
                    ? 'bg-gradient-to-r from-[#F05A28] to-[#D3542F] text-white hover:brightness-105'
                    : 'bg-gradient-to-r from-[#168BFF] to-[#16C7F2] text-slate-950'
                }`}
              >
                Change PIN
              </button>
            </div>

            <div className={`flex items-center justify-between pt-2.5 border-t ${isLight ? 'border-[#DEC8B2]' : 'border-slate-700/60'}`}>
              <div>
                <div className={`text-xs font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>Privacy Glance Mode</div>
                <div className={`text-[11px] ${isLight ? 'text-[#6B6B6B]' : 'text-slate-400'}`}>Mask all financial numbers in UI</div>
              </div>
              <button
                onClick={togglePrivacyMode}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                  isLight
                    ? isPrivacyMode
                      ? 'bg-[#F05A28] text-white shadow-xs'
                      : 'bg-[#E5D5C5] text-[#634B3F] hover:bg-[#DAC7B4]'
                    : isPrivacyMode
                    ? 'bg-amber-500 text-slate-900'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {isPrivacyMode ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          {/* Export & Data Management */}
          <div className={`p-4 rounded-2xl border space-y-2 ${
            isLight
              ? 'bg-[#F3E3D3] border-[#EAD6C4] border-t-white/95 border-b-[3px] border-b-[#DEC8B2] shadow-[0_12px_28px_-4px_rgba(130,80,45,0.14)]'
              : 'bg-slate-800/90 border-slate-700/80'
          }`}>
            <div className={`text-xs font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>Data Portability & Export</div>
            <p className={`text-[11px] ${isLight ? 'text-[#6B6B6B]' : 'text-slate-400'}`}>
              Download a complete JSON export of your family vault, expenses, goals, and records.
            </p>
            <button
              onClick={handleExportData}
              className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                isLight
                  ? 'bg-[#FFF8F1] hover:bg-[#F8EDE0] text-[#B84A1E] border border-[#E8BC9E] shadow-xs'
                  : 'bg-slate-700 hover:bg-slate-650 text-slate-200'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Family Data (JSON)</span>
            </button>
          </div>

          {/* Account & Family Session */}
          <div className={`p-4 rounded-2xl border space-y-2 ${
            isLight
              ? 'bg-[#F3E3D3] border-[#EAD6C4] border-t-white/95 border-b-[3px] border-b-[#DEC8B2] shadow-[0_12px_28px_-4px_rgba(130,80,45,0.14)]'
              : 'bg-slate-800/90 border-slate-700/80'
          }`}>
            <div className={`text-xs font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>Family Session & Account</div>
            <p className={`text-[11px] ${isLight ? 'text-[#6B6B6B]' : 'text-slate-400'}`}>
              Active Family: <span className={`font-semibold ${isLight ? 'text-[#B84A1E]' : 'text-amber-400'}`}>{family?.name || 'Our Family'}</span> • Logged in as <span className={`font-semibold ${isLight ? 'text-[#1F1F1F]' : 'text-slate-200'}`}>{currentUser?.name}</span>
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={logout}
                className={`py-2.5 rounded-xl text-xs font-bold transition-colors border ${
                  isLight
                    ? 'bg-[#FFF8F1] hover:bg-[#F8EDE0] text-[#0D47A1] border-[#B3C7E6]'
                    : 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border-indigo-500/40'
                }`}
              >
                + Create New Family
              </button>
              <button
                onClick={logout}
                className={`py-2.5 rounded-xl text-xs font-bold transition-colors border ${
                  isLight
                    ? 'bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] border-[#FCA5A5]'
                    : 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border-rose-500/40'
                }`}
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
          <div className={`text-xs font-bold uppercase ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>Authorized Family Devices</div>
          <div className="space-y-2">
            {devices.map((dev) => (
              <div key={dev.id} className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                isLight
                  ? 'bg-[#F3E3D3] border-[#EAD6C4] border-t-white/95 border-b-[3px] border-b-[#DEC8B2] shadow-[0_12px_28px_-4px_rgba(130,80,45,0.14)]'
                  : 'bg-slate-800/90 border-slate-700/80'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isLight ? 'bg-[#FFF8F1] text-[#0D47A1] border border-[#B3C7E6]' : 'bg-indigo-500/20 text-indigo-400'}`}>
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>{dev.device_name}</div>
                    <div className={`text-[11px] ${isLight ? 'text-[#6B6B6B]' : 'text-slate-400'}`}>
                      {dev.os} • {dev.browser} • {dev.ip_address}
                    </div>
                  </div>
                </div>
                {dev.is_current ? (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isLight ? 'bg-[#D1FAE5] text-[#047857] border-[#A7F3D0]' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    This Device
                  </span>
                ) : (
                  <button
                    onClick={() => alert('Device session revoked successfully')}
                    className="text-[11px] text-rose-500 hover:underline font-semibold"
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
          <div className={`text-xs font-bold uppercase ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>Recent Activity History</div>
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div key={log.id} className={`p-3.5 rounded-2xl border space-y-1 ${
                isLight
                  ? 'bg-[#F3E3D3] border-[#EAD6C4] border-t-white/95 border-b-[3px] border-b-[#DEC8B2] shadow-[0_12px_28px_-4px_rgba(130,80,45,0.14)]'
                  : 'bg-slate-800/90 border-slate-700/80'
              }`}>
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>{log.action}</span>
                  <span className={`text-[10px] ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>{log.user_name}</span>
                </div>
                <div className={`text-[11px] ${isLight ? 'text-[#4A3B32]' : 'text-slate-300'}`}>{log.details}</div>
                <div className={`text-[9px] pt-0.5 ${isLight ? 'text-[#8C7A6B]' : 'text-slate-500'}`}>{log.created_at}</div>
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
            <div className={`text-xs font-bold uppercase ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>Appearance & Theme</div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                  theme === 'dark'
                    ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                    : isLight
                    ? 'bg-[#F3E3D3] border-[#EAD6C4] text-[#1F1F1F] hover:border-[#DEC8B2]'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-lg">🌙</span>
                  {theme === 'dark' && <Check className="w-4 h-4 text-amber-400" />}
                </div>
                <div className="font-bold text-xs">Dark Mode</div>
                <div className={`text-[10px] ${isLight ? 'text-[#6B6B6B]' : 'text-slate-400'}`}>Obsidian Glow</div>
              </button>

              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                  theme === 'light'
                    ? isLight
                      ? 'bg-[#FFF8F1] border-[#F05A28] text-[#B84A1E] shadow-md ring-2 ring-[#F05A28]/30'
                      : 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-md'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-lg">☀️</span>
                  {theme === 'light' && <Check className={`w-4 h-4 ${isLight ? 'text-[#F05A28]' : 'text-amber-400'}`} />}
                </div>
                <div className="font-bold text-xs">Light Mode</div>
                <div className={`text-[10px] ${isLight ? 'text-[#6B6B6B]' : 'text-slate-400'}`}>Warm Cream & Clay</div>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className={`text-xs font-bold uppercase ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>Language Selection</div>
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
                      ? isLight
                        ? 'bg-[#FFF8F1] border-[#F05A28] text-[#B84A1E] shadow-sm'
                        : 'bg-indigo-600/30 border-indigo-500 text-white'
                      : isLight
                      ? 'bg-[#F3E3D3] border-[#EAD6C4] text-[#1F1F1F] hover:bg-[#EBDCD0]'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <span>{lang.label}</span>
                  {activeLanguage === lang.code && <Check className={`w-4 h-4 ${isLight ? 'text-[#F05A28]' : 'text-amber-400'}`} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile & Avatar Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md ${isLight ? 'bg-[#F3E3D3] border-2 border-[#EAD6C4] text-[#1F1F1F]' : 'bg-slate-900 border border-slate-700 text-slate-100'} rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto`}>
            <div className={`flex items-center justify-between border-b ${isLight ? 'border-[#DEC8B2]' : 'border-slate-800'} pb-3`}>
              <div>
                <h3 className={`text-base font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>Edit Profile & Photo</h3>
                <p className={`text-[11px] ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>Select photo from Gallery or snap with Camera</p>
              </div>
              <button onClick={() => setShowEditProfile(false)} className={`w-7 h-7 rounded-full flex items-center justify-center ${isLight ? 'bg-[#FFF8F1] text-[#634B3F] hover:text-[#1F1F1F] border border-[#DEC8B2]' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>✕</button>
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
              <span className={`text-[11px] font-bold uppercase ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Profile Picture</span>
              
              <div className={`flex items-center gap-3 ${isLight ? 'bg-[#FFF8F1] border border-[#DEC8B2]' : 'bg-slate-800/80 border border-slate-700/80'} p-3 rounded-2xl`}>
                <img
                  src={profileForm.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'}
                  alt="Preview"
                  className={`w-14 h-14 rounded-2xl object-cover ring-2 ${isLight ? 'ring-[#F05A28]' : 'ring-amber-400'} shadow-md`}
                />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => settingsGalleryRef.current?.click()}
                      className={`px-3 py-2 ${isLight ? 'bg-[#FFF8F1] hover:bg-[#F3E3D3] border border-[#DEC8B2] text-[#B84A1E]' : 'bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200'} rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors`}
                    >
                      <Upload className={`w-3.5 h-3.5 ${isLight ? 'text-[#F05A28]' : 'text-indigo-300'}`} />
                      <span>From Gallery</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => settingsCameraRef.current?.click()}
                      className={`px-3 py-2 ${isLight ? 'bg-[#FFF8F1] hover:bg-[#F3E3D3] border border-[#DEC8B2] text-[#F05A28]' : 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300'} rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors`}
                    >
                      <Camera className={`w-3.5 h-3.5 ${isLight ? 'text-[#F05A28]' : 'text-amber-400'}`} />
                      <span>Camera</span>
                    </button>
                  </div>
                  {profileForm.avatar_url && (
                    <button
                      type="button"
                      onClick={() => setProfileForm({ ...profileForm, avatar_url: '' })}
                      className="text-[10px] text-rose-500 hover:text-rose-600 hover:underline block"
                    >
                      ✕ Remove Photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className={`space-y-3 pt-2 border-t ${isLight ? 'border-[#DEC8B2]' : 'border-slate-800'}`}>

              <div>
                <label className={`text-xs font-semibold ${isLight ? 'text-[#4A3B32]' : 'text-slate-300'}`}>Full Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className={`w-full mt-1 px-3 py-2 ${isLight ? 'bg-[#FFF8F1] border border-[#DEC8B2] text-[#1F1F1F] placeholder-[#8C7A6B] focus:border-[#F05A28]' : 'bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500'} rounded-xl text-xs outline-none transition-all`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`text-xs font-semibold ${isLight ? 'text-[#4A3B32]' : 'text-slate-300'}`}>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className={`w-full mt-1 px-3 py-2 ${isLight ? 'bg-[#FFF8F1] border border-[#DEC8B2] text-[#1F1F1F] placeholder-[#8C7A6B] focus:border-[#F05A28]' : 'bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500'} rounded-xl text-xs outline-none transition-all`}
                  />
                </div>
                <div>
                  <label className={`text-xs font-semibold ${isLight ? 'text-[#4A3B32]' : 'text-slate-300'}`}>App PIN (4-Digits)</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={profileForm.pin_code}
                    onChange={(e) => setProfileForm({ ...profileForm, pin_code: e.target.value })}
                    className={`w-full mt-1 px-3 py-2 ${isLight ? 'bg-[#FFF8F1] border border-[#DEC8B2] text-[#1F1F1F] placeholder-[#8C7A6B] focus:border-[#F05A28]' : 'bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500'} rounded-xl text-xs outline-none transition-all`}
                  />
                </div>
              </div>

              <div className={`flex gap-2 pt-2 border-t ${isLight ? 'border-[#DEC8B2]' : 'border-slate-800'}`}>
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className={`flex-1 py-2.5 ${isLight ? 'bg-[#FFF8F1] border border-[#DEC8B2] hover:bg-[#EBDCD0] text-[#634B3F]' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'} rounded-xl text-xs font-semibold transition-colors`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 ${isLight ? 'bg-gradient-to-r from-[#F05A28] to-[#FF7A45] text-white shadow-[#F05A28]/25' : 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-indigo-500/25'} font-bold rounded-xl text-xs shadow-lg hover:opacity-95 transition-all`}
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change App PIN Modal */}
      {showChangePinModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
          <div className={`w-full max-w-md ${isLight ? 'bg-[#F3E3D3] border-2 border-[#EAD6C4] text-[#1F1F1F]' : 'bg-[#07132B] border border-[#168BFF]/40 text-slate-100'} rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto`}>
            {/* Header */}
            <div className={`flex items-center justify-between border-b ${isLight ? 'border-[#DEC8B2]' : 'border-slate-800'} pb-3`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-2xl ${isLight ? 'bg-[#FFF8F1] border border-[#DEC8B2] text-[#F05A28]' : 'bg-[#168BFF]/20 border border-[#168BFF]/30 text-[#16C7F2]'} flex items-center justify-center shrink-0`}>
                  <KeyRound className={`w-5 h-5 ${isLight ? 'text-[#F05A28]' : 'text-[#16C7F2]'}`} />
                </div>
                <div>
                  <h3 className={`text-base font-bold tracking-tight ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>Change App Login PIN</h3>
                  <p className={`text-[11px] ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>Set a new 4-digit login & lock PIN</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowChangePinModal(false)}
                className={`w-7 h-7 rounded-full ${isLight ? 'bg-[#FFF8F1] border border-[#DEC8B2] text-[#634B3F] hover:text-[#1F1F1F]' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'} flex items-center justify-center transition-colors cursor-pointer`}
              >
                ✕
              </button>
            </div>

            {/* Error / Success Banners */}
            {pinError && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/35 rounded-2xl text-xs text-rose-500 font-medium flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span className="leading-snug">{pinError}</span>
              </div>
            )}
            {pinSuccess && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/35 rounded-2xl text-xs text-emerald-600 font-medium flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="leading-snug">{pinSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePin} className="space-y-3.5">
              {/* Current PIN */}
              <div>
                <label className={`text-xs font-semibold flex items-center gap-1 mb-1 ${isLight ? 'text-[#4A3B32]' : 'text-slate-300'}`}>
                  <span>Current PIN</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPinCurrent ? 'text' : 'password'}
                    maxLength={10}
                    placeholder="Enter current PIN"
                    value={pinForm.currentPin}
                    onChange={(e) => setPinForm({ ...pinForm, currentPin: e.target.value })}
                    className={`w-full pl-3.5 pr-10 py-2.5 ${isLight ? 'bg-[#FFF8F1] border border-[#DEC8B2] text-[#1F1F1F] placeholder-[#8C7A6B] focus:border-[#F05A28]' : 'bg-[#020b18] border border-slate-700 text-white placeholder-slate-500 focus:border-[#16C7F2]'} rounded-xl text-xs outline-none transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinCurrent(!showPinCurrent)}
                    className={`absolute right-3 ${isLight ? 'text-[#8C7A6B] hover:text-[#1F1F1F]' : 'text-slate-400 hover:text-white'} cursor-pointer`}
                  >
                    {showPinCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New PIN */}
              <div>
                <label className={`text-xs font-semibold flex items-center gap-1 mb-1 ${isLight ? 'text-[#4A3B32]' : 'text-slate-300'}`}>
                  <span>New 4-Digit PIN <span className={isLight ? 'text-[#F05A28]' : 'text-[#16C7F2]'}>*</span></span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPinNew ? 'text' : 'password'}
                    required
                    maxLength={8}
                    placeholder="e.g. 1978"
                    value={pinForm.newPin}
                    onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value })}
                    className={`w-full pl-3.5 pr-10 py-2.5 ${isLight ? 'bg-[#FFF8F1] border border-[#DEC8B2] text-[#1F1F1F] placeholder-[#8C7A6B] focus:border-[#F05A28]' : 'bg-[#020b18] border border-slate-700 text-white placeholder-slate-500 focus:border-[#16C7F2]'} rounded-xl text-xs outline-none transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinNew(!showPinNew)}
                    className={`absolute right-3 ${isLight ? 'text-[#8C7A6B] hover:text-[#1F1F1F]' : 'text-slate-400 hover:text-white'} cursor-pointer`}
                  >
                    {showPinNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New PIN */}
              <div>
                <label className={`text-xs font-semibold flex items-center gap-1 mb-1 ${isLight ? 'text-[#4A3B32]' : 'text-slate-300'}`}>
                  <span>Confirm New PIN <span className={isLight ? 'text-[#F05A28]' : 'text-[#16C7F2]'}>*</span></span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPinConfirm ? 'text' : 'password'}
                    required
                    maxLength={8}
                    placeholder="Re-enter new PIN"
                    value={pinForm.confirmPin}
                    onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value })}
                    className={`w-full pl-3.5 pr-10 py-2.5 ${isLight ? 'bg-[#FFF8F1] border border-[#DEC8B2] text-[#1F1F1F] placeholder-[#8C7A6B] focus:border-[#F05A28]' : 'bg-[#020b18] border border-slate-700 text-white placeholder-slate-500 focus:border-[#16C7F2]'} rounded-xl text-xs outline-none transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinConfirm(!showPinConfirm)}
                    className={`absolute right-3 ${isLight ? 'text-[#8C7A6B] hover:text-[#1F1F1F]' : 'text-slate-400 hover:text-white'} cursor-pointer`}
                  >
                    {showPinConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={`flex gap-2.5 pt-3 border-t ${isLight ? 'border-[#DEC8B2]' : 'border-slate-800'}`}>
                <button
                  type="button"
                  onClick={() => setShowChangePinModal(false)}
                  className={`flex-1 py-2.5 ${isLight ? 'bg-[#FFF8F1] border border-[#DEC8B2] text-[#634B3F] hover:bg-[#EBDCD0]' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'} rounded-xl text-xs font-semibold transition-colors cursor-pointer`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPin}
                  className={`flex-1 py-2.5 ${isLight ? 'bg-gradient-to-r from-[#F05A28] to-[#FF7A45] text-white shadow-[#F05A28]/25' : 'bg-gradient-to-r from-[#168BFF] to-[#16C7F2] text-slate-950 shadow-[#168BFF]/25'} hover:opacity-90 active:scale-95 font-bold rounded-xl text-xs shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50`}
                >
                  {isUpdatingPin ? 'Updating...' : 'Save New PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
