import axios from 'axios';
import { configService } from '../config/ConfigService';
import { createProxyAgentBundle, normalizeConfiguredProxyUrl } from '../proxy/ProxyConnection';
import { scraperService } from './ScraperService';
import type { StreamProgress } from './StreamingScraperService';
import {
    extractLinksFromHtml,
    extractLinksFromSitemap,
    mergeWebsiteLinks,
    normalizeWebsiteUrl,
    summarizeWebsiteLinks,
    type WebsiteLink,
    type LinkFilterOptions,
} from './WebsiteLinkUtils';

export interface MapRequestInput {
    url: string;
    limit?: number;
    includeSubdomains?: boolean;
    includeExternal?: boolean;
    useSitemap?: boolean;
    maxDiscoveryDepth?: number;
    includePaths?: string[];
    excludePaths?: string[];
    crawlEntireDomain?: boolean;
    ignoreQueryParameters?: boolean;
    timeout?: number;
    stealth?: boolean;
    waitForSelector?: string;
}

export interface MapResult {
    url: string;
    title: string;
    summary: ReturnType<typeof summarizeWebsiteLinks>;
    links: WebsiteLink[];
    generatedAt: string;
}

interface MapExecutionContext {
    abortSignal?: AbortSignal;
    onProgress?: (progress: StreamProgress) => void;
}

class WebsiteDiscoveryService {
    private static instance: WebsiteDiscoveryService;

    public static getInstance() {
        if (!WebsiteDiscoveryService.instance) {
            WebsiteDiscoveryService.instance = new WebsiteDiscoveryService();
        }
        return WebsiteDiscoveryService.instance;
    }

    public async map(request: MapRequestInput, context: MapExecutionContext = {}): Promise<MapResult> {
        const limit = request.limit ?? 75;
        const maxDiscoveryDepth = Math.max(0, Math.min(request.maxDiscoveryDepth ?? 1, 3));
        const totalSteps = request.useSitemap === false ? 5 : 6;
        const linkFilterOptions: LinkFilterOptions = {
            includeExternal: request.includeExternal,
            includeSubdomains: request.includeSubdomains,
            limit,
            seedUrl: request.url,
            includePaths: request.includePaths,
            excludePaths: request.excludePaths,
            crawlEntireDomain: request.crawlEntireDomain ?? true,
            ignoreQueryParameters: request.ignoreQueryParameters ?? true,
        };

        const throwIfCancelled = () => {
            if (context.abortSignal?.aborted) {
                const error = new Error('Job cancelled');
                error.name = 'JobCancelledError';
                throw error;
            }
        };

        const report = (step: number, message: string, status: StreamProgress['status']) => {
            context.onProgress?.({
                step,
                total: totalSteps,
                message,
                status,
            });
        };

        throwIfCancelled();
        report(1, 'Launching browser', 'active');
        const scrapeResult = await scraperService.scrape(request.url, {
            waitForSelector: request.waitForSelector,
            timeout: request.timeout,
            stealth: request.stealth,
            screenshotOnError: false,
            jsEnabled: true,
        });
        throwIfCancelled();
        report(1, 'Browser ready', 'completed');

        report(2, 'Opening target page', 'active');
        report(2, 'Target page ready', 'completed');

        report(3, 'Extracting page links', 'active');
        const pageLinks = extractLinksFromHtml(scrapeResult.html, scrapeResult.url, linkFilterOptions);
        report(3, `Collected ${pageLinks.length} page links`, 'completed');

        let recursiveLinks: WebsiteLink[] = [];
        let recursivelyScannedPages = 0;
        report(4, maxDiscoveryDepth > 0 ? 'Scanning linked pages' : 'Skipping linked page expansion', 'active');

        if (maxDiscoveryDepth > 0 && pageLinks.length > 0) {
            const recursiveDiscovery = await this.discoverAdditionalLinks(
                scrapeResult.url,
                pageLinks,
                maxDiscoveryDepth,
                request,
                linkFilterOptions,
                context,
                limit
            );
            recursiveLinks = recursiveDiscovery.links;
            recursivelyScannedPages = recursiveDiscovery.pagesScanned;
        }

        report(
            4,
            recursivelyScannedPages > 0
                ? `Expanded discovery across ${recursivelyScannedPages} linked page${recursivelyScannedPages === 1 ? '' : 's'}`
                : 'Linked page expansion complete',
            'completed'
        );

        const sitemapLinks = request.useSitemap === false
            ? []
            : await this.fetchSitemapLinks(scrapeResult.url, limit, {
                timeout: request.timeout,
                includeExternal: request.includeExternal,
                includeSubdomains: request.includeSubdomains,
                includePaths: request.includePaths,
                excludePaths: request.excludePaths,
                crawlEntireDomain: request.crawlEntireDomain,
                ignoreQueryParameters: request.ignoreQueryParameters,
                seedUrl: request.url,
                abortSignal: context.abortSignal,
                onProgress: (message, status) => {
                    report(5, message, status);
                },
            });

        throwIfCancelled();
        const links = mergeWebsiteLinks(pageLinks, recursiveLinks, sitemapLinks).slice(0, limit);
        const finalStep = request.useSitemap === false ? 5 : 6;
        report(finalStep, 'Building map results', 'active');
        report(finalStep, `Prepared ${links.length} links`, 'completed');

        return {
            url: scrapeResult.url,
            title: scrapeResult.title,
            summary: summarizeWebsiteLinks(links),
            links,
            generatedAt: new Date().toISOString(),
        };
    }

