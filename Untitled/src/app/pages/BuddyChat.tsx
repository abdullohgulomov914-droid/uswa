import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';

interface Message {
  id: number;
  senderId: number;
  content: string;
  isOwn: boolean;
  createdAt: string;
}

export function BuddyChat() {
  const { buddyId } = useParams<{ buddyId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [buddyId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    const res = await api.request<Message[]>(`/chat/${buddyId}`);
    if (res.success && res.data) {
      setMessages(res.data);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const res = await api.request<Message>(`/chat/${buddyId}`, {
      method: 'POST',
      body: JSON.stringify({ content: text.trim() }),
    });
    if (res.success && res.data) {
      setMessages((prev) => [...prev, res.data!]);
      setText('');
    }
    setSending(false);
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white">
          <ArrowLeft size={22} />
        </button>
        <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
          B
        </div>
        <div>
          <p className="font-semibold text-sm">Buddy</p>
          <p className="text-xs text-slate-500">Anonim hamroh</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center mt-10">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-slate-500 text-sm mt-10">
            Hali xabar yo'q. Salom deng! 👋
          </p>
        ) : (
          messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.isOwn
                    ? 'bg-emerald-500 text-white rounded-br-sm'
                    : 'bg-slate-800 text-slate-100 rounded-bl-sm'
                }`}
              >
                <p>{msg.content}</p>
                <p className={`text-[10px] mt-1 ${msg.isOwn ? 'text-emerald-100/70' : 'text-slate-500'}`}>
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </motion.div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md flex gap-2 items-end">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Xabar yozing..."
          rows={1}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim() || sending}
          className="w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 flex items-center justify-center transition-colors flex-shrink-0"
        >
          {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}
