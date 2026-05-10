import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Eye, EyeOff, Lock, User, Calendar, AlertTriangle, Send, ChevronRight, CheckCircle } from 'lucide-react';
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

type Step = 'welcome' | 'telegram' | 'onboarding' | 'pin-setup' | 'pin-confirm' | 'pin-login';

export function AuthPage() {
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [problem, setProblem] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, setPin: savePin, hasPin, verifyPin } = useAuth();

  // Check if user already has PIN set
  useState(() => {
    if (hasPin()) {
      setStep('pin-login');
    }
  });

  const handleTelegramLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Check if running in Telegram WebApp
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        
        // Auth via Telegram WebApp
        const response = await api.request('/telegram/auth', {
          method: 'POST',
          body: JSON.stringify({ initData: tg.initData }),
        });
        
        if (response.success && response.data) {
          login(response.data.user, response.data.token);
          
          if (hasPin()) {
            setStep('pin-login');
          } else {
            setStep('onboarding');
          }
        } else {
          setError('Telegram orqali kirishda xatolik');
        }
      } else {
        // Open Telegram bot for external login
        window.open('https://t.me/identityshift_bot', '_blank');
        setError('Telegram bot orqali davom eting');
      }
    } catch (err) {
      setError('Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingSubmit = () => {
    if (!name.trim() || !age.trim() || !problem.trim()) {
      setError('Barcha maydonlarni to\'ldiring');
      return;
    }
    if (parseInt(age) < 13 || parseInt(age) > 100) {
      setError('Yosh 13 dan 100 gacha bo\'lishi kerak');
      return;
    }
    setError('');
    setStep('pin-setup');
  };

  const handlePinSetup = () => {
    if (pin.length !== 4) {
      setError('PIN kod 4 ta raqamdan iborat bo\'lishi kerak');
      return;
    }
    setError('');
    setStep('pin-confirm');
  };

  const handlePinConfirm = () => {
    if (pin !== confirmPin) {
      setError('PIN kodlar mos kelmadi');
      return;
    }
    savePin(pin);
    setError('');
    
    // Complete registration
    completeRegistration();
  };

  const completeRegistration = async () => {
    setIsLoading(true);
    try {
      // Update existing Telegram user with onboarding data
      const response = await api.request('/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          displayName: name,
          age: parseInt(age),
          problem: problem,
        }),
      });
      
      if (response.success) {
        // Reload to go to main app
        window.location.href = '/';
      } else {
        setError('Profil yangilashda xatolik');
      }
    } catch (err) {
      setError('Xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinLogin = () => {
    if (verifyPin(loginPin)) {
      // PIN correct - load user data and redirect
      window.location.href = '/';
    } else {
      setError('Noto\'g\'ri PIN kod');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-10 h-10 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Identity Shift</h1>
            <p className="text-slate-400">
              O'zgarishga tayyormisiz? <br />
              Sog'lom hayot sari birinchi qadam.
            </p>
            
            <div className="space-y-3 pt-4">
              <button
                onClick={() => setStep('telegram')}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-2xl transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Telegram orqali kirish
              </button>
            </div>
            
            <p className="text-xs text-slate-500 pt-4">
              Davom etish orqali siz maxfiylik siyosatiga rozilik bildirasiz
            </p>
          </motion.div>
        );

      case 'telegram':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <button
              onClick={() => setStep('welcome')}
              className="text-slate-400 hover:text-white text-sm"
            >
              ← Orqaga
            </button>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                <Send className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Telegram orqali</h2>
              <p className="text-slate-400 text-sm">
                Telegram orqali tez va xavfsiz kirish
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <button
              onClick={handleTelegramLogin}
              disabled={isLoading}
              className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-semibold rounded-2xl transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? 'Yuklanmoqda...' : 'Telegramda davom etish'}
              {!isLoading && <ChevronRight className="w-5 h-5" />}
            </button>

                      </motion.div>
        );

      case 'onboarding':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-5"
          >
            {/* Privacy Notice at Top */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-amber-200 text-xs leading-relaxed">
                  <strong className="text-amber-100">Sizning illatingiz maxfiy saqlanadi</strong> — hatto yaratuvchilar ham ko'ra olmaydi. Bu ma'lumot faqat sizning shaxsiy statistikangiz uchun ishlatiladi.
                </p>
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Siz haqingizda</h2>
              <p className="text-emerald-400 text-sm">
                Sizning hamma ma'lumotlaringiz maxfiy saqlanadi 🔒
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-slate-400 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Ismingiz
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ismingizni kiriting"
                  className="w-full p-4 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Yoshingiz
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Masalan: 25"
                  min="13"
                  max="100"
                  className="w-full p-4 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Illatingiz nima?
                </label>
                <select
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  className="w-full p-4 bg-slate-900/60 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                >
                  <option value="" disabled className="bg-slate-900">Tanlang...</option>
                  <option value="pornography" className="bg-slate-900">Pornografiya va masturbatsiya</option>
                  <option value="drugs" className="bg-slate-900">Giyohvand moddalar</option>
                  <option value="alcohol" className="bg-slate-900">Alkogol</option>
                  <option value="smoking" className="bg-slate-900">Chekish</option>
                  <option value="gambling" className="bg-slate-900">Qimor o'ynash</option>
                  <option value="gaming" className="bg-slate-900">O'yinlar (gaming addiction)</option>
                  <option value="social_media" className="bg-slate-900">Ijtimoiy tarmoqlar</option>
                  <option value="overeating" className="bg-slate-900">Ortiqcha ovqatlanish</option>
                  <option value="other" className="bg-slate-900">Boshqa</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleOnboardingSubmit}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-2xl transition-colors flex items-center justify-center gap-2"
            >
              Davom etish
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        );

      case 'pin-setup':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6 text-center"
          >
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">PIN kod yarating</h2>
            <p className="text-slate-400 text-sm">
              4 ta raqamdan iborat kod. Maxfiylikni saqlash uchun har safar kirishda so'raladi.
            </p>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="****"
                maxLength={4}
                className="w-full p-4 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-center text-2xl tracking-widest placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => setShowPin(!showPin)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button
              onClick={handlePinSetup}
              disabled={pin.length !== 4}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 text-white font-semibold rounded-2xl transition-colors"
            >
              Davom etish
            </button>
          </motion.div>
        );

      case 'pin-confirm':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6 text-center"
          >
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">PIN ni tasdiqlang</h2>
            <p className="text-slate-400 text-sm">
              Kodni qayta kiriting
            </p>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="****"
                maxLength={4}
                className="w-full p-4 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-center text-2xl tracking-widest placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => setShowPin(!showPin)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button
              onClick={handlePinConfirm}
              disabled={confirmPin.length !== 4 || isLoading}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 text-white font-semibold rounded-2xl transition-colors"
            >
              {isLoading ? 'Saqlanmoqda...' : 'Tayyor'}
            </button>
          </motion.div>
        );

      case 'pin-login':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 text-center"
          >
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-10 h-10 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Xush kelibsiz</h1>
            <p className="text-slate-400">
              PIN kodni kiriting
            </p>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={loginPin}
                onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="****"
                maxLength={4}
                className="w-full p-4 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-center text-2xl tracking-widest placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => setShowPin(!showPin)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button
              onClick={handlePinLogin}
              disabled={loginPin.length !== 4}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 text-white font-semibold rounded-2xl transition-colors"
            >
              Kirish
            </button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </div>
    </div>
  );
}
