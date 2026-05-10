import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Send, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router';

interface Message {
  id: number;
  role: 'ai' | 'user';
  text: string;
}

const AI_RESPONSES: Record<string, string> = {
  default: "Siz bilan birga bo'lish menga ham yoqadi. Hozir qanday his qilyapsiz? 🌱",
  istak: "Istak kelganda — bu miyaning eski naqshi. 4-7-8 nafas oling: 4 sekund nafas oling, 7 sekund ushlang, 8 sekund chiqaring. Bu istak 15 daqiqada o'tib ketadi. 💪",
  qiyin: "Qiyin paytlar ham o'tadi. Siz bu yo'lni tanlagan edingiz — bu kuchlilik. Hozir bitta qadam: bir stakan suv iching. 🌊",
  yordam: "Men doim shu yerdaman. Nima haqida gaplashmoqchisiz? Triggerni, his-tuyg'uni yoki shunchaki suhbatni — hammasi yaxshi. 💬",
  salom: "Salom! Men Uswaa AI — sizning tiklanish yo'ldoshingizman. Bugun qanday ketmoqda? 🌟",
  rahmat: "Siz bu yo'lda davom etayotganingiz uchun men ham xursandman. Har bir kun — g'alaba! 🏆",
};

function getAiResponse(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('salom') || lower.includes('hi') || lower.includes('hello')) return AI_RESPONSES.salom;
  if (lower.includes('istak') || lower.includes('xohish') || lower.includes('qiyin')) return AI_RESPONSES.istak;
  if (lower.includes('yordam') || lower.includes('help')) return AI_RESPONSES.yordam;
  if (lower.includes('rahmat') || lower.includes('yaxshi')) return AI_RESPONSES.rahmat;
  if (lower.includes('his') || lower.includes('yomon') || lower.includes('stress')) return AI_RESPONSES.qiyin;
  return AI_RESPONSES.default;
}

export function AiChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: 'ai', text: "Salom! Men Uswaa AI — sizning shaxsiy tiklanish yordamchingizman. 🌱\n\nIstak kelganda, qiyin paytlarda yoki shunchaki gaplashgingiz kelganda — men shu yerdaman. Nima haqida gaplashamiz?" }
  ]);
  const [content, setContent] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }
  };

  const send = async () => {
    if (!content.trim() || typing) return;
    const text = content.trim();
    setContent('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const userMsg: Message = { id: Date.now(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setTyping(true);

    // Simulate AI thinking
    await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
    const aiText = getAiResponse(text);
    setTyping(false);
    setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: aiText }]);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md shrink-0">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white">
          <ArrowLeft size={22} />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
          <Sparkles size={16} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">Uswaa AI</p>
          <p className="text-xs text-emerald-400">Tiklanish yordamchisi</p>
        </div>
        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Beta</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map(msg => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.role === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shrink-0">
                <Sparkles size={14} className="text-white" />
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-emerald-500 text-white rounded-tr-sm'
                : 'bg-slate-800 text-slate-100 rounded-tl-sm'
            }`}>
              {msg.text}
            </div>
          </motion.div>
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {typing && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shrink-0">
                <Sparkles size={14} className="text-white" />
              </div>
              <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-2 h-2 bg-slate-400 rounded-full"
                    animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md flex gap-2 items-end shrink-0">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => { setContent(e.target.value); autoResize(); }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Xabar yozing..."
          rows={1}
          style={{ minHeight: '44px' }}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none overflow-hidden"
        />
        <button onClick={send} disabled={!content.trim() || typing}
          className="w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 flex items-center justify-center transition-colors shrink-0 mb-0.5">
          {typing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}
