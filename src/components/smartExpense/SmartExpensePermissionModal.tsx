import React from 'react';
import { ShieldCheck, CheckCircle, X, Zap, Lock, EyeOff } from 'lucide-react';

interface SmartExpensePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmEnable: () => void;
}

export const SmartExpensePermissionModal: React.FC<SmartExpensePermissionModalProps> = ({
  isOpen,
  onClose,
  onConfirmEnable,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn select-none">
      <div className="w-full max-w-sm rounded-3xl bg-[#0D152D] border border-[#16C7F2]/40 shadow-2xl p-5 space-y-4 text-slate-100">
        {/* Header Icon */}
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0869E8] to-[#16C7F2] p-0.5 flex items-center justify-center shadow-lg shadow-[#16C7F2]/20">
            <div className="w-full h-full bg-[#0D152D] rounded-2xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-[#16C7F2] fill-[#16C7F2]/20" />
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-white tracking-tight">Smart Expense Capture</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            KinoraOne can automatically detect eligible bank and UPI transaction messages on your device to help effortlessly record your household expenses.
          </p>
        </div>

        {/* What is extracted */}
        <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2 text-xs">
          <div className="font-bold text-slate-200 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-[#55D98A]" />
            <span>Only used to identify:</span>
          </div>
          <ul className="space-y-1 text-[11.5px] text-slate-300 pl-4 list-disc">
            <li>Transaction amount & currency (₹)</li>
            <li>Merchant or payee name</li>
            <li>Transaction date & timestamp</li>
            <li>Debit or credit status</li>
            <li>UPI reference or transaction ID</li>
            <li>Bank/account hint (last 4 digits only)</li>
          </ul>
        </div>

        {/* Privacy by Design Guarantee */}
        <div className="p-3 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/30 flex items-start gap-2.5 text-xs text-slate-300">
          <ShieldCheck className="w-4 h-4 text-[#55D98A] shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong className="text-white">Privacy Guarantee:</strong> Personal chats, OTPs, and unrelated messages will <span className="text-[#55D98A] font-semibold">never</span> be read, uploaded, or stored.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
          >
            Not Now
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onConfirmEnable();
            }}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#168BFF] to-[#16C7F2] text-slate-950 hover:text-white font-extrabold text-xs shadow-lg shadow-[#168BFF]/30 transition-all"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};