    private async fetchSitemapLinks(
        pageUrl: string,
        limit: number,
        options: {
            timeout?: number;
            includeSubdomains?: boolean;
            includeExternal?: boolean;
            includePaths?: string[];
            excludePaths?: string[];
            crawlEntireDomain?: boolean;
            ignoreQueryParameters?: boolean;
            seedUrl?: string;
            abortSignal?: AbortSignal;
            onProgress?: (message: string, status: StreamProgress['status']) => void;
        }
    ) {
        const origin = new URL(pageUrl).origin;
        const rootSitemapUrl = `${origin}/sitemap.xml`;
        const toVisit = [rootSitemapUrl];
        const visited = new Set<string>();
        const discovered: WebsiteLink[] = [];

        const throwIfCancelled = () => {
            if (options.abortSignal?.aborted) {
                const error = new Error('Job cancelled');
                error.name = 'JobCancelledError';
                throw error;
            }
        };

        options.onProgress?.('Checking sitemap sources', 'active');

        while (toVisit.length > 0 && visited.size < 6 && discovered.length < limit) {
            throwIfCancelled();
            const sitemapUrl = toVisit.shift();
            if (!sitemapUrl || visited.has(sitemapUrl)) {
                continue;
            }

            visited.add(sitemapUrl);
            options.onProgress?.(`Opening sitemap ${visited.size}`, 'active');

            try {
                const xml = await this.fetchText(sitemapUrl, options.timeout);
                throwIfCancelled();
                const links = extractLinksFromSitemap(xml, pageUrl, {
                    includeExternal: options.includeExternal,
                    includeSubdomains: options.includeSubdomains,
                    includePaths: options.includePaths,
                    excludePaths: options.excludePaths,
                    crawlEntireDomain: options.crawlEntireDomain,
                    ignoreQueryParameters: options.ignoreQueryParameters,
                    seedUrl: options.seedUrl,
                    limit,
                });

                for (const link of links) {
                    if (link.url.endsWith('.xml')) {
                        if (!visited.has(link.url)) {
                            toVisit.push(link.url);
                        }
                        continue;
                    }

                    discovered.push(link);
                    if (discovered.length >= limit) {
                        break;
                    }
                }
            } catch {
                // Sitemap support is opportunistic; failures should not fail the request.
            }
        }

        options.onProgress?.(`Collected ${discovered.length} sitemap links`, 'completed');
        return discovered.slice(0, limit);
    }

    private async discoverAdditionalLinks(
        rootUrl: string,
        seedLinks: WebsiteLink[],
        maxDiscoveryDepth: number,
        request: MapRequestInput,
        linkFilterOptions: LinkFilterOptions,
        context: MapExecutionContext,
        limit: number
    ) {
        const rootNormalized = normalizeWebsiteUrl(rootUrl, undefined, {
            ignoreQueryParameters: linkFilterOptions.ignoreQueryParameters,
        }) || rootUrl;
        const queued = seedLinks
            .filter((link) => link.internal)
            .map((link) => ({ url: link.url, depth: 1 }));
        const queuedSet = new Set(queued.map((item) => item.url));
        const visited = new Set<string>([rootNormalized]);
        const discovered = new Map<string, WebsiteLink>();
        let pagesScanned = 0;

        const throwIfCancelled = () => {
            if (context.abortSignal?.aborted) {
                const error = new Error('Job cancelled');
                error.name = 'JobCancelledError';
                throw error;
            }
        };

        while (queued.length > 0 && discovered.size < limit) {
            throwIfCancelled();
            const current = queued.shift()!;
            queuedSet.delete(current.url);

            if (visited.has(current.url)) {
                continue;
            }

            visited.add(current.url);
            context.onProgress?.({
                step: 4,
                total: request.useSitemap === false ? 5 : 6,
                message: `Scanning linked page ${pagesScanned + 1} at depth ${current.depth}`,
                status: 'active',
            });

            try {
                const scrapeResult = await scraperService.scrape(current.url, {
                    waitForSelector: request.waitForSelector,
                    timeout: request.timeout,
                    stealth: request.stealth,
                    screenshotOnError: false,
                    jsEnabled: true,
                });
                pagesScanned += 1;

                const links = extractLinksFromHtml(scrapeResult.html, scrapeResult.url, linkFilterOptions);
                for (const link of links) {
                    if (link.url === rootNormalized) {
                        continue;
                    }

                    if (!discovered.has(link.url)) {
                        discovered.set(link.url, link);
                    }

                    if (
                        link.internal &&
                        current.depth < maxDiscoveryDepth &&
                        !visited.has(link.url) &&
                        !queuedSet.has(link.url)
                    ) {
                        queued.push({ url: link.url, depth: current.depth + 1 });
                        queuedSet.add(link.url);
                    }

                    if (discovered.size >= limit) {
                        break;
                    }
                }
            } catch {
                // Discovery should continue even if one linked page fails.
            }
        }

        return {
            links: Array.from(discovered.values()).slice(0, limit),
            pagesScanned,
        };
    }

    private async fetchText(url: string, timeout = 20_000) {
        const config = await configService.getConfig();
        const proxyUrl = config.proxyEnabled
            ? normalizeConfiguredProxyUrl(config.proxyUrl, config.proxyProtocol)
            : undefined;
        const agents = createProxyAgentBundle(proxyUrl);

        const response = await axios.get<string>(url, {
            responseType: 'text',
            timeout,
            httpAgent: agents.httpAgent,
            httpsAgent: agents.httpsAgent,
            validateStatus: (status) => status >= 200 && status < 300,
            headers: {
                'User-Agent': 'HeadlessX/2.0 (Website Discovery)',
                Accept: 'application/xml,text/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5',
            },
        });

        return response.data;
    }
}

export const websiteDiscoveryService = WebsiteDiscoveryService.getInstance();
