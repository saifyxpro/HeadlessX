import { Page } from 'playwright-core';
import fs from 'fs';
import path from 'path';
import { browserService } from './BrowserService';
import { markdownService } from './MarkdownService';
import { configService } from './ConfigService';
import { prisma } from '../database/client';

export interface ScrapeOptions {
    waitForSelector?: string;
    jsEnabled?: boolean;
    screenshotOnError?: boolean;
    apiKeyId?: string;
    profileId?: string;
    stealth?: boolean;
}

export interface ScrapeResult {
    url: string;
    html: string;
    title: string;
    statusCode: number;
    metadata?: Record<string, any>;
    markdown?: string;
}

class ScraperService {
    private static instance: ScraperService;
    private readonly screenshotDir = path.resolve(process.cwd(), 'logs/screenshots');

    private constructor() {
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir, { recursive: true });
        }
    }

    public static getInstance(): ScraperService {
        if (!ScraperService.instance) {
            ScraperService.instance = new ScraperService();
        }
        return ScraperService.instance;
    }

    /**
     * Scrape raw HTML and optional content
     */
    // ... (previous methods)

    // NOTE: Camoufox handles fingerprint spoofing at the C++ level
    // JavaScript injection can interfere with native spoofing and cause detection
    // This method is kept for legacy compatibility but should NOT be used with Camoufox
    private async injectAdvancedStealth(page: Page) {
        // Camoufox already handles:
        // - WebGL vendor/renderer spoofing
        // - Canvas fingerprint randomization
        // - Audio context fingerprinting
        // - Navigator properties
        // - Battery API
        // - Screen properties
        // DO NOT inject JavaScript - it can cause detection!
        console.log('⚠️ Skipping JS stealth injection - Camoufox handles this natively');
    }

    private async humanScroll(page: Page) {
        // We pass the function as a string to avoid compile-time artifacts like __name
        await page.evaluate(`(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                let distance = 100;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if (totalHeight >= scrollHeight / 2) { // Scroll half page
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });
        })()`);
    }

    public async scrape(url: string, options: ScrapeOptions = {}): Promise<ScrapeResult> {
        // Note: stealth is handled by Camoufox at C++ level, no need to pass it
        const { page, context } = await browserService.getPage({
            profileId: options.profileId
        });
        const startTime = Date.now();
        let statusCode = 0;
        let errorMessage: string | undefined;
        let errorSnapshot: string | undefined;

        try {
            // Inject Advanced Stealth if enabled
            if (options.stealth) {
                await this.injectAdvancedStealth(page);
            }

            // Setup listener for status code
            page.on('response', response => {
                if (response.url() === url) {
                    statusCode = response.status();
                }
            });

            // Navigate
            const config = await configService.getConfig();
            await page.goto(url, {
                waitUntil: 'domcontentloaded', // Faster, we wait intelligently later
                timeout: config.browserTimeout
            });

            // Wait for network idle manually or specific condition
            // await page.waitForLoadState('networkidle'); // Can be flaky, use smart wait if needed

            // Human-like interaction using native Playwright mouse
            const shouldApplyStealth = options.stealth === true || (options.stealth === undefined && config.stealthMode !== 'basic');

            if (shouldApplyStealth) {
                try {
                    // Native Playwright mouse movement (bezier-like with steps)
                    const viewportSize = page.viewportSize() || { width: 1280, height: 720 };
                    const randomX = Math.floor(Math.random() * (viewportSize.width * 0.6)) + 100;
                    const randomY = Math.floor(Math.random() * (viewportSize.height * 0.4)) + 100;

                    // Move with multiple steps for smoother motion
                    await page.mouse.move(randomX, randomY, { steps: 25 });
                    await page.waitForTimeout(100 + Math.random() * 200);
                    await page.mouse.click(randomX, randomY);

                    // Advanced Natural Scroll
                    await this.humanScroll(page);

                } catch (e) {
                    console.warn('Stealth interaction failed:', e);
                }
            } else {
                console.log('⚡ Speed Mode: Skipping stealth interactions');
            }

            if (options.waitForSelector) {
                await page.waitForSelector(options.waitForSelector, { timeout: 10000 });
            }

            // Allow JS to settle if requested
            if (options.jsEnabled) {
                try {
                    await page.waitForLoadState('networkidle', { timeout: 15000 });
                } catch (e) {
                    console.warn('Network idle wait timeout (proceeding anyway):', e);
                }
            }

            // Extract Data
            const html = await page.content();
            const title = await page.title();

            // Extract Meta (using string to avoid compile-time artifacts like __name)
            const metadata = await page.evaluate(`(() => {
                const getMeta = (name) => document.querySelector('meta[name="' + name + '"]')?.getAttribute('content');
                return {
                    description: getMeta('description') || getMeta('og:description'),
                    keywords: getMeta('keywords'),
                    author: getMeta('author'),
                    image: getMeta('og:image')
                };
            })()`);

            return {
                url,
                html,
                title,
                statusCode: statusCode || 200,
                metadata: metadata as Record<string, any>
            };

        } catch (error) {
            errorMessage = (error as Error).message;
            if (options.screenshotOnError) {
                errorSnapshot = await this.captureErrorSnapshot(page, url);
            }
            throw error;
        } finally {
            const duration = Date.now() - startTime;

            // Only release (close) if not a persistent profile
            if (!options.profileId) {
                await browserService.release(context);
            } else {
                console.log(`ℹ️ Keeping profile ${options.profileId} open (Persistent Mode)`);
            }

            // Async Logging
            prisma.requestLog.create({
                data: {
                    api_key_id: options.apiKeyId,
                    url: url,
                    method: 'POST',
                    status_code: statusCode || (errorMessage ? 500 : 200),
                    duration_ms: duration,
                    error_message: errorMessage,
                    error_screenshot_path: errorSnapshot
                }
            }).catch(e => console.error('Failed to log request:', e));
        }
    }

    public async screenshot(url: string, options: ScrapeOptions = {}): Promise<Buffer> {
        const { page, context } = await browserService.getPage({
            profileId: options.profileId
        });
        try {
            if (options.stealth) await this.injectAdvancedStealth(page);

            const config = await configService.getConfig();
            await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

            // Native Playwright stealth interactions
            // Fix: Respect explicit stealth: false from options
            const shouldApplyStealth = options.stealth === true || (options.stealth === undefined && config.stealthMode !== 'basic');

            if (shouldApplyStealth) {
                try {
                    const viewportSize = page.viewportSize() || { width: 1280, height: 720 };
                    const randomX = Math.floor(Math.random() * viewportSize.width * 0.5) + 50;
                    const randomY = Math.floor(Math.random() * viewportSize.height * 0.3) + 50;
                    await page.mouse.move(randomX, randomY, { steps: 15 });
                    await this.humanScroll(page);
                } catch (e) {
                    console.warn('Stealth actions failed:', e);
                }
            }

            if (options.waitForSelector) await page.waitForSelector(options.waitForSelector);

            // Hide sticky headers/footers for clean full-page screenshot
            await page.evaluate(`(() => {
                const elements = document.querySelectorAll('*');
                elements.forEach(el => {
                    const style = window.getComputedStyle(el);
                    if (style.position === 'fixed' || style.position === 'sticky') {
                        el.style.position = 'absolute';
                    }
                });
            })()`);

            // Scroll through page to load lazy content
            await page.evaluate(`(async () => {
                await new Promise(resolve => {
                    let total = 0;
                    const timer = setInterval(() => {
                        window.scrollBy(0, 500);
                        total += 500;
                        if (total >= document.body.scrollHeight) {
                            clearInterval(timer);
                            window.scrollTo(0, 0);
                            resolve();
                        }
                    }, 50);
                });
            })()`);

            await page.waitForTimeout(300);

            return await page.screenshot({ fullPage: true, type: 'jpeg', quality: 90 });
        } finally {
            await browserService.release(context);
        }
    }

    public async pdf(url: string, options: ScrapeOptions = {}): Promise<Buffer> {
        const { page, context } = await browserService.getPage({
            profileId: options.profileId
        });
        try {
            if (options.stealth) await this.injectAdvancedStealth(page);
            await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

            const config = await configService.getConfig();
            if (options.waitForSelector) await page.waitForSelector(options.waitForSelector);

            // PDF specific settings
            return await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
            });
        } finally {
            await browserService.release(context);
        }
    }


    /**
     * Scrape and convert to Markdown
     */
    public async scrapeContent(url: string, options: ScrapeOptions = {}): Promise<ScrapeResult> {
        const result = await this.scrape(url, options);
        result.markdown = markdownService.convert(result.html);
        return result;
    }

    private async captureErrorSnapshot(page: Page, url: string): Promise<string | undefined> {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const safeUrl = url.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            const filename = `error_${timestamp}_${safeUrl}.png`;
            const filepath = path.join(this.screenshotDir, filename);

            await page.screenshot({ path: filepath, fullPage: true });
            console.error(`📸 Error snapshot saved: ${filepath}`);
            return filepath;
        } catch (e) {
            console.error('Failed to capture error snapshot', e);
            return undefined;
        }
    }
}

export const scraperService = ScraperService.getInstance();
