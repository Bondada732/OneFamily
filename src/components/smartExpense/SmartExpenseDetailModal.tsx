import React, { useState } from 'react';
import { X, Check, Tag, Calendar, FileText, Store, MapPin, Trash2, Sparkles, ExternalLink, Navigation } from 'lucide-react';
import { DetectedTransaction } from '../../services/smartExpense/types.js';
import { ExpenseLocationMapsHelper, openExpenseLocationInMaps } from '../../services/smartExpense/ExpenseLocationMapsHelper.js';

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

const CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Transport',
  'Shopping',
  'Utilities',
  'Housing',
  'Education',
  'Healthcare',
  'Entertainment',
  'Travel',
  'Subscriptions',
  'Insurance',
  'Investments',
  'Gifts',
  'Personal Care',
  'Miscellaneous',
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
  const [category, setCategory] = useState(transaction.categorySuggested || 'Miscellaneous');
  const [date, setDate] = useState(
    transaction.transactionDateTime ? transaction.transactionDateTime.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState(transaction.location?.locationLabel || '');
  const [savePreference, setSavePreference] = useState(true);

  const locContext = transaction.location;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn select-none">
      <div className="w-full max-w-sm rounded-3xl bg-[#0D152D] border border-slate-700/80 shadow-2xl p-5 space-y-4 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-white tracking-tight">Review & Edit Expense</h3>
            <p className="text-[11px] text-slate-400">Captured via {transaction.sourceType} ({transaction.transactionType})</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {/* Amount */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-400">₹</span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 focus:border-[#16C7F2] text-white font-bold text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Merchant */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">Merchant / Payee</label>
            <div className="relative">
              <Store className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                required
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 focus:border-[#16C7F2] text-white font-medium focus:outline-none"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">Category</label>
            <div className="relative">
              <Tag className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 focus:border-[#16C7F2] text-white font-medium focus:outline-none appearance-none cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900 text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
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
                  className="text-[10px] text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
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
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                      displayInfo.confidence === 'HIGH'
                        ? 'bg-[#55D98A]/20 text-[#55D98A] border border-[#55D98A]/30'
                        : displayInfo.confidence === 'MEDIUM'
                        ? 'bg-[#FFD21F]/20 text-[#FFD21F] border border-[#FFD21F]/30'
                        : 'bg-slate-700 text-slate-300'
                    }`}>
                      {displayInfo.confidence}
                    </span>
                  )}
                </div>

                {/* Google Maps Button - only shown if mapsUrl exists */}
                {displayInfo.mapsUrl && (
                  <button
                    type="button"
                    onClick={handleOpenGoogleMaps}
                    className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-slate-800 to-slate-850 hover:from-slate-700 hover:to-slate-750 text-[#16C7F2] hover:text-white text-[11px] font-bold border border-[#16C7F2]/30 hover:border-[#16C7F2]/60 transition-all flex items-center justify-center gap-1.5 shadow-sm"
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

          {/* Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">Date</label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 focus:border-[#16C7F2] text-white font-medium focus:outline-none"
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
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 focus:border-[#16C7F2] text-white font-medium focus:outline-none placeholder-slate-500"
              />
            </div>
          </div>

          {/* Remember Preference Checkbox */}
          <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer text-[11px] text-slate-300">
            <input
              type="checkbox"
              checked={savePreference}
              onChange={(e) => setSavePreference(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-slate-700 text-[#16C7F2] focus:ring-0 cursor-pointer"
            />
            <span>Remember <strong>{category}</strong> for future {merchant} spends</span>
          </label>

          {/* Actions */}
          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#168BFF] to-[#16C7F2] text-slate-950 hover:text-white font-extrabold text-xs shadow-lg shadow-[#168BFF]/30 transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Confirm Expense</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
