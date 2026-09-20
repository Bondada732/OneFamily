import React, { useState } from 'react';
import {
  X,
  Check,
  Gift,
  Smartphone,
  ShoppingBag,
  BookOpen,
  Home,
  Car,
  Plane,
  Tag,
  Plus,
  CheckCircle2,
  Trash2,
  Sparkles,
  Watch,
  Tv,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.js';

export interface AddWishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (wishData: {
    item_name: string;
    category: string;
    estimated_cost: number;
    notes?: string;
  }) => Promise<void> | void;
  wishlistItems: any[];
  onToggleWish: (id: string) => void;
  onDeleteWish: (id: string) => void;
}

interface WishCategoryItem {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

const WISH_CATEGORIES: WishCategoryItem[] = [
  { id: 'WISH', name: 'Gift & Wish', icon: Gift, color: '#FF8A24', bgColor: 'rgba(255, 138, 36, 0.16)', borderColor: 'rgba(255, 138, 36, 0.40)' },
  { id: 'GADGET', name: 'Gadget & Tech', icon: Smartphone, color: '#168BFF', bgColor: 'rgba(22, 139, 255, 0.16)', borderColor: 'rgba(22, 139, 255, 0.40)' },
  { id: 'SHOPPING', name: 'Clothes & Style', icon: ShoppingBag, color: '#FF4D6D', bgColor: 'rgba(255, 77, 109, 0.16)', borderColor: 'rgba(255, 77, 109, 0.40)' },
  { id: 'BOOK', name: 'Study & Books', icon: BookOpen, color: '#16C7F2', bgColor: 'rgba(22, 199, 242, 0.16)', borderColor: 'rgba(22, 199, 242, 0.40)' },
  { id: 'HOME', name: 'Home & Living', icon: Home, color: '#FFB91F', bgColor: 'rgba(255, 185, 31, 0.16)', borderColor: 'rgba(255, 185, 31, 0.40)' },
  { id: 'VEHICLE', name: 'Vehicle & Bike', icon: Car, color: '#19C9A7', bgColor: 'rgba(255, 201, 167, 0.16)', borderColor: 'rgba(25, 201, 167, 0.40)' },
  { id: 'TRAVEL', name: 'Trip & Vacation', icon: Plane, color: '#55D98A', bgColor: 'rgba(85, 217, 138, 0.16)', borderColor: 'rgba(85, 217, 138, 0.40)' },
  { id: 'APPLIANCE', name: 'TV & Appliance', icon: Tv, color: '#FFD21F', bgColor: 'rgba(255, 210, 31, 0.16)', borderColor: 'rgba(255, 210, 31, 0.40)' },
];

const QUICK_WISH_TAGS = [
  { label: 'Sony Headphones', category: 'GADGET', cost: 14999 },
  { label: 'iPhone 16', category: 'GADGET', cost: 79900 },
  { label: 'Sneakers', category: 'SHOPPING', cost: 4500 },
  { label: 'Smart TV', category: 'APPLIANCE', cost: 38000 },
  { label: 'Goa Vacation', category: 'TRAVEL', cost: 45000 },
  { label: 'Smartwatch', category: 'GADGET', cost: 8999 },
  { label: 'Study Table', category: 'HOME', cost: 6500 },
  { label: 'Electric Bicycle', category: 'VEHICLE', cost: 28000 },
  { label: 'Kindle Reader', category: 'BOOK', cost: 9999 },
];

export const AddWishModal: React.FC<AddWishModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  wishlistItems,
  onToggleWish,
  onDeleteWish,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [title, setTitle] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('WISH');
  const [selectedCatName, setSelectedCatName] = useState('Gift & Wish');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');
  const [categoriesList, setCategoriesList] = useState<WishCategoryItem[]>(WISH_CATEGORIES);

