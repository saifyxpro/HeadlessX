import { JSDOM } from 'jsdom';

export type WebsiteLinkSource = 'page' | 'sitemap' | 'both';

export interface WebsiteLink {
    url: string;
    label: string | null;
    source: WebsiteLinkSource;
    internal: boolean;
    hostname: string;
    pathname: string;
}

export interface LinkFilterOptions {
    includeSubdomains?: boolean;
    includeExternal?: boolean;
    limit?: number;
    seedUrl?: string;
    includePaths?: string[];
    excludePaths?: string[];
    crawlEntireDomain?: boolean;
    ignoreQueryParameters?: boolean;
}

const NON_WEB_PROTOCOLS = new Set([
    'mailto:',
    'tel:',
    'javascript:',
    'data:',
    'ftp:',
    'ftps:',
    'file:',
    'sms:',
]);

const SOCIAL_MEDIA_HOST_SNIPPETS = [
    'facebook.com',
    'twitter.com',
    'x.com',
    'linkedin.com',
    'instagram.com',
    'pinterest.com',
    'tiktok.com',
    'youtube.com',
    'github.com',
    'discord.gg',
    'discord.com',
    'calendly.com',
];

const BLOCKED_FILE_EXTENSIONS = new Set([
    '.png', '.jpg', '.jpeg', '.gif', '.css', '.js', '.ico', '.svg', '.tiff', '.zip', '.exe', '.dmg',
    '.mp4', '.mp3', '.wav', '.pptx', '.xlsx', '.avi', '.flv', '.woff', '.woff2', '.ttf', '.webp', '.pdf',
]);

const TRACKING_QUERY_PARAMS = new Set([
    'fbclid',
    'gclid',
    'mc_cid',
    'mc_eid',
    'ref',
    'ref_src',
    'utm_campaign',
    'utm_content',
    'utm_medium',
    'utm_source',
    'utm_term',
]);

function trimTrailingSlash(pathname: string) {
    if (pathname === '/') {
        return pathname;
    }

    return pathname.replace(/\/+$/, '') || '/';
}

function toCleanPathname(pathname: string) {
    return trimTrailingSlash(pathname || '/');
}

function isBlockedFilePath(pathname: string) {
    const lowerPathname = pathname.toLowerCase();
    for (const extension of BLOCKED_FILE_EXTENSIONS) {
        if (lowerPathname.endsWith(extension)) {
            return true;
        }
    }

    return false;
}

function isSocialMediaUrl(url: URL) {
    const hostname = url.hostname.toLowerCase();
    return SOCIAL_MEDIA_HOST_SNIPPETS.some((domain) => hostname.includes(domain));
}

function matchesPatternList(value: string, patterns?: string[]) {
    if (!patterns || patterns.length === 0) {
        return false;
    }

    for (const pattern of patterns) {
        try {
            if (new RegExp(pattern).test(value)) {
                return true;
            }
        } catch {
            // Ignore invalid patterns rather than failing discovery entirely.
        }
    }

    return false;
}

function isWithinScopedPath(targetUrl: URL, seedUrl?: string) {
    if (!seedUrl) {
        return true;
    }

    try {
        const seed = new URL(seedUrl);
        const seedPath = toCleanPathname(seed.pathname);
        const targetPath = toCleanPathname(targetUrl.pathname);

        if (seedPath === '/') {
            return true;
        }

        return targetPath === seedPath || targetPath.startsWith(`${seedPath}/`);
    } catch {
        return true;
    }
}

function matchesPathFilters(targetUrl: URL, options: LinkFilterOptions) {
    const pathValue = toCleanPathname(targetUrl.pathname);

    if (matchesPatternList(pathValue, options.excludePaths)) {
        return false;
    }

    if (options.includePaths && options.includePaths.length > 0) {
        return matchesPatternList(pathValue, options.includePaths);
    }

    return true;
}

function mergeSource(current: WebsiteLinkSource, next: WebsiteLinkSource): WebsiteLinkSource {
    if (current === next) {
        return current;
    }

    return 'both';
}

