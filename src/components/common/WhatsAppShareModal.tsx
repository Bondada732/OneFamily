import React, { useState } from 'react';
import { X, Share2, Copy, Check, MessageSquare } from 'lucide-react';
import { buildWhatsAppMessage } from '../../utils/formatters.js';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'REMINDER' | 'TASK' | 'CHECKLIST' | 'GOAL';
  title: string;
  details?: string;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({ isOpen, onClose, type, title, details }) => {
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 text-slate-100 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Share to WhatsApp</h3>
              <p className="text-xs text-slate-400">Formatted family update message</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Preview Box */}
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-xs font-mono text-emerald-200 whitespace-pre-wrap leading-relaxed">
          {rawMessage}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Text'}</span>
          </button>
          <button
            onClick={handleOpenWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-transform active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span>Open WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
