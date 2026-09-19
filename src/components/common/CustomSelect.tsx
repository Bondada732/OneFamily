import React, { useState } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';

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
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1">
          {LabelIcon && <LabelIcon className="w-3.5 h-3.5 text-[#16C7F2] shrink-0" />}
          <span>{label} {required && <span className="text-red-400">*</span>}</span>
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-[#16C7F2]/60 focus:border-[#16C7F2] text-white text-xs font-medium transition-all text-left shadow-sm active:scale-[0.99] ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedOption?.icon && (
            typeof selectedOption.icon === 'string' ? (
              <span className="text-sm shrink-0">{selectedOption.icon}</span>
            ) : (
              <selectedOption.icon className="w-4 h-4 text-[#16C7F2] shrink-0" />
            )
          )}
          <span className={`truncate ${selectedOption ? 'text-white font-bold' : 'text-slate-400 font-normal'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-md bg-[#16C7F2]/20 text-[#16C7F2] border border-[#16C7F2]/30 shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
      </button>

      {/* Modal / Bottom Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 pt-6 pb-[max(env(safe-area-inset-bottom,0px),24px)] bg-slate-950/85 backdrop-blur-md animate-fadeIn select-none">
          <div
            className="w-full max-w-sm rounded-3xl bg-[#0D152D] border border-slate-700/90 shadow-2xl p-4 text-slate-100 space-y-3 max-h-[80vh] flex flex-col animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-extrabold text-white">{modalTitle}</h3>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setSearchQuery('');
                }}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search if more than 5 options */}
            {normalizedOptions.length > 5 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 focus:border-[#16C7F2] text-white text-xs focus:outline-none placeholder-slate-500"
                />
              </div>
            )}

            {/* Options List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {filteredOptions.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No matching options found.
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  const Icon = opt.icon;

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#16C7F2]/15 border-[#16C7F2] text-white shadow-sm'
                          : 'bg-slate-850/60 border-slate-800 hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {Icon && (
                          typeof Icon === 'string' ? (
                            <span className="text-base shrink-0">{Icon}</span>
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 text-[#16C7F2]">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                          )
                        )}
                        <div className="min-w-0">
                          <div className={`text-xs ${isSelected ? 'font-bold text-white' : 'font-medium text-slate-200'} truncate`}>
                            {opt.label}
                          </div>
                          {opt.description && (
                            <div className="text-[10px] text-slate-400 truncate">
                              {opt.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {opt.badge && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                            {opt.badge}
                          </span>
                        )}
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#16C7F2] text-slate-950 flex items-center justify-center font-bold">
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
        </div>
      )}
    </div>
  );
};
