import { prisma } from '../database/client';

export interface SystemConfig {
    browserHeadless: boolean;
    browserTimeout: number;
    maxConcurrency: number;
    stealthMode: 'basic' | 'advanced' | 'maximum';

    // Proxy
    proxyEnabled: boolean;
    proxyUrl?: string;
    proxyProtocol?: string;

    // Stealth Defaults
    fingerprintProfile: string;
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

    private constructor() { }

    public static getInstance(): ConfigService {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }

    /**
     * Get configuration (DB > Env > Defaults)
     */
    public async getConfig(): Promise<SystemConfig> {
        const now = Date.now();
        if (this.memoryCache && (now - this.lastFetch < this.CACHE_TTL)) {
            return this.memoryCache;
        }

        // Default from Env
        const envConfig: SystemConfig = {
            browserHeadless: process.env.BROWSER_HEADLESS !== 'false',
            browserTimeout: parseInt(process.env.BROWSER_TIMEOUT || '60000'),
            maxConcurrency: parseInt(process.env.MAX_CONCURRENCY || '5'),
            stealthMode: (process.env.STEALTH_MODE as any) || 'advanced',

            proxyEnabled: false,
            proxyUrl: undefined,
            proxyProtocol: 'http',

            fingerprintProfile: process.env.FINGERPRINT_PROFILE || 'desktop-chrome',
            profileRotation: process.env.PROFILE_ROTATION_ENABLED === 'true',
            profileRotationInterval: parseInt(process.env.PROFILE_ROTATION_INTERVAL || '3600000'),

            // Camoufox browser settings
            camoufoxGeoip: true,
            camoufoxBlockWebrtc: true,
            camoufoxBlockImages: false,
            camoufoxEnableCache: true,
            camoufoxHumanize: 2.5
        };

        try {
            // Try fetch from DB
            const dbConfig = await prisma.systemSettings.findUnique({ where: { id: 1 } });
            if (dbConfig) {
                // Merge DB config
                this.memoryCache = {
                    browserHeadless: dbConfig.browser_headless,
                    browserTimeout: dbConfig.browser_timeout,
                    maxConcurrency: dbConfig.max_concurrency,
                    stealthMode: dbConfig.stealth_mode as any,

                    proxyEnabled: dbConfig.proxy_enabled,
                    proxyUrl: dbConfig.proxy_url || undefined,
                    proxyProtocol: dbConfig.proxy_protocol || 'http',

                    fingerprintProfile: dbConfig.fingerprint_profile,
                    profileRotation: dbConfig.profile_rotation,
                    profileRotationInterval: dbConfig.profile_rotation_interval,

                    // Camoufox browser settings
                    camoufoxGeoip: dbConfig.camoufox_geoip,
                    camoufoxBlockWebrtc: dbConfig.camoufox_block_webrtc,
                    camoufoxBlockImages: dbConfig.camoufox_block_images,
                    camoufoxEnableCache: dbConfig.camoufox_enable_cache,
                    camoufoxHumanize: dbConfig.camoufox_humanize
                };
            } else {
                // Initialize DB if empty
                await this.seedDefaults(envConfig);
                this.memoryCache = envConfig;
            }
        } catch (error) {
            console.warn('⚠️ ConfigService: DB connection failed, using Env defaults.', (error as Error).message);
            this.memoryCache = envConfig;
        }

        this.lastFetch = now;
        return this.memoryCache!;
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
            await prisma.systemSettings.create({
                data: {
                    id: 1,
                    browser_headless: config.browserHeadless,
                    browser_timeout: config.browserTimeout,
                    max_concurrency: config.maxConcurrency,
                    stealth_mode: config.stealthMode,

                    proxy_enabled: config.proxyEnabled,
                    proxy_url: config.proxyUrl,
                    proxy_protocol: config.proxyProtocol,

                    fingerprint_profile: config.fingerprintProfile,
                    profile_rotation: config.profileRotation,
                    profile_rotation_interval: config.profileRotationInterval,

                    // Camoufox browser settings
                    camoufox_geoip: config.camoufoxGeoip,
                    camoufox_block_webrtc: config.camoufoxBlockWebrtc,
                    camoufox_block_images: config.camoufoxBlockImages,
                    camoufox_enable_cache: config.camoufoxEnableCache,
                    camoufox_humanize: config.camoufoxHumanize
                }
            });
            console.log('✅ ConfigService: Seeded default settings to DB.');
        } catch (e) {
            // Ignore unique constraint violation or connection error
        }
    }
}

export const configService = ConfigService.getInstance();
