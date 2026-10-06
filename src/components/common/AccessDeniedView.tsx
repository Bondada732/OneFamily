import React from 'react';
import { ShieldAlert, ArrowLeft, Users, AlertCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.js';
import { useAuth } from '../../context/AuthContext.js';

interface AccessDeniedViewProps {
  moduleName: string;
  description?: string;
  requiredPermission?: string;
  onBackToHome?: () => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  moduleName,
  description = 'Access to this module has been restricted for your profile by your Family Head.',
  requiredPermission,
  onBackToHome,
}) => {
  const { theme } = useTheme();
  const { familyMembers } = useAuth();
  const isLight = theme === 'light';

  const familyHead = familyMembers.find((m) => m.role === 'FAMILY_HEAD');

  return (
    <div className={`min-h-[75vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in ${
      isLight ? 'text-[#2A1B14]' : 'text-white'
    }`}>
      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-5 border shadow-xl ${
        isLight
          ? 'bg-amber-100/80 border-amber-300 text-[#B84A1E]'
          : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
      }`}>
        <ShieldAlert className="w-10 h-10 stroke-[2.2]" />
      </div>

      <div className="max-w-xs space-y-2 mb-6">
        <span className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border ${
          isLight
            ? 'bg-rose-100 border-rose-300 text-rose-800'
            : 'bg-rose-500/20 border-rose-500/30 text-rose-300'
        }`}>
          Module Restricted
        </span>
        <h2 className="text-xl font-extrabold tracking-tight">{moduleName}</h2>
        <p className={`text-xs leading-relaxed ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
          {description}
        </p>
      </div>

      <div className={`w-full max-w-xs p-4 rounded-2xl border text-left mb-6 space-y-2.5 ${
        isLight
          ? 'bg-[#FFF8F1] border-[#DECFC0]'
          : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex items-center gap-2">
          <AlertCircle className={`w-4 h-4 ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />
          <span className="text-xs font-bold">Why am I seeing this?</span>
        </div>
        <p className={`text-[11px] leading-relaxed ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
          Your Family Head controls module visibility for adult, spouse, and child members to keep personal financial and family data private.
        </p>
        {familyHead && (
          <div className={`pt-2 border-t flex items-center gap-2 text-xs font-medium ${
            isLight ? 'border-[#DECFC0] text-[#4A3B32]' : 'border-slate-800 text-slate-300'
          }`}>
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>Family Head: <strong>{familyHead.name}</strong></span>
          </div>
        )}
        {requiredPermission && (
          <div className="text-[10px] font-mono text-slate-500">
            Permission required: {requiredPermission}
          </div>
        )}
      </div>

      {onBackToHome && (
        <button
          onClick={onBackToHome}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
            isLight
              ? 'bg-[#C25425] hover:bg-[#A8431B] text-white'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home Screen</span>
        </button>
      )}
    </div>
  );
};
