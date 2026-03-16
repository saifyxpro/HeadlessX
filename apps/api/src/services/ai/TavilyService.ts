import { tavily } from '@tavily/core';

export type TavilySearchInput = {
    query: string;
    searchDepth: 'basic' | 'advanced';
    topic: 'general' | 'news' | 'finance';
    maxResults: number;
    includeAnswer: boolean;
    includeImages: boolean;
    includeRawContent: false | 'markdown' | 'text';
    includeDomains?: string[];
    excludeDomains?: string[];
    timeRange?: 'day' | 'week' | 'month' | 'year';
    timeout?: number;
};

export type TavilyResearchInput = {
    query: string;
    model: 'auto' | 'mini' | 'pro';
    citationFormat: 'numbered' | 'mla' | 'apa' | 'chicago';
    timeout?: number;
};

class TavilyServiceError extends Error {
    statusCode: number;

    constructor(message: string, statusCode = 500) {
        super(message);
        this.name = 'TavilyServiceError';
        this.statusCode = statusCode;
    }
}

type TavilyClient = ReturnType<typeof tavily>;

class TavilyService {
    private client: TavilyClient | null = null;

    public isConfigured() {
        return Boolean(process.env.TAVILY_API_KEY?.trim());
    }

    private getClient() {
        const apiKey = process.env.TAVILY_API_KEY?.trim();

        if (!apiKey) {
            throw new TavilyServiceError('TAVILY_API_KEY is not configured', 503);
        }

        if (!this.client) {
            this.client = tavily({ apiKey });
        }

        return this.client;
    }

    public async search(input: TavilySearchInput) {
        const client = this.getClient();

        return client.search(input.query, {
            searchDepth: input.searchDepth,
            topic: input.topic,
            maxResults: input.maxResults,
            includeAnswer: input.includeAnswer,
            includeImages: input.includeImages,
            includeRawContent: input.includeRawContent,
            includeDomains: input.includeDomains,
            excludeDomains: input.excludeDomains,
            timeRange: input.timeRange,
            timeout: input.timeout,
        });
    }

    public async startResearch(input: TavilyResearchInput) {
        const client = this.getClient();

        return client.research(input.query, {
            model: input.model,
            citationFormat: input.citationFormat,
            timeout: input.timeout,
        });
    }

    public async getResearch(requestId: string) {
        const client = this.getClient();
        return client.getResearch(requestId);
    }
}

export { TavilyService, TavilyServiceError };
export const tavilyService = new TavilyService();
