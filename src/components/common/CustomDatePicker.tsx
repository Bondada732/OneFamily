import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X, Check, RotateCcw } from 'lucide-react';
import { getLocalDateString } from '../../utils/formatters.js';

export interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  label?: string;
  labelIcon?: React.ElementType;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  minDate?: string;
  maxDate?: string;
  showQuickButtons?: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  label,
  labelIcon: LabelIcon,
  placeholder = 'Select date',
  required = false,
  disabled = false,
  className = '',
  minDate,
  maxDate,
  showQuickButtons = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Parse initial date or default to today
  const todayStr = getLocalDateString();
  const activeDate = value || todayStr;
  const [year, month, day] = activeDate.split('-').map(Number);

  const [viewYear, setViewYear] = useState<number>(year || new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(month ? month - 1 : new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(value || todayStr);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

  // Sync state when value changes
  useEffect(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number);
      if (y && m) {
        setViewYear(y);
        setViewMonth(m - 1);
        setSelectedDate(value);
      }
    }
  }, [value]);

  const handleOpen = () => {
    if (disabled) return;
    if (value) {
      const [y, m] = value.split('-').map(Number);
      if (y && m) {
        setViewYear(y);
        setViewMonth(m - 1);
        setSelectedDate(value);
      }
    } else {
      const now = new Date();
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
      setSelectedDate(todayStr);
    }
    setIsYearPickerOpen(false);
    setIsOpen(true);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (d: number) => {
    const formatted = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    setSelectedDate(formatted);
    onChange(formatted);
    setIsOpen(false);
  };

  const handleQuickSelect = (daysOffset: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysOffset);
    const formatted = getLocalDateString(target);
    setSelectedDate(formatted);
    const [y, m] = formatted.split('-').map(Number);
    setViewYear(y);
    setViewMonth(m - 1);
    onChange(formatted);
    setIsOpen(false);
  };

  // Generate calendar grid
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  // Format display label
  const formatDisplay = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      if (!y || !m || !d) return dateStr;
      const isToday = dateStr === todayStr;
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = dateStr === getLocalDateString(yesterday);

      const dayText = `${d} ${SHORT_MONTH_NAMES[m - 1]} ${y}`;
      if (isToday) return `Today, ${dayText}`;
      if (isYesterday) return `Yesterday, ${dayText}`;
      return dayText;
    } catch {
      return dateStr;
    }
  };

  // Generate year list (from currentYear - 60 to currentYear + 20)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - 60 + i);

  return (
    <div className="relative w-full">
      {label && (
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1">
          {LabelIcon && <LabelIcon className="w-3.5 h-3.5 text-[#16C7F2] shrink-0" />}
          <span>{label} {required && <span className="text-red-400">*</span>}</span>
        </label>
      )}

      {/* Trigger Button that replaces native input */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-[#16C7F2]/60 focus:border-[#16C7F2] text-white font-medium text-xs transition-all text-left shadow-sm active:scale-[0.99] ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Calendar className="w-4 h-4 text-[#16C7F2] shrink-0" />
          <span className={`truncate ${value ? 'text-white font-bold' : 'text-slate-400 font-normal'}`}>
            {value ? formatDisplay(value) : placeholder}
          </span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-700/80 text-slate-300 shrink-0 ml-2">
          {value === todayStr ? 'Today' : 'Pick'}
        </span>
      </button>

      {/* Modal / Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 pt-6 pb-[max(env(safe-area-inset-bottom,0px),24px)] bg-slate-950/80 backdrop-blur-md animate-fadeIn select-none">
          <div
            className="w-full max-w-sm rounded-3xl bg-[#0D152D] border border-slate-700/90 shadow-2xl p-4 text-slate-100 space-y-3 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#16C7F2]/20 border border-[#16C7F2]/40 flex items-center justify-center text-[#16C7F2]">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Select Date</h3>
                  <p className="text-[10px] text-[#16C7F2] font-semibold">
                    {formatDisplay(selectedDate) || 'Pick a date'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Shortcuts */}
            {showQuickButtons && (
              <div className="flex items-center gap-1.5 py-1 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => handleQuickSelect(0)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                    selectedDate === todayStr
                      ? 'bg-gradient-to-r from-[#168BFF] to-[#16C7F2] text-slate-950 shadow-sm'
                      : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect(-1)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800/90 hover:bg-slate-700 text-slate-300 transition-all shrink-0 cursor-pointer"
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect(-2)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800/90 hover:bg-slate-700 text-slate-300 transition-all shrink-0 cursor-pointer"
                >
                  2 Days Ago
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect(1)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800/90 hover:bg-slate-700 text-slate-300 transition-all shrink-0 cursor-pointer"
                >
                  Tomorrow
                </button>
              </div>
            )}

            {/* Month & Year Navigation */}
            <div className="flex items-center justify-between px-1 py-1 bg-slate-900/80 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">
                  {MONTH_NAMES[viewMonth]}
                </span>
                
                {/* Year Dropdown / Picker Toggle */}
                <button
                  type="button"
                  onClick={() => setIsYearPickerOpen(!isYearPickerOpen)}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-black text-[#16C7F2] border border-[#16C7F2]/30 cursor-pointer transition-all"
                >
                  {viewYear} ▾
                </button>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Year Picker Grid (Collapsible) */}
            {isYearPickerOpen ? (
              <div className="h-56 overflow-y-auto grid grid-cols-4 gap-1.5 p-2 bg-slate-900 rounded-2xl border border-slate-800">
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setViewYear(y);
                      setIsYearPickerOpen(false);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      y === viewYear
                        ? 'bg-[#16C7F2] text-slate-950 font-black shadow-md'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            ) : (
              /* Calendar Grid */
              <div className="space-y-1">
                {/* Day Names Header */}
                <div className="grid grid-cols-7 text-center">
                  {DAY_NAMES.map((dn, idx) => (
                    <div
                      key={dn}
                      className={`text-[10px] font-bold py-1 ${
                        idx === 0 || idx === 6 ? 'text-red-400' : 'text-slate-400'
                      }`}
                    >
                      {dn}
                    </div>
                  ))}
                </div>

                {/* Days Cells */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {/* Previous month filler days */}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => {
                    const prevD = daysInPrevMonth - firstDayOfWeek + i + 1;
                    return (
                      <div
                        key={`prev-${i}`}
                        className="py-2 text-[11px] text-slate-600 font-medium select-none"
                      >
                        {prevD}
                      </div>
                    );
                  })}

                  {/* Current month days */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const d = i + 1;
                    const dateFormatted = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const isSelected = selectedDate === dateFormatted;
                    const isToday = dateFormatted === todayStr;

                    return (
                      <button
                        key={`day-${d}`}
                        type="button"
                        onClick={() => handleSelectDay(d)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                          isSelected
                            ? 'bg-gradient-to-br from-[#168BFF] to-[#16C7F2] text-slate-950 font-black shadow-md shadow-[#16C7F2]/30 scale-105'
                            : isToday
                            ? 'bg-slate-800 border border-[#16C7F2] text-[#16C7F2] hover:bg-slate-700'
                            : 'bg-slate-800/40 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        <span>{d}</span>
                        {isToday && !isSelected && (
                          <span className="w-1 h-1 rounded-full bg-[#16C7F2] absolute bottom-1"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(todayStr);
                  onChange(todayStr);
                  setIsOpen(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3 h-3 text-[#16C7F2]" />
                <span>Today</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange(selectedDate);
                    setIsOpen(false);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#168BFF] to-[#16C7F2] text-slate-950 font-black text-xs shadow-md cursor-pointer transition-all flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Done</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
