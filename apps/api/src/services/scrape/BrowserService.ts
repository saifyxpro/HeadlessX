import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Headfox } from 'headfox-js';
import { BrowserContext, Page } from 'playwright-core';
import { configService } from '../config/ConfigService';
import { normalizeConfiguredProxyUrl } from '../proxy/ProxyConnection';

type BrowserLaunchMode = 'headless' | 'interactive' | 'virtual';

interface BrowserContextOptions {
    stealth?: boolean;
    launchMode?: BrowserLaunchMode;
    allowDuringInteractiveSession?: boolean;
    cookieBootstrap?: boolean;
}

interface ViewportSize {
    width: number;
    height: number;
}

type CookieReadyMarkerReason = 'stopped' | 'browser_closed' | 'existing_profile';

interface CookieReadyMarker {
    savedAt: string;
    reason: CookieReadyMarkerReason;
}

export interface GoogleCookieBootstrapStatus {
    status: 'required' | 'running' | 'ready';
    ready: boolean;
    required: boolean;
    running: boolean;
    launchMode: BrowserLaunchMode | null;
    hasDisplay: boolean;
    usingVirtualDisplay: boolean;
    activePages: number;
    profileDir: string;
    usesSharedProfile: true;
    startedAt: string | null;
    message: string;
}

class BrowserService {
    private static instance: BrowserService;
    private persistentContext: BrowserContext | null = null;
    private launchPromise: Promise<BrowserContext> | null = null;
    private activePages = 0;
    private readonly profileDir: string;
    private readonly cookieReadyMarkerPath: string;
    private cachedViewport: ViewportSize | null = null;
    private cachedViewportMode: BrowserLaunchMode | null = null;
    private currentLaunchMode: BrowserLaunchMode | null = null;
    private cookieBootstrapActive = false;
    private cookieBootstrapStartedAt: string | null = null;
    private cookieBootstrapUsingVirtualDisplay = false;

    private constructor() {
        this.profileDir = this.resolveProfileDir();
        this.cookieReadyMarkerPath = path.join(this.profileDir, '.google-cookie-ready.json');
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
        return path.join(appRoot, 'data', 'browser-profile', 'default');
    }

    private isContextReady(context: BrowserContext | null): context is BrowserContext {
        return Boolean(context && context.browser()?.isConnected());
    }

    private hasSystemDisplay(): boolean {
        if (process.platform !== 'linux') {
            return true;
        }

        return Boolean(process.env.DISPLAY?.trim());
    }

    private readCookieReadyMarker(): CookieReadyMarker | null {
        try {
            if (!fs.existsSync(this.cookieReadyMarkerPath)) {
                return null;
            }

            return JSON.parse(fs.readFileSync(this.cookieReadyMarkerPath, 'utf8')) as CookieReadyMarker;
        } catch {
            return null;
        }
    }

    private hasProfileArtifacts(): boolean {
        try {
            return fs
                .readdirSync(this.profileDir)
                .some((entry) => entry !== path.basename(this.cookieReadyMarkerPath));
        } catch {
            return false;
        }
    }

    private hasLegacyGoogleSessionData(): boolean {
        const googlePaths = [
            path.join(this.profileDir, 'storage', 'default', 'https+++www.google.com'),
            path.join(this.profileDir, 'storage', 'default', 'https+++google.com'),
        ];

        return googlePaths.some((targetPath) => fs.existsSync(targetPath));
    }

