import React, { useState } from 'react';
import {
  X,
  Check,
  Tag,
  Calendar,
  FileText,
  Store,
  MapPin,
  Trash2,
  Sparkles,
  ExternalLink,
  Navigation,
  Utensils,
  Cookie,
  ShoppingCart,
  Bus,
  ShoppingBag,
  Film,
  GraduationCap,
  Home,
  Zap,
  HeartPulse,
  Droplet,
  Apple,
  Wrench,
  Shield,
  TrendingUp,
  Gift,
  Search,
  ChevronDown,
} from 'lucide-react';
import { DetectedTransaction } from '../../services/smartExpense/types.js';
import { ExpenseLocationMapsHelper } from '../../services/smartExpense/ExpenseLocationMapsHelper.js';
import { CustomDatePicker } from '../common/CustomDatePicker.js';

interface SmartExpenseDetailModalProps {
  isOpen: boolean;
  familyId?: string;
  transaction: DetectedTransaction | null;
  onClose: () => void;
  onConfirm: (overrides: {
    amount?: number;
    merchant?: string;
    category_name?: string;
    date?: string;
    notes?: string;
    location?: string;
    savePreference?: boolean;
  }) => void;
  onRemoveLocation?: (transactionId: string) => void;
}

interface CategoryDef {
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

const CATEGORY_DEFINITIONS: CategoryDef[] = [
  { name: 'Food & Dining', icon: Utensils, color: '#FF8A24', bgColor: 'rgba(255, 138, 36, 0.16)', borderColor: 'rgba(255, 138, 36, 0.45)' },
  { name: 'Snacks & Tea', icon: Cookie, color: '#FFD21F', bgColor: 'rgba(255, 210, 31, 0.16)', borderColor: 'rgba(255, 210, 31, 0.45)' },
  { name: 'Groceries', icon: ShoppingCart, color: '#55D98A', bgColor: 'rgba(85, 217, 138, 0.16)', borderColor: 'rgba(85, 217, 138, 0.45)' },
  { name: 'Transport & Fuel', icon: Bus, color: '#16C7F2', bgColor: 'rgba(22, 199, 242, 0.16)', borderColor: 'rgba(22, 199, 242, 0.45)' },
  { name: 'Shopping', icon: ShoppingBag, color: '#FF6F32', bgColor: 'rgba(255, 111, 50, 0.16)', borderColor: 'rgba(255, 111, 50, 0.45)' },
  { name: 'Utilities & Bills', icon: Zap, color: '#FFD21F', bgColor: 'rgba(255, 210, 31, 0.16)', borderColor: 'rgba(255, 210, 31, 0.45)' },
  { name: 'Healthcare & Pharma', icon: HeartPulse, color: '#FF4D6D', bgColor: 'rgba(255, 77, 109, 0.16)', borderColor: 'rgba(255, 77, 109, 0.45)' },
  { name: 'Entertainment', icon: Film, color: '#FF4D6D', bgColor: 'rgba(255, 77, 109, 0.16)', borderColor: 'rgba(255, 77, 109, 0.45)' },
  { name: 'Travel & Trips', icon: Navigation, color: '#16C7F2', bgColor: 'rgba(22, 199, 242, 0.16)', borderColor: 'rgba(22, 199, 242, 0.45)' },
  { name: 'College & Education', icon: GraduationCap, color: '#168BFF', bgColor: 'rgba(22, 139, 255, 0.16)', borderColor: 'rgba(22, 139, 255, 0.45)' },
  { name: 'Rent & Housing', icon: Home, color: '#FFB91F', bgColor: 'rgba(255, 185, 31, 0.16)', borderColor: 'rgba(255, 185, 31, 0.45)' },
  { name: 'Milk & Dairy', icon: Droplet, color: '#B9E9FF', bgColor: 'rgba(185, 233, 255, 0.16)', borderColor: 'rgba(185, 233, 255, 0.45)' },
  { name: 'Veg & Fruits', icon: Apple, color: '#B9F36B', bgColor: 'rgba(185, 243, 107, 0.16)', borderColor: 'rgba(185, 243, 107, 0.45)' },
  { name: 'Maintenance', icon: Wrench, color: '#FFB91F', bgColor: 'rgba(255, 185, 31, 0.16)', borderColor: 'rgba(255, 185, 31, 0.45)' },
  { name: 'Personal Care & Salon', icon: Sparkles, color: '#E056FD', bgColor: 'rgba(224, 86, 253, 0.16)', borderColor: 'rgba(224, 86, 253, 0.45)' },
  { name: 'Insurance', icon: Shield, color: '#20BF6B', bgColor: 'rgba(32, 191, 107, 0.16)', borderColor: 'rgba(32, 191, 107, 0.45)' },
  { name: 'Investments & Stocks', icon: TrendingUp, color: '#00D2D3', bgColor: 'rgba(0, 210, 211, 0.16)', borderColor: 'rgba(0, 210, 211, 0.45)' },
  { name: 'Gifts & Donations', icon: Gift, color: '#FA8231', bgColor: 'rgba(250, 130, 49, 0.16)', borderColor: 'rgba(250, 130, 49, 0.45)' },
  { name: 'Miscellaneous', icon: Tag, color: '#95A5A6', bgColor: 'rgba(149, 165, 166, 0.16)', borderColor: 'rgba(149, 165, 166, 0.45)' },
];

export const SmartExpenseDetailModal: React.FC<SmartExpenseDetailModalProps> = ({
  isOpen,
  familyId = '',
  transaction,
  onClose,
  onConfirm,
  onRemoveLocation,
}) => {
  if (!isOpen || !transaction) return null;

  const [amount, setAmount] = useState(String(transaction.amount || ''));
  const [merchant, setMerchant] = useState(transaction.merchantNormalized || transaction.merchantRaw || '');
  const [category, setCategory] = useState(transaction.categorySuggested || 'Food & Dining');
  const [date, setDate] = useState(
    transaction.transactionDateTime ? transaction.transactionDateTime.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState(transaction.location?.locationLabel || '');
  const [savePreference, setSavePreference] = useState(true);

  // Category Picker Sheet State
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  const displayInfo = ExpenseLocationMapsHelper.getLocationDisplayInfo(transaction);

  const handleClearLocation = () => {
    setLocation('');
    if (transaction.id && onRemoveLocation) {
      onRemoveLocation(transaction.id);
    }
  };

  const handleOpenGoogleMaps = () => {
    ExpenseLocationMapsHelper.openInMaps(transaction);
  };

  const currentCategoryDef =
    CATEGORY_DEFINITIONS.find((c) => c.name.toLowerCase() === category.toLowerCase()) ||
    CATEGORY_DEFINITIONS.find((c) => category.toLowerCase().includes(c.name.toLowerCase().split(' ')[0])) || {
      name: category,
      icon: Tag,
      color: '#16C7F2',
      bgColor: 'rgba(22, 199, 242, 0.16)',
      borderColor: 'rgba(22, 199, 242, 0.45)',
    };

  const CurrentCategoryIcon = currentCategoryDef.icon;

  const filteredCategories = CATEGORY_DEFINITIONS.filter((c) =>
    c.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      amount: parseFloat(amount) || transaction.amount,
      merchant: merchant.trim() || transaction.merchantNormalized,
      category_name: category,
      date,
      notes: notes.trim(),
      location: location.trim(),
      savePreference,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pt-6 pb-[max(env(safe-area-inset-bottom,0px),36px)] bg-slate-950/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="w-full max-w-sm rounded-3xl bg-[#0D152D] border border-slate-700/90 shadow-2xl p-4 sm:p-5 space-y-4 text-slate-100 max-h-[88vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-base font-extrabold text-white tracking-tight">Review & Edit Expense</h3>
            <p className="text-[11px] text-slate-400">Captured via {transaction.sourceType || 'SMS'} ({transaction.transactionType || 'DEBIT'})</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Amount */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-base font-bold text-[#16C7F2]">₹</span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 focus:border-[#16C7F2] text-white font-bold text-base focus:outline-none"
              />
            </div>
          </div>

          {/* Merchant */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">Merchant / Payee</label>
            <div className="relative">
              <Store className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                required
                placeholder="e.g. Swiggy, Uber, Supermarket"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 focus:border-[#16C7F2] text-white font-medium text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Category Section with Interactive Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#16C7F2]" />
                <span>Expense Category</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCategoryPickerOpen(true)}
                className="text-[10px] font-bold text-[#16C7F2] hover:text-cyan-300 cursor-pointer flex items-center gap-0.5"
              >
                <span>View All ({CATEGORY_DEFINITIONS.length})</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            {/* Selected Category Highlight Card */}
            <div
              onClick={() => setIsCategoryPickerOpen(true)}
              style={{
                backgroundColor: currentCategoryDef.bgColor,
                borderColor: currentCategoryDef.borderColor,
              }}
              className="p-2.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <div
                  style={{ color: currentCategoryDef.color }}
                  className="w-8 h-8 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-center shrink-0"
                >
                  <CurrentCategoryIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">{category}</div>
                  <div className="text-[10px] text-slate-300">Tap to change category</div>
                </div>
              </div>
              <span className="px-2 py-1 rounded-lg bg-slate-900/70 text-[10px] font-bold text-slate-200 border border-white/10">
                Change
              </span>
            </div>

            {/* Quick Category Chips */}
            <div className="grid grid-cols-3 gap-1.5 pt-0.5">
              {CATEGORY_DEFINITIONS.slice(0, 6).map((catDef) => {
                const Icon = catDef.icon;
                const isSelected = category.toLowerCase() === catDef.name.toLowerCase();
                return (
                  <button
                    key={catDef.name}
                    type="button"
                    onClick={() => setCategory(catDef.name)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                      isSelected
                        ? 'bg-[#16C7F2] text-slate-950 border-[#16C7F2] shadow-sm'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/80'
                    }`}
                  >
                    <Icon className="w-3 h-3 shrink-0" />
                    <span className="truncate">{catDef.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Picker using CustomDatePicker */}
          <div className="space-y-1">
            <CustomDatePicker
              label="Date"
              value={date}
              onChange={(newDate) => setDate(newDate)}
              required
            />
          </div>

          {/* Location Context */}
          <div className="space-y-2 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#16C7F2]" />
                <span>Location Context</span>
              </label>
              {location && (
                <button
                  type="button"
                  onClick={handleClearLocation}
                  className="text-[10px] text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Remove location"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            {/* Display info badge / subtitle */}
            {displayInfo.hasLocation && (
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="text-[#16C7F2]">📍</span>
                      <span>{displayInfo.displayLabel}</span>
                    </div>
                    {displayInfo.subLabel && (
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        {displayInfo.confidence === 'HIGH' && (
                          <Sparkles className="w-2.5 h-2.5 text-[#55D98A]" />
                        )}
                        <span>{displayInfo.subLabel}</span>
                      </p>
                    )}
                  </div>
                  {displayInfo.confidence && displayInfo.confidence !== 'NONE' && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                        displayInfo.confidence === 'HIGH'
                          ? 'bg-[#55D98A]/20 text-[#55D98A] border border-[#55D98A]/30'
                          : displayInfo.confidence === 'MEDIUM'
                          ? 'bg-[#FFD21F]/20 text-[#FFD21F] border border-[#FFD21F]/30'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {displayInfo.confidence}
                    </span>
                  )}
                </div>

                {/* Google Maps Button */}
                {displayInfo.mapsUrl && (
                  <button
                    type="button"
                    onClick={handleOpenGoogleMaps}
                    className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-slate-800 to-slate-850 hover:from-slate-700 hover:to-slate-750 text-[#16C7F2] hover:text-white text-[11px] font-bold border border-[#16C7F2]/30 hover:border-[#16C7F2]/60 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Navigation className="w-3 h-3 text-[#16C7F2]" />
                    <span>Open in Google Maps</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-70 ml-0.5" />
                  </button>
                )}
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Jubilee Hills, Hyderabad"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 focus:border-[#16C7F2] text-white font-medium focus:outline-none placeholder-slate-500 text-xs"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">Notes (Optional)</label>
            <div className="relative">
              <FileText className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Add detail (e.g. Lunch with team)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 focus:border-[#16C7F2] text-white font-medium focus:outline-none placeholder-slate-500 text-xs"
              />
            </div>
          </div>

          {/* Remember Preference Checkbox */}
          <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer text-[11px] text-slate-300">
            <input
              type="checkbox"
              checked={savePreference}
              onChange={(e) => setSavePreference(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-700 text-[#16C7F2] focus:ring-0 cursor-pointer"
            />
            <span>Remember <strong>{category}</strong> for future {merchant} spends</span>
          </label>

          {/* Actions */}
          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#168BFF] to-[#16C7F2] text-slate-950 hover:text-white font-extrabold text-xs shadow-lg shadow-[#168BFF]/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Confirm Expense</span>
            </button>
          </div>
        </form>
      </div>

      {/* Full Category Selection Modal */}
      {isCategoryPickerOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 pt-6 pb-[max(env(safe-area-inset-bottom,0px),24px)] bg-slate-950/90 backdrop-blur-md animate-fadeIn select-none">
          <div className="w-full max-w-sm rounded-3xl bg-[#0D152D] border border-slate-700/90 shadow-2xl p-4 text-slate-100 space-y-3 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#16C7F2]/20 border border-[#16C7F2]/40 flex items-center justify-center text-[#16C7F2]">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Select Category</h3>
                  <p className="text-[10px] text-slate-400">Choose the best matching category</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryPickerOpen(false)}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={categorySearchQuery}
                onChange={(e) => setCategorySearchQuery(e.target.value)}
                placeholder="Search categories..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 focus:border-[#16C7F2] text-white text-xs focus:outline-none placeholder-slate-500"
              />
            </div>

            {/* Category Grid */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {filteredCategories.map((catDef) => {
                const Icon = catDef.icon;
                const isSelected = category.toLowerCase() === catDef.name.toLowerCase();
                return (
                  <button
                    key={catDef.name}
                    type="button"
                    onClick={() => {
                      setCategory(catDef.name);
                      setIsCategoryPickerOpen(false);
                    }}
                    style={{
                      backgroundColor: isSelected ? catDef.bgColor : undefined,
                      borderColor: isSelected ? catDef.borderColor : undefined,
                    }}
                    className={`w-full p-2.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-2 shadow-md'
                        : 'bg-slate-850/70 border-slate-800 hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        style={{ color: catDef.color }}
                        className="w-8 h-8 rounded-xl bg-slate-900/80 flex items-center justify-center shrink-0 border border-white/10"
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-xs ${isSelected ? 'font-black text-white' : 'font-semibold text-slate-200'}`}>
                        {catDef.name}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[#16C7F2] text-slate-950 flex items-center justify-center font-bold shadow-sm">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
