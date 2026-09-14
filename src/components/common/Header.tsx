import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useSecurity } from '../../context/SecurityContext.js';
import { translations } from '../../i18n/index.js';
import { Bell, Search, Eye, EyeOff, Lock, Users, ShieldAlert, ChevronDown, Globe, LogOut, Check } from 'lucide-react';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenEmergency: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, onOpenNotifications, onOpenEmergency }) => {
  const { currentUser, family, familyMembers, switchActiveMember, activeLanguage, setLanguage, logout } = useAuth();
  const { isPrivacyMode, togglePrivacyMode, lockApp } = useSecurity();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const t = translations[activeLanguage];

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'FAMILY_HEAD':
        return 'Head';
      case 'SPOUSE':
        return 'Spouse';
      case 'CHILD':
        return 'Child';
      case 'VIEWER':
        return 'Viewer';
      default:
        return 'Member';
    }
  };

  const displayName = family?.name || `${currentUser?.name?.split(' ')[0] || 'My'} Family`;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/60 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left: Family Profile Pill */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 text-left group active:scale-98 transition-all"
          >
            <div className="relative">
              <img
                src={currentUser?.avatar_url || family?.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                alt={currentUser?.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400/40 group-hover:ring-amber-400 shadow-md"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-950"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold text-white tracking-tight group-hover:text-amber-300 transition-colors">
                  {displayName}
                </h1>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                One Home • One Family • One Future
              </p>
            </div>
          </button>

          {/* Backdrop overlay to close when clicking outside & prevent background interaction */}
          {showProfileMenu && (
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => {
                setShowProfileMenu(false);
                setShowLangMenu(false);
              }}
            />
          )}

          {/* Profile & Family Settings Dropdown */}
          {showProfileMenu && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] p-3.5 z-50 text-slate-200 animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-white/10">
              {/* User Profile Header */}
              <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 mb-2.5 shadow-md">
                <div className="flex items-center gap-3">
                  <img
                    src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt={currentUser?.name}
                    className="w-11 h-11 rounded-xl object-cover ring-2 ring-amber-400/60 shadow"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white truncate">{currentUser?.name}</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/40 shrink-0">
                        {getRoleLabel(currentUser?.role)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">{currentUser?.email || currentUser?.phone || family?.name}</div>
                  </div>
                </div>
              </div>

              {/* Quick Utility Tools Grid */}
              <div className="grid grid-cols-3 gap-2 mb-2.5">
                <button
                  onClick={() => { togglePrivacyMode(); setShowProfileMenu(false); }}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-amber-400 transition-colors shadow-sm"
                >
                  {isPrivacyMode ? <EyeOff className="w-4 h-4 text-amber-400 mb-1" /> : <Eye className="w-4 h-4 mb-1" />}
                  <span className="text-[11px] font-semibold">{isPrivacyMode ? 'Masked' : 'Privacy'}</span>
                </button>

                <button
                  onClick={() => { lockApp(); setShowProfileMenu(false); }}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-indigo-400 transition-colors shadow-sm"
                >
                  <Lock className="w-4 h-4 mb-1" />
                  <span className="text-[11px] font-semibold">Lock</span>
                </button>

                <button
                  onClick={() => { onOpenEmergency(); setShowProfileMenu(false); }}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-400 transition-colors shadow-sm"
                >
                  <ShieldAlert className="w-4 h-4 mb-1 animate-pulse" />
                  <span className="text-[11px] font-bold">SOS</span>
                </button>
              </div>

              {/* Language Selector Option */}
              <div className="mb-2.5">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors border border-slate-700 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <span className="font-medium">Language</span>
                  </div>
                  <span className="text-xs font-bold text-amber-400">
                    {activeLanguage === 'en' ? 'English' : activeLanguage === 'te' ? 'తెలుగు' : 'हिन्दी'}
                  </span>
                </button>

                {showLangMenu && (
                  <div className="mt-1.5 space-y-1 p-1.5 bg-slate-950 rounded-xl border border-slate-700 shadow-lg">
                    {[
                      { code: 'en' as const, label: 'English (EN)' },
                      { code: 'te' as const, label: 'తెలుగు (TE)' },
                      { code: 'hi' as const, label: 'हिन्दी (HI)' },
                    ].map((l) => (
                      <button
                        key={l.code}
                        onClick={() => { setLanguage(l.code); setShowLangMenu(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                          activeLanguage === l.code ? 'bg-indigo-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>{l.label}</span>
                        {activeLanguage === l.code && <Check className="w-4 h-4 text-amber-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Family Members Switcher (For Head) */}
              {currentUser?.role === 'FAMILY_HEAD' && (
                <div className="mb-2.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                    <span>Family Profiles</span>
                    <span className="text-[10px] text-slate-500 font-normal">{familyMembers.length} members</span>
                  </div>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 mt-1">
                    {familyMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => {
                          switchActiveMember(member.id);
                          setShowProfileMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-all shadow-sm ${
                          currentUser?.id === member.id
                            ? 'bg-indigo-600/40 text-white font-bold border border-indigo-400/60 shadow-inner'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={member.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                            alt={member.name}
                            className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-600 shrink-0"
                          />
                          <span className="truncate font-medium">{member.name}</span>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md shrink-0 ${
                          currentUser?.id === member.id
                            ? 'bg-indigo-500/40 text-indigo-200 font-semibold'
                            : 'bg-slate-700/60 text-slate-400'
                        }`}>
                          {getRoleLabel(member.role)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sign Out */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs text-rose-400 hover:bg-rose-950/60 hover:text-rose-300 font-semibold transition-colors border border-rose-900/30"
                >
                  <div className="flex items-center gap-2">
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </div>
                  <span>➔</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Search & Notifications Glass Circles */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSearch}
            className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-sm"
            title="Search transactions, docs, goals"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenNotifications}
            className="relative w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-sm"
            title="Notifications & Smart Reminders"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-950 animate-pulse"></span>
          </button>
        </div>
      </div>
    </header>
  );
};