export function normalizeWebsiteUrl(
    rawUrl: string,
    baseUrl?: string,
    options: { ignoreQueryParameters?: boolean } = {}
) {
    try {
        const trimmed = rawUrl.trim();
        const lowerValue = trimmed.toLowerCase();

        for (const protocol of NON_WEB_PROTOCOLS) {
            if (lowerValue.startsWith(protocol)) {
                return null;
            }
        }

        const parsed = baseUrl ? new URL(trimmed, baseUrl) : new URL(trimmed);

        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return null;
        }

        parsed.hash = '';

        if (options.ignoreQueryParameters) {
            parsed.search = '';
        } else {
            for (const [key] of parsed.searchParams.entries()) {
                if (TRACKING_QUERY_PARAMS.has(key.toLowerCase())) {
                    parsed.searchParams.delete(key);
                }
            }

            if (!parsed.search) {
                parsed.search = '';
            }
        }

        parsed.pathname = toCleanPathname(parsed.pathname);

        if (isBlockedFilePath(parsed.pathname)) {
            return null;
        }

        return parsed.toString();
    } catch {
        return null;
    }
}

export function isInternalWebsiteUrl(targetUrl: string, baseUrl: string, includeSubdomains = false) {
    try {
        const target = new URL(targetUrl);
        const base = new URL(baseUrl);

        if (target.hostname === base.hostname) {
            return true;
        }

        if (!includeSubdomains) {
            return false;
        }

        return target.hostname.endsWith(`.${base.hostname}`);
    } catch {
        return false;
    }
}

function sanitizeLabel(value: string | null | undefined) {
    const label = value?.replace(/\s+/g, ' ').trim() || '';
    return label.length > 0 ? label : null;
}

export function mergeWebsiteLinks(...groups: WebsiteLink[][]) {
    const merged = new Map<string, WebsiteLink>();

    for (const group of groups) {
        for (const link of group) {
            const existing = merged.get(link.url);

            if (!existing) {
                merged.set(link.url, link);
                continue;
            }

            merged.set(link.url, {
                ...existing,
                label: existing.label || link.label,
                source: mergeSource(existing.source, link.source),
            });
        }
    }

    return Array.from(merged.values()).sort((left, right) => {
        if (left.internal !== right.internal) {
            return left.internal ? -1 : 1;
        }

        return left.url.localeCompare(right.url);
    });
}

function buildWebsiteLink(
    candidateUrl: string,
    baseUrl: string,
    source: WebsiteLinkSource,
    options: LinkFilterOptions,
    label?: string | null
) {
    const normalizedUrl = normalizeWebsiteUrl(candidateUrl, baseUrl, {
        ignoreQueryParameters: options.ignoreQueryParameters,
    });

    if (!normalizedUrl) {
        return null;
    }

    const internal = isInternalWebsiteUrl(normalizedUrl, baseUrl, options.includeSubdomains);

    if (!internal && !options.includeExternal) {
        return null;
    }

    const parsed = new URL(normalizedUrl);

    if (internal && options.crawlEntireDomain === false && !isWithinScopedPath(parsed, options.seedUrl || baseUrl)) {
        return null;
    }

    if (!matchesPathFilters(parsed, options)) {
        return null;
    }

    if (isSocialMediaUrl(parsed)) {
        return null;
    }

    return {
        url: normalizedUrl,
        label: sanitizeLabel(label),
        source,
        internal,
        hostname: parsed.hostname,
        pathname: `${parsed.pathname}${parsed.search}`,
    } satisfies WebsiteLink;
}

export function extractLinksFromHtml(
    html: string,
    pageUrl: string,
    options: LinkFilterOptions = {}
) {
    const dom = new JSDOM(html);
    const baseHref = dom.window.document.querySelector('base[href]')?.getAttribute('href') || pageUrl;
    const links = new Map<string, WebsiteLink>();
    const anchors = Array.from(dom.window.document.querySelectorAll('a[href]')) as Array<{
        getAttribute: (name: string) => string | null;
        textContent: string | null;
    }>;

    for (const anchor of anchors) {
        const href = anchor.getAttribute('href');
        if (!href || href.startsWith('#')) {
            continue;
        }

        const link = buildWebsiteLink(
            href,
            baseHref,
            'page',
            options,
            anchor.textContent
        );

        if (!link || link.url === normalizeWebsiteUrl(pageUrl, baseHref, { ignoreQueryParameters: options.ignoreQueryParameters })) {
            continue;
        }

        if (!links.has(link.url)) {
            links.set(link.url, link);
        }

        if (options.limit && links.size >= options.limit) {
            break;
        }
    }

    return Array.from(links.values());
}

