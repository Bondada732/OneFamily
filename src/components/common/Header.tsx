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
    <header className="sticky top-0 z-40 bg-[#080D1A]/95 backdrop-blur-xl border-b border-slate-800/80 px-4 py-2.5 shadow-md shadow-black/50">
      <div className="flex items-center justify-between">
        {/* Left: KinoraOne Logo & Brand Name */}
        <div className="flex items-center gap-2.5">
          <img
            src="/kinoraone-logo.png"
            alt="KinoraOne"
            className="w-8 h-8 rounded-xl object-cover shadow-md ring-1 ring-white/15 shrink-0"
          />
          <div>
            <h1 className="text-base font-black text-white tracking-tight leading-none">
              Kinora<span className="text-[#16C7F2]">One</span>
            </h1>
            <p className="text-[9.5px] text-slate-400 font-medium tracking-wide mt-0.5">
              One Home • One Family
            </p>
          </div>
        </div>

        {/* Right: Search, Notifications & Profile Menu Toggle */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={onOpenSearch}
            className="w-8 h-8 rounded-full bg-[#0D152D] hover:bg-[#131F3F] active:scale-95 border border-slate-700/70 flex items-center justify-center text-slate-200 hover:text-white transition-all shadow-sm"
            title="Search"
          >
            <Search className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>

          <button
            onClick={onOpenNotifications}
            className="relative w-8 h-8 rounded-full bg-[#0D152D] hover:bg-[#131F3F] active:scale-95 border border-slate-700/70 flex items-center justify-center text-slate-200 hover:text-white transition-all shadow-sm"
            title="Notifications"
          >
            <Bell className="w-3.5 h-3.5 stroke-[2.2]" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF4D6D] ring-2 ring-[#080D1A] animate-pulse"></span>
          </button>

          {/* Profile Menu Trigger */}
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="relative active:scale-95 transition-all"
            title="Account & Family Settings"
          >
            <img
              src={currentUser?.avatar_url || family?.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
              alt={currentUser?.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-[#16C7F2]/60 hover:ring-[#16C7F2] shadow-sm"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#10B981] ring-2 ring-[#080D1A]"></span>
          </button>

          {/* Backdrop overlay to close when clicking outside */}
          {showProfileMenu && (
            <div
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs transition-opacity"
              onClick={() => {
                setShowProfileMenu(false);
                setShowLangMenu(false);
              }}
            />
          )}

          {/* Profile & Family Settings Dropdown */}
          {showProfileMenu && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-[#0B1226] border border-slate-700/80 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] p-3.5 z-50 text-[#F4F8FF] animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-white/10">
              {/* User Profile Header */}
              <div className="p-3 bg-[#0E1730] rounded-2xl border border-slate-700/60 mb-2.5 shadow-md">
                <div className="flex items-center gap-3">
                  <img
                    src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt={currentUser?.name}
                    className="w-11 h-11 rounded-xl object-cover ring-2 ring-[#16C7F2]/60 shadow"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white truncate">{currentUser?.name}</span>
                      <span className="text-[10px] bg-[#FFD21F]/20 text-[#FFD21F] font-bold px-2 py-0.5 rounded-full border border-[#FFD21F]/40 shrink-0">
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
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#0E1730] hover:bg-[#131F3F] border border-slate-700/60 text-slate-300 hover:text-[#FFD21F] transition-colors shadow-sm"
                >
                  {isPrivacyMode ? <EyeOff className="w-4 h-4 text-[#FFD21F] mb-1" /> : <Eye className="w-4 h-4 mb-1" />}
                  <span className="text-[11px] font-semibold">{isPrivacyMode ? 'Masked' : 'Privacy'}</span>
                </button>

                <button
                  onClick={() => { lockApp(); setShowProfileMenu(false); }}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#0E1730] hover:bg-[#131F3F] border border-slate-700/60 text-slate-300 hover:text-[#16C7F2] transition-colors shadow-sm"
                >
                  <Lock className="w-4 h-4 mb-1" />
                  <span className="text-[11px] font-semibold">Lock</span>
                </button>

                <button
                  onClick={() => { onOpenEmergency(); setShowProfileMenu(false); }}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#FF4D6D]/15 hover:bg-[#FF4D6D]/25 border border-[#FF4D6D]/40 text-[#FF4D6D] transition-colors shadow-sm"
                >
                  <ShieldAlert className="w-4 h-4 mb-1 animate-pulse" />
                  <span className="text-[11px] font-bold">SOS</span>
                </button>
              </div>

              {/* Language Selector Option */}
              <div className="mb-2.5">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#0E1730] hover:bg-[#131F3F] text-xs text-[#F4F8FF] transition-colors border border-slate-700/60 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#16C7F2]" />
                    <span className="font-medium">Language</span>
                  </div>
                  <span className="text-xs font-bold text-[#FFD21F]">
                    {activeLanguage === 'en' ? 'English' : activeLanguage === 'te' ? 'తెలుగు' : 'हिन्दी'}
                  </span>
                </button>

                {showLangMenu && (
                  <div className="mt-1.5 space-y-1 p-1.5 bg-[#080D1A] rounded-xl border border-slate-700/80 shadow-lg">
                    {[
                      { code: 'en' as const, label: 'English (EN)' },
                      { code: 'te' as const, label: 'తెలుగు (TE)' },
                      { code: 'hi' as const, label: 'हिन्दी (HI)' },
                    ].map((l) => (
                      <button
                        key={l.code}
                        onClick={() => { setLanguage(l.code); setShowLangMenu(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                          activeLanguage === l.code ? 'bg-[#168BFF] text-white font-bold' : 'text-slate-300 hover:bg-[#0E1730]'
                        }`}
                      >
                        <span>{l.label}</span>
                        {activeLanguage === l.code && <Check className="w-4 h-4 text-[#FFD21F]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Family Members Switcher (For Head) */}
              {currentUser?.role === 'FAMILY_HEAD' && (
                <div className="mb-2.5">
                  <div className="text-[10px] font-bold text-[#7EDCFF] uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                    <span>Family Profiles</span>
                    <span className="text-[10px] text-slate-400 font-normal">{familyMembers.length} members</span>
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
                            ? 'bg-[#168BFF]/30 text-white font-bold border border-[#16C7F2]/60 shadow-inner'
                            : 'bg-[#0E1730] hover:bg-[#131F3F] text-slate-300 border border-slate-700/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={member.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                            alt={member.name}
                            className="w-6 h-6 rounded-full object-cover ring-1 ring-[#16C7F2]/40 shrink-0"
                          />
                          <span className="truncate font-medium">{member.name}</span>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md shrink-0 ${
                          currentUser?.id === member.id
                            ? 'bg-[#168BFF]/40 text-[#7EDCFF] font-semibold'
                            : 'bg-[#050811] text-slate-400'
                        }`}>
                          {getRoleLabel(member.role)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sign Out */}
              <div className="pt-2 border-t border-slate-700/60">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs text-[#FF8A70] hover:bg-[#FF4D6D]/15 hover:text-white font-semibold transition-colors border border-[#FF4D6D]/30"
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

        {/* Right: Search & Notifications with Dark Glass Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSearch}
            className="w-9 h-9 rounded-full bg-[#0D152D] hover:bg-[#131F3F] active:scale-95 border border-slate-700/70 flex items-center justify-center text-slate-200 hover:text-white transition-all shadow-sm"
            title="Search transactions, docs, goals"
          >
            <Search className="w-4 h-4 stroke-[2.2]" />
          </button>

          <button
            onClick={onOpenNotifications}
            className="relative w-9 h-9 rounded-full bg-[#0D152D] hover:bg-[#131F3F] active:scale-95 border border-slate-700/70 flex items-center justify-center text-slate-200 hover:text-white transition-all shadow-sm"
            title="Notifications & Smart Reminders"
          >
            <Bell className="w-4 h-4 stroke-[2.2]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF4D6D] ring-2 ring-[#080D1A] animate-pulse"></span>
          </button>
        </div>
      </div>
    </header>
  );
};
