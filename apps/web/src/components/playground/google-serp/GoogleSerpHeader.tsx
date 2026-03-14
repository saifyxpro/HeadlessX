
import Link from 'next/link';
import Image from 'next/image';
import {
    ArrowLeft01Icon,
    Cancel01Icon,
    CheckmarkCircle02Icon,
    Clock03Icon,
    Loading03Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

interface GoogleSerpHeaderProps {
    elapsedTime: number | null;
    isLoading: boolean;
    hasResult: boolean;
    error: string | null;
}

export function GoogleSerpHeader({ elapsedTime, isLoading, hasResult, error }: GoogleSerpHeaderProps) {
    return (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-5 py-4">
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Link
                        href="/playground"
                        className="group rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600"
                    >
                        <HugeiconsIcon icon={ArrowLeft01Icon} className="w-5 h-5" />
                    </Link>
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-2">
                            <Image src="/icons/google.svg" alt="Google" width={32} height={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                                    Scraper Engine
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight font-display">
                                Google SERP Scraper
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Live Timer */}
                    <div className={`
                    flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium font-mono
                    ${(isLoading || hasResult) && elapsedTime !== null
                        ? 'bg-slate-50 border-slate-200 text-slate-700 translate-y-0 opacity-100'
                        : 'opacity-0 translate-y-4 pointer-events-none absolute right-0'
                    }
                `}>
                        <HugeiconsIcon icon={Clock03Icon} className="w-4 h-4 text-slate-400" />
                        {elapsedTime !== null ? (elapsedTime / 1000).toFixed(1) : '0.0'}s
                    </div>

                    {/* Status Badge */}
                    {isLoading && (
                        <div className="flex items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                            <HugeiconsIcon icon={Loading03Icon} className="w-4 h-4 animate-spin text-blue-400" />
                            Searching...
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
                            <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" /> Failed
                        </div>
                    )}

                    {hasResult && !isLoading && !error && (
                        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600">
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-4 h-4" />
                            Success
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
