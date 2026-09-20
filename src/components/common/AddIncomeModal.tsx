import React, { useState } from 'react';
import {
  X,
  Check,
  Wallet,
  Briefcase,
  Building2,
  Laptop,
  Home,
  TrendingUp,
  Gift,
  Landmark,
  Sparkles,
  Plus,
  Calendar,
  Tag,
} from 'lucide-react';
import { getLocalDateString } from '../../utils/formatters.js';
import { CustomDatePicker } from './CustomDatePicker.js';
import { useTheme } from '../../context/ThemeContext.js';

export interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (incomeData: {
    source: string;
    amount: string;
    type: string;
    date: string;
    notes: string;
  }) => Promise<void> | void;
}

interface IncomeCategoryItem {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

const INCOME_CATEGORIES: IncomeCategoryItem[] = [
  { id: 'SALARY', name: 'Salary', icon: Briefcase, color: '#168BFF', bgColor: 'rgba(22, 139, 255, 0.16)', borderColor: 'rgba(22, 139, 255, 0.40)' },
  { id: 'BUSINESS', name: 'Business', icon: Building2, color: '#0869E8', bgColor: 'rgba(8, 105, 232, 0.16)', borderColor: 'rgba(8, 105, 232, 0.40)' },
  { id: 'FREELANCE', name: 'Freelance', icon: Laptop, color: '#16C7F2', bgColor: 'rgba(22, 199, 242, 0.16)', borderColor: 'rgba(22, 199, 242, 0.40)' },
  { id: 'RENTAL', name: 'Rental', icon: Home, color: '#19C9A7', bgColor: 'rgba(25, 201, 167, 0.16)', borderColor: 'rgba(25, 201, 167, 0.40)' },
  { id: 'DIVIDEND', name: 'Dividends', icon: TrendingUp, color: '#55D98A', bgColor: 'rgba(85, 217, 138, 0.16)', borderColor: 'rgba(85, 217, 138, 0.40)' },
  { id: 'GIFT', name: 'Bonus/Gift', icon: Gift, color: '#FFD21F', bgColor: 'rgba(255, 210, 31, 0.16)', borderColor: 'rgba(255, 210, 31, 0.40)' },
  { id: 'INTEREST', name: 'FD / Interest', icon: Landmark, color: '#FFB91F', bgColor: 'rgba(255, 185, 31, 0.16)', borderColor: 'rgba(255, 185, 31, 0.40)' },
  { id: 'OTHER', name: 'Other Gains', icon: Sparkles, color: '#FF8A24', bgColor: 'rgba(255, 138, 36, 0.16)', borderColor: 'rgba(255, 138, 36, 0.40)' },
];

const QUICK_INCOME_PRESETS = [
  { label: 'Monthly Salary', type: 'SALARY', amount: 150000, source: 'Monthly Salary' },
  { label: 'Freelance Project', type: 'FREELANCE', amount: 45000, source: 'Freelance Design / Dev' },
  { label: 'Business Profit', type: 'BUSINESS', amount: 200000, source: 'Business Revenue' },
  { label: 'Rental Income', type: 'RENTAL', amount: 25000, source: 'House Rent Credit' },
  { label: 'Stock Dividends', type: 'DIVIDEND', amount: 12500, source: 'Stock Portfolio Dividend' },
  { label: 'Festival Bonus', type: 'GIFT', amount: 50000, source: 'Annual / Festival Bonus' },
  { label: 'FD Interest', type: 'INTEREST', amount: 8400, source: 'Fixed Deposit Interest' },
  { label: 'Consulting Fee', type: 'FREELANCE', amount: 35000, source: 'Consulting Client Payout' },
];

export const AddIncomeModal: React.FC<AddIncomeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [selectedType, setSelectedType] = useState('SALARY');
  const [selectedTypeName, setSelectedTypeName] = useState('Salary');
  const [date, setDate] = useState(getLocalDateString());
  const [notes, setNotes] = useState('');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');
  const [categoriesList, setCategoriesList] = useState<IncomeCategoryItem[]>(INCOME_CATEGORIES);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof QUICK_INCOME_PRESETS[0]) => {
    setActivePreset(preset.label);
    setSource(preset.source);
    setAmount(String(preset.amount));
    const cat = categoriesList.find((c) => c.id === preset.type);
    if (cat) {
      setSelectedType(cat.id);
      setSelectedTypeName(cat.name);
    }
  };

  const handleSelectCategory = (cat: IncomeCategoryItem) => {
    setSelectedType(cat.id);
    setSelectedTypeName(cat.name);
  };

  const handleAddCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const newCat: IncomeCategoryItem = {
      id: `cat_income_${Date.now()}`,
      name: customName.trim(),
      icon: Sparkles,
      color: isLight ? '#B84A1E' : '#16C7F2',
      bgColor: isLight ? 'rgba(184, 74, 30, 0.16)' : 'rgba(22, 199, 242, 0.16)',
      borderColor: isLight ? 'rgba(184, 74, 30, 0.50)' : 'rgba(22, 199, 242, 0.50)',
    };
    setCategoriesList((prev) => [...prev, newCat]);
    setSelectedType(newCat.id);
    setSelectedTypeName(newCat.name);
    setCustomName('');
    setShowCustomInput(false);
  };

  const handleQuickDate = (mode: 'today' | 'yesterday' | 'first') => {
    const d = new Date();
    if (mode === 'yesterday') {
      d.setDate(d.getDate() - 1);
    } else if (mode === 'first') {
      d.setDate(1);
    }
    setDate(d.toISOString().split('T')[0]);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !source.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        amount,
        source: source.trim(),
        type: selectedType,
        date,
        notes: notes.trim(),
      });
      setAmount('');
      setSource('');
      setNotes('');
      setActivePreset(null);
      onClose();
    } catch (err) {
      console.error('Error recording income:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 ${isLight ? 'bg-black/50' : 'bg-black/80'} backdrop-blur-md animate-fade-in`}>
      <div className={`w-full max-w-md rounded-[28px] p-4 sm:p-5 space-y-4 max-h-[92vh] overflow-y-auto [&::-webkit-scrollbar]:hidden ${
        isLight
          ? 'bg-[#EFE4D6] border-2 border-[#DECFC0] text-[#2A1B14] shadow-[0_20px_60px_rgba(140,95,60,0.22)]'
          : 'bg-[#0B1226] border-2 border-[#8B5CF6]/40 text-[#F4F8FF] shadow-[0_20px_60px_rgba(0,0,0,0.95)]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl border ${
              isLight
                ? 'bg-[#F7D4BC] text-[#B84A1E] border-[#E8BC9E]'
                : 'bg-[#8B5CF6]/20 text-[#A78BFA] border-[#8B5CF6]/40'
            }`}>
              <Wallet className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className={`text-lg font-bold tracking-tight ${isLight ? 'text-[#2A1B14]' : 'text-white'}`}>Add Family Income</h3>
              <p className={`text-[10px] ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>Directly deposits & credits to Family Wealth balance</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors ${
              isLight
                ? 'hover:bg-[#EBE0D2] text-[#634B3F] hover:text-[#2A1B14]'
                : 'hover:bg-[#0D152D] text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Quick Preset Income Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {QUICK_INCOME_PRESETS.map((preset) => {
            const isSelected = activePreset === preset.label;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? isLight
                      ? 'bg-gradient-to-r from-[#D96632] to-[#B84A1E] text-white border-[#B84A1E] shadow-md shadow-[#B84A1E]/30 scale-105 font-bold'
                      : 'bg-[#168BFF] text-white border-white shadow-md shadow-[#168BFF]/40 scale-105 font-bold'
                    : isLight
                    ? 'bg-[#EBE0D2] hover:bg-[#DECFC0] text-[#634B3F] border-[#DECFC0]'
                    : 'bg-[#073B9E]/40 hover:bg-[#073B9E]/80 text-[#B9D8FF] border-[#168BFF]/25'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmitForm} className="space-y-4">
          {/* 2. Big Income Amount Input */}
          <div className="space-y-1">
            <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-[#B9D8FF]'}`}>Income Amount (₹ INR) *</label>
            <div className={`flex items-center rounded-2xl px-4 py-3 shadow-inner transition-colors border-2 ${
              isLight
                ? 'bg-[#EBE0D2] border-[#DECFC0] focus-within:border-[#C25425]'
                : 'bg-[#03194A] border-[#168BFF]/40 focus-within:border-[#16C7F2]'
            }`}>
              <span className={`text-xl sm:text-2xl font-black mr-2 ${isLight ? 'text-[#2E7D32]' : 'text-[#55D98A]'}`}>₹</span>
              <input
                type="number"
                required
                placeholder="150000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full bg-transparent text-xl sm:text-2xl font-black outline-none ${
                  isLight
                    ? 'text-[#2A1B14] placeholder-[#947D70]'
                    : 'text-white placeholder-slate-500'
                }`}
              />
            </div>
          </div>

          {/* 3. Income Source Category Grid */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-[#B9D8FF]'}`}>
                Income Source: <span className={`font-bold ${isLight ? 'text-[#B84A1E]' : 'text-[#7EDCFF]'}`}>{selectedTypeName}</span>
              </label>
              <button
                type="button"
                onClick={() => setShowCustomInput(!showCustomInput)}
                className={`text-[11px] hover:underline font-bold flex items-center gap-0.5 ${
                  isLight ? 'text-[#B84A1E]' : 'text-[#55D98A]'
                }`}
              >
                <Plus className="w-3 h-3" />
                <span>Custom</span>
              </button>
            </div>

            {showCustomInput && (
              <div className={`p-2.5 rounded-xl border flex items-center gap-2 animate-fade-in ${
                isLight
                  ? 'bg-[#EBE0D2] border-[#DECFC0]'
                  : 'bg-[#073B9E]/60 border-[#168BFF]/40'
              }`}>
                <input
                  type="text"
                  placeholder="New income type (e.g. Royalties, YouTube)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs outline-none border ${
                    isLight
                      ? 'bg-[#F4EDE4] border-[#DECFC0] text-[#2A1B14] placeholder-[#947D70] focus:border-[#C25425]'
                      : 'bg-[#03194A] border-[#168BFF]/40 text-white placeholder-slate-500 focus:border-[#16C7F2]'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleAddCustomCategory}
                  className={`px-3 py-1.5 text-white font-bold text-xs rounded-lg hover:opacity-95 ${
                    isLight ? 'bg-[#B84A1E]' : 'bg-[#168BFF]'
                  }`}
                >
                  Add
                </button>
              </div>
            )}

            <div className="grid grid-cols-4 gap-2">
              {categoriesList.map((cat) => {
                const isSelected = selectedType === cat.id;
                const IconComponent = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all relative ${
                      isSelected
                        ? isLight
                          ? 'bg-[#F7D4BC] border-[#E8BC9E] shadow-[0_4px_14px_rgba(184,74,30,0.18)] scale-[1.03] ring-1 ring-[#D96632]'
                          : 'bg-[rgba(22,139,255,0.24)] border-[#168BFF] shadow-[0_0_14px_rgba(22,139,255,0.40)] scale-[1.03] ring-1 ring-[#168BFF]'
                        : isLight
                        ? 'bg-[#EBE0D2] hover:bg-[#E4D7C7] border-[#DECFC0] opacity-90 hover:opacity-100'
                        : 'bg-[#073B9E]/35 hover:bg-[#073B9E]/70 border-[#168BFF]/25 opacity-85 hover:opacity-100'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center mb-1 transition-all"
                      style={{
                        backgroundColor: isLight
                          ? isSelected
                            ? '#C25425'
                            : '#E4D7C7'
                          : isSelected
                          ? 'rgba(22, 139, 255, 0.32)'
                          : cat.bgColor,
                        color: isLight
                          ? isSelected
                            ? '#FFFFFF'
                            : '#634B3F'
                          : isSelected
                          ? '#7EDCFF'
                          : cat.color,
                        border: `1px solid ${
                          isLight
                            ? isSelected
                              ? '#B84A1E'
                              : '#DECFC0'
                            : isSelected
                            ? '#168BFF'
                            : cat.borderColor
                        }`,
                      }}
                    >
                      <IconComponent className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <span
                      className={`text-[10.5px] font-bold text-center leading-tight truncate w-full ${
                        isSelected
                          ? isLight
                            ? 'text-[#2A1B14] font-black'
                            : 'text-white'
                          : isLight
                          ? 'text-[#634B3F]'
                          : 'text-[#B9D8FF]'
                      }`}
                    >
                      {cat.name}
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border border-dashed transition-all ${
                  isLight
                    ? 'border-[#DECFC0] bg-[#EBE0D2]/50 hover:bg-[#EBE0D2] text-[#B84A1E]'
                    : 'border-[#168BFF]/40 bg-[#073B9E]/20 hover:bg-[#073B9E]/50 text-[#16C7F2]'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1 border ${
                  isLight
                    ? 'bg-[#F7D4BC]/60 border-[#E8BC9E] text-[#B84A1E]'
                    : 'bg-[#168BFF]/15 border-[#168BFF]/30 text-[#7EDCFF]'
                }`}>
                  <Plus className="w-4 h-4" />
                </div>
                <span className={`text-[10.5px] font-bold text-center leading-tight ${
                  isLight ? 'text-[#634B3F]' : 'text-[#B9D8FF]'
                }`}>
                  Custom
                </span>
              </button>
            </div>
          </div>

          {/* 4. Employer / Source Title */}
          <div className="space-y-1">
            <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-[#B9D8FF]'}`}>Employer / Payer / Source Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Google India / Freelance Client / Tenant Name"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm outline-none border ${
                isLight
                  ? 'bg-[#EBE0D2] border-[#DECFC0] text-[#2A1B14] placeholder-[#947D70] focus:border-[#C25425]'
                  : 'bg-[#03194A] border-[#168BFF]/35 text-white placeholder-slate-500 focus:border-[#16C7F2]'
              }`}
            />
          </div>

          {/* 5. Date */}
          <div className="space-y-1">
            <CustomDatePicker
              label="Date Received"
              value={date}
              onChange={(newDate) => setDate(newDate)}
              required
              className={
                isLight
                  ? '!bg-[#EBE0D2] !border-[#DECFC0] text-xs !text-[#2A1B14]'
                  : '!bg-[#03194A] !border-[#168BFF]/35 text-xs text-white'
              }
            />
          </div>

          {/* 6. Notes (Optional) */}
          <div className="space-y-1">
            <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-[#B9D8FF]'}`}>Notes / Account (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Credited to HDFC Bank A/c • Monthly Pay"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs outline-none border ${
                isLight
                  ? 'bg-[#EBE0D2] border-[#DECFC0] text-[#2A1B14] placeholder-[#947D70] focus:border-[#C25425]'
                  : 'bg-[#03194A] border-[#168BFF]/35 text-white placeholder-slate-500 focus:border-[#16C7F2]'
              }`}
            />
          </div>

          {/* 7. Submit CTA */}
          <button
            type="submit"
            disabled={isSubmitting || !amount || !source.trim()}
            className={`w-full py-3.5 hover:opacity-95 disabled:opacity-50 font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer mt-2 ${
              isLight
                ? 'bg-gradient-to-r from-[#D96632] via-[#C85928] to-[#B84A1E] text-white shadow-[0_8px_25px_rgba(184,74,30,0.35)]'
                : 'bg-gradient-to-r from-[#0869E8] via-[#168BFF] to-[#16C7F2] text-white shadow-[0_8px_25px_rgba(8,105,232,0.40)]'
            }`}
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>Deposit & Credit to Wealth</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddIncomeModal;
