import React, { useState, useEffect } from 'react';
import { Cursor } from './components/Cursor';
import { SplashReveal } from './components/SplashReveal';
import { KnowledgePanel } from './components/KnowledgePanel';
import { ChatInterface } from './components/ChatInterface';
import { Settings } from './components/Settings';
import { LandingPage } from './components/LandingPage';
import { CursorProvider } from './context/CursorContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Menu, X, MessageSquare, Settings as SettingsIcon, Database, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewState } from './types';

const AppContent: React.FC = () => {
  const { session, loading, signOut } = useAuth();
  const [view, setView] = useState<ViewState>('landing');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [splashComplete, setSplashComplete] = useState(false);

  useEffect(() => {
    // Only transition view if splash is done
    if (splashComplete) {
        if (session) {
            setView('dashboard');
        } else {
            setView('landing');
        }
    }
  }, [session, splashComplete]);

  const handleSignOut = async () => {
      await signOut();
      setView('landing');
  };

  // Simple Sidebar Component
  const Sidebar = () => (
    <div className="w-16 h-full bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col items-center py-6 gap-6 z-40">
        <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/10 border border-zinc-800">
            <img src="/logo.svg" className="w-5 h-5" alt="Cortex" />
        </div>
        
        <button 
            onClick={() => setView('dashboard')}
            className={`p-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-white dark:bg-zinc-800 text-indigo-600 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`}
        >
            <MessageSquare className="w-5 h-5" />
        </button>
        
        <button 
             onClick={() => setView('settings')}
             className={`p-3 rounded-xl transition-all ${view === 'settings' ? 'bg-white dark:bg-zinc-800 text-indigo-600 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`}
        >
            <SettingsIcon className="w-5 h-5" />
        </button>

        <div className="mt-auto">
             <button 
                onClick={handleSignOut}
                className="p-3 text-zinc-400 hover:text-red-500 transition-colors"
             >
                <LogOut className="w-5 h-5" />
            </button>
        </div>
    </div>
  );

  if (loading) {
      return null; // Let splash handle initial load state visually
  }

  return (
    <div className="h-screen w-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-200 flex overflow-hidden relative font-sans transition-colors duration-500">
      <Cursor />

      <AnimatePresence>
        {!splashComplete && (
            <SplashReveal onComplete={() => setSplashComplete(true)} />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!session ? (
            splashComplete && (
                <motion.div 
                    key="landing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -50 }}
                    className="w-full h-full z-50"
                >
                    <LandingPage onLogin={() => {}} /> 
                </motion.div>
            )
        ) : (
            <motion.div 
                key="app"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex w-full h-full"
            >
                 {/* Sidebar Navigation */}
                <div className="hidden md:block h-full shrink-0 z-40">
                    <Sidebar />
                </div>

                {/* Secondary Sidebar (Knowledge) - Only show on dashboard */}
                {view === 'dashboard' && (
                    <div className="hidden md:block w-72 h-full shrink-0 z-30 relative">
                        <KnowledgePanel />
                    </div>
                )}

                {/* Mobile Menu Button */}
                <button 
                    className="md:hidden absolute top-4 left-4 z-50 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                {/* Mobile Drawer */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div 
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed inset-0 z-40 bg-white dark:bg-zinc-950 md:hidden flex flex-col"
                        >
                            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-end">
                                <button onClick={() => setIsMobileMenuOpen(false)}>
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-auto">
                                <div className="p-4 flex gap-4 border-b border-zinc-200 dark:border-zinc-800">
                                    <button onClick={() => { setView('dashboard'); setIsMobileMenuOpen(false); }} className={`flex-1 py-2 text-center rounded-lg ${view === 'dashboard' ? 'bg-indigo-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}>Chat</button>
                                    <button onClick={() => { setView('settings'); setIsMobileMenuOpen(false); }} className={`flex-1 py-2 text-center rounded-lg ${view === 'settings' ? 'bg-indigo-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}>Settings</button>
                                </div>
                                <KnowledgePanel />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Content Area */}
                <main className="flex-1 h-full relative z-0 bg-zinc-50 dark:bg-zinc-950">
                    {view === 'dashboard' ? <ChatInterface /> : <Settings />}
                </main>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
        <CursorProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </CursorProvider>
    </ThemeProvider>
  );
};

export default App;