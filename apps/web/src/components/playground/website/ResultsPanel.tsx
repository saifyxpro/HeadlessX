import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowDown01Icon,
    ArrowUp01Icon,
    Cancel01Icon,
    CheckmarkCircle02Icon,
    CodeSquareIcon,
    Copy01Icon,
    Download01Icon,
    Loading03Icon,
    Search01Icon,
    SourceCodeSquareIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
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
        if (!contentRef.current) return;
        
        const checkHeight = () => {
            if (contentRef.current) {
                // Determine if the *actual* height is significantly more than our restricted height (600px)
                setCanExpand(contentRef.current.scrollHeight > 650); 
            }
        };

        checkHeight();
        
        // Wait for markdown render and images
        const timeout = setTimeout(checkHeight, 200);
        
        // Listen for content size changes
        const observer = new ResizeObserver(() => checkHeight());
        observer.observe(contentRef.current);
        
        return () => {
            clearTimeout(timeout);
            observer.disconnect();
        };
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
        } else if (result.type === 'image') {
            const link = document.createElement('a');
            link.href = result.data as string;
            link.download = `download-${Date.now()}.png`;
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
        <div className="relative flex h-full min-h-[600px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white lg:col-span-8">

            {/* Terminal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-400 shadow-sm" />
                        <div className="w-3 h-3 rounded-full bg-amber-400 shadow-sm" />
                        <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm" />
                    </div>
                    <div className="h-5 w-px bg-slate-200/50" />
                    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white/50 border border-white/60 text-xs font-bold text-slate-600 shadow-sm">
                        <HugeiconsIcon icon={SourceCodeSquareIcon} className="w-3.5 h-3.5 text-slate-400" />
                        <span>Scrape Results</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {result && !['error', 'image'].includes(result.type) && canExpand && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/50 hover:bg-white text-slate-600 text-xs font-bold transition-all border border-transparent hover:border-slate-200"
                        >
                            {expanded ? (
                                <><HugeiconsIcon icon={ArrowUp01Icon} className="w-3.5 h-3.5" /> Collapse</>
                            ) : (
                                <><HugeiconsIcon icon={ArrowDown01Icon} className="w-3.5 h-3.5" /> Expand</>
                            )}
                        </button>
                    )}

                    {result && !['error'].includes(result.type) && (
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100/80 text-xs font-bold transition-colors border border-emerald-100"
                        >
                            <HugeiconsIcon icon={Download01Icon} className="w-3.5 h-3.5" />
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
                            <HugeiconsIcon icon={CodeSquareIcon} className="w-3.5 h-3.5" />
                            {viewRaw ? 'Preview' : 'Raw'}
                        </button>
                    )}

                    {showCopy && (
                        <button
                            onClick={handleCopy}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors"
                        >
                            {copied ? (
                                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-4 h-4 text-emerald-500" />
                            ) : (
                                <HugeiconsIcon icon={Copy01Icon} className="w-4 h-4" />
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="relative flex-1 overflow-hidden bg-white">
                {/* Empty State / Loading */}
                {(!result && !isStreaming && !isPending) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-white/40 backdrop-blur-sm z-10">
                        <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-white to-slate-50 shadow-xl border border-white flex items-center justify-center mb-6">
                            <HugeiconsIcon icon={Search01Icon} className="w-10 h-10 text-slate-300" />
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
                                                {step.status === 'active' ? <HugeiconsIcon icon={Loading03Icon} className="w-4 h-4 animate-spin" /> :
                                                    step.status === 'completed' ? <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-4 h-4" /> : step.step}
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
                                    <HugeiconsIcon icon={Loading03Icon} className="w-6 h-6 animate-spin text-slate-300" />
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
                                    <HugeiconsIcon icon={Cancel01Icon} className="w-10 h-10 text-red-500" />
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
                                            <div className="prose prose-slate prose-sm max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600 hover:prose-a:text-blue-700 prose-code:text-rose-500 prose-code:bg-rose-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-pre:bg-slate-900 prose-pre:text-slate-50 prose-pre:shadow-sm prose-img:rounded-xl">
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
