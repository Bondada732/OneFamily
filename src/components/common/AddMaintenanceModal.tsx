import React, { useState } from 'react';
import {
  X,
  Check,
  Wrench,
  Car,
  Bike,
  Wind,
  Droplet,
  Tv,
  Home,
  Zap,
  Plus,
  Phone,
  Tag,
} from 'lucide-react';
import { Calendar } from 'lucide-react';
import { CustomDatePicker } from './CustomDatePicker.js';

export interface AddMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (maintenanceData: {
    item_name: string;
    service_type: string;
    cost?: number;
    service_provider?: string;
    contact_phone?: string;
    next_service_due?: string;
    notes?: string;
  }) => Promise<void> | void;
}

interface MaintenanceCategoryItem {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

const MAINTENANCE_CATEGORIES: MaintenanceCategoryItem[] = [
  { id: 'CAR', name: 'Car Service', icon: Car, color: '#FF8A24', bgColor: 'rgba(255, 138, 36, 0.16)', borderColor: 'rgba(255, 138, 36, 0.40)' },
  { id: 'BIKE', name: 'Bike & Scooter', icon: Bike, color: '#16C7F2', bgColor: 'rgba(22, 199, 242, 0.16)', borderColor: 'rgba(22, 199, 242, 0.40)' },
  { id: 'AC', name: 'Air Conditioner', icon: Wind, color: '#168BFF', bgColor: 'rgba(22, 139, 255, 0.16)', borderColor: 'rgba(22, 139, 255, 0.40)' },
  { id: 'WATER', name: 'Water Purifier', icon: Droplet, color: '#19C9A7', bgColor: 'rgba(25, 201, 167, 0.16)', borderColor: 'rgba(25, 201, 167, 0.40)' },
  { id: 'APPLIANCE', name: 'Home Appliance', icon: Tv, color: '#55D98A', bgColor: 'rgba(85, 217, 138, 0.16)', borderColor: 'rgba(85, 217, 138, 0.40)' },
  { id: 'HOME', name: 'Home Repair', icon: Home, color: '#FFD21F', bgColor: 'rgba(255, 210, 31, 0.16)', borderColor: 'rgba(255, 210, 31, 0.40)' },
  { id: 'ELECTRICAL', name: 'Electrical & Gas', icon: Zap, color: '#FF4D6D', bgColor: 'rgba(255, 77, 109, 0.16)', borderColor: 'rgba(255, 77, 109, 0.40)' },
  { id: 'OTHER', name: 'Other Service', icon: Wrench, color: '#FFB91F', bgColor: 'rgba(255, 185, 31, 0.16)', borderColor: 'rgba(255, 185, 31, 0.40)' },
];

const QUICK_MAINTENANCE_PRESETS = [
  { label: 'Car Periodic Service', category: 'CAR', cost: 4500, provider: 'Maruti Authorized Workshop' },
  { label: 'Bike Oil & Filter', category: 'BIKE', cost: 1200, provider: 'Honda Service Point' },
  { label: 'AC Deep Cleaning', category: 'AC', cost: 999, provider: 'Urban Company' },
  { label: 'Water Filter Cartridge', category: 'WATER', cost: 1800, provider: 'Kent RO Service' },
  { label: 'Washing Machine AMC', category: 'APPLIANCE', cost: 2500, provider: 'LG Care Center' },
  { label: 'Home Pest Control', category: 'HOME', cost: 2200, provider: 'Pest Control Services' },
  { label: 'Chimney & Hob Cleaning', category: 'HOME', cost: 1500, provider: 'Kitchen Deep Clean' },
  { label: 'Geyser Heating Coil', category: 'ELECTRICAL', cost: 1100, provider: 'Havells Electrician' },
];

export const AddMaintenanceModal: React.FC<AddMaintenanceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [itemName, setItemName] = useState('');
  const [cost, setCost] = useState('');
  const [provider, setProvider] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('CAR');
  const [selectedCatName, setSelectedCatName] = useState('Car Service');
  const [nextDue, setNextDue] = useState('');
  const [notes, setNotes] = useState('');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');
  const [categoriesList, setCategoriesList] = useState<MaintenanceCategoryItem[]>(MAINTENANCE_CATEGORIES);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof QUICK_MAINTENANCE_PRESETS[0]) => {
    setActivePreset(preset.label);
    setItemName(preset.label);
    if (preset.cost) setCost(String(preset.cost));
    if (preset.provider) setProvider(preset.provider);
    const cat = categoriesList.find((c) => c.id === preset.category);
    if (cat) {
      setSelectedCategory(cat.id);
      setSelectedCatName(cat.name);
    }
    // Default next due in 6 months
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    setNextDue(d.toISOString().split('T')[0]);
  };

  const handleSelectCategory = (cat: MaintenanceCategoryItem) => {
    setSelectedCategory(cat.id);
    setSelectedCatName(cat.name);
  };

  const handleAddCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const newCat: MaintenanceCategoryItem = {
      id: `CAT_${Date.now()}`,
      name: customName.trim(),
      icon: Tag,
      color: '#FB923C',
      bgColor: 'rgba(251, 146, 60, 0.16)',
      borderColor: 'rgba(251, 146, 60, 0.50)',
    };
    setCategoriesList((prev) => [...prev, newCat]);
    setSelectedCategory(newCat.id);
    setSelectedCatName(newCat.name);
    setCustomName('');
    setShowCustomInput(false);
  };

  const handleQuickDue = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    setNextDue(d.toISOString().split('T')[0]);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        item_name: itemName.trim(),
        service_type: selectedCategory,
        cost: Number(cost) || 0,
        service_provider: provider.trim(),
        contact_phone: phone.trim(),
        next_service_due: nextDue,
        notes: notes.trim(),
      });
      setItemName('');
      setCost('');
      setProvider('');
      setPhone('');
      setNotes('');
      setActivePreset(null);
    } catch (err) {
      console.error('Error logging maintenance:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#0B1226] border-2 border-[#FB923C]/40 rounded-[28px] p-4 sm:p-5 text-[#F4F8FF] shadow-[0_20px_60px_rgba(0,0,0,0.98)] space-y-4 max-h-[92vh] overflow-y-auto [&::-webkit-scrollbar]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#FB923C]/20 text-[#FB923C] border border-[#FB923C]/40">
              <Wrench className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Maintenance & Services</h3>
              <p className="text-[10px] text-slate-400">Track appliance AMCs, vehicle services & warranties</p>
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

        {/* 1. Quick Preset Maintenance Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {QUICK_MAINTENANCE_PRESETS.map((preset) => {
            const isSelected = activePreset === preset.label;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-[#FB923C] text-[#0B1226] border-white shadow-md shadow-[#FB923C]/40 scale-105 font-bold'
                    : 'bg-[#0D152D] hover:bg-[#131F3F] text-slate-300 border-slate-700/60'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmitForm} className="space-y-4">
          {/* 2. Service Cost Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Service Cost / Fee (Optional)</label>
            <div className="flex items-center bg-[#050811] border-2 border-slate-700/80 focus-within:border-[#FB923C] rounded-2xl px-4 py-3 shadow-inner transition-colors">
              <span className="text-xl sm:text-2xl font-black text-[#55D98A] mr-2">₹</span>
              <input
                type="number"
                placeholder="2500"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full bg-transparent text-xl sm:text-2xl font-black text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          {/* 3. Category Grid */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Category: <span className="text-[#FB923C] font-bold">{selectedCatName}</span>
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
                  placeholder="New maintenance type (e.g. Solar Panel)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-[#050811] border border-slate-700/80 rounded-lg text-xs text-white outline-none focus:border-[#FB923C]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomCategory}
                  className="px-3 py-1.5 bg-[#FB923C] text-[#0B1226] font-bold text-xs rounded-lg hover:opacity-95"
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
                        ? 'bg-[rgba(251,146,60,0.22)] border-[#FB923C] shadow-[0_0_14px_rgba(251,146,60,0.35)] scale-[1.03] ring-1 ring-[#FB923C]'
                        : 'bg-[#0D152D] hover:bg-[#131F3F] border-slate-800 opacity-85 hover:opacity-100'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center mb-1 transition-all"
                      style={{
                        backgroundColor: isSelected ? 'rgba(251, 146, 60, 0.28)' : cat.bgColor,
                        color: isSelected ? '#FB923C' : cat.color,
                        border: `1px solid ${isSelected ? '#FB923C' : cat.borderColor}`,
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
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl border border-dashed border-slate-700 bg-[#0D152D]/60 hover:bg-[#0D152D] text-[#FB923C] transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-[#FB923C]/15 border border-[#FB923C]/30 flex items-center justify-center mb-1 text-[#FB923C]">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[10.5px] font-bold text-center leading-tight text-slate-300">
                  Custom
                </span>
              </button>
            </div>
          </div>

          {/* 4. Appliance / Item Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Item / Appliance Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Honda City Car Periodic Service"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#050811] border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-[#FB923C]"
            />
          </div>

          {/* 5. Service Provider & Contact Phone */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Service Center / Mechanic</label>
              <input
                type="text"
                placeholder="e.g. Maruti Care Center"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#050811] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-[#FB923C]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Provider Phone (Optional)</label>
              <div className="flex items-center bg-[#050811] border border-slate-700/80 rounded-xl px-3 py-2 text-white">
                <Phone className="w-3.5 h-3.5 text-[#FB923C] mr-2 shrink-0" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-transparent text-xs text-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* 6. Next Due Date */}
          <div className="space-y-1">
            <CustomDatePicker
              label="Next Due Date (Optional)"
              value={nextDue}
              onChange={(newDate) => setNextDue(newDate)}
              className="!bg-[#050811] !border-slate-700/80 text-xs text-white"
            />
          </div>

          {/* 7. Submit CTA */}
          <button
            type="submit"
            disabled={isSubmitting || !itemName.trim()}
            className="w-full py-3.5 bg-gradient-to-r from-[#FF8A24] via-[#FB923C] to-[#FFD21F] hover:opacity-95 disabled:opacity-50 text-[#0B1226] font-black text-sm rounded-2xl shadow-[0_8px_25px_rgba(251,146,60,0.35)] flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer mt-2"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>Log Maintenance Record</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddMaintenanceModal;
