import React, { useState } from 'react';
import {
  X,
  Check,
  ShieldAlert,
  Ambulance,
  Stethoscope,
  ShieldCheck,
  Users,
  Droplet,
  Flame,
  Pill,
  PhoneCall,
  Plus,
  Phone,
  Tag,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.js';

export interface AddEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (contactData: {
    contact_name: string;
    phone: string;
    relationship: string;
    category?: string;
    blood_group?: string;
    notes?: string;
  }) => Promise<void> | void;
}

interface EmergencyCategoryItem {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

const EMERGENCY_CATEGORIES: EmergencyCategoryItem[] = [
  { id: 'AMBULANCE', name: 'Ambulance', icon: Ambulance, color: '#FF4D6D', bgColor: 'rgba(255, 77, 109, 0.16)', borderColor: 'rgba(255, 77, 109, 0.40)' },
  { id: 'DOCTOR', name: 'Doctor / Clinic', icon: Stethoscope, color: '#168BFF', bgColor: 'rgba(22, 139, 255, 0.16)', borderColor: 'rgba(22, 139, 255, 0.40)' },
  { id: 'POLICE', name: 'Police / Safety', icon: ShieldCheck, color: '#FFD21F', bgColor: 'rgba(255, 210, 31, 0.16)', borderColor: 'rgba(255, 210, 31, 0.40)' },
  { id: 'FAMILY', name: 'Close Relative', icon: Users, color: '#19C9A7', bgColor: 'rgba(25, 201, 167, 0.16)', borderColor: 'rgba(25, 201, 167, 0.40)' },
  { id: 'BLOOD', name: 'Blood Bank', icon: Droplet, color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.16)', borderColor: 'rgba(239, 68, 68, 0.40)' },
  { id: 'FIRE', name: 'Fire Dept', icon: Flame, color: '#FF8A24', bgColor: 'rgba(255, 138, 36, 0.16)', borderColor: 'rgba(255, 138, 36, 0.40)' },
  { id: 'PHARMACY', name: '24/7 Pharmacy', icon: Pill, color: '#55D98A', bgColor: 'rgba(85, 217, 138, 0.16)', borderColor: 'rgba(85, 217, 138, 0.40)' },
  { id: 'SOS', name: 'SOS Helpline', icon: ShieldAlert, color: '#16C7F2', bgColor: 'rgba(22, 199, 242, 0.16)', borderColor: 'rgba(22, 199, 242, 0.40)' },
];

const QUICK_EMERGENCY_PRESETS = [
  { label: 'National Ambulance (108)', phone: '108', category: 'AMBULANCE', name: 'National Ambulance' },
  { label: 'Police Emergency (100)', phone: '100', category: 'POLICE', name: 'Police Control' },
  { label: 'Family Doctor', phone: '+91 98480 12345', category: 'DOCTOR', name: 'Dr. Srinivas' },
  { label: 'Apollo Hospital (1066)', phone: '1066', category: 'AMBULANCE', name: 'Apollo Emergency Desk' },
  { label: 'Fire Service (101)', phone: '101', category: 'FIRE', name: 'Fire Emergency Control' },
  { label: 'Women Helpline (1091)', phone: '1091', category: 'POLICE', name: 'Women Safety Desk' },
  { label: 'Red Cross Blood Bank', phone: '040-27633087', category: 'BLOOD', name: 'Red Cross Blood Bank' },
  { label: 'Apollo 24/7 Pharmacy', phone: '1860-500-0101', category: 'PHARMACY', name: 'Apollo Pharmacy' },
];

const BLOOD_GROUPS = ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'];

export const AddEmergencyModal: React.FC<AddEmergencyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('Emergency Contact');
  const [selectedCategory, setSelectedCategory] = useState('AMBULANCE');
  const [selectedCatName, setSelectedCatName] = useState('Ambulance');
  const [selectedBlood, setSelectedBlood] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');
  const [categoriesList, setCategoriesList] = useState<EmergencyCategoryItem[]>(EMERGENCY_CATEGORIES);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof QUICK_EMERGENCY_PRESETS[0]) => {
    setActivePreset(preset.label);
    setPhone(preset.phone);
    setContactName(preset.name);
    const cat = categoriesList.find((c) => c.id === preset.category);
    if (cat) {
      setSelectedCategory(cat.id);
      setSelectedCatName(cat.name);
    }
  };

  const handleSelectCategory = (cat: EmergencyCategoryItem) => {
    setSelectedCategory(cat.id);
    setSelectedCatName(cat.name);
  };

  const handleAddCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const newCat: EmergencyCategoryItem = {
      id: `CAT_${Date.now()}`,
      name: customName.trim(),
      icon: Tag,
      color: isLight ? '#B84A1E' : '#16C7F2',
      bgColor: isLight ? 'rgba(184, 74, 30, 0.16)' : 'rgba(22, 199, 242, 0.16)',
      borderColor: isLight ? 'rgba(184, 74, 30, 0.50)' : 'rgba(22, 199, 242, 0.50)',
    };
    setCategoriesList((prev) => [...prev, newCat]);
    setSelectedCategory(newCat.id);
    setSelectedCatName(newCat.name);
    setCustomName('');
    setShowCustomInput(false);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !phone.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        contact_name: contactName.trim(),
        phone: phone.trim(),
        relationship: relationship.trim() || 'Emergency Contact',
        category: selectedCategory,
        blood_group: selectedBlood || undefined,
        notes: notes.trim(),
      });
      setContactName('');
      setPhone('');
      setNotes('');
      setActivePreset(null);
      onClose();
    } catch (err) {
      console.error('Error adding emergency contact:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 ${isLight ? 'bg-black/50' : 'bg-black/80'} backdrop-blur-md animate-fade-in`}>
      <div className={`w-full max-w-md rounded-[28px] p-4 sm:p-5 space-y-4 max-h-[92vh] overflow-y-auto [&::-webkit-scrollbar]:hidden ${
        isLight
          ? 'bg-[#EFE4D6] border-2 border-[#DECFC0] text-[#2A1B14] shadow-[0_20px_60px_rgba(140,95,60,0.22)]'
          : 'bg-[#0B1226] border-2 border-[#EF4444]/40 text-[#F4F8FF] shadow-[0_20px_60px_rgba(0,0,0,0.98)]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl border ${
              isLight
                ? 'bg-[#F7D4BC] text-[#C62828] border-[#E8BC9E]'
                : 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/40'
            }`}>
              <ShieldAlert className="w-5 h-5 stroke-[2.2] animate-pulse" />
            </div>
            <div>
              <h3 className={`text-lg font-bold tracking-tight ${isLight ? 'text-[#2A1B14]' : 'text-white'}`}>Family Emergency & SOS</h3>
              <p className={`text-[10px] ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>1-Tap Direct Calling & Instant Medical Reference</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors ${
              isLight
                ? 'hover:bg-[#EBE0D2] text-[#634B3F] hover:text-[#2A1B14]'
                : 'hover:bg-[#0E1730] text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Quick Preset Emergency Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {QUICK_EMERGENCY_PRESETS.map((preset) => {
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
                      : 'bg-[#EF4444] text-white border-white shadow-md shadow-[#EF4444]/40 scale-105 font-bold'
                    : isLight
                    ? 'bg-[#EBE0D2] hover:bg-[#DECFC0] text-[#634B3F] border-[#DECFC0]'
                    : 'bg-[#0D152D] hover:bg-[#131F3F] text-slate-300 border-slate-700/60'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmitForm} className="space-y-4">
          {/* 2. Direct Emergency Phone Number Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Emergency Phone Number *</label>
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className={`text-[11px] font-bold hover:underline flex items-center gap-1 ${
                    isLight ? 'text-[#2E7D32]' : 'text-[#55D98A]'
                  }`}
                >
                  <PhoneCall className="w-3 h-3" />
                  <span>Test Call</span>
                </a>
              )}
            </div>
            <div className={`flex items-center rounded-2xl px-4 py-3 shadow-inner transition-colors border-2 ${
              isLight
                ? 'bg-[#EBE0D2] border-[#DECFC0] focus-within:border-[#C25425]'
                : 'bg-[#050811] border-slate-700/80 focus-within:border-[#EF4444]'
            }`}>
              <Phone className={`w-5 h-5 mr-2.5 shrink-0 ${isLight ? 'text-[#B84A1E]' : 'text-[#EF4444]'}`} />
              <input
                type="tel"
                required
                placeholder="+91 98765 43210 / 108"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full bg-transparent text-lg sm:text-xl font-bold outline-none ${
                  isLight
                    ? 'text-[#2A1B14] placeholder-[#947D70]'
                    : 'text-white placeholder-slate-500'
                }`}
              />
            </div>
          </div>

          {/* 3. Category Grid */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>
                Service Type: <span className={`font-bold ${isLight ? 'text-[#B84A1E]' : 'text-[#EF4444]'}`}>{selectedCatName}</span>
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
                  : 'bg-[#0D152D] border-slate-700/80'
              }`}>
                <input
                  type="text"
                  placeholder="New emergency type (e.g. Veterinarian)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs outline-none border ${
                    isLight
                      ? 'bg-[#F4EDE4] border-[#DECFC0] text-[#2A1B14] placeholder-[#947D70] focus:border-[#C25425]'
                      : 'bg-[#050811] border-slate-700/80 text-white placeholder-slate-500 focus:border-[#EF4444]'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleAddCustomCategory}
                  className={`px-3 py-1.5 font-bold text-xs rounded-lg hover:opacity-95 ${
                    isLight ? 'bg-[#B84A1E] text-white' : 'bg-[#EF4444] text-white'
                  }`}
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
                        ? isLight
                          ? 'bg-[#F7D4BC] border-[#E8BC9E] shadow-[0_4px_14px_rgba(184,74,30,0.18)] scale-[1.03] ring-1 ring-[#D96632]'
                          : 'bg-[rgba(239,68,68,0.22)] border-[#EF4444] shadow-[0_0_14px_rgba(239,68,68,0.35)] scale-[1.03] ring-1 ring-[#EF4444]'
                        : isLight
                        ? 'bg-[#EBE0D2] hover:bg-[#E4D7C7] border-[#DECFC0] opacity-90 hover:opacity-100'
                        : 'bg-[#0D152D] hover:bg-[#131F3F] border-slate-800 opacity-85 hover:opacity-100'
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
                          ? 'rgba(239, 68, 68, 0.28)'
                          : cat.bgColor,
                        color: isLight
                          ? isSelected
                            ? '#FFFFFF'
                            : '#634B3F'
                          : isSelected
                          ? '#EF4444'
                          : cat.color,
                        border: `1px solid ${
                          isLight
                            ? isSelected
                              ? '#B84A1E'
                              : '#DECFC0'
                            : isSelected
                            ? '#EF4444'
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
                          : 'text-slate-300'
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
                    : 'border-slate-700 bg-[#0D152D]/60 hover:bg-[#0D152D] text-[#EF4444]'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1 border ${
                  isLight
                    ? 'bg-[#F7D4BC]/60 border-[#E8BC9E] text-[#B84A1E]'
                    : 'bg-[#EF4444]/15 border-[#EF4444]/30 text-[#EF4444]'
                }`}>
                  <Plus className="w-4 h-4" />
                </div>
                <span className={`text-[10.5px] font-bold text-center leading-tight ${
                  isLight ? 'text-[#634B3F]' : 'text-slate-300'
                }`}>
                  Custom
                </span>
              </button>
            </div>
          </div>

          {/* 4. Contact Name & Relationship */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={`text-xs font-semibold block mb-1 ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Contact / Doctor Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. K. Srinivas"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs outline-none border ${
                  isLight
                    ? 'bg-[#EBE0D2] border-[#DECFC0] text-[#2A1B14] placeholder-[#947D70] focus:border-[#C25425]'
                    : 'bg-[#050811] border-slate-700/80 text-white placeholder-slate-500 focus:border-[#EF4444]'
                }`}
              />
            </div>

            <div>
              <label className={`text-xs font-semibold block mb-1 ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Role / Relationship</label>
              <input
                type="text"
                placeholder="e.g. Cardiologist / Uncle"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs outline-none border ${
                  isLight
                    ? 'bg-[#EBE0D2] border-[#DECFC0] text-[#2A1B14] placeholder-[#947D70] focus:border-[#C25425]'
                    : 'bg-[#050811] border-slate-700/80 text-white placeholder-slate-500 focus:border-[#EF4444]'
                }`}
              />
            </div>
          </div>

          {/* 5. Blood Group Chips (Optional) */}
          <div className="space-y-1.5">
            <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Blood Group (Optional)</label>
            <div className="grid grid-cols-4 gap-1.5">
              {BLOOD_GROUPS.map((bg) => {
                const isSelected = selectedBlood === bg;
                return (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setSelectedBlood(isSelected ? null : bg)}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      isSelected
                        ? isLight
                          ? 'bg-[#B84A1E] text-white border-[#B84A1E] shadow'
                          : 'bg-[#EF4444] text-white border-white shadow'
                        : isLight
                        ? 'bg-[#EBE0D2] text-[#634B3F] border-[#DECFC0] hover:text-[#2A1B14]'
                        : 'bg-[#050811] text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {bg}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Notes / Address */}
          <div className="space-y-1">
            <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Hospital Address / Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Road No 2, Banjara Hills • 24/7 Casualty"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border ${
                isLight
                  ? 'bg-[#EBE0D2] border-[#DECFC0] text-[#2A1B14] placeholder-[#947D70] focus:border-[#C25425]'
                  : 'bg-[#050811] border-slate-700/80 text-white placeholder-slate-500 focus:border-[#EF4444]'
              }`}
            />
          </div>

          {/* 7. Submit CTA */}
          <button
            type="submit"
            disabled={isSubmitting || !contactName.trim() || !phone.trim()}
            className={`w-full py-3.5 hover:opacity-95 disabled:opacity-50 font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer mt-2 ${
              isLight
                ? 'bg-gradient-to-r from-[#D96632] via-[#C85928] to-[#B84A1E] text-white shadow-[0_8px_25px_rgba(184,74,30,0.35)]'
                : 'bg-gradient-to-r from-[#FF4D6D] via-[#EF4444] to-[#FF8A24] text-white shadow-[0_8px_25px_rgba(239,68,68,0.40)]'
            }`}
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>Save Emergency Contact</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddEmergencyModal;
