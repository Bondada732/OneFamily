import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, X, Check, RotateCcw } from 'lucide-react';
import { getLocalDateString } from '../../utils/formatters.js';
import { useTheme } from '../../context/ThemeContext.js';

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
  const { theme } = useTheme();
  const isLight = theme === 'light';

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
        <label className={`flex items-center gap-1.5 text-xs font-semibold mb-1 ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>
          {LabelIcon && <LabelIcon className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-[#B84A1E]' : 'text-[#16C7F2]'}`} />}
          <span>{label} {required && <span className="text-red-500">*</span>}</span>
        </label>
      )}

      {/* Trigger Button that replaces native input */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left shadow-sm active:scale-[0.99] ${
          isLight
            ? 'bg-[#EBE0D2] border border-[#DECFC0] hover:border-[#C25425] text-[#2A1B14]'
            : 'bg-slate-800/90 border border-slate-700 hover:border-[#16C7F2]/60 focus:border-[#16C7F2] text-white'
        } ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Calendar className={`w-4 h-4 shrink-0 ${isLight ? 'text-[#B84A1E]' : 'text-[#16C7F2]'}`} />
          <span className={`truncate ${
            value
              ? isLight ? 'text-[#2A1B14] font-bold' : 'text-white font-bold'
              : isLight ? 'text-[#947D70] font-normal' : 'text-slate-400 font-normal'
          }`}>
            {value ? formatDisplay(value) : placeholder}
          </span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ml-2 ${
          isLight
            ? 'bg-[#DECFC0] text-[#2A1B14]'
            : 'bg-slate-700/80 text-slate-300'
        }`}>
          {value === todayStr ? 'Today' : 'Pick'}
        </span>
      </button>

      {/* Modal / Backdrop */}
      {isOpen && createPortal(
        <div className={`fixed inset-0 z-[99999] flex items-center justify-center p-3 pt-6 pb-[max(env(safe-area-inset-bottom,0px),24px)] ${
          isLight ? 'bg-black/50' : 'bg-slate-950/80'
        } backdrop-blur-md animate-fadeIn select-none`}>
          <div
            className={`w-full max-w-sm rounded-3xl border shadow-2xl p-4 space-y-3 animate-scaleUp ${
              isLight
                ? 'bg-[#EFE4D6] border-[#DECFC0] text-[#2A1B14] shadow-[0_20px_50px_rgba(140,95,60,0.22)]'
                : 'bg-[#0D152D] border-slate-700/90 text-slate-100'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between pb-2 border-b ${isLight ? 'border-[#DECFC0]' : 'border-slate-800'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                  isLight
                    ? 'bg-[#F7D4BC] border-[#E8BC9E] text-[#B84A1E]'
                    : 'bg-[#16C7F2]/20 border-[#16C7F2]/40 text-[#16C7F2]'
                }`}>
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`text-sm font-extrabold ${isLight ? 'text-[#2A1B14]' : 'text-white'}`}>Select Date</h3>
                  <p className={`text-[10px] font-semibold ${isLight ? 'text-[#B84A1E]' : 'text-[#16C7F2]'}`}>
                    {formatDisplay(selectedDate) || 'Pick a date'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-[#EBE0D2] hover:bg-[#DECFC0] text-[#634B3F] hover:text-[#2A1B14]'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                }`}
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
                      ? isLight
                        ? 'bg-[#B84A1E] text-white shadow-sm'
                        : 'bg-[#16C7F2] text-slate-950'
                      : isLight
                      ? 'bg-[#EBE0D2] hover:bg-[#DECFC0] text-[#634B3F]'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect(1)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                    isLight
                      ? 'bg-[#EBE0D2] hover:bg-[#DECFC0] text-[#634B3F]'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect(7)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                    isLight
                      ? 'bg-[#EBE0D2] hover:bg-[#DECFC0] text-[#634B3F]'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  In 1 Week
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect(30)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                    isLight
                      ? 'bg-[#EBE0D2] hover:bg-[#DECFC0] text-[#634B3F]'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  In 1 Month
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect(365)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                    isLight
                      ? 'bg-[#EBE0D2] hover:bg-[#DECFC0] text-[#634B3F]'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  In 1 Year
                </button>
              </div>
            )}

            {/* Month & Year Bar */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-[#EBE0D2] hover:bg-[#DECFC0] text-[#634B3F]'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold ${isLight ? 'text-[#2A1B14]' : 'text-white'}`}>{MONTH_NAMES[viewMonth]}</span>
                <button
                  type="button"
                  onClick={() => setIsYearPickerOpen(!isYearPickerOpen)}
                  className={`px-2 py-0.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                    isLight
                      ? 'bg-[#EBE0D2] hover:bg-[#DECFC0] text-[#B84A1E]'
                      : 'bg-slate-800 hover:bg-slate-700 text-[#16C7F2]'
                  }`}
                >
                  {viewYear}
                </button>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-[#EBE0D2] hover:bg-[#DECFC0] text-[#634B3F]'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Year Selector Grid dropdown */}
            {isYearPickerOpen && (
              <div className={`grid grid-cols-4 gap-1 max-h-40 overflow-y-auto p-2 rounded-2xl border custom-scrollbar ${
                isLight
                  ? 'bg-[#EBE0D2] border-[#DECFC0]'
                  : 'bg-slate-900/95 border-slate-700'
              }`}>
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setViewYear(y);
                      setIsYearPickerOpen(false);
                    }}
                    className={`py-1 text-xs font-bold rounded-lg transition-all ${
                      y === viewYear
                        ? isLight
                          ? 'bg-[#B84A1E] text-white shadow-sm'
                          : 'bg-[#16C7F2] text-slate-950'
                        : isLight
                        ? 'text-[#634B3F] hover:bg-[#DECFC0]'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}

            {/* Days Grid */}
            {!isYearPickerOpen && (
              <div className="space-y-1.5">
                {/* Day Header */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {DAY_NAMES.map((d, i) => (
                    <span key={d} className={`text-[10px] font-bold ${
                      i === 0 || i === 6
                        ? isLight ? 'text-[#B84A1E]' : 'text-amber-400'
                        : isLight ? 'text-[#634B3F]' : 'text-slate-400'
                    }`}>
                      {d}
                    </span>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Prev Month Days */}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => {
                    const dayNum = daysInPrevMonth - firstDayOfWeek + i + 1;
                    return (
                      <div
                        key={`prev-${i}`}
                        className={`h-8 flex items-center justify-center text-[11px] rounded-lg ${
                          isLight ? 'text-[#B5A599]' : 'text-slate-600'
                        }`}
                      >
                        {dayNum}
                      </div>
                    );
                  })}

                  {/* Current Month Days */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const d = i + 1;
                    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const isSelected = dateStr === selectedDate;
                    const isToday = dateStr === todayStr;

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => handleSelectDay(d)}
                        className={`h-8 flex items-center justify-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          isSelected
                            ? isLight
                              ? 'bg-gradient-to-tr from-[#D96632] to-[#B84A1E] text-white shadow-md scale-105'
                              : 'bg-gradient-to-tr from-[#168BFF] to-[#16C7F2] text-slate-950 shadow-md scale-105'
                            : isToday
                            ? isLight
                              ? 'bg-[#F7D4BC] text-[#B84A1E] border border-[#E8BC9E] hover:bg-[#F7D4BC]/80'
                              : 'bg-[#16C7F2]/15 text-[#16C7F2] border border-[#16C7F2]/40 hover:bg-[#16C7F2]/25'
                            : isLight
                            ? 'text-[#2A1B14] hover:bg-[#EBE0D2]'
                            : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className={`flex items-center justify-between pt-2 border-t ${isLight ? 'border-[#DECFC0]' : 'border-slate-800'}`}>
              <button
                type="button"
                onClick={() => {
                  const now = getLocalDateString();
                  setSelectedDate(now);
                  const [y, m] = now.split('-').map(Number);
                  setViewYear(y);
                  setViewMonth(m - 1);
                  onChange(now);
                  setIsOpen(false);
                }}
                className={`text-[11px] hover:underline font-bold flex items-center gap-1 ${
                  isLight ? 'text-[#B84A1E]' : 'text-[#16C7F2]'
                }`}
              >
                <RotateCcw className={`w-3 h-3 ${isLight ? 'text-[#B84A1E]' : 'text-[#16C7F2]'}`} />
                <span>Today</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                    isLight
                      ? 'bg-[#EBE0D2] hover:bg-[#DECFC0] text-[#634B3F]'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange(selectedDate);
                    setIsOpen(false);
                  }}
                  className={`px-4 py-1.5 rounded-xl font-black text-xs shadow-md cursor-pointer transition-all flex items-center gap-1 ${
                    isLight
                      ? 'bg-gradient-to-r from-[#D96632] to-[#B84A1E] text-white'
                      : 'bg-gradient-to-r from-[#168BFF] to-[#16C7F2] text-slate-950'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Done</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
