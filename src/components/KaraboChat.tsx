import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Send, Loader2, ExternalLink, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '../context/AuthContext';

// ── Types ───────────────────────────────────────────────────────────────────

interface HistoryItem {
  role: 'user' | 'model';
  text: string;
}

interface ProductCard {
  id: number;
  name: string;
  slug: string;
  price: number;
  grade: 'A' | 'B' | 'C';
  imageUrl: string;
  inStock: boolean;
  cpu?: string;
  ram?: string;
  storage?: string;
}

interface Message {
  id: string;
  role: 'user' | 'karabo';
  text: string;
  products?: ProductCard[];
  isError?: boolean;
}

// ── KARABO brand components ──────────────────────────────────────────────────

const KaraboIcon = ({ className = '' }: { className?: string }) => (
  <img src="/karabo-icon.svg" alt="Karabo" className={className} />
);

const gradeColors: Record<string, string> = {
  A: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  B: 'bg-amber-50 text-amber-700 border-amber-200',
  C: 'bg-slate-100 text-slate-600 border-slate-200',
};

const SUGGESTIONS = [
  'What laptops do you have in stock?',
  'Best laptop for coding under R8,000?',
  'What does Grade A mean?',
  'Do you offer delivery?',
  'How long is the warranty?',
  'What are your contact details?',
];

// ── Main component ──────────────────────────────────────────────────────────

