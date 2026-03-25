
export interface SerpResult {
    ai_overview: string | null;
    sites: Array<{
        title: string;
        description: string;
        source: string;
        url: string;
    }>;
}

export interface SearchResponse {
    query: string;
    timestamp: string;
    results: SerpResult;
    markdown: string;
}

export interface ProgressStep {
    step: number;
    total: number;
    message: string;
    status: 'pending' | 'active' | 'completed' | 'error';
}

export interface GoogleSerpConfig {
    query: string;
    region: string;
    language: string;
    timeFilter: string;
    timeout: number;
}

export interface GoogleCookieStatus {
    status: 'required' | 'running' | 'ready';
    ready: boolean;
    required: boolean;
    running: boolean;
    launchMode: 'headless' | 'interactive' | 'virtual' | null;
    hasDisplay: boolean;
    usingVirtualDisplay: boolean;
    activePages: number;
    profileDir: string;
    usesSharedProfile: true;
    startedAt: string | null;
    message: string;
}