    private writeCookieReadyMarker(reason: CookieReadyMarkerReason): void {
        const payload: CookieReadyMarker = {
            savedAt: new Date().toISOString(),
            reason,
        };

        fs.mkdirSync(this.profileDir, { recursive: true });
        fs.writeFileSync(this.cookieReadyMarkerPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    }

    private ensureCookieReadyState(): boolean {
        if (this.readCookieReadyMarker()) {
            return true;
        }

        if (this.hasLegacyGoogleSessionData()) {
            this.writeCookieReadyMarker('existing_profile');
            return true;
        }

        return false;
    }

    private finalizeCookieBootstrap(reason: CookieReadyMarkerReason): void {
        if (!this.cookieBootstrapActive) {
            return;
        }

        if (this.hasProfileArtifacts()) {
            this.writeCookieReadyMarker(reason);
        }
        this.cookieBootstrapActive = false;
        this.cookieBootstrapStartedAt = null;
        this.cookieBootstrapUsingVirtualDisplay = false;
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

    private resolveViewport(mode: BrowserLaunchMode): ViewportSize {
        if (this.cachedViewport && this.cachedViewportMode === mode) {
            return this.cachedViewport;
        }

        const override = this.parseViewportOverride();
        if (override) {
            this.cachedViewport = override;
            this.cachedViewportMode = mode;
            return override;
        }

        if (mode === 'interactive') {
            const detected = this.detectLinuxDisplayViewport();
            if (detected) {
                this.cachedViewport = detected;
                this.cachedViewportMode = mode;
                return detected;
            }
        }

        const fallback = mode === 'headless'
            ? { width: 1366, height: 768 }
            : { width: 1440, height: 900 };
        this.cachedViewport = fallback;
        this.cachedViewportMode = mode;
        return fallback;
    }

    private resolveRequestedLaunchMode(
        browserHeadless: boolean,
        options?: BrowserContextOptions
    ): BrowserLaunchMode {
        if (options?.launchMode) {
            return options.launchMode;
        }

        return browserHeadless ? 'headless' : 'interactive';
    }

    private resolveHeadlessOption(mode: BrowserLaunchMode): boolean | 'virtual' {
        if (mode === 'virtual') {
            return 'virtual';
        }

        return mode === 'headless';
    }

    private ensureInteractiveSessionAvailable(options?: BrowserContextOptions): void {
        if (this.cookieBootstrapActive && !options?.allowDuringInteractiveSession) {
            throw new Error(
                'Google cookie browser is running. Stop Browser before starting automated jobs.'
            );
        }
    }

    private async ensureModeTransition(requestedMode: BrowserLaunchMode): Promise<void> {
        if (!this.isContextReady(this.persistentContext) || this.currentLaunchMode === requestedMode) {
            return;
        }

        if (this.activePages > 0) {
            throw new Error(
                'Browser is busy with active pages. Wait for active jobs to finish before changing the shared profile mode.'
            );
        }

        this.cachedViewport = null;
        this.cachedViewportMode = null;
        await this.closeAll();
    }

    private async launchPersistentContext(options?: BrowserContextOptions): Promise<BrowserContext> {
        const config = await configService.getConfig();
        const launchMode = this.resolveRequestedLaunchMode(config.browserHeadless, options);
        const viewport = this.resolveViewport(launchMode);

        const proxyServer = config.proxyEnabled
            ? normalizeConfiguredProxyUrl(config.proxyUrl, config.proxyProtocol)
            : undefined;

        const proxyConfig = proxyServer ? { server: proxyServer } : undefined;

        const headfoxOptions: any = {
            headless: this.resolveHeadlessOption(launchMode),
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
                useragentoverride: '',
                'general.appversion.override': '',
                'general.platform.override': '',
            },
        };

        const launchLabel =
            launchMode === 'virtual'
                ? 'Headfox JS profile on a virtual display'
                : launchMode === 'interactive'
                    ? 'Headfox JS profile'
                    : 'Headfox JS profile';

        console.log(`🦊 Launching persistent ${launchLabel} at ${this.profileDir} (${viewport.width}x${viewport.height})`);
        const context = (await Headfox(headfoxOptions)) as BrowserContext;

        this.currentLaunchMode = launchMode;

        if (options?.cookieBootstrap) {
            this.cookieBootstrapActive = true;
            this.cookieBootstrapStartedAt = new Date().toISOString();
            this.cookieBootstrapUsingVirtualDisplay = launchMode === 'virtual';
        }

        context.browser()?.once('disconnected', () => {
            if (this.cookieBootstrapActive) {
                this.finalizeCookieBootstrap('browser_closed');
            }

            if (this.persistentContext === context) {
                this.persistentContext = null;
                this.currentLaunchMode = null;
                this.activePages = 0;
            }
        });

        console.log('✅ Persistent Headfox JS profile ready');
        return context;
    }

    private async getPersistentContext(options?: BrowserContextOptions): Promise<BrowserContext> {
        this.ensureInteractiveSessionAvailable(options);

        const config = await configService.getConfig();
        const requestedMode = this.resolveRequestedLaunchMode(config.browserHeadless, options);

        await this.ensureModeTransition(requestedMode);

        if (this.isContextReady(this.persistentContext)) {
            return this.persistentContext;
        }

        if (this.launchPromise) {
            return this.launchPromise;
        }

        this.launchPromise = (async () => {
            const context = await this.launchPersistentContext({
                ...options,
                launchMode: requestedMode,
            });
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
        return this.cachedViewport ?? this.resolveViewport(this.currentLaunchMode ?? 'interactive');
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

        if (this.cookieBootstrapActive) {
            this.finalizeCookieBootstrap('stopped');
        }

        this.currentLaunchMode = null;
        this.activePages = 0;
        console.log('✅ Persistent browser context closed');
    }

    public async restartBrowser(): Promise<void> {
        console.log('🔄 Restarting persistent browser profile...');
        this.cachedViewport = null;
        this.cachedViewportMode = null;
        await this.closeAll();
        await this.warmup();
        console.log('✅ Persistent browser profile restarted');
    }

    public getGoogleCookieBootstrapStatus(): GoogleCookieBootstrapStatus {
        const ready = this.ensureCookieReadyState();
        const running = this.cookieBootstrapActive && this.isContextReady(this.persistentContext);
        const required = !ready;
        const hasDisplay = this.hasSystemDisplay();
        const launchMode = running ? this.currentLaunchMode : null;

        let message = 'Shared Google profile is ready for automated searches.';
        if (running) {
            message = this.cookieBootstrapUsingVirtualDisplay
                ? 'Cookie session is running on a virtual display. Solve Google prompts, then stop the browser to save the shared profile.'
                : 'Cookie session is running. Solve Google prompts, then stop the browser to save the shared profile.';
        } else if (required) {
            message = 'Build cookies once before running Google AI Search so the shared profile looks like a normal Google user session.';
        }

        return {
            status: running ? 'running' : required ? 'required' : 'ready',
            ready,
            required,
            running,
            launchMode,
            hasDisplay,
            usingVirtualDisplay: running ? this.cookieBootstrapUsingVirtualDisplay : !hasDisplay,
            activePages: this.activePages,
            profileDir: this.profileDir,
            usesSharedProfile: true,
            startedAt: running ? this.cookieBootstrapStartedAt : null,
            message,
        };
    }

    public async startGoogleCookieBootstrap(): Promise<GoogleCookieBootstrapStatus> {
        if (this.activePages > 0) {
            throw new Error(
                'Wait for active browser jobs to finish before building Google cookies.'
            );
        }

        if (this.cookieBootstrapActive && this.isContextReady(this.persistentContext)) {
            return this.getGoogleCookieBootstrapStatus();
        }

        if (this.isContextReady(this.persistentContext)) {
            await this.closeAll();
        }

        const launchMode: BrowserLaunchMode = this.hasSystemDisplay() ? 'interactive' : 'virtual';
        const context = await this.getPersistentContext({
            launchMode,
            allowDuringInteractiveSession: true,
            cookieBootstrap: true,
        });

        const page = context.pages().at(-1) ?? (await context.newPage());
        await this.applyViewport(page);

        try {
            await page.goto('https://www.google.com/', {
                waitUntil: 'domcontentloaded',
                timeout: 30000,
            });
        } catch (error) {
            console.warn(
                '⚠️ Google cookie bootstrap started, but Google did not open automatically:',
                error
            );
        }

        try {
            await page.bringToFront();
        } catch {
            // Ignore focus errors for virtual displays.
        }

        return this.getGoogleCookieBootstrapStatus();
    }

    public async stopGoogleCookieBootstrap(): Promise<GoogleCookieBootstrapStatus> {
        if (!this.cookieBootstrapActive) {
            return this.getGoogleCookieBootstrapStatus();
        }

        await this.closeAll();
        return this.getGoogleCookieBootstrapStatus();
    }

    public getStatus(): {
        default: boolean;
        activePages: number;
        profileDir: string;
        viewport: ViewportSize;
        launchMode: BrowserLaunchMode | null;
        cookieBootstrap: GoogleCookieBootstrapStatus;
    } {
        return {
            default: this.isContextReady(this.persistentContext),
            activePages: this.activePages,
            profileDir: this.profileDir,
            viewport: this.getViewportSize(),
            launchMode: this.currentLaunchMode,
            cookieBootstrap: this.getGoogleCookieBootstrapStatus(),
        };
    }
}

export const browserService = BrowserService.getInstance();
