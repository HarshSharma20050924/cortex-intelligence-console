
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Cpu, CheckCircle2, Activity } from 'lucide-react';
import { useCursor } from '../context/CursorContext';
import { supabase } from '../lib/supabase';

interface LandingPageProps {
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const { setCursorType } = useCursor();
  const [isAuthMode, setIsAuthMode] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Artificial delay for effect
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
        if (isSignUp) {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: name }
                }
            });
            if (error) throw error;
            
            if (data.user && !data.session) {
                setSuccessMessage("Identity Created. Verification uplink sent to email.");
                setIsSignUp(false); 
            } else if (data.session) {
                onLogin();
            }
        } else {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            onLogin();
        }
    } catch (err: any) {
        console.error(err);
        setError(err.message || "Authentication Handshake Failed");
    } finally {
        setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0, filter: 'blur(5px)' },
    visible: {
      y: 0,
      opacity: 1,
      filter: 'blur(0px)',
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <div className="h-screen w-full bg-[#050505] relative overflow-hidden flex flex-col font-sans selection:bg-indigo-500/30">
      
      {/* Background Architecture - Purple Grid with Smooth Edges */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Main Top Glow */}
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] bg-indigo-600/15 blur-[120px] rounded-full" />
          
          {/* Bottom Accent */}
          <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vh] bg-purple-900/10 blur-[100px] rounded-full" />
          
          {/* Grid - The "Cool Purple Grid" requested, but smoother */}
          <div 
            className="absolute inset-0 bg-[linear-gradient(to_right,#4f46e51a_1px,transparent_1px),linear-gradient(to_bottom,#4f46e51a_1px,transparent_1px)] bg-[size:50px_50px]"
            style={{ 
                maskImage: 'radial-gradient(circle at center, black 40%, transparent 95%)',
                WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 95%)'
            }}
          />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 px-8 py-6 flex justify-between items-center w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-3 group cursor-default">
            <div className="relative">
                <img src="/logo.svg" className="w-8 h-8 opacity-90 group-hover:opacity-100 transition-opacity" alt="Cortex" />
                <div className="absolute inset-0 bg-indigo-500/30 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-lg font-bold tracking-[0.1em] text-zinc-200">Cortex</span>
        </div>
        {!isAuthMode && (
             <button 
                onClick={() => setIsAuthMode(true)}
                className="text-xs font-medium text-zinc-500 hover:text-indigo-400 transition-colors uppercase tracking-widest flex items-center gap-2 group"
                onMouseEnter={() => setCursorType('button')}
                onMouseLeave={() => setCursorType('default')}
            >
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-indigo-500 transition-colors" />
                Terminal Access
            </button>
        )}
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center relative z-10 px-6">
        <AnimatePresence mode="wait">
            {!isAuthMode ? (
                <motion.div 
                    key="landing-hero"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                    className="max-w-5xl mx-auto w-full"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="text-left space-y-8">
                            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/5 border border-indigo-500/10 backdrop-blur-sm">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                                <span className="text-[10px] font-mono text-indigo-300 uppercase tracking-widest">System v3.0 Operational</span>
                            </motion.div>

                            <motion.h1 variants={itemVariants} className="text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.05]">
                                The Neural <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-white">Intelligence Layer</span>
                            </motion.h1>

                            <motion.p variants={itemVariants} className="text-lg text-zinc-500 max-w-md leading-relaxed font-light border-l border-zinc-800 pl-6">
                                Unify your enterprise knowledge. Analyze documents, crawl streams, and generate insights with architectural precision.
                            </motion.p>

                            <motion.div variants={itemVariants} className="pt-4">
                                <button 
                                    onClick={() => { setIsAuthMode(true); setIsSignUp(true); }}
                                    className="group relative px-8 py-4 bg-white/5 border border-white/10 text-white text-sm font-bold uppercase tracking-widest overflow-hidden hover:bg-white/10 transition-all duration-300 backdrop-blur-md rounded-lg"
                                    onMouseEnter={() => setCursorType('button')}
                                    onMouseLeave={() => setCursorType('default')}
                                >
                                    <span className="relative flex items-center gap-3">
                                        Initialize Protocol
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-indigo-400" />
                                    </span>
                                    {/* Smooth Glow on Hover */}
                                    <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/10 group-hover:ring-white/20 transition-all" />
                                </button>
                            </motion.div>
                        </div>

                        {/* Visual Abstraction */}
                        <motion.div variants={itemVariants} className="hidden lg:block relative">
                            {/* Abstract Hologram */}
                            <div className="relative w-full aspect-square max-w-md mx-auto">
                                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent rounded-full blur-3xl" />
                                <div className="relative z-10 p-8 border border-white/5 bg-black/40 backdrop-blur-md rounded-2xl shadow-2xl">
                                    <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                                        <div className="flex gap-2">
                                            <div className="w-2 h-2 rounded-full bg-zinc-700" />
                                            <div className="w-2 h-2 rounded-full bg-zinc-700" />
                                        </div>
                                        <div className="font-mono text-[10px] text-zinc-500">CORTEX_DAEMON</div>
                                    </div>
                                    <div className="space-y-4 font-mono text-xs">
                                        <div className="flex gap-4 items-center text-zinc-500">
                                            <span></span>
                                            <span className="text-indigo-400">connecting_neural_net...</span>
                                        </div>
                                        <div className="flex gap-4 items-center text-zinc-500">
                                            <span></span>
                                            <span>verifying_handshake <span className="text-emerald-500">[OK]</span></span>
                                        </div>
                                        <div className="pl-6 pt-2 space-y-2 opacity-50">
                                            <div className="h-1 bg-zinc-800 w-3/4 rounded" />
                                            <div className="h-1 bg-zinc-800 w-1/2 rounded" />
                                            <div className="h-1 bg-zinc-800 w-2/3 rounded" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    key="auth-interface"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-[400px]"
                >
                    {/* Core Access Card */}
                    <div className="bg-[#0A0A0A] border border-zinc-800 rounded-2xl p-8 shadow-[0_0_50px_-12px_rgba(79,70,229,0.15)] relative overflow-hidden">
                        
                        {/* Top Accent Line */}
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
                        
                        <div className="mb-8 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 mb-4 shadow-inner">
                                <Cpu className="w-6 h-6 text-indigo-500" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-1">Core Access</h2>
                            <p className="text-xs text-zinc-500">Enter credentials for general environment.</p>
                        </div>

                        <form onSubmit={handleAuth} className="space-y-5">
                            {isSignUp && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Full Name</label>
                                    <input 
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-zinc-200 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-700"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Work Email</label>
                                <input 
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-zinc-200 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-700"
                                    placeholder="name@company.com"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Password</label>
                                <input 
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-zinc-200 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-700"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            {successMessage && (
                                <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
                                     <CheckCircle2 className="w-3.5 h-3.5" />
                                    {successMessage}
                                </div>
                            )}

                            {error && (
                                <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-xs text-center font-mono">
                                    {error}
                                </div>
                            )}

                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#6366f1] hover:bg-[#5558e6] text-white py-3.5 rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 mt-2"
                                onMouseEnter={() => setCursorType('button')}
                                onMouseLeave={() => setCursorType('default')}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4 animate-pulse" />
                                        <span className="font-mono text-xs uppercase">Processing...</span>
                                    </div>
                                ) : (
                                    isSignUp ? 'Create Account' : 'Sign In'
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center space-y-4">
                            <button 
                                onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccessMessage(null); }}
                                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors block w-full"
                            >
                                {isSignUp ? 'Already have credentials? Sign In' : "Don't have an account? Create one"}
                            </button>
                            
                            {/* REMOVED SWITCH DOMAIN BUTTON AS REQUESTED */}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 w-full py-6 px-8 flex justify-between items-center text-[10px] text-zinc-700 font-mono uppercase tracking-widest pointer-events-none">
         <div>Cortex OS v3.0</div>
         <div>Encrypted Connection</div>
      </div>

    </div>
  );
};
