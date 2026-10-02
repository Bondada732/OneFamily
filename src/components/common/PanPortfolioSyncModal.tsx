import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  ArrowRight,
  Wallet,
  TrendingUp,
  Building,
  Sparkles,
  FileSpreadsheet,
  Upload,
  FileText,
  Key,
  Check,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
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
  const [syncMode, setSyncMode] = useState<'CAS_UPLOAD' | 'PAN_OTP'>('CAS_UPLOAD');
  const [step, setStep] = useState<'INPUT' | 'OTP_VERIFY' | 'PREVIEW' | 'SUCCESS'>('INPUT');
  
  // PAN & AA State
  const [panNumber, setPanNumber] = useState('');
  const [phone, setPhone] = useState('9876543210');
  const [selectedMember, setSelectedMember] = useState(currentUserName);
  const [sessionId, setSessionId] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [otp, setOtp] = useState('123456');

  // CAS File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [pdfPassword, setPdfPassword] = useState<string>('');
  const [rawTextContent, setRawTextContent] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  // Common State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [extractedPortfolio, setExtractedPortfolio] = useState<any>(null);

  if (!isOpen) return null;

  // Handle File Selection
  const handleFileChange = (file: File) => {
    if (!file) return;
    setSelectedFile(file);
    setErrorMsg('');

    const reader = new FileReader();
    if (file.name.toLowerCase().endsWith('.pdf')) {
      reader.onload = () => {
        setFileBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = () => {
        setRawTextContent(reader.result as string);
        setFileBase64(reader.result as string);
      };
      reader.readAsText(file);
    }
  };

  // 1. Submit CAS Statement for AI Parsing
  const handleParseCasFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !rawTextContent && !fileBase64) {
      setErrorMsg('Please select your CAMS or KFintech CAS statement file (PDF / Excel / CSV)');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await apiCall(`/investments/${familyId}/cas-upload`, {
        method: 'POST',
        body: JSON.stringify({
          fileBase64,
          fileName: selectedFile?.name || 'statement.pdf',
          textContent: rawTextContent,
          pdfPassword: pdfPassword.trim(),
          memberName: selectedMember,
        }),
      });

      if (res.success && Array.isArray(res.schemes) && res.schemes.length > 0) {
        setExtractedPortfolio(res);
        setStep('PREVIEW');
      } else {
        setErrorMsg(
          res.error ||
          res.message ||
          'Could not extract schemes. If your CAMS PDF is password-protected, please enter your PAN as the PDF password.'
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Server connection error during CAS statement extraction');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Initiate AA PAN Sync
  const handleInitiatePanSync = async (e: React.FormEvent) => {
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
        setOtp('123456');
        setStep('OTP_VERIFY');
      } else {
        setErrorMsg(res.error || 'Failed to initiate PAN sync.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Server connection error during sync request');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Verify OTP
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
        setErrorMsg(res.error || 'Invalid OTP. Please enter 123456.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Commit Extracted Schemes to Family Wealth
  const handleCommitPortfolio = async () => {
    if (!extractedPortfolio || !extractedPortfolio.schemes) return;

    setIsLoading(true);
    setErrorMsg('');
    try {
      const endpoint = syncMode === 'CAS_UPLOAD'
        ? `/investments/${familyId}/cas-commit`
        : `/investments/${familyId}/sync-pan/commit`;

      const res = await apiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          ownerName: selectedMember,
          panNumber: extractedPortfolio.pan || panNumber,
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
                isLight ? 'bg-[#FFF8F1] border border-[#DEC8B2] text-[#F05A28]' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-sm sm:text-base font-extrabold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                Mutual Fund & Demat Auto-Sync
              </h3>
              <p className={`text-[11px] ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                Extract real folios via CAMS, KFintech & Demat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl border transition-all ${
              isLight ? 'bg-[#FFF8F1] border-[#DEC8B2] text-[#634B3F] hover:text-[#1F1F1F]' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sync Mode Switcher (When on Step INPUT) */}
        {step === 'INPUT' && (
          <div className={`grid grid-cols-2 gap-1.5 p-1 rounded-2xl border ${
            isLight ? 'bg-[#EAD8C7] border-[#DEC8B2]' : 'bg-slate-800/80 border-slate-700'
          }`}>
            <button
              type="button"
              onClick={() => {
                setSyncMode('CAS_UPLOAD');
                setErrorMsg('');
              }}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                syncMode === 'CAS_UPLOAD'
                  ? isLight
                    ? 'bg-[#F05A28] text-white shadow-md'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : isLight
                    ? 'text-[#634B3F] hover:text-[#1F1F1F]'
                    : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CAMS Statement (Real)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSyncMode('PAN_OTP');
                setErrorMsg('');
              }}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                syncMode === 'PAN_OTP'
                  ? isLight
                    ? 'bg-[#F05A28] text-white shadow-md'
                    : 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md'
                  : isLight
                    ? 'text-[#634B3F] hover:text-[#1F1F1F]'
                    : 'text-slate-400 hover:text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>PAN & AA Sandbox</span>
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {/* ---------------- MODE 1: CAS STATEMENT UPLOAD ---------------- */}
        {step === 'INPUT' && syncMode === 'CAS_UPLOAD' && (
          <form onSubmit={handleParseCasFile} className="space-y-3.5">
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-[#4A3B32]' : 'text-slate-300'}`}>
                Select Portfolio Owner
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

            {/* Drag & Drop File Box */}
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-[#4A3B32]' : 'text-slate-300'}`}>
                Upload CAMS / KFintech / MF Central CAS Statement
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : selectedFile
                      ? isLight
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-emerald-500/50 bg-emerald-950/20'
                      : isLight
                        ? 'border-[#DEC8B2] bg-[#FFF8F1] hover:border-[#F05A28]'
                        : 'border-slate-700 bg-slate-800/60 hover:border-amber-400'
                }`}
                onClick={() => document.getElementById('cas-file-input')?.click()}
              >
                <input
                  id="cas-file-input"
                  type="file"
                  accept=".pdf,.csv,.xlsx,.xls,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2">
                  {selectedFile ? <FileText className="w-5 h-5 text-emerald-400" /> : <Upload className="w-5 h-5 text-emerald-400" />}
                </div>
                {selectedFile ? (
                  <div>
                    <div className={`text-xs font-bold truncate max-w-xs mx-auto ${isLight ? 'text-emerald-900' : 'text-emerald-300'}`}>
                      📄 {selectedFile.name}
                    </div>
                    <div className={`text-[10px] mt-0.5 ${isLight ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {(selectedFile.size / 1024).toFixed(1)} KB • Ready for AI extraction
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className={`text-xs font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                      Tap or drag CAMS CAS PDF / Excel / CSV here
                    </div>
                    <p className={`text-[10px] mt-1 max-w-xs mx-auto ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                      Supports CAMS Consolidated Account Statement, KFintech CAS, Zerodha Coin & Groww exports.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Optional Password field for protected CAMS PDF */}
            <div>
              <label className={`block text-xs font-bold mb-1 ${isLight ? 'text-[#4A3B32]' : 'text-slate-300'}`}>
                PDF Password (Your PAN Card Number)
              </label>
              <input
                type="text"
                placeholder="e.g. ABCDE1234F (Optional, if PDF is locked)"
                value={pdfPassword}
                onChange={(e) => setPdfPassword(e.target.value.toUpperCase())}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold uppercase outline-none ${
                  isLight
                    ? 'bg-[#FFF8F1] border-[#DEC8B2] text-[#1F1F1F] focus:border-[#F05A28]'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500'
                }`}
              />
              <p className={`text-[10px] mt-1 ${isLight ? 'text-[#8C7A6B]' : 'text-slate-400'}`}>
                CAMS protects CAS statements with your PAN (e.g. <code>ABCDE1234F</code>) as the default password.
              </p>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={isLoading || !selectedFile}
              className={`w-full py-3 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isLight ? 'bg-[#F05A28] hover:bg-[#E76F3C]' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
              } ${isLoading || !selectedFile ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI Extracting Exact Real Folios...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Extract Exact Real Mutual Funds</span>
                </>
              )}
            </button>

            {/* Helper Info */}
            <div className={`p-3 rounded-2xl border text-[11px] space-y-1.5 ${
              isLight ? 'bg-[#FFF8F1] border-[#DEC8B2] text-[#634B3F]' : 'bg-slate-800/40 border-slate-700/60 text-slate-400'
            }`}>
              <div className="font-bold flex items-center gap-1.5 text-xs">
                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>How to get your free CAMS / KFintech CAS:</span>
              </div>
              <p>
                1. Visit <a href="https://camsonline.com" target="_blank" rel="noreferrer" className="text-amber-500 font-semibold underline">camsonline.com</a> or <a href="https://mfcentral.com" target="_blank" rel="noreferrer" className="text-amber-500 font-semibold underline">mfcentral.com</a>.
              </p>
              <p>
                2. Enter your email and PAN &rarr; CAMS emails your consolidated statement PDF instantly.
              </p>
              <p>
                3. Upload the statement above to import all your funds in 1 second!
              </p>
            </div>
          </form>
        )}

        {/* ---------------- MODE 2: PAN & AA FLOW ---------------- */}
        {step === 'INPUT' && syncMode === 'PAN_OTP' && (
          <form onSubmit={handleInitiatePanSync} className="space-y-4">
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-[#4A3B32]' : 'text-slate-300'}`}>
                Portfolio Owner
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
            <div className="text-center space-y-2">
              <div className={`text-xs font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                Enter SEBI / CAMS Consent OTP
              </div>
              <p className={`text-[11px] ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                Verification code for registered mobile <span className="font-bold">{maskedPhone}</span>
              </p>
              <div
                onClick={() => setOtp('123456')}
                className={`cursor-pointer text-[11px] font-mono py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all select-none ${
                  isLight
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                    : 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/60'
                }`}
                title="Click to auto-fill OTP"
              >
                <span>⚡ Sandbox OTP:</span>
                <strong className="tracking-widest text-sm font-black underline">123456</strong>
                <span className="text-[10px] opacity-80">(Tap to auto-fill)</span>
              </div>
            </div>

            <div>
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                className={`w-full py-3 text-center text-xl font-bold tracking-[0.4em] rounded-xl border outline-none ${
                  isLight
                    ? 'bg-[#FFF8F1] border-[#DEC8B2] text-[#1F1F1F] focus:border-[#F05A28]'
                    : 'bg-slate-800 border-slate-700 text-emerald-400 focus:border-emerald-500'
                }`}
                autoFocus
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('INPUT')}
                className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold ${
                  isLight ? 'bg-[#FFF8F1] border-[#DEC8B2] text-[#634B3F]' : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                Back
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

        {/* STEP 3: PREVIEW EXTRACTED PORTFOLIO */}
        {step === 'PREVIEW' && extractedPortfolio && (
          <div className="space-y-4">
            {/* Portfolio Summary Card */}
            <div className={`p-4 rounded-2xl border space-y-2 ${
              isLight
                ? 'bg-[#FFF8F1] border-[#EAD6C4]'
                : 'bg-slate-900/90 border-slate-800'
            }`}>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-bold ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                  Portfolio Owner: <strong className={isLight ? 'text-[#1F1F1F]' : 'text-white'}>{extractedPortfolio.ownerName || selectedMember}</strong>
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                  isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}>
                  {extractedPortfolio.schemes?.length || 0} Real Folios Found
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/40">
                <div>
                  <div className={`text-[10px] ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>Total Valuation</div>
                  <div className={`text-base font-black ${isLight ? 'text-[#2E7D32]' : 'text-emerald-400'}`}>
                    {formatCurrency(extractedPortfolio.totalCurrentValue)}
                  </div>
                </div>
                <div>
                  <div className={`text-[10px] ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>Invested (Cost)</div>
                  <div className={`text-xs font-bold mt-1 ${isLight ? 'text-[#1F1F1F]' : 'text-slate-200'}`}>
                    {formatCurrency(extractedPortfolio.totalInvested)}
                  </div>
                </div>
              </div>
            </div>

            {/* Scheme List Scroll */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {extractedPortfolio.schemes?.map((s: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    isLight ? 'bg-[#FFF8F1] border-[#DEC8B2]' : 'bg-slate-800/80 border-slate-700'
                  }`}
                >
                  <div className="overflow-hidden mr-2">
                    <div className={`font-bold truncate ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                      {s.schemeName}
                    </div>
                    <div className={`text-[10px] truncate mt-0.5 ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                      {s.amc} • Folio: {s.folioNumber}
                    </div>
                    <div className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-[#2E7D32]' : 'text-emerald-400'}`}>
                      Units: {s.units?.toLocaleString('en-IN')} {s.nav > 0 ? `• NAV: ₹${s.nav}` : ''}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`font-bold ${isLight ? 'text-[#2E7D32]' : 'text-emerald-400'}`}>
                      {formatCurrency(s.currentValue)}
                    </div>
                    <div className={`text-[10px] ${isLight ? 'text-[#8C7A6B]' : 'text-slate-400'}`}>
                      Inv: {formatCurrency(s.investedAmount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep('INPUT')}
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
              All real mutual fund folios have been saved to your family net worth and asset allocation.
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
