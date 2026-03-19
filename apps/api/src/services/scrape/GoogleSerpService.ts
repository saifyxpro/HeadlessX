import { Page, BrowserContext } from 'playwright-core';
import { browserService } from './BrowserService';
import { captchaSolverService } from '../CaptchaSolverService';

export interface SerpResult {
    ai_overview: string | null;
    sites: Array<{
        title: string;
        description: string;
        source: string;
        url: string;
    }>;
}

export interface SearchResponse {
    query: string;
    timestamp: string;
    results: SerpResult;
    markdown: string;
}

export interface GoogleSearchOptions {
    gl?: string;
    hl?: string;
    tbs?: 'qdr:h' | 'qdr:d' | 'qdr:w';
    stealth?: boolean;
}

export class GoogleSerpService {
    private normalizeOptions(options?: GoogleSearchOptions): GoogleSearchOptions {
        return {
            gl: options?.gl?.trim().toLowerCase() || undefined,
            hl: options?.hl?.trim().toLowerCase() || undefined,
            tbs: options?.tbs || undefined,
            stealth: options?.stealth,
        };
    }

    private getTypingDelay(stealth?: boolean, minimum = 30, variance = 50): number {
        if (stealth === false) {
            return 0;
        }

        return Math.random() * variance + minimum;
    }

    private buildGoogleHomeUrl(options?: GoogleSearchOptions): string {
        const url = new URL('https://www.google.com/');
        if (options?.gl) {
            url.searchParams.set('gl', options.gl);
        }
        if (options?.hl) {
            url.searchParams.set('hl', options.hl);
        }
        return url.toString();
    }

    private buildGoogleSearchUrl(query: string, options?: GoogleSearchOptions): string {
        const url = new URL('https://www.google.com/search');
        url.searchParams.set('q', query);
        if (options?.gl) {
            url.searchParams.set('gl', options.gl);
        }
        if (options?.hl) {
            url.searchParams.set('hl', options.hl);
        }
        if (options?.tbs) {
            url.searchParams.set('tbs', options.tbs);
        }
        return url.toString();
    }

    private buildGoogleStartUrl(query: string, options?: GoogleSearchOptions): string {
        if (options?.gl || options?.hl || options?.tbs) {
            return this.buildGoogleSearchUrl(query, options);
        }

        return this.buildGoogleHomeUrl();
    }

