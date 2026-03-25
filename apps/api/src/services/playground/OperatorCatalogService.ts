import { exaService } from '../ai/ExaService';
import { tavilyService } from '../ai/TavilyService';
import { youtubeEngineService } from '../media/YoutubeEngineService';

export type OperatorCategory =
    | 'website'
    | 'search'
    | 'media'
    | 'social'
    | 'commerce';

export type OperatorState =
    | 'active'
    | 'configuration_required'
    | 'coming_soon'
    | 'offline';

export interface OperatorRecord {
    id: string;
    name: string;
    tagline: string;
    description: string;
    category: OperatorCategory;
    features: string[];
    playgroundHref: string;
    apiBasePath?: string;
    order: number;
    available: boolean;
    comingSoon: boolean;
    state: OperatorState;
    reason: string | null;
}

type OperatorSeed = Omit<
    OperatorRecord,
    'available' | 'comingSoon' | 'state' | 'reason'
>;

const OPERATOR_SEEDS: OperatorSeed[] = [
    {
        id: 'website',
        name: 'Website',
        tagline: 'Universal web extraction',
        description:
            'Extract HTML, render JavaScript, capture screenshots, crawl pages, and map links with enterprise-grade stealth technology.',
        category: 'website',
        features: ['Extract', 'Crawl', 'Map'],
        playgroundHref: '/playground/operators/website/scrape',
        apiBasePath: '/api/operators/website',
        order: 10,
    },
    {
        id: 'google',
        name: 'Google Search',
        tagline: 'SERP & Intelligence',
        description:
            'Extract organic results, featured snippets, People Also Ask, and more from Google search pages.',
        category: 'search',
        features: ['Organic Results', 'Featured Snippets', 'PAA', 'Maps'],
        playgroundHref: '/playground/operators/google/ai-search',
        apiBasePath: '/api/operators/google/ai-search',
        order: 20,
    },
    {
        id: 'tavily',
        name: 'Tavily',
        tagline: 'Search API workspace',
        description:
            'Prepare Tavily-powered web search and extraction flows with a dedicated workbench shell inside the playground.',
        category: 'search',
        features: ['Search', 'Extract', 'Research'],
        playgroundHref: '/playground/operators/tavily',
        apiBasePath: '/api/operators/tavily',
        order: 30,
    },
    {
        id: 'exa',
        name: 'Exa',
        tagline: 'LLM-first web search',
        description:
            'Search the web with Exa using highlights, text extraction, category filters, and optional deep search synthesis.',
        category: 'search',
        features: ['Search', 'Highlights', 'Deep Search'],
        playgroundHref: '/playground/operators/exa',
        apiBasePath: '/api/operators/exa',
        order: 40,
    },
    {
        id: 'twitter',
        name: 'Twitter / X',
        tagline: 'Social data extraction',
        description:
            'Scrape profiles, tweets, replies, and trends from Twitter/X with automatic authentication handling.',
        category: 'social',
        features: ['Profile Data', 'Tweets', 'Replies', 'Trends'],
        playgroundHref: '/playground/twitter',
        order: 50,
    },
    {
        id: 'linkedin',
        name: 'LinkedIn',
        tagline: 'Professional network data',
        description:
            'Extract public profile data, job postings, and company information from LinkedIn.',
        category: 'social',
        features: ['Profiles', 'Jobs', 'Company Data', 'Posts'],
        playgroundHref: '/playground/linkedin',
        order: 60,
    },
    {
        id: 'instagram',
        name: 'Instagram',
        tagline: 'Visual content scraper',
        description:
            'Download posts, reels, stories, and extract profile analytics from Instagram.',
        category: 'social',
        features: ['Posts', 'Reels', 'Stories', 'Analytics'],
        playgroundHref: '/playground/instagram',
        order: 70,
    },
    {
        id: 'tiktok',
        name: 'TikTok',
        tagline: 'Short-form video data',
        description:
            'Scrape trending videos, hashtags, music usage, and user profiles from TikTok.',
        category: 'social',
        features: ['Videos', 'Hashtags', 'Profiles', 'Music'],
        playgroundHref: '/playground/tiktok',
        order: 80,
    },
    {
        id: 'reddit',
        name: 'Reddit',
        tagline: 'Community discussions',
        description:
            'Extract posts, comments, and sentiment from subreddits and user histories.',
        category: 'social',
        features: ['Subreddits', 'Comments', 'Users', 'Sentiment'],
        playgroundHref: '/playground/reddit',
        order: 90,
    },
    {
        id: 'youtube',
        name: 'YouTube',
        tagline: 'yt-dude extraction',
        description:
            'Extract video metadata, formats, subtitles, and playlist previews through the dedicated yt-dude-powered engine.',
        category: 'media',
        features: ['Metadata', 'Formats', 'Subtitles', 'Playlists'],
        playgroundHref: '/playground/operators/youtube',
        apiBasePath: '/api/operators/youtube',
        order: 100,
    },
    {
        id: 'amazon',
        name: 'Amazon',
        tagline: 'E-commerce intelligence',
        description:
            'Extract product details, pricing, reviews, and best-seller rankings.',
        category: 'commerce',
        features: ['Products', 'Reviews', 'Pricing', 'Bestsellers'],
        playgroundHref: '/playground/amazon',
        order: 110,
    },
    {
        id: 'facebook',
        name: 'Facebook',
        tagline: 'Social graph data',
        description:
            'Extract public pages, posts, and group information with stealth.',
        category: 'social',
        features: ['Pages', 'Posts', 'Groups', 'About'],
        playgroundHref: '/playground/facebook',
        order: 120,
    },
];

