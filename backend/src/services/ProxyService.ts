import { prisma } from '../database/client';
import axios from 'axios';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';

export interface ProxyTestResult {
    success: boolean;
    latency?: number;
    ip?: string;
    country?: string;
    city?: string;
    isp?: string;
    error?: string;
}

export interface ProxyData {
    name: string;
    protocol: string;
    host: string;
    port: number;
    username?: string;
    password?: string;
    country?: string;
    is_rotating?: boolean;
}

export interface Proxy {
    id: string;
    name: string;
    protocol: string;
    host: string;
    port: number;
    username?: string | null;
    password?: string | null;
    country?: string | null;
    is_active: boolean;
    is_rotating: boolean;
    is_working: boolean;
    avg_latency?: number | null;
    last_checked?: Date | null;
    created_at: Date;
    updated_at: Date;
}

class ProxyService {
    private static instance: ProxyService;

    public static getInstance(): ProxyService {
        if (!ProxyService.instance) {
            ProxyService.instance = new ProxyService();
        }
        return ProxyService.instance;
    }

    /**
     * Get all proxies
     */
    public async getAll(): Promise<Proxy[]> {
        const proxies = await prisma.proxy.findMany({
            orderBy: { created_at: 'desc' },
        });
        return proxies as Proxy[];
    }

    /**
     * Get active proxies only
     */
    public async getActive(): Promise<Proxy[]> {
        const proxies = await prisma.proxy.findMany({
            where: { is_active: true },
            orderBy: { name: 'asc' },
        });
        return proxies as Proxy[];
    }

    /**
     * Get proxy by ID
     */
    public async getById(id: string): Promise<Proxy | null> {
        const proxy = await prisma.proxy.findUnique({
            where: { id },
        });
        return proxy as Proxy | null;
    }

    /**
     * Create a new proxy
     */
    public async create(data: ProxyData): Promise<Proxy> {
        const proxy = await prisma.proxy.create({
            data: {
                name: data.name,
                protocol: data.protocol || 'http',
                host: data.host,
                port: data.port,
                username: data.username,
                password: data.password,
                country: data.country,
                is_rotating: data.is_rotating || false,
            },
        });
        return proxy as Proxy;
    }

