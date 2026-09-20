import React, { useState, useEffect } from 'react';
import {
  Heart,
  Cake,
  Phone,
  Send,
  Sparkles,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { ActiveOccasionReminder } from '../../types/index.js';
import { apiRequest } from '../../utils/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { WhatsAppWishModal } from '../familyFriends/WhatsAppWishModal.js';

interface FamilyRemindersHomeWidgetProps {
  onNavigateTab: (tab: any) => void;
}

const OCCASION_ICONS: Record<string, string> = {
  BIRTHDAY: '🎂',
  MARRIAGE_ANNIVERSARY: '💍',
  ENGAGEMENT_ANNIVERSARY: '💐',
  GRADUATION_ANNIVERSARY: '🎓',
  OTHER: '⭐',
};

export const FamilyRemindersHomeWidget: React.FC<FamilyRemindersHomeWidgetProps> = ({
  onNavigateTab,
}) => {
  const { family } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [todayOccasions, setTodayOccasions] = useState<ActiveOccasionReminder[]>([]);
  const [upcomingOccasions, setUpcomingOccasions] = useState<ActiveOccasionReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [activeWishData, setActiveWishData] = useState<{
    contact: { name: string; mobile_number: string; relationship?: string };
    occasion: any;
  } | null>(null);

  const loadActiveReminders = async () => {
    if (!family?.id) return;
    try {
      const res = await apiRequest(`/family-reminders/${family.id}/dashboard-active`);
      if (res) {
        setTodayOccasions(res.todayOccasions || []);
        setUpcomingOccasions(res.upcomingOccasions || []);
      }
    } catch (err) {
      console.error('Failed to load active occasion reminders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActiveReminders();
  }, [family?.id]);

  const getInitials = (str: string) => {
    if (!str.trim()) return '👤';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  const handleCall = (e: React.MouseEvent, phone?: string) => {
    e.stopPropagation();
    if (phone) {
      window.open(`tel:${phone.replace(/\s+/g, '')}`, '_self');
    }
  };

  const handleOpenWhatsApp = (e: React.MouseEvent, reminder: ActiveOccasionReminder) => {
    e.stopPropagation();
    setActiveWishData({
      contact: {
        name: reminder.name,
        mobile_number: reminder.mobile_number,
        relationship: reminder.relationship,
      },
      occasion: {
        occasion_type: reminder.occasion_type,
        custom_occasion_name: reminder.custom_occasion_name,
        milestoneText: reminder.milestoneText,
      },
    });
    setShowWhatsAppModal(true);
  };

  return (
    <div className="space-y-3 animate-fade-in">
      {/* 0. Fallback Empty State / Entry Point when no occasions are active */}
      {!isLoading && todayOccasions.length === 0 && upcomingOccasions.length === 0 && (
        <div className={`rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-xl space-y-2.5 kinora-3d-card ${
          isLight
            ? 'bg-[#F3E3D3] border border-[#EAD6C4] border-t-white/95 border-b-[3px] border-b-[#DEC8B2] shadow-[0_12px_28px_-4px_rgba(130,80,45,0.14)]'
            : 'bg-[#0D152D] border border-slate-800/80 shadow-xl'
        }`}>
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-base">🎂</span>
              <h3 className={`text-sm sm:text-base font-bold tracking-tight ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                Family & Friends Celebrations
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('friends')}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                isLight
                  ? 'text-white bg-[#F05A28] hover:bg-[#E76F3C] border-[#F05A28] shadow-sm'
                  : 'text-[#FF4D8D] hover:text-[#FF758F] bg-[#FF4D8D]/10 hover:bg-[#FF4D8D]/20 border-[#FF4D8D]/25'
              }`}
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>

          <div className={`p-3 rounded-xl flex items-center justify-between gap-3 ${
            isLight ? 'bg-[#FFF8F1] border border-[#EAD6C4]' : 'bg-slate-900/60 border border-slate-800'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 kinora-3d-icon-box ${
                isLight ? 'bg-pink-100 text-pink-600 border-pink-200' : 'bg-pink-500/20 text-pink-400 border-pink-500/30'
              }`}>
                <Cake className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className={`text-xs font-bold truncate ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                  Never miss a birthday or anniversary
                </div>
                <div className={`text-[10.5px] truncate ${isLight ? 'text-[#6B6B6B]' : 'text-slate-400'}`}>
                  Auto reminders & 1-click WhatsApp wishes
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('friends')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                isLight
                  ? 'bg-[#F05A28] hover:bg-[#E76F3C] text-white shadow-sm'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              Open Hub →
            </button>
          </div>
        </div>
      )}

      {/* 1. TODAY'S SPECIAL CELEBRATION (When an occasion is TODAY) */}
      {todayOccasions.length > 0 && (
        <div className={`rounded-3xl p-4 border-2 relative overflow-hidden space-y-3 kinora-3d-card ${
          isLight
            ? 'bg-gradient-to-br from-[#FFF8EE] via-[#FFF0E0] to-[#FDF4EA] border-amber-500/40 shadow-[0_8px_24px_rgba(217,119,6,0.12)]'
            : 'bg-gradient-to-br from-[#1E1238] via-[#2A1648] to-[#121A3A] border-amber-400/60 shadow-[0_8px_30px_rgba(251,191,36,0.25)]'
        }`}>
          {/* Sparkle Glows */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/15 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-500/15 rounded-full blur-2xl pointer-events-none"></div>

          {/* Header */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-xl animate-bounce">🎉</span>
              <h3 className={`text-sm sm:text-base font-black tracking-tight uppercase flex items-center gap-1.5 ${
                isLight ? 'text-amber-800' : 'text-amber-300'
              }`}>
                <span>{todayOccasions.length > 1 ? 'Special Days Today' : 'Today Special'}</span>
                <Sparkles className={`w-4 h-4 ${isLight ? 'text-amber-700' : 'text-amber-300'}`} />
              </h3>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-md">
              TODAY
            </span>
          </div>

          {/* Cards for each person with birthday/occasion today */}
          <div className="space-y-2.5 relative z-10">
            {todayOccasions.map((occ) => {
              const icon = OCCASION_ICONS[occ.occasion_type] || '🎂';
              const firstName = occ.name.split(' ')[0];

              return (
                <div
                  key={`${occ.contactId}_${occ.occasionId}`}
                  onClick={() => onNavigateTab('friends')}
                  className={`p-3.5 rounded-2xl border backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg cursor-pointer transition-all ${
                    isLight
                      ? 'bg-[#EBE0D2] border-[#DECFC0] hover:border-amber-400'
                      : 'bg-[#080D1A]/85 border-amber-400/40 hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Person Photo */}
                    {occ.photo_url ? (
                      <img
                        src={occ.photo_url}
                        alt={occ.name}
                        className={`w-14 h-14 rounded-2xl object-cover ring-2 shadow-lg shrink-0 ${
                          isLight ? 'ring-amber-500' : 'ring-amber-400'
                        }`}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-pink-600 flex items-center justify-center text-white font-black text-lg ring-2 ring-amber-300/60 shadow-lg shrink-0">
                        {getInitials(occ.name)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      {/* ONLY Person's Name and Occasion */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-base">{icon}</span>
                        <h4 className={`text-sm sm:text-base font-extrabold truncate ${
                          isLight ? 'text-[#2A1B14]' : 'text-white'
                        }`}>
                          {occ.name}
                        </h4>
                      </div>

                      <p className={`text-xs mt-0.5 font-semibold flex items-center gap-1.5 ${
                        isLight ? 'text-amber-800' : 'text-amber-200'
                      }`}>
                        <span>Today is {firstName}'s {occ.occasion_type === 'BIRTHDAY' ? 'Birthday' : occ.custom_occasion_name || 'Anniversary'}!</span>
                        {occ.milestoneText && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full border font-bold ${
                            isLight
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                          }`}>
                            {occ.milestoneText}
                          </span>
                        )}
                      </p>

                      <span className={`text-[10px] mt-0.5 block ${isLight ? 'text-[#947D70]' : 'text-slate-400'}`}>
                        {occ.relationship} • {occ.occasionDateStr}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                    {occ.mobile_number && (
                      <button
                        type="button"
                        onClick={(e) => handleCall(e, occ.mobile_number)}
                        className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                          isLight
                            ? 'bg-[#E3D6C6] hover:bg-[#D9CABE] text-[#2A1B14] border border-[#DECFC0]'
                            : 'bg-slate-800 hover:bg-emerald-600/30 text-slate-200 hover:text-emerald-300 border border-slate-700'
                        }`}
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Call</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleOpenWhatsApp(e, occ)}
                      className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/25 active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>WhatsApp Wish</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. UPCOMING BIRTHDAYS & OCCASIONS (Shown ONLY when there are active upcoming reminders) */}
      {upcomingOccasions.length > 0 && (
        <div className={`rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-xl space-y-2.5 kinora-3d-card ${
          isLight
            ? 'bg-[#F3E3D3] border border-[#EAD6C4] border-t-white/95 border-b-[3px] border-b-[#DEC8B2] shadow-[0_12px_28px_-4px_rgba(130,80,45,0.14)]'
            : 'bg-[#0D152D] border border-slate-800/80 shadow-xl'
        }`}>
          <div className="flex items-center justify-between px-1">
            <h3 className={`text-sm sm:text-base font-bold tracking-tight flex items-center gap-2 ${
              isLight ? 'text-[#1F1F1F]' : 'text-white'
            }`}>
              <span className={isLight ? 'text-[#D3542F]' : 'text-[#FF4D8D]'}>❤️</span>
              <span>Upcoming Celebrations</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                isLight
                  ? 'text-[#C25425] bg-[#C25425]/10 border-[#C25425]/25'
                  : 'text-[#FF4D8D] bg-[#FF4D8D]/15 border-[#FF4D8D]/30'
              }`}>
                {upcomingOccasions.length}
              </span>
            </h3>

            <button
              type="button"
              onClick={() => onNavigateTab('friends')}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all flex items-center gap-0.5 ${
                isLight
                  ? 'text-[#634B3F] hover:text-[#2A1B14] bg-[#E3D6C6] hover:bg-[#D9CABE] border-[#DECFC0]'
                  : 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border-slate-700/40'
              }`}
            >
              <span>View All</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className={`divide-y ${isLight ? 'divide-[#DECFC0]' : 'divide-slate-800/60'}`}>
            {upcomingOccasions.slice(0, 4).map((occ) => {
              const icon = OCCASION_ICONS[occ.occasion_type] || '🎂';

              return (
                <div
                  key={`${occ.contactId}_${occ.occasionId}`}
                  onClick={() => onNavigateTab('friends')}
                  className={`flex items-center justify-between py-2.5 px-2 rounded-xl transition-all cursor-pointer group ${
                    isLight ? 'hover:bg-[#E3D6C6]/60' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {occ.photo_url ? (
                      <img
                        src={occ.photo_url}
                        alt={occ.name}
                        className={`w-10 h-10 rounded-xl object-cover ring-2 shadow-sm shrink-0 ${
                          isLight ? 'ring-[#C25425]/40' : 'ring-indigo-500/40'
                        }`}
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0 ${
                        isLight ? 'bg-gradient-to-tr from-[#C25425] to-[#D96632]' : 'bg-gradient-to-tr from-amber-500 to-indigo-600'
                      }`}>
                        {getInitials(occ.name)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      {/* Name of the person */}
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold transition-colors truncate ${
                          isLight ? 'text-[#2A1B14] group-hover:text-[#C25425]' : 'text-white group-hover:text-amber-300'
                        }`}>
                          {occ.name}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded shrink-0 ${
                          isLight ? 'text-[#634B3F] bg-[#E3D6C6]' : 'text-slate-400 bg-slate-800/80'
                        }`}>
                          {occ.relationship}
                        </span>
                      </div>

                      <div className={`text-[11px] mt-0.5 flex items-center gap-1.5 truncate ${
                        isLight ? 'text-[#634B3F]' : 'text-slate-300'
                      }`}>
                        <span>{icon}</span>
                        <span className="truncate">{occ.displayTitle}</span>
                        <span>•</span>
                        <span className={`font-semibold ${isLight ? 'text-[#2A1B14]' : 'text-slate-200'}`}>{occ.occasionDateStr}</span>
                      </div>
                    </div>
                  </div>

                  {/* Countdown Badge & Actions */}
                  <div className="flex items-center gap-2 shrink-0 pl-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        occ.daysRemaining <= 3
                          ? isLight ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : isLight ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {occ.countdownText}
                    </span>

                    {occ.mobile_number && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleCall(e, occ.mobile_number)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isLight
                              ? 'bg-[#F4EDE4] hover:bg-[#EAE0D5] text-[#2D231E] border-[#EBDDCF]'
                              : 'bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border-slate-700'
                          }`}
                          title="Call"
                        >
                          <Phone className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleOpenWhatsApp(e, occ)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isLight
                              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300'
                              : 'bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/30'
                          }`}
                          title="WhatsApp"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WhatsApp Wish Modal */}
      {showWhatsAppModal && activeWishData && (
        <WhatsAppWishModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          contact={activeWishData.contact}
          occasion={activeWishData.occasion}
        />
      )}
    </div>
  );
};