class OperatorCatalogService {
    private buildActive(seed: OperatorSeed): OperatorRecord {
        return {
            ...seed,
            available: true,
            comingSoon: false,
            state: 'active',
            reason: null,
        };
    }

    private buildConfigRequired(seed: OperatorSeed, reason: string): OperatorRecord {
        return {
            ...seed,
            available: false,
            comingSoon: false,
            state: 'configuration_required',
            reason,
        };
    }

    private buildComingSoon(seed: OperatorSeed): OperatorRecord {
        return {
            ...seed,
            available: false,
            comingSoon: true,
            state: 'coming_soon',
            reason: 'Coming soon',
        };
    }

    public async listOperators(): Promise<OperatorRecord[]> {
        const byId = new Map(OPERATOR_SEEDS.map((seed) => [seed.id, seed]));
        const operators: OperatorRecord[] = [];

        const website = byId.get('website');
        const google = byId.get('google');
        const tavily = byId.get('tavily');
        const exa = byId.get('exa');
        const youtube = byId.get('youtube');

        if (website) {
            operators.push(this.buildActive(website));
        }

        if (google) {
            operators.push(this.buildActive(google));
        }

        if (tavily) {
            operators.push(
                tavilyService.isConfigured()
                    ? this.buildActive(tavily)
                    : this.buildConfigRequired(tavily, 'Add TAVILY_API_KEY')
            );
        }

        if (exa) {
            operators.push(
                exaService.isConfigured()
                    ? this.buildActive(exa)
                    : this.buildConfigRequired(exa, 'Add EXA_API_KEY')
            );
        }

        if (youtube) {
            operators.push(
                youtubeEngineService.isConfigured()
                    ? this.buildActive(youtube)
                    : this.buildConfigRequired(youtube, 'Set YT_ENGINE_URL to your yt-engine service URL')
            );
        }

        for (const seed of OPERATOR_SEEDS) {
            if (operators.some((operator) => operator.id === seed.id)) {
                continue;
            }

            operators.push(this.buildComingSoon(seed));
        }

        return operators.sort((a, b) => {
            if (a.available !== b.available) {
                return a.available ? -1 : 1;
            }
            return a.order - b.order;
        });
    }
}

export const operatorCatalogService = new OperatorCatalogService();
