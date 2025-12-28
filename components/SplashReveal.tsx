import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashRevealProps {
  onComplete: () => void;
}

export const SplashReveal: React.FC<SplashRevealProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // Phase 0: Initial Grid & Logo Fade In (0ms)
    // Phase 1: Text Decryption (1000ms)
    // Phase 2: Core Activation (2500ms)
    // Phase 3: Exit (3800ms)

    const timer1 = setTimeout(() => setPhase(1), 800);
    const timer2 = setTimeout(() => setPhase(2), 2200);
    const timer3 = setTimeout(() => {
        setPhase(3);
        setTimeout(onComplete, 800); // Allow exit animation to play
    }, 3800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black overflow-hidden"
      initial={{ opacity: 1 }}
      animate={phase === 3 ? { opacity: 0, scale: 1.05, filter: "blur(20px)" } : { opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 z-0">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[100vw] h-[100vh] bg-indigo-900/10 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-30 flex flex-col items-center">
        {/* Logo Container */}
        <motion.div 
            initial={{ scale: 0.9, opacity: 0, filter: "blur(10px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="w-24 h-24 mb-10 relative"
        >
             <img src="/logo.svg" className="w-full h-full" alt="Cortex" />
             
             {/* Spinning Rings - Subtle */}
             <motion.div 
                className="absolute -inset-8 border border-indigo-500/10 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
             />
             <motion.div 
                className="absolute -inset-16 border border-zinc-800/30 rounded-full border-dashed"
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
             />
        </motion.div>

        {/* Text Sequence */}
        <div className="h-12 flex flex-col items-center justify-center font-mono text-center">
            <AnimatePresence mode="wait">
                {phase === 0 && (
                    <motion.p 
                        key="init"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }}
                        className="text-[10px] text-zinc-600 tracking-[0.3em] uppercase"
                    >
                        Bios Check... OK
                    </motion.p>
                )}
                {phase === 1 && (
                    <motion.div
                        key="decrypt"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                        className="flex flex-col items-center gap-2"
                    >
                         <h1 className="text-2xl font-bold tracking-[0.2em] text-white">
                            CORTEX
                            <span className="text-indigo-500">.AI</span>
                         </h1>
                         <p className="text-[9px] text-indigo-400/80 tracking-widest">
                             NEURAL LINK ESTABLISHED
                         </p>
                    </motion.div>
                )}
                {phase === 2 && (
                    <motion.div
                         key="ready"
                         initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                         className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20"
                    >
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] text-indigo-200 tracking-wider">SYSTEM READY</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>
      
      {/* Bottom Loading Bar */}
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-900">
          <motion.div 
            className="h-full bg-gradient-to-r from-indigo-900 via-indigo-500 to-indigo-900"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 3.8, ease: "easeInOut" }}
          />
      </div>
    </motion.div>
  );
};