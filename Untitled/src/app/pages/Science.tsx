import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Brain, Activity, Zap } from "lucide-react";
import { motion } from "motion/react";

const data = [
  { day: 0, dopamine: 200, prefrontal: 30 },
  { day: 7, dopamine: 150, prefrontal: 40 },
  { day: 14, dopamine: 120, prefrontal: 50 },
  { day: 30, dopamine: 105, prefrontal: 65 },
  { day: 60, dopamine: 100, prefrontal: 85 },
  { day: 90, dopamine: 100, prefrontal: 100 },
];

export function Science() {
  return (
    <div className="p-6 flex flex-col gap-6 h-full overflow-y-auto">
      <header className="mt-4">
        <h1 className="text-2xl font-bold text-white mb-2">Miya Holati</h1>
        <p className="text-slate-400 text-sm">Neyro-ilmiy tahlil va o'zgarishlar.</p>
      </header>

      {/* Main Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg"
      >
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Activity size={16} className="text-emerald-400" />
          Tiklanish dinamikasi
        </h3>
        
        <div className="h-64 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDopamine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPrefrontal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#475569" tick={{fill: '#64748b'}} tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" tick={{fill: '#64748b'}} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                itemStyle={{ fontSize: '12px' }}
              />
              <ReferenceLine y={100} stroke="#475569" strokeDasharray="3 3" label={{ position: 'top', value: 'Norma', fill: '#64748b', fontSize: 10 }} />
              <Area type="monotone" name="Dopamin sezuvchanligi" dataKey="dopamine" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorDopamine)" />
              <Area type="monotone" name="Prefrontal korteks kuchi" dataKey="prefrontal" stroke="#2dd4bf" strokeWidth={2} fillOpacity={1} fill="url(#colorPrefrontal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex gap-4 mt-4 text-[10px] text-slate-400 justify-center">
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Dopamin</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-400"></span> Iroda (Prefrontal)</div>
        </div>
      </motion.div>

      {/* Explanations */}
      <div className="grid gap-4">
        <InfoCard 
          icon={<Zap className="text-rose-400" />}
          title="Amigdala (Reaksiya)"
          desc="Hozirda istaklar kelganda amigdala faoliyati biroz yuqori. Bu normal holat. Vaqt o'tishi bilan u tinchlanadi."
        />
        <InfoCard 
          icon={<Brain className="text-teal-400" />}
          title="Prefrontal Korteks"
          desc="Sizning 'Yo'q' deya olish qobiliyatingiz (iroda) har bir yengib o'tilgan istak bilan kuchayib bormoqda."
        />
      </div>
    </div>
  );
}

function InfoCard({ icon, title, desc }: any) {
  return (
    <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex gap-4 items-start">
      <div className="p-2 bg-slate-800 rounded-xl shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-200 mb-1">{title}</h4>
        <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
