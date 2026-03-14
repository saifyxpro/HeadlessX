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
        <div className="group mb-6 rounded-[1.75rem] border border-slate-200 bg-white px-5 py-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                    <div className="flex items-start gap-4">
                        <div className="min-w-0">
                            <div className="flex items-center gap-3">
                                <div className="relative h-12 w-12 shrink-0">
                                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-2 transition-opacity duration-200 group-hover:opacity-0">
                                        <Image src="/icons/google.svg" alt="Google" width={28} height={28} />
                                    </div>
                                    <Link
                                        href="/playground"
                                        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 opacity-0 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 group-hover:pointer-events-auto group-hover:opacity-100"
                                    >
                                        <HugeiconsIcon icon={ArrowLeft01Icon} className="h-5 w-5" />
                                    </Link>
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                        Google SERP
                                    </h1>
                                    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                                        Extract AI overviews, organic results, and source metadata from Google search result pages.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                    <div
                        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium font-mono ${
                            elapsedTime !== null
                                ? 'border-slate-200 bg-slate-50 text-slate-700'
                                : 'pointer-events-none opacity-0'
                        }`}
                    >
                        <HugeiconsIcon icon={Clock03Icon} className="h-4 w-4 text-slate-400" />
                        {elapsedTime !== null ? (elapsedTime / 1000).toFixed(1) : '0.0'}s
                    </div>

                    {isLoading && (
                        <div className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                            <HugeiconsIcon icon={Loading03Icon} className="h-4 w-4 animate-spin text-blue-400" />
                            Searching
                        </div>
                    )}

                    {error && (
                        <div className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
                            <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
                            Failed
                        </div>
                    )}

                    {hasResult && !isLoading && !error && (
                        <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600">
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-4 w-4" />
                            Ready
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
