import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { translations } from '../../i18n/index.js';
import { apiRequest } from '../../utils/api.js';
import { CalendarEvent, Reminder } from '../../types/index.js';
import { formatDate, formatRelativeDays } from '../../utils/formatters.js';
import { Calendar as CalendarIcon, Clock, Bell, Plus, Share2, ShieldAlert, CheckCircle2, ChevronRight } from 'lucide-react';
import { WhatsAppShareModal } from '../../components/common/WhatsAppShareModal.js';

export const CalendarView: React.FC = () => {
  const { family, activeLanguage, hasPermission, currentUser } = useAuth();
  const t = translations[activeLanguage];

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // WhatsApp modal
  const [shareData, setShareData] = useState<{ isOpen: boolean; type: any; title: string; details?: string }>({
    isOpen: false,
    type: 'REMINDER',
    title: '',
  });

  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'FUNCTION',
    start_date: new Date().toISOString().split('T')[0],
    assigned_member_name: currentUser?.name || 'All Family',
    notes: '',
  });

  const canEditCalendar = hasPermission('CALENDAR_EDIT');

  useEffect(() => {
    if (!family?.id) return;
    const loadCalendar = async () => {
      try {
        setIsLoading(true);
        const data = await apiRequest(`/calendar/${family.id}/calendar`);
        setEvents(data.events || []);
        setReminders(data.reminders || []);
      } catch (err) {
        console.error('Failed to load calendar:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadCalendar();
  }, [family?.id, currentUser?.id]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await apiRequest(`/calendar/${family?.id}/calendar`, {
        method: 'POST',
        body: JSON.stringify(newEvent),
      });
      setEvents([...events, created]);
      setShowAddEvent(false);
      setNewEvent({
        title: '',
        type: 'FUNCTION',
        start_date: new Date().toISOString().split('T')[0],
        assigned_member_name: currentUser?.name || 'All Family',
        notes: '',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case 'BIRTHDAY':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'INSURANCE':
      case 'BILL':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'SIP':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'SCHOOL':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    }
  };

  return (
    <div className="p-4 space-y-5 animate-fade-in text-slate-100 pb-12">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Shared Family Calendar</h2>
          <p className="text-xs text-slate-400">Birthdays, renewals, SIP dates & bill dues</p>
        </div>
        {canEditCalendar && (
          <button
            onClick={() => setShowAddEvent(true)}
            className="p-2 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white rounded-xl text-xs flex items-center gap-1 font-bold shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Event</span>
          </button>
        )}
      </div>

      {/* Smart Reminders Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-400 uppercase flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Smart Reminders</span>
          </span>
          <span className="text-amber-400 font-bold">{reminders.length} Active</span>
        </div>

        <div className="space-y-2">
          {reminders.map((rem) => (
            <div
              key={rem.id}
              className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-between shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 mt-1 animate-pulse" />
                <div>
                  <div className="text-xs font-bold text-white">{rem.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Due: <span className="text-amber-300 font-semibold">{formatDate(rem.due_date)}</span> ({formatRelativeDays(rem.due_date)})
                  </div>
                </div>
              </div>

              {/* 1-Tap WhatsApp Share Trigger */}
              <button
                onClick={() =>
                  setShareData({
                    isOpen: true,
                    type: 'REMINDER',
                    title: rem.title,
                    details: `Due on: ${formatDate(rem.due_date)} (${formatRelativeDays(rem.due_date)})`,
                  })
                }
                className="p-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded-xl border border-emerald-500/30 text-xs flex items-center gap-1 font-semibold"
                title="Share to WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Timeline Events */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-400 uppercase">Upcoming Events Schedule</div>

        <div className="space-y-2.5">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-1.5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{evt.title}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getEventBadgeColor(evt.type)}`}>
                  {evt.type}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-3">
                <span>📅 {formatDate(evt.start_date)}</span>
                <span>👤 {evt.assigned_member_name}</span>
              </div>
              {evt.notes && <div className="text-[10px] text-slate-500 italic mt-0.5">{evt.notes}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create Calendar Event</h3>
            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-semibold">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dadi Health Checkup at Apollo"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Date</label>
                  <input
                    type="date"
                    value={newEvent.start_date}
                    onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Type</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  >
                    <option value="BIRTHDAY">Birthday 🎂</option>
                    <option value="ANNIVERSARY">Anniversary 💍</option>
                    <option value="FUNCTION">Family Function 🎉</option>
                    <option value="MEDICAL">Doctor / Medical 🏥</option>
                    <option value="BILL">Bill Payment ⚡</option>
                    <option value="SCHOOL">School / Exam 📚</option>
                    <option value="TRAVEL">Travel / Vacation ✈️</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Notes</label>
                <input
                  type="text"
                  placeholder="Additional notes"
                  value={newEvent.notes}
                  onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEvent(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Share Modal */}
      <WhatsAppShareModal
        isOpen={shareData.isOpen}
        onClose={() => setShareData({ ...shareData, isOpen: false })}
        type={shareData.type}
        title={shareData.title}
        details={shareData.details}
      />
    </div>
  );
};
