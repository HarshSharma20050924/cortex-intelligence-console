
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Key, Shield, Terminal, Cpu, Activity, Fingerprint, CheckCircle2 } from 'lucide-react';
import { useCursor } from '../context/CursorContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const Settings: React.FC = () => {
    const { setCursorType } = useCursor();
    const { user } = useAuth();
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [systemInstruction, setSystemInstruction] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (user) {
            supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(5)
                .then(({ data }) => setAuditLogs(data || []));
        }
        
        // Load persisted instructions
        const saved = localStorage.getItem('cortex_system_instructions');
        if (saved) {
            setSystemInstruction(saved);
        } else {
            setSystemInstruction("You are Cortex, a highly advanced enterprise intelligence engine. Answer queries with precision, architectural structure, and professional tone.");
        }
    }, [user]);

    const handleSave = async () => {
        setIsSaving(true);
        // Simulate API delay and persist to local storage for the chat interface to pick up
        setTimeout(() => {
            localStorage.setItem('cortex_system_instructions', systemInstruction);
            setIsSaving(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        }, 800);
    };

    return (
        <div className="h-full overflow-y-auto no-scrollbar bg-zinc-950 p-8 md:p-12 text-zinc-200 font-sans">
            <div className="max-w-3xl mx-auto space-y-12 pb-20">
                <header className="border-b border-zinc-800 pb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
                            <Cpu className="w-5 h-5 text-indigo-500" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-white uppercase">System Configuration</h1>
                    </div>
                    <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest ml-12">Authorized Personnel Only • ID: {user?.id.slice(0, 8)}</p>
                </header>

                <div className="space-y-12">
                    
                    {/* Neural Personality / System Instructions */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Terminal className="w-4 h-4 text-emerald-500" />
                            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Neural Persona Protocol</h2>
                        </div>
                        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-1 relative group focus-within:border-indigo-500/50 transition-colors">
                            <div className="absolute top-0 left-0 w-full h-8 bg-zinc-900 rounded-t-xl border-b border-zinc-800 flex items-center px-4 gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500/20"></div>
                                <div className="w-2 h-2 rounded-full bg-amber-500/20"></div>
                                <div className="w-2 h-2 rounded-full bg-emerald-500/20"></div>
                                <span className="ml-2 text-[10px] font-mono text-zinc-500">system_instruction.config</span>
                            </div>
                            <textarea 
                                value={systemInstruction}
                                onChange={(e) => setSystemInstruction(e.target.value)}
                                className="w-full bg-transparent p-4 pt-10 text-sm font-mono text-zinc-300 focus:outline-none min-h-[120px] resize-none"
                                spellCheck={false}
                            />
                        </div>
                        <p className="mt-2 text-[10px] text-zinc-600">Defines the behavioral parameters of the inference engine.</p>
                    </section>

                    {/* API Keys (Enterprise) */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Key className="w-4 h-4 text-indigo-500" />
                            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Gateway Credentials</h2>
                        </div>
                        <div className="bg-zinc-900/30 rounded-xl border border-zinc-800 p-6 space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-2">Gemini API Key</label>
                                <div className="relative group">
                                    <input 
                                        type="password" 
                                        placeholder="Enter your Enterprise Key (sk-...)" 
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 pl-4 pr-12 text-zinc-200 font-mono text-xs focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all group-hover:border-zinc-700"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-zinc-900 rounded border border-zinc-800">
                                        <Fingerprint className="w-3 h-3 text-zinc-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Audit Logs (Enterprise) */}
                    <section>
                         <div className="flex items-center gap-2 mb-4">
                            <Shield className="w-4 h-4 text-zinc-400" />
                            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Security Audit Log</h2>
                        </div>
                         <div className="bg-zinc-900/30 rounded-xl border border-zinc-800 overflow-hidden">
                             <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/50 flex justify-between">
                                <span className="text-[9px] font-mono uppercase text-zinc-500">Event Stream</span>
                                <span className="text-[9px] font-mono uppercase text-zinc-500">Status: Active</span>
                             </div>
                             {auditLogs.length === 0 ? (
                                 <div className="p-8 text-center flex flex-col items-center gap-3">
                                     <Activity className="w-6 h-6 text-zinc-800" />
                                     <span className="text-xs text-zinc-600 font-mono">No telemetry data recorded.</span>
                                 </div>
                             ) : (
                                 auditLogs.map((log, i) => (
                                     <div key={i} className="px-6 py-3 border-b border-zinc-800/50 last:border-0 flex justify-between items-center hover:bg-zinc-800/20 transition-colors group">
                                         <div className="flex items-center gap-3">
                                             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50 group-hover:bg-indigo-400 transition-colors" />
                                             <span className="text-xs font-bold text-zinc-300 uppercase tracking-tight">{log.action}</span>
                                             <span className="text-xs text-zinc-500 font-mono truncate max-w-[200px] border-l border-zinc-800 pl-3 ml-1">{log.details}</span>
                                         </div>
                                         <span className="text-[10px] font-mono text-zinc-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                     </div>
                                 ))
                             )}
                         </div>
                    </section>

                    {/* Account Actions */}
                    <div className="pt-8 border-t border-zinc-800 flex justify-end">
                         <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] 
                                ${saveSuccess ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-white text-zinc-950 hover:bg-zinc-200'}
                            `}
                            onMouseEnter={() => setCursorType('button')}
                            onMouseLeave={() => setCursorType('default')}
                         >
                             {isSaving ? (
                                 "Syncing..."
                             ) : saveSuccess ? (
                                 <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Synced
                                 </>
                             ) : (
                                 <>
                                     <Save className="w-4 h-4" />
                                     Commit Changes
                                 </>
                             )}
                         </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