    /**
     * Scrape Google AI Search with real-time progress updates
     */
    async scrapeWithProgress(
        query: string,
        timeout: number,
        options: GoogleSearchOptions,
        onProgress: (progress: { step: number; total: number; message: string; status: 'active' | 'completed' | 'pending' }) => void
    ): Promise<SearchResponse> {
        const searchOptions = this.normalizeOptions(options);
        const homeUrl = this.buildGoogleHomeUrl(searchOptions);
        const startUrl = this.buildGoogleStartUrl(query, searchOptions);
        const TOTAL_STEPS = 6;
        const operationTimeout = Math.max(timeout, 5000);
        let browserContext: BrowserContext | null = null;
        let page: Page | null = null;

        try {
            // STEP 1: Launch Browser
            onProgress({ step: 1, total: TOTAL_STEPS, message: 'Launching browser', status: 'active' });
            const browserResult = await browserService.getPage();
            page = browserResult.page;
            browserContext = browserResult.context;
            onProgress({ step: 1, total: TOTAL_STEPS, message: 'Launching browser', status: 'completed' });

            // STEP 2: Navigating to Google (Includes Consent & AI Mode setup)
            onProgress({ step: 2, total: TOTAL_STEPS, message: 'Navigating to Google', status: 'active' });
            await browserService.applyViewport(page);
            await page.goto(startUrl, {
                waitUntil: 'domcontentloaded',
                timeout: operationTimeout,
            });
            await page.waitForTimeout(2000); // Wait like Python script

            // Helper function to check and solve CAPTCHA
            const checkAndSolveCaptcha = async (location: string): Promise<boolean> => {
                if (!page) return false; // Guard against null page
                try {
                    // Wait a moment for page to settle
                    await page.waitForTimeout(3000);

                    const isSorry = page.url().includes('/sorry/');
                    const hasCaptcha = page.frames().some(f => f.url().includes('recaptcha'));
                    const hasRecaptchaDiv = await page.locator('iframe[src*="recaptcha"]').count() > 0;

                    if (isSorry || hasCaptcha || hasRecaptchaDiv) {
                        console.log(`   ⚠️ CAPTCHA detected at ${location}! Solving...`);
                        onProgress({
                            step: 4,
                            total: TOTAL_STEPS,
                            message: `CAPTCHA detected at ${location}. Solving...`,
                            status: 'active'
                        });
                        await captchaSolverService.solve(page);
                        await page.waitForTimeout(3000);

                        // If still on sorry page, navigate back to Google
                        if (page.url().includes('/sorry/')) {
                            console.log('   🔄 Navigating back to Google after CAPTCHA...');
                            await page.goto(homeUrl, {
                                waitUntil: 'domcontentloaded',
                                timeout: operationTimeout,
                            });
                            await page.waitForTimeout(2000);
                        }
                        return true;
                    }
                    return false;
                } catch (e) {
                    console.log(`   ⚠️ CAPTCHA check at ${location} failed:`, e);
                    return false;
                }
            };

            // CAPTCHA CHECK #1: After navigating to google.com
            await checkAndSolveCaptcha('after navigation to Google');

            // Consent handling (robust)
            const consentSelectors = [
                "button.tHlp8d", "button#L2AGLb",
                "//button[contains(text(), 'Accept')]", "//button[contains(text(), 'I agree')]"
            ];
            for (const selector of consentSelectors) {
                try {
                    const btn = page.locator(selector).first();
                    if (await btn.isVisible({ timeout: 2000 })) {
                        await btn.click();
                        await page.waitForTimeout(2000);
                        break;
                    }
                } catch { }
            }

            let aiModeClicked = false;
            onProgress({ step: 2, total: TOTAL_STEPS, message: 'Navigating to Google', status: 'completed' });

            // AI Mode (always prefer it)
            try {
                const aiBtn = page.locator("//button[contains(@class, 'plR5qb')]").first();
                if (await aiBtn.isVisible({ timeout: 5000 })) {
                    await aiBtn.click();
                    aiModeClicked = true;
                    console.log("   ✅ Clicked AI Mode button");
                    await page.waitForTimeout(2000);
                }
            } catch {
                console.log("   ⚠️ AI Mode button not found, using regular search");
            }

            // CAPTCHA CHECK #2: After AI Mode click (before trying to type)
            await checkAndSolveCaptcha('after AI mode click');

            // STEP 3: Inputting search details (Includes finding input, typing, submitting)
            onProgress({ step: 3, total: TOTAL_STEPS, message: 'Inputting search details', status: 'active' });

            let typed = false;

            if (aiModeClicked) {
                try {
                    const el = page.locator("//textarea[contains(@class, 'ITIRGe')]").first();
                    if (await el.isVisible({ timeout: 2000 })) {
                        const existingValue = (await el.inputValue().catch(() => '')).trim();
                        if (existingValue.toLowerCase() === query.trim().toLowerCase()) {
                            typed = true;
                        } else {
                            await el.click({ force: true, timeout: 3000 });
                            await page.waitForTimeout(500);
                            await el.fill('');
                            for (const char of query) {
                                await el.type(char, { delay: this.getTypingDelay(searchOptions.stealth) });
                            }
                            typed = true;
                        }
                    }
                } catch (e) {
                    console.log("   ⚠️ AI Input failed (click/type), falling back to standard...", e);
                    await page.waitForTimeout(1000);
                }
            }

            if (!typed) {
                const searchXpaths = ["//textarea[@name='q']", "//input[@name='q']"];
                for (const xpath of searchXpaths) {
                    try {
                        const el = page.locator(xpath).first();
                        if (await el.isVisible({ timeout: 3000 })) {
                            const existingValue = (await el.inputValue().catch(() => '')).trim();
                            if (existingValue.toLowerCase() === query.trim().toLowerCase()) {
                                typed = true;
                                break;
                            }

                            await el.click({ force: true, timeout: 3000 });
                            await page.waitForTimeout(500);
                            await el.fill(query);
                            typed = true;
                            break;
                        }
                    } catch { }
                }
            }

            if (!typed) throw new Error("Could not find or type in any search input");
            onProgress({ step: 3, total: TOTAL_STEPS, message: 'Inputting search details', status: 'completed' });

            await page.keyboard.press('Enter');
            try {
                const sendBtn = page.locator("//button[@aria-label='Send']").first();
                if (await sendBtn.isVisible({ timeout: 1000 })) await sendBtn.click();
            } catch { }

            // STEP 4: Solving potential CAPTCHAs (Includes Waiting & Checking)
            onProgress({ step: 4, total: TOTAL_STEPS, message: 'Waiting for search results', status: 'active' });

            // Initial mandatory wait from Python script
            await page.waitForTimeout(5000);

            // Wait loop for results or captcha
            const maxWait = operationTimeout;
            let resultFound = false;
            let waited = 5000; // already waited 5s

            while (waited < maxWait) {
                const resultCount = await page.locator("div.MFrAxb, div.g").count(); // Check for results
                if (resultCount > 0) {
                    resultFound = true;
                    break;
                }
                // Check captcha again in loop
                const isSorry = page.url().includes('/sorry/');
                const hasCaptcha = page.frames().some(f => f.url().includes('recaptcha'));
                if (isSorry || hasCaptcha) {
                    console.log("   ⚠️ CAPTCHA detected during wait...");
                    onProgress({
                        step: 4,
                        total: TOTAL_STEPS,
                        message: 'CAPTCHA detected while waiting. Solving...',
                        status: 'active'
                    });
                    await captchaSolverService.solve(page);
                    await page.waitForTimeout(3000);
                }

                await page.waitForTimeout(1000);
                waited += 1000;
            }
            onProgress({
                step: 4,
                total: TOTAL_STEPS,
                message: resultFound ? 'Results are ready for extraction' : 'Finished waiting for results',
                status: 'completed'
            });

            // STEP 5: Extracting SERP data (Includes Expansion)
            onProgress({ step: 5, total: TOTAL_STEPS, message: 'Extracting SERP data', status: 'active' });

            // Expand Results
            try {
                // "Show all" button: //div[@id='rw0ISc'] from Python
                const showAll = page.locator("//div[@id='rw0ISc']").first();
                if (await showAll.isVisible({ timeout: 5000 })) {
                    await showAll.click({ force: true });
                    await page.waitForTimeout(3000);
                }
            } catch { }

            // Extract & Format
            const results = await this.extractResults(page);
            onProgress({ step: 5, total: TOTAL_STEPS, message: 'Extracting SERP data', status: 'completed' });

            // STEP 6: Formatting results
            onProgress({ step: 6, total: TOTAL_STEPS, message: 'Formatting results', status: 'active' });
            const markdown = this.generateMarkdown(query, results);

            const response: SearchResponse = {
                query,
                timestamp: new Date().toISOString(),
                results,
                markdown
            };
            onProgress({ step: 6, total: TOTAL_STEPS, message: 'Formatting results', status: 'completed' });

            return response;

        } catch (error) {
            console.error('Google AI Search Error:', error);
            throw error;
        } finally {
            if (browserContext) {
                await browserService.release(browserContext, page ?? undefined);
            }
        }
    }

