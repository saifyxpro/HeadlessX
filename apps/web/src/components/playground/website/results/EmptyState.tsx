import { Search01Icon } from '@hugeicons/core-free-icons';
import type { WebsiteTool } from '../types';
import { PlaygroundEmptyState } from '../../shared';

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

    return <PlaygroundEmptyState icon={Search01Icon} title={copy.title} body={copy.body} />;
}
