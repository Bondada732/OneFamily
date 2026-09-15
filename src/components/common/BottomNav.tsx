import React from 'react';
import { Home, Wallet, Users, FolderLock, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { translations } from '../../i18n/index.js';

export type TabType = 'home' | 'money' | 'family' | 'vault' | 'ai' | 'memories' | 'calendar' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenQuickAction: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab, onOpenQuickAction }) => {
  const { activeLanguage } = useAuth();
  const t = translations[activeLanguage];

  const leftNavItems = [
    { id: 'home' as TabType, label: t.home, icon: Home },
    { id: 'money' as TabType, label: t.money, icon: Wallet },
  ];

  const rightNavItems = [
    { id: 'family' as TabType, label: t.family, icon: Users },
    { id: 'vault' as TabType, label: t.vault, icon: FolderLock },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto">
      <nav className="relative bg-[#080D1A]/95 backdrop-blur-2xl border-t border-slate-800/80 px-4 py-2 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
        {/* Left 2 items */}
        <div className="flex items-center gap-6">
          {leftNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isHome = item.id === 'home';
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex flex-col items-center justify-center min-w-[52px] py-1 transition-all ${
                  isActive
                    ? isHome
                      ? 'text-[#FFD21F] font-bold scale-105 filter drop-shadow-[0_0_8px_rgba(255,210,31,0.35)]'
                      : 'text-[#16C7F2] font-bold scale-105 filter drop-shadow-[0_0_8px_rgba(22,199,242,0.35)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px] mt-1 font-semibold tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Floating Center '+' Action Button */}
        <div className="relative -top-5 flex justify-center">
          <button
            onClick={onOpenQuickAction}
            className="w-13 h-13 p-3.5 rounded-full bg-gradient-to-br from-[#168BFF] via-[#16C7F2] to-[#8B5CF6] text-white shadow-[0_8px_25px_rgba(22,139,255,0.45)] border border-white/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-all ring-4 ring-[#080D1A]"
            title="Create & Record"
          >
            <Plus className="w-6 h-6 stroke-[3] text-white" />
          </button>
        </div>

        {/* Right 2 items */}
        <div className="flex items-center gap-6">
          {rightNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex flex-col items-center justify-center min-w-[52px] py-1 transition-all ${
                  isActive
                    ? 'text-[#16C7F2] font-bold scale-105 filter drop-shadow-[0_0_8px_rgba(22,199,242,0.35)]'
                    : 'text-[#91A8C7] hover:text-[#B9D8FF]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px] mt-1 font-semibold tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