    private async humanType(page: Page, selector: string, text: string) {
        const element = page.locator(selector).first();
        await element.click();

        for (const char of text) {
            await element.type(char, { delay: Math.random() * 100 + 50 }); // 50-150ms delay
        }
    }

    private async extractResults(page: Page): Promise<SerpResult> {
        const results: SerpResult = {
            ai_overview: null,
            sites: []
        };

        // Extract AI Overview
        try {
            const aiSelectors = [
                "div.mZJni",
                "div.wDYxhc",
                "div[data-attrid='wa:/description']"
            ];

            for (const selector of aiSelectors) {
                const elements = await page.locator(selector).all();
                let fullText = "";

                for (const el of elements) {
                    const text = (await el.innerText()).trim();
                    if (text.length > fullText.length) {
                        fullText = text;
                    }
                }

                if (fullText) {
                    results.ai_overview = fullText;
                    break;
                }
            }
        } catch (e) {
            console.log("No AI Overview found or error extracting");
        }

        // Extract Sites
        try {
            const siteItems = await page.locator("div.MFrAxb").all();

            for (const item of siteItems) {
                try {
                    const title = await item.locator("div.Nn35F").first().innerText().catch(() => "");
                    const description = await item.locator("span.vhJ6Pe").first().innerText().catch(() => "");
                    const source = await item.locator("span.R0r5R").first().innerText().catch(() => "");
                    const url = await item.locator("a.NDNGvf").first().getAttribute("href").catch(() => "");

                    if (title || url) {
                        results.sites.push({
                            title: title.trim(),
                            description: description.trim(),
                            source: source.trim(),
                            url: url || ""
                        });
                    }
                } catch (e) {
                    // Ignore individual item errors
                }
            }
        } catch (e) {
            console.log("Error extracting sites", e);
        }

        return results;
    }

