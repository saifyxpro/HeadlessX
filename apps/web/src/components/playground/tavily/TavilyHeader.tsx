'use client';

import Image from 'next/image';
import {
    Clock03Icon,
    Search01Icon,
    SparklesIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { TavilyTool } from './types';
import { PlaygroundHeaderShell } from '../shared';

interface TavilyHeaderProps {
    available: boolean;
    tool: TavilyTool;
    onToolChange: (tool: TavilyTool) => void;
    elapsedTime: number | null;
    isPending: boolean;
    hasResult: boolean;
    hasError: boolean;
}

const TOOL_META: Record<TavilyTool, { label: string; title: string; description: string; icon: typeof Search01Icon }> = {
    search: {
        label: 'Search',
        title: 'Tavily',
        description: 'AI-focused web search with answers, domain controls, and raw source content.',
        icon: Search01Icon,
    },
    research: {
        label: 'Research',
        title: 'Tavily Research',
        description: 'Queued research reports with citations, polled from the backend until the final report is ready.',
        icon: SparklesIcon,
    },
};

export function TavilyHeader({ available, tool, onToolChange, elapsedTime, isPending, hasResult, hasError }: TavilyHeaderProps) {
    const currentMeta = TOOL_META[tool];

    return (
        <PlaygroundHeaderShell
            title={currentMeta.title}
            description={currentMeta.description}
            iconSlot={
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),_transparent_58%),radial-gradient(circle_at_bottom_right,_rgba(45,212,191,0.18),_transparent_54%),linear-gradient(135deg,rgba(255,255,255,1),rgba(240,253,250,1))] ring-1 ring-emerald-100">
                    <Image src="/icons/tavily.svg" alt="Tavily" width={24} height={24} className="h-6 w-6" />
                </div>
            }
            secondary={
                <div className="flex flex-wrap items-center gap-2">
                    {Object.entries(TOOL_META).map(([key, meta]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onToolChange(key as TavilyTool)}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition-all ${
                                tool === key
                                    ? 'border-slate-900 bg-slate-900 text-white'
                                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-white'
                            }`}
                        >
                            <HugeiconsIcon icon={meta.icon} className="h-3.5 w-3.5" />
                            {meta.label}
                        </button>
                    ))}
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
