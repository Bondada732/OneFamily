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
      <nav className="relative bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/80 px-4 py-2 flex items-center justify-between shadow-2xl">
        {/* Left 2 items */}
        <div className="flex items-center gap-6">
          {leftNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex flex-col items-center justify-center min-w-[52px] py-1 transition-all ${
                  isActive
                    ? 'text-amber-400 font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px] mt-1 font-medium tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Floating Center '+' Action Button */}
        <div className="relative -top-5 flex justify-center">
          <button
            onClick={onOpenQuickAction}
            className="w-13 h-13 p-3.5 rounded-full bg-gradient-to-tr from-amber-500 via-indigo-600 to-indigo-500 text-white shadow-xl shadow-indigo-600/50 flex items-center justify-center hover:scale-110 active:scale-95 transition-all ring-4 ring-slate-950"
            title="Create & Record"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
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
                    ? 'text-amber-400 font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px] mt-1 font-medium tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
