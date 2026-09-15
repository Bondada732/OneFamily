import React, { useState } from 'react';
import {
  X,
  Check,
  Target,
  Home,
  GraduationCap,
  ShieldAlert,
  Plane,
  Car,
  HeartHandshake,
  Gem,
  Plus,
  Flame,
  Zap,
  Sprout,
  Calendar,
} from 'lucide-react';

export interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goalData: {
    title: string;
    category: string;
    target_amount: number;
    current_amount: number;
    monthly_contribution: number;
    target_date: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }) => Promise<void> | void;
}

interface GoalCategoryItem {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

const GOAL_CATEGORIES: GoalCategoryItem[] = [
  { id: 'PROPERTY', name: 'Property', icon: Home, color: '#19C9A7', bgColor: 'rgba(25, 201, 167, 0.16)', borderColor: 'rgba(25, 201, 167, 0.40)' },
  { id: 'EDUCATION', name: 'Education', icon: GraduationCap, color: '#168BFF', bgColor: 'rgba(22, 139, 255, 0.16)', borderColor: 'rgba(22, 139, 255, 0.40)' },
  { id: 'EMERGENCY', name: 'Emergency', icon: ShieldAlert, color: '#FFD21F', bgColor: 'rgba(255, 210, 31, 0.16)', borderColor: 'rgba(255, 210, 31, 0.40)' },
  { id: 'TRAVEL', name: 'Vacation', icon: Plane, color: '#16C7F2', bgColor: 'rgba(22, 199, 242, 0.16)', borderColor: 'rgba(22, 199, 242, 0.40)' },
  { id: 'VEHICLE', name: 'Vehicle', icon: Car, color: '#FF8A24', bgColor: 'rgba(255, 138, 36, 0.16)', borderColor: 'rgba(255, 138, 36, 0.40)' },
  { id: 'RETIREMENT', name: 'Retirement', icon: Sprout, color: '#55D98A', bgColor: 'rgba(85, 217, 138, 0.16)', borderColor: 'rgba(85, 217, 138, 0.40)' },
  { id: 'FAMILY', name: 'Family Dream', icon: HeartHandshake, color: '#FF4D6D', bgColor: 'rgba(255, 77, 109, 0.16)', borderColor: 'rgba(255, 77, 109, 0.40)' },
  { id: 'GOLD', name: 'Gold / Assets', icon: Gem, color: '#FFB91F', bgColor: 'rgba(255, 185, 31, 0.16)', borderColor: 'rgba(255, 185, 31, 0.40)' },
];

const QUICK_GOAL_PRESETS = [
  { label: 'Dream Home', category: 'PROPERTY', target: 5000000, monthly: 45000 },
  { label: 'Child Education', category: 'EDUCATION', target: 2500000, monthly: 20000 },
  { label: 'Emergency Fund', category: 'EMERGENCY', target: 600000, monthly: 15000 },
  { label: 'Europe Trip', category: 'TRAVEL', target: 500000, monthly: 15000 },
  { label: 'Electric Car', category: 'VEHICLE', target: 1800000, monthly: 25000 },
  { label: 'Retirement Corpus', category: 'RETIREMENT', target: 10000000, monthly: 35000 },
  { label: 'Gold / Jewelry', category: 'GOLD', target: 800000, monthly: 12000 },
  { label: 'Marriage Fund', category: 'FAMILY', target: 2000000, monthly: 25000 },
];

export const AddGoalModal: React.FC<AddGoalModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('10000');
  const [targetDate, setTargetDate] = useState('2028-12-31');
  const [priority, setPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [selectedCategory, setSelectedCategory] = useState('PROPERTY');
  const [selectedCatName, setSelectedCatName] = useState('Property');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');
  const [categoriesList, setCategoriesList] = useState<GoalCategoryItem[]>(GOAL_CATEGORIES);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof QUICK_GOAL_PRESETS[0]) => {
    setActivePreset(preset.label);
    setTitle(preset.label);
    setTargetAmount(String(preset.target));
    if (preset.monthly) setMonthlyContribution(String(preset.monthly));
    const cat = categoriesList.find((c) => c.id === preset.category);
    if (cat) {
      setSelectedCategory(cat.id);
      setSelectedCatName(cat.name);
    }
  };

  const handleSelectCategory = (cat: GoalCategoryItem) => {
    setSelectedCategory(cat.id);
    setSelectedCatName(cat.name);
  };

