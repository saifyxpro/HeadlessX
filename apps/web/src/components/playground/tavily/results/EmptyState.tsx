import { Search01Icon, SparklesIcon } from '@hugeicons/core-free-icons';
import type { TavilyTool } from '../types';
import { PlaygroundEmptyState } from '../../shared';

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

    return <PlaygroundEmptyState icon={copy.icon} title={copy.title} body={copy.body} />;
}
