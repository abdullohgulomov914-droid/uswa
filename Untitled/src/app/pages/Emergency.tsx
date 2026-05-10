import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Wind, Heart, PhoneCall, Droplets, ArrowLeft, CircleCheck } from "lucide-react";
import { Link } from "react-router";

export function Emergency() {
  const [phase, setPhase] = useState<"intro" | "surfing" | "success">("intro");
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes
  const [breathState, setBreathState] = useState<"Inhale" | "Hold" | "Exhale">("Inhale");

  useEffect(() => {
    if (phase === "surfing" && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setPhase("success");
    }
  }, [phase, timeLeft]);

  // Breathing animation logic (4-7-8)
  useEffect(() => {
    if (phase !== "surfing") return;
    
    let isCancelled = false;
    
    const breathCycle = async () => {
      while (!isCancelled) {
        setBreathState("Inhale");
        await new Promise(r => setTimeout(r, 4000));
        if(isCancelled) break;
        
        setBreathState("Hold");
        await new Promise(r => setTimeout(r, 7000));
        if(isCancelled) break;
        
        setBreathState("Exhale");
        await new Promise(r => setTimeout(r, 8000));
      }
    };
    
    breathCycle();
    return () => { isCancelled = true; };
  }, [phase]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-full bg-slate-950 flex flex-col relative overflow-hidden">
      {/* Background animated gradients depending on phase */}
      <AnimatePresence>
        {phase === "intro" && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-b from-rose-900/20 to-slate-950"
          />
        )}
        {phase === "surfing" && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {/* Wave animation */}
            <motion.div 
              animate={{ 
                scale: breathState === "Inhale" ? 1.5 : breathState === "Exhale" ? 0.8 : 1.5,
                opacity: breathState === "Hold" ? 0.8 : 0.4
              }}
              transition={{ duration: breathState === "Inhale" ? 4 : breathState === "Exhale" ? 8 : 7, ease: "easeInOut" }}
              className="w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl absolute"
            />
            <motion.div 
              animate={{ 
                scale: breathState === "Inhale" ? 1.2 : breathState === "Exhale" ? 0.6 : 1.2,
              }}
              transition={{ duration: breathState === "Inhale" ? 4 : breathState === "Exhale" ? 8 : 7, ease: "easeInOut" }}
              className="w-48 h-48 bg-emerald-400/20 rounded-full blur-2xl absolute"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="p-6 relative z-10 flex items-center gap-4">
        <Link to="/" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <span className="font-medium text-slate-300">Urge Surfing</span>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-6 relative z-10 pt-0">
        <AnimatePresence mode="wait">
          {phase === "intro" && (
            <motion.div 
              key="intro"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col justify-center"
            >
              <div className="w-20 h-20 bg-rose-500/20 rounded-3xl flex items-center justify-center mb-6 border border-rose-500/30 text-rose-500">
                <Wind size={40} />
              </div>
              <h1 className="text-3xl font-bold mb-3">Istak keldimi?</h1>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                Bu shunchaki miyadagi kimyoviy to'lqin. U 15 daqiqadan so'ng o'tib ketadi. Keling, bu to'lqin ustida uchamiz.
              </p>
              <button 
                onClick={() => setPhase("surfing")}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-lg rounded-2xl shadow-[0_0_40px_rgba(46,204,113,0.3)] transition-all active:scale-95"
              >
                Boshlash
              </button>
            </motion.div>
          )}

          {phase === "surfing" && (
            <motion.div 
              key="surfing"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="text-6xl font-black font-mono text-white mb-8 tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                  {formatTime(timeLeft)}
                </div>
                
                <div className="text-2xl font-medium text-emerald-400 mb-2 h-8">
                  {breathState === "Inhale" && "Nafas oling (4s)"}
                  {breathState === "Hold" && "Ushlab turing (7s)"}
                  {breathState === "Exhale" && "Nafas chiqaring (8s)"}
                </div>
                <p className="text-slate-500 text-sm">4-7-8 texnikasi</p>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-5">
                <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Tezkor amallar</h3>
                <div className="grid gap-3">
                  <ActionBtn icon={<Droplets />} text="Bir stakan suv ichish" />
                  <ActionBtn icon={<Heart />} text="10 marta otjimaniya" />
                  <ActionBtn icon={<PhoneCall />} text="Do'stga qo'ng'iroq qilish" />
                </div>
                <button 
                  onClick={() => setPhase("success")}
                  className="w-full mt-4 py-3 bg-slate-800 text-slate-300 font-medium rounded-xl text-sm"
                >
                  Men yengib o'tdim
                </button>
              </div>
            </motion.div>
          )}

          {phase === "success" && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center"
            >
              <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                <CircleCheck size={48} className="text-emerald-400" />
              </div>
              <h1 className="text-3xl font-bold mb-3 text-white">Qoyilmaqom!</h1>
              <p className="text-slate-400 mb-8 max-w-[250px]">
                Siz istakni yengdingiz. Prefrontal korteksingiz endi yanada kuchliroq.
              </p>
              <Link to="/" className="px-8 py-3 bg-emerald-500 text-slate-950 font-bold rounded-xl active:scale-95 transition-transform">
                Davom etish
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ActionBtn({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <button className="flex items-center gap-3 w-full p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors text-left text-slate-200">
      <span className="text-emerald-400">{icon}</span>
      <span className="font-medium text-sm">{text}</span>
    </button>
  );
}
