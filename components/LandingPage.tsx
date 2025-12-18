import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Cpu, Shield, Zap, Lock, Mail, Loader2, CheckCircle2 } from 'lucide-react';
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
            
            // Check if email confirmation is required (session will be null)
            if (data.user && !data.session) {
                setSuccessMessage("Account created! Please check your email to confirm your subscription before logging in.");
                setIsSignUp(false); // Switch to login view
            } else if (data.session) {
                // Auto-login successful (Email confirmation disabled in Supabase)
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
        setError(err.message || "Authentication failed");
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
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    },
  };

  return (
    <div className="h-screen w-full bg-zinc-950 relative overflow-hidden flex flex-col items-center justify-center">
      {/* Grid Background */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"
        style={{ maskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)' }}
      />
      
      {/* Ambient Light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/20 rounded-[100%] blur-[120px] pointer-events-none" />

      {/* Nav */}
      <nav className="absolute top-0 w-full p-8 flex justify-between items-center z-20">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Cpu className="w-5 h-5 text-zinc-950" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Cortex</span>
        </div>
        {!isAuthMode && (
             <button 
                onClick={() => setIsAuthMode(true)}
                className="px-6 py-2 rounded-full border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all text-sm font-medium"
                onMouseEnter={() => setCursorType('button')}
                onMouseLeave={() => setCursorType('default')}
            >
                Sign In
            </button>
        )}
      </nav>

      <AnimatePresence mode="wait">
        {!isAuthMode ? (
            <motion.div 
                key="landing-content"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -20 }}
                className="relative z-10 text-center max-w-4xl px-6"
            >
                <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 mb-8">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Enterprise RAG v3.0</span>
                </motion.div>

                <motion.h1 variants={itemVariants} className="text-5xl md:text-8xl font-bold tracking-tighter text-white mb-6 leading-[1.1]">
                    Intelligence, <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-white">Architected.</span>
                </motion.h1>

                <motion.p variants={itemVariants} className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
                    The private knowledge engine for enterprise. Connect your data, documents, and workflows into a single reasoning layer.
                </motion.p>

                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button 
                        onClick={() => { setIsAuthMode(true); setIsSignUp(true); }}
                        className="px-8 py-4 bg-white text-zinc-950 rounded-full font-semibold text-lg hover:scale-105 transition-transform flex items-center gap-2"
                        onMouseEnter={() => setCursorType('button')}
                        onMouseLeave={() => setCursorType('default')}
                    >
                        Get Started
                        <ArrowRight className="w-5 h-5" />
                    </button>
                    <button 
                        className="px-8 py-4 bg-zinc-900 border border-zinc-800 text-white rounded-full font-semibold text-lg hover:bg-zinc-800 transition-colors"
                        onMouseEnter={() => setCursorType('button')}
                        onMouseLeave={() => setCursorType('default')}
                    >
                        Book Demo
                    </button>
                </motion.div>
            </motion.div>
        ) : (
            <motion.div
                key="auth-form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative z-20 w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-2xl"
            >
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">{isSignUp ? 'Initialize Access' : 'Welcome Back'}</h2>
                    <p className="text-zinc-500 text-sm">Enter your enterprise credentials to proceed.</p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    {isSignUp && (
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wide">Full Name</label>
                            <input 
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-indigo-500 focus:outline-none transition-colors"
                                placeholder="John Doe"
                                required
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wide">Work Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input 
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 pl-10 text-white focus:border-indigo-500 focus:outline-none transition-colors"
                                placeholder="name@company.com"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wide">Password</label>
                        <div className="relative">
                             <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 pl-10 text-white focus:border-indigo-500 focus:outline-none transition-colors"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {successMessage && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs text-center flex items-center justify-center gap-2">
                             <CheckCircle2 className="w-4 h-4" />
                            {successMessage}
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2"
                        onMouseEnter={() => setCursorType('button')}
                        onMouseLeave={() => setCursorType('default')}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isSignUp ? 'Create Account' : 'Authenticate')}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button 
                        onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccessMessage(null); }}
                        className="text-xs text-zinc-500 hover:text-white transition-colors"
                    >
                        {isSignUp ? 'Already have credentials? Sign In' : 'Need an account? Request Access'}
                    </button>
                </div>
                
                <div className="mt-4 text-center">
                    <button 
                        onClick={() => setIsAuthMode(false)}
                        className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors uppercase tracking-widest"
                    >
                        Cancel
                    </button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
      
      {/* Feature strip */}
      {!isAuthMode && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-0 w-full border-t border-zinc-900 bg-zinc-950/50 backdrop-blur-sm p-6 hidden md:flex justify-center gap-12 text-zinc-500"
          >
            <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-zinc-600" />
                <span className="text-sm font-medium">SOC2 Compliant</span>
            </div>
            <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-zinc-600" />
                <span className="text-sm font-medium">Real-time Latency</span>
            </div>
          </motion.div>
      )}
    </div>
  );
};
