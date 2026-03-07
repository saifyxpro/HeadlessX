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
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-5 py-4">
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Link
                        href="/playground"
                        className="group rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-blue-600">
                                <Globe className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                                    Scraper Engine
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight font-display">
                                Website Scraper
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Live Timer */}
                    <div className={`
                    flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium font-mono
                    ${isPending && elapsedTime !== null
                        ? 'bg-slate-50 border-slate-200 text-slate-700 translate-y-0 opacity-100'
                        : 'opacity-0 translate-y-4 pointer-events-none absolute right-0'
                    }
                `}>
                        <Clock className="w-4 h-4 text-slate-400" />
                        {elapsedTime !== null ? (elapsedTime / 1000).toFixed(1) : '0.0'}s
                    </div>

                    {/* Status Badge */}
                    {isPending && (
                        <div className="flex items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                            Processing...
                        </div>
                    )}

                    {result?.type === 'error' && (
                        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
                            <XCircle className="w-4 h-4" /> Failed
                        </div>
                    )}

                    {result && result.type !== 'error' && !isPending && (
                        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                            Success
                            {elapsedTime !== null && (
                                <span className="text-emerald-500/70 font-mono ml-1 text-xs">({(elapsedTime / 1000).toFixed(2)}s)</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
