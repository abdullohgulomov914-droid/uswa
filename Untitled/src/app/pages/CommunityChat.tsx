import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Send, Loader2, Sparkles, Users, Lock } from 'lucide-react';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api';

interface Post {
  id: number;
  content: string;
  isOwnPost: boolean;
  authorName?: string;
  authorLevel?: number;
  likes: number;
  createdAt: string;
}

const LEVEL_NAMES: Record<number, string> = {
  1: 'Yangi boshlovchi', 2: 'Kurashchi', 3: 'Jangchi',
  4: 'Qahramon', 5: 'Master', 6: 'Ustoz',
};

export function CommunityChat() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [userLevel, setUserLevel] = useState(1);
  const [showAiToast, setShowAiToast] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      api.request<any>('/community'),
      api.request<any>('/user/me'),
    ]).then(([postsRes, userRes]) => {
      if (postsRes.success && postsRes.data) setPosts(postsRes.data);
      if (userRes.success && userRes.data) setUserLevel(userRes.data.level || 1);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [posts]);

  const send = async () => {
    if (!content.trim() || posting) return;
    setPosting(true);
    const res = await api.request<any>('/community', {
      method: 'POST',
      body: JSON.stringify({ content: content.trim(), isAnonymous: true }),
    });
    if (res.success) {
      setContent('');
      const postsRes = await api.request<any>('/community');
      if (postsRes.success && postsRes.data) setPosts(postsRes.data);
    }
    setPosting(false);
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });

  const getLevelBadge = (level?: number) => {
    if (!level) return null;
    const name = LEVEL_NAMES[Math.min(level, 6)];
    const colors: Record<number, string> = {
      1: 'text-slate-400 bg-slate-800',
      2: 'text-blue-400 bg-blue-500/20',
      3: 'text-indigo-400 bg-indigo-500/20',
      4: 'text-purple-400 bg-purple-500/20',
      5: 'text-amber-400 bg-amber-500/20',
      6: 'text-emerald-400 bg-emerald-500/20',
    };
    return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${colors[Math.min(level, 6)]}`}>{name}</span>;
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md shrink-0">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-emerald-400" />
            <p className="font-semibold text-sm">Anonim Hamjamiyat</p>
          </div>
          <p className="text-xs text-slate-500">Barcha xabarlar anonim</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Lock size={12} />
          <span>Maxfiy</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

        {/* Uswaa AI card — eng yuqorida */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3 items-start"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
            <Sparkles size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-emerald-400">Uswaa AI</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Beta</span>
            </div>
            <button
              onClick={() => setShowAiToast(true)}
              className="bg-slate-800/80 border border-emerald-500/20 rounded-2xl rounded-tl-sm px-4 py-3 text-left w-full hover:border-emerald-500/40 transition-all active:scale-[0.98]"
            >
              <p className="text-sm text-slate-200 mb-1">Salom! Men Uswaa AI — sizning shaxsiy tiklanish yordamchingizman. 🌱</p>
              <p className="text-xs text-slate-400">Istak kelganda, qiyin paytlarda men bilan gaplashing...</p>
              <div className="mt-2 flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                <Sparkles size={12} />
                Tez orada qo'shiladi →
              </div>
            </button>
          </div>
        </motion.div>

        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-[10px] text-slate-600">Hamjamiyat xabarlari</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
        ) : posts.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-6">Hali xabar yo'q. Birinchi bo'ling! 👋</p>
        ) : (
          posts.map(p => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 items-start ${p.isOwnPost ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${p.isOwnPost ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                {p.isOwnPost ? 'S' : 'A'}
              </div>
              <div className={`max-w-[78%] ${p.isOwnPost ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {!p.isOwnPost && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400">Anonim</span>
                    {getLevelBadge(p.authorLevel)}
                  </div>
                )}
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${p.isOwnPost ? 'bg-emerald-500 text-white rounded-tr-sm' : 'bg-slate-800 text-slate-100 rounded-tl-sm'}`}>
                  {p.content}
                </div>
                <span className="text-[10px] text-slate-600">{formatTime(p.createdAt)}</span>
              </div>
            </motion.div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md flex gap-2 items-end shrink-0">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Anonim xabar yozing..."
          rows={1}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
        />
        <button
          onClick={send}
          disabled={!content.trim() || posting}
          className="w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 flex items-center justify-center transition-colors shrink-0"
        >
          {posting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>

      {/* AI Toast */}
      <AnimatePresence>
        {showAiToast && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6"
            onClick={() => setShowAiToast(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 text-center space-y-4 max-w-xs w-full"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                <Sparkles size={28} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Uswaa AI</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Shaxsiy AI yordamchi tez orada qo'shiladi. U sizga istak kelganda, qiyin paytlarda va tiklanish jarayonida yordam beradi.
              </p>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <p className="text-xs text-emerald-400 font-medium">🚀 Tez orada qo'shiladi</p>
              </div>
              <button
                onClick={() => setShowAiToast(false)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Tushunarli
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
