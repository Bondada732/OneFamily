import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, ArrowRight, Check, KeyRound, Copy, Share2, CheckCircle2, AlertCircle, Mail, RotateCcw, ArrowLeft, Lock, Eye, EyeOff, Shield, Server, Settings, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { getApiHost, setCustomApiHost, testServerConnection, DEFAULT_SERVER_URL } from '../../utils/api.js';

interface OnboardingViewProps {
  onComplete: () => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
  const { registerHead, joinFamily, login, sendRegistrationOtp, verifyRegistrationOtp } = useAuth();
  const [mode, setMode] = useState<'SIGN_IN' | 'REGISTER_HEAD' | 'VERIFY_HEAD_OTP' | 'JOIN_FAMILY' | 'SUCCESS_KEY'>('SIGN_IN');
  
  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPin, setSignInPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signInError, setSignInError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Server connection configuration modal (accessible via discreet settings gear)
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
      setSignInError('Please enter your email or member name.');
      return;
    }
    setIsSubmitting(true);
    const result = await login(signInEmail.trim(), signInPin.trim());
    setIsSubmitting(false);
    if (result.success) {
      onComplete();
    } else {
      setSignInError(result.error || 'Invalid email or password. Please try again.');
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
    if (headForm.pinCode.length < 4) {
      setHeadError('PIN / Password must be at least 4 characters.');
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
    if (joinForm.pinCode.length < 4) {
      setJoinError('PIN code must be at least 4 digits.');
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
    const text = `Join our family space "${familyName}" on KinoraOne! Use Family Secret Key: *${key}* to sign up and join.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // SUCCESS KEY MODAL / SCREEN (After Family Head Creates Account)
  if (mode === 'SUCCESS_KEY') {
    return (
      <div className="min-h-screen bg-[#020817] text-white p-5 pt-safe-mobile flex flex-col justify-between animate-fade-in">
        <div className="space-y-6 pt-4 text-center max-w-sm mx-auto w-full">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 mx-auto flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Family Created Successfully!</span>
            <h2 className="text-2xl font-extrabold tracking-tight">{headForm.familyName || 'Your Family'}</h2>
            <p className="text-xs text-slate-300 max-w-xs mx-auto pt-1">
              Here is your private <strong className="text-white">Family Secret Key</strong>. Share this key with your spouse, children, and elders so they can join your family space.
            </p>
          </div>

          {/* Key Card */}
          <div className="p-5 rounded-3xl bg-[#061737]/90 border-2 border-cyan-500/40 shadow-2xl space-y-3">
            <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-widest block">Family Secret Key</span>
            <div className="text-2xl font-black font-mono tracking-widest text-[#16C7F2] bg-[#030c1d] py-3.5 px-4 rounded-2xl border border-cyan-500/30 select-all shadow-inner">
              {createdKey}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleCopyKey(createdKey)}
                className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
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

          <div className="p-3.5 bg-cyan-950/30 border border-cyan-500/25 rounded-2xl text-[11px] text-cyan-200 text-left space-y-1">
            <p className="font-semibold text-cyan-300">💡 What happens next?</p>
            <p className="text-slate-300">
              When family members enter this key during sign-up, they will immediately appear in your <strong>Family Hub &gt; Members</strong> list!
            </p>
          </div>
        </div>

        <div className="pb-6 max-w-sm mx-auto w-full">
          <button
            onClick={onComplete}
            className="w-full py-3.5 bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#06B6D4] hover:opacity-95 text-white font-bold rounded-2xl shadow-xl shadow-cyan-500/25 text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <span>Enter Family Hub</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020919] text-white flex flex-col selection:bg-cyan-500/30 overflow-x-hidden">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/15 via-[#030c1c] to-[#020713]" />

      {/* Discreet Floating Server Settings Button */}
      <button
        type="button"
        onClick={() => {
          setShowServerModal(true);
          handleTestConnection();
        }}
        aria-label="Server Settings"
        className="absolute top-safe right-3 z-30 mt-2 w-7 h-7 rounded-full bg-slate-950/40 backdrop-blur-md border border-slate-700/40 flex items-center justify-center text-slate-400 hover:text-cyan-300 transition-all opacity-60 hover:opacity-100 active:scale-95"
      >
        <Settings className="w-3.5 h-3.5" />
      </button>

      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col min-h-screen">
        {/* NON-SIGN_IN HEADER (For Create Family / Join with Key) */}
        {mode !== 'SIGN_IN' && (
          <header className="pt-safe-mobile px-5 pt-3 pb-2 flex items-center gap-2.5">
            <img
              src="/kinoraone-logo.png"
              alt="KinoraOne Logo"
              className="w-8 h-8 rounded-xl object-cover ring-1 ring-cyan-400/30 shadow-md shadow-cyan-500/20"
            />
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-black tracking-tight text-white">Kinora</span>
                <span className="text-sm font-black tracking-tight text-[#16C7F2]">One</span>
              </div>
              <p className="text-[9.5px] text-slate-400 font-medium tracking-wide">
                One Home. One Family. One Future.
              </p>
            </div>
          </header>
        )}

        {/* 1. HERO IMAGE SECTION (Full Edge-to-Edge with Integrated KinoraOne Logo & Family Art) */}
        {mode === 'SIGN_IN' && (
          <div className="relative w-full shrink-0">
            <img
              src="/assets/images/login-family-hero.png"
              alt="KinoraOne - One Home. One Family. One Future."
              className="w-full h-auto block object-contain"
            />
          </div>
        )}

        {/* 2. MAIN INTERACTIVE CONTAINER */}
        <main className={`w-full ${mode === 'SIGN_IN' ? '-mt-4 px-4 pb-8' : 'px-4 pb-8 mt-2'}`}>
          {/* ================= MODE: SIGN_IN ================= */}
          {mode === 'SIGN_IN' && (
            <div className="relative bg-[#06152F] border border-[#168BFF]/25 rounded-[32px] p-5 sm:p-6 shadow-2xl shadow-cyan-950/50 space-y-4 animate-fade-in">
              {/* Heading */}
              <div className="text-left space-y-1">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  Welcome{' '}
                  <span className="text-[#16C7F2]">
                    Back
                  </span>
                </h1>
                <p className="text-xs text-slate-300 font-normal">
                  Sign in to continue your family's financial journey.
                </p>
              </div>

              {/* Error Message */}
              {signInError && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/35 rounded-2xl text-xs text-rose-300 flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span className="leading-snug">{signInError}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSignIn} className="space-y-3.5">
                {/* Email / Member Name Input */}
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-[#16C7F2] absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="Email Address or Member Name"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 bg-[#020b18] border border-[#168BFF]/40 rounded-2xl text-xs text-white placeholder-slate-400 focus:border-[#16C7F2] focus:ring-1 focus:ring-[#16C7F2]/40 outline-none transition-all shadow-inner"
                  />
                </div>

                {/* Password / App PIN Input */}
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-[#16C7F2] absolute left-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Password"
                    value={signInPin}
                    onChange={(e) => setSignInPin(e.target.value)}
                    className="w-full pl-10 pr-10 py-3.5 bg-[#020b18] border border-[#168BFF]/40 rounded-2xl text-xs text-white placeholder-slate-400 focus:border-[#16C7F2] focus:ring-1 focus:ring-[#16C7F2]/40 outline-none transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-white transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-cyan-300/80" />}
                  </button>
                </div>

                {/* Primary Sign In Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-1.5 py-3.5 bg-gradient-to-r from-[#00A3FF] via-[#00C2FF] to-[#00E5FF] hover:opacity-90 text-[#021327] font-black rounded-2xl shadow-xl shadow-cyan-500/25 text-sm transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
                </button>
              </form>

              {/* OR Divider */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-slate-700/60" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OR</span>
                <div className="flex-1 h-px bg-slate-700/60" />
              </div>

              {/* Bottom Action Row on ONE SINGLE HORIZONTAL LINE */}
              <div className="flex items-center justify-center gap-4 py-1">
                <button
                  type="button"
                  onClick={() => { setMode('JOIN_FAMILY'); setJoinError(''); }}
                  className="text-xs font-bold text-cyan-300 hover:text-cyan-200 transition-colors flex items-center gap-1.5 active:scale-95"
                >
                  <KeyRound className="w-4 h-4 text-cyan-400" />
                  <span>Join with Key</span>
                </button>

                <span className="text-slate-600 font-light select-none">|</span>

                <button
                  type="button"
                  onClick={() => { setMode('REGISTER_HEAD'); setHeadError(''); }}
                  className="text-xs font-bold text-cyan-300 hover:text-cyan-200 transition-colors flex items-center gap-1.5 active:scale-95"
                >
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>Create Family</span>
                </button>
              </div>

              {/* Security Trust Message in Natural Flow (28-36px below buttons) */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <Shield className="w-3.5 h-3.5 text-cyan-400/80" />
                <span>Your data is safe with us</span>
              </div>
            </div>
          )}

          {/* ================= MODE: CREATE FAMILY (REGISTER HEAD) ================= */}
          {mode === 'REGISTER_HEAD' && (
            <div className="bg-[#061737]/85 backdrop-blur-xl border border-[#168BFF]/30 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-cyan-950/40 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setMode('SIGN_IN'); setHeadError(''); }}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Step 1 of 2
                </span>
              </div>

              <div className="text-left space-y-0.5">
                <h2 className="text-lg font-bold text-white tracking-tight">Create a New Family</h2>
                <p className="text-xs text-slate-400">Enter family details to receive a 6-digit OTP code on email</p>
              </div>

              {headError && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{headError}</span>
                </div>
              )}

              <form onSubmit={handleSendOtp} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Family Space Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Verma Family / Reddy Household"
                    value={headForm.familyName}
                    onChange={(e) => setHeadForm({ ...headForm, familyName: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-[#030E22]/90 border border-[#168BFF]/30 rounded-xl text-xs text-white placeholder-slate-500 focus:border-[#16C7F2] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Head Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Verma"
                      value={headForm.headName}
                      onChange={(e) => setHeadForm({ ...headForm, headName: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-[#030E22]/90 border border-[#168BFF]/30 rounded-xl text-xs text-white outline-none focus:border-[#16C7F2]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300">Relationship</label>
                    <select
                      value={headForm.relationship}
                      onChange={(e) => setHeadForm({ ...headForm, relationship: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-[#030E22]/90 border border-[#168BFF]/30 rounded-xl text-xs text-white outline-none focus:border-[#16C7F2]"
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
                      Email <span className="text-cyan-400 font-bold">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="head@example.com"
                      value={headForm.headEmail}
                      onChange={(e) => setHeadForm({ ...headForm, headEmail: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-[#030E22]/90 border border-[#168BFF]/30 rounded-xl text-xs text-white outline-none focus:border-[#16C7F2]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300">4-Digit PIN / Password</label>
                    <input
                      type="password"
                      maxLength={8}
                      required
                      placeholder="1234"
                      value={headForm.pinCode}
                      onChange={(e) => setHeadForm({ ...headForm, pinCode: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-[#030E22]/90 border border-[#168BFF]/30 rounded-xl text-xs text-white outline-none focus:border-[#16C7F2] tracking-widest font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#06B6D4] hover:opacity-95 text-white font-bold rounded-2xl shadow-xl shadow-cyan-500/25 text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
                >
                  <Mail className="w-4 h-4" />
                  <span>{isSubmitting ? 'Sending Verification Code...' : 'Verify Email & Create Family'}</span>
                </button>
              </form>
            </div>
          )}

          {/* ================= MODE: VERIFY HEAD EMAIL OTP ================= */}
          {mode === 'VERIFY_HEAD_OTP' && (
            <div className="bg-[#061737]/85 backdrop-blur-xl border border-[#168BFF]/30 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-cyan-950/40 space-y-4 animate-fade-in text-slate-200">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setMode('REGISTER_HEAD'); setHeadError(''); }}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Step 2 of 2
                </span>
              </div>

              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 mx-auto flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10 mb-2">
                  <Mail className="w-6 h-6 animate-bounce" />
                </div>
                <h2 className="text-lg font-bold text-white">Verify Your Email Address</h2>
                <p className="text-xs text-slate-300">
                  We sent a 6-digit verification code to:
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900/90 rounded-full border border-slate-700 mt-1">
                  <span className="text-xs font-semibold text-cyan-300 font-mono">{headForm.headEmail}</span>
                  <button
                    type="button"
                    onClick={() => { setMode('REGISTER_HEAD'); setHeadError(''); }}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold underline"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Dev Mode Helper Banner */}
              {devOtp && (
                <div className="p-2.5 bg-cyan-950/60 border border-cyan-500/40 rounded-xl text-center space-y-1">
                  <div className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                    ⚡ Development Preview OTP
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtp(devOtp)}
                    className="text-sm font-mono font-bold tracking-widest text-cyan-300 bg-slate-900 px-3 py-1 rounded-lg border border-cyan-500/30 hover:bg-slate-800 transition-colors"
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
                    className="w-full py-3 bg-[#030E22] border-2 border-cyan-500/60 rounded-2xl text-center text-2xl font-mono font-black tracking-[0.4em] text-cyan-400 placeholder-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none transition-all shadow-inner"
                  />
                </div>

                {/* Resend OTP & Countdown */}
                <div className="flex items-center justify-between px-1 text-xs">
                  <span className="text-slate-400 text-[11px]">Didn't receive code?</span>
                  <button
                    type="button"
                    disabled={countdown > 0 || isResending}
                    onClick={handleResendOtp}
                    className={`flex items-center gap-1.5 font-semibold transition-colors ${
                      countdown > 0 || isResending
                        ? 'text-slate-500 cursor-not-allowed'
                        : 'text-cyan-400 hover:text-cyan-300 cursor-pointer'
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
                  className="w-full py-3.5 bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#06B6D4] hover:opacity-95 text-white font-bold rounded-2xl shadow-xl shadow-cyan-500/25 text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Verifying...' : 'Verify OTP & Create Family Space'}</span>
                </button>
              </form>
            </div>
          )}

          {/* ================= MODE: JOIN FAMILY WITH SECRET KEY ================= */}
          {mode === 'JOIN_FAMILY' && (
            <div className="bg-[#061737]/85 backdrop-blur-xl border border-[#168BFF]/30 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-cyan-950/40 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setMode('SIGN_IN'); setJoinError(''); }}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
                <span className="text-[11px] font-medium text-cyan-300">Join Family Space</span>
              </div>

              <div className="text-left space-y-0.5">
                <h2 className="text-lg font-bold text-white tracking-tight">Join with Secret Key</h2>
                <p className="text-xs text-slate-400">Enter the invitation key shared by your Family Head</p>
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
                      placeholder="e.g. FAM-8492"
                      value={joinForm.familyKey}
                      onChange={(e) => setJoinForm({ ...joinForm, familyKey: e.target.value.toUpperCase() })}
                      className="w-full mt-1 px-4 py-2.5 bg-[#030E22]/90 border-2 border-cyan-500/40 rounded-xl text-center text-sm font-mono font-bold tracking-widest text-cyan-300 placeholder-slate-500 focus:border-cyan-400 outline-none uppercase shadow-inner"
                    />
                    <KeyRound className="w-4 h-4 text-cyan-400/60 absolute left-3 top-3.5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Your Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya"
                      value={joinForm.name}
                      onChange={(e) => setJoinForm({ ...joinForm, name: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-[#030E22]/90 border border-[#168BFF]/30 rounded-xl text-xs text-white outline-none focus:border-[#16C7F2]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300">Relationship</label>
                    <select
                      value={joinForm.relationship}
                      onChange={(e) => setJoinForm({ ...joinForm, relationship: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-[#030E22]/90 border border-[#168BFF]/30 rounded-xl text-xs text-white outline-none focus:border-[#16C7F2]"
                    >
                      <option value="Spouse">Spouse</option>
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
                    <label className="text-xs font-semibold text-slate-300">Your Email</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={joinForm.email}
                      onChange={(e) => setJoinForm({ ...joinForm, email: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-[#030E22]/90 border border-[#168BFF]/30 rounded-xl text-xs text-white outline-none focus:border-[#16C7F2]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300">4-Digit App PIN</label>
                    <input
                      type="password"
                      maxLength={6}
                      required
                      placeholder="1234"
                      value={joinForm.pinCode}
                      onChange={(e) => setJoinForm({ ...joinForm, pinCode: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-[#030E22]/90 border border-[#168BFF]/30 rounded-xl text-xs text-white outline-none focus:border-[#16C7F2] tracking-widest font-mono"
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
                            ? 'bg-cyan-600/30 border-cyan-400 text-cyan-200'
                            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
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
                  className="w-full py-3.5 bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#06B6D4] hover:opacity-95 text-white font-bold rounded-2xl shadow-xl shadow-cyan-500/25 text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isSubmitting ? 'Joining Family...' : 'Verify Key & Join Family'}</span>
                </button>
              </form>
            </div>
          )}
        </main>
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
                  <p className="text-[10px] text-slate-400">Live Cloud HTTPS Endpoint</p>
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
              <label className="text-xs text-slate-300 font-semibold">Server URL</label>
              <input
                type="text"
                value={serverHostInput}
                onChange={(e) => {
                  setServerHostInput(e.target.value);
                  setServerTestStatus({ testing: false });
                }}
                placeholder="https://onefamily-ydkb.onrender.com"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono placeholder-slate-600 focus:border-[#16C7F2] outline-none"
              />
              <p className="text-[10px] text-slate-400">
                Connected to live 24/7 cloud server on Render. Works on any 4G/5G or Wi-Fi network.
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

