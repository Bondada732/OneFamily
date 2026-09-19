import React, { useState } from 'react';
import {
  X,
  Check,
  FolderLock,
  FileText,
  ShieldCheck,
  CreditCard,
  Car,
  GraduationCap,
  KeyRound,
  FileCheck2,
  Plus,
  Calendar,
  Lock,
  Tag,
} from 'lucide-react';
import { CustomDatePicker } from './CustomDatePicker.js';

export interface AddVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (vaultData: {
    title: string;
    category: string;
    document_number?: string;
    holder_name?: string;
    expiry_date?: string;
    notes?: string;
  }) => Promise<void> | void;
  familyMembers?: Array<{ id: string; name: string }>;
}

interface VaultCategoryItem {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

const VAULT_CATEGORIES: VaultCategoryItem[] = [
  { id: 'IDENTITY', name: 'ID & KYC', icon: FileCheck2, color: '#168BFF', bgColor: 'rgba(22, 139, 255, 0.16)', borderColor: 'rgba(22, 139, 255, 0.40)' },
  { id: 'PROPERTY', name: 'Property Deed', icon: FileText, color: '#19C9A7', bgColor: 'rgba(25, 201, 167, 0.16)', borderColor: 'rgba(25, 201, 167, 0.40)' },
  { id: 'INSURANCE', name: 'Insurance & Health', icon: ShieldCheck, color: '#FFD21F', bgColor: 'rgba(255, 210, 31, 0.16)', borderColor: 'rgba(255, 210, 31, 0.40)' },
  { id: 'BANKING', name: 'Bank & FD', icon: CreditCard, color: '#55D98A', bgColor: 'rgba(85, 217, 138, 0.16)', borderColor: 'rgba(85, 217, 138, 0.40)' },
  { id: 'VEHICLE', name: 'Vehicle & RC', icon: Car, color: '#FF8A24', bgColor: 'rgba(255, 138, 36, 0.16)', borderColor: 'rgba(255, 138, 36, 0.40)' },
  { id: 'EDUCATION', name: 'Certificates', icon: GraduationCap, color: '#16C7F2', bgColor: 'rgba(22, 199, 242, 0.16)', borderColor: 'rgba(22, 199, 242, 0.40)' },
  { id: 'PASSWORDS', name: 'Secrets & PINs', icon: KeyRound, color: '#FF4D6D', bgColor: 'rgba(255, 77, 109, 0.16)', borderColor: 'rgba(255, 77, 109, 0.40)' },
  { id: 'OTHER', name: 'Other Vault', icon: FolderLock, color: '#FFB91F', bgColor: 'rgba(255, 185, 31, 0.16)', borderColor: 'rgba(255, 185, 31, 0.40)' },
];

const QUICK_VAULT_PRESETS = [
  { label: 'Aadhaar Card', category: 'IDENTITY', prefix: 'AADHAAR' },
  { label: 'PAN Card', category: 'IDENTITY', prefix: 'PAN' },
  { label: 'Passport', category: 'IDENTITY', prefix: 'PASSPORT' },
  { label: 'Driving License', category: 'VEHICLE', prefix: 'DL' },
  { label: 'Health Insurance', category: 'INSURANCE', prefix: 'POLICY' },
  { label: 'Vehicle RC', category: 'VEHICLE', prefix: 'RC' },
  { label: 'House Agreement', category: 'PROPERTY', prefix: 'DEED' },
  { label: 'Fixed Deposit Receipt', category: 'BANKING', prefix: 'FDR' },
];

export const AddVaultModal: React.FC<AddVaultModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  familyMembers = [],
}) => {
  const [title, setTitle] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [holderName, setHolderName] = useState(familyMembers[0]?.name || 'Family');
  const [selectedCategory, setSelectedCategory] = useState('IDENTITY');
  const [selectedCatName, setSelectedCatName] = useState('ID & KYC');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');
  const [categoriesList, setCategoriesList] = useState<VaultCategoryItem[]>(VAULT_CATEGORIES);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof QUICK_VAULT_PRESETS[0]) => {
    setActivePreset(preset.label);
    setTitle(preset.label);
    const cat = categoriesList.find((c) => c.id === preset.category);
    if (cat) {
      setSelectedCategory(cat.id);
      setSelectedCatName(cat.name);
    }
  };

  const handleSelectCategory = (cat: VaultCategoryItem) => {
    setSelectedCategory(cat.id);
    setSelectedCatName(cat.name);
  };

  const handleAddCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const newCat: VaultCategoryItem = {
      id: `CAT_${Date.now()}`,
      name: customName.trim(),
      icon: Tag,
      color: '#F59E0B',
      bgColor: 'rgba(245, 158, 11, 0.16)',
      borderColor: 'rgba(245, 158, 11, 0.50)',
    };
    setCategoriesList((prev) => [...prev, newCat]);
    setSelectedCategory(newCat.id);
    setSelectedCatName(newCat.name);
    setCustomName('');
    setShowCustomInput(false);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        title: title.trim(),
        category: selectedCategory,
        document_number: docNumber.trim(),
        holder_name: holderName,
        expiry_date: expiryDate,
        notes: notes.trim(),
      });
      setTitle('');
      setDocNumber('');
      setNotes('');
      setActivePreset(null);
    } catch (err) {
      console.error('Error adding vault document:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#0B1226] border-2 border-[#F59E0B]/40 rounded-[28px] p-4 sm:p-5 text-[#F4F8FF] shadow-[0_20px_60px_rgba(0,0,0,0.98)] space-y-4 max-h-[92vh] overflow-y-auto [&::-webkit-scrollbar]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#F59E0B]/20 text-[#FBBF24] border border-[#F59E0B]/40">
              <FolderLock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Family Vault & Documents</h3>
              <p className="text-[10px] text-slate-400">End-to-End Encrypted • Bank-Grade Security</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#0E1730] text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Quick Preset Document Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {QUICK_VAULT_PRESETS.map((preset) => {
            const isSelected = activePreset === preset.label;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-[#F59E0B] text-[#0B1226] border-white shadow-md shadow-[#F59E0B]/40 scale-105 font-bold'
                    : 'bg-[#0D152D] hover:bg-[#131F3F] text-slate-300 border-slate-700/60'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmitForm} className="space-y-4">
          {/* 2. Document Identifier / Card Number Input Box */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Document / Card / Policy Number *</label>
            <div className="flex items-center bg-[#050811] border-2 border-slate-700/80 focus-within:border-[#F59E0B] rounded-2xl px-4 py-3 shadow-inner transition-colors">
              <Lock className="w-5 h-5 text-[#F59E0B] mr-2.5 shrink-0" />
              <input
                type="text"
                required
                placeholder="e.g. 5432 8765 1092 / ABCDE1234F"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                className="w-full bg-transparent text-base sm:text-lg font-bold text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          {/* 3. Category Grid */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Vault Type: <span className="text-[#FBBF24] font-bold">{selectedCatName}</span>
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
              <div className="p-2.5 rounded-xl bg-[#0D152D] border border-slate-700/80 flex items-center gap-2 animate-fade-in">
                <input
                  type="text"
                  placeholder="New document category (e.g. Business License)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-[#050811] border border-slate-700/80 rounded-lg text-xs text-white outline-none focus:border-[#F59E0B]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomCategory}
                  className="px-3 py-1.5 bg-[#F59E0B] text-[#0B1226] font-bold text-xs rounded-lg hover:opacity-95"
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
                        ? 'bg-[rgba(245,158,11,0.22)] border-[#F59E0B] shadow-[0_0_14px_rgba(245,158,11,0.35)] scale-[1.03] ring-1 ring-[#F59E0B]'
                        : 'bg-[#0D152D] hover:bg-[#131F3F] border-slate-800 opacity-85 hover:opacity-100'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center mb-1 transition-all"
                      style={{
                        backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.28)' : cat.bgColor,
                        color: isSelected ? '#FBBF24' : cat.color,
                        border: `1px solid ${isSelected ? '#F59E0B' : cat.borderColor}`,
                      }}
                    >
                      <IconComponent className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <span
                      className={`text-[10.5px] font-bold text-center leading-tight truncate w-full ${
                        isSelected ? 'text-white' : 'text-slate-300'
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
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl border border-dashed border-slate-700 bg-[#0D152D]/60 hover:bg-[#0D152D] text-[#F59E0B] transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center mb-1 text-[#F59E0B]">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[10.5px] font-bold text-center leading-tight text-slate-300">
                  Custom
                </span>
              </button>
            </div>
          </div>

          {/* 4. Document Title & Holder Name */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Document Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Father Aadhaar Card"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#050811] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-[#F59E0B]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Document Holder</label>
              <input
                type="text"
                placeholder="e.g. Rambabu"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#050811] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-[#F59E0B]"
              />
            </div>
          </div>

          {/* 5. Expiry Date & Notes */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <CustomDatePicker
                label="Expiry / Valid Till"
                value={expiryDate}
                onChange={(newDate) => setExpiryDate(newDate)}
                className="!bg-[#050811] !border-slate-700/80 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Stored in Locker 4"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#050811] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-[#F59E0B]"
              />
            </div>
          </div>

          {/* 6. Submit CTA */}
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="w-full py-3.5 bg-gradient-to-r from-[#F59E0B] via-[#FFD21F] to-[#10B981] hover:opacity-95 disabled:opacity-50 text-[#0B1226] font-black text-sm rounded-2xl shadow-[0_8px_25px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer mt-2"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>Save to Secure Family Vault</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddVaultModal;
