import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { Flame, Brain, Shield, Award, ChevronRight, Loader2, MessageCircle, BookOpen, Bell, Settings, X } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { api } from '../../lib/api';

interface UserStats {
  displayName: string;
  streakDays: number;
  longestStreak: number;
  xp: number;
  level: number;
  buddyId?: number;
  featuredArticle?: { id: number; title: string; summary: string; problem_type?: string } | null;
}

export function Dashboard() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [feedbackRequest, setFeedbackRequest] = useState<any>(null);
  const [feedbackAnswer, setFeedbackAnswer] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { loadUserData(); }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userResponse = await api.getMe();
      if (userResponse.success && userResponse.data) {
        const userData = userResponse.data as any;
        setIsAdmin(Boolean(userData.isAdmin));

        const [buddyRes, articlesRes, unreadRes] = await Promise.all([
          api.request<any>('/community/buddy'),
          api.request<any>('/science/articles'),
          api.request<any>('/notifications/unread'),
        ]);

        if (unreadRes.success) setUnreadCount(unreadRes.data?.count || 0);

        // Auto daily check-in
        api.request('/user/auto-checkin', { method: 'POST' });

        // Check active feedback request
        const fbRes = await api.request<any>('/user/feedback-request/active');
        if (fbRes.success && fbRes.data) setFeedbackRequest(fbRes.data);

        setStats({
          displayName: userData.displayName || 'Foydalanuvchi',
          streakDays: userData.streakDays || 0,
          longestStreak: userData.longestStreak || 0,
          xp: userData.xp || 0,
          level: userData.level || 1,
          buddyId: buddyRes.success && buddyRes.data ? buddyRes.data.id : undefined,
          featuredArticle: articlesRes.success && articlesRes.data?.length > 0 ? articlesRes.data[0] : null,
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
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async () => {
    if (!feedbackAnswer.trim() || !feedbackRequest) return;
    await api.request('/user/feedback-answer', {
      method: 'POST',
      body: JSON.stringify({ requestId: feedbackRequest.id, answer: feedbackAnswer }),
    });
    setFeedbackSent(true);
    setTimeout(() => { setFeedbackRequest(null); setFeedbackSent(false); setFeedbackAnswer(''); }, 1500);
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
    <div className="p-5 flex flex-col gap-5 pb-28">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 flex items-center justify-between"
      >
        <h1 className="text-xl font-bold text-white leading-tight">
          Men {userName}<br />
          <span className="text-emerald-400">sog'lom insonman.</span>
        </h1>

        {/* Header actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button
            onClick={() => navigate('/notifications')}
            className="relative w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-slate-800 transition-all"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-emerald-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Chats */}
          <button
            onClick={() => navigate('/chats')}
            className="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:border-blue-500/40 hover:bg-slate-800 transition-all"
          >
            <MessageCircle size={18} />
          </button>
        </div>
      </motion.header>

      {/* Main Stats Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
        onClick={() => navigate('/streak')}
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

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <ActionCard icon={<Brain className="text-blue-400" />} title="Miya holati" subtitle="Tahlil" to="/science" delay={0.2} />
        <ActionCard icon={<Shield className="text-purple-400" />} title="STAR+ Jurnal" subtitle="Qaydlar" to="/journal" delay={0.3} />
      </div>

      {/* Featured article */}
      {stats?.featuredArticle && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={14} className="text-blue-400" />
            <span className="text-xs text-blue-400 font-medium">Ilmiy maqola</span>
            {stats.featuredArticle.problem_type && (
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">{stats.featuredArticle.problem_type}</span>
            )}
          </div>
          <p className="text-sm font-semibold text-white mb-1">{stats.featuredArticle.title}</p>
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{stats.featuredArticle.summary}</p>
          <Link to="/science" className="text-xs text-emerald-400 mt-2 inline-flex items-center gap-1">
            Barchasini ko'rish <ChevronRight size={12} />
          </Link>
        </motion.div>
      )}

      {/* Level card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-3">
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
          <Link to="/level" className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-sm font-medium rounded-xl transition-colors">
            Daraja haqida <ChevronRight size={16} />
          </Link>
          {stats?.buddyId && (
            <button
              onClick={() => navigate(`/chat/${stats.buddyId}`)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-xl transition-colors border border-emerald-500/20"
            >
              <MessageCircle size={16} /> Chat
            </button>
          )}
        </div>
      </motion.div>

      {/* Settings card — simple */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <button
          onClick={() => navigate('/settings')}
          className="w-full flex items-center gap-4 p-5 bg-slate-900/40 border border-slate-800 rounded-2xl hover:bg-slate-800/60 active:scale-[0.98] transition-all text-left"
        >
          <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center shrink-0">
            <Settings size={20} className="text-slate-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Sozlamalar</p>
            <p className="text-xs text-slate-500 mt-0.5">Profil, bildirishnomalar, PIN</p>
          </div>
          <ChevronRight size={16} className="text-slate-600" />
        </button>
      </motion.div>

      {/* Feedback request modal */}
      <AnimatePresence>
        {feedbackRequest && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center p-4">
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              className="w-full max-w-sm bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white">💬 Platformadan so'rov</h2>
                <button onClick={() => setFeedbackRequest(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{feedbackRequest.question}</p>
              {feedbackSent ? (
                <p className="text-center text-emerald-400 font-medium py-2">✅ Rahmat! Javobingiz qabul qilindi.</p>
              ) : (
                <>
                  <textarea value={feedbackAnswer} onChange={e => setFeedbackAnswer(e.target.value)}
                    placeholder="Fikringizni yozing..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-emerald-500 min-h-[80px] resize-none" />
                  <button onClick={submitFeedback} disabled={!feedbackAnswer.trim()}
                    className="w-full py-3 bg-emerald-500 disabled:bg-slate-700 text-white font-medium rounded-xl">
                    Yuborish
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActionCard({ icon, title, subtitle, to, delay }: { icon: React.ReactNode; title: string; subtitle: string; to: string; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Link to={to} className="block p-4 bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-3xl hover:bg-slate-800/60 transition-colors">
        <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center mb-3">{icon}</div>
        <h4 className="font-semibold text-sm">{title}</h4>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </Link>
    </motion.div>
  );
}
