import { Search01Icon, SparklesIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { TavilyTool } from '../types';

interface ActionButtonsProps {
    tool: TavilyTool;
    isPending: boolean;
    hasQuery: boolean;
    hasApiKey: boolean;
    onRun: () => void;
    onStop: () => void;
}

export function ActionButtons({
    tool,
    isPending,
    hasQuery,
    hasApiKey,
    onRun,
    onStop,
}: ActionButtonsProps) {
    const buttonLabel = tool === 'search' ? 'Run Search' : 'Start Research';
    const ButtonIcon = tool === 'search' ? Search01Icon : SparklesIcon;

    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <button
                type="button"
                onClick={onRun}
                disabled={isPending || !hasQuery || !hasApiKey}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
                <HugeiconsIcon icon={ButtonIcon} className="h-4 w-4" />
                {buttonLabel}
            </button>

            <button
                type="button"
                onClick={onStop}
                disabled={!isPending}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-600 transition-colors hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-white disabled:text-slate-400 disabled:opacity-50"
            >
                <HugeiconsIcon icon={SparklesIcon} className="h-4 w-4" />
                Stop
            </button>
        </div>
    );
}
