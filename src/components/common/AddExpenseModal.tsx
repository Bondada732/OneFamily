import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Utensils,
  Cookie,
  ShoppingCart,
  Bus,
  ShoppingBag,
  Film,
  GraduationCap,
  Home,
  Tag,
  Apple,
  Target,
  Wrench,
  Zap,
  HeartPulse,
  Plus,
  Coffee,
  Fuel,
  CreditCard,
  Wallet,
  Sparkles,
  Receipt,
  Droplet,
} from 'lucide-react';
import { getLocalDateString } from '../../utils/formatters.js';

export interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (expenseData: {
    amount: string;
    merchant: string;
    category_id: string;
    category_name: string;
    payment_method: string;
    date: string;
    notes: string;
  }) => Promise<void> | void;
  initialCategory?: string;
  categoryOptions?: Array<{ id: string; name: string }>;
}

interface CategoryItem {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'cat_food', name: 'Food', icon: Utensils, color: '#FF8A24', bgColor: 'rgba(255, 138, 36, 0.16)', borderColor: 'rgba(255, 138, 36, 0.40)' },
  { id: 'cat_snacks', name: 'Snacks', icon: Cookie, color: '#FFD21F', bgColor: 'rgba(255, 210, 31, 0.16)', borderColor: 'rgba(255, 210, 31, 0.40)' },
  { id: 'cat_groceries', name: 'Groceries', icon: ShoppingCart, color: '#55D98A', bgColor: 'rgba(85, 217, 138, 0.16)', borderColor: 'rgba(85, 217, 138, 0.40)' },
  { id: 'cat_travel', name: 'Travel', icon: Bus, color: '#16C7F2', bgColor: 'rgba(22, 199, 242, 0.16)', borderColor: 'rgba(22, 199, 242, 0.40)' },
  { id: 'cat_shopping', name: 'Shopping', icon: ShoppingBag, color: '#FF6F32', bgColor: 'rgba(255, 111, 50, 0.16)', borderColor: 'rgba(255, 111, 50, 0.40)' },
  { id: 'cat_entertainment', name: 'Entertainment', icon: Film, color: '#FF4D6D', bgColor: 'rgba(255, 77, 109, 0.16)', borderColor: 'rgba(255, 77, 109, 0.40)' },
  { id: 'cat_college', name: 'College', icon: GraduationCap, color: '#168BFF', bgColor: 'rgba(22, 139, 255, 0.16)', borderColor: 'rgba(22, 139, 255, 0.40)' },
  { id: 'cat_hostel', name: 'Hostel / Rent', icon: Home, color: '#FFB91F', bgColor: 'rgba(255, 185, 31, 0.16)', borderColor: 'rgba(255, 185, 31, 0.40)' },
  { id: 'cat_milk', name: 'Milk', icon: Droplet, color: '#B9E9FF', bgColor: 'rgba(185, 233, 255, 0.16)', borderColor: 'rgba(185, 233, 255, 0.40)' },
  { id: 'cat_veg_fruits', name: 'Veg+Fruits', icon: Apple, color: '#B9F36B', bgColor: 'rgba(185, 243, 107, 0.16)', borderColor: 'rgba(185, 243, 107, 0.40)' },
  { id: 'cat_sports', name: 'Sports & Hobbies', icon: Target, color: '#19C9A7', bgColor: 'rgba(25, 201, 167, 0.16)', borderColor: 'rgba(25, 201, 167, 0.40)' },
  { id: 'cat_rent', name: 'Rent', icon: Tag, color: '#16C7F2', bgColor: 'rgba(22, 199, 242, 0.16)', borderColor: 'rgba(22, 199, 242, 0.40)' },
  { id: 'cat_maintenance', name: 'Maintenance', icon: Wrench, color: '#FFB91F', bgColor: 'rgba(255, 185, 31, 0.16)', borderColor: 'rgba(255, 185, 31, 0.40)' },
  { id: 'cat_utilities', name: 'Utilities & Bills', icon: Zap, color: '#FFD21F', bgColor: 'rgba(255, 210, 31, 0.16)', borderColor: 'rgba(255, 210, 31, 0.40)' },
  { id: 'cat_healthcare', name: 'Healthcare', icon: HeartPulse, color: '#FF4D6D', bgColor: 'rgba(255, 77, 109, 0.16)', borderColor: 'rgba(255, 77, 109, 0.40)' },
];

