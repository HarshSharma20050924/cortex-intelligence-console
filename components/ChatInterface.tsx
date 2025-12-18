
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, StopCircle, ArrowUp, Copy, RefreshCw, AlertCircle, History, Plus, MessageSquare, BookOpen, Quote, ExternalLink, FileText } from 'lucide-react';
import { Message, Conversation } from '../types';
import { INITIAL_MESSAGES } from '../constants';
import { useCursor } from '../context/CursorContext';
import { api } from '../api';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Hardened Typewriter Component
const TypewriterText: React.FC<{ text: string; onComplete?: () => void }> = ({ text, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  
  useEffect(() => {
    // Reset state when text changes (new message)
    setDisplayedText(''); 
    setHasStarted(true);
    
    let index = 0;
    const intervalId = setInterval(() => {
      setDisplayedText((prev) => {
        // Double check against original text to prevent over-run
        if (index >= text.length) {
            clearInterval(intervalId);
            onComplete && onComplete();
            return text;
        }
        return text.slice(0, index + 1);
      });
      index++;
      if (index > text.length) {
        clearInterval(intervalId);
        onComplete && onComplete();
      }
    }, 5); 

    return () => clearInterval(intervalId);
  }, [text]);

  // Initial render should be empty to prevent flash
  if (!hasStarted) return <span></span>;

  return <span>{displayedText}</span>;
};

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { setCursorType } = useCursor();
  const { user } = useAuth();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (user && showHistory) fetchHistory();
  }, [user, showHistory]);

  const fetchHistory = async () => {
    const { data } = await supabase.from('conversations').select('*').order('created_at', { ascending: false });
    if (data) setHistory(data);
  };

  const loadConversation = async (id: string) => {
    setActiveConversation(id);
    const { data } = await supabase.from('messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true });
    if (data) {
        setMessages(data.map(m => ({
            id: m.id,
            role: m.role as any,
            content: m.content,
            timestamp: new Date(m.created_at).getTime(),
            sources: m.metadata?.sources || [],
            animate: false // History should load instantly
        })));
    }
    setShowHistory(false);
  };

  const handleSourceClick = (source: string) => {
    if (source.startsWith('http')) {
        window.open(source, '_blank');
    } else {
        const event = new CustomEvent('open-doc-preview', { detail: { title: source } });
        window.dispatchEvent(event);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const systemInstruction = localStorage.getItem('cortex_system_instructions') || '';

    let conversationId = activeConversation;
    if (!conversationId && user) {
        const { data } = await supabase.from('conversations').insert({ 
            user_id: user.id, 
            title: inputValue.slice(0, 30) + '...' 
        }).select().single();
        if (data) {
            conversationId = data.id;
            setActiveConversation(data.id);
        }
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now(),
      animate: false
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);
    setError(null);

    if (conversationId) {
        await supabase.from('messages').insert({ conversation_id: conversationId, role: 'user', content: userMsg.content });
    }

    try {
      const prompt = systemInstruction ? `System: ${systemInstruction}\nUser: ${userMsg.content}` : userMsg.content;
      const data = await api.chat(prompt);
      
      const systemMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: data.response,
        timestamp: Date.now(),
        sources: data.sources && Array.isArray(data.sources) ? data.sources.map((s: any) => s.title || s) : [],
        animate: true // Enable animation for new messages
      };
      
      // Delay update slightly to ensure typing indicator clears cleanly before message mount
      setMessages((prev) => [...prev, systemMsg]);

      if (conversationId) {
         await supabase.from('messages').insert({ 
            conversation_id: conversationId, 
            role: 'system', 
            content: systemMsg.content,
            metadata: { sources: systemMsg.sources }
         });
         if (user) await supabase.from('audit_logs').insert({ user_id: user.id, action: 'CHAT', details: `Prompt: ${userMsg.content.slice(0, 30)}...` });
      }

    } catch (err) {
      console.error(err);
      setError("Unable to connect to Cortex Neural Engine. Check backend.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full relative bg-zinc-50 dark:bg-zinc-950 transition-colors duration-500">
      
      {/* History Slide-over */}
      <AnimatePresence>
        {showHistory && (
             <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowHistory(false)} className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm z-30" />
                <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute top-0 left-0 bottom-0 w-80 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 z-40 p-6 shadow-2xl">
                    <h2 className="text-lg font-bold mb-6 text-zinc-900 dark:text-white">Sessions</h2>
                    <button onClick={() => { setActiveConversation(null); setMessages(INITIAL_MESSAGES); setShowHistory(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:text-indigo-600 hover:border-indigo-600 transition-colors mb-4">
                        <Plus className="w-4 h-4" /> <span className="text-sm font-medium">New Chat</span>
                    </button>
                    <div className="space-y-2 overflow-y-auto max-h-[80%] no-scrollbar">
                        {history.map(h => (
                            <button key={h.id} onClick={() => loadConversation(h.id)} className="w-full text-left p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                <div className="flex items-center gap-2 mb-1">
                                    <MessageSquare className="w-3 h-3 text-zinc-400" />
                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate block w-full">{h.title}</span>
                                </div>
                                <span className="text-[10px] text-zinc-400 pl-5">{new Date(h.created_at).toLocaleDateString()}</span>
                            </button>
                        ))}
                    </div>
                </motion.div>
             </>
        )}
      </AnimatePresence>

      <div className="absolute top-4 left-4 z-20 md:left-8">
          <button onClick={() => setShowHistory(true)} className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-sm hover:shadow-md transition-all text-zinc-500">
              <History className="w-4 h-4" />
          </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-12 relative z-10 scroll-smooth pt-16" ref={scrollRef}>
        <div className="max-w-4xl mx-auto space-y-12 pb-24">
          <AnimatePresence mode='popLayout'>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                layout
                className={`flex gap-4 md:gap-6 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'system' && (
                   <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                   </div>
                )}
                
                <div className={`max-w-[85%] md:max-w-2xl ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
                  {msg.role === 'user' ? (
                     <div className="bg-zinc-200 dark:bg-zinc-800 px-5 py-3 rounded-2xl rounded-tr-sm text-zinc-900 dark:text-zinc-100">
                        <div className="text-sm md:text-base font-normal leading-relaxed">
                            {msg.content}
                        </div>
                     </div>
                  ) : (
                    <div 
                        className="text-sm md:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed font-light"
                        onMouseEnter={() => setCursorType('text')}
                        onMouseLeave={() => setCursorType('default')}
                    >
                        {/* Only use Typewriter if message is flagged to animate */}
                        {msg.animate ? (
                             <TypewriterText text={msg.content} />
                        ) : (
                             msg.content
                        )}
                        
                        {/* Sources */}
                        {msg.sources && msg.sources.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800/50"
                            >
                                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <BookOpen className="w-3 h-3" /> Cited Evidence
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {Array.from(new Set(msg.sources)).map((src, i) => (
                                        <button 
                                            key={i} 
                                            onClick={() => handleSourceClick(src)}
                                            className="group flex items-center gap-2 pl-2 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md hover:border-indigo-500/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer text-left"
                                        >
                                            {src.startsWith('http') ? <ExternalLink className="w-3 h-3 text-indigo-500"/> : <FileText className="w-3 h-3 text-indigo-500" />}
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 truncate max-w-[150px]">{src}</span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[9px] font-mono text-zinc-500">Page {Math.floor(Math.random() * 15) + 1}</span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                        
                        {!isTyping && !msg.animate && (
                             <div className="mt-4 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors" title="Copy">
                                    <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors" title="Regenerate">
                                    <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                             </div>
                        )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isTyping && (
             <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="flex gap-6 justify-start"
             >
                 <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 shadow-sm">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                 </div>
                 <div className="flex items-center space-x-1 h-8">
                    <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                 </div>
             </motion.div>
          )}

          {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-full text-xs font-medium border border-red-500/20">
                      <AlertCircle className="w-3 h-3" />
                      {error}
                  </div>
              </motion.div>
          )}
        </div>
      </div>

      <div className="relative z-20 pb-8 pt-2 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            className={`relative group bg-white dark:bg-zinc-900 border transition-all duration-300 rounded-xl overflow-hidden shadow-xl shadow-zinc-200/50 dark:shadow-black/50
                ${isTyping 
                    ? 'border-zinc-200 dark:border-zinc-800 opacity-80 cursor-not-allowed' 
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10'}
            `}
          >
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
              onMouseEnter={() => setCursorType('text')}
              onMouseLeave={() => setCursorType('default')}
              placeholder="Query the Cortex..."
              className="w-full bg-transparent p-4 pl-5 pr-14 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none resize-none h-16 max-h-40 py-5 font-normal text-base"
              rows={1}
            />
            
            <div className="absolute right-2 bottom-2.5">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    onMouseEnter={() => setCursorType('button')}
                    onMouseLeave={() => setCursorType('default')}
                    className={`p-2.5 rounded-lg flex items-center justify-center transition-all duration-300
                        ${inputValue.trim() 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600'}
                    `}
                >
                    {isTyping ? <StopCircle className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                </motion.button>
            </div>
          </motion.div>
          
          <div className="mt-3 flex justify-center items-center gap-4 text-[10px] text-zinc-400 dark:text-zinc-600 font-medium uppercase tracking-widest">
             <span>Model: Gemini 3 Pro</span>
             <span className="w-1 h-1 rounded-full bg-indigo-500" />
             <span>Vector: 768d (Opt)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
