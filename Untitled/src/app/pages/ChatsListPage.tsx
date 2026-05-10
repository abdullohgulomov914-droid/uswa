import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, Users, User, Lock, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api';

const PROBLEM_LABELS: Record<string, string> = {
  pornography: 'Pornografiya',
  drugs: 'Giyohvand moddalar',
  alcohol: 'Alkogol',
  smoking: 'Chekish',
  gambling: 'Qimor',
  gaming: "O'yinlar",
  social_media: 'Ijtimoiy tarmoqlar',
  overeating: 'Ortiqcha ovqatlanish',
  other: 'Boshqa',
};

export function ChatsListPage() {
  const navigate = useNavigate();
  const [problem, setProblem] = useState<string>('');
  const [buddyId, setBuddyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.request<any>('/user/me'),
      api.request<any>('/community/buddy'),
    ]).then(([userRes, buddyRes]) => {
      if (userRes.success) setProblem(userRes.data?.problem || '');
      if (buddyRes.success && buddyRes.data) setBuddyId(buddyRes.data.id);
      setLoading(false);
    });
  }, []);

  const problemLabel = PROBLEM_LABELS[problem] || problem;

  const chats = [
    {
      id: 'ai',
      icon: <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20"><Sparkles size={22} className="text-white" /></div>,
      name: 'Uswaa AI',
      desc: 'Shaxsiy tiklanish yordamchisi',
      badge: 'Tez orada',
      badgeColor: 'bg-emerald-500/20 text-emerald-400',
      onClick: () => navigate('/community'), // AI toast chiqadi
      locked: false,
      comingSoon: true,
    },
    {
      id: 'general',
      icon: <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center"><Users size={22} className="text-blue-400" /></div>,
      name: 'Uswaa davrasi',
      desc: 'Barcha foydalanuvchilar uchun umumiy chat',
      badge: 'Umumiy',
      badgeColor: 'bg-blue-500/20 text-blue-400',
      onClick: () => navigate('/community'),
      locked: false,
      comingSoon: false,
    },
    ...(problem ? [{
      id: 'problem',
      icon: <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center"><Users size={22} className="text-purple-400" /></div>,
      name: `${problemLabel} davrasi`,
      desc: `Faqat ${problemLabel.toLowerCase()} bilan kurashayotganlar`,
      badge: 'Kichik davra',
      badgeColor: 'bg-purple-500/20 text-purple-400',
      onClick: () => navigate('/community'),
      locked: false,
      comingSoon: false,
    }] : []),
    ...(buddyId ? [{
      id: 'buddy',
      icon: <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center"><User size={22} className="text-indigo-400" /></div>,
      name: 'Shaxsiy hamroh',
      desc: 'Anonim hamrohingiz bilan shaxsiy chat',
      badge: 'Shaxsiy',
      badgeColor: 'bg-indigo-500/20 text-indigo-400',
      onClick: () => navigate(`/chat/${buddyId}`),
      locked: false,
      comingSoon: false,
    }] : []),
    {
      id: 'psychologist',
      icon: <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center"><User size={22} className="text-amber-400" /></div>,
      name: 'Psixolog',
      desc: 'Mutaxassis bilan maslahat',
      badge: 'Premium',
      badgeColor: 'bg-amber-500/20 text-amber-400',
      onClick: () => {},
      locked: true,
      comingSoon: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-8">
      <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-slate-800">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-white">Chatlar</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
      ) : (
        <div className="px-4 py-4 space-y-3">
          {chats.map(chat => (
            <motion.button
              key={chat.id}
              whileTap={{ scale: chat.locked ? 1 : 0.98 }}
              onClick={chat.locked ? undefined : chat.onClick}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                chat.locked
                  ? 'bg-slate-900/40 border-slate-800/50 opacity-60 cursor-not-allowed'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 active:bg-slate-800'
              }`}
            >
              <div className="shrink-0">{chat.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-sm text-white">{chat.name}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${chat.badgeColor}`}>
                    {chat.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate">{chat.desc}</p>
              </div>
              {chat.locked ? (
                <Lock size={16} className="text-slate-600 shrink-0" />
              ) : (
                <ChevronRight size={16} className="text-slate-600 shrink-0" />
              )}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
