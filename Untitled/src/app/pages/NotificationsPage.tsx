import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api';

interface Notification {
  id: number;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const TYPE_ICONS: Record<string, string> = {
  broadcast: '📢', admin: '🔔', general: '💬', default: '🔔',
};

export function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.request<Notification[]>('/notifications').then(res => {
      if (res.success && res.data) setNotifications(res.data);
      setLoading(false);
    });
    // Mark all read
    api.request('/notifications/read-all', { method: 'POST' });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-8">
      <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-slate-800">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Bell size={20} className="text-emerald-400" /> Bildirishnomalar
        </h1>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Hali bildirishnoma yo'q</p>
          </div>
        ) : (
          notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl border ${n.isRead ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-900 border-emerald-500/20'}`}
            >
              <div className="flex gap-3 items-start">
                <span className="text-xl shrink-0">{TYPE_ICONS[n.type] || TYPE_ICONS.default}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-white">{n.title}</p>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{n.body}</p>
                  <p className="text-[10px] text-slate-600 mt-2">
                    {new Date(n.createdAt).toLocaleString('uz-UZ')}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
