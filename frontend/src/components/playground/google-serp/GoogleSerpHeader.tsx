
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Clock, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface GoogleSerpHeaderProps {
    elapsedTime: number | null;
    isLoading: boolean;
    hasResult: boolean;
    error: string | null;
}

export function GoogleSerpHeader({ elapsedTime, isLoading, hasResult, error }: GoogleSerpHeaderProps) {
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
                        <div className="relative w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-xl shadow-blue-500/10 ring-1 ring-white/20 px-3">
                            <Image src="/icons/google.svg" alt="Google" width={32} height={32} />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                                Scraper Engine
                            </span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight font-display">
                            Google SERP Scraper
                        </h1>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Live Timer */}
                <div className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-xl border font-mono text-sm font-medium transition-all duration-300
                    ${(isLoading || hasResult) && elapsedTime !== null
                        ? 'bg-white/80 border-slate-200 text-slate-700 shadow-sm translate-y-0 opacity-100'
                        : 'opacity-0 translate-y-4 pointer-events-none absolute right-0'
                    }
                `}>
                    <Clock className="w-4 h-4 text-slate-400" />
                    {elapsedTime !== null ? (elapsedTime / 1000).toFixed(1) : '0.0'}s
                </div>

                {/* Status Badge */}
                {isLoading && (
                    <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-medium text-sm shadow-xl shadow-slate-900/10 animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                        Searching...
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 border border-red-100/50 text-red-600 font-bold text-sm shadow-sm ring-1 ring-red-500/10">
                        <XCircle className="w-4 h-4" /> Failed
                    </div>
                )}

                {hasResult && !isLoading && !error && (
                    <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100/50 text-emerald-600 font-bold text-sm shadow-sm ring-1 ring-emerald-500/10">
                        <CheckCircle2 className="w-4 h-4" />
                        Success
                    </div>
                )}
            </div>
        </div>
    );
}
