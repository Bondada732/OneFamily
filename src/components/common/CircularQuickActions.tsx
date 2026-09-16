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
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const items: QuickActionItem[] = [
    {
      id: 'expense',
      num: '1',
      name: 'Add Expense',
      sub: 'Quick Pay',
      icon: Receipt,
      neonColor: '#FF2A55',
      glowShadow: '0 0 16px rgba(255, 42, 85, 0.65), inset 0 0 14px rgba(255, 42, 85, 0.25)',
      bgGradient: 'linear-gradient(180deg, rgba(255, 42, 85, 0.22) 0%, rgba(13, 21, 45, 0.95) 75%)',
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
      bgGradient: 'linear-gradient(180deg, rgba(0, 210, 255, 0.22) 0%, rgba(13, 21, 45, 0.95) 75%)',
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
      bgGradient: 'linear-gradient(180deg, rgba(0, 230, 118, 0.22) 0%, rgba(13, 21, 45, 0.95) 75%)',
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
      bgGradient: 'linear-gradient(180deg, rgba(179, 136, 255, 0.22) 0%, rgba(13, 21, 45, 0.95) 75%)',
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
      bgGradient: 'linear-gradient(180deg, rgba(255, 214, 0, 0.22) 0%, rgba(13, 21, 45, 0.95) 75%)',
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
      bgGradient: 'linear-gradient(180deg, rgba(56, 189, 248, 0.22) 0%, rgba(13, 21, 45, 0.95) 75%)',
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
      bgGradient: 'linear-gradient(180deg, rgba(255, 109, 0, 0.22) 0%, rgba(13, 21, 45, 0.95) 75%)',
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
      bgGradient: 'linear-gradient(180deg, rgba(255, 23, 68, 0.22) 0%, rgba(13, 21, 45, 0.95) 75%)',
      onClick: onEmergency,
    },
  ];

  // Buttery smooth 120fps curve math with ZERO layout thrashing (No getBoundingClientRect in scroll loop!)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let animFrameId: number | null = null;
    let cachedClientWidth = container.clientWidth || 360;
    const CARD_WIDTH = 96;
    const CARD_GAP = 16;
    const PADDING_LEFT = 16;
    const PITCH = CARD_WIDTH + CARD_GAP; // 112px

    const updateMeasurements = () => {
      if (container) {
        cachedClientWidth = container.clientWidth;
      }
    };

    const applyCurvature = () => {
      const scrollLeft = container.scrollLeft;
      const centerX = scrollLeft + cachedClientWidth / 2;
      const radius = cachedClientWidth * 0.46;

      for (let i = 0; i < items.length; i++) {
        const card = cardRefs.current[i];
        if (!card) continue;

        // Pure arithmetic coordinate calculation - ZERO DOM queries!
        const cardCenter = PADDING_LEFT + i * PITCH + CARD_WIDTH / 2;
        const diff = (cardCenter - centerX) / radius;
        const clamped = Math.max(-1.5, Math.min(1.5, diff));

        // Parabolic arc curve equation: Center cards elevated, sides gracefully curve downward
        const translateY = clamped * clamped * 15;
        const rotateZ = clamped * 6.5; // degrees tilt along curve arc
        const rotateY = clamped * -10; // 3D cylinder curvature
        const scale = 1.02 - Math.abs(clamped) * 0.05;

        card.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, 0) rotateZ(${rotateZ.toFixed(1)}deg) rotateY(${rotateY.toFixed(1)}deg) scale(${scale.toFixed(2)})`;
      }
      animFrameId = null;
    };

    const handleScroll = () => {
      if (animFrameId === null) {
        animFrameId = requestAnimationFrame(applyCurvature);
      }
    };

    // Initial render
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
    <div className="relative w-full pt-1 pb-2 overflow-hidden">
      {/* Curved Arc Track with GPU-accelerated touch physics */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-none pt-2 pb-6 px-4 overscroll-x-contain"
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
              className="relative shrink-0 rounded-[28px] p-0 overflow-hidden cursor-pointer active:scale-95 text-left focus:outline-none group select-none shadow-2xl"
              style={{
                width: '96px',
                minWidth: '96px',
                height: '152px',
                border: `2px solid ${item.neonColor}`,
                boxShadow: `${item.glowShadow}, 0 10px 25px -5px rgba(0, 0, 0, 0.85)`,
                background: item.bgGradient,
                borderRadius: '28px',
                transformOrigin: '50% 120%',
                willChange: 'transform',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              {/* Curved Glass Reflection Sheen */}
              <div
                className="absolute inset-x-0 top-0 h-[46%] bg-gradient-to-b from-white/25 via-white/5 to-transparent pointer-events-none"
                style={{
                  borderTopLeftRadius: '26px',
                  borderTopRightRadius: '26px',
                }}
              />

              {/* Card Interior */}
              <div className="relative z-10 w-full h-full p-2.5 flex flex-col justify-between items-center text-center">
                {/* Top Number Indicator */}
                <div
                  className="text-2xl font-black tracking-tight"
                  style={{
                    color: item.neonColor,
                    textShadow: `0 0 14px ${item.neonColor}`,
                  }}
                >
                  {item.num}
                </div>

                {/* Center Glowing Icon with Curved Box */}
                <div
                  className="w-11 h-11 rounded-[18px] flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shadow-lg"
                  style={{
                    backgroundColor: 'rgba(5, 8, 17, 0.85)',
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
