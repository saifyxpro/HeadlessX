import { Page } from 'playwright-core';
import { browserService } from './BrowserService';
import { markdownService } from './MarkdownService';
import { configService } from './ConfigService';

export interface StreamProgress {
    step: number;
    total: number;
    message: string;
    status: 'pending' | 'active' | 'completed' | 'error';
}

export interface StreamScrapeResult {
    success: boolean;
    url: string;
    html?: string;
    markdown?: string;
    title?: string;
    statusCode?: number;
    metadata?: Record<string, any>;
    screenshot?: Buffer;
    pdf?: Buffer;
    styles?: string[];
    scripts?: string[];
    inlineStyles?: string;
    inlineScripts?: string;
    error?: string;
    duration: number;
}

type ProgressCallback = (progress: StreamProgress) => void;

class StreamingScraperService {
    private static instance: StreamingScraperService;

    private constructor() { }

    public static getInstance(): StreamingScraperService {
        if (!StreamingScraperService.instance) {
            StreamingScraperService.instance = new StreamingScraperService();
        }
        return StreamingScraperService.instance;
    }

    // NOTE: Camoufox handles fingerprint spoofing at the C++ level
    // JavaScript injection interferes with native spoofing and can cause detection
    private async injectAdvancedStealth(page: Page) {
        // Camoufox already handles WebGL, Canvas, Audio, Navigator spoofing natively
        // DO NOT inject JavaScript - it causes detection!
        console.log('⚠️ Skipping JS stealth - Camoufox handles this natively');
    }

    private async humanScroll(page: Page) {
        // Fast scroll - just do one scroll action for speed
        await page.evaluate(`(() => {
            window.scrollBy(0, Math.floor(window.innerHeight * 0.3));
        })()`);
    }

    /**
     * Scrape with real-time progress streaming
     */
    public async scrapeWithProgress(
        url: string,
        type: 'html' | 'html-js' | 'html-css-js' | 'content' | 'screenshot' | 'pdf',
        options: {
            waitForSelector?: string;
            timeout?: number;
            profileId?: string;
            jsEnabled?: boolean;
            fullPage?: boolean;  // For screenshots: true = full page scroll, false = viewport only
        },
        onProgress: ProgressCallback
    ): Promise<StreamScrapeResult> {
        const startTime = Date.now();
        const totalSteps = type === 'content' ? 5 : 4;
        let statusCode = 0;

        // Use custom timeout or default from config
        const requestTimeout = options.timeout || 30000;

        let currentStep = 1;

        // Step 1: Launching browser
        onProgress({ step: currentStep, total: totalSteps, message: 'Launching browser...', status: 'active' });

        let page: Page;
        let context: any;

        try {
            const result = await browserService.getPage({
                profileId: options.profileId
            });
            page = result.page;
            context = result.context;

            // Set standard viewport for consistent screenshot quality
            if (type === 'screenshot' || type === 'pdf') {
                await page.setViewportSize({ width: 1920, height: 1080 });
            }

            onProgress({ step: currentStep, total: totalSteps, message: 'Browser launched', status: 'completed' });
        } catch (error) {
            onProgress({ step: currentStep, total: totalSteps, message: 'Browser launch failed', status: 'error' });
            return {
                success: false,
                url,
                error: `Browser launch failed: ${(error as Error).message}`,
                duration: Date.now() - startTime
            };
        }

        try {
            // Capture status code
            page.on('response', response => {
                if (response.url() === url) {
                    statusCode = response.status();
                }
            });

            // Step 2: Navigating to page
            currentStep = 2;
            onProgress({ step: currentStep, total: totalSteps, message: 'Navigating to page...', status: 'active' });

            // Use custom timeout from request
            await page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: requestTimeout
            });

            onProgress({ step: currentStep, total: totalSteps, message: 'Page loaded', status: 'completed' });

            // Step 3: Waiting for content
            currentStep = 3;
            onProgress({ step: currentStep, total: totalSteps, message: 'Waiting for content...', status: 'active' });

            // Light stealth interactions (fast)
            try {
                const viewportSize = page.viewportSize() || { width: 1280, height: 720 };
                const randomX = Math.floor(Math.random() * (viewportSize.width * 0.6)) + 100;
                const randomY = Math.floor(Math.random() * (viewportSize.height * 0.4)) + 100;
                await page.mouse.move(randomX, randomY, { steps: 10 });
                await this.humanScroll(page);
            } catch (e) {
                console.warn('Stealth interaction failed:', e);
            }

            if (options.waitForSelector) {
                await page.waitForSelector(options.waitForSelector, { timeout: requestTimeout });
            }

            // Only wait for networkidle on JS-heavy pages, with shorter timeout
            if (options.jsEnabled || type === 'html-js' || type === 'html-css-js') {
                try {
                    await page.waitForLoadState('networkidle', { timeout: 5000 });
                } catch (e) {
                    // Timeout is fine, proceed anyway
                }
            }

            onProgress({ step: 3, total: totalSteps, message: 'Content ready', status: 'completed' });

            // Step 4: Extracting data based on type
            const extractMessage = type === 'screenshot' ? 'Taking screenshot...'
                : type === 'pdf' ? 'Generating PDF...'
                    : type === 'content' ? 'Extracting HTML...'
                        : 'Extracting HTML...';

            onProgress({ step: 4, total: totalSteps, message: extractMessage, status: 'active' });

            let resultData: StreamScrapeResult;

