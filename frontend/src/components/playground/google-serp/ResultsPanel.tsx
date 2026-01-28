
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Terminal, Download, Copy, Check, Code,
    Search, XCircle, Loader2, FileText, FileJson
} from 'lucide-react';
import { SearchResponse, ProgressStep } from './types';

interface ResultsPanelProps {
    data: SearchResponse | null;
    isStreaming: boolean;
    isPending: boolean;
    error: string | null;
    steps: ProgressStep[];
    elapsedTime: number | null;
    onRetry: () => void;
}

export function ResultsPanel({
    data,
    isStreaming,
    isPending,
    error,
    steps,
    elapsedTime,
    onRetry
}: ResultsPanelProps) {
    const [viewMode, setViewMode] = useState<'visual' | 'raw' | 'json'>('visual');
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!data) return;
        const text = viewMode === 'json' ? JSON.stringify(data.results, null, 2) : data.markdown;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!data) return;
        const isJson = viewMode === 'json';
        const content = isJson ? JSON.stringify(data.results, null, 2) : data.markdown;
        const mimeType = isJson ? 'application/json' : 'text/markdown';
        const extension = isJson ? 'json' : 'md';
        const filename = `google-serp-${new Date().toISOString().slice(0, 10)}.${extension}`;

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="lg:col-span-8 flex flex-col bg-white/60 backdrop-blur-xl rounded-[24px] border border-white/60 shadow-premium overflow-hidden min-h-[600px] h-full relative">

            {/* Terminal Header */}
            <div className="px-6 py-4 border-b border-white/40 bg-white/40 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-400 shadow-sm" />
                        <div className="w-3 h-3 rounded-full bg-amber-400 shadow-sm" />
                        <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm" />
                    </div>
                    <div className="h-5 w-px bg-slate-200/50" />
                    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white/50 border border-white/60 text-xs font-bold text-slate-600 shadow-sm">
                        <Terminal className="w-3.5 h-3.5 text-slate-400" />
                        <span>Search Results</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Toggles */}
                    {data && (
                        <div className="flex items-center gap-1 bg-white/40 p-1 rounded-lg border border-slate-200/50 mr-2">
                            <button
                                onClick={() => setViewMode('visual')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'visual' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Visual Report"
                            >
                                <FileText className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('raw')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'raw' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Raw Markdown"
                            >
                                <Code className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('json')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'json' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                title="JSON Data"
                            >
                                <FileJson className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {data && (
                        <>
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100/80 text-xs font-bold transition-colors border border-emerald-100"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Save
                            </button>
                            <button
                                onClick={handleCopy}
                                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative bg-white/30">
                {/* Empty State */}
                {(!data && !isStreaming && !isPending && !error) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-white/40 backdrop-blur-sm z-10">
                        <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-white to-slate-50 shadow-xl border border-white flex items-center justify-center mb-6">
                            <Search className="w-10 h-10 text-slate-300" />
                        </div>
                        <p className="font-bold text-slate-600 text-lg mb-2">Ready to Search</p>
                        <p className="text-sm text-slate-400 max-w-xs text-center leading-relaxed">
                            Enter a query on the left to start scraping Google SERP results.
                        </p>
                    </div>
                )}

                {/* Loading / Progress Steps */}
                {(isPending || isStreaming) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-20">
                        <div className="relative z-10 w-full max-w-md">
                            <AnimatePresence mode="popLayout" initial={false}>
                                {steps.filter(s => s.status !== 'pending').map((step) => (
                                    <motion.div
                                        layout
                                        key={step.step}
                                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                        animate={{
                                            opacity: step.status === 'completed' ? 0.7 : 1,
                                            y: 0,
                                            scale: step.status === 'completed' ? 0.95 : 1,
                                        }}
                                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                        className="flex gap-4 group items-center justify-center py-1"
                                    >
                                        <div className="relative flex flex-col items-center">
                                            <div className={`
                                                w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border-2 z-10 bg-white transition-all duration-300
                                                ${step.status === 'active' ? 'border-blue-500 text-blue-600 shadow-blue-200 scale-110' :
                                                    step.status === 'completed' ? 'border-emerald-500 text-emerald-600 bg-emerald-50' :
                                                        step.status === 'error' ? 'border-red-500 text-red-600' :
                                                            'border-slate-200 text-slate-400'}
                                            `}>
                                                {step.status === 'active' ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                                    step.status === 'completed' ? <Check className="w-4 h-4" /> : step.step}
                                            </div>
                                        </div>
                                        <div className="w-[280px]">
                                            <p className={`transition-colors duration-300 ${step.status === 'error'
                                                ? 'text-red-500 whitespace-pre-wrap break-words text-xs font-mono bg-red-50 p-2 rounded border border-red-100'
                                                : `text-base font-bold whitespace-nowrap overflow-hidden text-ellipsis ${step.status === 'active' ? 'text-slate-800' : 'text-slate-400'}`
                                                }`}>
                                                {step.message}
                                            </p>
                                            {step.status === 'active' && (
                                                <motion.div
                                                    initial={{ opacity: 0, width: 0 }}
                                                    animate={{ opacity: 1, width: "100%" }}
                                                    className="h-1 bg-blue-100 rounded-full mt-1.5 overflow-hidden"
                                                >
                                                    <motion.div
                                                        animate={{ x: ["-100%", "100%"] }}
                                                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                                        className="h-full w-1/2 bg-blue-500 rounded-full"
                                                    />
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* Waiting for worker spinner - Matching Website Scraper */}
                            {steps.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center text-slate-400 text-sm gap-3 opacity-60 absolute inset-0"
                                >
                                    <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                                    <span>Waiting for worker...</span>
                                </motion.div>
                            )}
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white/40 backdrop-blur-sm z-10">
                        <div className="w-20 h-20 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-6 shadow-xl shadow-red-500/10">
                            <XCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Search Failed</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mb-8 leading-relaxed">
                            {error}
                        </p>
                    </div>
                )}

                {/* Results Display */}
                {data && !isStreaming && !isPending && !error && (
                    <div className="absolute inset-0 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent bg-white/40">
                        <div className="min-h-full">
                            {viewMode === 'visual' ? (
                                <div
                                    className="p-8 prose prose-slate prose-sm max-w-none"
                                >
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            h1: ({ children }) => <h1 className="text-2xl font-bold text-slate-900 mt-6 mb-4 pb-2 border-b border-slate-200 first:mt-0">{children}</h1>,
                                            h2: ({ children }) => <h2 className="text-xl font-bold text-slate-800 mt-5 mb-3">{children}</h2>,
                                            h3: ({ children }) => <h3 className="text-lg font-semibold text-slate-800 mt-4 mb-2">{children}</h3>,
                                            a: ({ href, children }) => <a href={href} className="text-blue-600 hover:text-blue-700 underline break-words" target="_blank" rel="noopener noreferrer">{children}</a>,
                                            blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-slate-500 my-4 bg-slate-50 p-2 rounded-r">{children}</blockquote>,
                                            code: ({ className, children }) => {
                                                const isInline = !className;
                                                return isInline ? (
                                                    <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                                                ) : (
                                                    <code className="block bg-slate-900 text-slate-100 p-4 rounded-lg text-sm font-mono overflow-x-auto my-4">{children}</code>
                                                );
                                            },
                                        }}
                                    >
                                        {data.markdown}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <pre
                                    className="p-6 text-xs font-mono text-slate-600 leading-relaxed overflow-x-auto whitespace-pre-wrap break-all"
                                >
                                    {viewMode === 'json' ? JSON.stringify(data.results, null, 2) : data.markdown}
                                </pre>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
