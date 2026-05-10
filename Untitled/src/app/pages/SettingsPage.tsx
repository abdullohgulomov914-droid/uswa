import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Shield, Bell, BarChart2, LogOut, ChevronRight, Settings, User, Lock } from 'lucide-react';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api';

export function SettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    api.request<any>('/user/me').then(res => {
      if (res.success && res.data) {
        setUser(res.data);
        setIsAdmin(Boolean(res.data.isAdmin));
      }
    });
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('pin');
    sessionStorage.removeItem('pin_verified');
    window.location.href = '/auth';
  };

  const resetPin = () => {
    localStorage.removeItem('pin');
    sessionStorage.removeItem('pin_verified');
    window.location.href = '/auth';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-8">
      <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-slate-800">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings size={20} className="text-slate-400" /> Sozlamalar
        </h1>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Profile info */}
        {user && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <User size={22} className="text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-white">{user.displayName}</p>
              <p className="text-xs text-slate-400">
                {isAdmin ? '👑 Admin · ' : ''}{user.level}-daraja · {user.streakDays} kun zanjir
              </p>
            </div>
          </div>
        )}

        {/* Menu items */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <MenuItem icon={<Bell size={18} className="text-blue-400" />} label="Bildirishnomalar" onClick={() => navigate('/notifications')} />
          <MenuItem icon={<BarChart2 size={18} className="text-purple-400" />} label="So'rovnomalar" onClick={() => navigate('/polls')} />
          <MenuItem icon={<Lock size={18} className="text-amber-400" />} label="PIN kodni o'zgartirish" onClick={resetPin} />
        </div>

        {isAdmin && (
          <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl overflow-hidden">
            <MenuItem
              icon={<Shield size={18} className="text-emerald-400" />}
              label="Admin panel"
              sublabel="Faqat adminlar uchun"
              onClick={() => navigate('/admin')}
              highlight
            />
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <MenuItem
            icon={<LogOut size={18} className="text-rose-400" />}
            label="Chiqish"
            onClick={logout}
            danger
          />
        </div>

        <p className="text-center text-xs text-slate-600 pt-2">Uswaa v1.0</p>
      </div>
    </div>
  );
}

function MenuItem({ icon, label, sublabel, onClick, highlight, danger }: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-4 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/50 transition-colors"
    >
      <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className={`text-sm font-medium ${danger ? 'text-rose-400' : highlight ? 'text-emerald-400' : 'text-white'}`}>
          {label}
        </p>
        {sublabel && <p className="text-xs text-slate-500 mt-0.5">{sublabel}</p>}
      </div>
      <ChevronRight size={16} className="text-slate-600" />
    </motion.button>
  );
}