  const handleAddCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const newCat: GoalCategoryItem = {
      id: `CAT_${Date.now()}`,
      name: customName.trim(),
      icon: Target,
      color: '#19C9A7',
      bgColor: 'rgba(25, 201, 167, 0.16)',
      borderColor: 'rgba(25, 201, 167, 0.50)',
    };
    setCategoriesList((prev) => [...prev, newCat]);
    setSelectedCategory(newCat.id);
    setSelectedCatName(newCat.name);
    setCustomName('');
    setShowCustomInput(false);
  };

  const handleQuickDate = (years: number) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + years);
    const dateStr = d.toISOString().split('T')[0];
    setTargetDate(dateStr);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetAmount || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        title: title.trim(),
        category: selectedCategory,
        target_amount: Number(targetAmount) || 0,
        current_amount: Number(currentAmount) || 0,
        monthly_contribution: Number(monthlyContribution) || 0,
        target_date: targetDate || '2028-12-31',
        priority,
      });
      setTitle('');
      setTargetAmount('');
      setCurrentAmount('');
      setActivePreset(null);
    } catch (err) {
      console.error('Error submitting goal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#061F5C] border-2 border-[#19C9A7]/40 rounded-[28px] p-4 sm:p-5 text-[#F4F8FF] shadow-[0_20px_60px_rgba(3,25,74,0.98)] space-y-4 max-h-[92vh] overflow-y-auto [&::-webkit-scrollbar]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#19C9A7]/20 text-[#55D98A] border border-[#19C9A7]/40">
              <Target className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Set Financial Goal</h3>
              <p className="text-[10px] text-[#B9D8FF]">Synced with Family Wealth & SIP planner</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#073B9E] text-[#B9D8FF] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Quick Preset Goal Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {QUICK_GOAL_PRESETS.map((preset) => {
            const isSelected = activePreset === preset.label;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-[#19C9A7] text-[#03194A] border-white shadow-md shadow-[#19C9A7]/40 scale-105 font-bold'
                    : 'bg-[#073B9E]/40 hover:bg-[#073B9E]/80 text-[#B9D8FF] border-[#168BFF]/25'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmitForm} className="space-y-4">
          {/* 2. Big Target Amount Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#B9D8FF]">Target Goal Amount (₹ INR) *</label>
            <div className="flex items-center bg-[#03194A] border-2 border-[#168BFF]/40 focus-within:border-[#19C9A7] rounded-2xl px-4 py-3 shadow-inner transition-colors">
              <span className="text-xl sm:text-2xl font-black text-[#55D98A] mr-2">₹</span>
              <input
                type="number"
                required
                placeholder="5000000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full bg-transparent text-xl sm:text-2xl font-black text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          {/* 3. Category Grid */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#B9D8FF]">
                Category: <span className="text-[#19C9A7] font-bold">{selectedCatName}</span>
              </label>
              <button
                type="button"
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="text-[11px] text-[#55D98A] hover:underline font-bold flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                <span>Custom</span>
              </button>
            </div>

            {showCustomInput && (
              <div className="p-2.5 rounded-xl bg-[#073B9E]/60 border border-[#168BFF]/40 flex items-center gap-2 animate-fade-in">
                <input
                  type="text"
                  placeholder="New goal category (e.g. Startup, Farmhouse)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-[#03194A] border border-[#168BFF]/40 rounded-lg text-xs text-white outline-none focus:border-[#19C9A7]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomCategory}
                  className="px-3 py-1.5 bg-[#19C9A7] text-[#03194A] font-bold text-xs rounded-lg hover:opacity-95"
                >
                  Add
                </button>
              </div>
            )}

            <div className="grid grid-cols-4 gap-2">
              {categoriesList.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const IconComponent = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all relative ${
                      isSelected
                        ? 'bg-[rgba(25,201,167,0.22)] border-[#19C9A7] shadow-[0_0_14px_rgba(25,201,167,0.35)] scale-[1.03] ring-1 ring-[#19C9A7]'
                        : 'bg-[#073B9E]/35 hover:bg-[#073B9E]/70 border-[#168BFF]/25 opacity-85 hover:opacity-100'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center mb-1 transition-all"
                      style={{
                        backgroundColor: isSelected ? 'rgba(25, 201, 167, 0.28)' : cat.bgColor,
                        color: isSelected ? '#55D98A' : cat.color,
                        border: `1px solid ${isSelected ? '#19C9A7' : cat.borderColor}`,
                      }}
                    >
                      <IconComponent className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <span
                      className={`text-[10.5px] font-bold text-center leading-tight truncate w-full ${
                        isSelected ? 'text-white' : 'text-[#B9D8FF]'
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
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl border border-dashed border-[#168BFF]/40 bg-[#073B9E]/20 hover:bg-[#073B9E]/50 text-[#19C9A7] transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-[#19C9A7]/15 border border-[#19C9A7]/30 flex items-center justify-center mb-1 text-[#19C9A7]">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[10.5px] font-bold text-center leading-tight text-[#B9D8FF]">
                  Custom
                </span>
              </button>
            </div>
          </div>

          {/* 4. Goal Title / Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#B9D8FF]">Goal Name / Purpose *</label>
            <input
              type="text"
              required
              placeholder="e.g. Buy 3BHK Flat / Children MBA in US"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#03194A] border border-[#168BFF]/35 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-[#19C9A7]"
            />
          </div>

          {/* 5. Priority Chips */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#B9D8FF]">Priority Level</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'HIGH', label: 'High Priority', icon: Flame, color: '#FF4D6D', bg: 'rgba(255, 77, 109, 0.16)', border: 'rgba(255, 77, 109, 0.4)' },
                { id: 'MEDIUM', label: 'Medium', icon: Zap, color: '#FFD21F', bg: 'rgba(255, 210, 31, 0.16)', border: 'rgba(255, 210, 31, 0.4)' },
                { id: 'LOW', label: 'Flexible', icon: Sprout, color: '#55D98A', bg: 'rgba(85, 217, 138, 0.16)', border: 'rgba(85, 217, 138, 0.4)' },
              ].map((p) => {
                const isSelected = priority === p.id;
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPriority(p.id as any)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                      isSelected
                        ? 'border-white text-white shadow-md'
                        : 'border-[#168BFF]/25 text-[#B9D8FF] opacity-75 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: isSelected ? p.bg : 'rgba(7, 59, 158, 0.35)',
                      borderColor: isSelected ? p.color : undefined,
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: p.color }} />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Saved So Far & Monthly Contribution */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs text-[#B9D8FF] font-semibold block mb-1">Saved So Far (₹)</label>
              <input
                type="number"
                placeholder="0"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className="w-full px-3 py-2 bg-[#03194A] border border-[#168BFF]/35 rounded-xl text-xs sm:text-sm font-bold text-[#FFD21F] outline-none focus:border-[#19C9A7]"
              />
            </div>

            <div>
              <label className="text-xs text-[#B9D8FF] font-semibold block mb-1">Monthly SIP / Save (₹)</label>
              <input
                type="number"
                placeholder="10000"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
                className="w-full px-3 py-2 bg-[#03194A] border border-[#168BFF]/35 rounded-xl text-xs sm:text-sm font-bold text-[#55D98A] outline-none focus:border-[#19C9A7]"
              />
            </div>
          </div>

          {/* 7. Target Date with Quick Shortcuts */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#B9D8FF]">Target Completion Date</label>
              <div className="flex items-center gap-1.5">
                {[
                  { label: '+1Y', years: 1 },
                  { label: '+3Y', years: 3 },
                  { label: '+5Y', years: 5 },
                  { label: '+10Y', years: 10 },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleQuickDate(item.years)}
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#073B9E]/60 text-[#16C7F2] border border-[#168BFF]/30 hover:bg-[#168BFF]/30 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center bg-[#03194A] border border-[#168BFF]/35 rounded-xl px-3 py-2 text-white">
              <Calendar className="w-4 h-4 text-[#16C7F2] mr-2 shrink-0" />
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-transparent text-xs text-white outline-none"
              />
            </div>
          </div>

          {/* 8. Submit CTA */}
          <button
            type="submit"
            disabled={isSubmitting || !title.trim() || !targetAmount}
            className="w-full py-3.5 bg-gradient-to-r from-[#19C9A7] via-[#55D98A] to-[#16C7F2] hover:opacity-95 disabled:opacity-50 text-[#03194A] font-black text-sm rounded-2xl shadow-[0_8px_25px_rgba(25,201,167,0.35)] flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer mt-2"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>Create Financial Goal</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddGoalModal;