export default function KaraboChat() {
  const navigate = useNavigate();
  const [open, setOpen]           = useState(false);
  const [input, setInput]         = useState('');
  const [messages, setMessages]   = useState<Message[]>([]);
  const [loading, setLoading]     = useState(false);
  const [history, setHistory]     = useState<HistoryItem[]>([]);
  const [hasGreeted, setHasGreeted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);

  // Lock body scroll on mobile while chat is open
  useEffect(() => {
    const isMobile = window.innerWidth < 640;
    if (!isMobile) return;
    if (open) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [open]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Greet on first open
  useEffect(() => {
    if (open && !hasGreeted) {
      setHasGreeted(true);
      setMessages([{
        id: 'greeting',
        role: 'karabo',
        text: "Hi there! I'm **KARABO**, your Biostec Group assistant. I can help you find the perfect laptop, answer questions about delivery, warranty, or anything else about our store.\n\nWhat can I help you with today?",
      }]);
    }
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, hasGreeted]);

  const uid = () => Math.random().toString(36).slice(2);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput('');
    const userMsg: Message = { id: uid(), role: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/ai/chat.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history }),
        signal: AbortSignal.timeout(35000),
      });

      const data = await res.json();

      if (!data.success || data.error) {
        setMessages(prev => [...prev, {
          id: uid(),
          role: 'karabo',
          text: data.error || 'Something went wrong. Please try again.',
          isError: true,
        }]);
        return;
      }

      const karaboMsg: Message = {
        id:       uid(),
        role:     'karabo',
        text:     data.reply,
        products: data.products?.length > 0 ? data.products : undefined,
      };
      setMessages(prev => [...prev, karaboMsg]);

      // Update conversation history for context
      setHistory(prev => ([
        ...prev,
        { role: 'user'  as const, text: trimmed },
        { role: 'model' as const, text: data.reply },
      ] as HistoryItem[]).slice(-20)); // keep last 10 exchanges

    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: uid(),
        role: 'karabo',
        text: err?.name === 'TimeoutError'
          ? "I'm taking a bit too long to respond. Please try again."
          : 'Unable to connect. Please check your connection and try again.',
        isError: true,
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [loading, history]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleClose = () => setOpen(false);

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderText = (text: string) => {
    // Convert **bold** and newlines to JSX
    const lines = text.split('\n');
    return lines.map((line, li) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <React.Fragment key={li}>
          {parts.map((part, pi) =>
            /^\*\*[^*]+\*\*$/.test(part)
              ? <strong key={pi}>{part.slice(2, -2)}</strong>
              : part
          )}
          {li < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  const ProductCardItem = ({ p }: { p: ProductCard }) => (
    <div className="flex-shrink-0 w-[200px] bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-[110px] bg-slate-50 flex items-center justify-center p-3">
        <img
          src={p.imageUrl || '/logo.png'}
          alt={p.name}
          className="max-h-full max-w-full object-contain"
          onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
        />
      </div>
      <div className="p-3">
        <p className="text-xs font-semibold text-slate-900 leading-tight line-clamp-2 mb-1.5">{p.name}</p>
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${gradeColors[p.grade] ?? gradeColors.C}`}>
            Grade {p.grade}
          </span>
          {!p.inStock && (
            <span className="text-[10px] text-slate-400">Out of stock</span>
          )}
        </div>
        {(p.cpu || p.ram || p.storage) && (
          <p className="text-[10px] text-slate-400 leading-tight mb-2 line-clamp-2">
            {[p.cpu, p.ram, p.storage].filter(Boolean).join(' · ')}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm font-extrabold text-slate-900">
            R {p.price.toLocaleString()}
          </span>
          <button
            onClick={() => { navigate(`/product/${p.id}`); handleClose(); }}
            className="flex items-center gap-1 text-[11px] font-semibold text-white bg-[#003399] hover:bg-[#0044cc] px-2.5 py-1.5 rounded-lg transition-colors"
          >
            View <ExternalLink className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    </div>
  );

  const showSuggestions = messages.length <= 1 && !loading;

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Floating trigger button ──────────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Chat with KARABO"
        className={`fixed bottom-6 right-5 sm:bottom-7 sm:right-7 z-[80]
                    w-14 h-14 rounded-2xl shadow-2xl shadow-black/30
                    flex items-center justify-center
                    transition-all duration-300 hover:scale-110 active:scale-95
                    ${open ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100 scale-100'}`}
        style={{ background: 'white', border: '2px solid #003399', boxShadow: '0 4px 20px rgba(0,51,153,0.25)' }}
      >
        <KaraboIcon className="h-8 w-auto" />
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-2xl animate-ping opacity-20"
              style={{ background: '#003399', animationDuration: '2.5s' }} />
      </button>

      {/* ── Chat window ──────────────────────────────────────────── */}
      <div
        className={`fixed z-[90]
                    inset-0
                    sm:inset-auto sm:bottom-7 sm:right-7 sm:rounded-2xl
                    sm:w-[390px] sm:h-[min(630px,calc(100dvh-3.5rem))]
                    flex flex-col overflow-hidden
                    transition-all duration-300 ease-out
                    ${open
                      ? 'opacity-100 translate-y-0 pointer-events-auto'
                      : 'opacity-0 translate-y-6 pointer-events-none'
                    }`}
        style={{
          boxShadow: '0 32px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,51,153,0.15)',
        }}
      >

        {/* ── Header ───────────────────────────────────────────── */}
        <div
          className="shrink-0 px-5 py-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #003399 0%, #002277 100%)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white p-1">
              <KaraboIcon className="h-full w-auto" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight tracking-wide">KARABO</p>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Powered by Karabo Node
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Online dot */}
            <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Messages area ─────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto bg-[#f7f8fc] px-4 py-5 space-y-4">

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'karabo' && (
                <div className="w-7 h-7 rounded-xl shrink-0 mr-2.5 mt-0.5 flex items-center justify-center bg-white border border-slate-200 p-0.5">
                  <KaraboIcon className="h-full w-auto" />
                </div>
              )}

              <div className="flex flex-col gap-2.5 max-w-[82%]">
                {/* Bubble */}
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
                    ${msg.role === 'user'
                      ? 'bg-[#003399] text-white rounded-tr-sm'
                      : msg.isError
                      ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-sm'
                      : 'bg-white text-slate-800 border border-slate-100 shadow-sm rounded-tl-sm'
                    }`}
                >
                  {renderText(msg.text)}
                </div>

                {/* Product cards */}
                {msg.products && msg.products.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
                    {msg.products.map(p => (
                      <ProductCardItem key={p.id} p={p} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-xl shrink-0 mr-2.5 mt-0.5 flex items-center justify-center bg-[#003399] border border-[#002277] p-1">
                <KaraboIcon className="h-full w-auto brightness-0 invert" />
              </div>
              <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full bg-slate-300 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s`, animationDuration: '1s' }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Suggestion chips */}
          {showSuggestions && (
            <div className="flex flex-wrap gap-2 pt-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-2
                             bg-white border border-slate-200 text-slate-700
                             rounded-xl hover:border-[#003399] hover:text-[#003399]
                             transition-colors shadow-sm"
                >
                  <ChevronRight className="w-3 h-3 shrink-0" />
                  {s}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input area ────────────────────────────────────────── */}
        <div className="shrink-0 bg-white border-t border-slate-100 px-4 py-3">
          <div className="flex items-end gap-2.5">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                // Auto-grow
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
              }}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="Ask KARABO anything…"
              className="flex-1 resize-none bg-slate-50 border border-slate-200 rounded-xl
                         px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400
                         focus:outline-none focus:border-[#003399] focus:ring-2 focus:ring-[#003399]/10
                         transition-all disabled:opacity-60 leading-relaxed overflow-hidden"
              style={{ minHeight: '46px', maxHeight: '100px', fontSize: '16px' }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0
                         transition-all active:scale-95
                         disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#003399' }}
            >
              {loading
                ? <Loader2 className="w-4.5 h-4.5 text-white animate-spin" />
                : <Send className="w-4 h-4 text-white" />
              }
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            KARABO answers from Biostec website information only
          </p>
        </div>

      </div>

    </>
  );
}
