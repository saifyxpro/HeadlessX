
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

export interface Profile {
    id: string;
    name: string;
    is_running: boolean;
    screen_width: number;
    screen_height: number;
    locale: string;
}

export interface ProgressStep {
    step: number;
    total: number;
    message: string;
    status: 'pending' | 'active' | 'completed' | 'error';
}

export interface GoogleSerpConfig {
    query: string;
    profileId: string;
    country: string; // future-proofing
    language: string; // future-proofing
}
