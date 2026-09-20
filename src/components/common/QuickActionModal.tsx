import React from 'react';
import { X, Receipt, Target, FileUp, CheckSquare, Camera, Sparkles, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActionSelect: (actionType: 'ADD_EXPENSE' | 'CREATE_GOAL' | 'UPLOAD_DOC' | 'ADD_TASK' | 'ADD_MEMORY' | 'ASK_AI' | 'ADD_FRIEND') => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({ isOpen, onClose, onActionSelect }) => {
  const { hasPermission } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (!isOpen) return null;

  const actions = [
    {
      id: 'ADD_FRIEND' as const,
      label: 'Family & Friend Date',
      description: 'Birthdays, anniversaries, occasions',
      icon: Heart,
      color: isLight ? 'bg-[#F7D4BC] text-[#B84A1E] border-[#E8BC9E]' : 'bg-pink-500/20 text-[#FF4D8D] border-pink-500/40',
      allowed: true,
    },
    {
      id: 'ADD_EXPENSE' as const,
      label: 'Record Expense',
      description: 'UPI, receipt scan or manual entry',
      icon: Receipt,
      color: isLight ? 'bg-[#F7D4BC] text-[#B84A1E] border-[#E8BC9E]' : 'bg-[rgba(255,138,36,0.18)] text-[#FFD21F] border-[#FF8A24]/40',
      allowed: hasPermission('FINANCE_EDIT'),
    },
    {
      id: 'CREATE_GOAL' as const,
      label: 'Set Family Goal',
      description: 'Vacation, emergency fund, education',
      icon: Target,
      color: isLight ? 'bg-[#E4D7C7] text-[#2E7D32] border-[#DECFC0]' : 'bg-[rgba(25,201,167,0.18)] text-[#55D98A] border-[#19C9A7]/40',
      allowed: hasPermission('FINANCE_EDIT'),
    },
    {
      id: 'UPLOAD_DOC' as const,
      label: 'Store Document',
      description: 'Aadhaar, PAN, insurance with OCR',
      icon: FileUp,
      color: isLight ? 'bg-[#E4D7C7] text-[#B87333] border-[#DECFC0]' : 'bg-[rgba(22,139,255,0.18)] text-[#16C7F2] border-[#168BFF]/40',
      allowed: hasPermission('DOCUMENT_UPLOAD'),
    },
    {
      id: 'ADD_TASK' as const,
      label: 'Add Family Task',
      description: 'Chores, bills, grocery items',
      icon: CheckSquare,
      color: isLight ? 'bg-[#E4D7C7] text-[#C25425] border-[#DECFC0]' : 'bg-[rgba(22,199,242,0.18)] text-[#7EDCFF] border-[#16C7F2]/40',
      allowed: hasPermission('TASK_EDIT'),
    },
    {
      id: 'ADD_MEMORY' as const,
      label: 'Save Memory / Photo',
      description: 'Family trips, birthdays, stories',
      icon: Camera,
      color: isLight ? 'bg-[#F7D4BC] text-[#B84A1E] border-[#E8BC9E]' : 'bg-[rgba(255,185,31,0.18)] text-[#FFD21F] border-[#FFB91F]/40',
      allowed: hasPermission('MEMORY_UPLOAD'),
    },
    {
      id: 'ASK_AI' as const,
      label: 'Ask FamilyAI',
      description: 'Insights, checklists, wealth advice',
      icon: Sparkles,
      color: isLight ? 'bg-[#F7D4BC] text-[#B84A1E] border-[#E8BC9E]' : 'bg-[rgba(22,139,255,0.18)] text-[#B9F36B] border-[#16C7F2]/40',
      allowed: true,
    },
  ];

  return (
    <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 ${isLight ? 'bg-black/50' : 'bg-black/80'} backdrop-blur-md animate-fade-in`}>
      <div className={`w-full max-w-md rounded-t-[28px] sm:rounded-[28px] p-5 pb-[max(env(safe-area-inset-bottom,0px),28px)] sm:pb-5 space-y-4 shadow-[0_20px_60px_rgba(0,0,0,0.95)] ${
        isLight
          ? 'bg-[#EFE4D6] border-t sm:border-2 border-[#DECFC0] text-[#2A1B14]'
          : 'bg-[#0B1226] border-t sm:border border-slate-700/80 text-[#F4F8FF]'
      }`}>
        <div className={`flex items-center justify-between pb-2 border-b ${isLight ? 'border-[#DECFC0]' : 'border-slate-800'}`}>
          <div>
            <h3 className={`text-lg font-bold ${isLight ? 'text-[#2A1B14]' : 'text-white'}`}>Create & Record</h3>
            <p className={`text-xs ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>What would you like to add to KinoraOne?</p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${
            isLight
              ? 'hover:bg-[#EBE0D2] text-[#634B3F] hover:text-[#2A1B14]'
              : 'hover:bg-[#0E1730] text-slate-400 hover:text-white'
          }`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                disabled={!act.allowed}
                onClick={() => {
                  onActionSelect(act.id);
                  onClose();
                }}
                className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all ${
                  act.allowed
                    ? isLight
                      ? 'hover:scale-[1.02] active:scale-95 bg-[#EBE0D2] border-[#DECFC0] hover:border-[#C25425] shadow-sm'
                      : 'hover:scale-[1.02] active:scale-95 bg-[#0D152D] border-slate-700/70 hover:border-[#16C7F2]/60 shadow-sm'
                    : isLight
                    ? 'opacity-40 cursor-not-allowed bg-[#E4D7C7] border-[#DECFC0]'
                    : 'opacity-40 cursor-not-allowed bg-[#050811] border-slate-800'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-2 ${act.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className={`font-bold text-xs ${isLight ? 'text-[#2A1B14]' : 'text-white'}`}>{act.label}</div>
                <div className={`text-[10px] line-clamp-1 mt-0.5 ${isLight ? 'text-[#634B3F]' : 'text-[#B9D8FF]/80'}`}>{act.description}</div>
                {!act.allowed && (
                  <span className={`text-[9px] font-semibold mt-1 ${isLight ? 'text-[#C62828]' : 'text-[#FF4D6D]'}`}>No Permission</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
