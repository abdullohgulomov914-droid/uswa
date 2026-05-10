import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Eye, Shield, Users, Trophy, Plus, MapPin, Clock, Frown, Trash2, Loader2, MessageCircle } from "lucide-react";
import { api } from "../../lib/api";
import { useNavigate } from "react-router";

interface JournalEntry {
  id: number;
  type: string;
  content: string;
  triggerTime?: string;
  triggerLocation?: string;
  triggerFeeling?: string;
  isResolved: boolean;
  createdAt: string;
}

interface UserStats {
  streakDays: number;
  xp: number;
  level: number;
  buddyId?: number;
}

export function Journal() {
  const [activeTab, setActiveTab] = useState<"see" | "tackle" | "account" | "reward">("see");
  const [stats, setStats] = useState<UserStats | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const res = await api.request<any>('/user/stats');
    if (res.success && res.data) {
      const buddyRes = await api.request<any>('/community/buddy');
      setStats({
        streakDays: res.data.streakDays,
        xp: res.data.xp,
        level: res.data.level,
        buddyId: buddyRes.success && buddyRes.data ? buddyRes.data.id : undefined,
      });
    }
  };

  return (
    <div className="p-6 flex flex-col gap-6 h-full">
      <header className="mt-4">
        <h1 className="text-2xl font-bold text-white mb-2">STAR+ Tizimi</h1>
        <p className="text-slate-400 text-sm">O'z odatlaringizni ilmiy tahlil qiling.</p>
      </header>

      <div className="flex bg-slate-900 rounded-2xl p-1 gap-1">
        <Tab id="see" active={activeTab} set={setActiveTab} icon={<Eye size={16} />} label="Ko'r" />
        <Tab id="tackle" active={activeTab} set={setActiveTab} icon={<Shield size={16} />} label="Hal et" />
        <Tab id="account" active={activeTab} set={setActiveTab} icon={<Users size={16} />} label="Hamkor" />
        <Tab id="reward" active={activeTab} set={setActiveTab} icon={<Trophy size={16} />} label="Mukofot" />
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {activeTab === "see" && <SeeTab />}
        {activeTab === "tackle" && <TackleTab />}
        {activeTab === "account" && <AccountTab stats={stats} navigate={navigate} />}
        {activeTab === "reward" && <RewardTab stats={stats} />}
      </div>
    </div>
  );
}

