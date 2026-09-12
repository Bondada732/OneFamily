import React from 'react';
import { X, Receipt, Target, FileUp, CheckSquare, Camera, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActionSelect: (actionType: 'ADD_EXPENSE' | 'CREATE_GOAL' | 'UPLOAD_DOC' | 'ADD_TASK' | 'ADD_MEMORY' | 'ASK_AI') => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({ isOpen, onClose, onActionSelect }) => {
  const { hasPermission } = useAuth();

  if (!isOpen) return null;

  const actions = [
    {
      id: 'ADD_EXPENSE' as const,
      label: 'Record Expense',
      description: 'UPI, receipt scan or manual entry',
      icon: Receipt,
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      allowed: hasPermission('FINANCE_EDIT'),
    },
    {
      id: 'CREATE_GOAL' as const,
      label: 'Set Family Goal',
      description: 'Vacation, emergency fund, education',
      icon: Target,
      color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      allowed: hasPermission('FINANCE_EDIT'),
    },
    {
      id: 'UPLOAD_DOC' as const,
      label: 'Store Document',
      description: 'Aadhaar, PAN, insurance with OCR',
      icon: FileUp,
      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      allowed: hasPermission('DOCUMENT_UPLOAD'),
    },
    {
      id: 'ADD_TASK' as const,
      label: 'Add Family Task',
      description: 'Chores, bills, grocery items',
      icon: CheckSquare,
      color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      allowed: hasPermission('TASK_EDIT'),
    },
    {
      id: 'ADD_MEMORY' as const,
      label: 'Save Memory / Photo',
      description: 'Family trips, birthdays, stories',
      icon: Camera,
      color: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      allowed: hasPermission('MEMORY_UPLOAD'),
    },
    {
      id: 'ASK_AI' as const,
      label: 'Ask FamilyAI',
      description: 'Insights, checklists, gift planning',
      icon: Sparkles,
      color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      allowed: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 text-slate-100 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Create & Record</h3>
            <p className="text-xs text-slate-400">What would you like to add to One Family?</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white">
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
                    ? 'hover:scale-[1.02] active:scale-95 bg-slate-800/80 border-slate-700/80 hover:border-slate-600'
                    : 'opacity-40 cursor-not-allowed bg-slate-850 border-slate-800'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-2 ${act.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="font-bold text-xs text-slate-100">{act.label}</div>
                <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{act.description}</div>
                {!act.allowed && (
                  <span className="text-[9px] text-rose-400 font-semibold mt-1">No Permission</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
