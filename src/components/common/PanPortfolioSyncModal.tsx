import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, Lock, CheckCircle2, AlertCircle, RefreshCw, X, ArrowRight, Wallet, TrendingUp, Building, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters.js';

interface PanPortfolioSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight: boolean;
  familyId: string;
  members: any[];
  currentUserName?: string;
  onSyncComplete: () => void;
  apiCall: (url: string, options?: any) => Promise<any>;
}

export const PanPortfolioSyncModal: React.FC<PanPortfolioSyncModalProps> = ({
  isOpen,
  onClose,
  isLight,
  familyId,
  members,
  currentUserName = 'Rambabu',
  onSyncComplete,
  apiCall,
}) => {
  const [step, setStep] = useState<'PAN_INPUT' | 'OTP_VERIFY' | 'PREVIEW' | 'SUCCESS'>('PAN_INPUT');
  const [panNumber, setPanNumber] = useState('');
  const [phone, setPhone] = useState('9876543210');
  const [selectedMember, setSelectedMember] = useState(currentUserName);
  
  const [sessionId, setSessionId] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [otp, setOtp] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [extractedPortfolio, setExtractedPortfolio] = useState<any>(null);

  if (!isOpen) return null;

  const handleInitiateSync = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPan = panNumber.trim().toUpperCase();
    if (!cleanPan || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
      setErrorMsg('Please enter a valid 10-character PAN number (e.g. ABCDE1234F)');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await apiCall(`/investments/${familyId}/sync-pan/initiate`, {
        method: 'POST',
        body: JSON.stringify({
          panNumber: cleanPan,
          phone,
          memberName: selectedMember,
        }),
      });

      if (res.success && res.sessionId) {
        setSessionId(res.sessionId);
        setMaskedPhone(res.maskedPhone || '+91 ******3210');
        setStep('OTP_VERIFY');
      } else {
        setErrorMsg(res.error || 'Failed to initiate PAN sync. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Server connection error during sync request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.length < 4) {
      setErrorMsg('Please enter the verification OTP');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await apiCall(`/investments/${familyId}/sync-pan/verify`, {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          otp: otp.trim(),
        }),
      });

      if (res.success && res.portfolio) {
        setExtractedPortfolio(res.portfolio);
        setStep('PREVIEW');
      } else {
        setErrorMsg(res.error || 'Invalid OTP. Please enter 123456 or the code sent to your mobile.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to verify OTP with CAMS network');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommitPortfolio = async () => {
    if (!extractedPortfolio || !extractedPortfolio.schemes) return;

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await apiCall(`/investments/${familyId}/sync-pan/commit`, {
        method: 'POST',
        body: JSON.stringify({
          ownerName: selectedMember,
          panNumber: extractedPortfolio.pan,
          schemes: extractedPortfolio.schemes,
        }),
      });

      if (res.success) {
        setStep('SUCCESS');
        setTimeout(() => {
          onSyncComplete();
          onClose();
        }, 1800);
      } else {
        setErrorMsg(res.error || 'Failed to save portfolio to family wealth');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving portfolio');
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div
        className={`w-full max-w-lg ${
          isLight
            ? 'bg-[#F3E3D3] border-2 border-[#EAD6C4] text-[#1F1F1F]'
            : 'bg-[#0b1329] border border-slate-700 text-slate-100'
        } rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-y-auto`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b ${isLight ? 'border-[#DEC8B2]' : 'border-slate-800'} pb-3`}>
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md ${
                isLight ? 'bg-[#FFF8F1] border border-[#DEC8B2] text-[#F05A28]' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold tracking-tight ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                Auto-Sync Mutual Funds via PAN
              </h3>
              <p className={`text-[11px] ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                Direct SEBI & CAMS / KFintech Consolidated Statement (CAS)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isLight
                ? 'bg-[#FFF8F1] border border-[#DEC8B2] text-[#634B3F] hover:text-[#1F1F1F]'
                : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security Badge */}
        <div className={`p-2.5 rounded-2xl border flex items-center gap-2 text-xs ${
          isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
        }`}>
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
          <span className="text-[11px] font-medium">
            Bank-grade 256-bit encrypted sync. Reads read-only portfolio balances via RBI/SEBI Account Aggregator.
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: PAN & MEMBER FORM */}
        {step === 'PAN_INPUT' && (
          <form onSubmit={handleInitiateSync} className="space-y-4">
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-[#4A3B32]' : 'text-slate-300'}`}>
                Family Member / Portfolio Owner
              </label>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold outline-none ${
                  isLight
                    ? 'bg-[#FFF8F1] border-[#DEC8B2] text-[#1F1F1F]'
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.role === 'FAMILY_HEAD' ? 'Head' : 'Member'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-[#4A3B32]' : 'text-slate-300'}`}>
                10-Digit PAN Card Number
              </label>
              <input
                type="text"
                placeholder="e.g. ABCDE1234F"
                maxLength={10}
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                className={`w-full px-3.5 py-3 rounded-xl border text-sm font-bold tracking-wider uppercase outline-none transition-all ${
                  isLight
                    ? 'bg-[#FFF8F1] border-[#DEC8B2] text-[#1F1F1F] focus:border-[#F05A28]'
                    : 'bg-slate-800 border-slate-700 text-emerald-400 focus:border-emerald-500'
                }`}
                required
              />
              <p className={`text-[10px] mt-1 ${isLight ? 'text-[#8C7A6B]' : 'text-slate-400'}`}>
                Used to fetch consolidated mutual funds across Zerodha, Groww, Kuvera & CAMS.
              </p>
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-[#4A3B32]' : 'text-slate-300'}`}>
                Registered Mobile Number
              </label>
              <input
                type="tel"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none ${
                  isLight
                    ? 'bg-[#FFF8F1] border-[#DEC8B2] text-[#1F1F1F]'
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isLight ? 'bg-[#F05A28] hover:bg-[#E76F3C]' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
              } ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting to CAMS Network...</span>
                </>
              ) : (
                <>
                  <span>Request Verification OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 'OTP_VERIFY' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center space-y-1">
              <div className={`text-xs font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                Enter SEBI Consent OTP
              </div>
              <p className={`text-[11px] ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                A 6-digit verification code was sent to <span className="font-bold">{maskedPhone}</span>
              </p>
              <p className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 py-1 px-2 rounded-lg inline-block border border-emerald-800">
                Sandbox Demo OTP: <strong>123456</strong>
              </p>
            </div>

            <div>
              <input
                type="text"
                maxLength={6}
                placeholder="• • • • • •"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                className={`w-full py-3 text-center text-xl font-bold tracking-[0.4em] rounded-xl border outline-none ${
                  isLight
                    ? 'bg-[#FFF8F1] border-[#DEC8B2] text-[#1F1F1F]'
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
                autoFocus
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('PAN_INPUT')}
                className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold ${
                  isLight ? 'bg-[#FFF8F1] border-[#DEC8B2] text-[#634B3F]' : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                Change PAN
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`flex-2 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 ${
                  isLight ? 'bg-[#F05A28] hover:bg-[#E76F3C]' : 'bg-gradient-to-r from-emerald-600 to-teal-600'
                } ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Extracting Portfolio...</span>
                  </>
                ) : (
                  <span>Verify & Extract Folios</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: EXTRACTED PORTFOLIO PREVIEW */}
        {step === 'PREVIEW' && extractedPortfolio && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-xs font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                  Portfolio for {extractedPortfolio.ownerName}
                </div>
                <div className={`text-[10px] font-mono ${isLight ? 'text-[#8C7A6B]' : 'text-slate-400'}`}>
                  PAN: {extractedPortfolio.pan} • {extractedPortfolio.schemesCount} Folios Found
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-emerald-400">
                  {formatCurrency(extractedPortfolio.totalCurrentValue)}
                </div>
                <div className="text-[10px] text-emerald-500 font-semibold">
                  +{formatCurrency(extractedPortfolio.totalGainLoss)} (+{extractedPortfolio.totalGainLossPct}%)
                </div>
              </div>
            </div>

            {/* Scheme list */}
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {extractedPortfolio.schemes.map((s: any, i: number) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-2xl border flex items-center justify-between text-xs ${
                    isLight ? 'bg-[#FFF8F1] border-[#EAD6C4]' : 'bg-slate-800/90 border-slate-700/80'
                  }`}
                >
                  <div className="overflow-hidden mr-2">
                    <div className={`font-bold truncate ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                      {s.schemeName}
                    </div>
                    <div className={`text-[10px] truncate ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                      {s.amc} • Folio: {s.folioNumber} • {s.units} Units
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                      {formatCurrency(s.currentValue)}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-medium">
                      +{formatCurrency(s.gainLoss)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('PAN_INPUT')}
                className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold ${
                  isLight ? 'bg-[#FFF8F1] border-[#DEC8B2] text-[#634B3F]' : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCommitPortfolio}
                disabled={isLoading}
                className={`flex-2 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 ${
                  isLight ? 'bg-[#F05A28] hover:bg-[#E76F3C]' : 'bg-gradient-to-r from-emerald-600 to-teal-600'
                } ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving to Wealth...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Save to Family Wealth</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS */}
        {step === 'SUCCESS' && (
          <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className={`text-base font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
              Portfolio Synced Successfully!
            </div>
            <p className={`text-xs ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
              All mutual fund folios have been saved to your family net worth and asset allocation.
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
