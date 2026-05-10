import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Flame, Trophy, Zap, RefreshCw, BookOpen, Shield, Loader2 } from "lucide-react";
import { useNavigate } from "react-router";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { api } from "../../lib/api";

export function StreakAnalytics() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.request<any>('/user/me'),
      api.request<any>('/user/stats'),
    ]).then(([userRes, statsRes]) => {
      if (userRes.success && statsRes.success) {
        setData({ user: userRes.data, stats: statsRes.data });
      }
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
    </div>
  );

  const streakDays = data?.user?.streakDays || 0;
  const longestStreak = data?.user?.longestStreak || 0;
  const xp = data?.user?.xp || 0;
  const level = data?.user?.level || 1;
  const journalEntries = data?.stats?.journalEntries || 0;
  const relapses = data?.stats?.relapsesLogged || 0;
  const emergencyTotal = data?.stats?.emergencySessions?.total || 0;
  const emergencySuccess = data?.stats?.emergencySessions?.successful || 0;

  // Progress chart — 90 day milestones
  const milestones = [
    { day: 3, label: '3 kun', desc: 'Fizik yechim boshlandi' },
    { day: 7, label: '1 hafta', desc: 'Uyqu yaxshilandi' },
    { day: 14, label: '2 hafta', desc: 'Energiya oshdi' },
    { day: 30, label: '1 oy', desc: 'Dopamin normallashdi' },
    { day: 60, label: '2 oy', desc: 'Prefrontal kuchaydi' },
    { day: 90, label: '90 kun', desc: 'To\'liq tiklanish' },
  ];

  const chartData = milestones.map(m => ({
    label: m.label,
    progress: Math.min(100, Math.round((Math.min(streakDays, m.day) / m.day) * 100)),
    target: 100,
  }));

  const recoveryPercent = Math.min(100, Math.round((streakDays / 90) * 100));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-white">Zanjir Analitikasi</h1>
      </div>

      <div className="px-6 space-y-5">
        {/* Main streak card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-900/40 to-slate-900 border border-emerald-500/20 rounded-3xl p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-sm mb-1">Joriy zanjir</p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black text-emerald-400">{streakDays}</span>
                <span className="text-slate-400 text-lg">kun</span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Flame className="text-emerald-400" fill="currentColor" size={28} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-emerald-400">Tiklanish</span>
              <span className="text-slate-400">{recoveryPercent}% / 90 kun</span>
            </div>
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${recoveryPercent}%` }} transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full" />
            </div>
          </div>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatBox icon={<Trophy size={18} className="text-amber-400" />} label="Eng uzun zanjir" value={`${longestStreak} kun`} />
          <StatBox icon={<Zap size={18} className="text-yellow-400" />} label="Jami XP" value={`${xp} XP`} />
          <StatBox icon={<BookOpen size={18} className="text-blue-400" />} label="Jurnal yozuvlar" value={`${journalEntries} ta`} />
          <StatBox icon={<Shield size={18} className="text-purple-400" />} label="Favqulodda" value={`${emergencySuccess}/${emergencyTotal}`} />
        </div>

        {/* Milestone progress */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Bosqichlar</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                  formatter={(v: any) => [`${v}%`, 'Bajarildi']} />
                <Bar dataKey="progress" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Milestones list */}
        <div className="space-y-2">
          {milestones.map(m => {
            const done = streakDays >= m.day;
            const current = streakDays < m.day && streakDays >= (milestones[milestones.indexOf(m) - 1]?.day || 0);
            return (
              <div key={m.day} className={`flex items-center gap-4 p-4 rounded-2xl border ${done ? 'bg-emerald-500/10 border-emerald-500/20' : current ? 'bg-slate-900 border-emerald-500/40' : 'bg-slate-900/50 border-slate-800'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${done ? 'bg-emerald-500 text-slate-900' : current ? 'bg-slate-800 text-emerald-400 border border-emerald-500/50' : 'bg-slate-800 text-slate-500'}`}>
                  {done ? '✓' : m.day}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${done ? 'text-emerald-400' : current ? 'text-white' : 'text-slate-500'}`}>{m.label}</p>
                  <p className="text-xs text-slate-500">{m.desc}</p>
                </div>
                {current && <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">Hozir</span>}
              </div>
            );
          })}
        </div>

        {/* Relapse info */}
        {relapses > 0 && (
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4">
            <RefreshCw size={20} className="text-slate-400" />
            <div>
              <p className="text-sm text-slate-300">Qayd etilgan yiqilishlar: <span className="text-white font-bold">{relapses}</span></p>
              <p className="text-xs text-slate-500 mt-0.5">Har bir yiqilish — yangi boshlash imkoniyati</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-slate-400">{label}</span></div>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}
