import { useDeferredValue, useEffect, useState } from 'react';
import type { MapLinkData, ScrapeResult } from '../types';

export function useWebsiteResultState(result: ScrapeResult | null) {
    const [expanded, setExpanded] = useState(false);
    const [viewRaw, setViewRaw] = useState(false);
    const [copied, setCopied] = useState(false);
    const [selectedCrawlPageUrl, setSelectedCrawlPageUrl] = useState<string | null>(null);
    const [mapQuery, setMapQuery] = useState('');
    const deferredMapQuery = useDeferredValue(mapQuery);

    useEffect(() => {
        setExpanded(false);
        setViewRaw(false);
        setCopied(false);
        setMapQuery('');

        if (result?.type === 'crawl') {
            setSelectedCrawlPageUrl(result.data.pages[0]?.url || null);
            return;
        }

        setSelectedCrawlPageUrl(null);
    }, [result]);

    const selectedCrawlPage = result?.type === 'crawl'
        ? result.data.pages.find((page) => page.url === selectedCrawlPageUrl) || result.data.pages[0] || null
        : null;

    const filteredMapLinks: MapLinkData[] = result?.type === 'map'
        ? result.data.links.filter((link) => {
            const query = deferredMapQuery.trim().toLowerCase();
            if (!query) {
                return true;
            }

            return [link.url, link.label || '', link.hostname, link.pathname, link.source]
                .some((value) => value.toLowerCase().includes(query));
        })
        : [];

    return {
        expanded,
        setExpanded,
        viewRaw,
        setViewRaw,
        copied,
        setCopied,
        selectedCrawlPage,
        setSelectedCrawlPageUrl,
        mapQuery,
        setMapQuery,
        filteredMapLinks,
    };
}
