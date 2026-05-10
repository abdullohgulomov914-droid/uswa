import { useState } from "react";
import { motion } from "motion/react";
import { SquareActivity, Database, ArrowRight, ShieldAlert } from "lucide-react";
import { Link } from "react-router";

export function Relapse() {
  const [step, setStep] = useState(1);

  return (
    <div className="p-6 h-full flex flex-col justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
        
        <header className="mb-6 relative z-10 flex items-center gap-3 text-indigo-400">
          <Database size={24} />
          <h2 className="font-bold text-lg">Ma'lumotlarni tahlil qilish</h2>
        </header>

        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-2">Bu mag'lubiyat emas, bu xato.</h3>
            <p className="text-sm text-slate-400 mb-6">
              Biz faqatgina bitta jangga yutqazdik. Urush davom etmoqda. Keling, tizimimizdagi bo'shliqni topamiz.
            </p>
            
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-500 mb-1">Nima sabab bo'ldi? (Trigger)</label>
              <textarea 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-indigo-500/50 min-h-[80px]"
                placeholder="Masalan: Yolg'izlik, zerikish, stress..."
              />
            </div>

            <button 
              onClick={() => setStep(2)}
              className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl flex items-center justify-center gap-2 mt-6"
            >
              Keyingi <ArrowRight size={16} />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 mb-6">
              <ShieldAlert className="text-rose-400 shrink-0 mt-0.5" size={20} />
              <p className="text-xs text-rose-200/80">
                Bu trigger AI tizimiga kiritildi. Keyingi safar xuddi shu holat yuzaga kelganda, biz tayyor turamiz.
              </p>
            </div>
            
            <h3 className="text-lg font-semibold text-white mb-2">Keyingi qadam</h3>
            <p className="text-sm text-slate-400 mb-6">
              Zanjir uzildi, lekin miyangizdagi o'zgarishlar birdaniga yo'qolmaydi. O'zingizni kechiring va tezda safga qayting.
            </p>

            <Link 
              to="/"
              className="w-full py-3 bg-emerald-500 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2"
            >
              <SquareActivity size={18} />
              Qaytadan boshlash
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
