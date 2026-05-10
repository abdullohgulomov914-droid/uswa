import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Shield, Bell, ChevronRight, Settings, User, Lock, Delete, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api';

function PinDots({ value }: { value: string }) {
  return (
    <div className="flex justify-center gap-4 my-4">
      {[0,1,2,3].map(i => (
        <div key={i} className={`w-4 h-4 rounded-full transition-all ${i < value.length ? 'bg-emerald-400 scale-110' : 'bg-slate-700'}`} />
      ))}
    </div>
  );
}

function Numpad({ onPress, onDelete }: { onPress: (n: string) => void; onDelete: () => void }) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','del'];
  return (
    <div className="grid grid-cols-3 gap-3">
      {keys.map((k, i) => {
        if (k === '') return <div key={i} />;
        if (k === 'del') return (
          <button key={i} onClick={onDelete} className="h-14 flex items-center justify-center rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all">
            <Delete className="w-5 h-5 text-slate-300" />
          </button>
        );
        return (
          <button key={i} onClick={() => onPress(k)} className="h-14 text-xl font-semibold text-white rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all">
            {k}
          </button>
        );
      })}
    </div>
  );
}

type PinStep = 'old' | 'new' | 'confirm';

export function SettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPinChange, setShowPinChange] = useState(false);
  const [pinStep, setPinStep] = useState<PinStep>('old');
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    api.request<any>('/user/me').then(res => {
      if (res.success && res.data) { setUser(res.data); setIsAdmin(Boolean(res.data.isAdmin)); }
    });
  }, []);

  const appendPin = (val: string, current: string, setter: (v: string) => void, onFull: (v: string) => void) => {
    if (current.length >= 4) return;
    const next = current + val;
    setter(next);
    if (next.length === 4) setTimeout(() => onFull(next), 150);
  };

  const handleOldPin = (v: string) => {
    const saved = localStorage.getItem('pin');
    if (v === saved) { setPinError(''); setPinStep('new'); setOldPin(''); }
    else { setPinError("Noto'g'ri PIN kod"); setOldPin(''); }
  };

  const handleNewPin = (v: string) => { setPinStep('confirm'); setNewPin(v); };

  const handleConfirmPin = (v: string) => {
    if (v === newPin) {
      localStorage.setItem('pin', newPin);
      setShowPinChange(false);
      setPinStep('old'); setOldPin(''); setNewPin(''); setConfirmPin(''); setPinError('');
    } else {
      setPinError("PIN kodlar mos kelmadi");
      setConfirmPin('');
      setPinStep('new');
      setNewPin('');
    }
  };

  const openPinChange = () => { setShowPinChange(true); setPinStep('old'); setOldPin(''); setNewPin(''); setConfirmPin(''); setPinError(''); };

  const pinTitle = pinStep === 'old' ? 'Eski PIN kodni kiriting' : pinStep === 'new' ? 'Yangi PIN kod' : 'Qayta kiriting';
  const pinValue = pinStep === 'old' ? oldPin : pinStep === 'new' ? newPin : confirmPin;
  const pinSetter = pinStep === 'old' ? setOldPin : pinStep === 'new' ? setNewPin : setConfirmPin;
  const pinHandler = pinStep === 'old' ? handleOldPin : pinStep === 'new' ? handleNewPin : handleConfirmPin;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-8">
      <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-slate-800">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white"><ArrowLeft size={22} /></button>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings size={20} className="text-slate-400" /> Sozlamalar
        </h1>
      </div>

      <div className="px-4 py-4 space-y-3">
        {user && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <User size={22} className="text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-white">{user.displayName}</p>
              <p className="text-xs text-slate-400">{isAdmin ? '👑 Admin · ' : ''}{user.level}-daraja · {user.streakDays} kun zanjir</p>
            </div>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <MenuItem icon={<Bell size={18} className="text-blue-400" />} label="Bildirishnomalar" onClick={() => navigate('/notifications')} />
          <MenuItem icon={<Lock size={18} className="text-amber-400" />} label="PIN kodni o'zgartirish" onClick={openPinChange} />
        </div>

        {isAdmin && (
          <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl overflow-hidden">
            <MenuItem icon={<Shield size={18} className="text-emerald-400" />} label="Admin panel" sublabel="Faqat adminlar uchun" onClick={() => navigate('/admin')} highlight />
          </div>
        )}

        <p className="text-center text-xs text-slate-600 pt-2">Uswaa v1.0</p>
      </div>

      {/* PIN change modal */}
      <AnimatePresence>
        {showPinChange && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center p-4">
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">{pinTitle}</h2>
                <button onClick={() => setShowPinChange(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
              </div>
              {pinError && <p className="text-sm text-red-400 text-center">{pinError}</p>}
              <PinDots value={pinValue} />
              <Numpad
                onPress={n => appendPin(n, pinValue, pinSetter, pinHandler)}
                onDelete={() => pinSetter(pinValue.slice(0, -1))}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({ icon, label, sublabel, onClick, highlight }: {
  icon: React.ReactNode; label: string; sublabel?: string; onClick: () => void; highlight?: boolean;
}) {
  return (
    <motion.button whileTap={{ scale: 0.98 }} onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-4 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/50 transition-colors">
      <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">{icon}</div>
      <div className="flex-1 text-left">
        <p className={`text-sm font-medium ${highlight ? 'text-emerald-400' : 'text-white'}`}>{label}</p>
        {sublabel && <p className="text-xs text-slate-500 mt-0.5">{sublabel}</p>}
      </div>
      <ChevronRight size={16} className="text-slate-600" />
    </motion.button>
  );
}
