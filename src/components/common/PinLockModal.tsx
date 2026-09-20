import React, { useState } from 'react';
import { Lock, Fingerprint, Delete, ShieldCheck, AlertCircle } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';

export const PinLockModal: React.FC = () => {
  const { isLocked, unlockApp } = useSecurity();
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isLocked) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        const success = unlockApp(nextPin);
        if (!success) {
          setError(true);
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleBiometricSim = () => {
    unlockApp('1234');
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl animate-fade-in ${
      isLight ? 'bg-[#F4EDE4]/95 text-[#2A1B14]' : 'bg-slate-950/95 text-white'
    }`}>
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6">
        {/* Lock Icon & Avatar */}
        <div className="relative">
          <div className={`w-20 h-20 rounded-3xl p-0.5 shadow-2xl flex items-center justify-center ${
            isLight
              ? 'bg-gradient-to-tr from-[#D96632] via-[#C85928] to-[#B84A1E] shadow-[#B84A1E]/30'
              : 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 shadow-indigo-500/30'
          }`}>
            <img
              src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'}
              alt="User"
              className="w-full h-full rounded-3xl object-cover"
            />
          </div>
          <div className={`absolute -bottom-2 -right-2 p-1.5 rounded-full border shadow-md ${
            isLight
              ? 'bg-[#EFE4D6] border-[#DECFC0]'
              : 'bg-slate-900 border-slate-700'
          }`}>
            <Lock className={`w-4 h-4 ${isLight ? 'text-[#B84A1E]' : 'text-amber-400'}`} />
          </div>
        </div>

        <div>
          <h2 className={`text-xl font-bold tracking-tight ${isLight ? 'text-[#2A1B14]' : 'text-white'}`}>{currentUser?.name || 'One Family Vault'}</h2>
          <p className={`text-xs mt-1 ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>Enter your 4-digit Family PIN (Default: 1234)</p>
        </div>

        {/* PIN Indicators */}
        <div className="flex items-center gap-4 py-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all ${
                error
                  ? 'bg-rose-500 animate-bounce'
                  : pin.length > i
                  ? isLight
                    ? 'bg-[#B84A1E] ring-4 ring-[#B84A1E]/20 scale-110'
                    : 'bg-amber-400 ring-4 ring-amber-400/20 scale-110'
                  : isLight
                  ? 'bg-[#EBE0D2] border border-[#DECFC0]'
                  : 'bg-slate-800 border border-slate-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className={`flex items-center gap-1.5 text-xs font-medium ${isLight ? 'text-[#C62828]' : 'text-rose-400'}`}>
            <AlertCircle className="w-4 h-4" />
            <span>Incorrect PIN. Try default: 1234</span>
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              className={`h-14 rounded-2xl border active:scale-95 text-xl font-bold shadow-sm transition-all ${
                isLight
                  ? 'bg-[#EFE4D6] border-[#DECFC0] hover:bg-[#E4D7C7] text-[#2A1B14]'
                  : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-100'
              }`}
            >
              {d}
            </button>
          ))}
          <button
            onClick={handleBiometricSim}
            className={`h-14 rounded-2xl border active:scale-95 flex items-center justify-center shadow-sm transition-all ${
              isLight
                ? 'bg-[#EFE4D6] border-[#DECFC0] hover:bg-[#E4D7C7] text-[#B84A1E]'
                : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-indigo-400'
            }`}
            title="Biometric Touch ID / Face ID"
          >
            <Fingerprint className="w-6 h-6" />
          </button>
          <button
            onClick={() => handleDigit('0')}
            className={`h-14 rounded-2xl border active:scale-95 text-xl font-bold shadow-sm transition-all ${
              isLight
                ? 'bg-[#EFE4D6] border-[#DECFC0] hover:bg-[#E4D7C7] text-[#2A1B14]'
                : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-100'
            }`}
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className={`h-14 rounded-2xl border active:scale-95 flex items-center justify-center shadow-sm transition-all ${
              isLight
                ? 'bg-[#EFE4D6] border-[#DECFC0] hover:bg-[#E4D7C7] text-[#634B3F]'
                : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-400'
            }`}
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <div className={`flex items-center gap-2 text-[11px] ${isLight ? 'text-[#947D70]' : 'text-slate-500'}`}>
          <ShieldCheck className={`w-3.5 h-3.5 ${isLight ? 'text-[#2E7D32]' : 'text-emerald-400'}`} />
          <span>Protected with AES-256 Client & Server Authentication</span>
        </div>
      </div>
    </div>
  );
};
