import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { RefreshCw, AlertTriangle, ArrowRight, Heart, Loader2, ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { api } from "../../lib/api";

interface RelapseEntry {
  id: number;
  trigger: string;
  notes?: string;
  mood?: string;
  loggedAt: string;
}

export function Relapse() {
  const [step, setStep] = useState<'list' | 'log' | 'done'>('list');
  const [relapses, setRelapses] = useState<RelapseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [trigger, setTrigger] = useState('');
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState('');
  const [saving, setSaving] = useState(false);
  const [prevStreak, setPrevStreak] = useState(0);

  useEffect(() => { loadRelapses(); }, []);

  const loadRelapses = async () => {
    const res = await api.request<RelapseEntry[]>('/relapse');
    if (res.success && res.data) setRelapses(res.data);
    setLoading(false);
  };

  const logRelapse = async () => {
    if (!trigger.trim()) return;
    setSaving(true);
    const userRes = await api.request<any>('/user/me');
    if (userRes.success) setPrevStreak(userRes.data?.streakDays || 0);

    const res = await api.request<any>('/relapse', {
      method: 'POST',
      body: JSON.stringify({ trigger, notes: notes || undefined, mood: mood || undefined }),
    });
    if (res.success && res.data) setPrevStreak(res.data.previousStreak || 0);
    setSaving(false);
    setStep('done');
    loadRelapses();
  };

  const moods = ['😔', '😤', '😰', '😞', '😶'];

  return (
    <div className="p-6 flex flex-col gap-6 h-full overflow-y-auto">
      <header className="mt-4">
        <h1 className="text-2xl font-bold text-white mb-1">Tiklanish</h1>
        <p className="text-slate-400 text-sm">Har bir qadamingiz muhim.</p>
      </header>

      {step === 'list' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="p-5 bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-3xl">
            <div className="flex items-center gap-3 mb-3">
              <Heart className="text-rose-400" size={20} />
              <h3 className="font-semibold text-white">Yiqilish — bu oxiri emas</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Miya tiklanishi davom etmoqda. Bir qadam orqaga — bu urushni yutqazish emas. Qaytadan boshlash kuchlilik belgisi.
            </p>
            <button onClick={() => setStep('log')}
              className="w-full py-3 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors">
              <RefreshCw size={16} />
              Yiqilishni qayd etish
            </button>
          </div>

          <h3 className="font-semibold text-slate-300">Tarix</h3>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
          ) : relapses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">Hali yiqilish qayd etilmagan 💪</p>
            </div>
          ) : (
            <div className="space-y-3">
              {relapses.map(r => (
                <div key={r.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-slate-500">{new Date(r.loggedAt).toLocaleDateString('uz-UZ')}</span>
                    {r.mood && <span className="text-lg">{r.mood}</span>}
                  </div>
                  <p className="text-sm text-slate-300 font-medium">{r.trigger}</p>
                  {r.notes && <p className="text-xs text-slate-500 mt-1">{r.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {step === 'log' && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
          <div className="flex items-center gap-3 text-amber-400">
            <AlertTriangle size={20} />
            <h3 className="font-semibold">Bu mag'lubiyat emas, bu xato</h3>
          </div>
          <p className="text-sm text-slate-400">Tizimimizdagi bo'shliqni topamiz va keyingi safar tayyor bo'lamiz.</p>

          <div className="space-y-3">
            <label className="text-xs text-slate-500">Nima sabab bo'ldi? *</label>
            <textarea value={trigger} onChange={e => setTrigger(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-indigo-500/50 min-h-[80px] resize-none"
              placeholder="Masalan: Yolg'izlik, zerikish, stress..." />
          </div>

          <div className="space-y-3">
            <label className="text-xs text-slate-500">Qo'shimcha izoh (ixtiyoriy)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-indigo-500/50 min-h-[60px] resize-none"
              placeholder="Qo'shimcha ma'lumot..." />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-500">Kayfiyat</label>
            <div className="flex gap-3">
              {moods.map(m => (
                <button key={m} onClick={() => setMood(m)}
                  className={`text-2xl p-2 rounded-xl transition-all ${mood === m ? 'bg-slate-700 scale-110' : 'bg-slate-800 hover:bg-slate-700'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('list')} className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl text-sm">
              Bekor
            </button>
            <button onClick={logRelapse} disabled={!trigger.trim() || saving}
              className="flex-1 py-3 bg-indigo-500 disabled:bg-slate-700 text-white font-medium rounded-xl flex items-center justify-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <><ArrowRight size={16} />Saqlash</>}
            </button>
          </div>
        </motion.div>
      )}

      {step === 'done' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
            <Heart className="text-emerald-400" size={32} />
          </div>
          <h3 className="text-xl font-bold text-white">Qayd etildi</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Miyangizdagi o'zgarishlar birdaniga yo'qolmaydi. O'zingizni kechiring va tezda safga qayting. Siz kuchli insonisiz.
          </p>
          {prevStreak > 0 && (
            <div className="p-3 bg-slate-800 rounded-xl">
              <p className="text-xs text-slate-400">Oldingi zanjir: <span className="text-emerald-400 font-bold">{prevStreak} kun</span></p>
              <p className="text-xs text-slate-500 mt-1">Bu tajriba keyingi safar kuchliroq bo'lishingizga yordam beradi</p>
            </div>
          )}
          <Link to="/" className="w-full py-3 bg-emerald-500 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2">
            <RefreshCw size={18} />
            Qaytadan boshlash
          </Link>
        </motion.div>
      )}
    </div>
  );
}
