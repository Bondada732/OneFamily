import React, { useState } from 'react';
import { X, MessageSquare, Send, Heart, Sparkles, Languages, Check, Copy } from 'lucide-react';
import { ActiveOccasionReminder, FamilyContact } from '../../types/index.js';

interface WhatsAppWishModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: FamilyContact | { name: string; mobile_number: string; relationship?: string };
  occasion?: {
    occasion_type: string;
    custom_occasion_name?: string;
    milestoneText?: string;
  };
}

export const WhatsAppWishModal: React.FC<WhatsAppWishModalProps> = ({
  isOpen,
  onClose,
  contact,
  occasion,
}) => {
  if (!isOpen) return null;

  const firstName = contact.name?.split(' ')[0] || contact.name || 'Friend';
  const isAnniversary =
    occasion?.occasion_type === 'MARRIAGE_ANNIVERSARY' ||
    occasion?.occasion_type === 'ENGAGEMENT_ANNIVERSARY';

  const defaultTemplates = isAnniversary
    ? [
        {
          id: 'en_warm',
          label: 'Warm & Festive (EN)',
          text: `Happy Wedding Anniversary ${contact.name}! 💐💍 Wishing you both endless love, laughter, and a lifetime of wonderful memories together!`,
        },
        {
          id: 'te_anniv',
          label: 'తెలుగు (Telugu)',
          text: `పెళ్లిరోజు శుభాకాంక్షలు ${contact.name}! 💐💍 మీ దాంపత్య జీవితం కలకాలం ఆయురారోగ్యాలు, సుఖసంతోషాలతో సాగాలని మనస్ఫూర్తిగా కోరుకుంటున్నాము!`,
        },
        {
          id: 'hi_anniv',
          label: 'हिंदी (Hindi)',
          text: `शादी की सालगिरह की हार्दिक शुभकामनाएं ${contact.name}! 💐💍 आप दोनों की जोड़ी हमेशा खुशहाल और सलामत रहे!`,
        },
        {
          id: 'en_short',
          label: 'Short & Sweet',
          text: `Happy Anniversary ${firstName}! 🥂✨ Wishing you both a fantastic celebration today!`,
        },
      ]
    : [
        {
          id: 'en_warm',
          label: 'Warm Family (EN)',
          text: `Happy Birthday ${firstName}! 🎂🎉 Wishing you a wonderful year ahead filled with happiness, peace, great health, and success!`,
        },
        {
          id: 'te_bday',
          label: 'తెలుగు (Telugu)',
          text: `పుట్టినరోజు హార్దిక శుభాకాంక్షలు ${firstName}! 🎂🎉 మీరు నిండు నూరేళ్ళు ఆయురారోగ్యాలు, అష్టైశ్వర్యాలతో వర్ధిల్లాలని మనసారా ఆశీర్వదిస్తున్నాము!`,
        },
        {
          id: 'hi_bday',
          label: 'हिंदी (Hindi)',
          text: `जन्मदिन की ढेर सारी शुभकामनाएं ${firstName}! 🎂🎉 ईश्वर आपको सदैव स्वस्थ, प्रसन्न और सफल बनाए रखे!`,
        },
        {
          id: 'en_short',
          label: 'Short & Sweet',
          text: `Happy Birthday ${firstName}! 🎂✨ Hope you have a magical and joyous day!`,
        },
      ];

  const [selectedTemplateId, setSelectedTemplateId] = useState(defaultTemplates[0].id);
  const [customMessage, setCustomMessage] = useState(defaultTemplates[0].text);
  const [copied, setCopied] = useState(false);

  const handleSelectTemplate = (tpl: { id: string; text: string }) => {
    setSelectedTemplateId(tpl.id);
    setCustomMessage(tpl.text);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const rawNumber = contact.mobile_number || '';
    // Normalize phone number (remove spaces, dashes, parentheses)
    let cleanNumber = rawNumber.replace(/[^0-9]/g, '');

    // If starts with 0 or doesn't have country code and is 10 digits (India default)
    if (cleanNumber.length === 10) {
      cleanNumber = `91${cleanNumber}`;
    }

    const encodedText = encodeURIComponent(customMessage);
    const url = cleanNumber
      ? `https://wa.me/${cleanNumber}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;

    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0D152D] border border-emerald-500/30 rounded-3xl w-full max-w-md p-5 text-white shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>Send WhatsApp Wish</span>
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </h3>
              <p className="text-xs text-slate-400">
                To <strong className="text-slate-200">{contact.name}</strong> ({contact.mobile_number || 'No number'})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto py-4 space-y-4 flex-1 scrollbar-thin">
          {/* Language / Tone Presets */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-emerald-400" />
              <span>Choose Greeting Template</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {defaultTemplates.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-sm'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{tpl.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editable Message Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Message Preview & Edit
              </label>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={4}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full rounded-2xl bg-slate-900/90 border border-slate-700/80 p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none leading-relaxed"
              placeholder="Type your greeting message..."
            />
            <p className="text-[10px] text-slate-400 mt-1 italic">
              💡 You can personalize this text before opening WhatsApp.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Open in WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
