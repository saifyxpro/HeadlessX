import { Page, BrowserContext } from 'playwright-core';
import { browserService } from './BrowserService';
import { captchaSolverService } from './CaptchaSolverService';

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

export class GoogleSerpService {
    /**
     * Scrape Google SERP with real-time progress updates
     */
    async scrapeWithProgress(
        query: string,
        profileId: string | undefined,
        timeout: number,
        onProgress: (progress: { step: number; total: number; message: string; status: 'active' | 'completed' | 'pending' }) => void
    ): Promise<SearchResponse> {
        const TOTAL_STEPS = 6;
        let browserContext: BrowserContext | null = null;
        let page: Page | null = null;

        try {
            // STEP 1: Launch Browser
            onProgress({ step: 1, total: TOTAL_STEPS, message: 'Launching browser', status: 'active' });
            const browserResult = await browserService.getPage({ profileId });
            page = browserResult.page;
            browserContext = browserResult.context;
            onProgress({ step: 1, total: TOTAL_STEPS, message: 'Launching browser', status: 'completed' });

            // STEP 2: Navigating to Google (Includes Consent & AI Mode setup)
            onProgress({ step: 2, total: TOTAL_STEPS, message: 'Navigating to Google', status: 'active' });
            await page.setViewportSize({ width: 1920, height: 1080 }); // Match Python logic
            await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });
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
                        onProgress({ step: 4, total: TOTAL_STEPS, message: `CAPTCHA detected at ${location}! Solving...`, status: 'active' });
                        await captchaSolverService.solve(page);
                        await page.waitForTimeout(3000);

                        // If still on sorry page, navigate back to Google
                        if (page.url().includes('/sorry/')) {
                            console.log('   🔄 Navigating back to Google after CAPTCHA...');
                            await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });
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

            // AI Mode (Part of Navigation/Setup)
            let aiModeClicked = false;
            try {
                // XPath from Python script: //button[contains(@class, 'plR5qb')]
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
            onProgress({ step: 2, total: TOTAL_STEPS, message: 'Navigating to Google', status: 'completed' });

            // CAPTCHA CHECK #2: After AI Mode click (before trying to type)
            await checkAndSolveCaptcha('after AI mode click');

            // STEP 3: Inputting search details (Includes finding input, typing, submitting)
            onProgress({ step: 3, total: TOTAL_STEPS, message: 'Inputting search details', status: 'active' });

            // Find Search Input & Type
            let searchInput: any = null;
            let typed = false;

            // Strategy 1: AI Mode Input (if activated)
            if (aiModeClicked) {
                try {
                    const el = page.locator("//textarea[contains(@class, 'ITIRGe')]").first();
                    if (await el.isVisible({ timeout: 2000 })) {
                        console.log("   found AI input, attempting to type...");
                        await el.click({ force: true, timeout: 3000 }); // Force click to avoid overlay issues
                        await page.waitForTimeout(500);
                        for (const char of query) {
                            await el.type(char, { delay: Math.random() * 50 + 30 });
                        }
                        typed = true;
                        searchInput = el; // Mark as found/used
                    }
                } catch (e) {
                    console.log("   ⚠️ AI Input failed (click/type), falling back to standard...", e);
                    await page.waitForTimeout(1000); // Allow UI to settle (e.g. AI overlay closing)
                }
            }

            // Strategy 2: Standard Input (Fallback or Default)
            if (!typed) {
                const searchXpaths = ["//textarea[@name='q']", "//input[@name='q']"];
                for (const xpath of searchXpaths) {
                    try {
                        const el = page.locator(xpath).first();
                        if (await el.isVisible({ timeout: 3000 })) { // Increased wait for visibility
                            await el.click({ force: true, timeout: 3000 }); // Increased click timeout
                            await page.waitForTimeout(500);
                            await el.fill(query); // Use fill for reliability on standard input if type fails
                            typed = true;
                            searchInput = el;
                            break;
                        }
                    } catch { }
                }
            }

            if (!typed) throw new Error("Could not find or type in any search input");
            onProgress({ step: 3, total: TOTAL_STEPS, message: 'Inputting search details', status: 'completed' });

            // Submit
            await page.keyboard.press('Enter');
            // Try explicit send button if available (robust)
            try {
                const sendBtn = page.locator("//button[@aria-label='Send']").first();
                if (await sendBtn.isVisible({ timeout: 1000 })) await sendBtn.click();
            } catch { }

            // STEP 4: Solving potential CAPTCHAs (Includes Waiting & Checking)
            onProgress({ step: 4, total: TOTAL_STEPS, message: 'Solving potential CAPTCHAs', status: 'active' });

            // Initial mandatory wait from Python script
            await page.waitForTimeout(5000);

            // Wait loop for results or captcha
            const maxWait = 120000;
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
                    await captchaSolverService.solve(page);
                    await page.waitForTimeout(3000);
                }

                await page.waitForTimeout(1000);
                waited += 1000;
            }
            onProgress({ step: 4, total: TOTAL_STEPS, message: 'Solving potential CAPTCHAs', status: 'completed' });

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
            console.error('Google SERP Scrape Error:', error);
            throw error;
        } finally {
            if (!profileId) {
                if (page) {
                    try { await page.close(); } catch { }
                }
                if (browserContext) {
                    await browserService.release(browserContext, profileId);
                }
            } else {
                console.log(`   ℹ️ Keeping profile ${profileId} open (Persistent Mode)`);
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
        let md = `# Google SERP Results\n\n`;
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

    public async search(query: string, profileId?: string): Promise<SearchResponse> {
        console.log(`Starting Google SERP search for: ${query} (Profile: ${profileId || 'Default'})`);
        const { page, context } = await browserService.getPage({ profileId });

        try {
            // Step 1: Navigate
            await page.setViewportSize({ width: 1920, height: 1080 });
            await page.goto('https://www.google.com/');
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
                            await page.goto('https://www.google.com/');
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

            // Step 3: AI Mode
            let aiModeClicked = false;
            try {
                // XPath: //button[contains(@class, 'plR5qb')]
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

            // Step 3.5: Check for Post-AI Click CAPTCHA
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
                                "//textarea[contains(@class, 'ITIRGe')]", // AI mode input
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
            await searchInput.click({ timeout: 120000 });
            await page.waitForTimeout(500);

            for (const char of query) {
                await searchInput.type(char, { delay: Math.random() * 100 + 50 });
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
            await page.close();
            // Don't close context here as it might be default shared one, usage of BrowserService.release(context) is better if we owned it?
            // browserService.getPage returns a fresh page in an existing or new context.
            // If it's a new ad-hoc context (no profile), we should probably ask BrowserService to clean up if we were implementing strict resource management.
            // But checking BrowserService.ts, getPage returns { page, context }. 
            // If no profile, it creates a new context. We should probably accept that `page.close()` is enough for the page, but the context might leak if we don't close it?
            // BrowserService logic: `if (options?.profileId) ... return { page, context }` (reused context)
            // `else ... const context = await browser.newContext() ... return { page, context }` (new context)
            // So we SHOULD close the context if it's not a profile context.
            // But we don't know if we got a profile context or not easily without checking args. 
            // Here we called getPage() with no args, so it's a raw context.
            await context.close();
        }
    }
}

export const googleSerpService = new GoogleSerpService();
