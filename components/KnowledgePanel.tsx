
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Link as LinkIcon, StickyNote, Plus, UploadCloud, Globe, X, Loader2, Eye, ChevronDown, Database, HardDrive, Maximize2 } from 'lucide-react';
import { useCursor } from '../context/CursorContext';
import { KnowledgeNode } from '../types';
import { api } from '../api';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const KnowledgePanel: React.FC = () => {
  const { setCursorType } = useCursor();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'docs' | 'web'>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeNode[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [urlInput, setUrlInput] = useState('');
  const [previewDoc, setPreviewDoc] = useState<KnowledgeNode | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState('Personal Vault');

  // Calculate dynamic line count for the previewer
  const lineCount = useMemo(() => {
    if (!previewDoc?.fullContent) return 50;
    return previewDoc.fullContent.split('\n').length + 5; // Add buffer
  }, [previewDoc]);

  // Real-time Fetch from Supabase
  const fetchKnowledge = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
        const { data, error } = await supabase
            .from('documents')
            .select('id, content, metadata, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Grouping logic for clean UI
        const uniqueDocs = new Map<string, KnowledgeNode>();
        data?.forEach((row: any) => {
            const detectedType = row.metadata?.type === 'url' ? 'url' : 'document';
            const source = row.metadata?.source || 'Untitled Node';
            
            if (!uniqueDocs.has(source)) {
                uniqueDocs.set(source, {
                    id: row.id.toString(),
                    title: source,
                    type: detectedType,
                    date: new Date(row.created_at).toLocaleDateString(),
                    tags: row.metadata?.tags || ['Imported'],
                    status: 'synced',
                    size: row.metadata?.size || '4KB',
                    fullContent: row.content
                });
            }
        });
        setKnowledgeBase(Array.from(uniqueDocs.values()));
    } catch (err) {
        console.error("Fetch Error:", err);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, [user]);

  // Listen for custom events from ChatInterface
  useEffect(() => {
    const handleOpenPreview = (event: Event) => {
        const customEvent = event as CustomEvent;
        const titleToFind = customEvent.detail.title;
        const found = knowledgeBase.find(n => n.title === titleToFind || n.title.includes(titleToFind));
        if (found) {
            setPreviewDoc(found);
        }
    };

    window.addEventListener('open-doc-preview', handleOpenPreview);
    return () => window.removeEventListener('open-doc-preview', handleOpenPreview);
  }, [knowledgeBase]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="w-4 h-4" />;
      case 'url': return <Globe className="w-4 h-4" />; 
      case 'note': return <StickyNote className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'synced': return 'bg-emerald-500';
        case 'syncing': return 'bg-amber-500';
        case 'error': return 'bg-red-500';
        default: return 'bg-zinc-500';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      setIsUploading(true);
      try {
          await api.upload(file);
          await fetchKnowledge(); 
          setIsUploadModalOpen(false);
      } catch (err) {
          console.error(err);
          alert('Upload failed');
      } finally {
          setIsUploading(false);
      }
  };

  const handleUrlSubmit = async () => {
      if (!urlInput) return;
      setIsUploading(true);
      try {
          await api.crawl(urlInput);
          await fetchKnowledge(); 
          setIsUrlModalOpen(false);
          setUrlInput('');
      } catch (err) {
          console.error(err);
          alert('Crawl failed');
      } finally {
          setIsUploading(false);
      }
  };

  return (
    <div className="h-full flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl relative">
      
      {/* Workspace Selector */}
      <div className="px-6 pt-6 pb-2">
         <div className="relative group">
            <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-[0.2em] block mb-1">Active Sector</span>
            <select 
                value={activeWorkspace}
                onChange={(e) => setActiveWorkspace(e.target.value)}
                className="w-full appearance-none bg-transparent text-sm font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer outline-none py-1 pr-6 hover:text-indigo-400 transition-colors"
            >
                <option>Personal Vault</option>
                <option>Engineering Team</option>
                <option>Finance Records</option>
            </select>
            <ChevronDown className="absolute right-0 bottom-1.5 w-4 h-4 text-zinc-400 pointer-events-none" />
         </div>
      </div>

      {/* Header Actions */}
      <div className="px-6 py-4">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Knowledge Base</h2>
            <div className="flex gap-2">
                <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsUrlModalOpen(true)}
                    onMouseEnter={() => setCursorType('button')}
                    onMouseLeave={() => setCursorType('default')}
                    className="p-2 rounded-md bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border border-zinc-200 dark:border-zinc-800"
                >
                    <Globe className="w-4 h-4" />
                </motion.button>
                <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsUploadModalOpen(true)}
                    onMouseEnter={() => setCursorType('button')}
                    onMouseLeave={() => setCursorType('default')}
                    className="p-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                >
                    <Plus className="w-4 h-4" />
                </motion.button>
            </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">
            {['all', 'docs', 'web'].map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`text-[11px] font-medium uppercase tracking-wider transition-colors relative pb-2 ${
                        activeTab === tab 
                        ? 'text-indigo-600 dark:text-indigo-400' 
                        : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                    }`}
                >
                    {tab}
                    {activeTab === tab && (
                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                    )}
                </button>
            ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2">
        {isLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="w-5 h-5 animate-spin text-zinc-400" /></div>
        ) : (
            knowledgeBase
                .filter(k => activeTab === 'all' || (activeTab === 'web' && k.type === 'url') || (activeTab === 'docs' && k.type === 'document'))
                .map((node, i) => (
                <motion.div
                    key={node.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setPreviewDoc(node)}
                    className="group relative p-3 rounded-lg border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 bg-transparent hover:bg-white dark:hover:bg-zinc-900 transition-all duration-200 cursor-pointer"
                    onMouseEnter={() => setCursorType('button')}
                    onMouseLeave={() => setCursorType('default')}
                >
                    <div className="flex items-start gap-3">
                        <div className="mt-1 text-zinc-400 dark:text-zinc-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                            {getIcon(node.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate pr-2">
                                    {node.title}
                                </h3>
                                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${getStatusColor(node.status)} shadow-[0_0_5px_currentColor]`} />
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-zinc-500 font-mono">{node.date}</span>
                                {node.size && (
                                    <>
                                        <span className="text-[10px] text-zinc-300 dark:text-zinc-700">•</span>
                                        <span className="text-[10px] text-zinc-500 font-mono">{node.size}</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="w-4 h-4 text-zinc-400" />
                        </div>
                    </div>
                </motion.div>
            ))
        )}
      </div>

      {/* Professional Doc Inspector Drawer */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
            {previewDoc && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setPreviewDoc(null)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                    />
                    <motion.div 
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                        className="fixed top-0 right-0 bottom-0 w-full md:w-[75vw] lg:w-[60vw] bg-zinc-950 z-[9999] shadow-2xl border-l border-zinc-800 flex flex-col"
                    >
                        {/* Toolbar */}
                        <div className="h-16 border-b border-zinc-800 flex justify-between items-center px-8 bg-zinc-950/90 backdrop-blur-md shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-zinc-900 rounded border border-zinc-800 text-indigo-500">
                                    {getIcon(previewDoc.type)}
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider truncate max-w-[400px]">{previewDoc.title}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-500 font-mono">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                            Synced
                                        </span>
                                        <span className="text-[10px] text-zinc-500 font-mono">ID: {previewDoc.id.slice(0,8)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setPreviewDoc(null)} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-zinc-400 transition-colors"><X className="w-5 h-5"/></button>
                            </div>
                        </div>

                        <div className="flex-1 flex overflow-hidden">
                            {/* Main Content Viewer */}
                            <div className="flex-1 bg-zinc-900/50 overflow-y-auto relative custom-scrollbar">
                                <div className="min-h-full p-10 md:p-16">
                                    <div className="max-w-4xl mx-auto bg-zinc-950 border border-zinc-800 shadow-2xl min-h-[1000px] p-12 relative">
                                        {/* Paper texture */}
                                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
                                        
                                        <div className="relative font-mono text-sm text-zinc-300 leading-loose">
                                            {/* Line Numbers - Dynamic */}
                                            <div className="absolute left-0 top-0 bottom-0 w-10 border-r border-zinc-900 bg-zinc-900/50 flex flex-col items-center pt-0 text-[10px] text-zinc-700 font-mono gap-0 select-none">
                                                {/* We just simulate padding top to match text */}
                                                <div className="h-0" />
                                                {Array.from({length: lineCount}).map((_, i) => (
                                                    <div key={i} className="h-8 flex items-center justify-center w-full">{i+1}</div>
                                                ))}
                                            </div>
                                            
                                            {/* Content Area with matching line height */}
                                            <div className="pl-12 whitespace-pre-wrap break-words">
                                                {previewDoc.fullContent ? (
                                                     previewDoc.fullContent.split('\n').map((line, i) => (
                                                        <div key={i} className="min-h-[2rem] flex items-center">{line || ' '}</div>
                                                     ))
                                                ) : (
                                                    <span className="text-zinc-600 italic">Content extracted. Rendering text stream...</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Metadata Sidebar (Right Side) */}
                            <div className="w-72 border-l border-zinc-800 bg-zinc-950 p-8 space-y-8 hidden lg:block overflow-y-auto">
                                <div>
                                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Database className="w-3.5 h-3.5" /> File Properties
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="pb-3 border-b border-zinc-900">
                                            <span className="text-[10px] text-zinc-600 block mb-1">File Size</span>
                                            <span className="text-sm font-mono text-zinc-300">{previewDoc.size}</span>
                                        </div>
                                        <div className="pb-3 border-b border-zinc-900">
                                            <span className="text-[10px] text-zinc-600 block mb-1">Ingested</span>
                                            <span className="text-sm font-mono text-zinc-300">{previewDoc.date}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-zinc-600 block mb-1">Hash</span>
                                            <span className="text-[10px] font-mono text-zinc-500 break-all">{previewDoc.id}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <HardDrive className="w-3.5 h-3.5" /> Semantic Tags
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {previewDoc.tags.map(tag => (
                                            <span key={tag} className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-[10px] text-zinc-400 font-mono hover:border-indigo-500 transition-colors cursor-pointer">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
      )}

      {/* Upload Modal (Kept same style) */}
      <AnimatePresence>
        {isUploadModalOpen && (
            <div className="absolute inset-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm flex items-center justify-center p-6">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full h-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl flex flex-col items-center justify-center text-center relative"
                >
                    <button 
                        onClick={() => setIsUploadModalOpen(false)}
                        className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-4">
                        {isUploading ? <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /> : <UploadCloud className="w-8 h-8 text-indigo-500" />}
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                        {isUploading ? 'Ingesting Document...' : 'Drop files here'}
                    </h3>
                    <p className="text-sm text-zinc-500 mt-2 mb-6 max-w-[200px]">
                        Support for PDF, TXT, MD, CSV. Max 50MB.
                    </p>
                    <label className="px-6 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:scale-105 transition-transform cursor-pointer">
                        Browse Files
                        <input type="file" className="hidden" onChange={handleFileUpload} />
                    </label>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

       {/* URL Modal (Kept same style) */}
       <AnimatePresence>
        {isUrlModalOpen && (
            <div className="absolute inset-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm flex items-center justify-center p-6">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-sm"
                >
                     <button 
                        onClick={() => setIsUrlModalOpen(false)}
                        className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Add Web Source</h3>
                    <input 
                        type="text"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://example.com/docs..."
                        className="w-full bg-transparent border-b border-zinc-300 dark:border-zinc-700 py-2 text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:outline-none mb-6"
                    />
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setIsUrlModalOpen(false)}
                            className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleUrlSubmit}
                            disabled={isUploading}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium shadow-lg shadow-indigo-500/20 flex items-center justify-center"
                        >
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crawl'}
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};
