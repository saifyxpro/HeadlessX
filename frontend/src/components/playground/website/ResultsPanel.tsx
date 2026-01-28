import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Terminal, ChevronUp, ChevronDown, Download, Copy, Check, Code,
    Search, XCircle, Loader2, FileDown, AlertCircle
} from 'lucide-react';
import { ScrapeResult, ProgressStep } from './types';

interface ResultsPanelProps {
    result: ScrapeResult | null;
    isStreaming: boolean;
    isPending: boolean;
    steps: ProgressStep[];
    elapsedTime: number | null;
    onRetry: () => void;
}

export function ResultsPanel({
    result,
    isStreaming,
    isPending,
    steps,
    elapsedTime,
    onRetry
}: ResultsPanelProps) {
    const [expanded, setExpanded] = useState(false);
    const [viewRaw, setViewRaw] = useState(false);
    const [copied, setCopied] = useState(false);
    const [canExpand, setCanExpand] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null); // Ref for measuring content height

    // Check content height to determine if expand button is needed
    useEffect(() => {
        if (contentRef.current) {
            setCanExpand(contentRef.current.scrollHeight > 600);
        }
    }, [result, viewRaw]);

    // Auto-scroll steps
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [steps]);

    const handleCopy = () => {
        if (result && typeof result.data === 'object') {
            let text: string;
            if (result.type === 'html-css-js') {
                const data = result.data as any;
                text = JSON.stringify({
                    html: data.html,
                    styles: data.styles,
                    scripts: data.scripts,
                    inlineStyles: data.inlineStyles,
                    inlineScripts: data.inlineScripts
                }, null, 2);
            } else {
                const data = result.data as any;
                text = data.html || data.markdown || '';
            }
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownload = () => {
        if (!result) return;

        let content: string;
        let filename: string;
        let mimeType: string;

        // Simplified download logic for brevity
        if (result.type === 'html' || result.type === 'html-js') {
            const data = result.data as any;
            content = data.html || '';
            filename = `scrape-${new Date().toISOString().slice(0, 10)}.html`;
            mimeType = 'text/html';
        } else if (result.type === 'content') {
            const data = result.data as any;
            content = data.markdown || '';
            filename = `scrape-${new Date().toISOString().slice(0, 10)}.md`;
            mimeType = 'text/markdown';
        } else if (result.type === 'image' || result.type === 'pdf') {
            const link = document.createElement('a');
            link.href = result.data as string;
            link.download = `download-${Date.now()}.${result.type === 'pdf' ? 'pdf' : 'png'}`;
            link.click();
            return;
        } else {
            return;
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const showViewToggle = result?.type === 'html' || result?.type === 'html-js' || result?.type === 'content';
    const showCopy = showViewToggle || result?.type === 'html-css-js';

    return (
        <div className="lg:col-span-8 flex flex-col bg-white/60 backdrop-blur-xl rounded-[24px] border border-white/60 shadow-premium overflow-hidden min-h-[500px] relative">

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
                        <span>Console Output</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {result && !['error', 'image', 'pdf'].includes(result.type) && canExpand && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/50 hover:bg-white text-slate-600 text-xs font-bold transition-all border border-transparent hover:border-slate-200"
                        >
                            {expanded ? (
                                <><ChevronUp className="w-3.5 h-3.5" /> Collapse</>
                            ) : (
                                <><ChevronDown className="w-3.5 h-3.5" /> Expand</>
                            )}
                        </button>
                    )}

                    {result && !['error'].includes(result.type) && (
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100/80 text-xs font-bold transition-colors border border-emerald-100"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Save
                        </button>
                    )}

                    {showViewToggle && (
                        <button
                            onClick={() => setViewRaw(!viewRaw)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${viewRaw
                                ? 'bg-slate-800 text-white border-slate-900 shadow-lg shadow-slate-900/10'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            <Code className="w-3.5 h-3.5" />
                            {viewRaw ? 'Preview' : 'Raw'}
                        </button>
                    )}

                    {showCopy && (
                        <button
                            onClick={handleCopy}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative bg-white/30">
                {/* Empty State / Loading */}
                {(!result && !isStreaming && !isPending) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-white/40 backdrop-blur-sm z-10">
                        <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-white to-slate-50 shadow-xl border border-white flex items-center justify-center mb-6">
                            <Search className="w-10 h-10 text-slate-300" />
                        </div>
                        <p className="font-bold text-slate-600 text-lg mb-2">Ready to Scrape</p>
                        <p className="text-sm text-slate-400 max-w-xs text-center leading-relaxed">
                            Configure your parameters on the left and start the extraction process.
                        </p>
                    </div>
                )}

                {/* Loading / Progress Steps */}
                {(isPending || isStreaming) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-20">
                        {/* Dynamic Background Removed */}

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

                {/* Results Display */}
                {result && !isStreaming && !isPending && (
                    <div className="absolute inset-0 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent bg-white/40">
                        {/* Error View */}
                        {result.type === 'error' && (
                            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                                <div className="w-20 h-20 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-6 shadow-xl shadow-red-500/10">
                                    <XCircle className="w-10 h-10 text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Extraction Failed</h3>
                                <p className="text-slate-500 max-w-sm mx-auto mb-8 leading-relaxed">
                                    {typeof result.data === 'string' ? result.data : 'An unknown error occurred'}
                                </p>
                                <button onClick={onRetry} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl">
                                    Try Again
                                </button>
                            </div>
                        )}

                        {/* Image View */}
                        {result.type === 'image' && (
                            <div className="p-8 flex flex-col items-center min-h-full justify-center">
                                <div className="relative rounded-2xl overflow-hidden border-[6px] border-white shadow-2xl max-w-full">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={result.data as string} alt="Screenshot" className="max-w-full h-auto block" />
                                </div>
                            </div>
                        )}

                        {/* PDF View */}
                        {result.type === 'pdf' && (
                            <div className="h-full flex flex-col items-center justify-center">
                                <FileDown className="w-24 h-24 text-slate-300 mb-6" />
                                <p className="text-lg font-bold text-slate-600">PDF Ready</p>
                            </div>
                        )}

                        {/* HTML / Code View */}
                        {(result.type === 'html' || result.type === 'html-js' || result.type === 'content') && typeof result.data === 'object' && (
                            <div className="min-h-full">
                                {viewRaw ? (
                                    <pre
                                        ref={contentRef as any}
                                        className={`p-6 text-xs font-mono text-slate-600 leading-relaxed overflow-x-auto whitespace-pre-wrap break-all ${expanded ? '' : 'max-h-[600px] overflow-hidden'}`}
                                    >
                                        {result.type === 'content' ? (result.data as any).markdown : (result.data as any).html}
                                    </pre>
                                ) : (
                                    <div
                                        ref={contentRef}
                                        className={`p-6 ${expanded ? '' : 'max-h-[600px] overflow-hidden'}`}
                                    >
                                        {result.type === 'content' ? (
                                            <div className="prose prose-slate prose-sm max-w-none">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{(result.data as any).markdown}</ReactMarkdown>
                                            </div>
                                        ) : (
                                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm h-[600px]">
                                                <iframe
                                                    srcDoc={(result.data as any).html}
                                                    title="Preview"
                                                    className="w-full h-full"
                                                    sandbox="allow-same-origin"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

}
