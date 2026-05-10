import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Trophy, Star, Zap, Loader2 } from "lucide-react";
import { useNavigate } from "react-router";
import { api } from "../../lib/api";

const LEVELS = [
  { level: 1, name: 'Yangi boshlovchi', xp: 0, color: 'slate', desc: 'Siz o\'zgarish yo\'lini boshladingiz.' },
  { level: 2, name: 'Kurashchi', xp: 500, color: 'blue', desc: 'Birinchi qadamlar eng qiyini. Siz davom etyapsiz.' },
  { level: 3, name: 'Jangchi', xp: 1000, color: 'indigo', desc: 'Miyangiz o\'zgarmoqda. Dopamin normallashmoqda.' },
  { level: 4, name: 'Qahramon', xp: 1500, color: 'purple', desc: 'Prefrontal korteks kuchaydi. Iroda mustahkamlandi.' },
  { level: 5, name: 'Master', xp: 2000, color: 'amber', desc: 'Yangi odatlar shakllanmoqda. Siz namunasiniz.' },
  { level: 6, name: 'Ustoz', xp: 2500, color: 'emerald', desc: 'To\'liq tiklanish. Boshqalarga ilhom bo\'ling.' },
];

const colorMap: Record<string, string> = {
  slate: 'from-slate-500 to-slate-400',
  blue: 'from-blue-500 to-blue-400',
  indigo: 'from-indigo-500 to-indigo-400',
  purple: 'from-purple-500 to-purple-400',
  amber: 'from-amber-500 to-yellow-400',
  emerald: 'from-emerald-500 to-teal-400',
};

export function LevelPage() {
  const navigate = useNavigate();
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.request<any>('/user/me').then(res => {
      if (res.success && res.data) {
        setXp(res.data.xp || 0);
        setLevel(res.data.level || 1);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
    </div>
  );

  const currentLevel = LEVELS.find(l => l.level === Math.min(level, 6)) || LEVELS[0];
  const nextLevel = LEVELS.find(l => l.level === Math.min(level + 1, 6));
  const xpInLevel = xp % 500;
  const xpPercent = (xpInLevel / 500) * 100;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-8">
      <div className="flex items-center gap-3 px-6 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-white">Daraja tizimi</h1>
      </div>

      <div className="px-6 space-y-5">
        {/* Current level card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className={`bg-gradient-to-br ${colorMap[currentLevel.color]}/20 border border-${currentLevel.color}-500/30 rounded-3xl p-6`}>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colorMap[currentLevel.color]} flex items-center justify-center`}>
              <Trophy size={32} className="text-white" />
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">{level}-daraja</p>
              <h2 className="text-2xl font-bold text-white">{currentLevel.name}</h2>
            </div>
          </div>
          <p className="text-sm text-slate-300 mb-4">{currentLevel.desc}</p>

          {nextLevel && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Keyingi: {nextLevel.name}</span>
                <span className="text-amber-400">{xpInLevel} / 500 XP</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${xpPercent}%` }} transition={{ duration: 1 }}
                  className={`h-full bg-gradient-to-r ${colorMap[currentLevel.color]} rounded-full`} />
              </div>
            </div>
          )}
        </motion.div>

        {/* XP stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center">
            <Zap size={20} className="text-yellow-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{xp}</p>
            <p className="text-xs text-slate-400">Jami XP</p>
          </div>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center">
            <Star size={20} className="text-amber-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{level}</p>
            <p className="text-xs text-slate-400">Daraja</p>
          </div>
        </div>

        {/* XP earning guide */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">XP qanday topiladi?</h3>
          <div className="space-y-2">
            {[
              { action: 'Kunlik check-in', xp: '+10 XP' },
              { action: 'Trigger qayd etish', xp: '+10 XP' },
              { action: 'Hamjamiyatda ulashish', xp: '+20 XP' },
            ].map(item => (
              <div key={item.action} className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0">
                <span className="text-sm text-slate-300">{item.action}</span>
                <span className="text-sm font-semibold text-emerald-400">{item.xp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* All levels */}
        <h3 className="font-semibold text-slate-300">Barcha darajalar</h3>
        <div className="space-y-2">
          {LEVELS.map(l => {
            const unlocked = xp >= l.xp;
            const isCurrent = l.level === Math.min(level, 6);
            return (
              <div key={l.level} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${isCurrent ? 'bg-emerald-500/10 border-emerald-500/30' : unlocked ? 'bg-slate-900 border-slate-700' : 'bg-slate-900/40 border-slate-800 opacity-50'}`}>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[l.color]} flex items-center justify-center text-white font-bold text-sm`}>
                  {l.level}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${isCurrent ? 'text-emerald-400' : unlocked ? 'text-white' : 'text-slate-500'}`}>{l.name}</p>
                  <p className="text-xs text-slate-500">{l.xp} XP dan</p>
                </div>
                {isCurrent && <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">Hozir</span>}
                {unlocked && !isCurrent && <span className="text-xs text-slate-400">✓</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
