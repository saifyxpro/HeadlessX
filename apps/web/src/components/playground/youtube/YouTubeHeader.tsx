'use client';

import Image from 'next/image';
import {
    Clock03Icon,
    PlayIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlaygroundHeaderShell } from '../shared';

interface YoutubeHeaderProps {
    available: boolean;
    elapsedTime: number | null;
    isPending: boolean;
    hasResult: boolean;
    hasError: boolean;
}

export function YoutubeHeader({
    available,
    elapsedTime,
    isPending,
    hasResult,
    hasError,
}: YoutubeHeaderProps) {
    return (
        <PlaygroundHeaderShell
            title="YouTube"
            description="Extract video metadata, playlist previews, available formats, and subtitle inventory through the yt-dude-powered engine."
            iconSlot={
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.22),_transparent_58%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.16),_transparent_54%),linear-gradient(135deg,rgba(255,255,255,1),rgba(254,242,242,1))] ring-1 ring-red-100">
                    <Image src="/icons/youtube.svg" alt="YouTube" width={24} height={24} className="h-6 w-6" />
                </div>
            }
            secondary={
                <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                        <HugeiconsIcon icon={PlayIcon} className="h-3.5 w-3.5" />
                        Extract
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
                            Engine missing
                        </div>
                    )}
                </>
            }
        />
    );
}
