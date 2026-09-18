import React, { useState, useEffect } from 'react';
import { ShieldCheck, Heart, Users, Sparkles, TrendingUp, FolderLock, ArrowRight, Check, Plus, KeyRound, LogIn, Copy, Share2, CheckCircle2, UserPlus, Sparkle, AlertCircle, Mail, RotateCcw, ArrowLeft, Send, Wifi, Server, Settings, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { getApiHost, setCustomApiHost, testServerConnection, DEFAULT_SERVER_URL } from '../../utils/api.js';

interface OnboardingViewProps {
  onComplete: () => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
  const { registerHead, joinFamily, login, sendRegistrationOtp, verifyRegistrationOtp, family } = useAuth();
  const [mode, setMode] = useState<'SIGN_IN' | 'REGISTER_HEAD' | 'VERIFY_HEAD_OTP' | 'JOIN_FAMILY' | 'SUCCESS_KEY' | 'SLIDES'>('SIGN_IN');
  
  // Server connection configuration state
  const [showServerModal, setShowServerModal] = useState(false);
  const [serverHostInput, setServerHostInput] = useState(getApiHost());
  const [serverTestStatus, setServerTestStatus] = useState<{ testing: boolean; success?: boolean; latencyMs?: number; error?: string }>({ testing: false });

  const handleTestConnection = async (hostToTest?: string) => {
    const target = hostToTest || serverHostInput;
    setServerTestStatus({ testing: true });
    const res = await testServerConnection(target);
    setServerTestStatus({
      testing: false,
      success: res.success,
      latencyMs: res.latencyMs,
      error: res.error,
    });
  };

  const handleSaveServerHost = () => {
    setCustomApiHost(serverHostInput);
    setShowServerModal(false);
    setSignInError('');
  };

  const handleResetServerHost = () => {
    setServerHostInput(DEFAULT_SERVER_URL);
    setCustomApiHost(DEFAULT_SERVER_URL);
    setServerTestStatus({ testing: false });
  };
  
  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPin, setSignInPin] = useState('');
  const [signInError, setSignInError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register Head state
  const [headForm, setHeadForm] = useState({
    familyName: '',
    headName: '',
    headEmail: '',
    pinCode: '1234',
    relationship: 'Father / Family Head',
    currency: 'INR',
    location: 'India',
  });
  const [headError, setHeadError] = useState('');
  const [createdKey, setCreatedKey] = useState('');
  const [copied, setCopied] = useState(false);

  // Email OTP state
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [isResending, setIsResending] = useState(false);

  // Join Member state
  const [joinForm, setJoinForm] = useState({
    familyKey: '',
    name: '',
    email: '',
    pinCode: '1234',
    relationship: 'Spouse',
    role: 'SPOUSE',
  });
  const [joinError, setJoinError] = useState('');

  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: 'Welcome to One Family',
      subtitle: 'One Home. One Family. One Future.',
      description: 'The private Family Operating System that brings together your members, finances, vault, memories, and AI assistant.',
      icon: Heart,
      color: 'from-amber-400 to-rose-500',
    },
    {
      title: 'Manage Your Family',
      subtitle: 'Roles, Permissions & Family Tree',
      description: 'Empower parents, co-admins, grandparents, and children with tailored role-based access to family records.',
      icon: Users,
      color: 'from-indigo-500 to-blue-600',
    },
    {
      title: 'Secure Digital Vault',
      subtitle: 'Aadhaar, PAN & Insurance Policies',
      description: 'Store government IDs, property deeds, and medical cards with OCR scanning and automated renewal reminders.',
      icon: FolderLock,
      color: 'from-amber-500 to-yellow-600',
    },
    {
      title: "Plan Your Family's Wealth",
      subtitle: 'Expenses, Budgets & Net Worth',
      description: 'Track mutual funds, SIPs, fixed deposits, gold, and calculate family net worth while budgeting for what matters.',
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Meet Family AI Assistant',
      subtitle: 'Private, Context-Aware & Empathetic',
      description: 'Ask questions about grocery spending, insurance due dates, trip packing lists, and personalized gift suggestions.',
      icon: Sparkles,
      color: 'from-purple-500 to-indigo-600',
    },
  ];

  // Countdown timer effect for OTP resend
  useEffect(() => {
    let timer: any;
    if (mode === 'VERIFY_HEAD_OTP' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mode, countdown]);

  // 1. Handle Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError('');
    if (!signInEmail.trim()) {
      setSignInError('Please enter your email or PIN.');
      return;
    }
    setIsSubmitting(true);
    const result = await login(signInEmail.trim(), signInPin.trim());
    setIsSubmitting(false);
    if (result.success) {
      onComplete();
    } else {
      setSignInError(result.error || 'Invalid credentials. (Demo PIN: 1234)');
    }
  };

  // Quick Demo Login helper
  const handleQuickDemo = async (email: string) => {
    setIsSubmitting(true);
    setSignInError('');
    const result = await login(email, '1234');
    setIsSubmitting(false);
    if (result.success) {
      onComplete();
    } else {
      setSignInError('Demo login failed. Please try again.');
    }
  };

  // 2. Handle Send Registration OTP (Initiates Family Creation)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setHeadError('');
    if (!headForm.familyName.trim() || !headForm.headName.trim()) {
      setHeadError('Family Name and Family Head Name are required.');
      return;
    }
    if (!headForm.headEmail.trim()) {
      setHeadError('Family Head Email Address is required for OTP verification.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(headForm.headEmail.trim())) {
      setHeadError('Please enter a valid email format (e.g. name@example.com).');
      return;
    }
    if (headForm.pinCode.length !== 4) {
      setHeadError('PIN code must be exactly 4 digits.');
      return;
    }

    setIsSubmitting(true);
    const result = await sendRegistrationOtp(
      headForm.headEmail.trim(),
      headForm.familyName.trim(),
      headForm.headName.trim()
    );
    setIsSubmitting(false);

    if (result.success) {
      setDevOtp(result.devOtp || null);
      setOtp('');
      setOtpError('');
      setCountdown(30);
      setMode('VERIFY_HEAD_OTP');
    } else {
      setHeadError(result.error || 'Failed to send OTP verification email.');
    }
  };

  // 2b. Handle Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    setOtpError('');
    const result = await sendRegistrationOtp(
      headForm.headEmail.trim(),
      headForm.familyName.trim(),
      headForm.headName.trim()
    );
    setIsResending(false);
    if (result.success) {
      setDevOtp(result.devOtp || null);
      setCountdown(30);
    } else {
      setOtpError(result.error || 'Failed to resend OTP code.');
    }
  };

  // 2c. Handle Verify OTP and Complete Registration
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    if (otp.trim().length !== 6) {
      setOtpError('Please enter the full 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    const result = await verifyRegistrationOtp(otp.trim(), {
      ...headForm,
      headEmail: headForm.headEmail.trim().toLowerCase(),
    });
    setIsSubmitting(false);

    if (result.success && result.familyKey) {
      setCreatedKey(result.familyKey);
      setMode('SUCCESS_KEY');
    } else if (result.success) {
      onComplete();
    } else {
      setOtpError(result.error || 'Invalid or expired verification code.');
    }
  };

  // 3. Handle Join Family Member
  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    if (!joinForm.familyKey.trim() || !joinForm.name.trim()) {
      setJoinError('Family Key and your name are required.');
      return;
    }
    if (joinForm.pinCode.length !== 4) {
      setJoinError('PIN code must be exactly 4 digits.');
      return;
    }

    setIsSubmitting(true);
    const result = await joinFamily({
      ...joinForm,
      familyKey: joinForm.familyKey.trim().toUpperCase(),
    });
    setIsSubmitting(false);

    if (result.success) {
      onComplete();
    } else {
      setJoinError(result.error || 'Failed to join family. Please verify the Family Key.');
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = (key: string, familyName: string) => {
    const text = `Join our family space "${familyName}" on Famora! Use Family Secret Key: *${key}* to sign up and join.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // SUCCESS KEY MODAL / SCREEN (After Family Head Creates Account)
  if (mode === 'SUCCESS_KEY') {
    return (
      <div className="p-6 space-y-6 animate-fade-in text-white min-h-full flex flex-col justify-between">
        <div className="space-y-6 pt-4 text-center">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 mx-auto flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Family Created Successfully!</span>
            <h2 className="text-2xl font-extrabold tracking-tight">{headForm.familyName || 'Your Family'}</h2>
            <p className="text-xs text-slate-300 max-w-xs mx-auto pt-1">
              Here is your private **Family Secret Key**. Share this key with your spouse, children, and elders so they can join your family space.
            </p>
          </div>

          {/* Key Card */}
          <div className="p-5 rounded-3xl bg-slate-800/90 border-2 border-amber-500/50 shadow-2xl space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Family Secret Key</span>
            <div className="text-2xl font-black font-mono tracking-widest text-amber-400 bg-slate-900/90 py-3.5 px-4 rounded-2xl border border-slate-700 select-all">
              {createdKey}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleCopyKey(createdKey)}
                className="flex-1 py-2.5 px-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                <span>{copied ? 'Copied Key!' : 'Copy Key'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleWhatsAppShare(createdKey, headForm.familyName)}
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share WhatsApp</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl text-[11px] text-indigo-300 text-left space-y-1">
            <p className="font-semibold">💡 What happens next?</p>
            <p className="text-slate-300">
              When family members enter this key during sign-up, they will immediately appear in your <strong>Family Hub &gt; Members</strong> list with tailored role access!
            </p>
          </div>
        </div>

        <button
          onClick={onComplete}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/30 text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <span>Enter Family Hub</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 pt-safe-mobile space-y-5 animate-fade-in text-white min-h-full flex flex-col justify-between">
      {/* Brand Header */}
      <div className="text-center space-y-1 pt-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30 p-0.5">
          <div className="w-full h-full bg-slate-900/60 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Heart className="w-6 h-6 text-amber-300 fill-amber-300/30" />
          </div>
        </div>
        <h1 className="text-xl font-extrabold tracking-tight">ONE FAMILY</h1>
        <p className="text-xs text-slate-400">One Home. One Family. One Future.</p>
      </div>

      {/* Segmented Mode Selector */}
      <div className="flex bg-slate-800/90 p-1 rounded-2xl border border-slate-700/80 shadow-inner">
        <button
          onClick={() => { setMode('SIGN_IN'); setSignInError(''); }}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            mode === 'SIGN_IN'
              ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => { setMode('REGISTER_HEAD'); setHeadError(''); }}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            mode === 'REGISTER_HEAD'
              ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Create Family
        </button>
        <button
          onClick={() => { setMode('JOIN_FAMILY'); setJoinError(''); }}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            mode === 'JOIN_FAMILY'
              ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Join with Key
        </button>
      </div>

      {/* 1. SIGN IN MODE */}
      {mode === 'SIGN_IN' && (
        <div className="space-y-4 animate-fade-in">
          <div className="text-center space-y-0.5">
            <h2 className="text-base font-bold text-white">Sign In to Your Family</h2>
            <p className="text-[11px] text-slate-400">Enter your family email address or 4-digit PIN</p>
          </div>

          {signInError && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{signInError}</span>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-300">Email Address or Member Name</label>
              <input
                type="text"
                required
                placeholder="e.g. raj.sharma@example.com"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">4-Digit App PIN</label>
              <input
                type="password"
                maxLength={4}
                placeholder="••••"
                value={signInPin}
                onChange={(e) => setSignInPin(e.target.value)}
                className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-amber-400 outline-none tracking-widest font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/30 text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
            </button>

            {/* Switch to Create Family Link */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => { setMode('REGISTER_HEAD'); setHeadError(''); }}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors"
              >
                Want to start a new family? <span className="underline font-bold">Create Family</span>
              </button>
            </div>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">
              Quick Logins
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('rambabub789@gmail.com')}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-amber-500/40 text-left transition-all flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs">
                  R
                </div>
                <div>
                  <div className="text-[11px] font-bold text-white leading-tight">Rambabu</div>
                  <div className="text-[9px] text-amber-400">Family Head (Ram's)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('raj.sharma@example.com')}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-left transition-all flex items-center gap-2"
              >
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" className="w-7 h-7 rounded-lg object-cover" alt="Raj" />
                <div>
                  <div className="text-[11px] font-bold text-white leading-tight">Raj Sharma</div>
                  <div className="text-[9px] text-slate-400">Sharma Family</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CREATE FAMILY (REGISTER HEAD) MODE */}
      {mode === 'REGISTER_HEAD' && (
        <div className="space-y-3.5 animate-fade-in">
          {/* Step Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950 shadow-sm">
              Step 1 of 2
            </span>
            <span className="text-[11px] font-semibold text-slate-400">Enter Family Details</span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className="text-[11px] text-slate-500">2. Verify OTP</span>
          </div>

          <div className="text-center space-y-0.5">
            <h2 className="text-base font-bold text-white">Create a New Family Account</h2>
            <p className="text-[11px] text-slate-400">Enter your details below to receive a 6-digit verification code on your email</p>
          </div>

          {headError && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{headError}</span>
            </div>
          )}

          <form onSubmit={handleSendOtp} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300">Family Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Verma Family / Reddy Household"
                value={headForm.familyName}
                onChange={(e) => setHeadForm({ ...headForm, familyName: e.target.value })}
                className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-amber-400 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-300">Family Head Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Verma"
                  value={headForm.headName}
                  onChange={(e) => setHeadForm({ ...headForm, headName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Head Relationship</label>
                <select
                  value={headForm.relationship}
                  onChange={(e) => setHeadForm({ ...headForm, relationship: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                >
                  <option value="Father / Family Head">Father / Head</option>
                  <option value="Mother / Family Head">Mother / Head</option>
                  <option value="Self / Family Head">Self / Head</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-300">
                  Head Email <span className="text-amber-400 font-bold">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="head@example.com"
                  value={headForm.headEmail}
                  onChange={(e) => setHeadForm({ ...headForm, headEmail: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">4-Digit App PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="1234"
                  value={headForm.pinCode}
                  onChange={(e) => setHeadForm({ ...headForm, pinCode: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400 tracking-widest font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/30 text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
            >
              <Mail className="w-4 h-4" />
              <span>{isSubmitting ? 'Sending Verification Code...' : 'Verify Email & Create Family'}</span>
            </button>
          </form>
        </div>
      )}

      {/* 2b. VERIFY HEAD EMAIL OTP SCREEN */}
      {mode === 'VERIFY_HEAD_OTP' && (
        <div className="space-y-4 animate-fade-in text-slate-200">
          {/* Step Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-[11px] text-slate-500">1. Details</span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500 text-white shadow-sm">
              Step 2 of 2
            </span>
            <span className="text-[11px] font-semibold text-amber-300">Enter OTP</span>
          </div>

          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 mx-auto flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10 mb-2">
              <Mail className="w-6 h-6 animate-bounce" />
            </div>
            <h2 className="text-lg font-bold text-white">Verify Your Email Address</h2>
            <p className="text-xs text-slate-300">
              We sent a 6-digit verification code to:
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800/90 rounded-full border border-slate-700 mt-1">
              <span className="text-xs font-semibold text-amber-300 font-mono">{headForm.headEmail}</span>
              <button
                type="button"
                onClick={() => { setMode('REGISTER_HEAD'); setHeadError(''); }}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold underline"
              >
                Change
              </button>
            </div>
          </div>

          {/* Dev Mode Helper Banner */}
          {devOtp && (
            <div className="p-2.5 bg-indigo-950/60 border border-indigo-500/40 rounded-xl text-center space-y-1">
              <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                ⚡ Development Preview OTP
              </div>
              <button
                type="button"
                onClick={() => setOtp(devOtp)}
                className="text-sm font-mono font-bold tracking-widest text-amber-400 bg-slate-900 px-3 py-1 rounded-lg border border-indigo-500/30 hover:bg-slate-800 transition-colors"
                title="Click to Auto-fill"
              >
                {devOtp} (Click to Auto-fill)
              </button>
            </div>
          )}

          {otpError && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{otpError}</span>
            </div>
          )}

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block text-center mb-1.5">
                Enter 6-Digit OTP Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                autoFocus
                placeholder="• • • • • •"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                className="w-full py-3.5 bg-slate-900 border-2 border-amber-500/60 rounded-2xl text-center text-2xl font-mono font-black tracking-[0.5em] text-amber-400 placeholder-slate-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all shadow-inner"
              />
            </div>

            {/* Resend OTP & Countdown */}
            <div className="flex items-center justify-between px-1 text-xs">
              <button
                type="button"
                onClick={() => { setMode('REGISTER_HEAD'); setHeadError(''); }}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                disabled={countdown > 0 || isResending}
                onClick={handleResendOtp}
                className={`flex items-center gap-1.5 font-semibold transition-colors ${
                  countdown > 0 || isResending
                    ? 'text-slate-500 cursor-not-allowed'
                    : 'text-amber-400 hover:text-amber-300 cursor-pointer'
                }`}
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                <span>
                  {isResending
                    ? 'Resending...'
                    : countdown > 0
                    ? `Resend in ${countdown}s`
                    : 'Resend Code'}
                </span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || otp.length !== 6}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/30 text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Verifying...' : 'Verify OTP & Create Family Space'}</span>
            </button>
          </form>
        </div>
      )}

      {/* 3. JOIN FAMILY (WITH KEY) MODE */}
      {mode === 'JOIN_FAMILY' && (
        <div className="space-y-3.5 animate-fade-in">
          <div className="text-center space-y-0.5">
            <h2 className="text-base font-bold text-white">Join Family with Secret Key</h2>
            <p className="text-[11px] text-slate-400">Enter the invitation key shared by your Family Head</p>
          </div>

          {joinError && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{joinError}</span>
            </div>
          )}

          <form onSubmit={handleJoinFamily} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300">Family Secret Key</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={16}
                  placeholder="e.g. FAM-8492 or FAM-SHARMA-01"
                  value={joinForm.familyKey}
                  onChange={(e) => setJoinForm({ ...joinForm, familyKey: e.target.value.toUpperCase() })}
                  className="w-full mt-1 px-4 py-3 bg-slate-800 border-2 border-amber-500/50 rounded-xl text-center text-base font-mono font-bold tracking-widest text-amber-400 placeholder-slate-500 focus:border-amber-400 outline-none uppercase"
                />
                <KeyRound className="w-4 h-4 text-amber-400/60 absolute left-3 top-4" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Ask your Family Head for their family key shown on their Family Hub screen.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-300">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya / Aarav"
                  value={joinForm.name}
                  onChange={(e) => setJoinForm({ ...joinForm, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Relationship to Head</label>
                <select
                  value={joinForm.relationship}
                  onChange={(e) => setJoinForm({ ...joinForm, relationship: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                >
                  <option value="Spouse">Spouse / Wife / Husband</option>
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Mother / Grandmother">Grandmother</option>
                  <option value="Father / Grandfather">Grandfather</option>
                  <option value="Brother">Brother</option>
                  <option value="Sister">Sister</option>
                  <option value="Family Member">Other Member</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-300">Your Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={joinForm.email}
                  onChange={(e) => setJoinForm({ ...joinForm, email: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">4-Digit App PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="1234"
                  value={joinForm.pinCode}
                  onChange={(e) => setJoinForm({ ...joinForm, pinCode: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400 tracking-widest font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Family Role</label>
              <div className="grid grid-cols-4 gap-1.5 mt-1">
                {[
                  { id: 'SPOUSE', label: 'Spouse' },
                  { id: 'ADULT', label: 'Adult' },
                  { id: 'CHILD', label: 'Child/Teen' },
                  { id: 'VIEWER', label: 'Elder' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setJoinForm({ ...joinForm, role: r.id })}
                    className={`py-1.5 px-2 rounded-xl border text-[11px] font-semibold transition-all ${
                      joinForm.role === r.id
                        ? 'bg-indigo-600/30 border-indigo-500 text-white'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/30 text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isSubmitting ? 'Joining Family...' : 'Verify Key & Join Family'}</span>
            </button>
          </form>
        </div>
      )}

      {/* 4. SLIDES / FEATURE WALKTHROUGH */}
      {mode === 'SLIDES' && (
        <div className="space-y-4 animate-fade-in flex-1 flex flex-col justify-between py-2">
          {/* Visual card */}
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
            <div className={`w-24 h-24 rounded-3xl bg-gradient-to-tr ${slides[currentSlide].color} p-0.5 shadow-2xl flex items-center justify-center ring-8 ring-slate-800/50`}>
              <div className="w-full h-full bg-slate-900/40 rounded-3xl backdrop-blur-sm flex items-center justify-center">
                {React.createElement(slides[currentSlide].icon, { className: 'w-12 h-12 text-white drop-shadow' })}
              </div>
            </div>

            <div className="space-y-1.5 max-w-xs">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">{slides[currentSlide].subtitle}</span>
              <h2 className="text-xl font-extrabold text-white tracking-tight">{slides[currentSlide].title}</h2>
              <p className="text-xs text-slate-400 leading-relaxed">{slides[currentSlide].description}</p>
            </div>

            {/* Dots */}
            <div className="flex gap-1.5 pt-2">
              {slides.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    currentSlide === i ? 'w-6 bg-amber-400' : 'w-2 bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode('REGISTER_HEAD')}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-bold rounded-2xl text-xs shadow-lg"
              >
                Create Family
              </button>
              <button
                onClick={() => setMode('JOIN_FAMILY')}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl border border-slate-700 text-xs"
              >
                Join with Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Server Connection Badge */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={() => {
            setShowServerModal(true);
            handleTestConnection();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[10px] text-slate-400 hover:text-white hover:border-[#16C7F2]/40 transition-all cursor-pointer shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Server:</span>
          <span className="text-[#16C7F2] font-mono">{getApiHost().replace(/^https?:\/\//, '')}</span>
          <Settings className="w-3 h-3 text-slate-400 ml-0.5" />
        </button>
      </div>

      {/* Bottom Footer Info */}
      <div className="pt-2 text-center">
        {mode !== 'SLIDES' ? (
          <button
            onClick={() => setMode('SLIDES')}
            className="text-[11px] text-amber-400 hover:underline font-semibold"
          >
            ✨ Explore App Features & Walkthrough →
          </button>
        ) : (
          <button
            onClick={() => setMode('SIGN_IN')}
            className="text-[11px] text-slate-400 hover:text-white"
          >
            ← Back to Sign In
          </button>
        )}
      </div>

      {/* Server Settings Modal */}
      {showServerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0D152D] border border-slate-700/80 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#16C7F2]/15 border border-[#16C7F2]/30 flex items-center justify-center text-[#16C7F2]">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Backend Server Host</h3>
                  <p className="text-[10px] text-slate-400">Configure PC Wi-Fi IP for phone sync</p>
                </div>
              </div>
              <button
                onClick={() => setShowServerModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-semibold">Server URL (PC IP Address & Port)</label>
              <input
                type="text"
                value={serverHostInput}
                onChange={(e) => {
                  setServerHostInput(e.target.value);
                  setServerTestStatus({ testing: false });
                }}
                placeholder="http://10.160.2.158:4000"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono placeholder-slate-600 focus:border-[#16C7F2] outline-none"
              />
              <p className="text-[10px] text-slate-400">
                Make sure your phone is connected to the same Wi-Fi network as your computer.
              </p>
            </div>

            {/* Test Connection Results */}
            {serverTestStatus.testing ? (
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#16C7F2]" />
                <span>Pinging server at {serverHostInput}...</span>
              </div>
            ) : serverTestStatus.success === true ? (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Connected successfully! Latency: {serverTestStatus.latencyMs}ms</span>
              </div>
            ) : serverTestStatus.error ? (
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{serverTestStatus.error}</span>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleTestConnection()}
                disabled={serverTestStatus.testing}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${serverTestStatus.testing ? 'animate-spin' : ''}`} />
                <span>Test Ping</span>
              </button>
              <button
                type="button"
                onClick={handleSaveServerHost}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#16C7F2] to-indigo-600 hover:opacity-95 text-xs font-bold text-white shadow-md flex items-center justify-center gap-1.5 transition-opacity"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Host</span>
              </button>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={handleResetServerHost}
                className="text-[10px] text-slate-400 hover:text-slate-300 underline"
              >
                Reset to Default ({DEFAULT_SERVER_URL})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
