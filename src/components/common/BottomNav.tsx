import React from 'react';
import { Home, Wallet, Users, FolderLock, Sparkles, Plus } from 'lucide-react';
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

  const navItems = [
    { id: 'home' as TabType, label: t.home, icon: Home },
    { id: 'money' as TabType, label: t.money, icon: Wallet },
    { id: 'family' as TabType, label: t.family, icon: Users },
    { id: 'vault' as TabType, label: t.vault, icon: FolderLock },
    { id: 'ai' as TabType, label: t.ai, icon: Sparkles, highlight: true },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto">
      {/* Floating Action Button '+' positioned right above the center */}
      <div className="relative flex justify-center">
        <button
          onClick={onOpenQuickAction}
          className="absolute -top-6 w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-xl shadow-indigo-500/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform ring-4 ring-slate-900 z-50"
          title="Quick Action Menu"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      <nav className="bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-3 py-2 flex items-center justify-around shadow-2xl">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center min-w-[56px] py-1 transition-all ${
                isActive
                  ? 'text-amber-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              } ${idx === 2 ? 'mr-3' : ''} ${idx === 3 ? 'ml-3' : ''}`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {item.highlight && !isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[58px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
