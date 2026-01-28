import { LucideIcon } from 'lucide-react';

export type OutputType = 'html' | 'html-js' | 'html-css-js' | 'content' | 'screenshot' | 'pdf';

export interface ScrapeResult {
    type: 'html' | 'html-js' | 'html-css-js' | 'content' | 'image' | 'pdf' | 'error';
    data: string | {
        html?: string;
        markdown?: string;
        title?: string;
        styles?: string[];
        scripts?: string[];
        inlineStyles?: string;
        inlineScripts?: string;
    };
}

export interface ProgressStep {
    step: number;
    total: number;
    message: string;
    status: 'pending' | 'active' | 'completed' | 'error';
}

export interface Profile {
    id: string;
    name: string;
    is_running: boolean;
    screen_width: number;
    screen_height: number;
    locale: string;
}

export interface OutputTypeOption {
    id: OutputType;
    label: string;
    icon: LucideIcon;
}
