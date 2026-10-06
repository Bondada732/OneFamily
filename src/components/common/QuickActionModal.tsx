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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';

export type QuickActionType =
  | 'ADD_EXPENSE'
  | 'ADD_INCOME'
  | 'ADD_BUDGET'
  | 'ADD_WEALTH'
  | 'CREATE_GOAL'
  | 'ADD_FRIEND'
  | 'ADD_TASK'
  | 'ADD_MAINTENANCE'
  | 'UPLOAD_DOC'
  | 'ADD_EMERGENCY'
  | 'ADD_MEMORY'
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
      color: isLight ? 'bg-[#F7D4BC] text-[#B84A1E] border-[#E8BC9E]' : 'bg-[rgba(255,138,36,0.18)] text-[#FFD21F] border-[#FF8A24]/40',
      allowed: hasPermission('FINANCE_EDIT'),
    },
    {
      id: 'ADD_INCOME',
      label: 'Record Income',
      description: 'Salary, dividends, rental income',
      category: 'FINANCE',
      categoryName: 'Finance',
      icon: ArrowDownLeft,
      color: isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      allowed: hasPermission('FINANCE_EDIT'),
    },
    {
      id: 'ADD_BUDGET',
      label: 'Category Budget',
      description: 'Set monthly spending limits',
      category: 'FINANCE',
      categoryName: 'Finance',
      icon: PiggyBank,
      color: isLight ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      allowed: hasPermission('FINANCE_EDIT'),
    },
    {
      id: 'ADD_WEALTH',
      label: 'Wealth & Assets',
      description: 'Stocks, MFs, FDs, Demat sync',
      category: 'FINANCE',
      categoryName: 'Wealth',
      icon: TrendingUp,
      color: isLight ? 'bg-blue-100 text-blue-900 border-blue-300' : 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      allowed: hasPermission('FINANCE_EDIT') || hasPermission('INVESTMENT_EDIT'),
    },
    {
      id: 'CREATE_GOAL',
      label: 'Set Family Goal',
      description: 'Vacation, emergency fund, education',
      category: 'FINANCE',
      categoryName: 'Goals',
      icon: Target,
      color: isLight ? 'bg-[#E4D7C7] text-[#2E7D32] border-[#DECFC0]' : 'bg-[rgba(25,201,167,0.18)] text-[#55D98A] border-[#19C9A7]/40',
      allowed: hasPermission('FINANCE_EDIT'),
    },
    {
      id: 'ADD_FRIEND',
      label: 'Family & Friend Date',
      description: 'Birthdays, anniversaries, occasions',
      category: 'FAMILY',
      categoryName: 'Reminders',
      icon: Heart,
      color: isLight ? 'bg-[#F7D4BC] text-[#B84A1E] border-[#E8BC9E]' : 'bg-pink-500/20 text-[#FF4D8D] border-pink-500/40',
      allowed: true,
    },
    {
      id: 'ADD_TASK',
      label: 'Add Family Task',
      description: 'Chores, bills, grocery items',
      category: 'FAMILY',
      categoryName: 'Tasks',
      icon: CheckSquare,
      color: isLight ? 'bg-[#E4D7C7] text-[#C25425] border-[#DECFC0]' : 'bg-[rgba(22,199,242,0.18)] text-[#7EDCFF] border-[#16C7F2]/40',
      allowed: hasPermission('TASK_EDIT'),
    },
    {
      id: 'ADD_MAINTENANCE',
      label: 'Home Maintenance',
      description: 'Repairs, servicing, appliance care',
      category: 'FAMILY',
      categoryName: 'Home',
      icon: Wrench,
      color: isLight ? 'bg-slate-200 text-slate-800 border-slate-300' : 'bg-slate-700/60 text-slate-200 border-slate-600',
      allowed: hasPermission('TASK_EDIT'),
    },
    {
      id: 'UPLOAD_DOC',
      label: 'Store Document',
      description: 'Aadhaar, PAN, insurance with OCR',
      category: 'VAULT',
      categoryName: 'Vault',
      icon: FileUp,
      color: isLight ? 'bg-[#E4D7C7] text-[#B87333] border-[#DECFC0]' : 'bg-[rgba(22,139,255,0.18)] text-[#16C7F2] border-[#168BFF]/40',
      allowed: hasPermission('DOCUMENT_UPLOAD'),
    },
    {
      id: 'ADD_EMERGENCY',
      label: 'Emergency Vault',
      description: 'Medical IDs, emergency contacts',
      category: 'VAULT',
      categoryName: 'Emergency',
      icon: ShieldAlert,
      color: isLight ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-500/20 text-rose-400 border-rose-500/40',
      allowed: hasPermission('EMERGENCY_EDIT') || hasPermission('EMERGENCY_VIEW'),
    },
    {
      id: 'ADD_MEMORY',
      label: 'Save Memory / Photo',
      description: 'Family trips, birthdays, stories',
      category: 'FAMILY',
      categoryName: 'Memories',
      icon: Camera,
      color: isLight ? 'bg-[#F7D4BC] text-[#B84A1E] border-[#E8BC9E]' : 'bg-[rgba(255,185,31,0.18)] text-[#FFD21F] border-[#FFB91F]/40',
      allowed: hasPermission('MEMORY_UPLOAD'),
    },
    {
      id: 'ASK_AI',
      label: 'Ask FamilyAI',
      description: 'Insights, checklists, wealth advice',
      category: 'AI',
      categoryName: 'AI',
      icon: Sparkles,
      color: isLight ? 'bg-[#F7D4BC] text-[#B84A1E] border-[#E8BC9E]' : 'bg-[rgba(22,139,255,0.18)] text-[#B9F36B] border-[#16C7F2]/40',
      allowed: true,
    },
  ];

  const filteredActions = actions.filter((act) => {
    if (selectedCategoryFilter === 'ALL') return true;
    if (selectedCategoryFilter === 'FINANCE') return act.category === 'FINANCE';
    if (selectedCategoryFilter === 'FAMILY') return act.category === 'FAMILY' || act.category === 'AI';
    if (selectedCategoryFilter === 'VAULT') return act.category === 'VAULT';
    return true;
  });

  return (
    <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 ${isLight ? 'bg-black/50' : 'bg-black/80'} backdrop-blur-md animate-fade-in`}>
      <div className={`w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] p-4 sm:p-5 pb-[max(env(safe-area-inset-bottom,0px),24px)] sm:pb-5 space-y-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.95)] ${
        isLight
          ? 'bg-[#EFE4D6] border-t sm:border-2 border-[#DECFC0] text-[#2A1B14]'
          : 'bg-[#0B1226] border-t sm:border border-slate-700/80 text-[#F4F8FF]'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between pb-2 border-b ${isLight ? 'border-[#DECFC0]' : 'border-slate-800'}`}>
          <div>
            <h3 className={`text-base sm:text-lg font-extrabold ${isLight ? 'text-[#2A1B14]' : 'text-white'}`}>Create & Record</h3>
            <p className={`text-xs ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>What would you like to add to KinoraOne?</p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors cursor-pointer ${
            isLight
              ? 'hover:bg-[#EBE0D2] text-[#634B3F] hover:text-[#2A1B14]'
              : 'hover:bg-[#0E1730] text-slate-400 hover:text-white'
          }`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {[
            { key: 'ALL', label: 'All Actions (12)' },
            { key: 'FINANCE', label: 'Money & Wealth' },
            { key: 'FAMILY', label: 'Family & Chores' },
            { key: 'VAULT', label: 'Vault & Medical' },
          ].map((pill) => {
            const isActive = selectedCategoryFilter === pill.key;
            return (
              <button
                key={pill.key}
                onClick={() => setSelectedCategoryFilter(pill.key as any)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold whitespace-nowrap transition-all border cursor-pointer ${
                  isActive
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : isLight
                    ? 'bg-[#EBE0D2] border-[#DECFC0] text-[#4A3B32] hover:bg-[#E4D7C7]'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        {/* 2-Column Action Grid */}
        <div className="grid grid-cols-2 gap-2.5 max-h-[60vh] sm:max-h-[65vh] overflow-y-auto pr-1 scrollbar-thin">
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
                className={`flex flex-col text-left p-3 rounded-2xl border transition-all ${
                  act.allowed
                    ? isLight
                      ? 'hover:scale-[1.02] active:scale-95 bg-[#EBE0D2] border-[#DECFC0] hover:border-[#C25425] shadow-sm'
                      : 'hover:scale-[1.02] active:scale-95 bg-[#0D152D] border-slate-700/70 hover:border-[#16C7F2]/60 shadow-sm'
                    : isLight
                    ? 'opacity-40 cursor-not-allowed bg-[#E4D7C7] border-[#DECFC0]'
                    : 'opacity-40 cursor-not-allowed bg-[#050811] border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${act.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                    isLight ? 'bg-[#FFF8F1] border-[#DECFC0] text-[#634B3F]' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                    {act.categoryName}
                  </span>
                </div>
                <div className={`font-extrabold text-xs ${isLight ? 'text-[#2A1B14]' : 'text-white'}`}>{act.label}</div>
                <div className={`text-[10px] line-clamp-1 mt-0.5 ${isLight ? 'text-[#634B3F]' : 'text-[#B9D8FF]/80'}`}>{act.description}</div>
                {!act.allowed && (
                  <span className={`text-[9px] font-semibold mt-1 ${isLight ? 'text-[#C62828]' : 'text-[#FF4D6D]'}`}>No Permission</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
