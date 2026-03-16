'use client';

import Image from 'next/image';
import {
    Clock03Icon,
    Search01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlaygroundHeaderShell } from '../shared';

interface ExaHeaderProps {
    available: boolean;
    elapsedTime: number | null;
    isPending: boolean;
    hasResult: boolean;
    hasError: boolean;
}

export function ExaHeader({
    available,
    elapsedTime,
    isPending,
    hasResult,
    hasError,
}: ExaHeaderProps) {
    return (
        <PlaygroundHeaderShell
            title="Exa"
            description="LLM-optimized web search with highlighted excerpts, category filters, and optional deep synthesis."
            iconSlot={
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.20),_transparent_58%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.18),_transparent_54%),linear-gradient(135deg,rgba(255,255,255,1),rgba(241,245,249,1))] ring-1 ring-slate-200">
                    <Image src="/icons/exa.svg" alt="Exa" width={24} height={24} className="h-6 w-6" />
                </div>
            }
            secondary={
                <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                        <HugeiconsIcon icon={Search01Icon} className="h-3.5 w-3.5" />
                        Search
                    </div>
                </div>
            }
            controls={
                <>
                    <div
                        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium font-mono transition-all ${
                            elapsedTime !== null
                                ? 'border-slate-200 bg-slate-50 text-slate-700'
                                : 'pointer-events-none opacity-0'
                        }`}
                    >
                        <HugeiconsIcon icon={Clock03Icon} className="h-4 w-4 text-slate-400" />
                        {elapsedTime !== null ? (elapsedTime / 1000).toFixed(1) : '0.0'}s
                    </div>

                    {!available && (
                        <div className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                            API key missing
                        </div>
                    )}
                </>
            }
        />
    );
}
