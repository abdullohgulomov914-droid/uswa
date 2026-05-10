import { useEffect, useState } from 'react';
import { motion } from "motion/react";
import { Flame, Brain, Shield, Award, ChevronRight, Loader2, MessageCircle } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { api } from '../../lib/api';

interface UserStats {
  displayName: string;
  streakDays: number;
  longestStreak: number;
  xp: number;
  level: number;
  buddyId?: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userResponse = await api.getMe();
      if (userResponse.success && userResponse.data) {
        const userData = userResponse.data as any;
        // Also fetch buddy
        const buddyRes = await api.request<any>('/community/buddy');
        setStats({
          displayName: userData.displayName || 'Foydalanuvchi',
          streakDays: userData.streakDays || 0,
          longestStreak: userData.longestStreak || 0,
          xp: userData.xp || 0,
          level: userData.level || 1,
          buddyId: buddyRes.success && buddyRes.data ? buddyRes.data.id : undefined,
        });
      } else {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setStats({
            displayName: userData.displayName || 'Foydalanuvchi',
            streakDays: userData.streakDays || 0,
            longestStreak: userData.longestStreak || 0,
            xp: userData.xp || 0,
            level: userData.level || 1,
          });
        }
      }
    } catch (err) {
      setError('Ma\'lumotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  const userName = stats?.displayName || 'Foydalanuvchi';
  const streakDays = stats?.streakDays || 0;
  const progressPercent = Math.min((streakDays / 90) * 100, 100);
  const level = stats?.level || 1;

  return (
    <div className="p-6 flex flex-col gap-8">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4"
      >
        <p className="text-slate-400 text-sm font-medium mb-1">Identity Shift</p>
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
          Men {userName} - sog'lom insonman.
        </h1>
      </motion.header>

      {/* Main Stats Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
        
        <div className="flex justify-between items-end mb-6 relative z-10">
          <div>
            <h2 className="text-slate-400 text-sm font-medium mb-1">Zanjirni uzma</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-emerald-400 tracking-tighter">{streakDays}</span>
              <span className="text-slate-500 font-medium">kun</span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Flame className="text-emerald-400" fill="currentColor" size={24} />
          </div>
        </div>

        {/* 90-day progress */}
        <div className="space-y-2 relative z-10">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-emerald-400">Miya tiklanishi</span>
            <span className="text-slate-500">90 kunga maqsad</span>
          </div>
          <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full relative"
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </motion.div>
          </div>
          <p className="text-[10px] text-slate-500 text-right mt-1">Dopamin reseptorlari {Math.round(progressPercent)}% normallashdi</p>
        </div>
      </motion.div>

      {/* Quick Actions / Stages */}
      <div className="grid grid-cols-2 gap-4">
        <ActionCard 
          icon={<Brain className="text-blue-400" />}
          title="Miya holati"
          subtitle="Tahlil"
          to="/science"
          delay={0.2}
          color="blue"
        />
        <ActionCard 
          icon={<Shield className="text-purple-400" />}
          title="STAR+ Jurnal"
          subtitle="Qaydlar"
          to="/journal"
          delay={0.3}
          color="purple"
        />
      </div>

      {/* Community / Buddy snapshot */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 mt-2"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Award size={16} className="text-amber-400" />
            Jangchi darajasi
          </h3>
          <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full font-medium">Lvl {level}</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed mb-4">
          Siz hozirda "Dopamin normallashuv" bosqichidasiz. Diqqatingiz va irodangiz har kungi o'tgan kun bilan kuchayib bormoqda.
        </p>
        <div className="flex gap-2">
          <Link to="/journal" className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-sm font-medium rounded-xl transition-colors">
            Daraja haqida <ChevronRight size={16} />
          </Link>
          {stats?.buddyId && (
            <button
              onClick={() => navigate(`/chat/${stats.buddyId}`)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-xl transition-colors border border-emerald-500/20"
            >
              <MessageCircle size={16} />
              Chat
            </button>
          )}
        </div>
      </motion.div>
      
    </div>
  );
}

function ActionCard({ icon, title, subtitle, to, delay, color }: { icon: React.ReactNode, title: string, subtitle: string, to: string, delay: number, color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Link to={to} className="block p-4 bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-3xl hover:bg-slate-800/60 transition-colors">
        <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center mb-3">
          {icon}
        </div>
        <h4 className="font-semibold text-sm">{title}</h4>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </Link>
    </motion.div>
  );
}
