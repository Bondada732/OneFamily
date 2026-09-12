import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useSecurity } from '../../context/SecurityContext.js';
import { translations } from '../../i18n/index.js';
import { Bell, Search, Eye, EyeOff, Lock, Users, ShieldAlert, Sparkles, ChevronDown } from 'lucide-react';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenEmergency: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, onOpenNotifications, onOpenEmergency }) => {
  const { currentUser, familyMembers, switchActiveMember, activeLanguage, setLanguage } = useAuth();
  const { isPrivacyMode, togglePrivacyMode, lockApp } = useSecurity();
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const t = translations[activeLanguage];

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'FAMILY_HEAD':
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded-full">HEAD</span>;
      case 'SPOUSE':
        return <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded-full">CO-ADMIN</span>;
      case 'CHILD':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded-full">CHILD</span>;
      case 'VIEWER':
        return <span className="bg-slate-500/20 text-slate-300 border border-slate-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded-full">VIEWER</span>;
      default:
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded-full">ADULT</span>;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      {/* Top utility row: Member Switcher & Emergency Pill */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800/50">
        {/* Active Member Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowMemberDropdown(!showMemberDropdown)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700/80 transition-colors px-2.5 py-1.5 rounded-full border border-slate-700 text-xs text-slate-200"
          >
            <img
              src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
              alt={currentUser?.name}
              className="w-5 h-5 rounded-full object-cover ring-1 ring-amber-400/60"
            />
            <span className="font-semibold max-w-[90px] truncate">{currentUser?.name?.split(' ')[0]}</span>
            {getRoleBadge(currentUser?.role)}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Switcher Dropdown */}
          {showMemberDropdown && (
            <div className="absolute top-full left-0 mt-1.5 w-64 bg-slate-850 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-slate-200">
              <div className="text-[11px] font-semibold text-slate-400 px-2.5 py-1 uppercase tracking-wider">
                {t.switchRole} (Test RBAC)
              </div>
              <div className="space-y-1 mt-1">
                {familyMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => {
                      switchActiveMember(member.id);
                      setShowMemberDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition-colors ${
                      currentUser?.id === member.id ? 'bg-indigo-600/30 text-white font-bold border border-indigo-500/40' : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img src={member.avatar_url} alt={member.name} className="w-6 h-6 rounded-full object-cover" />
                      <div>
                        <div className="font-medium text-slate-100">{member.name}</div>
                        <div className="text-[10px] text-slate-400">{member.relationship}</div>
                      </div>
                    </div>
                    {getRoleBadge(member.role)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right side utilities: Language, Privacy Eye, Emergency Button */}
        <div className="flex items-center gap-1.5">
          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium px-2 py-1 rounded-lg border border-slate-700"
            >
              {activeLanguage === 'en' ? '🇬🇧 EN' : activeLanguage === 'te' ? '🇮🇳 తెలుగు' : '🇮🇳 हिन्दी'}
            </button>
            {showLangDropdown && (
              <div className="absolute top-full right-0 mt-1 w-28 bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-1 z-50 text-xs">
                <button
                  onClick={() => { setLanguage('en'); setShowLangDropdown(false); }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-slate-200"
                >
                  English (EN)
                </button>
                <button
                  onClick={() => { setLanguage('te'); setShowLangDropdown(false); }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-slate-200"
                >
                  తెలుగు (TE)
                </button>
                <button
                  onClick={() => { setLanguage('hi'); setShowLangDropdown(false); }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-slate-200"
                >
                  हिन्दी (HI)
                </button>
              </div>
            )}
          </div>

          {/* Privacy Toggle */}
          <button
            onClick={togglePrivacyMode}
            title="Privacy Mask (Hide Amounts)"
            className="p-1.5 text-slate-400 hover:text-amber-400 bg-slate-800/80 rounded-lg border border-slate-700/80"
          >
            {isPrivacyMode ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
          </button>

          {/* Lock App */}
          <button
            onClick={lockApp}
            title="Lock App"
            className="p-1.5 text-slate-400 hover:text-indigo-400 bg-slate-800/80 rounded-lg border border-slate-700/80"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>

          {/* Emergency 1-Tap Trigger */}
          <button
            onClick={onOpenEmergency}
            className="flex items-center gap-1 bg-rose-600/90 hover:bg-rose-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm shadow-rose-900/50 active:scale-95 transition-transform"
          >
            <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
            <span>SOS</span>
          </button>
        </div>
      </div>

      {/* Main Header Row: Logo & Search/Notifs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 flex items-center justify-center shadow-md shadow-indigo-600/30">
            <span className="text-white font-extrabold text-sm tracking-tight">1F</span>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight leading-none flex items-center gap-1.5">
              ONE FAMILY
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">
              {translations[activeLanguage].tagline}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Universal Search Button */}
          <button
            onClick={onOpenSearch}
            className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
            title="Universal Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
            title="Notifications & Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-pulse"></span>
          </button>
        </div>
      </div>
    </header>
  );
};
