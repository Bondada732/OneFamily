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
  Mail,
  Smartphone,
  DownloadCloud,
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
  const [activeTab, setActiveTab] = useState<'REQUEST_CAMS' | 'UPLOAD_CAS'>('REQUEST_CAMS');
  const [step, setStep] = useState<'INPUT' | 'PREVIEW' | 'SUCCESS'>('INPUT');
  
  // User Input State
  const [panNumber, setPanNumber] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [phone, setPhone] = useState('9876543210');
  const [selectedMember, setSelectedMember] = useState(currentUserName);

  // CAS File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [pdfPassword, setPdfPassword] = useState<string>('');
  const [rawTextContent, setRawTextContent] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  // Common State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
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

  // 1. Request Official CAMS Statement
  const handleRequestCamsOnline = async (portal: 'CAMS' | 'MFCENTRAL' | 'KFINTECH') => {
    const cleanPan = panNumber.trim().toUpperCase();
    if (!cleanPan || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
      setErrorMsg('Please enter a valid 10-character PAN number (e.g. ABCDE1234F) before requesting statement');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      let targetUrl = 'https://www.camsonline.com/Investors/Statements/Consolidated-Account-Statement';
      if (portal === 'MFCENTRAL') {
        targetUrl = 'https://app.mfcentral.com/investor/signin';
      } else if (portal === 'KFINTECH') {
        targetUrl = 'https://mfs.kfintech.com/investor/General/ConsolidatedAccountStatement.aspx';
      }

      // Log request on backend
      await apiCall(`/investments/${familyId}/cams-request`, {
        method: 'POST',
        body: JSON.stringify({
          panNumber: cleanPan,
          email: userEmail || 'investor@cams.com',
          phone,
          memberName: selectedMember,
        }),
      });

      // Open official portal in new tab for direct OTP verification
      window.open(targetUrl, '_blank');
      setPdfPassword(cleanPan);
      setSuccessMsg(
        `Official ${portal} portal opened! Enter your OTP on CAMS to receive your CAS PDF, then upload it on the next tab.`
      );
      // Automatically switch to upload tab after 2.5 seconds
      setTimeout(() => {
        setActiveTab('UPLOAD_CAS');
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error connecting to CAMS request service');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Submit CAS Statement for AI Parsing
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
          pdfPassword: pdfPassword.trim() || panNumber.trim().toUpperCase(),
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

  // 3. Commit Extracted Schemes to Family Wealth
  const handleCommitPortfolio = async () => {
    if (!extractedPortfolio || !extractedPortfolio.schemes) return;

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await apiCall(`/investments/${familyId}/cas-commit`, {
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
                CAMS & MF Central Auto-Sync
              </h3>
              <p className={`text-[11px] ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                Mobile OTP authenticated CAS portfolio extraction
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

        {/* Tab Switcher (When on Step INPUT) */}
        {step === 'INPUT' && (
          <div className={`grid grid-cols-2 gap-1.5 p-1 rounded-2xl border ${
            isLight ? 'bg-[#EAD8C7] border-[#DEC8B2]' : 'bg-slate-800/80 border-slate-700'
          }`}>
            <button
              type="button"
              onClick={() => {
                setActiveTab('REQUEST_CAMS');
                setErrorMsg('');
              }}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'REQUEST_CAMS'
                  ? isLight
                    ? 'bg-[#F05A28] text-white shadow-md'
                    : 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md'
                  : isLight
                    ? 'text-[#634B3F] hover:text-[#1F1F1F]'
                    : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>1. Request via OTP</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('UPLOAD_CAS');
                setErrorMsg('');
              }}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'UPLOAD_CAS'
                  ? isLight
                    ? 'bg-[#F05A28] text-white shadow-md'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : isLight
                    ? 'text-[#634B3F] hover:text-[#1F1F1F]'
                    : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>2. Import Statement PDF</span>
            </button>
          </div>
        )}

        {/* Alert Messages */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 text-xs flex items-start gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{successMsg}</div>
          </div>
        )}

        {/* ---------------- TAB 1: 1-CLICK REQUEST CAMS STATEMENT VIA OTP ---------------- */}
        {step === 'INPUT' && activeTab === 'REQUEST_CAMS' && (
          <div className="space-y-3.5">
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
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold tracking-wider uppercase outline-none transition-all ${
                  isLight
                    ? 'bg-[#FFF8F1] border-[#DEC8B2] text-[#1F1F1F] focus:border-[#F05A28]'
                    : 'bg-slate-800 border-slate-700 text-emerald-400 focus:border-emerald-500'
                }`}
                required
              />
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-[#4A3B32]' : 'text-slate-300'}`}>
                Registered Email ID (for CAS Delivery)
              </label>
              <input
                type="email"
                placeholder="your.email@example.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none ${
                  isLight
                    ? 'bg-[#FFF8F1] border-[#DEC8B2] text-[#1F1F1F]'
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
              <p className={`text-[10px] mt-1 ${isLight ? 'text-[#8C7A6B]' : 'text-slate-400'}`}>
                CAMS delivers your full consolidated account statement PDF to this email in 1 minute.
              </p>
            </div>

            {/* Direct Official CAMS / MF Central Trigger Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleRequestCamsOnline('CAMS')}
                disabled={isLoading}
                className={`w-full py-3 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isLight
                    ? 'bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-700 hover:to-indigo-700'
                    : 'bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500'
                }`}
              >
                <DownloadCloud className="w-4 h-4" />
                <span>1-Click Request from CAMS Online</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>

              <button
                type="button"
                onClick={() => handleRequestCamsOnline('MFCENTRAL')}
                disabled={isLoading}
                className={`w-full py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isLight
                    ? 'bg-[#FFF8F1] hover:bg-amber-100 text-[#1F1F1F] border-[#DEC8B2]'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Request from MF Central (Live Mobile OTP)</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </button>
            </div>

            {/* 3 Step Instruction Card */}
            <div className={`p-3 rounded-2xl border text-[11px] space-y-1.5 ${
              isLight ? 'bg-[#FFF8F1] border-[#DEC8B2] text-[#634B3F]' : 'bg-slate-800/40 border-slate-700/60 text-slate-300'
            }`}>
              <div className="font-bold flex items-center gap-1.5 text-xs text-amber-500">
                <Check className="w-4 h-4" />
                <span>How the CAMS Mobile OTP Flow works:</span>
              </div>
              <p>1. Tapping the button above opens official CAMS/MF Central.</p>
              <p>2. Enter the OTP sent to your phone &rarr; CAMS generates your detailed CAS PDF.</p>
              <p>3. Drop the PDF in Tab 2 below &rarr; KinoraOne AI extracts all your funds in 1 second!</p>
            </div>
          </div>
        )}

        {/* ---------------- TAB 2: IMPORT RECEIVED CAS PDF ---------------- */}
        {step === 'INPUT' && activeTab === 'UPLOAD_CAS' && (
          <form onSubmit={handleParseCasFile} className="space-y-3.5">
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

            {/* Drag & Drop File Box */}
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-[#4A3B32]' : 'text-slate-300'}`}>
                Select Received CAMS / KFintech Statement PDF
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
                      Tap or drop your CAMS CAS PDF here
                    </div>
                    <p className={`text-[10px] mt-1 max-w-xs mx-auto ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                      Also supports KFintech CAS, MF Central statements & Zerodha/Groww exports.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Optional Password field */}
            <div>
              <label className={`block text-xs font-bold mb-1 ${isLight ? 'text-[#4A3B32]' : 'text-slate-300'}`}>
                PDF Password (Your PAN Card Number)
              </label>
              <input
                type="text"
                placeholder="e.g. ABCDE1234F (Optional)"
                value={pdfPassword || panNumber}
                onChange={(e) => setPdfPassword(e.target.value.toUpperCase())}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold uppercase outline-none ${
                  isLight
                    ? 'bg-[#FFF8F1] border-[#DEC8B2] text-[#1F1F1F] focus:border-[#F05A28]'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500'
                }`}
              />
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
          </form>
        )}

        {/* STEP 2: PREVIEW EXTRACTED REAL PORTFOLIO */}
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

        {/* STEP 3: SUCCESS */}
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
