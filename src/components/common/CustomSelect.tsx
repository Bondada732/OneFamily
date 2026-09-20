import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, X, Search } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.js';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ElementType | string;
  description?: string;
  badge?: string;
  color?: string;
}

export interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[] | string[];
  label?: string;
  labelIcon?: React.ElementType;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  title?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  label,
  labelIcon: LabelIcon,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  required = false,
  title,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Normalize options to SelectOption[]
  const normalizedOptions: SelectOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find((o) => o.value === value);

  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (opt.description && opt.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  const modalTitle = title || label || 'Select Option';

  return (
    <div className="relative w-full">
      {label && (
        <label className={`flex items-center gap-1.5 text-xs font-semibold mb-1 ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>
          {LabelIcon && <LabelIcon className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-[#B84A1E]' : 'text-[#16C7F2]'}`} />}
          <span>{label} {required && <span className="text-red-500">*</span>}</span>
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left shadow-sm active:scale-[0.99] ${
          isLight
            ? 'bg-[#EBE0D2] border border-[#DECFC0] hover:border-[#C25425] text-[#2A1B14]'
            : 'bg-slate-800 border border-slate-700 hover:border-[#16C7F2]/60 focus:border-[#16C7F2] text-white'
        } ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedOption?.icon && (
            typeof selectedOption.icon === 'string' ? (
              <span className="text-sm shrink-0">{selectedOption.icon}</span>
            ) : (
              <selectedOption.icon className={`w-4 h-4 shrink-0 ${isLight ? 'text-[#B84A1E]' : 'text-[#16C7F2]'}`} />
            )
          )}
          <span className={`truncate ${
            selectedOption
              ? isLight ? 'text-[#2A1B14] font-bold' : 'text-white font-bold'
              : isLight ? 'text-[#947D70] font-normal' : 'text-slate-400 font-normal'
          }`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded-md shrink-0 border ${
              isLight
                ? 'bg-[#F7D4BC] text-[#B84A1E] border-[#E8BC9E]'
                : 'bg-[#16C7F2]/20 text-[#16C7F2] border-[#16C7F2]/30'
            }`}>
              {selectedOption.badge}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 shrink-0 ml-2 ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`} />
      </button>

      {/* Modal / Bottom Sheet */}
      {isOpen && createPortal(
        <div className={`fixed inset-0 z-[99999] flex items-center justify-center p-3 pt-6 pb-[max(env(safe-area-inset-bottom,0px),24px)] ${
          isLight ? 'bg-black/50' : 'bg-slate-950/85'
        } backdrop-blur-md animate-fadeIn select-none`}>
          <div
            className={`w-full max-w-sm rounded-3xl border shadow-2xl p-4 space-y-3 max-h-[80vh] flex flex-col animate-scaleUp ${
              isLight
                ? 'bg-[#EFE4D6] border-[#DECFC0] text-[#2A1B14] shadow-[0_20px_50px_rgba(140,95,60,0.22)]'
                : 'bg-[#0D152D] border-slate-700/90 text-slate-100'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between pb-2 border-b ${isLight ? 'border-[#DECFC0]' : 'border-slate-800'}`}>
              <h3 className={`text-sm font-extrabold ${isLight ? 'text-[#2A1B14]' : 'text-white'}`}>{modalTitle}</h3>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setSearchQuery('');
                }}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-[#EBE0D2] hover:bg-[#DECFC0] text-[#634B3F] hover:text-[#2A1B14]'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search if more than 5 options */}
            {normalizedOptions.length > 5 && (
              <div className="relative">
                <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-[#947D70]' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs outline-none border ${
                    isLight
                      ? 'bg-[#EBE0D2] border-[#DECFC0] text-[#2A1B14] placeholder-[#947D70] focus:border-[#C25425]'
                      : 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-[#16C7F2]'
                  }`}
                  autoFocus
                />
              </div>
            )}

            {/* Options List */}
            <div className="overflow-y-auto space-y-1.5 max-h-[55vh] pr-1 custom-scrollbar">
              {filteredOptions.length === 0 ? (
                <div className={`text-center py-6 text-xs ${isLight ? 'text-[#947D70]' : 'text-slate-400'}`}>No options found</div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  const Icon = opt.icon;

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all text-left cursor-pointer active:scale-[0.99] ${
                        isSelected
                          ? isLight
                            ? 'bg-[#F7D4BC] border-[#E8BC9E] text-[#2A1B14] shadow-sm font-bold'
                            : 'bg-[#168BFF]/20 border-[#16C7F2] text-white shadow-md shadow-[#168BFF]/10'
                          : isLight
                          ? 'bg-[#EBE0D2] border-[#DECFC0] hover:bg-[#DECFC0] text-[#2A1B14]'
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {Icon && (
                          typeof Icon === 'string' ? (
                            <span className="text-base shrink-0">{Icon}</span>
                          ) : (
                            <Icon className={`w-4 h-4 shrink-0 ${
                              isSelected
                                ? isLight ? 'text-[#B84A1E]' : 'text-[#16C7F2]'
                                : isLight ? 'text-[#634B3F]' : 'text-slate-400'
                            }`} />
                          )
                        )}
                        <div className="min-w-0">
                          <div className={`text-xs truncate ${
                            isSelected
                              ? isLight ? 'text-[#2A1B14] font-black' : 'text-white font-bold'
                              : isLight ? 'text-[#2A1B14] font-medium' : 'text-slate-200'
                          }`}>
                            {opt.label}
                          </div>
                          {opt.description && (
                            <div className={`text-[10px] truncate ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>{opt.description}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {opt.badge && (
                          <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md border ${
                            isLight
                              ? 'bg-[#DECFC0] text-[#2A1B14] border-[#DECFC0]'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {opt.badge}
                          </span>
                        )}
                        {isSelected && (
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold ${
                            isLight
                              ? 'bg-[#B84A1E] text-white'
                              : 'bg-[#16C7F2] text-slate-950'
                          }`}>
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
