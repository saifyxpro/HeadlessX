'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    Globe, Code, FileText, Image as ImageIcon, FileDown, ChevronDown, ChevronUp,
    Zap, ArrowLeft, Sparkles, Loader2, CheckCircle2, Search, Target,
    XCircle, Copy, Check, Download, Clock, Terminal, Eye, ExternalLink, User, Square, AlertCircle
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery } from '@tanstack/react-query';

// Custom Loading Animation Component
const LoadingAnimation = ({ progress }: { progress: number }) => (
    <div className="relative w-full h-full">
        <svg
            viewBox="0 0 240 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            aria-label={`Loading progress: ${Math.round(progress)}%`}
        >
            <title>Loading Progress Indicator</title>
            <defs>
                <mask id="progress-mask">
                    <rect width="240" height="240" fill="black" />
                    <circle
                        r="120"
                        cx="120"
                        cy="120"
                        fill="white"
                        strokeDasharray={`${(progress / 100) * 754}, 754`}
                        transform="rotate(-90 120 120)"
                        style={{ transition: 'stroke-dasharray 0.5s ease-out' }}
                    />
                </mask>
            </defs>
            <style>
                {`
                    @keyframes rotate-cw {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    @keyframes rotate-ccw {
                        from { transform: rotate(360deg); }
                        to { transform: rotate(0deg); }
                    }
                    .g-spin circle {
                        transform-origin: 120px 120px;
                    }
                    .g-spin circle:nth-child(1) { animation: rotate-cw 8s linear infinite; }
                    .g-spin circle:nth-child(2) { animation: rotate-ccw 8s linear infinite; }
                    .g-spin circle:nth-child(3) { animation: rotate-cw 8s linear infinite; }
                    .g-spin circle:nth-child(4) { animation: rotate-ccw 8s linear infinite; }
                    .g-spin circle:nth-child(5) { animation: rotate-cw 8s linear infinite; }
                    .g-spin circle:nth-child(6) { animation: rotate-ccw 8s linear infinite; }

                    .g-spin circle:nth-child(2n) { animation-delay: 0.2s; }
                    .g-spin circle:nth-child(3n) { animation-delay: 0.3s; }
                `}
            </style>
            <g
                className="g-spin"
                strokeWidth="16"
                strokeDasharray="18% 40%"
                mask="url(#progress-mask)"
            >
                <circle r="150" cx="120" cy="120" stroke="#FF2E7E" opacity="0.95" />
                <circle r="130" cx="120" cy="120" stroke="#00E5FF" opacity="0.95" />
                <circle r="110" cx="120" cy="120" stroke="#4ADE80" opacity="0.95" />
                <circle r="90" cx="120" cy="120" stroke="#FFA726" opacity="0.95" />
                <circle r="70" cx="120" cy="120" stroke="#FFEB3B" opacity="0.95" />
                <circle r="50" cx="120" cy="120" stroke="#FF4081" opacity="0.95" />
            </g>
        </svg>
    </div>
);

// Custom Dropdown Component (non-native)
function CustomDropdown({
    value,
    onChange,
    options,
    placeholder = 'Select...',
    icon: Icon
}: {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string; suffix?: string }[];
    placeholder?: string;
    icon?: LucideIcon;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(o => o.value === value);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full ${Icon ? 'pl-11' : 'pl-4'} pr-10 py-3.5 bg-white border-2 border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer hover:border-slate-300 text-left`}
            >
                {Icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Icon className="w-4 h-4 text-slate-400" />
                    </div>
                )}
                <span className={selectedOption ? 'text-slate-900' : 'text-slate-400'}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                {selectedOption?.suffix && (
                    <span className="ml-1 text-emerald-500">{selectedOption.suffix}</span>
                )}
            </button>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
                    <div className="absolute left-0 right-0 z-[9999] mt-2 py-2 bg-white border-2 border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-auto" style={{ top: '100%' }}>
                        {options.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors flex items-center justify-between ${value === opt.value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-700'
                                    }`}
                            >
                                <span>{opt.label}</span>
                                {opt.suffix && <span className="text-emerald-500 text-sm">{opt.suffix}</span>}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// Types
type OutputType = 'html' | 'html-js' | 'html-css-js' | 'content' | 'screenshot' | 'pdf';

interface ScrapeResult {
    type: 'html' | 'html-js' | 'html-css-js' | 'content' | 'image' | 'pdf' | 'error';
    data: string | {
        html?: string;
        markdown?: string;
        title?: string;
        styles?: string[];
        scripts?: string[];
        inlineStyles?: string;
        inlineScripts?: string;
    };
}

