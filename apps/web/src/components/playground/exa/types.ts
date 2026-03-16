export type ExaSearchType = 'auto' | 'fast' | 'instant' | 'deep';
export type ExaContentMode = 'highlights' | 'text';
export interface ExaProgressStep {
    step: number;
    total: number;
    message: string;
    status: 'pending' | 'active' | 'completed' | 'error';
}

export type ExaCategory =
    | 'all'
    | 'company'
    | 'research paper'
    | 'news'
    | 'personal site'
    | 'financial report'
    | 'people';

export interface ExaGroundingCitation {
    url: string;
    title: string;
}

export interface ExaGroundingItem {
    field: string;
    citations: ExaGroundingCitation[];
    confidence: 'low' | 'medium' | 'high';
}

export interface ExaOutput {
    content: string | Record<string, unknown>;
    grounding?: ExaGroundingItem[];
}

export interface ExaSearchResultItem {
    title: string | null;
    url: string;
    publishedDate?: string;
    author?: string;
    score?: number;
    id: string;
    image?: string;
    favicon?: string;
    text?: string;
    highlights?: string[];
    highlightScores?: number[];
}

export interface ExaSearchResponse {
    requestId?: string;
    autoDate?: string;
    resolvedSearchType?: string;
    searchTime?: number;
    output?: ExaOutput;
    results?: ExaSearchResultItem[];
}