function decodeXmlEntities(value: string) {
    return value
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

function extractSitemapLocsWithDom(sitemapXml: string) {
    try {
        const dom = new JSDOM(sitemapXml, { contentType: 'text/xml' });
        return Array.from(dom.window.document.getElementsByTagName('loc'))
            .map((node) => (node as Element).textContent?.trim() || '')
            .filter(Boolean);
    } catch {
        return [];
    }
}

function extractSitemapLocsWithRegex(sitemapXml: string) {
    return Array.from(sitemapXml.matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc>/gi))
        .map((match) => decodeXmlEntities(match[1]?.trim() || ''))
        .filter(Boolean);
}

export function extractLinksFromSitemap(
    sitemapXml: string,
    pageUrl: string,
    options: LinkFilterOptions = {}
) {
    const links = new Map<string, WebsiteLink>();
    const locs = extractSitemapLocsWithDom(sitemapXml);
    const values = locs.length > 0 ? locs : extractSitemapLocsWithRegex(sitemapXml);

    for (const rawValue of values) {
        if (!rawValue) {
            continue;
        }

        const link = buildWebsiteLink(rawValue, pageUrl, 'sitemap', options);
        if (!link) {
            continue;
        }

        if (!links.has(link.url)) {
            links.set(link.url, link);
        }

        if (options.limit && links.size >= options.limit) {
            break;
        }
    }

    return Array.from(links.values());
}

export function extractWebsiteMetadata(html: string, pageUrl: string) {
    const dom = new JSDOM(html, { url: pageUrl });
    const document = dom.window.document;
    const getMeta = (...selectors: string[]) => {
        for (const selector of selectors) {
            const content = document.querySelector(selector)?.getAttribute('content')?.trim();
            if (content) {
                return content;
            }
        }
        return undefined;
    };

    const faviconHref = document.querySelector('link[rel="icon"], link[rel*="icon"]')?.getAttribute('href');
    const canonicalHref = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
    const baseHref = document.querySelector('base[href]')?.getAttribute('href');
    const normalizedCanonicalUrl = canonicalHref ? normalizeWebsiteUrl(canonicalHref, pageUrl) : undefined;
    const normalizedFaviconUrl = faviconHref ? normalizeWebsiteUrl(faviconHref, pageUrl) : undefined;
    const normalizedBaseUrl = baseHref ? normalizeWebsiteUrl(baseHref, pageUrl) : undefined;
    const jsonLdCount = document.querySelectorAll('script[type="application/ld+json"]').length;

    return {
        title: document.title || undefined,
        language: document.documentElement.getAttribute('lang') || undefined,
        canonicalUrl: normalizedCanonicalUrl,
        baseUrl: normalizedBaseUrl,
        favicon: normalizedFaviconUrl,
        description: getMeta('meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]'),
        keywords: getMeta('meta[name="keywords"]'),
        author: getMeta('meta[name="author"]'),
        robots: getMeta('meta[name="robots"]'),
        image: getMeta('meta[property="og:image"]', 'meta[name="twitter:image"]'),
        siteName: getMeta('meta[property="og:site_name"]'),
        publishedTime: getMeta('meta[property="article:published_time"]'),
        modifiedTime: getMeta('meta[property="article:modified_time"]'),
        jsonLdCount,
    };
}

export function summarizeWebsiteLinks(links: WebsiteLink[]) {
    const summary = {
        total: links.length,
        internal: 0,
        external: 0,
        sitemap: 0,
        page: 0,
        both: 0,
    };

    for (const link of links) {
        if (link.internal) {
            summary.internal += 1;
        } else {
            summary.external += 1;
        }

        if (link.source === 'sitemap') {
            summary.sitemap += 1;
        } else if (link.source === 'page') {
            summary.page += 1;
        } else {
            summary.both += 1;
        }
    }

    return summary;
}