            if (type === 'screenshot') {
                const shouldFullPage = options.fullPage === true; // Only full page if explicitly set to true

                // Hide sticky headers/footers BEFORE full-page screenshot only
                if (shouldFullPage) {
                    await page.evaluate(`(() => {
                        const fixedElements = document.querySelectorAll('*');
                        fixedElements.forEach(el => {
                            const style = window.getComputedStyle(el);
                            if (style.position === 'fixed' || style.position === 'sticky') {
                                el.setAttribute('data-original-position', style.position);
                                el.style.position = 'absolute';
                            }
                        });
                    })()`);
                }

                // Only scroll to capture full page if fullPage is true
                if (shouldFullPage) {
                    // Scroll to capture full page properly - with safety limits to prevent hanging
                    await page.evaluate(`(async () => {
                        await new Promise(resolve => {
                            let totalHeight = 0;
                            const distance = 500;
                            const maxScrolls = 50; // Safety limit: max 50 scrolls (25000px)
                            let scrollCount = 0;
                            const startTime = Date.now();
                            const maxTime = 10000; // 10 second max for scrolling
                            
                            const timer = setInterval(() => {
                                scrollCount++;
                                window.scrollBy(0, distance);
                                totalHeight += distance;
                                
                                // Stop conditions: reached bottom, max scrolls, or timeout
                                const reachedBottom = totalHeight >= document.body.scrollHeight;
                                const hitLimit = scrollCount >= maxScrolls;
                                const timedOut = (Date.now() - startTime) > maxTime;
                                
                                if (reachedBottom || hitLimit || timedOut) {
                                    clearInterval(timer);
                                    window.scrollTo(0, 0);
                                    resolve();
                                }
                            }, 50);
                        });
                    })()`);

                    // Wait a bit for any lazy-loaded images
                    await page.waitForTimeout(300);
                }

                const buffer = await page.screenshot({ fullPage: shouldFullPage, type: 'jpeg', quality: 90 });
                onProgress({ step: 4, total: totalSteps, message: 'Screenshot captured', status: 'completed' });
                resultData = {
                    success: true,
                    url,
                    screenshot: buffer,
                    statusCode,
                    duration: Date.now() - startTime
                };
            } else if (type === 'pdf') {
                const buffer = await page.pdf({
                    format: 'A4',
                    printBackground: true,
                    margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
                });
                onProgress({ step: 4, total: totalSteps, message: 'PDF generated', status: 'completed' });
                resultData = {
                    success: true,
                    url,
                    pdf: buffer,
                    statusCode,
                    duration: Date.now() - startTime
                };
            } else {
                // HTML or Content
                const html = await page.content();
                const title = await page.title();
                const metadata = await page.evaluate(`(() => {
                    const getMeta = (name) => document.querySelector('meta[name="' + name + '"]')?.getAttribute('content');
                    return {
                        description: getMeta('description') || getMeta('og:description'),
                        keywords: getMeta('keywords'),
                        author: getMeta('author'),
                        image: getMeta('og:image')
                    };
                })()`);

                onProgress({ step: 4, total: totalSteps, message: 'HTML extracted', status: 'completed' });

                if (type === 'content') {
                    // Step 5: Converting to Markdown
                    onProgress({ step: 5, total: totalSteps, message: 'Converting to Markdown...', status: 'active' });
                    const markdown = markdownService.convert(html);
                    onProgress({ step: 5, total: totalSteps, message: 'Markdown ready', status: 'completed' });

                    resultData = {
                        success: true,
                        url,
                        html,
                        markdown,
                        title,
                        statusCode,
                        metadata: metadata as Record<string, any>,
                        duration: Date.now() - startTime
                    };
                } else if (type === 'html-css-js') {
                    // Extract all CSS and JS resources
                    const resources = await page.evaluate(`(() => {
                        // External stylesheets
                        const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
                            .map(el => el.href)
                            .filter(href => href);
                        
                        // External scripts
                        const scriptSrcs = Array.from(document.querySelectorAll('script[src]'))
                            .map(el => el.src)
                            .filter(src => src);
                        
                        // Inline styles
                        const inlineStyles = Array.from(document.querySelectorAll('style'))
                            .map(el => el.textContent)
                            .filter(text => text)
                            .join('\\n\\n/* --- */\\n\\n');
                        
                        // Inline scripts
                        const inlineScripts = Array.from(document.querySelectorAll('script:not([src])'))
                            .map(el => el.textContent)
                            .filter(text => text && text.trim().length > 0)
                            .join('\\n\\n/* --- */\\n\\n');
                        
                        return { styleLinks, scriptSrcs, inlineStyles, inlineScripts };
                    })()`);

                    resultData = {
                        success: true,
                        url,
                        html,
                        title,
                        statusCode,
                        metadata: metadata as Record<string, any>,
                        styles: (resources as any).styleLinks,
                        scripts: (resources as any).scriptSrcs,
                        inlineStyles: (resources as any).inlineStyles,
                        inlineScripts: (resources as any).inlineScripts,
                        duration: Date.now() - startTime
                    };
                } else {
                    resultData = {
                        success: true,
                        url,
                        html,
                        title,
                        statusCode,
                        metadata: metadata as Record<string, any>,
                        duration: Date.now() - startTime
                    };
                }
            }

            return resultData;

        } catch (error) {
            // Error occurred at currentStep
            onProgress({ step: currentStep, total: totalSteps, message: `Error: ${(error as Error).message}`, status: 'error' });
            return {
                success: false,
                url,
                error: (error as Error).message,
                duration: Date.now() - startTime
            };
        } finally {
            await browserService.release(context, options.profileId);
        }
    }
}

export const streamingScraperService = StreamingScraperService.getInstance();
