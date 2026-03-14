import { Search01Icon, SparklesIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { TavilyTool } from '../types';

export function EmptyState({ tool, available }: { tool: TavilyTool; available: boolean }) {
    const copy = !available
        ? {
            icon: SparklesIcon,
            title: 'Tavily key missing',
            body: 'Add TAVILY_API_KEY and the workbench will become active.',
        }
        : tool === 'search'
            ? {
                icon: Search01Icon,
                title: 'Ready to search',
                body: 'Run a Tavily search and the answer, sources, and raw content will appear here.',
            }
            : {
                icon: SparklesIcon,
                title: 'Ready to research',
                body: 'Start a Tavily research job and the report with sources will render here.',
            };

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,1),rgba(241,245,249,1))] ring-1 ring-slate-200">
                <HugeiconsIcon icon={copy.icon} className="h-10 w-10 text-slate-300" />
            </div>
            <p className="text-lg font-bold text-slate-700">{copy.title}</p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{copy.body}</p>
        </div>
    );
}
