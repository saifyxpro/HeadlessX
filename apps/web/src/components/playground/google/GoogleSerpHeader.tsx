import Image from 'next/image';
import {
    Cancel01Icon,
    CheckmarkCircle02Icon,
    Clock03Icon,
    GlobeIcon,
    LinkSquare01Icon,
    Loading03Icon,
    Search01Icon,
    SparklesIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlaygroundHeaderShell } from '../shared';
import type { GoogleCookieStatus } from './types';

interface GoogleSerpHeaderProps {
    elapsedTime: number | null;
    isLoading: boolean;
    cookieStatus: GoogleCookieStatus | null;
    isCookieStatusPending: boolean;
    isCookieActionPending: boolean;
    onBuildCookies: () => void;
    onStopCookies: () => void;
}

export function GoogleSerpHeader({
    elapsedTime,
    isLoading,
    cookieStatus,
    isCookieStatusPending,
    isCookieActionPending,
    onBuildCookies,
    onStopCookies,
}: GoogleSerpHeaderProps) {
    const modes = [
        { label: 'AI Search', icon: Search01Icon, active: true },
        { label: 'Trends', icon: SparklesIcon, active: false },
        { label: 'News', icon: GlobeIcon, active: false },
        { label: 'Finance', icon: LinkSquare01Icon, active: false },
    ] as const;

    const cookieTone = isCookieStatusPending
        ? 'border-slate-200 bg-white text-slate-500'
        : cookieStatus?.running
            ? 'border-blue-200 bg-blue-50 text-blue-700'
            : cookieStatus?.ready
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-700';

    const cookieLabel = isCookieStatusPending
        ? 'Checking Profile'
        : cookieStatus?.running
            ? 'Browser Running'
            : cookieStatus?.ready
                ? 'Profile Ready'
                : 'Build Cookies Required';

    const buildButtonLabel = isCookieActionPending
        ? 'Working'
        : cookieStatus?.running
            ? 'Stop Browser'
            : 'Build Cookies';

    const buildButtonTitle = cookieStatus?.running
        ? 'Close the shared Google browser session and save the current profile state.'
        : 'Open the shared browser profile and visit Google so the session looks like a normal user instead of a fresh bot.';

    return (
        <PlaygroundHeaderShell
            title="Google"
            description="Extract AI overviews, organic results, and source metadata from Google search result pages."
            iconSlot={
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(66,133,244,0.18),_transparent_48%),radial-gradient(circle_at_top_right,_rgba(234,67,53,0.16),_transparent_52%),radial-gradient(circle_at_bottom_left,_rgba(251,188,5,0.18),_transparent_50%),radial-gradient(circle_at_bottom_right,_rgba(52,168,83,0.18),_transparent_50%),linear-gradient(135deg,rgba(255,255,255,1),rgba(248,250,252,1))] px-2">
                    <Image src="/icons/google.svg" alt="Google" width={28} height={28} />
                </div>
            }
            secondary={
                <div className="flex flex-wrap items-center gap-2">
                    {modes.map((mode) => (
                        mode.active ? (
                            <button
                                key={mode.label}
                                type="button"
                                className="inline-flex items-center gap-2 rounded-full border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white"
                            >
                                <HugeiconsIcon icon={mode.icon} className="h-3.5 w-3.5" />
                                {mode.label}
                            </button>
                        ) : (
                            <div
                                key={mode.label}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                            >
                                <HugeiconsIcon icon={mode.icon} className="h-3.5 w-3.5 text-slate-400" />
                                <span>{mode.label}</span>
                                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold tracking-[0.14em] text-slate-400">
                                    Soon
                                </span>
                            </div>
                        )
                    ))}
                </div>
            }
            controls={
                <>
                    <div className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium ${cookieTone}`}>
                        {isCookieStatusPending || isCookieActionPending || cookieStatus?.running ? (
                            <HugeiconsIcon icon={Loading03Icon} className="h-4 w-4 animate-spin" />
                        ) : cookieStatus?.ready ? (
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-4 w-4" />
                        ) : (
                            <HugeiconsIcon icon={Search01Icon} className="h-4 w-4" />
                        )}
                        <span>{cookieLabel}</span>
                        {!isCookieStatusPending && cookieStatus?.usingVirtualDisplay && (
                            <span className="rounded-full border border-current/15 bg-white/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]">
                                Virtual Display
                            </span>
                        )}
                    </div>

                    <button
                        type="button"
                        title={buildButtonTitle}
                        onClick={cookieStatus?.running ? onStopCookies : onBuildCookies}
                        disabled={isCookieStatusPending || isCookieActionPending || isLoading}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                            cookieStatus?.running
                                ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                                : 'bg-[#1a73e8] text-white hover:bg-[#1765cb]'
                        }`}
                    >
                        {isCookieActionPending ? (
                            <HugeiconsIcon icon={Loading03Icon} className="h-4 w-4 animate-spin" />
                        ) : cookieStatus?.running ? (
                            <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
                        ) : (
                            <HugeiconsIcon icon={Search01Icon} className="h-4 w-4" />
                        )}
                        {buildButtonLabel}
                    </button>

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
                </>
            }
        />
    );
}
