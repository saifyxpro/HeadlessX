// Camoufox - Anti-detect Firefox browser with built-in fingerprint spoofing
// Superior stealth compared to Chromium-based solutions
import { Camoufox } from 'camoufox-js';
import { Browser, BrowserContext, Page } from 'playwright-core';
import { configService } from './ConfigService';
import { profileService, type Profile } from './ProfileService';
import path from 'path';
import fs from 'fs';
import { anonymizeProxy, closeAnonymizedProxy } from 'proxy-chain';

interface BrowserContextOptions {
    // Note: stealth is handled at C++ level by Camoufox - no need for JS-level stealth
    proxy?: string;
    profileId?: string;
}

// When using user_data_dir, Camoufox returns a BrowserContext directly
// When not using user_data_dir, it returns a Browser
type CamoufoxInstance = Browser | BrowserContext;

interface ManagedInstance {
    instance: CamoufoxInstance;
    type: 'browser' | 'context'; // true if user_data_dir was used (returns Context)
    proxyChainUrl?: string; // URL of the local proxy server (need to close on exit)
    profileId: string | null;
    createdAt: Date;
}

class BrowserService {
    private static instance: BrowserService;
    private profiles: Map<string, ManagedInstance> = new Map();
    private defaultBrowser: Browser | null = null;
    private isClosing = false;
    private readonly profilesDir: string;

    private constructor() {
        this.profilesDir = path.join(process.cwd(), 'profiles');
        if (!fs.existsSync(this.profilesDir)) {
            fs.mkdirSync(this.profilesDir, { recursive: true });
        }
    }

    public static getInstance(): BrowserService {
        if (!BrowserService.instance) {
            BrowserService.instance = new BrowserService();
        }
        return BrowserService.instance;
    }

    /**
     * Launch Camoufox browser WITHOUT profile (returns Browser)
     */
    private async launchDefaultBrowser(): Promise<Browser> {
        const config = await configService.getConfig();

        let proxyServer: string | undefined;
        if (config.proxyEnabled && config.proxyUrl) {

            if (config.proxyUrl.includes('://')) {
                proxyServer = config.proxyUrl;
            } else {
                proxyServer = `${config.proxyProtocol || 'http'}://${config.proxyUrl}`;
            }
        }

        const proxyConfig = proxyServer ? { server: proxyServer } : undefined;

        console.log(`🦊 Launching Camoufox (Headless: ${config.browserHeadless}, Profile: default, Proxy: ${proxyConfig ? 'Enabled' : 'Disabled'})`);

        const camoufoxOptions: any = {
            headless: config.browserHeadless,
            proxy: proxyConfig,
            geoip: proxyConfig && config.camoufoxGeoip,
            // Enhanced anti-detection settings
            os: 'windows',  // Always use Windows
            humanize: config.camoufoxHumanize ?? 2.5,  // Higher = more human-like
            block_webrtc: config.camoufoxBlockWebrtc ?? true,  // Block WebRTC leaks
            block_images: config.camoufoxBlockImages ?? false,
            enable_cache: config.camoufoxEnableCache ?? true,
            // Fixed viewport size
            window: [1920, 1080],
            // Firefox preferences for enhanced stealth
            firefox_user_prefs: {
                'privacy.resistFingerprinting': false,  // Let Camoufox handle this
                'dom.webdriver.enabled': false,
                'useragentoverride': '',
                'general.appversion.override': '',
                'general.platform.override': '',
            },
        };

        // No user_data_dir = returns Browser
        const browser = await Camoufox(camoufoxOptions) as Browser;
        console.log('✅ Camoufox launched (anti-fingerprint active)');

        return browser;
    }

