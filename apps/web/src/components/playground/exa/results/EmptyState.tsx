'use client';

import { Search01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

interface EmptyStateProps {
    available: boolean;
}

export function EmptyState({ available }: EmptyStateProps) {
    return (
        <div className="flex h-full min-h-[640px] flex-col items-center justify-center px-8 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 ring-1 ring-slate-100">
                <HugeiconsIcon icon={Search01Icon} className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
                {available ? 'Run an Exa search' : 'Exa is not configured'}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                {available
                    ? 'Search the web with Exa to inspect highlighted excerpts, text content, and deep-search synthesis.'
                    : 'Add EXA_API_KEY to your environment to activate this workspace.'}
            </p>
        </div>
    );
}
