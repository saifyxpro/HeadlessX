import { CodeSquareIcon } from '@hugeicons/core-free-icons';

export type HugeiconType = typeof CodeSquareIcon;

export type OutputType = 'html' | 'html-js' | 'markdown' | 'screenshot';
export type WebsiteTool = 'scrape' | 'crawl' | 'map';

export interface ProgressStep {
    step: number;
    total: number;
    message: string;
    status: 'pending' | 'active' | 'completed' | 'error';
}

export interface OutputTypeOption {
    id: OutputType;
    label: string;
    icon: HugeiconType;
}

export interface ScrapeHtmlData {
    html: string;
    title?: string;
    metadata?: Record<string, unknown>;
}

export interface ScrapeMarkdownData {
    markdown: string;
    title?: string;
    metadata?: Record<string, unknown>;
}

export interface CrawlPageData {
    url: string;
    title: string;
    depth: number;
    markdown: string;
    excerpt: string;
    linkCount: number;
    statusCode?: number;
    metadata?: Record<string, unknown>;
}

export interface CrawlResultData {
    summary: {
        seedUrl: string;
        requestedLimit: number;
        pagesCrawled: number;
        failureCount: number;
        discoveredCount: number;
        maxDepthReached: number;
        generatedAt: string;
    };
    pages: CrawlPageData[];
    failures: Array<{
        url: string;
        depth: number;
        error: string;
    }>;
    combinedMarkdown: string;
}

export interface MapLinkData {
    url: string;
    label: string | null;
    source: 'page' | 'sitemap' | 'both';
    internal: boolean;
    hostname: string;
    pathname: string;
}

export interface MapResultData {
    url: string;
    title: string;
    summary: {
        total: number;
        internal: number;
        external: number;
        sitemap: number;
        page: number;
        both: number;
    };
    links: MapLinkData[];
    generatedAt: string;
}

export type ScrapeResult =
    | {
        type: 'html' | 'html-js';
        data: ScrapeHtmlData;
    }
    | {
        type: 'markdown';
        data: ScrapeMarkdownData;
    }
    | {
        type: 'image';
        data: string;
    }
    | {
        type: 'crawl';
        data: CrawlResultData;
    }
    | {
        type: 'map';
        data: MapResultData;
    }
    | {
        type: 'error';
        data: string;
    };
