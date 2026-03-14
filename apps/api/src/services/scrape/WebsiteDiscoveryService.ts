import axios from 'axios';
import { configService } from '../config/ConfigService';
import { createProxyAgentBundle, normalizeConfiguredProxyUrl } from '../proxy/ProxyConnection';
import { scraperService } from './ScraperService';
import type { StreamProgress } from './StreamingScraperService';
import {
    extractLinksFromHtml,
    extractLinksFromSitemap,
    mergeWebsiteLinks,
    summarizeWebsiteLinks,
    type WebsiteLink,
} from './WebsiteLinkUtils';

export interface MapRequestInput {
    url: string;
    limit?: number;
    includeSubdomains?: boolean;
    includeExternal?: boolean;
    useSitemap?: boolean;
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
        const totalSteps = request.useSitemap === false ? 4 : 5;

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
        const pageLinks = extractLinksFromHtml(scrapeResult.html, scrapeResult.url, {
            includeExternal: request.includeExternal,
            includeSubdomains: request.includeSubdomains,
            limit,
        });
        report(3, `Collected ${pageLinks.length} page links`, 'completed');

        const sitemapLinks = request.useSitemap === false
            ? []
            : await this.fetchSitemapLinks(scrapeResult.url, limit, {
                timeout: request.timeout,
                includeExternal: request.includeExternal,
                includeSubdomains: request.includeSubdomains,
                abortSignal: context.abortSignal,
                onProgress: (message, status) => {
                    report(4, message, status);
                },
            });

        throwIfCancelled();
        const links = mergeWebsiteLinks(pageLinks, sitemapLinks).slice(0, limit);
        const finalStep = request.useSitemap === false ? 4 : 5;
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
