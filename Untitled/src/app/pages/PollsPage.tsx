import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, BarChart2, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api';

interface PollOption { index: number; text: string; votes: number; percent: number; }
interface Poll { id: number; question: string; options: PollOption[]; totalVotes: number; userVote: number | null; problemType?: string; createdAt: string; }

export function PollsPage() {
  const navigate = useNavigate();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<number | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const res = await api.request<Poll[]>('/polls');
    if (res.success && res.data) setPolls(res.data);
    setLoading(false);
  };

  const vote = async (pollId: number, optionIndex: number) => {
    setVoting(pollId);
    await api.request(`/polls/${pollId}/vote`, { method: 'POST', body: JSON.stringify({ optionIndex }) });
    await load();
    setVoting(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-8">
      <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-slate-800">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white"><ArrowLeft size={22} /></button>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart2 size={20} className="text-emerald-400" /> So'rovnomalar
        </h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
        ) : polls.length === 0 ? (
          <div className="text-center py-16">
            <BarChart2 className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Hali so'rovnoma yo'q</p>
          </div>
        ) : polls.map(poll => (
          <motion.div key={poll.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-white leading-relaxed">{poll.question}</p>
              {poll.problemType && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full shrink-0">{poll.problemType}</span>
              )}
            </div>

            <div className="space-y-2">
              {poll.options.map(opt => {
                const voted = poll.userVote === opt.index;
                const hasVoted = poll.userVote !== null;
                return (
                  <button key={opt.index} onClick={() => !hasVoted && vote(poll.id, opt.index)}
                    disabled={hasVoted || voting === poll.id}
                    className={`w-full text-left rounded-xl overflow-hidden transition-all ${hasVoted ? 'cursor-default' : 'hover:border-emerald-500/50 active:scale-[0.98]'}`}>
                    <div className={`relative p-3 border rounded-xl ${voted ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-700 bg-slate-800/50'}`}>
                      {hasVoted && (
                        <div className="absolute inset-0 rounded-xl overflow-hidden">
                          <div className={`h-full transition-all ${voted ? 'bg-emerald-500/20' : 'bg-slate-700/30'}`} style={{ width: `${opt.percent}%` }} />
                        </div>
                      )}
                      <div className="relative flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {voted && <CheckCircle size={14} className="text-emerald-400 shrink-0" />}
                          <span className={`text-sm ${voted ? 'text-emerald-300 font-medium' : 'text-slate-300'}`}>{opt.text}</span>
                        </div>
                        {hasVoted && <span className="text-xs text-slate-400 shrink-0">{opt.percent}%</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-slate-500">{poll.totalVotes} ta ovoz</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
