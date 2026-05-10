import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Brain, Activity, Zap, BookOpen, ChevronDown, ChevronUp, Search, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { api } from "../../lib/api";

interface Article {
  id: number;
  title: string;
  summary: string;
  content: string;
  problem_type?: string;
  source?: string;
}

interface GlossaryTerm {
  id: number;
  term: string;
  definition: string;
  category?: string;
}

export function Science() {
  const [streakDays, setStreakDays] = useState(0);
  const [articles, setArticles] = useState<Article[]>([]);
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([]);
  const [expandedArticle, setExpandedArticle] = useState<number | null>(null);
  const [glossarySearch, setGlossarySearch] = useState('');
  const [activeTab, setActiveTab] = useState<'chart' | 'articles' | 'glossary'>('chart');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.request<any>('/user/me'),
      api.request<Article[]>('/science/articles'),
      api.request<GlossaryTerm[]>('/science/glossary'),
    ]).then(([userRes, articlesRes, glossaryRes]) => {
      if (userRes.success) setStreakDays(userRes.data?.streakDays || 0);
      if (articlesRes.success && articlesRes.data) setArticles(articlesRes.data);
      if (glossaryRes.success && glossaryRes.data) setGlossary(glossaryRes.data);
      setLoading(false);
    });
  }, []);

  // Real recovery chart based on actual streak
  const chartData = [0, 7, 14, 30, 60, 90].map(day => ({
    day,
    dopamine: Math.max(100, 200 - day * 1.1),
    prefrontal: Math.min(100, 30 + day * 0.78),
    current: day <= streakDays ? Math.min(100, 30 + day * 0.78) : undefined,
  }));

  const brainStats = {
    dopamine: Math.max(100, Math.round(200 - streakDays * 1.1)),
    prefrontal: Math.min(100, Math.round(30 + streakDays * 0.78)),
    recovery: Math.min(100, Math.round((streakDays / 90) * 100)),
  };

  const filteredGlossary = glossary.filter(t =>
    t.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
    t.definition.toLowerCase().includes(glossarySearch.toLowerCase())
  );

  return (
    <div className="p-6 flex flex-col gap-4 h-full overflow-y-auto">
      <header className="mt-4">
        <h1 className="text-2xl font-bold text-white mb-1">Ilmiy</h1>
        <p className="text-slate-400 text-sm">Neyro-ilmiy tahlil va maqolalar.</p>
      </header>

      {/* Tabs */}
      <div className="flex bg-slate-900 rounded-2xl p-1 gap-1">
        {(['chart', 'articles', 'glossary'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${activeTab === tab ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>
            {tab === 'chart' ? 'Dinamika' : tab === 'articles' ? 'Maqolalar' : 'Lug\'at'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
      ) : (
        <>
          {activeTab === 'chart' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Brain stats */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Tiklanish" value={`${brainStats.recovery}%`} color="emerald" />
                <StatCard label="Dopamin" value={`${brainStats.dopamine}%`} color="rose" />
                <StatCard label="Iroda" value={`${brainStats.prefrontal}%`} color="teal" />
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <Activity size={16} className="text-emerald-400" />
                  Tiklanish dinamikasi ({streakDays} kun)
                </h3>
                <div className="h-56 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorDopamine" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorPrefrontal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" stroke="#475569" tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} />
                      <YAxis stroke="#475569" tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} itemStyle={{ fontSize: '12px' }} />
                      <ReferenceLine x={streakDays} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Hozir', fill: '#10b981', fontSize: 10 }} />
                      <Area type="monotone" name="Dopamin sezuvchanligi" dataKey="dopamine" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorDopamine)" />
                      <Area type="monotone" name="Prefrontal korteks" dataKey="prefrontal" stroke="#2dd4bf" strokeWidth={2} fillOpacity={1} fill="url(#colorPrefrontal)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-4 mt-3 text-[10px] text-slate-400 justify-center">
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Dopamin</div>
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-400" /> Iroda</div>
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Hozirgi holat</div>
                </div>
              </div>

              <div className="grid gap-3">
                <InfoCard icon={<Zap className="text-rose-400" />} title="Amigdala (Reaksiya)"
                  desc={`Hozirda istaklar kelganda amigdala faoliyati ${brainStats.recovery < 50 ? 'biroz yuqori' : 'normallashmoqda'}. ${streakDays} kunlik sa'y-harakatingiz natija bermoqda.`} />
                <InfoCard icon={<Brain className="text-teal-400" />} title="Prefrontal Korteks"
                  desc={`Sizning "Yo'q" deya olish qobiliyatingiz ${brainStats.prefrontal}% ga yetdi. Har bir yengib o'tilgan istak bilan kuchayib bormoqda.`} />
              </div>
            </motion.div>
          )}

          {activeTab === 'articles' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {articles.length === 0 ? (
                <div className="text-center py-10">
                  <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Hali maqolalar qo'shilmagan</p>
                  <p className="text-slate-600 text-xs mt-1">Admin panel orqali qo'shing</p>
                </div>
              ) : (
                articles.map(a => (
                  <div key={a.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <button className="w-full p-4 text-left flex justify-between items-start gap-3"
                      onClick={() => setExpandedArticle(expandedArticle === a.id ? null : a.id)}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {a.problem_type && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">{a.problem_type}</span>}
                        </div>
                        <h4 className="font-semibold text-slate-200 text-sm">{a.title}</h4>
                        <p className="text-xs text-slate-400 mt-1">{a.summary}</p>
                      </div>
                      {expandedArticle === a.id ? <ChevronUp size={16} className="text-slate-400 shrink-0 mt-1" /> : <ChevronDown size={16} className="text-slate-400 shrink-0 mt-1" />}
                    </button>
                    {expandedArticle === a.id && (
                      <div className="px-4 pb-4 border-t border-slate-800 pt-3">
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{a.content}</p>
                        {a.source && <p className="text-xs text-slate-500 mt-3">Manba: {a.source}</p>}
                      </div>
                    )}
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'glossary' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
                <Search size={16} className="text-slate-500" />
                <input type="text" placeholder="Qidirish..." value={glossarySearch} onChange={e => setGlossarySearch(e.target.value)}
                  className="bg-transparent text-sm text-slate-200 outline-none w-full placeholder-slate-600" />
              </div>
              {filteredGlossary.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-slate-500 text-sm">{glossarySearch ? 'Topilmadi' : 'Hali lug\'at qo\'shilmagan'}</p>
                </div>
              ) : (
                filteredGlossary.map(t => (
                  <div key={t.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-emerald-400 text-sm">{t.term}</h4>
                      {t.category && <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{t.category}</span>}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{t.definition}</p>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    teal: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
  };
  return (
    <div className={`p-3 rounded-2xl border text-center ${colors[color]}`}>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] opacity-70 mt-0.5">{label}</p>
    </div>
  );
}

function InfoCard({ icon, title, desc }: any) {
  return (
    <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex gap-4 items-start">
      <div className="p-2 bg-slate-800 rounded-xl shrink-0">{icon}</div>
      <div>
        <h4 className="text-sm font-semibold text-slate-200 mb-1">{title}</h4>
        <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
