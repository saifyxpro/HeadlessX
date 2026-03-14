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
}

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

function mergeSource(current: WebsiteLinkSource, next: WebsiteLinkSource): WebsiteLinkSource {
    if (current === next) {
        return current;
    }

    return 'both';
}

export function normalizeWebsiteUrl(rawUrl: string, baseUrl?: string) {
    try {
        const parsed = baseUrl ? new URL(rawUrl, baseUrl) : new URL(rawUrl);

        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return null;
        }

        parsed.hash = '';

        for (const [key] of parsed.searchParams.entries()) {
            if (TRACKING_QUERY_PARAMS.has(key.toLowerCase())) {
                parsed.searchParams.delete(key);
            }
        }

        if (!parsed.search) {
            parsed.search = '';
        }

        parsed.pathname = toCleanPathname(parsed.pathname);
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
    const normalizedUrl = normalizeWebsiteUrl(candidateUrl, baseUrl);

    if (!normalizedUrl) {
        return null;
    }

    const internal = isInternalWebsiteUrl(normalizedUrl, baseUrl, options.includeSubdomains);

    if (!internal && !options.includeExternal) {
        return null;
    }

    const parsed = new URL(normalizedUrl);

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
            pageUrl,
            'page',
            options,
            anchor.textContent
        );

        if (!link || link.url === normalizeWebsiteUrl(pageUrl)) {
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

export function extractLinksFromSitemap(
    sitemapXml: string,
    pageUrl: string,
    options: LinkFilterOptions = {}
) {
    const links = new Map<string, WebsiteLink>();
    const matches = sitemapXml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi);

    for (const match of matches) {
        const rawValue = match[1]?.trim();
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
