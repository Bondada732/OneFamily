import React, { useRef, useEffect } from 'react';
import {
  Receipt,
  Gift,
  Target,
  Wallet,
  FolderLock,
  CheckSquare,
  Wrench,
  ShieldAlert,
  Cake,
  KeyRound,
  Lock,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.js';
import { useAuth } from '../../context/AuthContext.js';

export interface QuickActionItem {
  id: string;
  name: string;
  sub: string;
  icon: React.ElementType;
  neonColor: string;
  pastelBg: string;
  glowShadow: string;
  bgGradient: string;
  allowed: boolean;
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
  onFriends?: () => void;
  onSecurity?: () => void;
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
  onFriends = () => {},
  onSecurity = () => {},
}) => {
  const { theme } = useTheme();
  const { hasPermission } = useAuth();
  const isLight = theme === 'light';
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const baseBgEnd = isLight ? 'rgba(240, 90, 40, 0.95)' : 'rgba(13, 21, 45, 0.95)';

  const handleRestrictedClick = (name: string) => {
    alert(`Access Restricted: Your Family Head has restricted access to the "${name}" module for your profile.`);
  };

  const items: QuickActionItem[] = [
    {
      id: 'security',
      name: 'Security & PIN',
      sub: 'Change PIN',
      icon: KeyRound,
      neonColor: '#10B981',
      pastelBg: '#D1FAE5',
      glowShadow: isLight
        ? '0 0 14px rgba(16, 185, 129, 0.4), 0 4px 12px rgba(240, 90, 40, 0.35)'
        : '0 0 16px rgba(16, 185, 129, 0.65), inset 0 0 14px rgba(16, 185, 129, 0.25)',
      bgGradient: `linear-gradient(180deg, rgba(16, 185, 129, 0.28) 0%, ${baseBgEnd} 75%)`,
      allowed: true,
      onClick: onSecurity,
    },
    {
      id: 'birthdays',
      name: 'Birthdays',
      sub: 'Celebrations',
      icon: Cake,
      neonColor: '#E11D48',
      pastelBg: '#FFE4E6',
      glowShadow: isLight
        ? '0 0 14px rgba(225, 29, 72, 0.4), 0 4px 12px rgba(240, 90, 40, 0.35)'
        : '0 0 16px rgba(225, 29, 72, 0.65), inset 0 0 14px rgba(225, 29, 72, 0.25)',
      bgGradient: `linear-gradient(180deg, rgba(225, 29, 72, 0.28) 0%, ${baseBgEnd} 75%)`,
      allowed: hasPermission('CALENDAR_VIEW') || hasPermission('CALENDAR_EDIT'),
      onClick: onFriends,
    },
    {
      id: 'expense',
      name: 'Add Expense',
      sub: 'Quick Pay',
      icon: Receipt,
      neonColor: '#FF2A55',
      pastelBg: '#FFE4E6',
      glowShadow: isLight
        ? '0 0 14px rgba(255, 42, 85, 0.4), 0 4px 12px rgba(240, 90, 40, 0.35)'
        : '0 0 16px rgba(255, 42, 85, 0.65), inset 0 0 14px rgba(255, 42, 85, 0.25)',
      bgGradient: `linear-gradient(180deg, rgba(255, 42, 85, 0.28) 0%, ${baseBgEnd} 75%)`,
      allowed: hasPermission('FINANCE_VIEW') || hasPermission('FINANCE_EDIT'),
      onClick: onAddExpense,
    },
    {
      id: 'wish',
      name: 'Wish List',
      sub: 'Dream Items',
      icon: Gift,
      neonColor: '#00A8E8',
      pastelBg: '#E0F4FF',
      glowShadow: isLight
        ? '0 0 14px rgba(0, 168, 232, 0.4), 0 4px 12px rgba(240, 90, 40, 0.35)'
        : '0 0 16px rgba(0, 210, 255, 0.65), inset 0 0 14px rgba(0, 210, 255, 0.25)',
      bgGradient: `linear-gradient(180deg, rgba(0, 210, 255, 0.28) 0%, ${baseBgEnd} 75%)`,
      allowed: hasPermission('TASK_VIEW') || hasPermission('TASK_EDIT'),
      onClick: onWishList,
    },
    {
      id: 'goal',
      name: 'Set Goal',
      sub: 'Target Funds',
      icon: Target,
      neonColor: '#22C55E',
      pastelBg: '#E7F9EA',
      glowShadow: isLight
        ? '0 0 14px rgba(34, 197, 94, 0.4), 0 4px 12px rgba(240, 90, 40, 0.35)'
        : '0 0 16px rgba(0, 230, 118, 0.65), inset 0 0 14px rgba(0, 230, 118, 0.25)',
      bgGradient: `linear-gradient(180deg, rgba(0, 230, 118, 0.28) 0%, ${baseBgEnd} 75%)`,
      allowed: hasPermission('FINANCE_VIEW') || hasPermission('FINANCE_EDIT'),
      onClick: onSetGoal,
    },
    {
      id: 'income',
      name: 'Add Income',
      sub: 'Salary & More',
      icon: Wallet,
      neonColor: '#8B5CF6',
      pastelBg: '#EFE7FF',
      glowShadow: isLight
        ? '0 0 14px rgba(139, 92, 246, 0.4), 0 4px 12px rgba(240, 90, 40, 0.35)'
        : '0 0 16px rgba(179, 136, 255, 0.65), inset 0 0 14px rgba(179, 136, 255, 0.25)',
      bgGradient: `linear-gradient(180deg, rgba(179, 136, 255, 0.28) 0%, ${baseBgEnd} 75%)`,
      allowed: hasPermission('FINANCE_VIEW') || hasPermission('FINANCE_EDIT'),
      onClick: onAddIncome,
    },
    {
      id: 'vault',
      name: 'Vault',
      sub: 'KYC & Docs',
      icon: FolderLock,
      neonColor: '#FFB74D',
      pastelBg: '#FFF4DF',
      glowShadow: isLight
        ? '0 0 14px rgba(255, 183, 77, 0.4), 0 4px 12px rgba(240, 90, 40, 0.35)'
        : '0 0 16px rgba(255, 214, 0, 0.65), inset 0 0 14px rgba(255, 214, 0, 0.25)',
      bgGradient: `linear-gradient(180deg, rgba(255, 214, 0, 0.28) 0%, ${baseBgEnd} 75%)`,
      allowed: hasPermission('DOCUMENT_VIEW') || hasPermission('DOCUMENT_UPLOAD'),
      onClick: onVault,
    },
    {
      id: 'tasks',
      name: 'Tasks',
      sub: 'Daily To-Do',
      icon: CheckSquare,
      neonColor: '#42A5F5',
      pastelBg: '#E0F4FF',
      glowShadow: isLight
        ? '0 0 14px rgba(66, 165, 245, 0.4), 0 4px 12px rgba(240, 90, 40, 0.35)'
        : '0 0 16px rgba(56, 189, 248, 0.65), inset 0 0 14px rgba(56, 189, 248, 0.25)',
      bgGradient: `linear-gradient(180deg, rgba(56, 189, 248, 0.28) 0%, ${baseBgEnd} 75%)`,
      allowed: hasPermission('TASK_VIEW') || hasPermission('TASK_EDIT'),
      onClick: onTasks,
    },
    {
      id: 'maintenance',
      name: 'Maintenance',
      sub: 'Appliance Care',
      icon: Wrench,
      neonColor: '#FF7043',
      pastelBg: '#FFF4DF',
      glowShadow: isLight
        ? '0 0 14px rgba(255, 112, 67, 0.4), 0 4px 12px rgba(240, 90, 40, 0.35)'
        : '0 0 16px rgba(255, 109, 0, 0.65), inset 0 0 14px rgba(255, 109, 0, 0.25)',
      bgGradient: `linear-gradient(180deg, rgba(255, 109, 0, 0.28) 0%, ${baseBgEnd} 75%)`,
      allowed: hasPermission('TASK_VIEW') || hasPermission('TASK_EDIT'),
      onClick: onMaintenance,
    },
    {
      id: 'emergency',
      name: 'Emergency',
      sub: '24/7 SOS',
      icon: ShieldAlert,
      neonColor: '#FF6B6B',
      pastelBg: '#FFE4E6',
      glowShadow: isLight
        ? '0 0 14px rgba(255, 107, 107, 0.4), 0 4px 12px rgba(240, 90, 40, 0.35)'
        : '0 0 16px rgba(255, 23, 68, 0.65), inset 0 0 14px rgba(255, 23, 68, 0.25)',
      bgGradient: `linear-gradient(180deg, rgba(255, 23, 68, 0.28) 0%, ${baseBgEnd} 75%)`,
      allowed: hasPermission('EMERGENCY_VIEW') || hasPermission('EMERGENCY_EDIT'),
      onClick: onEmergency,
    },
  ];

  // Smooth curve math with compact 1-inch button dimensions
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let animFrameId: number | null = null;
    let cachedClientWidth = container.clientWidth || 360;
    const CARD_WIDTH = 68;
    const CARD_GAP = 10;
    const PITCH = CARD_WIDTH + CARD_GAP;
    const PADDING_LEFT = 12;

    const updateMeasurements = () => {
      cachedClientWidth = container.clientWidth || 360;
    };

    const applyCurvature = () => {
      const scrollLeft = container.scrollLeft;
      const radius = cachedClientWidth * 0.75;
      const centerX = scrollLeft + cachedClientWidth / 2;

      for (let i = 0; i < items.length; i++) {
        const card = cardRefs.current[i];
        if (!card) continue;

        const cardCenter = PADDING_LEFT + i * PITCH + CARD_WIDTH / 2;
        const diff = (cardCenter - centerX) / radius;
        const clamped = Math.max(-1.5, Math.min(1.5, diff));

        const translateY = clamped * clamped * 6;
        const rotateZ = clamped * 3.5;
        const rotateY = clamped * -5;
        const scale = 1.01 - Math.abs(clamped) * 0.03;

        card.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, 0) rotateZ(${rotateZ.toFixed(1)}deg) rotateY(${rotateY.toFixed(1)}deg) scale(${scale.toFixed(2)})`;
      }
      animFrameId = null;
    };

    const handleScroll = () => {
      if (animFrameId === null) {
        animFrameId = requestAnimationFrame(applyCurvature);
      }
    };

    updateMeasurements();
    applyCurvature();

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', () => {
      updateMeasurements();
      handleScroll();
    }, { passive: true });

    return () => {
      if (animFrameId !== null) cancelAnimationFrame(animFrameId);
      container.removeEventListener('scroll', handleScroll);
    };
  }, [items.length]);

  return (
    <div className="relative w-full pt-0.5 pb-1 overflow-hidden">
      {/* Curved Arc Track with GPU-accelerated touch physics */}
      <div
        ref={scrollContainerRef}
        className="flex gap-2.5 overflow-x-auto scrollbar-none pt-1 pb-3 px-3 overscroll-x-contain"
        style={{
          WebkitOverflowScrolling: 'touch',
          perspective: '1000px',
          perspectiveOrigin: '50% 50%',
          touchAction: 'pan-x',
        }}
      >
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (item.allowed) {
                  item.onClick();
                } else {
                  handleRestrictedClick(item.name);
                }
              }}
              className={`relative shrink-0 w-[68px] sm:w-[72px] h-[92px] sm:h-[96px] rounded-2xl p-2 flex flex-col items-center justify-between text-center transition-transform duration-150 active:scale-95 cursor-pointer border select-none kinora-3d-action-card ${
                !item.allowed ? 'opacity-40 filter grayscale-[50%]' : ''
              } ${
                isLight
                  ? 'bg-gradient-to-b from-[#FFF8F1] via-[#F8EDE0] to-[#F05A28]/90 border-[#EAD6C4] border-t-white border-b-[2.5px] border-b-[#D3542F] text-[#1F1F1F]'
                  : 'bg-gradient-to-b from-[#0D152D] via-[#0E1730] to-[#0A1024] border-slate-700/70 border-t-white/20 border-b-[2.5px] border-b-black/90 text-white'
              }`}
              style={{
                boxShadow: item.glowShadow,
                willChange: 'transform',
              }}
            >
              {!item.allowed && (
                <div className="absolute top-1 right-1 bg-rose-600 text-white p-0.5 rounded-full shadow-md z-10">
                  <Lock className="w-2.5 h-2.5" />
                </div>
              )}
              {/* Top Neon Pastel Icon Box */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs transition-transform duration-200 group-hover:scale-110 shrink-0 mt-0.5 kinora-3d-icon-box"
                style={{
                  backgroundColor: item.pastelBg,
                  borderColor: isLight ? '#EAD6C4' : `${item.neonColor}60`,
                }}
              >
                <Icon
                  className="w-5 h-5 stroke-[2.2]"
                  style={{ color: item.neonColor }}
                />
              </div>

              {/* Action Titles */}
              <div className="w-full min-w-0 space-y-0.5 mb-1">
                <span className={`block font-extrabold text-[10.5px] sm:text-xs leading-tight tracking-tight truncate ${
                  isLight ? 'text-[#1F1F1F]' : 'text-white'
                }`}>
                  {item.name}
                </span>
                <span className={`block text-[9px] font-semibold leading-none truncate ${
                  isLight ? 'text-[#6B6B6B]' : 'text-slate-400'
                }`}>
                  {item.sub}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
