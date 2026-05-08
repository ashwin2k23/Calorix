import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Send, Loader2, RefreshCw, MessageSquare, User, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SUGGESTED_PROMPTS = [
  { icon: '🥘', text: 'Can I eat dosa during weight loss?' },
  { icon: '💪', text: 'Suggest a high protein Indian breakfast' },
  { icon: '📊', text: "How many calories in chicken biryani?" },
  { icon: '🏋️', text: 'What should I eat after gym?' },
  { icon: '🫀', text: 'What Indian foods are heart-healthy?' },
  { icon: '🌙', text: 'Best light dinner for weight loss?' },
];

// Prompts shown inside a rejection bubble
const RECOVERY_PROMPTS = [
  'Analyze my meals',
  'Suggest a high protein breakfast',
  'How many calories in dosa?',
  'Create a fat loss meal plan',
];

// Simple markdown renderer (bold, italic, bullets)
function renderMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^• (.+)/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^- (.+)/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n/g, '<br/>');
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-primary/60"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
          transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

function Message({ msg, onSuggestedPrompt }) {
  const isUser = msg.role === 'user';
  const isRejected = msg.rejected === true;

  if (msg.typing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-3"
      >
        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-[#00c2ff]/20 border border-white/10">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div className="max-w-[75%] rounded-2xl rounded-tl-sm px-4 py-3 bg-card/60 border border-white/10 backdrop-blur-sm">
          <TypingDots />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm flex-shrink-0
        ${isUser
          ? 'bg-primary/20 border border-primary/30 text-primary'
          : isRejected
            ? 'bg-amber-500/20 border border-amber-500/30'
            : 'bg-gradient-to-br from-primary/20 to-[#00c2ff]/20 border border-white/10'
        }`}>
        {isUser
          ? <User className="w-4 h-4" />
          : isRejected
            ? <AlertCircle className="w-4 h-4 text-amber-400" />
            : <Sparkles className="w-4 h-4 text-primary" />
        }
      </div>

      {/* Bubble */}
      <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed
        ${isUser
          ? 'bg-primary/15 border border-primary/20 text-foreground rounded-tr-sm'
          : isRejected
            ? 'bg-amber-500/8 border border-amber-500/25 text-foreground/90 rounded-tl-sm'
            : 'bg-card/60 border border-white/10 text-foreground/90 rounded-tl-sm backdrop-blur-sm'
        }`}>

        {/* Rejected label */}
        {isRejected && (
          <div className="flex items-center gap-1.5 mb-2 text-amber-400">
            <AlertCircle className="w-3 h-3" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Out of scope</span>
          </div>
        )}

        <div
          className="prose-sm"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
        />

        {/* Recovery prompts shown below rejection */}
        {isRejected && (
          <div className="mt-3 pt-3 border-t border-amber-500/15">
            <p className="text-[10px] text-amber-400/70 font-medium mb-2 uppercase tracking-wide">Try one of these:</p>
            <div className="flex flex-col gap-1.5">
              {RECOVERY_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => onSuggestedPrompt(p)}
                  className="text-left text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 text-foreground/80 hover:text-foreground transition-all"
                >
                  → {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {msg.timestamp && (
          <p className="text-[10px] text-muted-foreground mt-2 text-right">
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function Assistant({ profile }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Namaste! 🙏 I'm your personal AI nutrition coach, powered by Gemini AI.\n\nI can help you with:\n- **Meal suggestions** tailored to Indian cuisine\n- **Calorie & macro** breakdown for any food\n- **Diet advice** based on your ${profile?.goal_type || 'fitness'} goal\n- **Pre/post workout** nutrition tips\n\nWhat would you like to know today?`,
      timestamp: Date.now(),
      rejected: false,
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput('');

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: userText,
      timestamp: Date.now(),
      rejected: false,
    };
    const typingMsg = { id: 'typing', role: 'assistant', typing: true };
    setMessages(prev => [...prev, userMsg, typingMsg]);
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          profile,
          history: messages
            .filter(m => !m.typing && m.id !== 'welcome' && !m.rejected)
            .slice(-6)
            .map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'AI failed');

      setMessages(prev => [
        ...prev.filter(m => m.id !== 'typing'),
        {
          id: Date.now(),
          role: 'assistant',
          content: data.reply,
          timestamp: Date.now(),
          rejected: data.rejected === true,
        },
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev.filter(m => m.id !== 'typing'),
        {
          id: Date.now(),
          role: 'assistant',
          content: "I'm having trouble connecting right now. Please check that the backend is running and try again.",
          timestamp: Date.now(),
          rejected: false,
        },
      ]);
      toast.error('AI assistant unavailable');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, messages, profile]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Chat cleared! Ask me anything about nutrition, Indian foods, or your fitness goal. 🥗`,
      timestamp: Date.now(),
      rejected: false,
    }]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2 mb-1">
            AI Nutrition Assistant
            <Sparkles className="w-6 h-6 text-[#00c2ff]" />
          </h1>
          <p className="text-sm text-muted-foreground">
            Powered by Gemini AI · Nutrition & fitness only
            {profile?.goal_type && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                🎯 {profile.goal_type}
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearChat}
          className="border-white/10 rounded-xl gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Clear
        </Button>
      </div>

      {/* Messages area */}
      <Card className="flex-1 border-white/5 bg-card/30 backdrop-blur-md overflow-hidden flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '100%' }}>
          <AnimatePresence>
            {messages.map(msg => (
              <Message key={msg.id} msg={msg} onSuggestedPrompt={sendMessage} />
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </CardContent>

        {/* Suggested prompts */}
        <div className="border-t border-white/5 px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {SUGGESTED_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => sendMessage(p.text)}
                disabled={loading}
                className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-black/30 border border-white/10 hover:border-primary/30 hover:bg-primary/5 hover:text-primary text-muted-foreground transition-all disabled:opacity-40"
              >
                {p.icon} {p.text}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-white/5 p-4 flex gap-3">
          <div className="flex-1 relative">
            <MessageSquare className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about nutrition, meals, macros..."
              rows={1}
              disabled={loading}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all resize-none text-foreground placeholder:text-muted-foreground disabled:opacity-50"
              style={{ minHeight: '44px', maxHeight: '120px' }}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
          </div>
          <Button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-gradient-to-r from-primary to-[#00c2ff] hover:opacity-90 shadow-lg shadow-primary/20 h-11 w-11 p-0 flex-shrink-0"
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
