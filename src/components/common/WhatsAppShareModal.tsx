import React, { useState } from 'react';
import { X, Share2, Copy, Check, MessageSquare } from 'lucide-react';
import { buildWhatsAppMessage } from '../../utils/formatters.js';
import { useTheme } from '../../context/ThemeContext.js';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'REMINDER' | 'TASK' | 'CHECKLIST' | 'GOAL';
  title: string;
  details?: string;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({ isOpen, onClose, type, title, details }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const rawMessage = `*ONE FAMILY* 🏡\n_${type}_: ${title}\n${details ? `\n${details}\n` : ''}\n_Shared from One Family App_`;
  const shareUrl = `https://api.whatsapp.com/send?text=${buildWhatsAppMessage(type, title, details)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(rawMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    window.open(shareUrl, '_blank');
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 ${isLight ? 'bg-black/50' : 'bg-black/70'} backdrop-blur-sm animate-fade-in`}>
      <div className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4 ${
        isLight
          ? 'bg-[#EFE4D6] border-t sm:border-2 border-[#DECFC0] text-[#2A1B14] shadow-[0_20px_60px_rgba(140,95,60,0.22)]'
          : 'bg-slate-900 border-t sm:border border-slate-800 text-slate-100 shadow-2xl'
      }`}>
        <div className={`flex items-center justify-between pb-2 border-b ${isLight ? 'border-[#DECFC0]' : 'border-slate-800'}`}>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl border ${
              isLight
                ? 'bg-[#F7D4BC] text-[#2E7D32] border-[#E8BC9E]'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold ${isLight ? 'text-[#2A1B14]' : 'text-white'}`}>Share to WhatsApp</h3>
              <p className={`text-xs ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>Formatted family update message</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isLight
                ? 'hover:bg-[#EBE0D2] text-[#634B3F] hover:text-[#2A1B14]'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Preview Box */}
        <div className={`p-4 rounded-2xl text-xs font-mono whitespace-pre-wrap leading-relaxed border ${
          isLight
            ? 'bg-[#EBE0D2] border-[#DECFC0] text-[#2A1B14]'
            : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'
        }`}>
          {rawMessage}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleCopy}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold border transition-colors ${
              isLight
                ? 'bg-[#EBE0D2] hover:bg-[#E4D7C7] text-[#2A1B14] border-[#DECFC0]'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            {copied ? <Check className={`w-4 h-4 ${isLight ? 'text-[#2E7D32]' : 'text-emerald-400'}`} /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Text'}</span>
          </button>
          <button
            onClick={handleOpenWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#25D366]/30 transition-transform active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span>Open WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