    private generateMarkdown(query: string, results: SerpResult): string {
        const timestamp = new Date().toLocaleString();
        let md = `# Google AI Search Results\n\n`;
        md += `**Query:** ${query}\n`;
        md += `**Timestamp:** ${timestamp}\n\n`;
        md += `---\n\n`;

        md += `## AI Overview\n\n`;
        md += `${results.ai_overview || "No AI overview available."}\n\n`;
        md += `---\n\n`;

        md += `## Sites (${results.sites.length} results)\n\n`;

        results.sites.forEach((site, index) => {
            md += `### ${index + 1}. [${site.title || "Untitled"}](${site.url || "#"})\n`;
            md += `**${site.source || "Unknown Source"}**\n\n`;
            md += `> ${site.description || "No description available."}\n\n`;
            md += `---\n\n`;
        });

        return md;
    }

    public async search(query: string, options?: GoogleSearchOptions): Promise<SearchResponse> {
        const searchOptions = this.normalizeOptions(options);
        const homeUrl = this.buildGoogleHomeUrl(searchOptions);
        const startUrl = this.buildGoogleStartUrl(query, searchOptions);
        console.log(`Starting Google AI Search for: ${query}`);
        const { page, context } = await browserService.getPage();

        try {
            // Step 1: Navigate
            await browserService.applyViewport(page);
            await page.goto(startUrl);
            await page.waitForTimeout(2000);

            // Step 1.5: Early reCAPTCHA / Block Check
            console.log("   📍 Step 1.5: Checking for immediate reCAPTCHA or IP Block...");
            if (page.url().includes('/sorry/')) {
                console.log("   ⚠️ Google IP Block detected (Sorry page)!");
            }

            try {
                const captchaFrame = page.frames().find(f => f.url().includes('recaptcha/api2/anchor'));
                const isSorryPage = page.url().includes('/sorry/');

                if (captchaFrame || isSorryPage) {
                    console.log("   ⚠️ reCAPTCHA/Block detected! Attempting to solve...");
                    const solved = await captchaSolverService.solve(page);
                    if (solved) {
                        console.log("   ✅ reCAPTCHA solved, proceeding...");
                        // If we were on sorry page, we might need to navigate back or it auto-redirects
                        await page.waitForTimeout(3000);
                        if (page.url().includes('/sorry/')) {
                            // Retry navigation if still stuck
                            await page.goto(homeUrl);
                        }
                    } else {
                        console.log("   ❌ Failed to solve early reCAPTCHA.");
                    }
                }
            } catch (e) {
                console.log("   ⚠️ Early captcha check error:", e);
            }

            // Step 2: Consent
            const consentSelectors = [
                "button.tHlp8d",
                "button#L2AGLb",
                "//button[contains(text(), 'Accept')]",
                "//button[contains(text(), 'I agree')]"
            ];

            for (const selector of consentSelectors) {
                try {
                    const btn = page.locator(selector).first();
                    if (await btn.isVisible({ timeout: 2000 })) {
                        await btn.click();
                        await page.waitForTimeout(2000);
                        break;
                    }
                } catch { }
            }

            // Step 2.5: Check for CAPTCHA
            try {
                const captchaFrame = page.frames().find(f => f.url().includes('recaptcha/api2/anchor'));
                if (captchaFrame) {
                    console.log("   ⚠️ reCAPTCHA detected! Attempting to solve...");
                    const solved = await captchaSolverService.solve(page);
                    if (solved) {
                        console.log("   ✅ reCAPTCHA solved, proceeding...");
                        await page.waitForTimeout(2000);
                    } else {
                        throw new Error("Failed to solve reCAPTCHA");
                    }
                }
            } catch (e) {
                console.log("Captcha check/solve error:", e);
                // Proceed anyway, maybe it wasn't blocking
            }

            let aiModeClicked = false;
            try {
                const aiBtn = page.locator("//button[contains(@class, 'plR5qb')]").first();
                if (await aiBtn.isVisible({ timeout: 5000 })) {
                    await aiBtn.click();
                    aiModeClicked = true;
                    console.log("   ✅ Clicked AI Mode button");
                    await page.waitForTimeout(2000);
                }
            } catch {
                console.log("   ⚠️ AI Mode button not found, using regular search");
            }

            if (aiModeClicked) {
                try {
                    const captchaFrame = page.frames().find(f => f.url().includes('recaptcha/api2/anchor'));
                    const isSorryPage = page.url().includes('/sorry/');

                    if (captchaFrame || isSorryPage) {
                        console.log("   ⚠️ CAPTCHA detected after AI Mode click! Attempting to solve...");
                        const solved = await captchaSolverService.solve(page);
                        if (solved) {
                            console.log("   ✅ reCAPTCHA solved, proceeding...");
                            await page.waitForTimeout(2000);
                        }
                    }
                } catch (e) {
                    console.log("   ⚠️ Error checking post-AI captcha:", e);
                }
            }

            // Step 4: Search Input
            console.log("   📍 Step 4: Looking for search input...");
            let searchInput: any = null;

            if (aiModeClicked) {
                try {
                    // Try AI search textarea first (ITIRGe class)
                    const el = page.locator("//textarea[contains(@class, 'ITIRGe')]").first();
                    await el.waitFor({ state: "visible", timeout: 5000 });
                    searchInput = el;
                    console.log("   ✅ Found AI search textarea (ITIRGe)");
                } catch { }
            }

            // Fallback to regular search
            if (!searchInput) {
                const searchXpaths = [
                    "//textarea[@name='q']",
                    "//input[@name='q']"
                ];
                for (const xpath of searchXpaths) {
                    try {
                        const el = page.locator(xpath).first();
                        if (await el.isVisible({ timeout: 2000 })) {
                            searchInput = el;
                            console.log(`   ✅ Found search input: ${xpath}`);
                            break;
                        }
                    } catch { }
                }
            }

            if (!searchInput) {
                console.log("   ⚠️ Search input not found. Checking for blocking reCAPTCHA...");
                // Check if we are blocked by captcha
                try {
                    const captchaFrame = page.frames().find(f => f.url().includes('recaptcha/api2/anchor'));
                    const isSorryPage = page.url().includes('/sorry/');

                    if (captchaFrame || isSorryPage) {
                        console.log("   ⚠️ Blocking reCAPTCHA detected! Attempting to solve...");
                        const solved = await captchaSolverService.solve(page);
                        if (solved) {
                            console.log("   ✅ reCAPTCHA solved, retrying search input discovery...");
                            await page.waitForTimeout(3000);

                            // Retry finding search input
                            const searchXpaths = [
                                "//textarea[contains(@class, 'ITIRGe')]",
                                "//textarea[@name='q']",
                                "//input[@name='q']"
                            ];
                            for (const xpath of searchXpaths) {
                                try {
                                    const el = page.locator(xpath).first();
                                    if (await el.isVisible({ timeout: 2000 })) {
                                        searchInput = el;
                                        console.log(`   ✅ Found search input after solve: ${xpath}`);
                                        break;
                                    }
                                } catch { }
                            }
                        }
                    }
                } catch (e) {
                    console.log("   ⚠️ Error checking/solving blocking captcha: ", e);
                }
            }

            if (!searchInput) {
                await page.screenshot({ path: 'debug_no_search_input.png' });
                throw new Error("Could not find search input (Screenshot saved to debug_no_search_input.png)");
            }

            // Step 6: Type Query
            // We can't use 'humanType' helper easily with Locators if we didn't update it to accept Locator vs selector string
            // But we can just use the element handle we found
            await searchInput.click({ timeout: 15000 });
            await page.waitForTimeout(500);

            const existingValue = (await searchInput.inputValue().catch(() => '')).trim();
            if (existingValue.toLowerCase() !== query.trim().toLowerCase()) {
                await searchInput.fill('');
                for (const char of query) {
                await searchInput.type(char, { delay: this.getTypingDelay(searchOptions.stealth, 50, 100) });
                }
            }
            console.log(`   ✅ Typed query: ${query}`);
            await page.waitForTimeout(1000);

            // Step 7: Submit
            console.log("   📍 Step 7: Submitting search...");
            let sendClicked = false;
            const sendXpaths = [
                "//button[@aria-label='Send']",
                "//button[contains(@class, 'uMMzHc')]",
                "//button[@data-xid='input-plate-send-button']",
                "//div[contains(@class, 'csTa2e')]//button",
                "//div[contains(@class, 'wilSz')]"
            ];

            for (const xpath of sendXpaths) {
                try {
                    const btn = page.locator(xpath).first();
                    if (await btn.isVisible({ timeout: 2000 })) {
                        await btn.click();
                        sendClicked = true;
                        console.log(`   ✅ Clicked send button: ${xpath}`);
                        break;
                    }
                } catch { }
            }

            if (!sendClicked) {
                await page.keyboard.press('Enter');
                console.log("   ✅ Pressed Enter to submit");
            }

            // Step 8: Wait for Results or CAPTCHA
            console.log("   📍 Step 8: Waiting for results or CAPTCHA...");

            try {
                // Wait for either results, captcha, or immediate IP block
                // checking strictly for results container 'div.MFrAxb' or 'div.g' usually works for results
                // CAPTCHA frame or URL change for block
                const checkInterval = 500;
                const maxWait = 120000;
                let waited = 0;
                let resultFound = false;

                while (waited < maxWait) {
                    // Check Results
                    const resultCount = await page.locator("div.MFrAxb, div.g").count();
                    if (resultCount > 0) {
                        console.log(`   ✅ detected ${resultCount} results.`);
                        console.log(`   ⏳ Waiting 5s for AI overview and content to fully load...`);
                        await page.waitForTimeout(5000);
                        resultFound = true;
                        break;
                    }

                    // Check Captcha/Block
                    const isSorryPage = page.url().includes('/sorry/');
                    const captchaFrame = page.frames().find(f => f.url().includes('recaptcha/api2/anchor'));

                    if (isSorryPage || captchaFrame) {
                        console.log("   ⚠️ Post-search reCAPTCHA/Block detected! Attempting to solve...");
                        const solved = await captchaSolverService.solve(page);
                        if (solved) {
                            console.log("   ✅ reCAPTCHA solved, waiting for redirection...");
                            await page.waitForTimeout(3000);
                            // Reset wait time to give page time to load results after solve
                            waited = 0;
                            continue;
                        } else {
                            console.log("   ❌ Failed to solve post-search reCAPTCHA.");
                            break; // Stop waiting if we can't solve
                        }
                    }

                    await page.waitForTimeout(checkInterval);
                    waited += checkInterval;
                }

                if (!resultFound) {
                    console.log("   ⚠️ Timeout waiting for results. proceed to extraction anyway (might be empty).");
                }

            } catch (e) {
                console.log("   ⚠️ Error in results wait loop:", e);
            }

            // Step 9: Expand Results
            try {
                const showAll = page.locator("//div[@id='rw0ISc']").first();
                if (await showAll.isVisible({ timeout: 5000 })) {
                    await showAll.click({ force: true });
                    console.log("   ✅ Clicked 'Show all' button");
                    await page.waitForTimeout(3000);
                }
            } catch { }

            // Step 10: Extract
            const results = await this.extractResults(page);
            const markdown = this.generateMarkdown(query, results);

            return {
                query,
                timestamp: new Date().toISOString(),
                results,
                markdown
            };

        } finally {
            await browserService.release(context, page);
        }
    }
}

export const googleSerpService = new GoogleSerpService();
