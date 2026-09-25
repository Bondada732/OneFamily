import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useSecurity } from '../../context/SecurityContext.js';
import { translations } from '../../i18n/index.js';
import { Bell, Search, Eye, EyeOff, Lock, Users, ShieldAlert, ChevronDown, Globe, LogOut, Check, Sun, Moon, Key, Settings as SettingsIcon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.js';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenEmergency: () => void;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, onOpenNotifications, onOpenEmergency, onOpenSettings }) => {
  const { currentUser, family, familyMembers, switchActiveMember, activeLanguage, setLanguage, logout } = useAuth();
  const { isPrivacyMode, togglePrivacyMode, lockApp } = useSecurity();
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
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
    <header className={`sticky top-0 z-40 px-4 pb-2.5 header-safe-top transition-colors duration-300 header-container ${
      isLight
        ? 'bg-[#F8EDE0]/95 backdrop-blur-xl border-b border-[#EAD6C4] shadow-[0_2px_12px_rgba(180,150,130,0.08)]'
        : 'bg-[#080D1A]/95 backdrop-blur-xl border-b border-slate-800/80 shadow-md shadow-black/50'
    }`}>
      <div className="flex items-center justify-between gap-2">
        {/* Left: KinoraOne Logo & Brand Name */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0D47A1] to-[#42A5F5] p-0.5 shadow-md shrink-0 flex items-center justify-center">
            <img
              src="/kinoraone-logo.png"
              alt="KinoraOne"
              className="w-full h-full rounded-[10px] object-cover"
              onError={(e) => {
                // Fallback icon if logo image fails
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="min-w-0">
            <h1 className={`text-base font-black tracking-tight leading-none brand-title ${
              isLight ? 'text-[#1F1F1F]' : 'text-white'
            }`}>
              Kinora<span className={isLight ? 'text-[#F05A28]' : 'text-[#16C7F2]'}>One</span>
            </h1>
            <p className={`text-[9px] sm:text-[9.5px] font-medium tracking-wide mt-0.5 truncate brand-subtitle ${
              isLight ? 'text-[#6B6B6B]' : 'text-slate-400'
            }`}>
              One Home • One Family • One Future.
            </p>
          </div>
        </div>

        {/* Right: Theme Toggle Pill, Search, Notifications & Profile Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Theme Toggle Pill */}
          <button
            onClick={toggleTheme}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all duration-300 flex items-center gap-1 shrink-0 active:scale-95 shadow-sm border ${
              isLight
                ? 'bg-[#FFF8F1] border-[#EAD6C4] text-[#1F1F1F] hover:bg-[#F3E3D3]'
                : 'border-slate-700/70 bg-[#0D152D] text-slate-200 hover:text-white'
            }`}
            title={theme === 'dark' ? 'Switch to Warm Light Mode' : 'Switch to Obsidian Dark Mode'}
          >
            {theme === 'dark' ? (
              <>
                <span className="text-xs">🌙</span>
                <span className="font-semibold text-slate-300">Dark</span>
              </>
            ) : (
              <>
                <span className="text-xs">☀️</span>
                <span className="font-semibold text-[#1F1F1F]">Light</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenSearch}
            className={`w-8 h-8 p-1.5 rounded-full active:scale-95 border flex items-center justify-center transition-all shadow-sm shrink-0 ${
              isLight
                ? 'bg-[#FFF8F1] hover:bg-[#F3E3D3] border-[#EAD6C4] text-[#1F1F1F]'
                : 'bg-[#0D152D] hover:bg-[#131F3F] border-slate-700/70 text-slate-200 hover:text-white'
            }`}
            title="Search"
          >
            <Search className="w-4 h-4 stroke-[2.2]" />
          </button>

          <button
            onClick={onOpenNotifications}
            className={`relative w-8 h-8 p-1.5 rounded-full active:scale-95 border flex items-center justify-center transition-all shadow-sm shrink-0 ${
              isLight
                ? 'bg-[#FFF8F1] hover:bg-[#F3E3D3] border-[#EAD6C4] text-[#1F1F1F]'
                : 'bg-[#0D152D] hover:bg-[#131F3F] border-slate-700/70 text-slate-200 hover:text-white'
            }`}
            title="Notifications"
          >
            <Bell className="w-4 h-4 stroke-[2.2]" />
            <span className={`absolute top-0.5 right-0.5 w-2 h-2 rounded-full animate-pulse ${
              isLight ? 'bg-[#FF6B6B] ring-2 ring-[#FFF8F1]' : 'bg-[#FF4D6D] ring-2 ring-[#080D1A]'
            }`}></span>
          </button>

          {/* Profile Menu Trigger */}
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="relative active:scale-95 transition-all w-8 h-8 rounded-full shrink-0 flex items-center justify-center"
            title="Account & Family Settings"
          >
            <img
              src={currentUser?.avatar_url || family?.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
              alt={currentUser?.name}
              className={`w-8 h-8 rounded-full object-cover shrink-0 shadow-sm ${
                isLight ? 'ring-2 ring-[#F05A28]/80 hover:ring-[#F05A28]' : 'ring-2 ring-[#16C7F2]/60 hover:ring-[#16C7F2]'
              }`}
            />
            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#10B981] ${
              isLight ? 'ring-2 ring-[#FFF8F1]' : 'ring-2 ring-[#080D1A]'
            }`}></span>
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
            <div className={`absolute top-full right-0 mt-2 w-80 rounded-3xl p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 shadow-2xl ${
              isLight
                ? 'bg-[#EFE4D6] border-2 border-[#DECFC0] text-[#2A1B14]'
                : 'bg-[#0B1226] border border-slate-700/80 text-[#F4F8FF] ring-1 ring-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.95)]'
            }`}>
              {/* User Profile Header */}
              <div className={`p-3 rounded-2xl border mb-2.5 shadow-md ${
                isLight ? 'bg-[#EBE0D2] border-[#DECFC0]' : 'bg-[#0E1730] border-slate-700/60'
              }`}>
                <div className="flex items-center gap-3">
                  <img
                    src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt={currentUser?.name}
                    className={`w-11 h-11 rounded-xl object-cover shadow ${
                      isLight ? 'ring-2 ring-[#D96632]' : 'ring-2 ring-[#16C7F2]/60'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-bold text-sm truncate ${isLight ? 'text-[#2A1B14]' : 'text-white'}`}>{currentUser?.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                        isLight
                          ? 'bg-[#F7D4BC] text-[#B84A1E] border-[#E8BC9E]'
                          : 'bg-[#FFD21F]/20 text-[#FFD21F] border-[#FFD21F]/40'
                      }`}>
                        {getRoleLabel(currentUser?.role)}
                      </span>
                    </div>
                    <div className={`text-[11px] truncate mt-0.5 ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                      {currentUser?.email || currentUser?.phone || family?.name}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Utility Tools Grid */}
              <div className="grid grid-cols-3 gap-2 mb-2.5">
                <button
                  onClick={() => { togglePrivacyMode(); setShowProfileMenu(false); }}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-colors shadow-sm ${
                    isLight
                      ? 'bg-[#EBE0D2] hover:bg-[#DECFC0] border-[#DECFC0] text-[#634B3F]'
                      : 'bg-[#0E1730] hover:bg-[#131F3F] border-slate-700/60 text-slate-300 hover:text-[#FFD21F]'
                  }`}
                >
                  {isPrivacyMode ? (
                    <EyeOff className={`w-4 h-4 mb-1 ${isLight ? 'text-[#B84A1E]' : 'text-[#FFD21F]'}`} />
                  ) : (
                    <Eye className="w-4 h-4 mb-1" />
                  )}
                  <span className="text-[11px] font-semibold">{isPrivacyMode ? 'Masked' : 'Privacy'}</span>
                </button>

                <button
                  onClick={() => { lockApp(); setShowProfileMenu(false); }}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-colors shadow-sm ${
                    isLight
                      ? 'bg-[#EBE0D2] hover:bg-[#DECFC0] border-[#DECFC0] text-[#634B3F]'
                      : 'bg-[#0E1730] hover:bg-[#131F3F] border-slate-700/60 text-slate-300 hover:text-[#16C7F2]'
                  }`}
                >
                  <Lock className="w-4 h-4 mb-1" />
                  <span className="text-[11px] font-semibold">Lock</span>
                </button>

                <button
                  onClick={() => { onOpenEmergency(); setShowProfileMenu(false); }}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-colors shadow-sm ${
                    isLight
                      ? 'bg-[#F7D4BC] hover:bg-[#E8BC9E] border-[#E8BC9E] text-[#C62828]'
                      : 'bg-[#FF4D6D]/15 hover:bg-[#FF4D6D]/25 border-[#FF4D6D]/40 text-[#FF4D6D]'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 mb-1 animate-pulse" />
                  <span className="text-[11px] font-bold">SOS</span>
                </button>
              </div>

              {/* Security & Change PIN Settings Shortcut */}
              {onOpenSettings && (
                <div className="mb-2.5">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenSettings();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border shadow-sm ${
                      isLight
                        ? 'bg-[#EBE0D2] hover:bg-[#DECFC0] text-[#2A1B14] border-[#DECFC0]'
                        : 'bg-gradient-to-r from-[#168BFF]/20 to-[#16C7F2]/10 hover:from-[#168BFF]/30 hover:to-[#16C7F2]/20 text-[#F4F8FF] border-[#16C7F2]/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Key className={`w-4 h-4 ${isLight ? 'text-[#B84A1E]' : 'text-[#16C7F2]'}`} />
                      <span>Security & Change PIN</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isLight ? 'bg-[#F7D4BC] text-[#B84A1E]' : 'bg-[#16C7F2]/20 text-[#16C7F2]'
                    }`}>
                      Open ➔
                    </span>
                  </button>
                </div>
              )}

              {/* Theme Selector Option */}
              <div className="mb-2.5">
                <button
                  onClick={toggleTheme}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors border shadow-sm ${
                    isLight
                      ? 'bg-[#EBE0D2] hover:bg-[#DECFC0] text-[#2A1B14] border-[#DECFC0]'
                      : 'bg-[#0E1730] hover:bg-[#131F3F] text-[#F4F8FF] border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {theme === 'dark' ? <Moon className="w-4 h-4 text-[#FFD21F]" /> : <Sun className="w-4 h-4 text-[#D96632]" />}
                    <span className="font-medium">Appearance</span>
                  </div>
                  <span className={`text-xs font-bold ${isLight ? 'text-[#B84A1E]' : 'text-[#FFD21F]'}`}>
                    {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                  </span>
                </button>
              </div>

              {/* Language Selector Option */}
              <div className="mb-2.5">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors border shadow-sm ${
                    isLight
                      ? 'bg-[#EBE0D2] hover:bg-[#DECFC0] text-[#2A1B14] border-[#DECFC0]'
                      : 'bg-[#0E1730] hover:bg-[#131F3F] text-[#F4F8FF] border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Globe className={`w-4 h-4 ${isLight ? 'text-[#B84A1E]' : 'text-[#16C7F2]'}`} />
                    <span className="font-medium">Language</span>
                  </div>
                  <span className={`text-xs font-bold ${isLight ? 'text-[#B84A1E]' : 'text-[#FFD21F]'}`}>
                    {activeLanguage === 'en' ? 'English' : activeLanguage === 'te' ? 'తెలుగు' : 'हिन्दी'}
                  </span>
                </button>

                {showLangMenu && (
                  <div className={`mt-1.5 space-y-1 p-1.5 rounded-xl border shadow-lg ${
                    isLight
                      ? 'bg-[#F4EDE4] border-[#DECFC0]'
                      : 'bg-[#080D1A] border-slate-700/80'
                  }`}>
                    {[
                      { code: 'en' as const, label: 'English (EN)' },
                      { code: 'te' as const, label: 'తెలుగు (TE)' },
                      { code: 'hi' as const, label: 'हिन्दी (HI)' },
                    ].map((l) => (
                      <button
                        key={l.code}
                        onClick={() => { setLanguage(l.code); setShowLangMenu(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                          activeLanguage === l.code
                            ? isLight
                              ? 'bg-[#D96632] text-white font-bold'
                              : 'bg-[#168BFF] text-white font-bold'
                            : isLight
                            ? 'text-[#634B3F] hover:bg-[#EBE0D2]'
                            : 'text-slate-300 hover:bg-[#0E1730]'
                        }`}
                      >
                        <span>{l.label}</span>
                        {activeLanguage === l.code && <Check className="w-4 h-4 text-white" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Family Members Switcher (For Head) */}
              {currentUser?.role === 'FAMILY_HEAD' && (
                <div className="mb-2.5">
                  <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 flex items-center justify-between ${
                    isLight ? 'text-[#B84A1E]' : 'text-[#7EDCFF]'
                  }`}>
                    <span>Family Profiles</span>
                    <span className={`text-[10px] font-normal ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>{familyMembers.length} members</span>
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
                            ? isLight
                              ? 'bg-[#F7D4BC] text-[#2A1B14] font-bold border border-[#E8BC9E]'
                              : 'bg-[#168BFF]/30 text-white font-bold border border-[#16C7F2]/60 shadow-inner'
                            : isLight
                            ? 'bg-[#EBE0D2] hover:bg-[#DECFC0] text-[#634B3F] border border-[#DECFC0]'
                            : 'bg-[#0E1730] hover:bg-[#131F3F] text-slate-300 border border-slate-700/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={member.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                            alt={member.name}
                            className={`w-6 h-6 rounded-full object-cover shrink-0 ${
                              isLight ? 'ring-1 ring-[#D96632]' : 'ring-1 ring-[#16C7F2]/40'
                            }`}
                          />
                          <span className="truncate font-medium">{member.name}</span>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md shrink-0 ${
                          currentUser?.id === member.id
                            ? isLight
                              ? 'bg-[#D96632] text-white font-semibold'
                              : 'bg-[#168BFF]/40 text-[#7EDCFF] font-semibold'
                            : isLight
                            ? 'bg-[#DECFC0] text-[#634B3F]'
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
              <div className={`pt-2 border-t ${isLight ? 'border-[#DECFC0]' : 'border-slate-700/60'}`}>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-colors border ${
                    isLight
                      ? 'text-[#C62828] hover:bg-[#F7D4BC] border-[#DECFC0]'
                      : 'text-[#FF8A70] hover:bg-[#FF4D6D]/15 hover:text-white border-[#FF4D6D]/30'
                  }`}
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
      </div>
    </header>
  );
};