const QUICK_PRESET_TAGS = [
  { label: 'Mess', categoryId: 'cat_food', categoryName: 'Food' },
  { label: 'Canteen', categoryId: 'cat_food', categoryName: 'Food' },
  { label: 'Swiggy', categoryId: 'cat_food', categoryName: 'Food' },
  { label: 'Zomato', categoryId: 'cat_food', categoryName: 'Food' },
  { label: 'Chai', categoryId: 'cat_snacks', categoryName: 'Snacks' },
  { label: 'Stationery', categoryId: 'cat_college', categoryName: 'College' },
  { label: 'Milk', categoryId: 'cat_milk', categoryName: 'Milk' },
  { label: 'Veg+Fruits', categoryId: 'cat_veg_fruits', categoryName: 'Veg+Fruits' },
  { label: 'Auto / Petrol', categoryId: 'cat_travel', categoryName: 'Travel' },
  { label: 'Amazon', categoryId: 'cat_shopping', categoryName: 'Shopping' },
  { label: 'Ratnadeep', categoryId: 'cat_groceries', categoryName: 'Groceries' },
  { label: 'Pharmacy', categoryId: 'cat_healthcare', categoryName: 'Healthcare' },
];

const PAYMENT_MODES = [
  { id: 'UPI', label: 'UPI' },
  { id: 'CASH', label: 'Cash' },
  { id: 'CREDIT_CARD', label: 'Credit Card' },
  { id: 'DEBIT_CARD', label: 'Debit Card' },
  { id: 'BANK_TRANSFER', label: 'NetBanking' },
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialCategory,
}) => {
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('cat_food');
  const [selectedCatName, setSelectedCatName] = useState('Food');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [date, setDate] = useState(getLocalDateString());
  const [notes, setNotes] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom category modal addition
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);

  useEffect(() => {
    if (initialCategory) {
      const match = categoriesList.find((c) => c.name.toLowerCase() === initialCategory.toLowerCase() || c.id === initialCategory);
      if (match) {
        setSelectedCatId(match.id);
        setSelectedCatName(match.name);
      }
    }
  }, [initialCategory]);

  if (!isOpen) return null;

  const handleSelectTag = (tag: typeof QUICK_PRESET_TAGS[0]) => {
    setActiveTag(tag.label);
    setMerchant(tag.label);
    const cat = categoriesList.find((c) => c.id === tag.categoryId) || categoriesList[0];
    if (cat) {
      setSelectedCatId(cat.id);
      setSelectedCatName(cat.name);
    }
  };

  const handleSelectCategory = (cat: CategoryItem) => {
    setSelectedCatId(cat.id);
    setSelectedCatName(cat.name);
  };

  const handleAddCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const newCat: CategoryItem = {
      id: `cat_custom_${Date.now()}`,
      name: customName.trim(),
      icon: Tag,
      color: '#16C7F2',
      bgColor: 'rgba(22, 199, 242, 0.16)',
      borderColor: 'rgba(22, 199, 242, 0.50)',
    };
    setCategoriesList((prev) => [...prev, newCat]);
    setSelectedCatId(newCat.id);
    setSelectedCatName(newCat.name);
    setCustomName('');
    setShowCustomInput(false);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        amount,
        merchant: merchant.trim() || selectedCatName,
        category_id: selectedCatId,
        category_name: selectedCatName,
        payment_method: paymentMethod,
        date,
        notes,
      });
      // Reset form
      setAmount('');
      setMerchant('');
      setNotes('');
      setActiveTag(null);
      onClose();
    } catch (err) {
      console.error('Error submitting expense:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#061F5C] border-2 border-[#168BFF]/40 rounded-[28px] p-4 sm:p-5 text-[#F4F8FF] shadow-[0_20px_60px_rgba(3,25,74,0.98)] space-y-4 max-h-[92vh] overflow-y-auto [&::-webkit-scrollbar]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-1">
          <h3 className="text-lg font-bold text-white tracking-tight">Add expense</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#073B9E] text-[#B9D8FF] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Quick Preset Merchant/Pills (Horizontal Scroll) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {QUICK_PRESET_TAGS.map((tag) => {
            const isSelected = activeTag === tag.label;
            return (
              <button
                key={tag.label}
                type="button"
                onClick={() => handleSelectTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-[#168BFF] text-white border-[#16C7F2] shadow-md shadow-[#168BFF]/40 scale-105'
                    : 'bg-[#073B9E]/40 hover:bg-[#073B9E]/80 text-[#B9D8FF] border-[#168BFF]/25'
                }`}
              >
                {tag.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmitForm} className="space-y-4">
          {/* 2. Amount Input Box (Big & Bold) */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#B9D8FF]">Amount</label>
            <div className="flex items-center bg-[#03194A] border-2 border-[#168BFF]/40 focus-within:border-[#FFD21F] rounded-2xl px-4 py-3 shadow-inner transition-colors">
              <span className="text-xl sm:text-2xl font-black text-[#FFD21F] mr-2">₹</span>
              <input
                type="number"
                step="any"
                required
                autoFocus
                placeholder="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent text-xl sm:text-2xl font-black text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          {/* 3. Category Grid (Tappable Icon Cards) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#B9D8FF]">
                Category: <span className="text-[#16C7F2] font-bold">{selectedCatName}</span>
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

            {/* Custom Category Inline Add Form */}
            {showCustomInput && (
              <div className="p-2.5 rounded-xl bg-[#073B9E]/60 border border-[#168BFF]/40 flex items-center gap-2 animate-fade-in">
                <input
                  type="text"
                  placeholder="New category name (e.g. Badminton, Books)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-[#03194A] border border-[#168BFF]/40 rounded-lg text-xs text-white outline-none focus:border-[#16C7F2]"
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
                const isSelected = selectedCatId === cat.id;
                const IconComponent = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all relative ${
                      isSelected
                        ? 'bg-[rgba(25,201,167,0.22)] border-[#19C9A7] shadow-[0_0_14px_rgba(25,201,167,0.35)] scale-[1.03] ring-1 ring-[#55D98A]'
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

              {/* Custom Category Button */}
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl border border-dashed border-[#168BFF]/40 bg-[#073B9E]/20 hover:bg-[#073B9E]/50 text-[#16C7F2] transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-[#16C7F2]/15 border border-[#16C7F2]/30 flex items-center justify-center mb-1 text-[#16C7F2]">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[10.5px] font-bold text-center leading-tight text-[#B9D8FF]">
                  Custom
                </span>
              </button>
            </div>
          </div>

          {/* 4. "What" / Merchant Description Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#B9D8FF]">What / Merchant</label>
            <input
              type="text"
              placeholder="e.g. Swiggy dinner, Ratnadeep Kirana, long bar"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#03194A] border border-[#168BFF]/35 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-[#16C7F2]"
            />
          </div>

          {/* 5. Payment Mode Quick Chips */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#B9D8FF]">Payment Mode</label>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_MODES.map((pm) => {
                const isSelected = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-[#0869E8] text-white border-[#16C7F2] shadow-sm'
                        : 'bg-[#073B9E]/35 text-[#B9D8FF] border-[#168BFF]/20 hover:bg-[#073B9E]/70'
                    }`}
                  >
                    {pm.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Date & Time */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#B9D8FF]">Date</label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setDate(getLocalDateString())}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                    date === getLocalDateString()
                      ? 'bg-[#FFD21F] text-[#03194A]'
                      : 'bg-[#073B9E]/40 text-[#B9D8FF] hover:text-white'
                  }`}
                >
                  Today
                </button>
              </div>
            </div>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#03194A] border border-[#168BFF]/35 rounded-xl text-xs text-white outline-none focus:border-[#16C7F2]"
            />
          </div>

          {/* 7. Notes (optional) */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#B9D8FF]">Notes (optional)</label>
            <textarea
              rows={2}
              placeholder="Anything to remember about this?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#03194A] border border-[#168BFF]/35 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-[#16C7F2] resize-none"
            />
          </div>

          {/* 8. Big Prominent Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !amount}
            className="w-full py-3.5 bg-gradient-to-r from-[#FFB91F] via-[#FF8A24] to-[#FF6F32] hover:opacity-95 disabled:opacity-50 text-[#03194A] font-black text-sm rounded-2xl shadow-[0_8px_25px_rgba(255,185,31,0.35)] flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2 cursor-pointer"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>Save expense</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
