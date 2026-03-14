import {
    ArrowDown01Icon,
    ArrowUp01Icon,
    Cancel01Icon,
    CheckmarkCircle02Icon,
    Copy01Icon,
    Download01Icon,
    Loading03Icon,
    SourceCodeSquareIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { TavilyTool } from '../types';

interface ResultsHeaderProps {
    tool: TavilyTool;
    hasResult: boolean;
    hasError: boolean;
    isPending: boolean;
    elapsedTime: number | null;
    requestId: string | null;
    expanded: boolean;
    viewRaw: boolean;
    copied: boolean;
    canCopy: boolean;
    canSave: boolean;
    onToggleExpanded: () => void;
    onToggleRaw: () => void;
    onCopy: () => void;
    onSave: () => void;
}

export function ResultsHeader(props: ResultsHeaderProps) {
    const {
        tool,
        hasResult,
        hasError,
        isPending,
        elapsedTime,
        requestId,
        expanded,
        viewRaw,
        copied,
        canCopy,
        canSave,
        onToggleExpanded,
        onToggleRaw,
        onCopy,
        onSave,
    } = props;

    const statusTone = hasError
        ? 'border-red-200 bg-red-50 text-red-600'
        : isPending
            ? 'border-blue-100 bg-blue-50 text-blue-700'
            : hasResult
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-white text-slate-500';
    const statusLabel = hasError
        ? 'Failed'
        : isPending
            ? tool === 'search' ? 'Searching' : 'Researching'
            : hasResult
                ? 'Ready'
                : 'Idle';

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4">
            <div className="flex min-w-0 flex-wrap items-center gap-4">
                <div className="flex shrink-0 items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-rose-400" />
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <div className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <div className="hidden h-5 w-px bg-slate-200 sm:block" />
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                            <HugeiconsIcon icon={SourceCodeSquareIcon} className="h-3.5 w-3.5 text-slate-400" />
                            {tool === 'search' ? 'Search Results' : 'Research Results'}
                        </div>
                        <div className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold ${statusTone}`}>
                            {isPending ? (
                                <HugeiconsIcon icon={Loading03Icon} className="h-3.5 w-3.5 animate-spin" />
                            ) : hasError ? (
                                <HugeiconsIcon icon={Cancel01Icon} className="h-3.5 w-3.5" />
                            ) : hasResult ? (
                                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-3.5 w-3.5" />
                            ) : null}
                            {statusLabel}
                        </div>
                        {elapsedTime !== null && (
                            <div className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">
                                {(elapsedTime / 1000).toFixed(1)}s
                            </div>
                        )}
                        {tool === 'research' && requestId && (
                            <div className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">
                                {requestId}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {hasResult && (
                    <button
                        type="button"
                        onClick={onToggleExpanded}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300"
                    >
                        <HugeiconsIcon icon={expanded ? ArrowUp01Icon : ArrowDown01Icon} className="h-3.5 w-3.5" />
                        {expanded ? 'Collapse' : 'Expand'}
                    </button>
                )}

                {hasResult && (
                    <button
                        type="button"
                        onClick={onToggleRaw}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                            viewRaw ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                    >
                        Raw
                    </button>
                )}

                {canCopy && (
                    <button
                        type="button"
                        onClick={onCopy}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300"
                    >
                        <HugeiconsIcon icon={copied ? CheckmarkCircle02Icon : Copy01Icon} className={`h-3.5 w-3.5 ${copied ? 'text-emerald-500' : ''}`} />
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                )}

                {canSave && (
                    <button
                        type="button"
                        onClick={onSave}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                    >
                        <HugeiconsIcon icon={Download01Icon} className="h-3.5 w-3.5" />
                        Save
                    </button>
                )}
            </div>
        </div>
    );
}
