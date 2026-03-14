import type { StreamProgress } from './StreamingScraperService';
import { streamingScraperService } from './StreamingScraperService';
import { extractLinksFromHtml, type WebsiteLink } from './WebsiteLinkUtils';

export interface CrawlRequestInput {
    url: string;
    limit?: number;
    maxDepth?: number;
    includeSubdomains?: boolean;
    waitForSelector?: string;
    timeout?: number;
    stealth?: boolean;
}

export interface CrawlPageResult {
    url: string;
    title: string;
    depth: number;
    markdown: string;
    excerpt: string;
    linkCount: number;
    statusCode?: number;
    metadata?: Record<string, unknown>;
}

export interface CrawlFailure {
    url: string;
    depth: number;
    error: string;
}

export interface CrawlExecutionResult {
    success: boolean;
    cancelled?: boolean;
    error?: string;
    code?: string;
    url: string;
    duration: number;
    data?: {
        summary: {
            seedUrl: string;
            requestedLimit: number;
            pagesCrawled: number;
            failureCount: number;
            discoveredCount: number;
            maxDepthReached: number;
            generatedAt: string;
        };
        pages: CrawlPageResult[];
        failures: CrawlFailure[];
        combinedMarkdown: string;
    };
}

interface CrawlContext {
    jobId?: string;
    abortSignal?: AbortSignal;
    onProgress: (progress: StreamProgress) => void;
}

function buildExcerpt(markdown: string) {
    return markdown
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`[^`]*`/g, ' ')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[>#*_~-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 220);
}

function describeProgress(url: string, message: string) {
    const shortUrl = url.length > 64 ? `${url.slice(0, 61)}...` : url;
    return `${message} • ${shortUrl}`;
}

class WebsiteCrawlService {
    private static instance: WebsiteCrawlService;

    public static getInstance() {
        if (!WebsiteCrawlService.instance) {
            WebsiteCrawlService.instance = new WebsiteCrawlService();
        }
        return WebsiteCrawlService.instance;
    }

    public async crawl(payload: CrawlRequestInput, context: CrawlContext): Promise<CrawlExecutionResult> {
        const startedAt = Date.now();
        const limit = Math.max(1, Math.min(payload.limit ?? 10, 100));
        const maxDepth = Math.max(0, Math.min(payload.maxDepth ?? 1, 4));
        const pages: CrawlPageResult[] = [];
        const failures: CrawlFailure[] = [];
        const queued: Array<{ url: string; depth: number }> = [{ url: payload.url, depth: 0 }];
        const visited = new Set<string>([payload.url]);

        const throwIfCancelled = () => {
            if (context.abortSignal?.aborted) {
                const error = new Error('Job cancelled');
                error.name = 'JobCancelledError';
                throw error;
            }
        };

        while (queued.length > 0 && pages.length < limit) {
            throwIfCancelled();
            const current = queued.shift()!;
            const step = pages.length + failures.length + 1;

            context.onProgress({
                step,
                total: limit,
                message: describeProgress(current.url, 'Starting page'),
                status: 'active',
            });

            const result = await streamingScraperService.scrapeWithProgress(
                current.url,
                'content',
                {
                    jobId: context.jobId,
                    abortSignal: context.abortSignal,
                    waitForSelector: payload.waitForSelector,
                    timeout: payload.timeout,
                    stealth: payload.stealth,
                },
                (progress) => {
                    context.onProgress({
                        step,
                        total: limit,
                        message: describeProgress(current.url, progress.message),
                        status: progress.status === 'completed' ? 'active' : progress.status,
                    });
                }
            );

            if (result.cancelled || context.abortSignal?.aborted) {
                return {
                    success: false,
                    cancelled: true,
                    error: 'Job cancelled',
                    code: 'JOB_CANCELLED',
                    url: payload.url,
                    duration: Date.now() - startedAt,
                };
            }

            if (!result.success || !result.html || !result.markdown) {
                failures.push({
                    url: current.url,
                    depth: current.depth,
                    error: result.error || 'Page crawl failed',
                });

                context.onProgress({
                    step,
                    total: limit,
                    message: describeProgress(current.url, result.error || 'Page crawl failed'),
                    status: 'error',
                });
                continue;
            }

            const discoveredLinks = extractLinksFromHtml(result.html, current.url, {
                includeExternal: false,
                includeSubdomains: payload.includeSubdomains,
                limit: limit * 8,
            });

            pages.push({
                url: current.url,
                title: result.title || current.url,
                depth: current.depth,
                markdown: result.markdown,
                excerpt: buildExcerpt(result.markdown),
                linkCount: discoveredLinks.length,
                statusCode: result.statusCode,
                metadata: result.metadata as Record<string, unknown> | undefined,
            });

            if (current.depth < maxDepth) {
                for (const link of discoveredLinks) {
                    if (visited.has(link.url) || visited.size >= limit) {
                        continue;
                    }

                    visited.add(link.url);
                    queued.push({ url: link.url, depth: current.depth + 1 });
                }
            }

            context.onProgress({
                step,
                total: limit,
                message: describeProgress(current.url, 'Page stored'),
                status: 'completed',
            });
        }

        if (pages.length === 0 && failures.length > 0) {
            return {
                success: false,
                error: failures[0].error,
                url: payload.url,
                duration: Date.now() - startedAt,
            };
        }

        const combinedMarkdown = pages
            .map((page) => `# ${page.title}\n\nSource: ${page.url}\n\n${page.markdown}`)
            .join('\n\n---\n\n');

        return {
            success: true,
            url: payload.url,
            duration: Date.now() - startedAt,
            data: {
                summary: {
                    seedUrl: payload.url,
                    requestedLimit: limit,
                    pagesCrawled: pages.length,
                    failureCount: failures.length,
                    discoveredCount: visited.size,
                    maxDepthReached: pages.reduce((deepest, page) => Math.max(deepest, page.depth), 0),
                    generatedAt: new Date().toISOString(),
                },
                pages,
                failures,
                combinedMarkdown,
            },
        };
    }
}

export const websiteCrawlService = WebsiteCrawlService.getInstance();
