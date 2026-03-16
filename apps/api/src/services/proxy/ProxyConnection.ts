import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

export interface ProxyAgentBundle {
    httpAgent?: HttpsProxyAgent<string> | SocksProxyAgent;
    httpsAgent?: HttpsProxyAgent<string> | SocksProxyAgent;
    proxyUrl?: string;
}

export function normalizeConfiguredProxyUrl(proxyUrl?: string | null, protocol = 'http') {
    if (!proxyUrl) {
        return undefined;
    }

    return proxyUrl.includes('://')
        ? proxyUrl
        : `${protocol}://${proxyUrl}`;
}

export function createProxyAgentBundle(proxyUrl?: string | null): ProxyAgentBundle {
    const normalizedProxyUrl = normalizeConfiguredProxyUrl(proxyUrl);

    if (!normalizedProxyUrl) {
        return {};
    }

    const agent = normalizedProxyUrl.startsWith('socks')
        ? new SocksProxyAgent(normalizedProxyUrl)
        : new HttpsProxyAgent(normalizedProxyUrl);

    return {
        httpAgent: agent,
        httpsAgent: agent,
        proxyUrl: normalizedProxyUrl,
    };
}
