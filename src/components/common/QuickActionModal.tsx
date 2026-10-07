import React, { useState } from 'react';
import {
  X,
  Receipt,
  Target,
  FileUp,
  CheckSquare,
  Camera,
  Sparkles,
  Heart,
  PiggyBank,
  TrendingUp,
  Wrench,
  ShieldAlert,
  ArrowDownLeft,
  CalendarDays,
  Gift,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';

export type QuickActionType =
  | 'ADD_EXPENSE'
  | 'ADD_INCOME'
  | 'ADD_BUDGET'
  | 'ADD_FIXED_EXPENSES'
  | 'CREATE_GOAL'
  | 'ADD_WEALTH'
  | 'ADD_FRIEND'
  | 'ADD_TASK'
  | 'ADD_WISHLIST'
  | 'ADD_MAINTENANCE'
  | 'UPLOAD_DOC'
  | 'ADD_EMERGENCY'
  | 'ADD_MEMORY'
  | 'ADD_VISITING_CARD'
  | 'ASK_AI';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActionSelect: (actionType: QuickActionType) => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({ isOpen, onClose, onActionSelect }) => {
  const { hasPermission } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'ALL' | 'FINANCE' | 'FAMILY' | 'VAULT'>('ALL');

  if (!isOpen) return null;

  const actions: Array<{
    id: QuickActionType;
    label: string;
    description: string;
    category: 'FINANCE' | 'FAMILY' | 'VAULT' | 'AI';
    categoryName: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    allowed: boolean;
  }> = [
    {
      id: 'ADD_EXPENSE',
      label: 'Record Expense',
      description: 'UPI, receipt scan or manual entry',
      category: 'FINANCE',
      categoryName: 'Finance',
      icon: Receipt,
      color: isLight ? 'bg-[#FFE6DE] border-[#FFD0C2] text-[#E85A24]' : 'bg-orange-500/20 border-orange-500/40 text-orange-400',
      ctaText: 'Add Now',
      ctaColor: isLight ? 'text-[#E85A24]' : 'text-orange-400',
      allowed: hasPermission('FINANCE_EDIT') || hasPermission('FINANCE_VIEW'),
    },
    {
      id: 'ADD_INCOME',
      label: 'Record Income',
      description: 'Salary, dividends, rental income',
      category: 'FINANCE',
      categoryName: 'Finance',
      icon: ArrowDownLeft,
      color: isLight ? 'bg-[#DCFCE7] border-[#BBF7D0] text-[#16A34A]' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
      ctaText: 'Credit',
      ctaColor: isLight ? 'text-[#16A34A]' : 'text-emerald-400',
      allowed: hasPermission('FINANCE_EDIT') || hasPermission('FINANCE_VIEW'),
    },
    {
      id: 'ADD_BUDGET',
      label: 'Category Budget',
      description: 'Monthly limits & alerts',
      category: 'FINANCE',
      categoryName: 'Budget',
      icon: PiggyBank,
      color: isLight ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#D97706]' : 'bg-amber-500/20 border-amber-500/40 text-amber-400',
      ctaText: 'Limits',
      ctaColor: isLight ? 'text-[#D97706]' : 'text-amber-400',
      allowed: hasPermission('FINANCE_EDIT') || hasPermission('FINANCE_VIEW'),
    },
    {
      id: 'ADD_FIXED_EXPENSES',
      label: 'Fixed Expenses',
      description: 'EMIs, rent, subscriptions',
      category: 'FINANCE',
      categoryName: 'Bills',
      icon: CalendarDays,
      color: isLight ? 'bg-[#EDE9FE] border-[#DDD6FE] text-[#7C3AED]' : 'bg-purple-500/20 border-purple-500/40 text-purple-400',
      ctaText: 'Schedule',
      ctaColor: isLight ? 'text-[#7C3AED]' : 'text-purple-400',
      allowed: hasPermission('FINANCE_EDIT') || hasPermission('FINANCE_VIEW'),
    },
    {
      id: 'CREATE_GOAL',
      label: 'Family Goal',
      description: 'Vacation, emergency fund',
      category: 'FINANCE',
      categoryName: 'Goals',
      icon: Target,
      color: isLight ? 'bg-[#CCFBF1] border-[#99F6E4] text-[#0D9488]' : 'bg-teal-500/20 border-teal-500/40 text-teal-400',
      ctaText: 'Target',
      ctaColor: isLight ? 'text-[#0D9488]' : 'text-teal-400',
      allowed: hasPermission('FINANCE_EDIT') || hasPermission('FINANCE_VIEW'),
    },
    {
      id: 'ADD_WEALTH',
      label: 'Wealth & Assets',
      description: 'Stocks, MFs, FDs & Demat',
      category: 'FINANCE',
      categoryName: 'Wealth',
      icon: TrendingUp,
      color: isLight ? 'bg-[#E0F2FE] border-[#BAE6FD] text-[#0284C7]' : 'bg-blue-500/20 border-blue-500/40 text-blue-400',
      ctaText: 'Portfolio',
      ctaColor: isLight ? 'text-[#0284C7]' : 'text-blue-400',
      allowed: hasPermission('FINANCE_EDIT') || hasPermission('INVESTMENT_EDIT') || hasPermission('FINANCE_VIEW') || hasPermission('INVESTMENT_VIEW'),
    },
    {
      id: 'ADD_FRIEND',
      label: 'Birthday & Event',
      description: 'Anniversaries & reminders',
      category: 'FAMILY',
      categoryName: 'Dates',
      icon: Heart,
      color: isLight ? 'bg-[#FFE4E6] border-[#FECDD3] text-[#E11D48]' : 'bg-pink-500/20 border-pink-500/40 text-pink-400',
      ctaText: 'Celebrate',
      ctaColor: isLight ? 'text-[#E11D48]' : 'text-pink-400',
      allowed: hasPermission('CALENDAR_VIEW') || hasPermission('CALENDAR_EDIT'),
    },
    {
      id: 'ADD_TASK',
      label: 'Family Task',
      description: 'Chores, bills, grocery items',
      category: 'FAMILY',
      categoryName: 'Tasks',
      icon: CheckSquare,
      color: isLight ? 'bg-[#E0F2FE] border-[#BAE6FD] text-[#0284C7]' : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400',
      ctaText: 'Assign',
      ctaColor: isLight ? 'text-[#0284C7]' : 'text-cyan-400',
      allowed: hasPermission('TASK_EDIT') || hasPermission('TASK_VIEW'),
    },
    {
      id: 'ADD_WISHLIST',
      label: 'Family Wish List',
      description: 'Gifts, gadgets & dreams',
      category: 'FAMILY',
      categoryName: 'Wishes',
      icon: Gift,
      color: isLight ? 'bg-[#CCFBF1] border-[#99F6E4] text-[#0F766E]' : 'bg-teal-500/20 border-teal-500/40 text-teal-300',
      ctaText: 'Wish',
      ctaColor: isLight ? 'text-[#0F766E]' : 'text-teal-300',
      allowed: hasPermission('TASK_EDIT') || hasPermission('TASK_VIEW'),
    },
    {
      id: 'ADD_MAINTENANCE',
      label: 'Home Maintenance',
      description: 'Repairs, servicing & care',
      category: 'FAMILY',
      categoryName: 'Home',
      icon: Wrench,
      color: isLight ? 'bg-[#F1F5F9] border-[#CBD5E1] text-[#475569]' : 'bg-slate-700/60 border-slate-600 text-slate-300',
      ctaText: 'Service',
      ctaColor: isLight ? 'text-[#475569]' : 'text-slate-300',
      allowed: hasPermission('TASK_EDIT') || hasPermission('TASK_VIEW'),
    },
    {
      id: 'ADD_VISITING_CARD',
      label: 'Visiting Cards',
      description: 'Snap photo & save cards',
      category: 'VAULT',
      categoryName: 'Cards',
      icon: CreditCard,
      color: isLight ? 'bg-[#E0E7FF] border-[#C7D2FE] text-[#4F46E5]' : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400',
      ctaText: 'Scan',
      ctaColor: isLight ? 'text-[#4F46E5]' : 'text-indigo-400',
      allowed: hasPermission('DOCUMENT_UPLOAD') || hasPermission('DOCUMENT_VIEW'),
    },
    {
      id: 'UPLOAD_DOC',
      label: 'Store Document',
      description: 'Aadhaar, PAN & policies',
      category: 'VAULT',
      categoryName: 'Vault',
      icon: FileUp,
      color: isLight ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#B45309]' : 'bg-amber-500/20 border-amber-500/40 text-amber-300',
      ctaText: 'Upload',
      ctaColor: isLight ? 'text-[#B45309]' : 'text-amber-300',
      allowed: hasPermission('DOCUMENT_UPLOAD') || hasPermission('DOCUMENT_VIEW'),
    },
    {
      id: 'ADD_EMERGENCY',
      label: 'Emergency Vault',
      description: 'Medical IDs & contacts',
      category: 'VAULT',
      categoryName: 'Medical',
      icon: ShieldAlert,
      color: isLight ? 'bg-[#FFE4E6] border-[#FECDD3] text-[#E11D48]' : 'bg-rose-500/20 border-rose-500/40 text-rose-400',
      ctaText: 'Access',
      ctaColor: isLight ? 'text-[#E11D48]' : 'text-rose-400',
      allowed: hasPermission('EMERGENCY_EDIT') || hasPermission('EMERGENCY_VIEW'),
    },
    {
      id: 'ADD_MEMORY',
      label: 'Save Memory',
      description: 'Family trips, photos, stories',
      category: 'FAMILY',
      categoryName: 'Memories',
      icon: Camera,
      color: isLight ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#D97706]' : 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300',
      ctaText: 'Capture',
      ctaColor: isLight ? 'text-[#D97706]' : 'text-yellow-300',
      allowed: hasPermission('MEMORY_UPLOAD') || hasPermission('MEMORY_VIEW'),
    },
    {
      id: 'ASK_AI',
      label: 'Ask Family AI',
      description: 'Insights, plans & advice',
      category: 'AI',
      categoryName: 'AI',
      icon: Sparkles,
      color: isLight ? 'bg-[#F3E8FF] border-[#E9D5FF] text-[#9333EA]' : 'bg-purple-500/20 border-purple-500/40 text-purple-300',
      ctaText: 'Ask AI',
      ctaColor: isLight ? 'text-[#9333EA]' : 'text-purple-300',
      allowed: hasPermission('AI_USE'),
    },
  ];

  const categoryCounts = {
    ALL: actions.length,
    FINANCE: actions.filter((a) => a.category === 'FINANCE').length,
    FAMILY: actions.filter((a) => a.category === 'FAMILY' || a.category === 'AI').length,
    VAULT: actions.filter((a) => a.category === 'VAULT').length,
  };

  const filteredActions = actions.filter((act) => {
    if (selectedCategoryFilter === 'ALL') return true;
    if (selectedCategoryFilter === 'FINANCE') return act.category === 'FINANCE';
    if (selectedCategoryFilter === 'FAMILY') return act.category === 'FAMILY' || act.category === 'AI';
    if (selectedCategoryFilter === 'VAULT') return act.category === 'VAULT';
    return true;
  });

  return (
    <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 ${isLight ? 'bg-black/60' : 'bg-black/80'} backdrop-blur-md animate-fade-in`}>
      <div
        className={`w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] p-5 pb-[max(env(safe-area-inset-bottom,0px),24px)] sm:pb-5 space-y-3.5 shadow-[0_25px_60px_-10px_rgba(42,27,20,0.45)] border ${
          isLight
            ? 'bg-gradient-to-b from-[#F9F3EA] to-[#F5ECE0] border-[#EADBCC] text-[#261C16]'
            : 'bg-gradient-to-b from-[#101935] to-[#0A1024] border-slate-700/80 text-[#F4F8FF]'
        }`}
      >
        {/* Mobile Drag Sheet Handle */}
        <div className={`w-12 h-1.5 rounded-full mx-auto -mt-1 mb-2 opacity-75 sm:hidden ${isLight ? 'bg-[#D4C3B2]' : 'bg-slate-600'}`} />

        {/* Header Section */}
        <div className={`flex items-start justify-between pb-3 border-b ${isLight ? 'border-[#EADBCC]' : 'border-slate-800'}`}>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-lg sm:text-xl font-black tracking-tight ${isLight ? 'text-[#261C16]' : 'text-white'}`}>
                Create & Record
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                isLight
                  ? 'bg-[#E85A24]/12 text-[#D34C17] border-[#E85A24]/20'
                  : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
              }`}>
                Famora Hub
              </span>
            </div>
            <p className={`text-xs mt-0.5 font-medium ${isLight ? 'text-[#7A665A]' : 'text-slate-400'}`}>
              Quickly record or plan for your family in one place
            </p>
          </div>

          {/* Close Button Pill 3D */}
          <button
            onClick={onClose}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-sm border cursor-pointer ${
              isLight
                ? 'bg-[#EFE3D5] hover:bg-[#E6D7C7] border-[#DFCEBD] text-[#5C483C] hover:text-[#261C16]'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 select-none">
          {[
            { key: 'ALL', label: 'All Actions', count: categoryCounts.ALL },
            { key: 'FINANCE', label: '💰 Money & Wealth', count: categoryCounts.FINANCE },
            { key: 'FAMILY', label: '🏡 Family & Chores', count: categoryCounts.FAMILY },
            { key: 'VAULT', label: '🔒 Vault & Medical', count: categoryCounts.VAULT },
          ].map((pill) => {
            const isActive = selectedCategoryFilter === pill.key;
            return (
              <button
                key={pill.key}
                onClick={() => setSelectedCategoryFilter(pill.key as any)}
                className={`px-3 py-1.5 rounded-2xl text-[11px] font-extrabold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#E85A24] to-[#D34C17] text-white border-[#D34C17] shadow-[0_4px_12px_-1px_rgba(211,76,23,0.35)]'
                    : isLight
                    ? 'bg-[#EFE4D6] border-[#E2D3C2] text-[#634E41] hover:bg-[#E8DCCF] hover:text-[#261C16]'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>{pill.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-white/25 text-white' : isLight ? 'bg-black/5 text-[#7A665A]' : 'bg-white/10 text-slate-300'
                }`}>
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 2-Column Action Cards Grid */}
        <div className="grid grid-cols-2 gap-2.5 max-h-[58vh] sm:max-h-[62vh] overflow-y-auto pr-1 scrollbar-thin">
          {filteredActions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                disabled={!act.allowed}
                onClick={() => {
                  onActionSelect(act.id);
                  onClose();
                }}
                className={`group flex flex-col justify-between text-left p-3.5 rounded-[22px] border transition-all ${
                  act.allowed
                    ? isLight
                      ? 'bg-gradient-to-b from-[#FFFFFF] to-[#FAF3EA] border-[#EADBCC] shadow-[0_4px_12px_-2px_rgba(120,80,50,0.06),0_2px_4px_rgba(120,80,50,0.03)] hover:border-[#DDA380] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] cursor-pointer'
                      : 'bg-gradient-to-b from-[#131D38] to-[#0D152D] border-slate-700/80 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4)] hover:border-cyan-500/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] cursor-pointer'
                    : isLight
                    ? 'opacity-40 cursor-not-allowed bg-[#E8DDD0] border-[#DECFC0]'
                    : 'opacity-40 cursor-not-allowed bg-[#070D1E] border-slate-800'
                }`}
              >
                <div>
                  {/* Top Icon & Badge Row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm ${act.color}`}>
                      <Icon className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <span className={`text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${
                      isLight ? 'bg-[#EFE3D5] text-[#7A665A] border-[#DECFC0]' : 'bg-slate-800/90 text-slate-400 border-slate-700'
                    }`}>
                      {act.categoryName}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className={`font-extrabold text-xs sm:text-[13px] leading-snug line-clamp-1 transition-colors ${
                    isLight ? 'text-[#261C16] group-hover:text-[#D34C17]' : 'text-white group-hover:text-cyan-300'
                  }`}>
                    {act.label}
                  </div>
                  <div className={`text-[10px] line-clamp-1 mt-0.5 leading-normal font-medium ${
                    isLight ? 'text-[#7A665A]' : 'text-slate-400'
                  }`}>
                    {act.description}
                  </div>
                </div>

                {/* Footer Micro CTA Row */}
                <div className={`mt-2 pt-1.5 border-t flex items-center justify-between text-[10px] font-bold ${
                  isLight ? 'border-[#F0E4D6]' : 'border-slate-800/80'
                }`}>
                  {act.allowed ? (
                    <>
                      <span className={act.ctaColor}>{act.ctaText}</span>
                      <span className={`transition-transform group-hover:translate-x-0.5 ${act.ctaColor}`}>→</span>
                    </>
                  ) : (
                    <span className={isLight ? 'text-rose-600' : 'text-rose-400'}>No Access</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Hint Note */}
        <div className={`pt-2.5 border-t flex items-center justify-between text-[11px] ${
          isLight ? 'border-[#EADBCC] text-[#7A665A]' : 'border-slate-800 text-slate-400'
        }`}>
          <div className="flex items-center gap-1.5">
            <span className="text-[#E85A24]">⚡</span>
            <span>Instant sync across all family devices</span>
          </div>
          <span className={`font-bold ${isLight ? 'text-[#261C16]' : 'text-slate-200'}`}>Famora</span>
        </div>
      </div>
    </div>
  );
};
