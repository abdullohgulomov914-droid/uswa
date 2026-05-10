import { useState } from "react";
import { motion } from "motion/react";
import { Eye, Shield, Users, Trophy, Plus, MapPin, Clock, Frown } from "lucide-react";

export function Journal() {
  const [activeTab, setActiveTab] = useState<"see" | "tackle" | "account" | "reward">("see");

  return (
    <div className="p-6 flex flex-col gap-6 h-full">
      <header className="mt-4">
        <h1 className="text-2xl font-bold text-white mb-2">STAR+ Tizimi</h1>
        <p className="text-slate-400 text-sm">O'z odatlaringizni ilmiy tahlil qiling.</p>
      </header>

      {/* Tabs */}
      <div className="flex bg-slate-900 rounded-2xl p-1 gap-1">
        <Tab id="see" active={activeTab} set={setActiveTab} icon={<Eye size={16} />} label="See" />
        <Tab id="tackle" active={activeTab} set={setActiveTab} icon={<Shield size={16} />} label="Tackle" />
        <Tab id="account" active={activeTab} set={setActiveTab} icon={<Users size={16} />} label="Account" />
        <Tab id="reward" active={activeTab} set={setActiveTab} icon={<Trophy size={16} />} label="Reward" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-4">
        {activeTab === "see" && <SeeTab />}
        {activeTab === "tackle" && <TackleTab />}
        {activeTab === "account" && <AccountTab />}
        {activeTab === "reward" && <RewardTab />}
      </div>
    </div>
  );
}

function Tab({ id, active, set, icon, label }: any) {
  const isActive = active === id;
  return (
    <button 
      onClick={() => set(id)}
      className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${isActive ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
    >
      {icon}
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
    </button>
  );
}

function SeeTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
        <h3 className="font-semibold text-emerald-400 mb-1">Yangi Trigger qo'shish</h3>
        <p className="text-xs text-slate-400 mb-4">Miyadagi naqshlarni aniqlang</p>
        
        <div className="space-y-3">
          <Input icon={<Clock size={16} />} placeholder="Qachon? (Masalan: Kechqurun 22:00)" />
          <Input icon={<MapPin size={16} />} placeholder="Qayerda? (Masalan: Yotoqxonada)" />
          <Input icon={<Frown size={16} />} placeholder="Qanday his? (Masalan: Siqilish, zerikish)" />
          <button className="w-full bg-emerald-500 text-slate-950 font-medium py-3 rounded-xl flex items-center justify-center gap-2">
            <Plus size={18} />
            Saqlash
          </button>
        </div>
      </div>

      <h3 className="font-semibold text-slate-300 mt-6 mb-3">Oxirgi qaydlar</h3>
      <div className="space-y-2">
        {[1, 2].map(i => (
          <div key={i} className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-slate-500">Bugun, 14:30</span>
              <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full">Zerikish</span>
            </div>
            <p className="text-sm text-slate-300">Ishda tushlikdan so'ng, telefonda ko'p o'tirdim.</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function TackleTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <p className="text-sm text-slate-400 mb-4">Aniqlangan triggerlar uchun yechimlar</p>
      
      <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 border-l-4 border-l-rose-500">
        <h4 className="font-medium text-slate-200 mb-1">Zerikish (Ishda)</h4>
        <p className="text-xs text-slate-500 mb-3">Siz bu triggermi 3 marta qayd etgansiz.</p>
        <div className="space-y-2">
          <button className="w-full p-2 bg-slate-800 rounded-lg text-sm text-left flex items-center gap-2 border border-transparent hover:border-emerald-500/50 transition-colors">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">1</span>
            5 daqiqalik sayr qilish
          </button>
          <button className="w-full p-2 bg-slate-800 rounded-lg text-sm text-left flex items-center gap-2 border border-transparent hover:border-emerald-500/50 transition-colors">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">2</span>
            Hamkasb bilan suhbat
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function AccountTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-900/40 to-slate-900 rounded-2xl border border-blue-500/20">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-blue-400">
          <Users size={24} />
        </div>
        <div>
          <h4 className="font-semibold text-white">Sizning sherigingiz</h4>
          <p className="text-xs text-slate-400">Anonim foydalanuvchi #4092</p>
        </div>
        <div className="ml-auto flex flex-col items-end">
          <span className="text-xl font-bold text-emerald-400">12</span>
          <span className="text-[10px] text-slate-500">kun</span>
        </div>
      </div>
      
      <h3 className="font-semibold text-slate-300 mt-6 mb-3">Hamjamiyat</h3>
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-3 bg-slate-900 rounded-xl flex gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-slate-300">Jangchi #{1000 + i}</span>
                <span className="text-[10px] bg-slate-800 px-1.5 rounded text-slate-400">Lvl {i+1}</span>
              </div>
              <p className="text-xs text-slate-400">Bugun juda qiyin bo'ldi, lekin men yengdim! Urge surfing haqiqatan ishlaydi.</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function RewardTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col items-center justify-center py-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-1 mb-4">
          <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
            <Trophy size={40} className="text-amber-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white">Jangchi</h2>
        <p className="text-slate-400 text-sm">4-daraja</p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-medium">
          <span className="text-slate-400">Keyingi darajaga: Master</span>
          <span className="text-amber-400">1,250 / 2,000 XP</span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-amber-400 rounded-full" style={{ width: '62%' }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
          <span className="block text-2xl mb-1">🔥</span>
          <p className="text-[10px] text-slate-400 uppercase">3 kunlik streak</p>
          <p className="font-semibold text-emerald-400">+50 XP</p>
        </div>
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
          <span className="block text-2xl mb-1">📝</span>
          <p className="text-[10px] text-slate-400 uppercase">Trigger qayd etish</p>
          <p className="font-semibold text-emerald-400">+10 XP</p>
        </div>
      </div>
    </motion.div>
  );
}

function Input({ icon, placeholder }: any) {
  return (
    <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-xl p-3">
      <span className="text-slate-500">{icon}</span>
      <input 
        type="text" 
        placeholder={placeholder} 
        className="bg-transparent border-none outline-none text-sm text-slate-200 w-full placeholder:text-slate-600"
      />
    </div>
  );
}
