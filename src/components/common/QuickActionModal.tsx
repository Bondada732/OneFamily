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
    cardBg: string;
    iconBg: string;
    titleColor: string;
    subColor: string;
    ctaColor: string;
    ctaText: string;
    allowed: boolean;
  }> = [
    {
      id: 'ADD_EXPENSE',
      label: 'Record Expense',
      description: 'UPI, receipt scan or manual',
      category: 'FINANCE',
      categoryName: 'Finance',
      icon: Receipt,
      cardBg: isLight
        ? 'bg-gradient-to-br from-[#EDF4E7] to-[#DCE7D4] border border-[#D1DFC7] shadow-[0_10px_22px_-4px_rgba(110,135,95,0.28),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-3px_4px_rgba(100,120,85,0.15)]'
        : 'bg-gradient-to-br from-[#1C281F] to-[#121B14] border border-emerald-800/60 shadow-[0_10px_22px_-4px_rgba(0,0,0,0.5)]',
      iconBg: 'bg-gradient-to-br from-[#6BB7A3] to-[#54A08C] shadow-[0_6px_14px_-2px_rgba(65,130,110,0.45),inset_0_2px_2px_rgba(255,255,255,0.65),inset_0_-2px_3px_rgba(30,70,60,0.25)] text-white',
      titleColor: isLight ? 'text-[#2C3B27]' : 'text-emerald-100',
      subColor: isLight ? 'text-[#55694F]' : 'text-emerald-400/80',
      ctaColor: isLight ? 'text-[#3B7061]' : 'text-emerald-300',
      ctaText: '+ Record',
      allowed: hasPermission('FINANCE_EDIT') || hasPermission('FINANCE_VIEW'),
    },
    {
      id: 'ADD_INCOME',
      label: 'Record Income',
      description: 'Salary, dividends, rental',
      category: 'FINANCE',
      categoryName: 'Finance',
      icon: ArrowDownLeft,
      cardBg: isLight
        ? 'bg-gradient-to-br from-[#FDECE5] to-[#F8D9CC] border border-[#F3C7B6] shadow-[0_10px_22px_-4px_rgba(200,110,90,0.25),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-3px_4px_rgba(180,90,70,0.15)]'
        : 'bg-gradient-to-br from-[#2B1B17] to-[#1D110E] border border-orange-900/60 shadow-[0_10px_22px_-4px_rgba(0,0,0,0.5)]',
      iconBg: 'bg-gradient-to-br from-[#F37D63] to-[#E06145] shadow-[0_6px_14px_-2px_rgba(200,80,55,0.45),inset_0_2px_2px_rgba(255,255,255,0.65),inset_0_-2px_3px_rgba(110,30,15,0.25)] text-white',
      titleColor: isLight ? 'text-[#4A261D]' : 'text-orange-100',
      subColor: isLight ? 'text-[#7E4C40]' : 'text-orange-300/80',
      ctaColor: isLight ? 'text-[#D44D31]' : 'text-orange-400',
      ctaText: 'Credit',
      allowed: hasPermission('FINANCE_EDIT') || hasPermission('FINANCE_VIEW'),
    },
    {
      id: 'ADD_BUDGET',
      label: 'Category Budget',
      description: 'Monthly limits & alerts',
      category: 'FINANCE',
      categoryName: 'Budget',
      icon: PiggyBank,
      cardBg: isLight
        ? 'bg-gradient-to-br from-[#FFF5E2] to-[#FCE8C5] border border-[#F7D8A2] shadow-[0_10px_22px_-4px_rgba(190,145,60,0.25),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-3px_4px_rgba(170,125,40,0.15)]'
        : 'bg-gradient-to-br from-[#2B2314] to-[#1C160B] border border-amber-900/60 shadow-[0_10px_22px_-4px_rgba(0,0,0,0.5)]',
      iconBg: 'bg-gradient-to-br from-[#F7BA43] to-[#E5A224] shadow-[0_6px_14px_-2px_rgba(195,130,20,0.45),inset_0_2px_2px_rgba(255,255,255,0.65),inset_0_-2px_3px_rgba(110,70,0,0.25)] text-white',
      titleColor: isLight ? 'text-[#473418]' : 'text-amber-100',
      subColor: isLight ? 'text-[#7A5B2D]' : 'text-amber-300/80',
      ctaColor: isLight ? 'text-[#B87A14]' : 'text-amber-400',
      ctaText: 'Limits',
      allowed: hasPermission('FINANCE_EDIT') || hasPermission('FINANCE_VIEW'),
    },
    {
      id: 'ADD_FIXED_EXPENSES',
      label: 'Fixed Expenses',
      description: 'EMIs, rent, subscriptions',
      category: 'FINANCE',
      categoryName: 'Bills',
      icon: CalendarDays,
      cardBg: isLight
        ? 'bg-gradient-to-br from-[#F3ECF9] to-[#E2D4F0] border border-[#D4C1E6] shadow-[0_10px_22px_-4px_rgba(140,110,170,0.25),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-3px_4px_rgba(110,80,140,0.15)]'
        : 'bg-gradient-to-br from-[#231A2E] to-[#150F1E] border border-purple-900/60 shadow-[0_10px_22px_-4px_rgba(0,0,0,0.5)]',
      iconBg: 'bg-gradient-to-br from-[#9F75C8] to-[#8655B2] shadow-[0_6px_14px_-2px_rgba(125,80,165,0.45),inset_0_2px_2px_rgba(255,255,255,0.65),inset_0_-2px_3px_rgba(60,25,95,0.25)] text-white',
      titleColor: isLight ? 'text-[#38224C]' : 'text-purple-100',
      subColor: isLight ? 'text-[#694887]' : 'text-purple-300/80',
      ctaColor: isLight ? 'text-[#7A4BA6]' : 'text-purple-400',
      ctaText: 'Schedule',
      allowed: hasPermission('FINANCE_EDIT') || hasPermission('FINANCE_VIEW'),
    },
    {
      id: 'CREATE_GOAL',
      label: 'Family Goal',
      description: 'Vacation, emergency fund',
      category: 'FINANCE',
      categoryName: 'Goals',
      icon: Target,
      cardBg: isLight
        ? 'bg-gradient-to-br from-[#EDF4E7] to-[#DCE7D4] border border-[#D1DFC7] shadow-[0_10px_22px_-4px_rgba(110,135,95,0.28),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-3px_4px_rgba(100,120,85,0.15)]'
        : 'bg-gradient-to-br from-[#1C281F] to-[#121B14] border border-emerald-800/60 shadow-[0_10px_22px_-4px_rgba(0,0,0,0.5)]',
      iconBg: 'bg-gradient-to-br from-[#6BB7A3] to-[#54A08C] shadow-[0_6px_14px_-2px_rgba(65,130,110,0.45),inset_0_2px_2px_rgba(255,255,255,0.65),inset_0_-2px_3px_rgba(30,70,60,0.25)] text-white',
      titleColor: isLight ? 'text-[#2C3B27]' : 'text-teal-100',
      subColor: isLight ? 'text-[#55694F]' : 'text-teal-300/80',
      ctaColor: isLight ? 'text-[#3B7061]' : 'text-teal-400',
      ctaText: 'Target',
      allowed: hasPermission('FINANCE_EDIT') || hasPermission('FINANCE_VIEW'),
    },
    {
      id: 'ADD_WEALTH',
      label: 'Wealth & Assets',
      description: 'Stocks, MFs, FDs & Demat',
      category: 'FINANCE',
      categoryName: 'Wealth',
      icon: TrendingUp,
      cardBg: isLight
        ? 'bg-gradient-to-br from-[#E8F0F7] to-[#D5E3EE] border border-[#C4D7E5] shadow-[0_10px_22px_-4px_rgba(100,140,175,0.25),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-3px_4px_rgba(80,115,145,0.15)]'
        : 'bg-gradient-to-br from-[#182430] to-[#0E1720] border border-sky-900/60 shadow-[0_10px_22px_-4px_rgba(0,0,0,0.5)]',
      iconBg: 'bg-gradient-to-br from-[#7FA6CD] to-[#638CB6] shadow-[0_6px_14px_-2px_rgba(75,115,155,0.45),inset_0_2px_2px_rgba(255,255,255,0.65),inset_0_-2px_3px_rgba(35,65,95,0.25)] text-white',
      titleColor: isLight ? 'text-[#233748]' : 'text-sky-100',
      subColor: isLight ? 'text-[#47647B]' : 'text-sky-300/80',
      ctaColor: isLight ? 'text-[#4B77A5]' : 'text-sky-400',
      ctaText: 'Portfolio',
      allowed: hasPermission('FINANCE_EDIT') || hasPermission('INVESTMENT_EDIT') || hasPermission('FINANCE_VIEW') || hasPermission('INVESTMENT_VIEW'),
    },
    {
      id: 'ADD_FRIEND',
      label: 'Family Date',
      description: 'Birthdays & anniversaries',
      category: 'FAMILY',
      categoryName: 'Dates',
      icon: Heart,
      cardBg: isLight
        ? 'bg-gradient-to-br from-[#FDECE5] to-[#F8D9CC] border border-[#F3C7B6] shadow-[0_10px_22px_-4px_rgba(200,110,90,0.25),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-3px_4px_rgba(180,90,70,0.15)]'
        : 'bg-gradient-to-br from-[#2B1B17] to-[#1D110E] border border-rose-900/60 shadow-[0_10px_22px_-4px_rgba(0,0,0,0.5)]',
      iconBg: 'bg-gradient-to-br from-[#F37D63] to-[#E06145] shadow-[0_6px_14px_-2px_rgba(200,80,55,0.45),inset_0_2px_2px_rgba(255,255,255,0.65),inset_0_-2px_3px_rgba(110,30,15,0.25)] text-white',
      titleColor: isLight ? 'text-[#4A261D]' : 'text-rose-100',
      subColor: isLight ? 'text-[#7E4C40]' : 'text-rose-300/80',
      ctaColor: isLight ? 'text-[#D44D31]' : 'text-rose-400',
      ctaText: 'Celebrate',
      allowed: hasPermission('CALENDAR_VIEW') || hasPermission('CALENDAR_EDIT'),
    },
    {
      id: 'ADD_TASK',
      label: 'Family Task',
      description: 'Chores, bills, groceries',
      category: 'FAMILY',
      categoryName: 'Tasks',
      icon: CheckSquare,
      cardBg: isLight
        ? 'bg-gradient-to-br from-[#E8F0F7] to-[#D5E3EE] border border-[#C4D7E5] shadow-[0_10px_22px_-4px_rgba(100,140,175,0.25),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-3px_4px_rgba(80,115,145,0.15)]'
        : 'bg-gradient-to-br from-[#182430] to-[#0E1720] border border-cyan-900/60 shadow-[0_10px_22px_-4px_rgba(0,0,0,0.5)]',
      iconBg: 'bg-gradient-to-br from-[#7FA6CD] to-[#638CB6] shadow-[0_6px_14px_-2px_rgba(75,115,155,0.45),inset_0_2px_2px_rgba(255,255,255,0.65),inset_0_-2px_3px_rgba(35,65,95,0.25)] text-white',
      titleColor: isLight ? 'text-[#233748]' : 'text-cyan-100',
      subColor: isLight ? 'text-[#47647B]' : 'text-cyan-300/80',
      ctaColor: isLight ? 'text-[#4B77A5]' : 'text-cyan-400',
      ctaText: 'Assign',
      allowed: hasPermission('TASK_EDIT') || hasPermission('TASK_VIEW'),
    },
    {
      id: 'ADD_WISHLIST',
      label: 'Wish List',
      description: 'Gifts, gadgets & dreams',
      category: 'FAMILY',
      categoryName: 'Wishes',
      icon: Gift,
      cardBg: isLight
        ? 'bg-gradient-to-br from-[#FFF5E2] to-[#FCE8C5] border border-[#F7D8A2] shadow-[0_10px_22px_-4px_rgba(190,145,60,0.25),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-3px_4px_rgba(170,125,40,0.15)]'
        : 'bg-gradient-to-br from-[#2B2314] to-[#1C160B] border border-amber-900/60 shadow-[0_10px_22px_-4px_rgba(0,0,0,0.5)]',
      iconBg: 'bg-gradient-to-br from-[#F7BA43] to-[#E5A224] shadow-[0_6px_14px_-2px_rgba(195,130,20,0.45),inset_0_2px_2px_rgba(255,255,255,0.65),inset_0_-2px_3px_rgba(110,70,0,0.25)] text-white',
      titleColor: isLight ? 'text-[#473418]' : 'text-amber-100',
      subColor: isLight ? 'text-[#7A5B2D]' : 'text-amber-300/80',
      ctaColor: isLight ? 'text-[#B87A14]' : 'text-amber-400',
      ctaText: 'Wish',
      allowed: hasPermission('TASK_EDIT') || hasPermission('TASK_VIEW'),
    },
    {
      id: 'ADD_MAINTENANCE',
      label: 'Maintenance',
      description: 'Repairs, RO, AC & care',
      category: 'FAMILY',
      categoryName: 'Home',
      icon: Wrench,
      cardBg: isLight
        ? 'bg-gradient-to-br from-[#EDF4E7] to-[#DCE7D4] border border-[#D1DFC7] shadow-[0_10px_22px_-4px_rgba(110,135,95,0.28),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-3px_4px_rgba(100,120,85,0.15)]'
        : 'bg-gradient-to-br from-[#1C281F] to-[#121B14] border border-slate-800/60 shadow-[0_10px_22px_-4px_rgba(0,0,0,0.5)]',
      iconBg: 'bg-gradient-to-br from-[#6BB7A3] to-[#54A08C] shadow-[0_6px_14px_-2px_rgba(65,130,110,0.45),inset_0_2px_2px_rgba(255,255,255,0.65),inset_0_-2px_3px_rgba(30,70,60,0.25)] text-white',
      titleColor: isLight ? 'text-[#2C3B27]' : 'text-slate-100',
      subColor: isLight ? 'text-[#55694F]' : 'text-slate-400',
      ctaColor: isLight ? 'text-[#3B7061]' : 'text-slate-300',
      ctaText: 'Service',
      allowed: hasPermission('TASK_EDIT') || hasPermission('TASK_VIEW'),
    },
    {
      id: 'ADD_VISITING_CARD',
      label: 'Visiting Cards',
      description: 'Snap & store contacts',
      category: 'VAULT',
      categoryName: 'Cards',
      icon: CreditCard,
      cardBg: isLight
        ? 'bg-gradient-to-br from-[#F3ECF9] to-[#E2D4F0] border border-[#D4C1E6] shadow-[0_10px_22px_-4px_rgba(140,110,170,0.25),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-3px_4px_rgba(110,80,140,0.15)]'
        : 'bg-gradient-to-br from-[#231A2E] to-[#150F1E] border border-indigo-900/60 shadow-[0_10px_22px_-4px_rgba(0,0,0,0.5)]',
      iconBg: 'bg-gradient-to-br from-[#9F75C8] to-[#8655B2] shadow-[0_6px_14px_-2px_rgba(125,80,165,0.45),inset_0_2px_2px_rgba(255,255,255,0.65),inset_0_-2px_3px_rgba(60,25,95,0.25)] text-white',
      titleColor: isLight ? 'text-[#38224C]' : 'text-indigo-100',
      subColor: isLight ? 'text-[#694887]' : 'text-indigo-300/80',
      ctaColor: isLight ? 'text-[#7A4BA6]' : 'text-indigo-400',
      ctaText: 'Scan',
      allowed: hasPermission('DOCUMENT_UPLOAD') || hasPermission('DOCUMENT_VIEW'),
    },
    {
      id: 'UPLOAD_DOC',
      label: 'Store Document',
      description: 'Aadhaar, PAN & policies',
      category: 'VAULT',
      categoryName: 'Vault',
      icon: FileUp,
      cardBg: isLight
        ? 'bg-gradient-to-br from-[#EDF4E7] to-[#DCE7D4] border border-[#D1DFC7] shadow-[0_10px_22px_-4px_rgba(110,135,95,0.28),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-3px_4px_rgba(100,120,85,0.15)]'
        : 'bg-gradient-to-br from-[#1C281F] to-[#121B14] border border-emerald-800/60 shadow-[0_10px_22px_-4px_rgba(0,0,0,0.5)]',
      iconBg: 'bg-gradient-to-br from-[#6BB7A3] to-[#54A08C] shadow-[0_6px_14px_-2px_rgba(65,130,110,0.45),inset_0_2px_2px_rgba(255,255,255,0.65),inset_0_-2px_3px_rgba(30,70,60,0.25)] text-white',
      titleColor: isLight ? 'text-[#2C3B27]' : 'text-emerald-100',
      subColor: isLight ? 'text-[#55694F]' : 'text-emerald-400/80',
      ctaColor: isLight ? 'text-[#3B7061]' : 'text-emerald-300',
      ctaText: 'Upload',
      allowed: hasPermission('DOCUMENT_UPLOAD') || hasPermission('DOCUMENT_VIEW'),
    },
    {
      id: 'ADD_EMERGENCY',
      label: 'Emergency Vault',
      description: 'Medical IDs & contacts',
      category: 'VAULT',
      categoryName: 'Medical',
      icon: ShieldAlert,
      cardBg: isLight
        ? 'bg-gradient-to-br from-[#FDECE5] to-[#F8D9CC] border border-[#F3C7B6] shadow-[0_10px_22px_-4px_rgba(200,110,90,0.25),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-3px_4px_rgba(180,90,70,0.15)]'
        : 'bg-gradient-to-br from-[#2B1B17] to-[#1D110E] border border-rose-900/60 shadow-[0_10px_22px_-4px_rgba(0,0,0,0.5)]',
      iconBg: 'bg-gradient-to-br from-[#F37D63] to-[#E06145] shadow-[0_6px_14px_-2px_rgba(200,80,55,0.45),inset_0_2px_2px_rgba(255,255,255,0.65),inset_0_-2px_3px_rgba(110,30,15,0.25)] text-white',
      titleColor: isLight ? 'text-[#4A261D]' : 'text-rose-100',
      subColor: isLight ? 'text-[#7E4C40]' : 'text-rose-300/80',
      ctaColor: isLight ? 'text-[#D44D31]' : 'text-rose-400',
      ctaText: 'Access',
      allowed: hasPermission('EMERGENCY_EDIT') || hasPermission('EMERGENCY_VIEW'),
    },
    {
      id: 'ADD_MEMORY',
      label: 'Save Memory',
      description: 'Family trips & photos',
      category: 'FAMILY',
      categoryName: 'Memories',
      icon: Camera,
      cardBg: isLight
        ? 'bg-gradient-to-br from-[#FFF5E2] to-[#FCE8C5] border border-[#F7D8A2] shadow-[0_10px_22px_-4px_rgba(190,145,60,0.25),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-3px_4px_rgba(170,125,40,0.15)]'
        : 'bg-gradient-to-br from-[#2B2314] to-[#1C160B] border border-amber-900/60 shadow-[0_10px_22px_-4px_rgba(0,0,0,0.5)]',
      iconBg: 'bg-gradient-to-br from-[#F7BA43] to-[#E5A224] shadow-[0_6px_14px_-2px_rgba(195,130,20,0.45),inset_0_2px_2px_rgba(255,255,255,0.65),inset_0_-2px_3px_rgba(110,70,0,0.25)] text-white',
      titleColor: isLight ? 'text-[#473418]' : 'text-amber-100',
      subColor: isLight ? 'text-[#7A5B2D]' : 'text-amber-300/80',
      ctaColor: isLight ? 'text-[#B87A14]' : 'text-amber-400',
      ctaText: 'Capture',
      allowed: hasPermission('MEMORY_UPLOAD') || hasPermission('MEMORY_VIEW'),
    },
    {
      id: 'ASK_AI',
      label: 'Ask Family AI',
      description: 'Insights & checklists',
      category: 'AI',
      categoryName: 'AI',
      icon: Sparkles,
      cardBg: isLight
        ? 'bg-gradient-to-br from-[#F3ECF9] to-[#E2D4F0] border border-[#D4C1E6] shadow-[0_10px_22px_-4px_rgba(140,110,170,0.25),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-3px_4px_rgba(110,80,140,0.15)]'
        : 'bg-gradient-to-br from-[#231A2E] to-[#150F1E] border border-purple-900/60 shadow-[0_10px_22px_-4px_rgba(0,0,0,0.5)]',
      iconBg: 'bg-gradient-to-br from-[#9F75C8] to-[#8655B2] shadow-[0_6px_14px_-2px_rgba(125,80,165,0.45),inset_0_2px_2px_rgba(255,255,255,0.65),inset_0_-2px_3px_rgba(60,25,95,0.25)] text-white',
      titleColor: isLight ? 'text-[#38224C]' : 'text-purple-100',
      subColor: isLight ? 'text-[#694887]' : 'text-purple-300/80',
      ctaColor: isLight ? 'text-[#7A4BA6]' : 'text-purple-400',
      ctaText: 'Ask AI',
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
    <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 ${isLight ? 'bg-black/60' : 'bg-black/85'} backdrop-blur-md animate-fade-in`}>
      <div
        className={`w-full max-w-lg rounded-t-[36px] sm:rounded-[36px] p-5 pb-[max(env(safe-area-inset-bottom,0px),24px)] sm:pb-5 space-y-4 shadow-[0_30px_70px_-15px_rgba(25,18,12,0.45)] ${
          isLight
            ? 'bg-[#F7F2EB] border-t sm:border-2 border-[#E9DFC3] text-[#362A24]'
            : 'bg-[#121829] border-t sm:border border-slate-700/80 text-[#F4F8FF]'
        }`}
      >
        {/* Mobile Drag Handle */}
        <div className={`w-12 h-1.5 rounded-full mx-auto -mt-1 mb-2 opacity-80 sm:hidden ${isLight ? 'bg-[#D7CAB9]' : 'bg-slate-600'}`} />

        {/* Header Section */}
        <div className={`flex items-start justify-between pb-3 border-b ${isLight ? 'border-[#E6DCCB]' : 'border-slate-800'}`}>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-xl font-black tracking-tight ${isLight ? 'text-[#362A24]' : 'text-white'}`}>
                Create & Record
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                isLight
                  ? 'bg-[#F37D63]/15 text-[#D44D31] border-[#F37D63]/30'
                  : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
              }`}>
                Famora 3D
              </span>
            </div>
            <p className={`text-xs mt-0.5 font-semibold ${isLight ? 'text-[#7A665A]' : 'text-slate-400'}`}>
              Tap any 3D action card to record or schedule
            </p>
          </div>

          {/* Close Button Clay Squircle */}
          <button
            onClick={onClose}
            className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
              isLight
                ? 'bg-[#EFE8DF] border border-[#DFD3C4] text-[#6B5B52] hover:text-[#362A24] shadow-[0_4px_10px_rgba(0,0,0,0.06),inset_0_1.5px_2px_rgba(255,255,255,0.9)]'
                : 'bg-slate-800 border border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <X className="w-4 h-4 stroke-[3]" />
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
                className={`px-4 py-2 rounded-2xl text-[11px] font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#F37D63] to-[#E06145] text-white shadow-[0_6px_14px_-2px_rgba(200,80,55,0.45),inset_0_2px_2px_rgba(255,255,255,0.5)]'
                    : isLight
                    ? 'bg-[#EFE8DF] text-[#6B5B52] hover:bg-[#E7DFC5] border border-[#E2D6C7] shadow-[0_3px_8px_rgba(0,0,0,0.05),inset_0_1.5px_2px_rgba(255,255,255,0.8)]'
                    : 'bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>{pill.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-white/30 text-white' : isLight ? 'bg-black/5 text-[#6B5B52]' : 'bg-white/10 text-slate-300'
                }`}>
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 2-Column Claymorphism Action Cards Grid */}
        <div className="grid grid-cols-2 gap-3.5 max-h-[58vh] sm:max-h-[62vh] overflow-y-auto pr-1 scrollbar-thin">
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
                className={`group flex flex-col justify-between text-left p-4 rounded-[28px] transition-all ${act.cardBg} ${
                  act.allowed
                    ? 'hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0.5 active:scale-[0.975] cursor-pointer'
                    : 'opacity-40 cursor-not-allowed filter grayscale-[0.4]'
                }`}
              >
                <div>
                  {/* 3D Extruded Clay Icon Squircle */}
                  <div className={`w-11 h-11 rounded-[20px] flex items-center justify-center mb-3 transition-transform group-hover:scale-105 ${act.iconBg}`}>
                    <Icon className="w-6 h-6 stroke-[2.2] drop-shadow-[0_2px_1px_rgba(0,0,0,0.2)]" />
                  </div>

                  {/* Title & Subtext */}
                  <div className={`font-extrabold text-sm sm:text-base leading-snug line-clamp-1 ${act.titleColor}`}>
                    {act.label}
                  </div>
                  <div className={`text-[11px] font-semibold line-clamp-1 mt-0.5 ${act.subColor}`}>
                    {act.description}
                  </div>
                </div>

                {/* Footer Action Tag */}
                <div className={`mt-3 pt-2 border-t border-black/5 flex items-center justify-between text-[11px] font-black ${act.ctaColor}`}>
                  {act.allowed ? (
                    <>
                      <span>{act.ctaText}</span>
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </>
                  ) : (
                    <span className="text-rose-600">No Access</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Hint Note */}
        <div className={`pt-2.5 border-t flex items-center justify-between text-xs font-semibold ${
          isLight ? 'border-[#E6DCCB] text-[#7A665A]' : 'border-slate-800 text-slate-400'
        }`}>
          <span>⚡ Instant sync across all family devices</span>
          <span className={`font-black ${isLight ? 'text-[#362A24]' : 'text-slate-200'}`}>Famora 3D</span>
        </div>
      </div>
    </div>
  );
};
