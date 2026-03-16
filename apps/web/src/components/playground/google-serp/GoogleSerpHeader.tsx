import Image from 'next/image';
import {
    Cancel01Icon,
    CheckmarkCircle02Icon,
    Clock03Icon,
    Loading03Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlaygroundHeaderShell } from '../shared';

interface GoogleSerpHeaderProps {
    elapsedTime: number | null;
    isLoading: boolean;
    hasResult: boolean;
    error: string | null;
}

export function GoogleSerpHeader({ elapsedTime, isLoading, hasResult, error }: GoogleSerpHeaderProps) {
    return (
        <PlaygroundHeaderShell
            title="Google SERP"
            description="Extract AI overviews, organic results, and source metadata from Google search result pages."
            iconSlot={
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(66,133,244,0.18),_transparent_48%),radial-gradient(circle_at_top_right,_rgba(234,67,53,0.16),_transparent_52%),radial-gradient(circle_at_bottom_left,_rgba(251,188,5,0.18),_transparent_50%),radial-gradient(circle_at_bottom_right,_rgba(52,168,83,0.18),_transparent_50%),linear-gradient(135deg,rgba(255,255,255,1),rgba(248,250,252,1))] px-2">
                    <Image src="/icons/google.svg" alt="Google" width={28} height={28} />
                </div>
            }
            controls={
                <>
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
                </>
            }
        />
    );
}
