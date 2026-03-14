import axios from 'axios';
import { configService } from '../config/ConfigService';
import { createProxyAgentBundle, normalizeConfiguredProxyUrl } from '../proxy/ProxyConnection';
import { scraperService } from './ScraperService';
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

class WebsiteDiscoveryService {
    private static instance: WebsiteDiscoveryService;

    public static getInstance() {
        if (!WebsiteDiscoveryService.instance) {
            WebsiteDiscoveryService.instance = new WebsiteDiscoveryService();
        }
        return WebsiteDiscoveryService.instance;
    }

    public async map(request: MapRequestInput): Promise<MapResult> {
        const limit = request.limit ?? 75;
        const scrapeResult = await scraperService.scrape(request.url, {
            waitForSelector: request.waitForSelector,
            timeout: request.timeout,
            stealth: request.stealth,
            screenshotOnError: false,
            jsEnabled: true,
        });

        const pageLinks = extractLinksFromHtml(scrapeResult.html, scrapeResult.url, {
            includeExternal: request.includeExternal,
            includeSubdomains: request.includeSubdomains,
            limit,
        });

        const sitemapLinks = request.useSitemap === false
            ? []
            : await this.fetchSitemapLinks(scrapeResult.url, limit, {
                timeout: request.timeout,
                includeExternal: request.includeExternal,
                includeSubdomains: request.includeSubdomains,
            });

        const links = mergeWebsiteLinks(pageLinks, sitemapLinks).slice(0, limit);

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
        }
    ) {
        const origin = new URL(pageUrl).origin;
        const rootSitemapUrl = `${origin}/sitemap.xml`;
        const toVisit = [rootSitemapUrl];
        const visited = new Set<string>();
        const discovered: WebsiteLink[] = [];

        while (toVisit.length > 0 && visited.size < 6 && discovered.length < limit) {
            const sitemapUrl = toVisit.shift();
            if (!sitemapUrl || visited.has(sitemapUrl)) {
                continue;
            }

            visited.add(sitemapUrl);

            try {
                const xml = await this.fetchText(sitemapUrl, options.timeout);
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
