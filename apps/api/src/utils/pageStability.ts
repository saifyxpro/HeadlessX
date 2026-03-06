import { Page } from 'playwright-core';

interface PageStabilityOptions {
    selector?: string;
    maxWaitMs?: number;
    stabilityWindowMs?: number;
    pollIntervalMs?: number;
}

export async function waitForPageStability(page: Page, options: PageStabilityOptions = {}): Promise<void> {
    const maxWaitMs = options.maxWaitMs ?? 8000;
    const stabilityWindowMs = options.stabilityWindowMs ?? 1500;
    const pollIntervalMs = options.pollIntervalMs ?? 250;
    const deadline = Date.now() + maxWaitMs;

    let lastSnapshot = '';
    let stableSince = Date.now();

    while (Date.now() < deadline) {
        const snapshot = await page.evaluate((selector) => {
            const root = document.documentElement;
            const selectorCount = selector ? document.querySelectorAll(selector).length : 0;
            const htmlLength = root?.outerHTML.length ?? 0;
            const textLength = document.body?.innerText?.length ?? 0;
            const scrollHeight = document.body?.scrollHeight ?? 0;

            return [
                document.readyState,
                selectorCount,
                htmlLength,
                textLength,
                scrollHeight
            ].join(':');
        }, options.selector);

        if (snapshot === lastSnapshot) {
            if (Date.now() - stableSince >= stabilityWindowMs) {
                return;
            }
        } else {
            lastSnapshot = snapshot;
            stableSince = Date.now();
        }

        await page.waitForTimeout(pollIntervalMs);
    }
}
