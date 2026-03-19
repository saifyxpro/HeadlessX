import { prisma } from '../../database/client';

export interface SystemConfig {
    browserHeadless: boolean;
    browserTimeout: number;
    maxConcurrency: number;
    stealthMode: 'basic' | 'advanced' | 'maximum';

    // Proxy
    proxyEnabled: boolean;
    proxyUrl?: string;
    proxyProtocol?: string;

    // Session behavior
    profileRotation: boolean;
    profileRotationInterval: number;

    // Camoufox browser settings
    camoufoxGeoip: boolean;
    camoufoxBlockWebrtc: boolean;
    camoufoxBlockImages: boolean;
    camoufoxEnableCache: boolean;
    camoufoxHumanize: number;
}

class ConfigService {
    private static instance: ConfigService;
    private memoryCache: SystemConfig | null = null;
    private lastFetch: number = 0;
    private readonly CACHE_TTL = 30000; // 30 seconds
    private constructor() {}

    public static getInstance(): ConfigService {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }

    private buildEnvConfig(): SystemConfig {
        return {
            browserHeadless: process.env.BROWSER_HEADLESS !== 'false',
            browserTimeout: parseInt(process.env.BROWSER_TIMEOUT || '60000'),
            maxConcurrency: parseInt(process.env.MAX_CONCURRENCY || '5'),
            stealthMode: (process.env.STEALTH_MODE as any) || 'advanced',

            proxyEnabled: false,
            proxyUrl: undefined,
            proxyProtocol: 'http',

            profileRotation: process.env.PROFILE_ROTATION_ENABLED === 'true',
            profileRotationInterval: parseInt(process.env.PROFILE_ROTATION_INTERVAL || '3600000'),

            camoufoxGeoip: true,
            camoufoxBlockWebrtc: true,
            camoufoxBlockImages: false,
            camoufoxEnableCache: true,
            camoufoxHumanize: 2.5
        };
    }

    private normalizeConfig(config: Partial<SystemConfig>, base: SystemConfig): SystemConfig {
        const proxyUrl = typeof config.proxyUrl === 'string' && config.proxyUrl.trim()
            ? config.proxyUrl.trim()
            : undefined;

        return {
            ...base,
            ...config,
            proxyUrl,
            proxyProtocol: typeof config.proxyProtocol === 'string' && config.proxyProtocol.trim()
                ? config.proxyProtocol.trim()
                : base.proxyProtocol,
            proxyEnabled: Boolean(config.proxyEnabled && proxyUrl),
        };
    }

    private mapDbConfig(dbConfig: any): SystemConfig {
        return {
            browserHeadless: dbConfig.browser_headless,
            browserTimeout: dbConfig.browser_timeout,
            maxConcurrency: dbConfig.max_concurrency,
            stealthMode: dbConfig.stealth_mode as any,

            proxyEnabled: dbConfig.proxy_enabled,
            proxyUrl: dbConfig.proxy_url || undefined,
            proxyProtocol: dbConfig.proxy_protocol || 'http',

            profileRotation: dbConfig.profile_rotation,
            profileRotationInterval: dbConfig.profile_rotation_interval,

            camoufoxGeoip: dbConfig.camoufox_geoip,
            camoufoxBlockWebrtc: dbConfig.camoufox_block_webrtc,
            camoufoxBlockImages: dbConfig.camoufox_block_images,
            camoufoxEnableCache: dbConfig.camoufox_enable_cache,
            camoufoxHumanize: dbConfig.camoufox_humanize
        };
    }

    private isRetryableDatabaseError(error: unknown): boolean {
        const message = error instanceof Error ? error.message : String(error);
        return ['EAI_AGAIN', 'ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT', 'P1001'].some((code) =>
            message.includes(code)
        );
    }

    private async withDatabaseRetry<T>(operation: () => Promise<T>): Promise<T> {
        try {
            return await operation();
        } catch (error) {
            if (!this.isRetryableDatabaseError(error)) {
                throw error;
            }

            await new Promise((resolve) => setTimeout(resolve, 350));
            return operation();
        }
    }

