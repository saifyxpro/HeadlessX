import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { Camoufox } from 'camoufox-js';
import { BrowserContext, Page } from 'playwright-core';
import { configService } from '../config/ConfigService';
import { normalizeConfiguredProxyUrl } from '../proxy/ProxyConnection';

interface BrowserContextOptions {
    stealth?: boolean;
}

interface ViewportSize {
    width: number;
    height: number;
}

class BrowserService {
    private static instance: BrowserService;
    private persistentContext: BrowserContext | null = null;
    private launchPromise: Promise<BrowserContext> | null = null;
    private activePages = 0;
    private readonly profileDir: string;
    private cachedViewport: ViewportSize | null = null;

    private constructor() {
        this.profileDir = this.resolveProfileDir();
        fs.mkdirSync(this.profileDir, { recursive: true });
    }

    public static getInstance(): BrowserService {
        if (!BrowserService.instance) {
            BrowserService.instance = new BrowserService();
        }
        return BrowserService.instance;
    }

    private resolveProfileDir(): string {
        const configuredDir = process.env.BROWSER_PROFILE_DIR?.trim();
        if (configuredDir) {
            return path.resolve(configuredDir);
        }

        const currentDir = path.dirname(fileURLToPath(import.meta.url));
        const appRoot = path.resolve(currentDir, '../../..');
        const localProfileDir = path.join(appRoot, 'data', 'browser-profile', 'default');
        const bundledProfileDir = path.join(appRoot, 'default-data', 'browser-profile', 'default');

        if (fs.existsSync(localProfileDir)) {
            return localProfileDir;
        }

        if (fs.existsSync(bundledProfileDir)) {
            return bundledProfileDir;
        }

        return localProfileDir;
    }

    private isContextReady(context: BrowserContext | null): context is BrowserContext {
        return Boolean(context && context.browser()?.isConnected());
    }

    private parseViewportOverride(): ViewportSize | null {
        const widthValue = process.env.BROWSER_WINDOW_WIDTH?.trim();
        const heightValue = process.env.BROWSER_WINDOW_HEIGHT?.trim();

        if (!widthValue || !heightValue) {
            return null;
        }

        const width = Number.parseInt(widthValue, 10);
        const height = Number.parseInt(heightValue, 10);

        if (!Number.isFinite(width) || !Number.isFinite(height) || width < 800 || height < 600) {
            console.warn('⚠️ Ignoring invalid BROWSER_WINDOW_WIDTH/BROWSER_WINDOW_HEIGHT override');
            return null;
        }

        return { width, height };
    }

    private detectLinuxDisplayViewport(): ViewportSize | null {
        if (process.platform !== 'linux' || !process.env.DISPLAY) {
            return null;
        }

        const parsers = [
            () => {
                const output = execFileSync('xrandr', ['--current'], {
                    encoding: 'utf8',
                    stdio: ['ignore', 'pipe', 'ignore'],
                });
                const match = output.match(/current\s+(\d+)\s+x\s+(\d+)/i);
                if (!match) {
                    return null;
                }

                return {
                    width: Number.parseInt(match[1], 10),
                    height: Number.parseInt(match[2], 10),
                };
            },
            () => {
                const output = execFileSync('xdpyinfo', [], {
                    encoding: 'utf8',
                    stdio: ['ignore', 'pipe', 'ignore'],
                });
                const match = output.match(/dimensions:\s+(\d+)x(\d+)\s+pixels/i);
                if (!match) {
                    return null;
                }

                return {
                    width: Number.parseInt(match[1], 10),
                    height: Number.parseInt(match[2], 10),
                };
            },
        ];

        for (const parse of parsers) {
            try {
                const detected = parse();
                if (detected && detected.width >= 800 && detected.height >= 600) {
                    return detected;
                }
            } catch {
                // Try the next detector.
            }
        }

        return null;
    }

    private resolveViewport(headless: boolean): ViewportSize {
        if (this.cachedViewport) {
            return this.cachedViewport;
        }

        const override = this.parseViewportOverride();
        if (override) {
            this.cachedViewport = override;
            return override;
        }

        if (!headless) {
            const detected = this.detectLinuxDisplayViewport();
            if (detected) {
                this.cachedViewport = detected;
                return detected;
            }
        }

        const fallback = headless
            ? { width: 1366, height: 768 }
            : { width: 1440, height: 900 };
        this.cachedViewport = fallback;
        return fallback;
    }