    /**
     * Launch Camoufox with profile (returns BrowserContext due to user_data_dir)
     */
    private async launchProfileContext(profile: Profile): Promise<BrowserContext> {
        const config = await configService.getConfig();

        // Determine proxy configuration

        let proxyConfig: { server: string; username?: string; password?: string } | undefined;
        let proxyChainUrl: string | undefined; // To store the URL of the local proxy-chain server

        if (profile.proxyUrl) {
            // Custom profile proxy URL
            proxyConfig = { server: profile.proxyUrl };
        } else if (profile.proxy) {
            // Saved proxy from database
            const { protocol, host, port, username, password } = profile.proxy;

            // Sanitize host to prevent double protocol
            const cleanHost = host.replace(/^[a-z0-9]+:\/\//i, '');

            // Construct proxy URL with explicit credentials
            // Format: socks5://user:pass@host:port
            const authPart = username ? `${encodeURIComponent(username)}:${encodeURIComponent(password || '')}@` : '';
            const connectionString = `${protocol}://${authPart}${cleanHost}:${port}`;

            console.log('🔗 Connecting to upstream proxy:', connectionString.replace(/:[^:@]*@/, ':***@'));

            try {
                // Use proxy-chain to handle SOCKS5 authentication and remote DNS
                // This starts a local HTTP proxy server that forwards to the upstream SOCKS5 proxy
                // Firefox connects to 127.0.0.1 (No Auth) -> Node (Auth) -> SOCKS5
                proxyChainUrl = await anonymizeProxy(connectionString);
                console.log(`✅ Local authentication bridge created: ${proxyChainUrl}`);

                proxyConfig = {
                    server: proxyChainUrl, // Use the local authenticated bridge
                };
            } catch (e) {
                console.error('❌ Failed to create proxy bridge:', e);
                // Fallback to direct connection (will likely fail for SOCKS5 auth)
                proxyConfig = {
                    server: connectionString,
                    username: username || undefined,
                    password: password || undefined
                };
            }
        } else if (config.proxyEnabled && config.proxyUrl) {
            // Global system proxy fallback
            const server = config.proxyUrl.includes('://')
                ? config.proxyUrl
                : `${config.proxyProtocol || 'http'}://${config.proxyUrl}`;

            proxyConfig = { server };
        }

        console.log(`🦊 Launching Camoufox (Headless: ${config.browserHeadless}, Profile: ${profile.name}, Proxy: ${proxyConfig ? proxyConfig.server : 'Disabled'})`);

        const userDataDir = path.join(this.profilesDir, profile.id);
        if (!fs.existsSync(userDataDir)) {
            fs.mkdirSync(userDataDir, { recursive: true });
        }

        const camoufoxOptions: any = {
            headless: config.browserHeadless,
            proxy: proxyConfig,
            geoip: proxyConfig && config.camoufoxGeoip,
            // Enhanced anti-detection settings
            os: 'windows',  // Always use Windows
            humanize: config.camoufoxHumanize ?? 2.5,  // Higher = more human-like
            block_webrtc: config.camoufoxBlockWebrtc ?? true,  // Block WebRTC leaks
            block_images: config.camoufoxBlockImages ?? false,
            enable_cache: config.camoufoxEnableCache ?? true,
            // Persistent profile - this makes Camoufox return a Context!
            user_data_dir: userDataDir,
            // Default viewport size (can be overridden by profile settings)
            window: [1920, 1080],
            // Firefox preferences for enhanced stealth
            firefox_user_prefs: {
                'privacy.resistFingerprinting': false,  // Let Camoufox handle this
                'dom.webdriver.enabled': false,
                'useragentoverride': '',
                'general.appversion.override': '',
                'general.platform.override': '',
                'network.proxy.socks_remote_dns': true,  // Essential for SOCKS to resolve hostnames remotely
            },
        };

        // Apply profile-specific screen size if set (otherwise uses default 1920x1080)
        if (profile.screenWidth && profile.screenHeight) {
            camoufoxOptions.window = [profile.screenWidth, profile.screenHeight];
        }

        if (profile.locale) {
            camoufoxOptions.locale = profile.locale;
        }

        if (profile.timezone) {
            camoufoxOptions.firefox_user_prefs = {
                'intl.timezone.override': profile.timezone,
            };
        }

        // With user_data_dir, Camoufox returns a BrowserContext directly
        const context = await Camoufox(camoufoxOptions) as BrowserContext;
        console.log('✅ Camoufox profile context launched (persistent storage active)');

        // Attach proxyChainUrl to the context object for later cleanup
        (context as any)._proxyChainUrl = proxyChainUrl;

        return context;
    }

    /**
     * Get or create default browser (no profile)
     */
    private async getDefaultBrowser(): Promise<Browser> {
        if (this.defaultBrowser && this.defaultBrowser.isConnected()) {
            return this.defaultBrowser;
        }

        this.defaultBrowser = await this.launchDefaultBrowser();
        return this.defaultBrowser;
    }

    /**
     * Get or create context for specific profile
     */
    private async getProfileContext(profileId: string): Promise<BrowserContext> {
        // Check if already running
        const existing = this.profiles.get(profileId);
        if (existing && existing.type === 'context') {
            const ctx = existing.instance as BrowserContext;
            // Check if context is still alive by checking the browser connection
            try {
                const browser = ctx.browser();
                if (browser && browser.isConnected()) {
                    // Browser is still connected, context should be valid
                    // Ensure DB thinks it's running (in case it drifted)
                    await profileService.setRunning(profileId, true);
                    return ctx;
                }
                // Browser is disconnected, context is dead
                console.log(`🔄 Profile ${profileId} browser disconnected, will relaunch`);
                this.profiles.delete(profileId);
                await profileService.setRunning(profileId, false);
            } catch (error) {
                // Context is dead, remove it
                console.log(`🔄 Profile ${profileId} context error, will relaunch`);
                this.profiles.delete(profileId);
                await profileService.setRunning(profileId, false);
            }
        }

        // Get profile from database
        const profile = await profileService.getById(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }

        // Launch with profile (returns Context)
        const context = await this.launchProfileContext(profile);

        this.profiles.set(profileId, {
            instance: context,
            type: 'context',
            proxyChainUrl: (context as any)._proxyChainUrl, // Retrieve from context object
            profileId,
            createdAt: new Date(),
        });

        // Update last used and running status
        await profileService.updateLastUsed(profileId);
        await profileService.setRunning(profileId, true);

        return context;
    }

    /**
     * Get a ready-to-use Page with optional profile
     */
    public async getPage(options?: BrowserContextOptions): Promise<{ page: Page; context: BrowserContext }> {
        if (options?.profileId) {
            // Profile mode - get the persistent context directly
            try {
                const context = await this.getProfileContext(options.profileId);
                const page = await context.newPage();
                return { page, context };
            } catch (error: any) {
                // If context was closed, clear it and retry once
                if (error.message?.includes('closed') || error.message?.includes('Target')) {
                    console.log(`🔄 Context closed for profile ${options.profileId}, relaunching...`);
                    this.profiles.delete(options.profileId);
                    const context = await this.getProfileContext(options.profileId);
                    const page = await context.newPage();
                    return { page, context };
                }
                throw error;
            }
        } else {
            // Default mode - get browser and create new context
            const browser = await this.getDefaultBrowser();

            const contextOptions: any = {
                viewport: { width: 1920, height: 1080 },
                ignoreHTTPSErrors: true,
                javaScriptEnabled: true,
            };

            if (options?.proxy) {
                contextOptions.proxy = { server: options.proxy };
            }

            const context = await browser.newContext(contextOptions);
            const page = await context.newPage();

            return { page, context };
        }
    }

    /**
     * Get page with specific profile
     */
    public async getPageWithProfile(profileId: string): Promise<{ page: Page; context: BrowserContext }> {
        return this.getPage({ profileId });
    }

    /**
     * Release resources (close context if not persistent)
     */
    public async release(context: BrowserContext, profileId?: string) {
        // Don't close persistent profile contexts, just close the page
        if (profileId && this.profiles.has(profileId)) {
            // For persistent contexts, we keep them alive
            // Close all pages instead
            try {
                const pages = context.pages();
                for (const page of pages) {
                    await page.close();
                }
            } catch {
                // Context may be dead
            }
        } else {
            // For non-persistent contexts, close entirely
            try {
                // Close local proxy chain if it exists for this context
                const proxyChainUrl = (context as any)._proxyChainUrl;
                if (proxyChainUrl) {
                    await closeAnonymizedProxy(proxyChainUrl, true);
                    console.log(`🔒 Closed local proxy bridge: ${proxyChainUrl}`);
                }

                await context.close();
            } catch {
                // Context may already be closed
            }
        }
    }

    /**
     * Close specific profile context
     */
    public async closeProfile(profileId: string) {
        const managed = this.profiles.get(profileId);
        if (managed) {
            try {
                // Close local proxy chain if exists
                if (managed.proxyChainUrl) {
                    await closeAnonymizedProxy(managed.proxyChainUrl, true);
                }

                await managed.instance.close();
            } catch {
                // Already closed
            }
            this.profiles.delete(profileId);
            // Update database status
            await profileService.setRunning(profileId, false);
            console.log(`🔒 Closed browser for profile: ${profileId}`);
        }
    }

    /**
     * Close all browsers and contexts
     */
    public async closeAll() {
        this.isClosing = true;

        // Close all profile contexts
        for (const [profileId, managed] of this.profiles) {
            try {
                if (managed.proxyChainUrl) {
                    await closeAnonymizedProxy(managed.proxyChainUrl, true);
                }
                await managed.instance.close();
            } catch {
                // Already closed
            }
        }
        this.profiles.clear();

        // Close default browser
        if (this.defaultBrowser && this.defaultBrowser.isConnected()) {
            await this.defaultBrowser.close();
            this.defaultBrowser = null;
        }

        console.log('✅ All browsers closed');
    }

    /**
     * Restart browser with new config (called after settings change)
     */
    public async restartBrowser(): Promise<void> {
        console.log('🔄 Restarting browsers with new configuration...');
        await this.closeAll();
        this.isClosing = false;
        console.log('✅ Browsers closed, will relaunch with new settings on next request');
    }

    /**
     * Get status of all running browsers
     */
    public getStatus(): { default: boolean; profiles: string[] } {
        return {
            default: this.defaultBrowser !== null && this.defaultBrowser.isConnected(),
            profiles: Array.from(this.profiles.keys()),
        };
    }
}

export const browserService = BrowserService.getInstance();
