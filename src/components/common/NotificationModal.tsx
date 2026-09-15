import React, { useState, useEffect } from 'react';
import { X, Bell, ShieldAlert, AlertTriangle, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import { apiRequest } from '../../utils/api.js';

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
        return <ShieldAlert className="w-4 h-4 text-[#FF4D6D]" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-[#FFD21F]" />;
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-[#55D98A]" />;
      default:
        return <Info className="w-4 h-4 text-[#16C7F2]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#061F5C] border-t sm:border-2 border-[#168BFF]/40 rounded-t-3xl sm:rounded-3xl p-6 text-[#F4F8FF] shadow-[0_20px_60px_rgba(3,25,74,0.95)] space-y-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between pb-2 border-b border-[#168BFF]/20">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#073B9E]/60 text-[#16C7F2] rounded-xl border border-[#168BFF]/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Family Notifications</h3>
              <p className="text-xs text-[#B9D8FF]">Important reminders, bill dues & alerts</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#073B9E] text-[#B9D8FF] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {loading && <div className="text-center py-6 text-xs text-[#B9D8FF]">Loading alerts...</div>}
          {!loading && notifications.length === 0 && (
            <div className="text-center py-8 text-xs text-[#91A8C7]">No active alerts. All clear! 🎉</div>
          )}

          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markAsRead(notif.id, notif.link_tab)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                notif.is_read
                  ? 'bg-[#03194A]/60 border-[#168BFF]/15 opacity-70'
                  : 'bg-[#073B9E]/40 border-[#168BFF]/35 shadow-md hover:border-[#16C7F2]/60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{getNotifIcon(notif.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{notif.title}</span>
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#FFD21F] shrink-0"></span>
                    )}
                  </div>
                  <p className="text-xs text-[#B9D8FF] mt-1 leading-relaxed">{notif.message}</p>
                  {notif.link_tab && (
                    <div className="flex items-center gap-1 text-[11px] text-[#16C7F2] font-semibold mt-2 hover:underline">
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