// Progress step from backend SSE
interface ProgressStep {
    step: number;
    total: number;
    message: string;
    status: 'pending' | 'active' | 'completed' | 'error';
}

const OUTPUT_TYPES: { id: OutputType; label: string; icon: LucideIcon }[] = [
    { id: 'html', label: 'HTML', icon: Code },
    { id: 'html-js', label: 'HTML + JS', icon: Zap },
    { id: 'html-css-js', label: 'HTML + CSS + JS', icon: Sparkles },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'screenshot', label: 'Screenshot', icon: ImageIcon },
    { id: 'pdf', label: 'PDF', icon: FileDown },
];

// Profile type
interface Profile {
    id: string;
    name: string;
    is_running: boolean;
    screen_width: number;
    screen_height: number;
    locale: string;
}

// Fetch profiles
const fetchProfiles = async () => {
    const res = await fetch('/api/profiles', {
        headers: { 'x-api-key': 'dashboard-internal' }
    });
    return res.json();
};

export default function WebsiteScraperPage() {
    const searchParams = useSearchParams();
    const initialUrl = searchParams.get('url') || 'https://example.com';
    const [url, setUrl] = useState(initialUrl);
    const [outputType, setOutputType] = useState<OutputType>('html');
    const [selector, setSelector] = useState('');
    const [timeout, setTimeoutValue] = useState(30000);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [copied, setCopied] = useState(false);
    const [result, setResult] = useState<ScrapeResult | null>(null);
    const [elapsedTime, setElapsedTime] = useState<number | null>(null);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [expanded, setExpanded] = useState(false);
    const [viewRaw, setViewRaw] = useState(false);
    const [selectedProfileId, setSelectedProfileId] = useState<string>('');
    const [steps, setSteps] = useState<ProgressStep[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll steps
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [steps]);

    // Fetch profiles
    const { data: profilesData } = useQuery({
        queryKey: ['profiles'],
        queryFn: fetchProfiles,
        refetchInterval: 5000,
    });
    const profiles: Profile[] = profilesData?.profiles || [];

    // Timer for elapsed time during scraping
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (startTime) {
            interval = setInterval(() => {
                setElapsedTime(Date.now() - startTime);
            }, 100);
        }
        return () => clearInterval(interval);
    }, [startTime]);

    // Store current job ID
    const currentJobIdRef = useRef<string | null>(null);

    // Check for active jobs on page load and reconnect
    useEffect(() => {
        const checkAndReconnect = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/jobs/active');
                const data = await response.json();

                if (data.active && data.job) {
                    console.log('🔄 Found active job, reconnecting...', data.job.id);
                    currentJobIdRef.current = data.job.id;
                    setUrl(data.job.url);
                    setIsStreaming(true);
                    setStartTime(data.job.createdAt);

                    // Restore progress steps
                    if (data.job.progress && data.job.progress.length > 0) {
                        const restoredSteps = data.job.progress.map((p: any) => ({
                            label: p.message,
                            status: p.status
                        }));
                        setSteps(restoredSteps);
                    }

                    // Reconnect to SSE stream
                    reconnectToJob(data.job.id);
                }
            } catch (error) {
                console.error('Failed to check for active jobs:', error);
            }
        };

        checkAndReconnect();
    }, []);

    // Reconnect to an existing job's SSE stream
    const reconnectToJob = async (jobId: string) => {
        abortControllerRef.current = new AbortController();

        try {
            const response = await fetch(`http://localhost:3001/api/jobs/${jobId}/stream`, {
                signal: abortControllerRef.current.signal
            });

            if (!response.ok || !response.body) {
                throw new Error('Failed to reconnect to job stream');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                let currentEvent = '';
                for (const line of lines) {
                    if (line.startsWith('event:')) {
                        currentEvent = line.slice(6).trim();
                    } else if (line.startsWith('data:') && currentEvent) {
                        try {
                            const data = JSON.parse(line.slice(5).trim());
                            handleSSEEvent(currentEvent, data);
                        } catch (e) {
                            console.error('Failed to parse SSE data:', e);
                        }
                        currentEvent = '';
                    }
                }
            }

            setIsStreaming(false);
            setStartTime(null);
            abortControllerRef.current = null;
        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                console.log('Reconnection aborted');
                setIsStreaming(false);
                setStartTime(null);
                setResult({ type: 'error', data: 'Scrape cancelled by user' });
                abortControllerRef.current = null;
                return;
            }
            console.error('Reconnection error:', error);
            setIsStreaming(false);
            setStartTime(null);
            abortControllerRef.current = null;
        }
    };

    // Handle SSE events (shared between new scrape and reconnection)
    const handleSSEEvent = (event: string, data: any) => {
        switch (event) {
            case 'start':
                if (data.jobId) {
                    currentJobIdRef.current = data.jobId;
                }
                break;
            case 'reconnect':
                console.log('Reconnected to job:', data.jobId);
                break;
            case 'progress':
                setSteps(prev => {
                    const newSteps = [...prev];
                    const stepIndex = data.step - 1;

                    // Fill in any missing steps with pending state
                    while (newSteps.length <= stepIndex) {
                        newSteps.push({
                            step: newSteps.length + 1,
                            total: data.total || 5,
                            message: 'Pending...',
                            status: 'pending'
                        });
                    }

                    // Update the current step
                    newSteps[stepIndex] = {
                        step: data.step,
                        total: data.total,
                        message: data.message,
                        status: data.status
                    };
                    return newSteps;
                });
                break;
            case 'result':
                setResult(data);
                break;
            case 'error':
                setResult({ type: 'error', data: data.error || 'Unknown error' });
                break;
            case 'cancelled':
                setResult({ type: 'error', data: 'Scrape cancelled' });
                break;
            case 'done':
                setIsStreaming(false);
                setStartTime(null);
                currentJobIdRef.current = null;
                break;
        }
    };


    const handleCopy = () => {
        if (result && typeof result.data === 'object') {
            let text: string;
            if (result.type === 'html-css-js') {
                // Copy as JSON for html-css-js
                text = JSON.stringify({
                    html: result.data.html,
                    styles: result.data.styles,
                    scripts: result.data.scripts,
                    inlineStyles: result.data.inlineStyles,
                    inlineScripts: result.data.inlineScripts
                }, null, 2);
            } else {
                text = result.data.html || result.data.markdown || '';
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

        if (result.type === 'html' || result.type === 'html-js') {
            if (typeof result.data !== 'object') return;
            content = result.data.html || '';
            filename = `scrape-${new Date().toISOString().slice(0, 10)}.html`;
            mimeType = 'text/html';
        } else if (result.type === 'html-css-js') {
            if (typeof result.data !== 'object') return;
            // Create a JSON file with all resources
            content = JSON.stringify({
                html: result.data.html,
                title: result.data.title,
                styles: result.data.styles,
                scripts: result.data.scripts,
                inlineStyles: result.data.inlineStyles,
                inlineScripts: result.data.inlineScripts
            }, null, 2);
            filename = `scrape-full-${new Date().toISOString().slice(0, 10)}.json`;
            mimeType = 'application/json';
        } else if (result.type === 'content') {
            if (typeof result.data !== 'object') return;
            content = result.data.markdown || result.data.title || '';
            filename = `scrape-${new Date().toISOString().slice(0, 10)}.md`;
            mimeType = 'text/markdown';
        } else if (result.type === 'image') {
            if (typeof result.data !== 'string') return;
            const a = document.createElement('a');
            a.href = result.data;
            a.download = `screenshot-${new Date().toISOString().slice(0, 10)}.png`;
            a.click();
            return;
        } else if (result.type === 'pdf') {
            if (typeof result.data !== 'string') return;
            const a = document.createElement('a');
            a.href = result.data;
            a.download = `scrape-${new Date().toISOString().slice(0, 10)}.pdf`;
            a.click();
            return;
        } else {
            return;
        }

        const blob = new Blob([content], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(blobUrl);
    };

    // SSE Streaming scrape function
    const startStreamingScrape = async () => {
        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();

        setStartTime(Date.now());
        setElapsedTime(0);
        setResult(null);
        setSteps([]);
        setIsStreaming(true);
        setExpanded(false);

        try {
            // Call backend directly for SSE - Next.js proxy buffers SSE events
            const backendUrl = 'http://localhost:3001/api/website/stream';

            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'test-key-dashboard'
                },
                body: JSON.stringify({
                    url,
                    type: outputType,
                    profileId: selectedProfileId || undefined,
                    fullPage: outputType === 'screenshot' ? true : undefined,
                    options: {
                        waitForSelector: selector || undefined,
                        timeout: timeout
                    }
                }),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                // Try to parse as JSON error, fallback to text
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || errorData.error || 'Request failed');
                } catch {
                    const text = await response.text();
                    throw new Error(text || `Request failed with status ${response.status}`);
                }
            }

            // Check if response is SSE
            const contentType = response.headers.get('content-type');
            if (!contentType?.includes('text/event-stream')) {
                // Not SSE, try to parse as JSON (fallback to old behavior)
                const data = await response.json();
                setIsStreaming(false);
                setStartTime(null);
                if (data.error) {
                    setResult({ type: 'error', data: data.error.message || data.error });
                } else {
                    setResult({ type: outputType as 'html' | 'html-js' | 'content', data });
                }
                return;
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error('No response body');

            let buffer = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer

                let currentEvent = '';
                for (const line of lines) {
                    if (line.startsWith('event:')) {
                        currentEvent = line.slice(6).trim();
                    } else if (line.startsWith('data:') && currentEvent) {
                        try {
                            const data = JSON.parse(line.slice(5).trim());
                            console.log('SSE Event:', currentEvent, data);

                            // Handle result event specially for type mapping
                            if (currentEvent === 'result' && data.success && data.type) {
                                if (data.type === 'screenshot') {
                                    setResult({ type: 'image', data: data.data });
                                } else if (data.type === 'pdf') {
                                    setResult({ type: 'pdf', data: data.data });
                                } else {
                                    setResult({ type: data.type, data: data.data });
                                }
                            } else {
                                handleSSEEvent(currentEvent, data);
                            }
                        } catch (e) {
                            console.log('SSE parse error (likely incomplete):', line);
                        }
                        currentEvent = '';
                    }
                }
            }

            // Stream ended, make sure we exit streaming state
            setIsStreaming(false);
            setStartTime(null);
            abortControllerRef.current = null;
        } catch (error) {
            // Check if this was an abort
            if ((error as Error).name === 'AbortError') {
                console.log('Scrape aborted by user');
                setIsStreaming(false);
                setStartTime(null);
                setResult({ type: 'error', data: 'Scrape cancelled by user' });
                abortControllerRef.current = null;
                return;
            }
            console.error('SSE Error:', error);
            setIsStreaming(false);
            setStartTime(null);
            setResult({ type: 'error', data: `Connection error: ${(error as Error).message}` });
            abortControllerRef.current = null;
        }
    };

    // Stop the current scrape
    const stopScrape = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    };

    const scrapeMutation = useMutation({
        mutationFn: startStreamingScrape,
        onSuccess: () => { },
        onError: () => { }
    });

    return (
        <div className="relative min-h-full -m-8">
            {/* Background decoration */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full blur-3xl opacity-50" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-slate-100 to-blue-50 rounded-full blur-3xl opacity-50" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-50/30 via-transparent to-indigo-50/30 rounded-full blur-3xl" />
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6 animate-in fade-in duration-300">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/playground"
                            className="p-2.5 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm hover:bg-white hover:border-slate-300 text-slate-600 transition-all hover:-translate-x-0.5 shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                                <Globe className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">/playground/website</p>
                                <h1 className="text-xl font-bold text-slate-900">Website Scraper</h1>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Live Timer */}
                        {scrapeMutation.isPending && elapsedTime !== null && (
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-700 font-mono text-sm shadow-sm">
                                <Clock className="w-4 h-4 text-slate-500" />
                                {(elapsedTime / 1000).toFixed(1)}s
                            </div>
                        )}
                        {scrapeMutation.isPending && (
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium text-sm shadow-lg shadow-blue-500/25">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Scraping...
                            </div>
                        )}
                        {result?.type === 'error' && (
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 border border-red-100 text-red-700 font-medium text-sm">
                                <XCircle className="w-4 h-4" /> Failed
                            </div>
                        )}
                        {result && result.type !== 'error' && !scrapeMutation.isPending && (
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-medium text-sm">
                                <CheckCircle2 className="w-4 h-4" />
                                Success
                                {elapsedTime !== null && (
                                    <span className="text-emerald-500 font-mono">({(elapsedTime / 1000).toFixed(2)}s)</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Configuration Panel */}
                    <div className="lg:col-span-4 flex flex-col gap-5 lg:max-h-[calc(100vh-180px)]">
                        <div className={`flex-1 space-y-5 overflow-y-auto transition-opacity ${(scrapeMutation.isPending || isStreaming) ? 'opacity-60 pointer-events-none' : ''}`}>
                            {/* URL Input */}
                            <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                                <label className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-blue-500" />
                                    Target URL
                                </label>
                                <div className="relative group">
                                    <input
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://example.com"
                                        disabled={scrapeMutation.isPending || isStreaming}
                                        className="w-full pl-4 pr-12 py-3.5 bg-white border-2 border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                    />
                                    {url && (
                                        <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Profile Selection */}
                            <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative z-20">
                                <label className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <User className="w-4 h-4 text-purple-500" />
                                    Browser Profile
                                </label>
                                <CustomDropdown
                                    value={selectedProfileId}
                                    onChange={setSelectedProfileId}
                                    placeholder="Default (No Profile)"
                                    icon={User}
                                    options={[
                                        { value: '', label: 'Default (No Profile)' },
                                        ...profiles.map((profile) => ({
                                            value: profile.id,
                                            label: `${profile.name} (${profile.screen_width}x${profile.screen_height})`,
                                            suffix: profile.is_running ? '●' : undefined
                                        }))
                                    ]}
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    Select a profile to use its cookies, storage, and fingerprint settings
                                </p>
                            </div>

                            {/* Format Selection */}
                            <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                                <label className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-500" />
                                    Output Format
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {OUTPUT_TYPES.map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => setOutputType(type.id)}
                                            className={`
                                            flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 text-center cursor-pointer
                                            ${outputType === type.id
                                                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-500 text-blue-700 shadow-sm shadow-blue-500/10'
                                                    : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-600'
                                                }
                                        `}
                                        >
                                            <div className={`
                                            w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all
                                            ${outputType === type.id
                                                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                                                    : 'bg-slate-100 text-slate-500'
                                                }
                                        `}>
                                                <type.icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold block">{type.label}</span>
                                                <span className={`text-[10px] ${outputType === type.id ? 'text-blue-500' : 'text-slate-400'}`}>
                                                    {type.id === 'html' && 'Raw'}
                                                    {type.id === 'html-js' && 'JS'}
                                                    {type.id === 'content' && 'MD'}
                                                    {type.id === 'screenshot' && 'PNG'}
                                                    {type.id === 'pdf' && 'PDF'}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Advanced Options */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                <button
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="w-full p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors cursor-pointer"
                                >
                                    <span className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-amber-500" />
                                        Advanced Configuration
                                    </span>
                                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`} />
                                </button>

                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showAdvanced ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-5 pt-0 space-y-5 border-t border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
                                        <div className="pt-4">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                                                <Eye className="w-3 h-3" />
                                                Wait Selector
                                            </label>
                                            <input
                                                value={selector}
                                                onChange={(e) => setSelector(e.target.value)}
                                                placeholder="#content, .main-article"
                                                className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-3">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Timeout
                                                </label>
                                                <span className="text-sm font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{timeout / 1000}s</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={5000}
                                                max={60000}
                                                step={1000}
                                                value={timeout}
                                                onChange={(e) => setTimeoutValue(Number(e.target.value))}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                            />
                                            <div className="flex justify-between text-xs text-slate-400 mt-1">
                                                <span>5s</span>
                                                <span>60s</span>
                                            </div>
                                        </div>


                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Run/Stop Button */}
                        {isStreaming ? (
                            <button
                                onClick={stopScrape}
                                className="mt-auto w-full py-4 bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-500 hover:via-red-400 hover:to-red-500 text-white rounded-xl font-bold shadow-xl shadow-red-500/20 transition-all flex items-center justify-center gap-3 group cursor-pointer"
                            >
                                <Square className="w-5 h-5 fill-current" />
                                Stop Scraping
                            </button>
                        ) : (
                            <button
                                onClick={() => scrapeMutation.mutate()}
                                disabled={!url}
                                className="mt-auto w-full py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-700 hover:to-slate-800 text-white rounded-xl font-bold shadow-xl shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 group cursor-pointer"
                            >
                                <Zap className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
                                Run Scraper
                            </button>
                        )}
                    </div>

                    {/* Results Panel */}
                    <div className="lg:col-span-8 flex flex-col bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden min-h-[400px]">
                        <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-400" />
                                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                                </div>
                                <div className="h-4 w-px bg-slate-200" />
                                <div className="flex items-center gap-2">
                                    <Terminal className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Response Output</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Only show expand/collapse when output is large */}
                                {result && result.type !== 'error' && result.type !== 'image' && result.type !== 'pdf' && (
                                    ((result.type === 'html' || result.type === 'html-js') && typeof result.data === 'object' && result.data.html && result.data.html.length > 1500) ||
                                    (result.type === 'content' && typeof result.data === 'object' && result.data.markdown && result.data.markdown.length > 1500)
                                ) && (
                                        <button
                                            onClick={() => setExpanded(!expanded)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-bold transition-colors cursor-pointer"
                                        >
                                            {expanded ? (
                                                <><ChevronUp className="w-3.5 h-3.5" /> Collapse</>
                                            ) : (
                                                <><ChevronDown className="w-3.5 h-3.5" /> Expand</>
                                            )}
                                        </button>
                                    )}
                                {result && result.type !== 'error' && (
                                    <button
                                        onClick={handleDownload}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-bold transition-colors cursor-pointer"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        Download
                                    </button>
                                )}
                                {(result?.type === 'html' || result?.type === 'html-js' || result?.type === 'html-css-js' || result?.type === 'content') && (
                                    <button
                                        onClick={handleCopy}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold transition-colors cursor-pointer"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                )}
                                {(result?.type === 'html' || result?.type === 'html-js') && (
                                    <button
                                        onClick={() => setViewRaw(!viewRaw)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${viewRaw
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        <Code className="w-3.5 h-3.5" />
                                        {viewRaw ? 'Preview' : 'Raw'}
                                    </button>
                                )}
                                {result?.type === 'content' && (
                                    <button
                                        onClick={() => setViewRaw(!viewRaw)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${viewRaw
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        <Code className="w-3.5 h-3.5" />
                                        {viewRaw ? 'Rendered' : 'Raw MD'}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto bg-gradient-to-b from-slate-50/50 to-white">
                            {(scrapeMutation.isPending || isStreaming) && (
                                <div className="h-full flex flex-col items-center justify-center p-8 relative overflow-hidden bg-white">
                                    {/* Ambient Glow */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] animate-pulse" />

                                    <div className="relative z-10 w-full max-w-lg mb-8">
                                        {/* Minimal spacing */}
                                        <div className="h-4"></div>

                                        {/* Timeline Steps */}
                                        <div className="h-[240px] flex flex-col relative overflow-hidden">
                                            <div className="px-4 relative w-full h-full flex flex-col justify-center transition-all duration-500">
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
                                                            {/* Step Indicator */}
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

                                                            {/* Step Content */}
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
                                    </div>
                                </div>
                            )}

                            {!result && !scrapeMutation.isPending && !isStreaming && (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                                        <Search className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <p className="font-bold text-slate-500 text-lg mb-1">Ready to scrape</p>
                                    <p className="text-sm text-slate-400">Enter a URL and click Run Scraper to start</p>
                                </div>
                            )}

                            {result?.type === 'error' && !isStreaming && !scrapeMutation.isPending && (
                                <div className="h-full flex flex-col items-center justify-center text-center">
                                    <div className="inline-flex p-4 rounded-2xl bg-red-100 text-red-600 mb-6">
                                        <XCircle className="w-12 h-12" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">Request Failed</h3>
                                    <p className="text-slate-600 max-w-md mx-auto mb-6">{typeof result.data === 'string' ? result.data : 'Unknown error'}</p>
                                    <button
                                        onClick={() => scrapeMutation.mutate()}
                                        className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}



                            {result?.type === 'pdf' && !isStreaming && !scrapeMutation.isPending && (
                                <div className="flex flex-col items-center justify-center gap-6 py-24">
                                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/25">
                                        <FileDown className="w-12 h-12 text-white" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xl font-bold text-slate-900 mb-1">PDF Generated Successfully</p>
                                        <p className="text-sm text-slate-500">Click Download above to save the file</p>
                                    </div>
                                </div>
                            )}

                            {result?.type === 'error' && (
                                <div className="p-6">
                                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                                        <div className="space-y-1">
                                            <p className="text-sm text-red-600 font-mono whitespace-pre-wrap break-words">
                                                {typeof result.data === 'string' ? result.data : JSON.stringify(result.data)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {result?.type === 'image' && (
                                <div className="p-6 flex flex-col items-center">
                                    <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm max-w-full">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={result.data as string}
                                            alt="Scraped Screenshot"
                                            className="max-w-full h-auto"
                                        />
                                    </div>
                                    <div className="mt-4 flex gap-3">
                                        <a
                                            href={result.data as string}
                                            download={`screenshot-${new Date().getTime()}.jpg`}
                                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download Image
                                        </a>
                                    </div>
                                </div>
                            )}

                            {(result?.type === 'html' || result?.type === 'html-js') && typeof result.data === 'object' && !isStreaming && !scrapeMutation.isPending && (
                                <div className="p-6 relative">
                                    {viewRaw ? (
                                        /* Raw HTML Code View */
                                        <pre className={`bg-slate-900 text-slate-300 p-6 rounded-xl text-xs overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap break-all transition-all duration-300 ${expanded ? '' : 'max-h-[400px] overflow-hidden'}`}>
                                            {result.data.html}
                                        </pre>
                                    ) : (
                                        /* Rendered HTML Preview */
                                        <div className={`bg-white border border-slate-200 rounded-xl overflow-hidden transition-all duration-300 ${expanded ? '' : 'max-h-[400px] overflow-hidden'}`}>
                                            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center gap-2">
                                                <div className="flex gap-1.5">
                                                    <div className="w-3 h-3 rounded-full bg-red-400" />
                                                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                                                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                                                </div>
                                                <span className="text-xs text-slate-500 ml-2">Preview</span>
                                            </div>
                                            <iframe
                                                srcDoc={result.data.html}
                                                className="w-full min-h-[300px] bg-white"
                                                style={{ height: expanded ? '600px' : '300px' }}
                                                sandbox="allow-same-origin"
                                                title="HTML Preview"
                                            />
                                        </div>
                                    )}

                                    {!expanded && result.data.html && result.data.html.length > 1500 && (
                                        <div className={`absolute bottom-6 left-6 right-6 h-24 flex items-end justify-center pb-4 ${viewRaw ? 'bg-gradient-to-t from-slate-900 to-transparent rounded-b-xl' : 'bg-gradient-to-t from-white to-transparent'}`}>
                                            <button
                                                onClick={() => setExpanded(true)}
                                                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold shadow-lg transition-colors ${viewRaw ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                                            >
                                                <ChevronDown className="w-4 h-4" />
                                                Show Full Response
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {result?.type === 'html-css-js' && typeof result.data === 'object' && !isStreaming && !scrapeMutation.isPending && (
                                <div className="p-6 space-y-6">
                                    {/* Resources Summary */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                            <div className="text-2xl font-bold text-blue-600">{result.data.styles?.length || 0}</div>
                                            <div className="text-xs font-medium text-blue-500">External CSS</div>
                                        </div>
                                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                                            <div className="text-2xl font-bold text-amber-600">{result.data.scripts?.length || 0}</div>
                                            <div className="text-xs font-medium text-amber-500">External JS</div>
                                        </div>
                                        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                                            <div className="text-2xl font-bold text-purple-600">{result.data.inlineStyles?.length || 0}</div>
                                            <div className="text-xs font-medium text-purple-500">Inline CSS chars</div>
                                        </div>
                                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                                            <div className="text-2xl font-bold text-emerald-600">{result.data.inlineScripts?.length || 0}</div>
                                            <div className="text-xs font-medium text-emerald-500">Inline JS chars</div>
                                        </div>
                                    </div>

                                    {/* External CSS Links */}
                                    {result.data.styles && result.data.styles.length > 0 && (
                                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                            <div className="bg-blue-50 px-4 py-2 border-b border-slate-200">
                                                <span className="text-sm font-bold text-blue-600">External Stylesheets ({result.data.styles.length})</span>
                                            </div>
                                            <div className="divide-y divide-slate-100 max-h-48 overflow-auto">
                                                {result.data.styles.map((url, i) => (
                                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-xs font-mono text-slate-600 hover:bg-blue-50 truncate">
                                                        {url}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* External JS Scripts */}
                                    {result.data.scripts && result.data.scripts.length > 0 && (
                                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                            <div className="bg-amber-50 px-4 py-2 border-b border-slate-200">
                                                <span className="text-sm font-bold text-amber-600">External Scripts ({result.data.scripts.length})</span>
                                            </div>
                                            <div className="divide-y divide-slate-100 max-h-48 overflow-auto">
                                                {result.data.scripts.map((url, i) => (
                                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-xs font-mono text-slate-600 hover:bg-amber-50 truncate">
                                                        {url}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Inline Styles */}
                                    {result.data.inlineStyles && result.data.inlineStyles.length > 0 && (
                                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                            <div className="bg-purple-50 px-4 py-2 border-b border-slate-200">
                                                <span className="text-sm font-bold text-purple-600">Inline CSS</span>
                                            </div>
                                            <pre className="p-4 text-xs font-mono text-slate-600 max-h-48 overflow-auto bg-slate-50">
                                                {result.data.inlineStyles}
                                            </pre>
                                        </div>
                                    )}

                                    {/* Inline Scripts */}
                                    {result.data.inlineScripts && result.data.inlineScripts.length > 0 && (
                                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                            <div className="bg-emerald-50 px-4 py-2 border-b border-slate-200">
                                                <span className="text-sm font-bold text-emerald-600">Inline JavaScript</span>
                                            </div>
                                            <pre className="p-4 text-xs font-mono text-slate-600 max-h-48 overflow-auto bg-slate-50">
                                                {result.data.inlineScripts}
                                            </pre>
                                        </div>
                                    )}

                                    {/* HTML Preview (collapsed by default) */}
                                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                                            <span className="text-sm font-bold text-slate-600">HTML Content</span>
                                            <button
                                                onClick={() => setExpanded(!expanded)}
                                                className="text-xs font-medium text-blue-600 hover:underline"
                                            >
                                                {expanded ? 'Collapse' : 'Expand'}
                                            </button>
                                        </div>
                                        <pre className={`p-4 text-xs font-mono overflow-auto bg-slate-900 text-slate-300 ${expanded ? '' : 'max-h-32'}`}>
                                            {result.data.html}
                                        </pre>
                                    </div>
                                </div>
                            )}

                            {result?.type === 'content' && typeof result.data === 'object' && !isStreaming && !scrapeMutation.isPending && (
                                <div className="p-6 relative">
                                    {viewRaw ? (
                                        /* Raw Markdown View */
                                        <pre className={`bg-slate-900 text-slate-300 p-6 rounded-xl text-sm overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap break-words transition-all duration-300 ${expanded ? '' : 'max-h-[400px] overflow-hidden'}`}>
                                            {result.data.markdown || ''}
                                        </pre>
                                    ) : (
                                        /* Rendered Markdown View */
                                        <div className={`prose prose-slate prose-sm max-w-none transition-all duration-300 ${expanded ? '' : 'max-h-[400px] overflow-hidden'}`}>
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    h1: ({ children }) => <h1 className="text-2xl font-bold text-slate-900 mt-6 mb-4 pb-2 border-b border-slate-200 first:mt-0">{children}</h1>,
                                                    h2: ({ children }) => <h2 className="text-xl font-bold text-slate-800 mt-5 mb-3">{children}</h2>,
                                                    h3: ({ children }) => <h3 className="text-lg font-semibold text-slate-800 mt-4 mb-2">{children}</h3>,
                                                    h4: ({ children }) => <h4 className="text-base font-semibold text-slate-700 mt-3 mb-2">{children}</h4>,
                                                    p: ({ children }) => <p className="text-slate-600 leading-relaxed mb-4">{children}</p>,
                                                    ul: ({ children }) => <ul className="list-disc list-inside text-slate-600 mb-4 space-y-1">{children}</ul>,
                                                    ol: ({ children }) => <ol className="list-decimal list-inside text-slate-600 mb-4 space-y-1">{children}</ol>,
                                                    li: ({ children }) => <li className="text-slate-600">{children}</li>,
                                                    a: ({ href, children }) => <a href={href} className="text-blue-600 hover:text-blue-700 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                                                    blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-slate-500 my-4">{children}</blockquote>,
                                                    code: ({ className, children }) => {
                                                        const isInline = !className;
                                                        return isInline ? (
                                                            <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                                                        ) : (
                                                            <code className="block bg-slate-900 text-slate-100 p-4 rounded-lg text-sm font-mono overflow-x-auto my-4">{children}</code>
                                                        );
                                                    },
                                                    pre: ({ children }) => <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto my-4">{children}</pre>,
                                                    table: ({ children }) => <div className="overflow-x-auto my-4"><table className="min-w-full border border-slate-200 rounded-lg">{children}</table></div>,
                                                    thead: ({ children }) => <thead className="bg-slate-50">{children}</thead>,
                                                    th: ({ children }) => <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">{children}</th>,
                                                    td: ({ children }) => <td className="px-4 py-2 text-sm text-slate-600 border-b border-slate-100">{children}</td>,
                                                    hr: () => <hr className="my-6 border-slate-200" />,
                                                    img: ({ src, alt }) => <img src={src} alt={alt || ''} className="rounded-lg max-w-full h-auto my-4" />,
                                                }}
                                            >
                                                {result.data.markdown || ''}
                                            </ReactMarkdown>
                                        </div>
                                    )}

                                    {!expanded && result.data.markdown && result.data.markdown.length > 1500 && (
                                        <div className={`absolute bottom-6 left-6 right-6 h-24 flex items-end justify-center pb-4 ${viewRaw ? 'bg-gradient-to-t from-slate-900 to-transparent rounded-b-xl' : 'bg-gradient-to-t from-white to-transparent'}`}>
                                            <button
                                                onClick={() => setExpanded(true)}
                                                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold shadow-lg transition-colors ${viewRaw ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                                            >
                                                <ChevronDown className="w-4 h-4" />
                                                Show Full Content
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
