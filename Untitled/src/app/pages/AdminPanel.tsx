import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Users, FileText, BookOpen, BarChart2, Trash2, Plus, Edit2, Check, X, Loader2, ChevronRight, ArrowLeft, Send, Bell } from "lucide-react";
import { useNavigate } from "react-router";
import { api } from "../../lib/api";

type Tab = 'stats' | 'users' | 'articles' | 'glossary' | 'broadcast' | 'polls';

export function AdminPanel() {
  const [tab, setTab] = useState<Tab>('stats');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.request<any>('/user/me').then(res => {
      if (res.success && res.data?.isAdmin) setIsAdmin(true);
      else setIsAdmin(false);
    });
  }, []);

  if (isAdmin === null) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>;
  if (!isAdmin) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
      <div>
        <p className="text-red-400 text-lg font-bold mb-2">Ruxsat yo'q</p>
        <p className="text-slate-400 text-sm mb-4">Bu sahifa faqat adminlar uchun</p>
        <button onClick={() => navigate('/')} className="text-emerald-400 text-sm">← Orqaga</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-8">
      <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-slate-800">
        <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white"><ArrowLeft size={22} /></button>
        <h1 className="text-xl font-bold text-white">Admin Panel</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 py-3 overflow-x-auto">
        {([
          { id: 'stats', label: 'Statistika', icon: <BarChart2 size={16} /> },
          { id: 'users', label: 'Userlar', icon: <Users size={16} /> },
          { id: 'articles', label: 'Maqolalar', icon: <FileText size={16} /> },
          { id: 'glossary', label: "Lug'at", icon: <BookOpen size={16} /> },
          { id: 'broadcast', label: 'Xabar', icon: <Send size={16} /> },
          { id: 'polls', label: "So'rovnoma", icon: <BarChart2 size={16} /> },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${tab === t.id ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <div className="px-4">
        {tab === 'stats' && <StatsTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'articles' && <ArticlesTab />}
        {tab === 'glossary' && <GlossaryTab />}
        {tab === 'broadcast' && <BroadcastTab />}
        {tab === 'polls' && <PollsAdminTab />}
      </div>
    </div>
  );
}

function StatsTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.request<any>('/admin/stats').then(res => {
      if (res.success) setData(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <Spinner />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 mt-2">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Jami userlar" value={data?.users?.total || 0} color="emerald" />
        <StatCard label="Bugun yangi" value={data?.users?.newToday || 0} color="blue" />
        <StatCard label="Telegram" value={data?.users?.telegram || 0} color="indigo" />
        <StatCard label="Bloklangan" value={data?.users?.banned || 0} color="rose" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">7 kunlik faollik</h3>
        <Row label="Jurnal yozuvlar" value={data?.activity?.journalEntriesLast7Days || 0} />
        <Row label="Faol userlar" value={data?.activity?.activeUsersLast7Days || 0} />
        <Row label="Yiqilishlar" value={data?.activity?.relapsesLast7Days || 0} />
      </div>

      {data?.topStreaks?.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Top zanjirlar</h3>
          {data.topStreaks.map((u: any, i: number) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0">
              <span className="text-sm text-slate-300">{u.displayName || `@${u.telegramUsername}`}</span>
              <span className="text-emerald-400 font-bold text-sm">{u.streakDays} kun</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async (q = '') => {
    const res = await api.request<any>(`/admin/users?search=${q}&limit=50`);
    if (res.success && res.data) setUsers(res.data.users);
    setLoading(false);
  };

  const ban = async (id: number, banned: boolean) => {
    await api.request(`/admin/users/${id}/ban`, { method: 'POST', body: JSON.stringify({ banned }) });
    setUsers(prev => prev.map(u => u.id === id ? { ...u, isBanned: banned } : u));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 mt-2">
      <input value={search} onChange={e => { setSearch(e.target.value); loadUsers(e.target.value); }}
        placeholder="Qidirish..." className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-emerald-500 placeholder-slate-600" />
      {loading ? <Spinner /> : users.map(u => (
        <div key={u.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-sm text-white">{u.displayName}</p>
              <p className="text-xs text-slate-500">@{u.telegramUsername || 'n/a'} · ID: {u.id}</p>
              <div className="flex gap-2 mt-1">
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">🔥 {u.streakDays} kun</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">Lvl {u.level}</span>
                {u.isAdmin && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Admin</span>}
                {u.isBanned && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Bloklangan</span>}
              </div>
            </div>
            <button onClick={() => ban(u.id, !u.isBanned)}
              className={`text-xs px-3 py-1.5 rounded-lg ${u.isBanned ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {u.isBanned ? 'Ochish' : 'Bloklash'}
            </button>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

function ArticlesTab() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', summary: '', content: '', problem_type: '', source: '' });
  const [editing, setEditing] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const res = await api.request<any[]>('/admin/articles');
    if (res.success && res.data) setArticles(res.data);
    setLoading(false);
  };

  const save = async () => {
    if (!form.title || !form.summary || !form.content) return;
    setSaving(true);
    if (editing) {
      await api.request(`/admin/articles/${editing}`, { method: 'PATCH', body: JSON.stringify(form) });
    } else {
      await api.request('/admin/articles', { method: 'POST', body: JSON.stringify(form) });
    }
    setForm({ title: '', summary: '', content: '', problem_type: '', source: '' });
    setEditing(null);
    setShowForm(false);
    await load();
    setSaving(false);
  };

  const del = async (id: number) => {
    await api.request(`/admin/articles/${id}`, { method: 'DELETE' });
    setArticles(prev => prev.filter(a => a.id !== id));
  };

  const edit = (a: any) => {
    setForm({ title: a.title, summary: a.summary, content: a.content, problem_type: a.problem_type || '', source: a.source || '' });
    setEditing(a.id);
    setShowForm(true);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 mt-2">
      <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ title: '', summary: '', content: '', problem_type: '', source: '' }); }}
        className="w-full py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center justify-center gap-2 text-sm font-medium">
        <Plus size={16} />{showForm ? 'Bekor' : 'Yangi maqola'}
      </button>

      {showForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">{editing ? 'Tahrirlash' : 'Yangi maqola'}</h3>
          <Field label="Sarlavha *" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} />
          <Field label="Qisqa tavsif *" value={form.summary} onChange={v => setForm(f => ({ ...f, summary: v }))} />
          <Field label="Muammo turi" value={form.problem_type} onChange={v => setForm(f => ({ ...f, problem_type: v }))} placeholder="pornography, drugs, alcohol..." />
          <Field label="Manba" value={form.source} onChange={v => setForm(f => ({ ...f, source: v }))} placeholder="PubMed, WHO..." />
          <div className="space-y-1">
            <label className="text-xs text-slate-500">To'liq matn *</label>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-emerald-500 min-h-[120px] resize-none" />
          </div>
          <button onClick={save} disabled={!form.title || !form.summary || !form.content || saving}
            className="w-full py-3 bg-emerald-500 disabled:bg-slate-700 text-white font-medium rounded-xl flex items-center justify-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} />Saqlash</>}
          </button>
        </div>
      )}

      {loading ? <Spinner /> : articles.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-6">Hali maqola yo'q</p>
      ) : articles.map(a => (
        <div key={a.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1">
              {a.problem_type && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">{a.problem_type}</span>}
              <p className="font-medium text-sm text-white mt-1">{a.title}</p>
              <p className="text-xs text-slate-400 mt-1">{a.summary}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => edit(a)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white"><Edit2 size={14} /></button>
              <button onClick={() => del(a.id)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-red-400"><Trash2 size={14} /></button>
            </div>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

function GlossaryTab() {
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ term: '', definition: '', category: '' });
  const [editing, setEditing] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const res = await api.request<any[]>('/admin/glossary');
    if (res.success && res.data) setTerms(res.data);
    setLoading(false);
  };

  const save = async () => {
    if (!form.term || !form.definition) return;
    setSaving(true);
    if (editing) {
      await api.request(`/admin/glossary/${editing}`, { method: 'PATCH', body: JSON.stringify(form) });
    } else {
      await api.request('/admin/glossary', { method: 'POST', body: JSON.stringify(form) });
    }
    setForm({ term: '', definition: '', category: '' });
    setEditing(null);
    setShowForm(false);
    await load();
    setSaving(false);
  };

  const del = async (id: number) => {
    await api.request(`/admin/glossary/${id}`, { method: 'DELETE' });
    setTerms(prev => prev.filter(t => t.id !== id));
  };

  const edit = (t: any) => {
    setForm({ term: t.term, definition: t.definition, category: t.category || '' });
    setEditing(t.id);
    setShowForm(true);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 mt-2">
      <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ term: '', definition: '', category: '' }); }}
        className="w-full py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center justify-center gap-2 text-sm font-medium">
        <Plus size={16} />{showForm ? 'Bekor' : "Yangi atama"}
      </button>

      {showForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">{editing ? 'Tahrirlash' : 'Yangi atama'}</h3>
          <Field label="Atama *" value={form.term} onChange={v => setForm(f => ({ ...f, term: v }))} />
          <Field label="Kategoriya" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} placeholder="Neyrologiya, Psixologiya..." />
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Ta'rif *</label>
            <textarea value={form.definition} onChange={e => setForm(f => ({ ...f, definition: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-emerald-500 min-h-[80px] resize-none" />
          </div>
          <button onClick={save} disabled={!form.term || !form.definition || saving}
            className="w-full py-3 bg-emerald-500 disabled:bg-slate-700 text-white font-medium rounded-xl flex items-center justify-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} />Saqlash</>}
          </button>
        </div>
      )}

      {loading ? <Spinner /> : terms.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-6">Hali atama yo'q</p>
      ) : terms.map(t => (
        <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-emerald-400 text-sm">{t.term}</p>
                {t.category && <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{t.category}</span>}
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t.definition}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => edit(t)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white"><Edit2 size={14} /></button>
              <button onClick={() => del(t.id)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-red-400"><Trash2 size={14} /></button>
            </div>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

function BroadcastTab() {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifSending, setNotifSending] = useState(false);

  const broadcast = async () => {
    if (!message.trim()) return;
    setSending(true);
    const res = await api.request<any>('/admin/broadcast', { method: 'POST', body: JSON.stringify({ message }) });
    setResult(res.success ? (res.data?.message || 'Yuborildi') : 'Xatolik');
    setMessage('');
    setSending(false);
  };

  const sendNotif = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) return;
    setNotifSending(true);
    await api.request('/admin/notify', { method: 'POST', body: JSON.stringify({ title: notifTitle, body: notifBody, type: 'admin' }) });
    setNotifTitle(''); setNotifBody('');
    setNotifSending(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 mt-2">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2"><Send size={14} className="text-blue-400" />Telegram Broadcast</h3>
        <p className="text-xs text-slate-500">Barcha foydalanuvchilarga Telegram orqali xabar yuborish</p>
        <textarea value={message} onChange={e => setMessage(e.target.value)}
          placeholder="Xabar matni..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-blue-500 min-h-[100px] resize-none" />
        {result && <p className="text-xs text-emerald-400">{result}</p>}
        <button onClick={broadcast} disabled={!message.trim() || sending}
          className="w-full py-3 bg-blue-500 disabled:bg-slate-700 text-white font-medium rounded-xl flex items-center justify-center gap-2">
          {sending ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} />Yuborish</>}
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2"><Bell size={14} className="text-emerald-400" />Bildirishnoma yuborish</h3>
        <p className="text-xs text-slate-500">Ilovadagi bildirishnomalar bo'limiga yuborish</p>
        <Field label="Sarlavha" value={notifTitle} onChange={setNotifTitle} />
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Matn</label>
          <textarea value={notifBody} onChange={e => setNotifBody(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-emerald-500 min-h-[80px] resize-none" />
        </div>
        <button onClick={sendNotif} disabled={!notifTitle.trim() || !notifBody.trim() || notifSending}
          className="w-full py-3 bg-emerald-500 disabled:bg-slate-700 text-white font-medium rounded-xl flex items-center justify-center gap-2">
          {notifSending ? <Loader2 size={16} className="animate-spin" /> : <><Bell size={16} />Yuborish</>}
        </button>
      </div>
    </motion.div>
  );
}

function PollsAdminTab() {
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [problemType, setProblemType] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const res = await api.request<any[]>('/admin/polls');
    if (res.success && res.data) setPolls(res.data);
    setLoading(false);
  };

  const save = async () => {
    const validOptions = options.filter(o => o.trim());
    if (!question.trim() || validOptions.length < 2) return;
    setSaving(true);
    await api.request('/admin/polls', { method: 'POST', body: JSON.stringify({ question, options: validOptions, problem_type: problemType || undefined }) });
    setQuestion(''); setOptions(['', '']); setProblemType(''); setShowForm(false);
    await load();
    setSaving(false);
  };

  const toggle = async (id: number, isActive: boolean) => {
    await api.request(`/admin/polls/${id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !isActive }) });
    setPolls(prev => prev.map(p => p.id === id ? { ...p, is_active: !isActive ? 1 : 0 } : p));
  };

  const del = async (id: number) => {
    await api.request(`/admin/polls/${id}`, { method: 'DELETE' });
    setPolls(prev => prev.filter(p => p.id !== id));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 mt-2">
      <button onClick={() => setShowForm(!showForm)}
        className="w-full py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center justify-center gap-2 text-sm font-medium">
        <Plus size={16} />{showForm ? 'Bekor' : "Yangi so'rovnoma"}
      </button>

      {showForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <Field label="Savol *" value={question} onChange={setQuestion} />
          <Field label="Muammo turi (ixtiyoriy)" value={problemType} onChange={setProblemType} placeholder="pornography, drugs, all..." />
          <div className="space-y-2">
            <label className="text-xs text-slate-500">Variantlar (kamida 2 ta)</label>
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input value={opt} onChange={e => setOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                  placeholder={`${i + 1}-variant`}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-emerald-500" />
                {options.length > 2 && (
                  <button onClick={() => setOptions(prev => prev.filter((_, j) => j !== i))} className="text-slate-500 hover:text-red-400"><X size={16} /></button>
                )}
              </div>
            ))}
            {options.length < 6 && (
              <button onClick={() => setOptions(prev => [...prev, ''])} className="text-xs text-emerald-400 flex items-center gap-1">
                <Plus size={12} /> Variant qo'shish
              </button>
            )}
          </div>
          <button onClick={save} disabled={!question.trim() || options.filter(o => o.trim()).length < 2 || saving}
            className="w-full py-3 bg-emerald-500 disabled:bg-slate-700 text-white font-medium rounded-xl flex items-center justify-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} />Saqlash</>}
          </button>
        </div>
      )}

      {loading ? <Spinner /> : polls.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-6">Hali so'rovnoma yo'q</p>
      ) : polls.map(p => (
        <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                  {p.is_active ? 'Faol' : 'Nofaol'}
                </span>
                {p.problem_type && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">{p.problem_type}</span>}
              </div>
              <p className="text-sm text-white">{p.question}</p>
              <p className="text-xs text-slate-500 mt-1">{Array.isArray(p.options) ? p.options.join(' · ') : ''}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => toggle(p.id, Boolean(p.is_active))}
                className={`text-xs px-2 py-1 rounded-lg ${p.is_active ? 'bg-slate-700 text-slate-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {p.is_active ? 'O\'chir' : 'Yoq'}
              </button>
              <button onClick={() => del(p.id)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-red-400"><Trash2 size={14} /></button>
            </div>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-slate-500">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-emerald-500 placeholder-slate-600" />
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
    blue: 'text-blue-400 border-blue-500/20 bg-blue-500/10',
    indigo: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/10',
    rose: 'text-rose-400 border-rose-500/20 bg-rose-500/10',
  };
  return (
    <div className={`p-4 rounded-2xl border text-center ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-70 mt-1">{label}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-slate-800 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function Spinner() {
  return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>;
}
