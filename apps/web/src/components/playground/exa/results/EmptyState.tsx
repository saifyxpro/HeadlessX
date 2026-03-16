'use client';

import { Search01Icon } from '@hugeicons/core-free-icons';
import { PlaygroundEmptyState } from '../../shared';

interface EmptyStateProps {
    available: boolean;
}

export function EmptyState({ available }: EmptyStateProps) {
    return (
        <PlaygroundEmptyState
            icon={Search01Icon}
            title={available ? 'Ready to search' : 'Exa is not configured'}
            body={available
                ? 'Search the web with Exa to inspect highlighted excerpts, text content, and deep-search synthesis.'
                : 'Add EXA_API_KEY to your environment to activate this workspace.'}
        />
    );
}
