import { Camoufox } from 'camoufox-js';
import { Browser, BrowserContext, Page } from 'playwright-core';
import { closeAnonymizedProxy } from 'proxy-chain';
import { configService } from '../config/ConfigService';
import { normalizeConfiguredProxyUrl } from '../proxy/ProxyConnection';

interface BrowserContextOptions {
    stealth?: boolean;
}

type DefaultBrowserMode = 'speed' | 'stealth';

class BrowserService {
    private static instance: BrowserService;
    private defaultBrowser: Browser | null = null;
    private defaultBrowserMode: DefaultBrowserMode | null = null;
    private isClosing = false;

    public static getInstance(): BrowserService {
        if (!BrowserService.instance) {
            BrowserService.instance = new BrowserService();
        }
        return BrowserService.instance;
    }

    private getDefaultMode(stealth?: boolean): DefaultBrowserMode {
        return stealth === false ? 'speed' : 'stealth';
    }

    private async launchDefaultBrowser(stealth?: boolean): Promise<Browser> {
        const config = await configService.getConfig();

        const proxyServer = config.proxyEnabled
            ? normalizeConfiguredProxyUrl(config.proxyUrl, config.proxyProtocol)
            : undefined;

        const proxyConfig = proxyServer ? { server: proxyServer } : undefined;
        const isSpeedMode = stealth === false;

        const camoufoxOptions: any = {
            headless: config.browserHeadless,
            proxy: proxyConfig,
            geoip: isSpeedMode ? false : (proxyConfig && config.camoufoxGeoip),
            os: 'windows',
            humanize: isSpeedMode ? false : (config.camoufoxHumanize ?? 2.5),
            block_webrtc: isSpeedMode ? false : (config.camoufoxBlockWebrtc ?? true),
            block_images: config.camoufoxBlockImages ?? false,
            enable_cache: config.camoufoxEnableCache ?? true,
            window: [1920, 1080],
            firefox_user_prefs: {
                'privacy.resistFingerprinting': false,
                'dom.webdriver.enabled': false,
                'useragentoverride': '',
                'general.appversion.override': '',
                'general.platform.override': '',
            },
        };

        console.log(`🦊 Launching Camoufox (Mode: ${isSpeedMode ? '⚡ SPEED' : '🎭 STEALTH'}, Proxy: ${proxyConfig ? 'Enabled' : 'Disabled'})`);
        const browser = await Camoufox(camoufoxOptions) as Browser;
        console.log('✅ Camoufox launched');
        return browser;
    }

    private async getDefaultBrowser(stealth?: boolean): Promise<Browser> {
        const requestedMode = this.getDefaultMode(stealth);

        if (this.defaultBrowser && this.defaultBrowser.isConnected() && this.defaultBrowserMode === requestedMode) {
            return this.defaultBrowser;
        }

        if (this.defaultBrowser && this.defaultBrowser.isConnected()) {
            try {
                await this.defaultBrowser.close();
            } catch {
                // Ignore close errors during mode switches.
            }
        }

        this.defaultBrowser = await this.launchDefaultBrowser(stealth);
        this.defaultBrowserMode = requestedMode;
        return this.defaultBrowser;
    }

    public async getPage(options?: BrowserContextOptions): Promise<{ page: Page; context: BrowserContext }> {
        const browser = await this.getDefaultBrowser(options?.stealth);
        const context = await browser.newContext({
            viewport: { width: 1920, height: 1080 },
            ignoreHTTPSErrors: true,
            javaScriptEnabled: true,
        });
        const page = await context.newPage();
        return { page, context };
    }

    public async release(context: BrowserContext) {
        try {
            const proxyChainUrl = (context as any)._proxyChainUrl;
            if (proxyChainUrl) {
                await closeAnonymizedProxy(proxyChainUrl, true);
            }

            await context.close();
        } catch {
            // Context may already be closed.
        }
    }

    public async closeAll() {
        this.isClosing = true;

        if (this.defaultBrowser && this.defaultBrowser.isConnected()) {
            await this.defaultBrowser.close();
            this.defaultBrowser = null;
        }

        this.defaultBrowserMode = null;
        console.log('✅ All browsers closed');
    }

    public async restartBrowser(): Promise<void> {
        console.log('🔄 Restarting browsers with new configuration...');
        await this.closeAll();
        this.isClosing = false;
        console.log('✅ Browsers closed, will relaunch with new settings on next request');
    }

    public getStatus(): { default: boolean } {
        return {
            default: this.defaultBrowser !== null && this.defaultBrowser.isConnected(),
        };
    }
}

export const browserService = BrowserService.getInstance();