  // Dynamically load custom categories from existing wishlistItems and localStorage
  React.useEffect(() => {
    const customCatsMap = new Map<string, WishCategoryItem>();

    // Load from saved custom categories in localStorage
    try {
      const savedCustoms: string[] = JSON.parse(localStorage.getItem('onefamily_custom_wish_categories') || '[]');
      savedCustoms.forEach((name) => {
        if (!WISH_CATEGORIES.some((c) => c.id.toUpperCase() === name.toUpperCase() || c.name.toLowerCase() === name.toLowerCase())) {
          customCatsMap.set(name.toLowerCase(), {
            id: name,
            name: name,
            icon: Tag,
            color: isLight ? '#B84A1E' : '#19C9A7',
            bgColor: isLight ? 'rgba(184, 74, 30, 0.16)' : 'rgba(25, 201, 167, 0.16)',
            borderColor: isLight ? 'rgba(184, 74, 30, 0.50)' : 'rgba(25, 201, 167, 0.50)',
          });
        }
      });
    } catch {}

    // Also scan existing items for dynamic category recovery
    if (Array.isArray(wishlistItems)) {
      wishlistItems.forEach((w) => {
        const cat = w.category || '';
        if (cat && !WISH_CATEGORIES.some((c) => c.id.toUpperCase() === cat.toUpperCase() || c.name.toLowerCase() === cat.toLowerCase())) {
          const displayName = cat.startsWith('CAT_') ? 'Custom Wish' : cat;
          customCatsMap.set(cat.toLowerCase(), {
            id: cat,
            name: displayName,
            icon: Tag,
            color: isLight ? '#B84A1E' : '#19C9A7',
            bgColor: isLight ? 'rgba(184, 74, 30, 0.16)' : 'rgba(25, 201, 167, 0.16)',
            borderColor: isLight ? 'rgba(184, 74, 30, 0.50)' : 'rgba(25, 201, 167, 0.50)',
          });
        }
      });
    }
    setCategoriesList([...WISH_CATEGORIES, ...Array.from(customCatsMap.values())]);
  }, [wishlistItems, isLight]);

  if (!isOpen) return null;

  const handleSelectTag = (tag: typeof QUICK_WISH_TAGS[0]) => {
    setActiveTag(tag.label);
    setTitle(tag.label);
    if (tag.cost) setEstimatedCost(String(tag.cost));
    const cat = categoriesList.find((c) => c.id === tag.category);
    if (cat) {
      setSelectedCategory(cat.id);
      setSelectedCatName(cat.name);
    }
  };

  const handleSelectCategory = (cat: WishCategoryItem) => {
    setSelectedCategory(cat.id);
    setSelectedCatName(cat.name);
  };

  const handleAddCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = customName.trim();
    if (!cleanName) return;

    const existing = categoriesList.find(
      (c) => c.name.toLowerCase() === cleanName.toLowerCase() || c.id.toLowerCase() === cleanName.toLowerCase()
    );

    if (existing) {
      setSelectedCategory(existing.id);
      setSelectedCatName(existing.name);
    } else {
      const newCat: WishCategoryItem = {
        id: cleanName,
        name: cleanName,
        icon: Tag,
        color: isLight ? '#B84A1E' : '#19C9A7',
        bgColor: isLight ? 'rgba(184, 74, 30, 0.16)' : 'rgba(25, 201, 167, 0.16)',
        borderColor: isLight ? 'rgba(184, 74, 30, 0.50)' : 'rgba(25, 201, 167, 0.50)',
      };
      setCategoriesList((prev) => [...prev, newCat]);
      setSelectedCategory(newCat.id);
      setSelectedCatName(newCat.name);

      // Save custom category to localStorage so it is remembered
      try {
        const saved = JSON.parse(localStorage.getItem('onefamily_custom_wish_categories') || '[]');
        if (!saved.includes(cleanName)) {
          localStorage.setItem('onefamily_custom_wish_categories', JSON.stringify([...saved, cleanName]));
        }
      } catch {}
    }

    setCustomName('');
    setShowCustomInput(false);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const categoryToSave = selectedCategory.startsWith('CAT_') && selectedCatName 
        ? selectedCatName 
        : (selectedCategory || 'WISH');