function Tab({ id, active, set, icon, label }: any) {
  return (
    <button
      onClick={() => set(id)}
      className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${active === id ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
    >
      {icon}
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
    </button>
  );
}

function SeeTab() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [feeling, setFeeling] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadEntries(); }, []);

  const loadEntries = async () => {
    const res = await api.request<JournalEntry[]>('/journal?type=trigger');
    if (res.success && res.data) setEntries(res.data);
    setLoading(false);
  };

  const save = async () => {
    if (!feeling.trim()) return;
    setSaving(true);
    await api.request('/journal', {
      method: 'POST',
      body: JSON.stringify({
        type: 'trigger',
        content: feeling,
        triggerTime: time || undefined,
        triggerLocation: location || undefined,
        triggerFeeling: feeling,
      }),
    });
    setTime(''); setLocation(''); setFeeling('');
    await loadEntries();
    setSaving(false);
  };

  const remove = async (id: number) => {
    await api.request(`/journal/${id}`, { method: 'DELETE' });
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
        <h3 className="font-semibold text-emerald-400 mb-1">Yangi Trigger qo'shish</h3>
        <p className="text-xs text-slate-400 mb-4">Miyadagi naqshlarni aniqlang</p>
        <div className="space-y-3">
          <InputField icon={<Clock size={16} />} placeholder="Qachon? (Masalan: Kechqurun 22:00)" value={time} onChange={setTime} />
          <InputField icon={<MapPin size={16} />} placeholder="Qayerda? (Masalan: Yotoqxonada)" value={location} onChange={setLocation} />
          <InputField icon={<Frown size={16} />} placeholder="Qanday his? (Masalan: Siqilish, zerikish)" value={feeling} onChange={setFeeling} />
          <button onClick={save} disabled={!feeling.trim() || saving}
            className="w-full bg-emerald-500 disabled:bg-slate-700 text-slate-950 font-medium py-3 rounded-xl flex items-center justify-center gap-2">
            {saving ? <Loader2 size={18} className="animate-spin text-white" /> : <><Plus size={18} />Saqlash</>}
          </button>
        </div>
      </div>

      <h3 className="font-semibold text-slate-300 mt-6 mb-3">Oxirgi qaydlar</h3>
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
      ) : entries.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-6">Hali trigger qayd etilmagan</p>
      ) : (
        <div className="space-y-2">
          {entries.map(e => (
            <div key={e.id} className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-slate-500">{new Date(e.createdAt).toLocaleString('uz-UZ')}</span>
                <div className="flex items-center gap-2">
                  {e.triggerFeeling && <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full">{e.triggerFeeling}</span>}
                  <button onClick={() => remove(e.id)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
              <p className="text-sm text-slate-300">{e.content}</p>
              {e.triggerTime && <p className="text-xs text-slate-500 mt-1">🕐 {e.triggerTime}</p>}
              {e.triggerLocation && <p className="text-xs text-slate-500">📍 {e.triggerLocation}</p>}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function TackleTab() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadEntries(); }, []);

  const loadEntries = async () => {
    const res = await api.request<JournalEntry[]>('/journal?type=tackle');
    if (res.success && res.data) setEntries(res.data);
    setLoading(false);
  };

  const save = async () => {
    if (!content.trim()) return;
    setSaving(true);
    await api.request('/journal', {
      method: 'POST',
      body: JSON.stringify({ type: 'tackle', content }),
    });
    setContent('');
    await loadEntries();
    setSaving(false);
  };

  const toggle = async (id: number, isResolved: boolean) => {
    await api.request(`/journal/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isResolved: !isResolved }),
    });
    setEntries(prev => prev.map(e => e.id === id ? { ...e, isResolved: !isResolved } : e));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl">
        <h3 className="font-semibold text-blue-400 mb-3">Yechim qo'shish</h3>
        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder="Trigger uchun yechim yozing..."
          className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-blue-500/50 min-h-[80px] resize-none" />
        <button onClick={save} disabled={!content.trim() || saving}
          className="w-full mt-2 bg-blue-500 disabled:bg-slate-700 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={18} />Saqlash</>}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
      ) : entries.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-6">Hali yechim qayd etilmagan</p>
      ) : (
        <div className="space-y-3">
          {entries.map(e => (
            <div key={e.id} className={`p-4 bg-slate-900 rounded-2xl border ${e.isResolved ? 'border-emerald-500/30' : 'border-slate-800 border-l-4 border-l-rose-500'}`}>
              <div className="flex justify-between items-start">
                <p className={`text-sm flex-1 ${e.isResolved ? 'line-through text-slate-500' : 'text-slate-200'}`}>{e.content}</p>
                <button onClick={() => toggle(e.id, e.isResolved)}
                  className={`ml-3 text-xs px-2 py-1 rounded-lg ${e.isResolved ? 'bg-slate-700 text-slate-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {e.isResolved ? 'Bekor' : '✓ Hal'}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">{new Date(e.createdAt).toLocaleDateString('uz-UZ')}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function AccountTab({ stats, navigate }: { stats: UserStats | null; navigate: any }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => { loadPosts(); }, []);

  const loadPosts = async () => {
    const res = await api.request<any[]>('/community');
    if (res.success && res.data) setPosts(res.data);
    setLoading(false);
  };

  const post = async () => {
    if (!content.trim()) return;
    setPosting(true);
    await api.request('/community', {
      method: 'POST',
      body: JSON.stringify({ content, isAnonymous: true }),
    });
    setContent('');
    await loadPosts();
    setPosting(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {stats?.buddyId && (
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-900/40 to-slate-900 rounded-2xl border border-blue-500/20">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-blue-400">
            <Users size={24} />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-white">Sizning sherigingiz</h4>
            <p className="text-xs text-slate-400">Anonim hamroh</p>
          </div>
          <button onClick={() => navigate(`/chat/${stats.buddyId}`)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm rounded-xl border border-emerald-500/20">
            <MessageCircle size={16} /> Chat
          </button>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder="Hamjamiyat bilan ulashing (anonim)..."
          className="w-full bg-transparent text-sm text-slate-200 outline-none min-h-[70px] resize-none placeholder-slate-600" />
        <button onClick={post} disabled={!content.trim() || posting}
          className="w-full mt-2 bg-blue-500 disabled:bg-slate-700 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm">
          {posting ? <Loader2 size={16} className="animate-spin" /> : 'Ulashish'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {posts.map(p => (
            <div key={p.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-slate-800 shrink-0 flex items-center justify-center text-xs text-slate-400">
                  {p.isOwnPost ? 'S' : 'A'}
                </div>
                <span className="text-xs font-medium text-slate-300">{p.isOwnPost ? 'Siz' : (p.authorName || 'Anonim')}</span>
                {p.authorLevel && <span className="text-[10px] bg-slate-800 px-1.5 rounded text-slate-400">Lvl {p.authorLevel}</span>}
              </div>
              <p className="text-xs text-slate-400 ml-9">{p.content}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function RewardTab({ stats }: { stats: UserStats | null }) {
  const xp = stats?.xp || 0;
  const level = stats?.level || 1;
  const xpToNext = level * 500;
  const xpPercent = Math.min((xp % 500) / 500 * 100, 100);

  const levelNames: Record<number, string> = {
    1: 'Yangi boshlovchi', 2: 'Kurashchi', 3: 'Jangchi',
    4: 'Qahramon', 5: 'Master', 6: 'Ustoz',
  };
  const levelName = levelNames[Math.min(level, 6)] || 'Afsonaviy';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col items-center justify-center py-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-1 mb-4">
          <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
            <Trophy size={40} className="text-amber-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white">{levelName}</h2>
        <p className="text-slate-400 text-sm">{level}-daraja</p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-medium">
          <span className="text-slate-400">Keyingi darajaga</span>
          <span className="text-amber-400">{xp % 500} / 500 XP</span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${xpPercent}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
          <span className="block text-2xl mb-1">🔥</span>
          <p className="text-[10px] text-slate-400 uppercase">Streak bonusi</p>
          <p className="font-semibold text-emerald-400">+10 XP/kun</p>
        </div>
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
          <span className="block text-2xl mb-1">📝</span>
          <p className="text-[10px] text-slate-400 uppercase">Trigger qayd</p>
          <p className="font-semibold text-emerald-400">+10 XP</p>
        </div>
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
          <span className="block text-2xl mb-1">💬</span>
          <p className="text-[10px] text-slate-400 uppercase">Hamjamiyat</p>
          <p className="font-semibold text-emerald-400">+20 XP</p>
        </div>
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
          <span className="block text-2xl mb-1">⭐</span>
          <p className="text-[10px] text-slate-400 uppercase">Jami XP</p>
          <p className="font-semibold text-amber-400">{xp} XP</p>
        </div>
      </div>
    </motion.div>
  );
}

function InputField({ icon, placeholder, value, onChange }: any) {
  return (
    <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-xl p-3">
      <span className="text-slate-500">{icon}</span>
      <input type="text" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
        className="bg-transparent border-none outline-none text-sm text-slate-200 w-full placeholder:text-slate-600" />
    </div>
  );
}
