import React, { useState, useEffect } from 'react';
import { X, Bell, ShieldAlert, AlertTriangle, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import { apiRequest } from '../../utils/api.js';
import { useTheme } from '../../context/ThemeContext.js';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'URGENT' | 'WARNING' | 'SUCCESS' | 'INFO';
  link_tab?: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: any) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose, onNavigateTab }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      apiRequest('/search/notifications')
        .then((data) => setNotifications(data || []))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const markAsRead = async (id: string, tab?: string) => {
    try {
      await apiRequest(`/search/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      if (tab) {
        onNavigateTab(tab);
        onClose();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'URGENT':
        return <ShieldAlert className={`w-4 h-4 ${isLight ? 'text-[#C62828]' : 'text-[#FF4D6D]'}`} />;
      case 'WARNING':
        return <AlertTriangle className={`w-4 h-4 ${isLight ? 'text-[#B84A1E]' : 'text-[#FFD21F]'}`} />;
      case 'SUCCESS':
        return <CheckCircle2 className={`w-4 h-4 ${isLight ? 'text-[#2E7D32]' : 'text-[#55D98A]'}`} />;
      default:
        return <Info className={`w-4 h-4 ${isLight ? 'text-[#B84A1E]' : 'text-[#16C7F2]'}`} />;
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 ${isLight ? 'bg-black/50' : 'bg-black/80'} backdrop-blur-md animate-fade-in`}>
      <div className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-[max(env(safe-area-inset-bottom,0px),28px)] sm:pb-6 space-y-4 max-h-[80vh] flex flex-col ${
        isLight
          ? 'bg-[#EFE4D6] border-t sm:border-2 border-[#DECFC0] text-[#2A1B14] shadow-[0_20px_60px_rgba(140,95,60,0.22)]'
          : 'bg-[#0B1226] border-t sm:border-2 border-slate-700/80 text-[#F4F8FF] shadow-[0_20px_60px_rgba(0,0,0,0.95)]'
      }`}>
        <div className={`flex items-center justify-between pb-2 border-b ${isLight ? 'border-[#DECFC0]' : 'border-slate-800'}`}>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl border ${
              isLight
                ? 'bg-[#F7D4BC] text-[#B84A1E] border-[#E8BC9E]'
                : 'bg-[#0D152D] text-[#16C7F2] border-slate-700/60'
            }`}>
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold ${isLight ? 'text-[#2A1B14]' : 'text-white'}`}>Family Notifications</h3>
              <p className={`text-xs ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>Important reminders, bill dues & alerts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isLight
                ? 'hover:bg-[#EBE0D2] text-[#634B3F] hover:text-[#2A1B14]'
                : 'hover:bg-[#0D152D] text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {loading && <div className={`text-center py-6 text-xs ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>Loading alerts...</div>}
          {!loading && notifications.length === 0 && (
            <div className={`text-center py-8 text-xs ${isLight ? 'text-[#947D70]' : 'text-slate-500'}`}>No active alerts. All clear! 🎉</div>
          )}

          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markAsRead(notif.id, notif.link_tab)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                notif.is_read
                  ? isLight
                    ? 'bg-[#EBE0D2]/50 border-[#DECFC0] opacity-60'
                    : 'bg-[#050811]/60 border-slate-800/80 opacity-60'
                  : isLight
                  ? 'bg-[#EBE0D2] border-[#DECFC0] shadow-sm hover:border-[#B84A1E]/60'
                  : 'bg-[#0D152D] border-slate-700/70 shadow-md hover:border-[#16C7F2]/60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{getNotifIcon(notif.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`font-bold text-xs ${isLight ? 'text-[#2A1B14]' : 'text-white'}`}>{notif.title}</span>
                    {!notif.is_read && (
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isLight ? 'bg-[#D96632]' : 'bg-[#FFD21F]'}`}></span>
                    )}
                  </div>
                  <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>{notif.message}</p>
                  {notif.link_tab && (
                    <div className={`flex items-center gap-1 text-[11px] font-semibold mt-2 hover:underline ${
                      isLight ? 'text-[#B84A1E]' : 'text-[#16C7F2]'
                    }`}>
                      <span>View in {notif.link_tab}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
