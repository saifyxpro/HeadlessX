export type TavilyTool = 'search' | 'research';
export type TavilySearchDepth = 'basic' | 'advanced';
export type TavilyTopic = 'general' | 'news' | 'finance';
export type TavilyRawContentMode = false | 'markdown' | 'text';
export type TavilyResearchModel = 'auto' | 'mini' | 'pro';
export type TavilyCitationFormat = 'numbered' | 'mla' | 'apa' | 'chicago';

export interface TavilySearchResultItem {
    title: string;
    url: string;
    content?: string;
    rawContent?: string;
    score?: number;
    publishedDate?: string;
    favicon?: string;
}

export interface TavilyImageResult {
    url: string;
    description?: string;
}

export interface TavilySearchResponse {
    requestId?: string;
    query?: string;
    answer?: string;
    results?: TavilySearchResultItem[];
    images?: TavilyImageResult[];
    responseTime?: number;
}

export interface TavilyResearchStartResponse {
    requestId?: string;
    request_id?: string;
    status?: string;
    createdAt?: string;
    created_at?: string;
    model?: string;
    responseTime?: number;
    response_time?: number;
}

export interface TavilyResearchSource {
    title?: string;
    url?: string;
}

export interface TavilyResearchResponse {
    requestId?: string;
    request_id?: string;
    status?: string;
    responseTime?: number;
    response_time?: number;
    content?: string | Record<string, unknown>;
    sources?: TavilyResearchSource[];
}
