import { Search01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { WebsiteTool } from '../types';

export function EmptyState({ tool }: { tool: WebsiteTool }) {
    const copy = tool === 'scrape'
        ? {
            title: 'Ready to scrape',
            body: 'Run a one-page extraction and the result preview will appear here.',
        }
        : tool === 'crawl'
            ? {
                title: 'Ready to crawl',
                body: 'Queue a crawl job and this panel will turn into a page list with markdown previews.',
            }
            : {
                title: 'Ready to map',
                body: 'Run discovery and the link inventory will render here without horizontal overflow.',
            };

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,1),rgba(241,245,249,1))] ring-1 ring-slate-200">
                <HugeiconsIcon icon={Search01Icon} className="h-10 w-10 text-slate-300" />
            </div>
            <p className="text-lg font-bold text-slate-700">{copy.title}</p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{copy.body}</p>
        </div>
    );
}