      await onSubmit({
        item_name: title.trim(),
        category: categoryToSave,
        estimated_cost: Number(estimatedCost) || 0,
      });
      setTitle('');
      setEstimatedCost('');
      setActiveTag(null);
      onClose();
    } catch (err) {
      console.error('Error submitting wish:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 ${isLight ? 'bg-black/50' : 'bg-black/80'} backdrop-blur-md animate-fade-in`}>
      <div className={`w-full max-w-md rounded-[28px] p-4 sm:p-5 space-y-4 max-h-[92vh] overflow-y-auto [&::-webkit-scrollbar]:hidden ${
        isLight
          ? 'bg-[#EFE4D6] border-2 border-[#DECFC0] text-[#2A1B14] shadow-[0_20px_60px_rgba(140,95,60,0.22)]'
          : 'bg-[#0B1226] border-2 border-[#16C7F2]/40 text-[#F4F8FF] shadow-[0_20px_60px_rgba(0,0,0,0.95)]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl border ${
              isLight
                ? 'bg-[#F7D4BC] text-[#B84A1E] border-[#E8BC9E]'
                : 'bg-[#16C7F2]/20 text-[#16C7F2] border-[#16C7F2]/40'
            }`}>
              <Gift className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className={`text-lg font-bold tracking-tight ${isLight ? 'text-[#2A1B14]' : 'text-white'}`}>Family Wish List</h3>
              <p className={`text-[10px] ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>Shared with all family members</p>
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

        {/* 1. Quick Preset Wish Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {QUICK_WISH_TAGS.map((tag) => {
            const isSelected = activeTag === tag.label;
            return (
              <button
                key={tag.label}
                type="button"
                onClick={() => handleSelectTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? isLight
                      ? 'bg-gradient-to-r from-[#D96632] to-[#B84A1E] text-white border-[#B84A1E] shadow-md shadow-[#B84A1E]/30 scale-105 font-bold'
                      : 'bg-[#16C7F2] text-[#03194A] border-white shadow-md shadow-[#16C7F2]/40 scale-105 font-bold'
                    : isLight
                    ? 'bg-[#EBE0D2] hover:bg-[#DECFC0] text-[#634B3F] border-[#DECFC0]'
                    : 'bg-[#073B9E]/40 hover:bg-[#073B9E]/80 text-[#B9D8FF] border-[#168BFF]/25'
                }`}
              >
                {tag.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmitForm} className="space-y-4">
          {/* 2. Amount / Est. Cost Input Box */}
          <div className="space-y-1">
            <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-[#B9D8FF]'}`}>Estimated Cost (Optional)</label>
            <div className={`flex items-center rounded-2xl px-4 py-3 shadow-inner transition-colors border-2 ${
              isLight
                ? 'bg-[#EBE0D2] border-[#DECFC0] focus-within:border-[#C25425]'
                : 'bg-[#03194A] border-[#168BFF]/40 focus-within:border-[#16C7F2]'
            }`}>
              <span className={`text-xl sm:text-2xl font-black mr-2 ${isLight ? 'text-[#2E7D32]' : 'text-[#55D98A]'}`}>₹</span>
              <input
                type="number"
                placeholder="15000"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                className={`w-full bg-transparent text-xl sm:text-2xl font-black outline-none ${
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
              <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-[#B9D8FF]'}`}>
                Category: <span className={`font-bold ${isLight ? 'text-[#B84A1E]' : 'text-[#16C7F2]'}`}>{selectedCatName}</span>
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
                  placeholder="New wish category (e.g. Gaming, Jewelry)"
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
                  className={`px-3 py-1.5 font-bold text-xs rounded-lg hover:opacity-95 ${
                    isLight ? 'bg-[#B84A1E] text-white' : 'bg-[#19C9A7] text-[#03194A]'
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
                          : 'bg-[rgba(22,199,242,0.22)] border-[#16C7F2] shadow-[0_0_14px_rgba(22,199,242,0.35)] scale-[1.03] ring-1 ring-[#16C7F2]'
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
                          ? 'rgba(22, 199, 242, 0.28)'
                          : cat.bgColor,
                        color: isLight
                          ? isSelected
                            ? '#FFFFFF'
                            : '#634B3F'
                          : isSelected
                          ? '#16C7F2'
                          : cat.color,
                        border: `1px solid ${
                          isLight
                            ? isSelected
                              ? '#B84A1E'
                              : '#DECFC0'
                            : isSelected
                            ? '#16C7F2'
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
                    : 'bg-[#16C7F2]/15 border-[#16C7F2]/30 text-[#16C7F2]'
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

          {/* 4. "What" / Wish Item Description */}
          <div className="space-y-1">
            <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-[#B9D8FF]'}`}>Wish Item Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Sony Wireless Headphones, Goa Vacation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm outline-none border ${
                isLight
                  ? 'bg-[#EBE0D2] border-[#DECFC0] text-[#2A1B14] placeholder-[#947D70] focus:border-[#C25425]'
                  : 'bg-[#03194A] border-[#168BFF]/35 text-white placeholder-slate-500 focus:border-[#16C7F2]'
              }`}
            />
          </div>

          {/* 5. Submit CTA Button */}
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className={`w-full py-3.5 hover:opacity-95 disabled:opacity-50 font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer ${
              isLight
                ? 'bg-gradient-to-r from-[#D96632] via-[#C85928] to-[#B84A1E] text-white shadow-[0_8px_25px_rgba(184,74,30,0.35)]'
                : 'bg-gradient-to-r from-[#168BFF] via-[#16C7F2] to-[#19C9A7] text-[#03194A] shadow-[0_8px_25px_rgba(22,199,242,0.35)]'
            }`}
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>Add to Family Wish List</span>
          </button>
        </form>

        {/* Existing Wish List Items Container */}
        <div className={`space-y-2 pt-2 border-t ${isLight ? 'border-[#DECFC0]' : 'border-[#168BFF]/20'}`}>
          <div className={`flex items-center justify-between text-xs font-bold ${isLight ? 'text-[#2A1B14]' : 'text-[#B9D8FF]'}`}>
            <span>Shared Family Wishes ({wishlistItems.length})</span>
            <span className={`text-[10px] font-normal ${isLight ? 'text-[#634B3F]' : 'text-[#91A8C7]'}`}>Tap check to mark fulfilled</span>
          </div>

          {wishlistItems.length === 0 ? (
            <div className={`p-4 text-center text-xs ${isLight ? 'text-[#634B3F]' : 'text-[#91A8C7]'}`}>No wishes added yet. Make a wish above! ✨</div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {wishlistItems.map((wish) => (
                <div
                  key={wish.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                    wish.is_purchased
                      ? isLight
                        ? 'bg-[#E4D7C7]/60 border-[#DECFC0] opacity-60'
                        : 'bg-[#03194A]/60 border-[#168BFF]/15 opacity-60'
                      : isLight
                      ? 'bg-[#EBE0D2] border-[#DECFC0] shadow-sm'
                      : 'bg-[#073B9E]/50 border-[#168BFF]/35 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                    <button
                      type="button"
                      onClick={() => onToggleWish(wish.id)}
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                        wish.is_purchased
                          ? 'bg-[#2E7D32] border-[#2E7D32] text-white'
                          : isLight
                          ? 'border-[#DECFC0] hover:border-[#C25425]'
                          : 'border-[#168BFF]/60 hover:border-[#16C7F2]'
                      }`}
                    >
                      {wish.is_purchased && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                    <div className="min-w-0">
                      <div className={`text-xs font-bold truncate ${
                        wish.is_purchased
                          ? isLight ? 'line-through text-[#947D70]' : 'line-through text-[#91A8C7]'
                          : isLight ? 'text-[#2A1B14]' : 'text-white'
                      }`}>
                        {wish.item_name}
                      </div>
                      <div className={`text-[10px] truncate mt-0.5 ${isLight ? 'text-[#634B3F]' : 'text-[#B9D8FF]'}`}>
                        Added by <span className={`font-semibold ${isLight ? 'text-[#B84A1E]' : 'text-[#FFD21F]'}`}>{wish.added_by_name || 'Family'}</span>
                        {wish.estimated_cost ? (
                          <span className={`font-bold ml-1.5 ${isLight ? 'text-[#2E7D32]' : 'text-[#55D98A]'}`}>• ₹{Number(wish.estimated_cost).toLocaleString('en-IN')}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold border ${
                      isLight
                        ? 'bg-[#F4EDE4] text-[#2A1B14] border-[#DECFC0]'
                        : 'bg-[#03194A] text-[#7EDCFF] border-[#168BFF]/30'
                    }`}>
                      {categoriesList.find((c) => c.id.toUpperCase() === (wish.category || '').toUpperCase() || c.name.toLowerCase() === (wish.category || '').toLowerCase())?.name || (wish.category && wish.category.startsWith('CAT_') ? 'Custom' : (wish.category || 'WISH'))}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteWish(wish.id)}
                      className={`p-1.5 transition-colors ${
                        isLight
                          ? 'text-[#947D70] hover:text-[#C62828]'
                          : 'text-[#91A8C7] hover:text-[#FF4D6D]'
                      }`}
                      title="Delete wish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddWishModal;
