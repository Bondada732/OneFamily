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
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.js';

export interface QuickActionItem {
  id: string;
  name: string;
  sub: string;
  icon: React.ElementType;
  neonColor: string;
  pastelBg: string;
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
  onFriends?: () => void;
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
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const baseBgEnd = isLight ? 'rgba(240, 90, 40, 0.95)' : 'rgba(13, 21, 45, 0.95)';

  const items: QuickActionItem[] = [
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
    const PADDING_LEFT = 12;
    const PITCH = CARD_WIDTH + CARD_GAP; // 78px

    const updateMeasurements = () => {
      if (container) {
        cachedClientWidth = container.clientWidth;
      }
    };

    const applyCurvature = () => {
      const scrollLeft = container.scrollLeft;
      const centerX = scrollLeft + cachedClientWidth / 2;
      const radius = cachedClientWidth * 0.48;

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
                item.onClick();
              }}
              className="relative shrink-0 rounded-[20px] p-0 overflow-hidden cursor-pointer active:scale-95 text-left focus:outline-none group select-none transition-all kinora-3d-tile"
              style={{
                width: '76px',
                minWidth: '76px',
                height: '86px',
                border: isLight ? undefined : `1.5px solid ${item.neonColor}`,
                borderTop: isLight ? '1px solid rgba(255, 255, 255, 0.95)' : undefined,
                borderBottom: isLight ? '3px solid #DEC8B2' : undefined,
                borderLeft: isLight ? '1px solid #EAD6C4' : undefined,
                borderRight: isLight ? '1px solid #EAD6C4' : undefined,
                boxShadow: isLight
                  ? '0 8px 18px -2px rgba(130, 80, 45, 0.16), 0 3px 6px rgba(130, 80, 45, 0.08), inset 0 1.5px 0.5px rgba(255, 255, 255, 0.95)'
                  : `${item.glowShadow}, 0 6px 16px -3px rgba(0, 0, 0, 0.75)`,
                background: isLight ? '#F3E3D3' : item.bgGradient,
                borderRadius: '20px',
                transformOrigin: '50% 120%',
                willChange: 'transform',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              {/* Curved Glass Reflection Sheen */}
              <div
                className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/40 via-white/10 to-transparent pointer-events-none"
                style={{
                  borderTopLeftRadius: '20px',
                  borderTopRightRadius: '20px',
                }}
              />

              {/* Card Interior */}
              <div className="relative z-10 w-full h-full p-2 flex flex-col justify-center items-center gap-1.5 text-center">
                {/* Center Pastel 3D Icon Squircle */}
                <div
                  className="w-10 h-10 rounded-[14px] flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shadow-xs kinora-3d-icon-box"
                  style={{
                    backgroundColor: isLight ? item.pastelBg : 'rgba(5, 8, 17, 0.85)',
                    border: isLight ? '1px solid rgba(255, 255, 255, 0.9)' : `1.2px solid ${item.neonColor}`,
                    color: item.neonColor,
                    boxShadow: isLight
                      ? '0 3px 8px -1px rgba(100, 60, 30, 0.12), inset 0 1.5px 0.5px rgba(255, 255, 255, 0.95), inset 0 -1.5px 0 rgba(0, 0, 0, 0.06)'
                      : `0 0 10px ${item.neonColor}60`,
                  }}
                >
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>

                {/* Bottom Label */}
                <div className="w-full px-0.5">
                  <span
                    className={`block text-[9.5px] sm:text-[10px] font-bold leading-tight ${
                      isLight ? 'text-[#1F1F1F]' : 'text-white drop-shadow-sm'
                    }`}
                  >
                    {item.name}
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