    /**
     * Update a proxy
     */
    public async update(id: string, data: Partial<ProxyData>): Promise<Proxy> {
        const proxy = await prisma.proxy.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.protocol && { protocol: data.protocol }),
                ...(data.host && { host: data.host }),
                ...(data.port && { port: data.port }),
                ...(data.username !== undefined && { username: data.username }),
                ...(data.password !== undefined && { password: data.password }),
                ...(data.country !== undefined && { country: data.country }),
                ...(data.is_rotating !== undefined && { is_rotating: data.is_rotating }),
            },
        });
        return proxy as Proxy;
    }

    /**
     * Delete a proxy
     */
    public async delete(id: string): Promise<void> {
        // First, remove proxy reference from any profiles using it
        await prisma.profile.updateMany({
            where: { proxy_id: id },
            data: { proxy_id: null },
        });

        await prisma.proxy.delete({
            where: { id },
        });
    }

    /**
     * Toggle proxy active status
     */
    public async toggleActive(id: string): Promise<Proxy> {
        const proxy = await prisma.proxy.findUnique({ where: { id } });
        if (!proxy) {
            throw new Error('Proxy not found');
        }

        const updated = await prisma.proxy.update({
            where: { id },
            data: { is_active: !proxy.is_active },
        });
        return updated as Proxy;
    }

    /**
     * Test proxy connection with lightweight Node.js request (axios + agent)
     * Faster and more reliable than launching a full browser for connectivity checks.
     */
    public async testConnection(id: string): Promise<ProxyTestResult> {
        const proxy = await prisma.proxy.findUnique({ where: { id } });
        if (!proxy) {
            return { success: false, error: 'Proxy not found' };
        }

        const startTime = Date.now();

        try {
            let agent;
            const auth = proxy.username ? `${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password || '')}@` : '';
            const host = proxy.host;
            const port = proxy.port;
            const protocol = proxy.protocol.toLowerCase();

            // Construct Agent based on protocol
            if (protocol.startsWith('socks')) {
                // SOCKS5/4 (socks-proxy-agent handles both, mostly socks5)
                const proxyUrl = `socks5://${auth}${host}:${port}`;
                console.log(`Testing SOCKS proxy: ${host}:${port} (${protocol})`);
                agent = new SocksProxyAgent(proxyUrl);
            } else {
                // HTTP/HTTPS
                const proxyUrl = `http://${auth}${host}:${port}`;
                console.log(`Testing HTTP proxy: ${host}:${port}`);
                agent = new HttpsProxyAgent(proxyUrl);
            }

            // Test with robust IP service (ip-api.com is fast and reliable for proxies)
            // We use HTTP endpoint to avoid SSL handshake issues with some cheaper proxies, 
            // but the agent handles the tunnel.
            const response = await axios.get('http://ip-api.com/json/', {
                httpAgent: agent,
                httpsAgent: agent,
                timeout: 15000, // 15s timeout
                validateStatus: (status) => status === 200
            });

            const latency = Date.now() - startTime;
            const ipData = response.data;

            if (!ipData || (!ipData.query && !ipData.ip)) {
                throw new Error('Invalid response from IP check service');
            }

            const result: ProxyTestResult = {
                success: true,
                latency,
                ip: ipData.query || ipData.ip || 'Unknown',
                country: ipData.country || ipData.countryCode || 'Unknown',
                city: ipData.city || 'Unknown',
                isp: ipData.isp || ipData.org || 'Unknown',
            };

            await prisma.proxy.update({
                where: { id },
                data: {
                    is_working: true,
                    is_active: true, // Auto-activate on success
                    avg_latency: latency,
                    last_checked: new Date(),
                    country: result.country !== 'Unknown' ? result.country : proxy.country,
                },
            });

            return result;

        } catch (error: any) {
            console.error('Proxy Test Error:', error.message);

            // Extract meaningful error message
            let errorMessage = error.message || 'Connection failed';

            // Map common Node.js network errors to user-friendly messages
            if (error.code === 'ENOTFOUND') errorMessage = 'DNS Error: Proxy host could not be resolved';
            if (error.code === 'ECONNREFUSED') errorMessage = 'Connection Refused (Port closed or blocked)';
            if (error.code === 'ETIMEDOUT') errorMessage = 'Connection Timed Out';
            if (error.response?.status === 407) errorMessage = 'Authentication Failed (Check username/password)';
            if (error.response?.status === 403) errorMessage = 'Proxy Forbidden (Check IP whitelist)';

            await prisma.proxy.update({
                where: { id },
                data: {
                    is_working: false,
                    is_active: false, // Auto-deactivate on failure
                    last_checked: new Date(),
                },
            });

            return {
                success: false,
                error: errorMessage,
                latency: Date.now() - startTime
            };
        }
    }

    /**
     * Get proxy URL string for use in browser
     */
    public getProxyUrl(proxy: Proxy): string {
        let url = `${proxy.protocol}://`;
        if (proxy.username && proxy.password) {
            url += `${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password)}@`;
        }
        url += `${proxy.host}:${proxy.port}`;
        return url;
    }

    /**
     * Parse a proxy URL string into components
     */
    public parseProxyUrl(proxyUrl: string): Partial<ProxyData> | null {
        try {
            const url = new URL(proxyUrl);
            return {
                protocol: url.protocol.replace(':', ''),
                host: url.hostname,
                port: parseInt(url.port, 10),
                username: url.username || undefined,
                password: url.password || undefined,
            };
        } catch {
            return null;
        }
    }
}

export const proxyService = ProxyService.getInstance();
