import { CodeSquareIcon } from '@hugeicons/core-free-icons';

export type HugeiconType = typeof CodeSquareIcon;

export type OutputType = 'html' | 'html-js' | 'content' | 'screenshot';
export type WebsiteTool = 'scrape' | 'crawl';

export interface ScrapeResult {
    type: 'html' | 'html-js' | 'content' | 'image' | 'error';
    data: string | {
        html?: string;
        markdown?: string;
        title?: string;
    };
}

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