    private async launchPersistentContext(_options?: BrowserContextOptions): Promise<BrowserContext> {
        const config = await configService.getConfig();
        const viewport = this.resolveViewport(config.browserHeadless);

        const proxyServer = config.proxyEnabled
            ? normalizeConfiguredProxyUrl(config.proxyUrl, config.proxyProtocol)
            : undefined;

        const proxyConfig = proxyServer ? { server: proxyServer } : undefined;

        const camoufoxOptions: any = {
            headless: config.browserHeadless,
            proxy: proxyConfig,
            geoip: proxyConfig ? config.camoufoxGeoip : false,
            os: 'windows',
            humanize: config.camoufoxHumanize ?? 2.5,
            block_webrtc: config.camoufoxBlockWebrtc ?? true,
            block_images: config.camoufoxBlockImages ?? false,
            enable_cache: config.camoufoxEnableCache ?? true,
            window: [viewport.width, viewport.height],
            user_data_dir: this.profileDir,
            firefox_user_prefs: {
                'privacy.resistFingerprinting': false,
                'dom.webdriver.enabled': false,
                'useragentoverride': '',
                'general.appversion.override': '',
                'general.platform.override': '',
            },
        };

        console.log(`🦊 Launching persistent Camoufox profile at ${this.profileDir} (${viewport.width}x${viewport.height})`);
        const context = await Camoufox(camoufoxOptions) as BrowserContext;

        context.browser()?.once('disconnected', () => {
            if (this.persistentContext === context) {
                this.persistentContext = null;
                this.activePages = 0;
            }
        });

        console.log('✅ Persistent Camoufox profile ready');
        return context;
    }

    private async getPersistentContext(options?: BrowserContextOptions): Promise<BrowserContext> {
        if (this.isContextReady(this.persistentContext)) {
            return this.persistentContext;
        }

        if (this.launchPromise) {
            return this.launchPromise;
        }

        this.launchPromise = (async () => {
            const context = await this.launchPersistentContext(options);
            this.persistentContext = context;
            return context;
        })();

        try {
            return await this.launchPromise;
        } finally {
            this.launchPromise = null;
        }
    }

    public async warmup(options?: BrowserContextOptions): Promise<void> {
        await this.getPersistentContext(options);
    }

    public async getPage(options?: BrowserContextOptions): Promise<{ page: Page; context: BrowserContext }> {
        const context = await this.getPersistentContext(options);
        const page = await context.newPage();
        await page.setViewportSize(this.getViewportSize());
        this.activePages += 1;

        return { page, context };
    }

    public getViewportSize(): ViewportSize {
        return this.cachedViewport ?? this.resolveViewport(false);
    }

    public async applyViewport(page: Page): Promise<void> {
        await page.setViewportSize(this.getViewportSize());
    }

    public async release(context: BrowserContext, page?: Page) {
        try {
            if (page && !page.isClosed()) {
                await page.close();
            }

            if (context !== this.persistentContext) {
                await context.close();
            }
        } catch {
            // Ignore release errors during shutdown or caller cleanup.
        } finally {
            if (this.activePages > 0) {
                this.activePages -= 1;
            }
        }
    }

    public async closeAll() {
        if (this.launchPromise) {
            try {
                await this.launchPromise;
            } catch {
                // Ignore launch errors during shutdown.
            }
        }

        if (this.persistentContext) {
            try {
                await this.persistentContext.close();
            } catch {
                // Ignore close errors during shutdown.
            }
            this.persistentContext = null;
        }

        this.activePages = 0;
        console.log('✅ Persistent browser context closed');
    }

    public async restartBrowser(): Promise<void> {
        console.log('🔄 Restarting persistent browser profile...');
        await this.closeAll();
        await this.warmup();
        console.log('✅ Persistent browser profile restarted');
    }

    public getStatus(): { default: boolean; activePages: number; profileDir: string; viewport: ViewportSize } {
        return {
            default: this.isContextReady(this.persistentContext),
            activePages: this.activePages,
            profileDir: this.profileDir,
            viewport: this.getViewportSize(),
        };
    }
}

export const browserService = BrowserService.getInstance();
