import React, { useState } from 'react';
import {
  X,
  Check,
  CheckSquare,
  ShoppingCart,
  Zap,
  Users,
  HeartPulse,
  GraduationCap,
  Car,
  Wrench,
  ListTodo,
  Plus,
  Flame,
  Sprout,
  Calendar,
  Tag,
} from 'lucide-react';
import { CustomDatePicker } from './CustomDatePicker.js';

export interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: {
    title: string;
    category: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    assigned_to_name?: string;
    due_date?: string;
    notes?: string;
  }) => Promise<void> | void;
  familyMembers?: Array<{ id: string; name: string }>;
}

interface TaskCategoryItem {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

const TASK_CATEGORIES: TaskCategoryItem[] = [
  { id: 'GROCERY', name: 'Groceries', icon: ShoppingCart, color: '#55D98A', bgColor: 'rgba(85, 217, 138, 0.16)', borderColor: 'rgba(85, 217, 138, 0.40)' },
  { id: 'BILL', name: 'Utility Bills', icon: Zap, color: '#FFD21F', bgColor: 'rgba(255, 210, 31, 0.16)', borderColor: 'rgba(255, 210, 31, 0.40)' },
  { id: 'CHORE', name: 'Home & Chores', icon: Users, color: '#168BFF', bgColor: 'rgba(22, 139, 255, 0.16)', borderColor: 'rgba(22, 139, 255, 0.40)' },
  { id: 'HEALTH', name: 'Health & Doctor', icon: HeartPulse, color: '#FF4D6D', bgColor: 'rgba(255, 77, 109, 0.16)', borderColor: 'rgba(255, 77, 109, 0.40)' },
  { id: 'SCHOOL', name: 'Education', icon: GraduationCap, color: '#16C7F2', bgColor: 'rgba(22, 199, 242, 0.16)', borderColor: 'rgba(22, 199, 242, 0.40)' },
  { id: 'VEHICLE', name: 'Vehicle', icon: Car, color: '#FF8A24', bgColor: 'rgba(255, 138, 36, 0.16)', borderColor: 'rgba(255, 138, 36, 0.40)' },
  { id: 'MAINTENANCE', name: 'Maintenance', icon: Wrench, color: '#19C9A7', bgColor: 'rgba(25, 201, 167, 0.16)', borderColor: 'rgba(25, 201, 167, 0.40)' },
  { id: 'GENERAL', name: 'General To-Do', icon: ListTodo, color: '#FFB91F', bgColor: 'rgba(255, 185, 31, 0.16)', borderColor: 'rgba(255, 185, 31, 0.40)' },
];

const QUICK_TASK_PRESETS = [
  { label: 'Pay Electricity Bill', category: 'BILL', priority: 'HIGH' as const },
  { label: 'Buy Monthly Groceries', category: 'GROCERY', priority: 'MEDIUM' as const },
  { label: 'Doctor Checkup', category: 'HEALTH', priority: 'HIGH' as const },
  { label: 'Car Servicing', category: 'VEHICLE', priority: 'MEDIUM' as const },
  { label: 'School Fee Payment', category: 'SCHOOL', priority: 'HIGH' as const },
  { label: 'Water Purifier Filter', category: 'MAINTENANCE', priority: 'MEDIUM' as const },
  { label: 'Buy Milk & Eggs', category: 'GROCERY', priority: 'LOW' as const },
  { label: 'Clean AC Filter', category: 'CHORE', priority: 'LOW' as const },
];

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  familyMembers = [],
}) => {
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('GROCERY');
  const [selectedCatName, setSelectedCatName] = useState('Groceries');
  const [priority, setPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [assignedTo, setAssignedTo] = useState('All Family');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');
  const [categoriesList, setCategoriesList] = useState<TaskCategoryItem[]>(TASK_CATEGORIES);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof QUICK_TASK_PRESETS[0]) => {
    setActivePreset(preset.label);
    setTitle(preset.label);
    setPriority(preset.priority);
    const cat = categoriesList.find((c) => c.id === preset.category);
    if (cat) {
      setSelectedCategory(cat.id);
      setSelectedCatName(cat.name);
    }
  };

  const handleSelectCategory = (cat: TaskCategoryItem) => {
    setSelectedCategory(cat.id);
    setSelectedCatName(cat.name);
  };

  const handleAddCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const newCat: TaskCategoryItem = {
      id: `CAT_${Date.now()}`,
      name: customName.trim(),
      icon: Tag,
      color: '#38BDF8',
      bgColor: 'rgba(56, 189, 248, 0.16)',
      borderColor: 'rgba(56, 189, 248, 0.50)',
    };
    setCategoriesList((prev) => [...prev, newCat]);
    setSelectedCategory(newCat.id);
    setSelectedCatName(newCat.name);
    setCustomName('');
    setShowCustomInput(false);
  };

  const handleQuickDate = (mode: 'today' | 'tomorrow' | 'weekend') => {
    const d = new Date();
    if (mode === 'tomorrow') {
      d.setDate(d.getDate() + 1);
    } else if (mode === 'weekend') {
      const day = d.getDay();
      const diff = 6 - day;
      d.setDate(d.getDate() + (diff > 0 ? diff : 7));
    }
    setDueDate(d.toISOString().split('T')[0]);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        title: title.trim(),
        category: selectedCategory,
        priority,
        assigned_to_name: assignedTo,
        due_date: dueDate,
      });
      setTitle('');
      setActivePreset(null);
    } catch (err) {
      console.error('Error adding task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#0B1226] border-2 border-[#38BDF8]/40 rounded-[28px] p-4 sm:p-5 text-[#F4F8FF] shadow-[0_20px_60px_rgba(0,0,0,0.98)] space-y-4 max-h-[92vh] overflow-y-auto [&::-webkit-scrollbar]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40">
              <CheckSquare className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Add Family Task</h3>
              <p className="text-[10px] text-slate-400">Collaborative chores, bills & to-dos for everyone</p>
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

        {/* 1. Quick Preset Task Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {QUICK_TASK_PRESETS.map((preset) => {
            const isSelected = activePreset === preset.label;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-[#38BDF8] text-[#0B1226] border-white shadow-md shadow-[#38BDF8]/40 scale-105 font-bold'
                    : 'bg-[#0D152D] hover:bg-[#131F3F] text-slate-300 border-slate-700/60'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmitForm} className="space-y-4">
          {/* 2. Task Title Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Task Title / Chore Description *</label>
            <div className="flex items-center bg-[#050811] border-2 border-slate-700/80 focus-within:border-[#38BDF8] rounded-2xl px-4 py-3 shadow-inner transition-colors">
              <input
                type="text"
                required
                placeholder="e.g. Pay Torrent Power Bill / Grocery Shopping"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent text-sm sm:text-base font-bold text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          {/* 3. Category Grid */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Task Type: <span className="text-[#38BDF8] font-bold">{selectedCatName}</span>
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
                  placeholder="New task type (e.g. Pet Care)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-[#050811] border border-slate-700/80 rounded-lg text-xs text-white outline-none focus:border-[#38BDF8]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomCategory}
                  className="px-3 py-1.5 bg-[#38BDF8] text-[#0B1226] font-bold text-xs rounded-lg hover:opacity-95"
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
                        ? 'bg-[rgba(56,189,248,0.22)] border-[#38BDF8] shadow-[0_0_14px_rgba(56,189,248,0.35)] scale-[1.03] ring-1 ring-[#38BDF8]'
                        : 'bg-[#0D152D] hover:bg-[#131F3F] border-slate-800 opacity-85 hover:opacity-100'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center mb-1 transition-all"
                      style={{
                        backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.28)' : cat.bgColor,
                        color: isSelected ? '#38BDF8' : cat.color,
                        border: `1px solid ${isSelected ? '#38BDF8' : cat.borderColor}`,
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
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl border border-dashed border-slate-700 bg-[#0D152D]/60 hover:bg-[#0D152D] text-[#38BDF8] transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-[#38BDF8]/15 border border-[#38BDF8]/30 flex items-center justify-center mb-1 text-[#38BDF8]">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[10.5px] font-bold text-center leading-tight text-slate-300">
                  Custom
                </span>
              </button>
            </div>
          </div>

          {/* 4. Priority Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Priority Level</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'HIGH', label: 'High Priority', icon: Flame, color: '#FF4D6D', bg: 'rgba(255, 77, 109, 0.16)' },
                { id: 'MEDIUM', label: 'Medium', icon: Zap, color: '#FFD21F', bg: 'rgba(255, 210, 31, 0.16)' },
                { id: 'LOW', label: 'Flexible', icon: Sprout, color: '#55D98A', bg: 'rgba(85, 217, 138, 0.16)' },
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
                        : 'border-slate-700/60 text-slate-400 hover:text-white'
                    }`}
                    style={{
                      backgroundColor: isSelected ? p.bg : 'rgba(13, 21, 45, 0.6)',
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

          {/* 5. Assigned Member & Due Date */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Assign To</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 bg-[#050811] border border-slate-700/80 rounded-xl text-xs text-white outline-none focus:border-[#38BDF8]"
              >
                <option value="All Family">👨‍👩‍👧 All Family</option>
                {familyMembers.map((m) => (
                  <option key={m.id} value={m.name}>
                    👤 {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div className="space-y-1">
              <CustomDatePicker
                label="Due Date (Optional)"
                value={dueDate}
                onChange={(newDate) => setDueDate(newDate)}
                className="!bg-[#050811] !border-slate-700/80 text-xs text-white"
              />
            </div>
          </div>

          {/* 6. Submit CTA */}
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="w-full py-3.5 bg-gradient-to-r from-[#168BFF] via-[#38BDF8] to-[#10B981] hover:opacity-95 disabled:opacity-50 text-[#0B1226] font-black text-sm rounded-2xl shadow-[0_8px_25px_rgba(56,189,248,0.35)] flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer mt-2"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>Add Family Task</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;
