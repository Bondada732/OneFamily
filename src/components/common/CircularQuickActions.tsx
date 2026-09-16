import React, { useRef } from 'react';
import {
  Receipt,
  Gift,
  Target,
  Wallet,
  FolderLock,
  CheckSquare,
  Wrench,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export interface QuickActionItem {
  id: string;
  num: string;
  name: string;
  sub: string;
  icon: React.ElementType;
  neonColor: string;
  glowShadow: string;
  bgGradient: string;
  onClick: () => void;
}

interface CircularQuickActionsProps {
  onAddExpense: () => void;
  onWishList: () => void;
  onSetGoal: () => void;
  onAddIncome: () => void;
  onVault: () => void;
  onTasks: () => void;
  onMaintenance: () => void;
  onEmergency: () => void;
}

export const CircularQuickActions: React.FC<CircularQuickActionsProps> = ({
  onAddExpense,
  onWishList,
  onSetGoal,
  onAddIncome,
  onVault,
  onTasks,
  onMaintenance,
  onEmergency,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const items: QuickActionItem[] = [
    {
      id: 'expense',
      num: '1',
      name: 'Add Expense',
      sub: 'Quick Pay',
      icon: Receipt,
      neonColor: '#FF2A55',
      glowShadow: '0 0 16px rgba(255, 42, 85, 0.65), inset 0 0 14px rgba(255, 42, 85, 0.25)',
      bgGradient: 'linear-gradient(180deg, rgba(255, 42, 85, 0.18) 0%, rgba(13, 21, 45, 0.95) 70%)',
      onClick: onAddExpense,
    },
    {
      id: 'wish',
      num: '2',
      name: 'Wish List',
      sub: 'Dream Items',
      icon: Gift,
      neonColor: '#00D2FF',
      glowShadow: '0 0 16px rgba(0, 210, 255, 0.65), inset 0 0 14px rgba(0, 210, 255, 0.25)',
      bgGradient: 'linear-gradient(180deg, rgba(0, 210, 255, 0.18) 0%, rgba(13, 21, 45, 0.95) 70%)',
      onClick: onWishList,
    },
    {
      id: 'goal',
      num: '3',
      name: 'Set Goal',
      sub: 'Target Funds',
      icon: Target,
      neonColor: '#00E676',
      glowShadow: '0 0 16px rgba(0, 230, 118, 0.65), inset 0 0 14px rgba(0, 230, 118, 0.25)',
      bgGradient: 'linear-gradient(180deg, rgba(0, 230, 118, 0.18) 0%, rgba(13, 21, 45, 0.95) 70%)',
      onClick: onSetGoal,
    },
    {
      id: 'income',
      num: '4',
      name: 'Add Income',
      sub: 'Salary & More',
      icon: Wallet,
      neonColor: '#B388FF',
      glowShadow: '0 0 16px rgba(179, 136, 255, 0.65), inset 0 0 14px rgba(179, 136, 255, 0.25)',
      bgGradient: 'linear-gradient(180deg, rgba(179, 136, 255, 0.18) 0%, rgba(13, 21, 45, 0.95) 70%)',
      onClick: onAddIncome,
    },
    {
      id: 'vault',
      num: '5',
      name: 'Vault',
      sub: 'KYC & Docs',
      icon: FolderLock,
      neonColor: '#FFD600',
      glowShadow: '0 0 16px rgba(255, 214, 0, 0.65), inset 0 0 14px rgba(255, 214, 0, 0.25)',
      bgGradient: 'linear-gradient(180deg, rgba(255, 214, 0, 0.18) 0%, rgba(13, 21, 45, 0.95) 70%)',
      onClick: onVault,
    },
    {
      id: 'tasks',
      num: '6',
      name: 'Tasks',
      sub: 'Daily To-Do',
      icon: CheckSquare,
      neonColor: '#38BDF8',
      glowShadow: '0 0 16px rgba(56, 189, 248, 0.65), inset 0 0 14px rgba(56, 189, 248, 0.25)',
      bgGradient: 'linear-gradient(180deg, rgba(56, 189, 248, 0.18) 0%, rgba(13, 21, 45, 0.95) 70%)',
      onClick: onTasks,
    },
    {
      id: 'maintenance',
      num: '7',
      name: 'Maintenance',
      sub: 'Appliance Care',
      icon: Wrench,
      neonColor: '#FF6D00',
      glowShadow: '0 0 16px rgba(255, 109, 0, 0.65), inset 0 0 14px rgba(255, 109, 0, 0.25)',
      bgGradient: 'linear-gradient(180deg, rgba(255, 109, 0, 0.18) 0%, rgba(13, 21, 45, 0.95) 70%)',
      onClick: onMaintenance,
    },
    {
      id: 'emergency',
      num: '8',
      name: 'Emergency',
      sub: '24/7 SOS',
      icon: ShieldAlert,
      neonColor: '#FF1744',
      glowShadow: '0 0 16px rgba(255, 23, 68, 0.65), inset 0 0 14px rgba(255, 23, 68, 0.25)',
      bgGradient: 'linear-gradient(180deg, rgba(255, 23, 68, 0.18) 0%, rgba(13, 21, 45, 0.95) 70%)',
      onClick: onEmergency,
    },
  ];

  return (
    <div className="relative w-full py-1">
      {/* Single-Line Horizontal Neon Cards Track with smooth spacing and curve */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-none snap-x snap-mandatory py-2 px-2.5 scroll-smooth"
        style={{
          WebkitOverflowScrolling: 'touch',
          perspective: '1000px',
        }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                item.onClick();
              }}
              className="relative shrink-0 snap-start rounded-[28px] p-0 overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.05] active:scale-95 text-left focus:outline-none group select-none"
              style={{
                width: '96px',
                minWidth: '96px',
                height: '152px',
                border: `2px solid ${item.neonColor}`,
                boxShadow: `${item.glowShadow}, 0 10px 25px -5px rgba(0, 0, 0, 0.7)`,
                background: item.bgGradient,
                borderRadius: '28px',
              }}
            >
              {/* Curved Glass Reflection Sheen */}
              <div 
                className="absolute inset-x-0 top-0 h-[48%] bg-gradient-to-b from-white/25 via-white/5 to-transparent pointer-events-none"
                style={{
                  borderTopLeftRadius: '26px',
                  borderTopRightRadius: '26px',
                }}
              />

              {/* Card Interior */}
              <div className="relative z-10 w-full h-full p-2.5 flex flex-col justify-between items-center text-center">
                {/* Top Number / Index Indicator (Matching Reference Design) */}
                <div
                  className="text-2xl font-black tracking-tight"
                  style={{
                    color: item.neonColor,
                    textShadow: `0 0 14px ${item.neonColor}`,
                  }}
                >
                  {item.num}
                </div>

                {/* Center Glowing Icon with Curved Rounded Box */}
                <div
                  className="w-11 h-11 rounded-[18px] flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg"
                  style={{
                    backgroundColor: 'rgba(5, 8, 17, 0.82)',
                    border: `1.5px solid ${item.neonColor}`,
                    color: item.neonColor,
                    boxShadow: `0 0 14px ${item.neonColor}70`,
                  }}
                >
                  <Icon className="w-5 h-5 stroke-[2.4]" />
                </div>

                {/* Bottom Label (Bold White, Centered) */}
                <div className="w-full pb-0.5">
                  <span className="block text-[11px] font-black text-white leading-tight tracking-tight drop-shadow-md">
                    {item.name}
                  </span>
                  <span className="block text-[8.5px] font-bold text-slate-300/85 truncate mt-0.5">
                    {item.sub}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
