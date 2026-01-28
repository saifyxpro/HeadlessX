import Link from 'next/link';
import { ArrowLeft, Globe, Clock, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { ScrapeResult } from './types';

interface ScraperHeaderProps {
    elapsedTime: number | null;
    isPending: boolean;
    result: ScrapeResult | null;
}

export function ScraperHeader({ elapsedTime, isPending, result }: ScraperHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-8 shrink-0 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-5">
                <Link
                    href="/playground"
                    className="group p-3 rounded-2xl border border-white/40 bg-white/40 backdrop-blur-md hover:bg-white/60 hover:border-white/60 text-slate-600 transition-all hover:-translate-x-1 shadow-sm hover:shadow-md"
                >
                    <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
                </Link>
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-blue-500/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 ring-1 ring-white/20">
                            <Globe className="w-7 h-7" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                                Scraper Engine
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Website Scraper</h1>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Live Timer */}
                <div className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-xl border font-mono text-sm font-medium transition-all duration-300
                    ${isPending && elapsedTime !== null
                        ? 'bg-white/80 border-slate-200 text-slate-700 shadow-sm translate-y-0 opacity-100'
                        : 'opacity-0 translate-y-4 pointer-events-none absolute right-0'
                    }
                `}>
                    <Clock className="w-4 h-4 text-slate-400" />
                    {elapsedTime !== null ? (elapsedTime / 1000).toFixed(1) : '0.0'}s
                </div>

                {/* Status Badge */}
                {isPending && (
                    <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-medium text-sm shadow-xl shadow-slate-900/10 animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                        Processing...
                    </div>
                )}

                {result?.type === 'error' && (
                    <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 border border-red-100/50 text-red-600 font-bold text-sm shadow-sm ring-1 ring-red-500/10">
                        <XCircle className="w-4 h-4" /> Failed
                    </div>
                )}

                {result && result.type !== 'error' && !isPending && (
                    <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100/50 text-emerald-600 font-bold text-sm shadow-sm ring-1 ring-emerald-500/10">
                        <CheckCircle2 className="w-4 h-4" />
                        Success
                        {elapsedTime !== null && (
                            <span className="text-emerald-500/70 font-mono ml-1 text-xs">({(elapsedTime / 1000).toFixed(2)}s)</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
