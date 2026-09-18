import React, { useState } from 'react';
import {
  X,
  Check,
  Edit2,
  Trash2,
  RefreshCw,
  Zap,
  CheckCheck,
  Clock,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Filter,
  Eye,
  EyeOff,
  Settings,
  ClipboardPaste,
  Send,
  MapPin,
} from 'lucide-react';
import { DetectedTransaction } from '../../services/smartExpense/types.js';
import { SmartExpenseService } from '../../services/smartExpense/SmartExpenseService.js';
import { useFamily } from '../../context/FamilyContext.js';
import { SmartExpenseDiagnosticsModal } from './SmartExpenseDiagnosticsModal.js';
import { Activity } from 'lucide-react';

interface SmartExpenseReviewModalProps {
  isOpen: boolean;
  familyId?: string;
  onClose: () => void;
  pendingTransactions: DetectedTransaction[];
  confirmedTransactions: DetectedTransaction[];
  ignoredTransactions: DetectedTransaction[];
  onConfirm: (t: DetectedTransaction) => void;
  onEdit: (t: DetectedTransaction) => void;
  onIgnore: (t: DetectedTransaction) => void;
  onBulkConfirm: () => void;
  onScanRecent: () => Promise<{ detectedCount?: number; message?: string } | void>;
  onRefreshData?: () => void;
  onOpenSettings: () => void;
  isPrivacyMode?: boolean;
}

