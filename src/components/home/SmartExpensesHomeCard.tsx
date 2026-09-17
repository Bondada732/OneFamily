import React from 'react';
import { Zap, ChevronRight, CheckCircle2, ShieldCheck, Settings } from 'lucide-react';
import { DetectedTransaction, SmartCaptureSettings } from '../../services/smartExpense/types.js';

interface SmartExpensesHomeCardProps {
  pendingTransactions: DetectedTransaction[];
  settings: SmartCaptureSettings;
  onOpenReview: () => void;
  onOpenEnable: () => void;
  onOpenSettings: () => void;
  isPrivacyMode?: boolean;
}

export const SmartExpensesHomeCard: React.FC<SmartExpensesHomeCardProps> = ({
  pendingTransactions = [],
  settings,
  onOpenReview,
  onOpenEnable,
  onOpenSettings,
  isPrivacyMode = false,
}) => {
  const pendingCount = pendingTransactions.length;
  const pendingTotal = pendingTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const isEnabled = settings.enabled || settings.smsEnabled;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-3.5 shadow-lg border transition-all duration-200 select-none"
      style={{
        background: 'linear-gradient(135deg, rgba(7, 59, 158, 0.75) 0%, rgba(13, 21, 45, 0.95) 70%, rgba(22, 199, 242, 0.12) 100%)',
        borderColor: pendingCount > 0 ? 'rgba(22, 199, 242, 0.45)' : 'rgba(22, 199, 242, 0.25)',
      }}
    >
      <div className="flex items-center justify-between">
        {/* Left Side: Lightning Icon + Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#16C7F2]/15 border border-[#16C7F2]/30 flex items-center justify-center text-[#16C7F2] shrink-0">
            <Zap className="w-4 h-4 fill-[#16C7F2]/30" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-wide">Smart Expenses</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9.5px] font-black bg-[#FFD21F] text-slate-950 animate-pulse">
                  {pendingCount} New
                </span>
              )}
            </div>

            <p className="text-[10.5px] text-slate-300 truncate mt-0.5">
              {!isEnabled ? (
                'Automatic detection is off'
              ) : pendingCount > 0 ? (
                <>
                  <span className="font-semibold text-white">
                    {isPrivacyMode ? '••••' : `₹${pendingTotal.toLocaleString('en-IN')}`}
                  </span>{' '}
                  detected • review to confirm
                </>
              ) : (
                "You're all caught up"
              )}
            </p>
          </div>
        </div>

        {/* Right Side: Action Button */}
        <div className="flex items-center gap-1.5 shrink-0 pl-2">
          {!isEnabled ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenEnable();
              }}
              className="px-3 py-1.5 rounded-xl bg-[#168BFF] hover:bg-[#16C7F2] text-white text-[11px] font-bold shadow-md transition-colors"
            >
              Enable
            </button>
          ) : pendingCount > 0 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenReview();
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#16C7F2] to-[#168BFF] text-slate-950 hover:text-white text-[11px] font-black shadow-md flex items-center gap-1 transition-all"
            >
              <span>Review</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenReview();
              }}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
              title="View History"
            >
              <CheckCircle2 className="w-4 h-4 text-[#55D98A]" />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenSettings();
            }}
            className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 border border-slate-700/50 transition-colors"
            title="Smart Expense Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