    /**
     * Get configuration from the database, seeding defaults when empty.
     */
    public async getConfig(): Promise<SystemConfig> {
        const now = Date.now();
        if (this.memoryCache && (now - this.lastFetch < this.CACHE_TTL)) {
            return this.memoryCache;
        }

        const envConfig = this.buildEnvConfig();

        const dbConfig = await this.withDatabaseRetry(() =>
            prisma.systemSettings.findUnique({ where: { id: 1 } })
        );

        if (dbConfig) {
            this.memoryCache = this.mapDbConfig(dbConfig);
        } else {
            await this.seedDefaults(envConfig);
            this.memoryCache = envConfig;
        }

        this.lastFetch = now;
        return this.memoryCache!;
    }

    public async saveConfig(config: SystemConfig): Promise<{ config: SystemConfig; persistedTo: 'database' }> {
        const baseConfig = this.memoryCache ?? (await this.getConfig());
        const normalized = this.normalizeConfig(config, baseConfig);

        const updated = await this.withDatabaseRetry(() =>
            prisma.systemSettings.upsert({
                where: { id: 1 },
                update: {
                    browser_headless: normalized.browserHeadless,
                    browser_timeout: normalized.browserTimeout,
                    max_concurrency: normalized.maxConcurrency,
                    stealth_mode: normalized.stealthMode,
                    proxy_enabled: normalized.proxyEnabled,
                    proxy_url: normalized.proxyUrl || null,
                    proxy_protocol: normalized.proxyProtocol,
                    profile_rotation: normalized.profileRotation,
                    profile_rotation_interval: normalized.profileRotationInterval,
                    camoufox_geoip: normalized.camoufoxGeoip,
                    camoufox_block_webrtc: normalized.camoufoxBlockWebrtc,
                    camoufox_block_images: normalized.camoufoxBlockImages,
                    camoufox_enable_cache: normalized.camoufoxEnableCache,
                    camoufox_humanize: normalized.camoufoxHumanize,
                },
                create: {
                    id: 1,
                    browser_headless: normalized.browserHeadless,
                    browser_timeout: normalized.browserTimeout,
                    max_concurrency: normalized.maxConcurrency,
                    stealth_mode: normalized.stealthMode,
                    proxy_enabled: normalized.proxyEnabled,
                    proxy_url: normalized.proxyUrl || null,
                    proxy_protocol: normalized.proxyProtocol,
                    profile_rotation: normalized.profileRotation,
                    profile_rotation_interval: normalized.profileRotationInterval,
                    camoufox_geoip: normalized.camoufoxGeoip,
                    camoufox_block_webrtc: normalized.camoufoxBlockWebrtc,
                    camoufox_block_images: normalized.camoufoxBlockImages,
                    camoufox_enable_cache: normalized.camoufoxEnableCache,
                    camoufox_humanize: normalized.camoufoxHumanize,
                }
            })
        );

        this.memoryCache = this.mapDbConfig(updated);
        this.lastFetch = Date.now();

        return {
            config: this.memoryCache,
            persistedTo: 'database',
        };
    }

    /**
     * Force refresh cache - call after config updates
     */
    public invalidateCache(): void {
        this.memoryCache = null;
        this.lastFetch = 0;
    }

    private async seedDefaults(config: SystemConfig) {
        try {
            await this.withDatabaseRetry(() =>
                prisma.systemSettings.create({
                data: {
                    id: 1,
                    browser_headless: config.browserHeadless,
                    browser_timeout: config.browserTimeout,
                    max_concurrency: config.maxConcurrency,
                    stealth_mode: config.stealthMode,

                    proxy_enabled: config.proxyEnabled,
                    proxy_url: config.proxyUrl,
                    proxy_protocol: config.proxyProtocol,

                    profile_rotation: config.profileRotation,
                    profile_rotation_interval: config.profileRotationInterval,

                    // Camoufox browser settings
                    camoufox_geoip: config.camoufoxGeoip,
                    camoufox_block_webrtc: config.camoufoxBlockWebrtc,
                    camoufox_block_images: config.camoufoxBlockImages,
                    camoufox_enable_cache: config.camoufoxEnableCache,
                    camoufox_humanize: config.camoufoxHumanize
                }
                })
            );
            console.log('✅ ConfigService: Seeded default settings to DB.');
        } catch (e) {
            // Ignore unique constraint violation or connection error
        }
    }
}

export const configService = ConfigService.getInstance();
