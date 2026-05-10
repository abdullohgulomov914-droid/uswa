import { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Send, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../../lib/api';

// Telegram Web App types
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
      };
    };
  }
}

type Step = 'login' | 'pin-enter';

export function AuthPage() {
  const [step, setStep] = useState<Step>('login');
  const [loginPin, setLoginPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, verifyPin } = useAuth();

  const handleTelegramLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        
        const response = await api.request('/telegram/auth', {
          method: 'POST',
          body: JSON.stringify({ initData: tg.initData }),
        });
        
        if (response.success && response.data) {
          login(response.data.user, response.data.token);
          setStep('pin-enter');
        } else {
          setError('Telegram orqali kirishda xatolik');
        }
      } else {
        window.open('https://t.me/uswaaabot', '_blank');
        setError('Telegram bot orqali davom eting');
      }
    } catch (err) {
      setError('Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSubmit = () => {
    if (loginPin.length !== 4) {
      setError('PIN 4 xonali bo\'lishi kerak');
      return;
    }
    
    if (verifyPin(loginPin)) {
      setError('');
      window.location.href = '/';
    } else {
      setError('Notog\'ri PIN');
    }
  };

  const handleNumpadClick = (num: string) => {
    if (loginPin.length < 4) {
      setLoginPin(prev => prev + num);
    }
  };

  const handleNumpadDelete = () => {
    setLoginPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl"
        >
          {step === 'login' ? (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">USWA</h1>
                  <p className="text-slate-400 text-sm">
                    Sog'lom hayot sari birinchi qadam
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <button
                onClick={handleTelegramLogin}
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-blue-500/50 disabled:to-blue-600/50 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {isLoading ? 'Yuklanmoqda...' : 'Telegram orqali kirish'}
                {!isLoading && <ChevronRight className="w-5 h-5" />}
              </button>

              <p className="text-center text-slate-500 text-xs">
                Telegram orqali xavfsiz va tez kirish
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto">
                  <Lock className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">PIN kodni kiriting</h2>
                <p className="text-slate-400 text-sm">
                  Hisobingizni himoya qilish uchun PIN kod
                </p>
              </div>

              <div className="flex justify-center gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-12 h-14 bg-slate-900/60 border-2 border-slate-700 rounded-xl flex items-center justify-center"
                  >
                    {loginPin[i] ? (
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    ) : (
                      <div className="w-3 h-3 border-2 border-slate-600 rounded-full" />
                    )}
                  </div>
                ))}
              </div>

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumpadClick(num.toString())}
                    className="py-4 bg-slate-700/50 hover:bg-slate-700 text-white text-xl font-semibold rounded-xl transition-colors"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={handleNumpadDelete}
                  className="py-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xl font-semibold rounded-xl transition-colors"
                >
                  ←
                </button>
                <button
                  onClick={() => handleNumpadClick('0')}
                  className="py-4 bg-slate-700/50 hover:bg-slate-700 text-white text-xl font-semibold rounded-xl transition-colors"
                >
                  0
                </button>
                <button
                  onClick={handlePinSubmit}
                  disabled={loginPin.length !== 4}
                  className="py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white text-xl font-semibold rounded-xl transition-colors"
                >
                  ✓
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