export const SmartExpenseReviewModal: React.FC<SmartExpenseReviewModalProps> = ({
  isOpen,
  familyId = '',
  onClose,
  pendingTransactions = [],
  confirmedTransactions = [],
  ignoredTransactions = [],
  onConfirm,
  onEdit,
  onIgnore,
  onBulkConfirm,
  onScanRecent,
  onRefreshData,
  onOpenSettings,
  isPrivacyMode = false,
}) => {
  const { family } = useFamily();
  const activeFamilyId = familyId || family?.id || localStorage.getItem('onefamily_family_id') || '';
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'ignored'>('pending');
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Paste SMS Quick Test state
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pastedSms, setPastedSms] = useState('');
  const [pasteResult, setPasteResult] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  if (!isOpen) return null;

  const handleScan = async () => {
    setIsScanning(true);
    setScanMessage(null);
    try {
      const res: any = await onScanRecent();
      if (res && res.message) {
        setScanMessage(res.message);
      } else {
        setScanMessage('Scan complete.');
      }
      setTimeout(() => setScanMessage(null), 6000);
    } catch {
      setScanMessage('No messages to read on this device.');
      setTimeout(() => setScanMessage(null), 6000);
    } finally {
      setIsScanning(false);
    }
  };

  const handleParsePastedSms = async () => {
    if (!pastedSms.trim()) return;
    setPasteResult(null);
    try {
      const res = await SmartExpenseService.parseAndIngestRawSms(activeFamilyId, pastedSms);
      setPasteResult(res.message);
      if (res.success) {
        setPastedSms('');
        onRefreshData?.();
        setTimeout(() => {
          setShowPasteBox(false);
          setPasteResult(null);
        }, 3000);
      }
    } catch (err: any) {
      setPasteResult(`Error: ${err?.message || 'Could not parse'}`);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Recent';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const formatAmount = (amount: number) => {
    if (isPrivacyMode) return '••••';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="w-full max-w-lg h-[90vh] max-h-[700px] flex flex-col rounded-3xl bg-[#0B132B] border border-slate-700/80 shadow-2xl text-slate-100 overflow-hidden">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-[#073B9E]/50 via-[#0D152D] to-[#0B132B]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#16C7F2]/20 border border-[#16C7F2]/40 flex items-center justify-center text-[#16C7F2]">
              <Zap className="w-5 h-5 fill-[#16C7F2]/30" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                Smart Expenses
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#16C7F2]/20 text-[#16C7F2] border border-[#16C7F2]/30">
                  Auto-Detect
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Review and approve expenses detected from your bank SMS</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowDiagnostics(true)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 transition-colors flex items-center gap-1 text-[11px] font-semibold px-2.5"
              title="Native SMS Diagnostics & Audit"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Audit</span>
            </button>
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scan & Batch Action Bar */}
        <div className="p-3 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 disabled:opacity-60 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#16C7F2] ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning...' : 'Scan Recent (7 Days)'}</span>
            </button>

            <button
              onClick={() => setShowPasteBox(!showPasteBox)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
              title="Paste SMS text directly to test or capture"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-[#55D98A]" />
              <span>Paste SMS</span>
            </button>
          </div>

          {activeTab === 'pending' && pendingTransactions.length > 0 && (
            <button
              onClick={onBulkConfirm}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#168BFF] to-[#16C7F2] text-slate-950 hover:text-white text-xs font-black shadow-md transition-all"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Confirm All ({pendingTransactions.length})</span>
            </button>
          )}
        </div>

        {/* Optional Collapsible Paste SMS Area */}
        {showPasteBox && (
          <div className="p-3 bg-slate-900/90 border-b border-slate-800 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold">
              <span>Paste Bank/UPI SMS Text to Test or Ingest:</span>
              <button
                onClick={() => setShowPasteBox(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <textarea
              rows={2}
              value={pastedSms}
              onChange={(e) => setPastedSms(e.target.value)}
              placeholder="e.g. Paid Rs. 500 to Suresh Kumar via UPI. Ref 426189012345"
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-[#16C7F2]"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] text-[#16C7F2] font-semibold">{pasteResult}</span>
              <button
                type="button"
                onClick={handleParsePastedSms}
                className="px-3 py-1 rounded-xl bg-[#168BFF] hover:bg-[#16C7F2] text-white text-xs font-bold transition-all flex items-center gap-1"
              >
                <Send className="w-3 h-3" />
                <span>Parse & Add</span>
              </button>
            </div>
          </div>
        )}

        {scanMessage && (
          <div className="mx-3 mt-2 p-2.5 rounded-xl bg-[#16C7F2]/10 border border-[#16C7F2]/30 text-xs text-[#16C7F2] text-center font-medium animate-fadeIn">
            {scanMessage}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/40 text-xs font-bold">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-3 text-center transition-all border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'pending'
                ? 'border-[#16C7F2] text-[#16C7F2] bg-[#16C7F2]/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Pending Review</span>
            {pendingTransactions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#FFD21F] text-slate-950 font-black">
                {pendingTransactions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('confirmed')}
            className={`flex-1 py-3 text-center transition-all border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'confirmed'
                ? 'border-[#55D98A] text-[#55D98A] bg-[#55D98A]/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Confirmed</span>
            <span className="text-[10px] text-slate-500">({confirmedTransactions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ignored')}
            className={`flex-1 py-3 text-center transition-all border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'ignored'
                ? 'border-slate-400 text-slate-200 bg-slate-800/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Ignored</span>
            <span className="text-[10px] text-slate-500">({ignoredTransactions.length})</span>
          </button>
        </div>

        {/* Content List Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {activeTab === 'pending' && (
            <>
              {pendingTransactions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
                  <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-[#55D98A] mb-3">
                    <CheckCheck className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-white">No Pending Transactions</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    No new transactions found. On your Android phone, incoming bank & UPI SMS messages will appear here automatically.
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={handleScan}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#16C7F2]" />
                      <span>Scan SMS Messages</span>
                    </button>
                    <button
                      onClick={() => setShowPasteBox(true)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5 text-[#55D98A]" />
                      <span>Paste SMS</span>
                    </button>
                  </div>
                </div>
              ) : (
                pendingTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 shadow-md transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white truncate">
                            {tx.merchantNormalized || tx.merchantRaw || 'Unknown Merchant'}
                          </h4>
                          {tx.categoryConfidence && tx.categoryConfidence >= 0.85 && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#16C7F2]/10 border border-[#16C7F2]/30 text-[9px] font-bold text-[#16C7F2]">
                              <Sparkles className="w-2.5 h-2.5" /> High Match
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>{formatDate(tx.transactionDateTime || tx.detectedAt)}</span>
                          {tx.bankName && (
                            <>
                              <span>•</span>
                              <span>{tx.bankName} {tx.accountLast4 ? `XX${tx.accountLast4}` : ''}</span>
                            </>
                          )}
                          {tx.upiId && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[100px]">{tx.upiId}</span>
                            </>
                          )}
                          {tx.location?.locationLabel && (
                            <span className="inline-flex items-center gap-1 text-[#16C7F2] font-semibold bg-[#16C7F2]/10 px-1.5 py-0.5 rounded-md border border-[#16C7F2]/25">
                              <MapPin className="w-2.5 h-2.5" />
                              <span>{tx.location.locationLabel}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-extrabold text-white">
                          {formatAmount(tx.amount)}
                        </div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#168BFF]/20 text-[#16C7F2] border border-[#168BFF]/30">
                          {tx.categorySuggested || 'Expense'}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-800/80">
                      <button
                        onClick={() => onIgnore(tx)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-400 hover:text-red-400 text-xs font-semibold transition-colors flex items-center gap-1"
                        title="Ignore this expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Ignore</span>
                      </button>

                      <button
                        onClick={() => onEdit(tx)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1"
                        title="Edit details"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[#16C7F2]" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => onConfirm(tx)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#168BFF] to-[#16C7F2] text-slate-950 hover:text-white text-xs font-extrabold shadow-md transition-all flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Confirm</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'confirmed' && (
            <>
              {confirmedTransactions.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No confirmed smart transactions yet.
                </div>
              ) : (
                confirmedTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white truncate">
                          {tx.merchantNormalized || tx.merchantRaw}
                        </span>
                        <Check className="w-3.5 h-3.5 text-[#55D98A]" />
                      </div>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                        <span>{formatDate(tx.transactionDateTime)}</span>
                        <span>•</span>
                        <span>{tx.categorySuggested}</span>
                        {tx.location?.locationLabel && (
                          <>
                            <span>•</span>
                            <span className="text-[#16C7F2]">📍 {tx.location.locationLabel}</span>
                          </>
                        )}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-white">{formatAmount(tx.amount)}</div>
                      <span className="text-[10px] text-[#55D98A] font-semibold">Ledger Added</span>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'ignored' && (
            <>
              {ignoredTransactions.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No ignored transactions.
                </div>
              ) : (
                ignoredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/50 flex items-center justify-between gap-3 text-xs opacity-75"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-300 truncate block">
                        {tx.merchantNormalized || tx.merchantRaw}
                      </span>
                      <p className="text-[11px] text-slate-500">
                        {formatDate(tx.transactionDateTime)} • Ignored
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium">{formatAmount(tx.amount)}</span>
                      <button
                        onClick={() => onEdit(tx)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[#16C7F2] text-[11px] font-semibold"
                      >
                        Restore
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#55D98A]" />
            <span>Local parsing • No raw SMS uploaded</span>
          </div>
          <button onClick={onClose} className="font-semibold text-slate-300 hover:text-white">
            Done
          </button>
        </div>
      </div>

      {/* Embedded Diagnostics Modal */}
      <SmartExpenseDiagnosticsModal
        isOpen={showDiagnostics}
        onClose={() => setShowDiagnostics(false)}
        familyId={activeFamilyId}
        onRefreshData={onRefreshData}
      />
    </div>
  );
};
