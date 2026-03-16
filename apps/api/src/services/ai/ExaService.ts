import Exa, { type ContentsOptions, type SearchResponse } from 'exa-js';

export type ExaSearchType = 'auto' | 'fast' | 'instant' | 'deep';
export type ExaContentMode = 'highlights' | 'text';
export type ExaCategory =
    | 'company'
    | 'research paper'
    | 'news'
    | 'personal site'
    | 'financial report'
    | 'people';

export type ExaSearchInput = {
    query: string;
    type: ExaSearchType;
    numResults: number;
    contentMode: ExaContentMode;
    maxCharacters: number;
    maxAgeHours?: number;
    category?: ExaCategory;
    includeDomains?: string[];
    excludeDomains?: string[];
    systemPrompt?: string;
};

class ExaServiceError extends Error {
    statusCode: number;

    constructor(message: string, statusCode = 500) {
        super(message);
        this.name = 'ExaServiceError';
        this.statusCode = statusCode;
    }
}

class ExaService {
    private client: Exa | null = null;

    public isConfigured() {
        return Boolean(process.env.EXA_API_KEY?.trim());
    }

    private getClient() {
        const apiKey = process.env.EXA_API_KEY?.trim();

        if (!apiKey) {
            throw new ExaServiceError('EXA_API_KEY is not configured', 503);
        }

        if (!this.client) {
            this.client = new Exa(apiKey);
        }

        return this.client;
    }

    public async search(input: ExaSearchInput): Promise<SearchResponse<ContentsOptions>> {
        const client = this.getClient();
        const contents: ContentsOptions = input.contentMode === 'text'
            ? {
                text: { maxCharacters: input.maxCharacters },
            }
            : {
                highlights: {
                    query: input.query,
                    maxCharacters: input.maxCharacters,
                },
            };

        if (typeof input.maxAgeHours === 'number') {
            contents.maxAgeHours = input.maxAgeHours;
        }

        const baseOptions = {
            contents,
            numResults: input.numResults,
            category: input.category,
            includeDomains: input.includeDomains,
            excludeDomains: input.excludeDomains,
        };

        if (input.type === 'deep') {
            return client.search(input.query, {
                ...baseOptions,
                type: 'deep',
                systemPrompt: input.systemPrompt,
                outputSchema: {
                    type: 'text',
                    description: 'A concise grounded synthesis of the most important findings.',
                },
            });
        }

        return client.search(input.query, {
            ...baseOptions,
            type: input.type,
        });
    }
}

export { ExaService, ExaServiceError };
export const exaService = new ExaService();
