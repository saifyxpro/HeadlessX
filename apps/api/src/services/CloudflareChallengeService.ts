import { Page } from 'playwright-core';

type ChallengeType = 'turnstile' | 'interstitial' | 'unknown';
type DetectionConfidence = 'low' | 'medium' | 'high';

export interface CloudflareChallengeDetection {
    provider: 'cloudflare';
    detected: boolean;
    challengeType: ChallengeType;
    confidence: DetectionConfidence;
    indicators: string[];
    url: string;
    title: string;
}

export class CloudflareChallengeError extends Error {
    public readonly code = 'CLOUDFLARE_CHALLENGE_DETECTED';
    public readonly challenge: CloudflareChallengeDetection;

    constructor(challenge: CloudflareChallengeDetection) {
        super(
            `Cloudflare challenge detected (${challenge.challengeType}, confidence: ${challenge.confidence})`
        );
        this.name = 'CloudflareChallengeError';
        this.challenge = challenge;
    }
}

interface DomSignals {
    hasTurnstileInput: boolean;
    hasTurnstileIframe: boolean;
    hasTurnstileWidget: boolean;
    hasChallengeForm: boolean;
    hasChallengeContainer: boolean;
    hasVerifyHumanText: boolean;
    hasJustMomentText: boolean;
    hasCheckingBrowserText: boolean;
    hasRayIdText: boolean;
    hasCloudflareText: boolean;
}

class CloudflareChallengeService {
    private static instance: CloudflareChallengeService;

    public static getInstance(): CloudflareChallengeService {
        if (!CloudflareChallengeService.instance) {
            CloudflareChallengeService.instance = new CloudflareChallengeService();
        }
        return CloudflareChallengeService.instance;
    }

    private async getDomSignals(page: Page): Promise<DomSignals> {
        try {
            return await page.evaluate(() => {
                const bodyText = (document.body?.innerText || '').toLowerCase();
                const hasChallengeForm = Boolean(
                    document.querySelector("form[action*='/cdn-cgi/challenge-platform']")
                );

                return {
                    hasTurnstileInput: Boolean(document.querySelector("input[name='cf-turnstile-response']")),
                    hasTurnstileIframe: Boolean(document.querySelector("iframe[src*='challenges.cloudflare.com']")),
                    hasTurnstileWidget: Boolean(
                        document.querySelector('.cf-turnstile, [data-sitekey][data-action]')
                    ),
                    hasChallengeForm,
                    hasChallengeContainer: Boolean(
                        document.querySelector('#challenge-stage, #challenge-form, .challenge-form')
                    ),
                    hasVerifyHumanText:
                        bodyText.includes('verify you are human') ||
                        bodyText.includes('verify you are a human'),
                    hasJustMomentText: bodyText.includes('just a moment'),
                    hasCheckingBrowserText: bodyText.includes('checking your browser before accessing'),
                    hasRayIdText: bodyText.includes('ray id'),
                    hasCloudflareText: bodyText.includes('cloudflare'),
                };
            });
        } catch {
            return {
                hasTurnstileInput: false,
                hasTurnstileIframe: false,
                hasTurnstileWidget: false,
                hasChallengeForm: false,
                hasChallengeContainer: false,
                hasVerifyHumanText: false,
                hasJustMomentText: false,
                hasCheckingBrowserText: false,
                hasRayIdText: false,
                hasCloudflareText: false,
            };
        }
    }

    public async detect(page: Page): Promise<CloudflareChallengeDetection> {
        const url = page.url() || '';
        const lowerUrl = url.toLowerCase();
        const title = await page.title().catch(() => '');
        const lowerTitle = title.toLowerCase();
        const frameUrls = page.frames().map(frame => frame.url().toLowerCase());
        const dom = await this.getDomSignals(page);

        const indicators: string[] = [];
        let strongSignals = 0;
        let softSignals = 0;

        const hasChallengeUrl =
            lowerUrl.includes('/cdn-cgi/challenge-platform') ||
            lowerUrl.includes('/cdn-cgi/challenge');
        if (hasChallengeUrl) {
            indicators.push('challenge-url');
            strongSignals += 1;
        }

        if (frameUrls.some(frameUrl => frameUrl.includes('challenges.cloudflare.com'))) {
            indicators.push('challenge-frame');
            strongSignals += 1;
        }

        if (dom.hasTurnstileInput) {
            indicators.push('turnstile-response-input');
            strongSignals += 1;
        }

        if (dom.hasTurnstileIframe) {
            indicators.push('turnstile-iframe');
            strongSignals += 1;
        }

        if (dom.hasChallengeForm || dom.hasChallengeContainer) {
            indicators.push('challenge-form');
            strongSignals += 1;
        }

        if (dom.hasTurnstileWidget) {
            indicators.push('turnstile-widget');
            softSignals += 1;
        }

        const titleIsChallenge =
            lowerTitle.includes('just a moment') ||
            lowerTitle.includes('attention required') ||
            lowerTitle.includes('checking your browser');
        if (titleIsChallenge) {
            indicators.push('challenge-title');
            softSignals += 1;
        }

        if (dom.hasVerifyHumanText) {
            indicators.push('verify-human-text');
            softSignals += 1;
        }
        if (dom.hasJustMomentText) {
            indicators.push('just-a-moment-text');
            softSignals += 1;
        }
        if (dom.hasCheckingBrowserText) {
            indicators.push('checking-browser-text');
            softSignals += 1;
        }
        if (dom.hasRayIdText && dom.hasCloudflareText) {
            indicators.push('cloudflare-ray-id');
            softSignals += 1;
        }

        const detected = strongSignals > 0 || softSignals >= 2;

        let confidence: DetectionConfidence = 'low';
        if (strongSignals >= 2 || (strongSignals >= 1 && softSignals >= 1)) {
            confidence = 'high';
        } else if (strongSignals >= 1 || softSignals >= 2) {
            confidence = 'medium';
        }

        let challengeType: ChallengeType = 'unknown';
        if (dom.hasTurnstileInput || dom.hasTurnstileIframe || dom.hasTurnstileWidget) {
            challengeType = 'turnstile';
        } else if (hasChallengeUrl || titleIsChallenge || dom.hasChallengeForm || dom.hasChallengeContainer) {
            challengeType = 'interstitial';
        }

        return {
            provider: 'cloudflare',
            detected,
            challengeType,
            confidence,
            indicators,
            url,
            title,
        };
    }

    public async detectAfterNavigation(
        page: Page,
        options: { recheck?: boolean } = {}
    ): Promise<CloudflareChallengeDetection> {
        const firstPass = await this.detect(page);
        if (firstPass.detected || !options.recheck) {
            return firstPass;
        }

        await page.waitForTimeout(900);
        return this.detect(page);
    }

    public async solveChallenge(page: Page): Promise<boolean> {
        console.log('CF: Attempting to solve Cloudflare Challenge...');
        try {
            console.log('CF: Waiting 5 seconds for initial load...');
            await page.waitForTimeout(5000);

            const title = await page.title().catch(() => '');
            const isCfInterstitial = title.toLowerCase().includes('just a moment');

            if (!isCfInterstitial) {
                const cfInput = page.locator('[name="cf-turnstile-response"]').first();
                try {
                    await cfInput.waitFor({ state: 'attached', timeout: 5000 });
                } catch {
                    console.log('CF: No Cloudflare Challenge input detected. Proceeding.');
                    return false;
                }
            }

            console.log('CF: Cloudflare challenge page detected! Waiting 3s...');
            await page.waitForTimeout(3000);

            const iframeElement = page.locator("iframe[src*='challenges.cloudflare.com']").first();
            let box: { x: number; y: number; width: number; height: number } | null = null;
            
            try {
                await iframeElement.waitFor({ state: 'attached', timeout: 8000 });
                box = await iframeElement.boundingBox();
                if (box) {
                    console.log(`CF: Turnstile IFRAME bounds: x=${Math.round(box.x)} y=${Math.round(box.y)} w=${Math.round(box.width)} h=${Math.round(box.height)}`);
                }
            } catch (e) {
                console.log(`CF: Could not get iframe bounding box: ${(e as Error).message}`);
            }

            if (!box || box.width === 0 || box.height === 0) {
                console.log("CF: Iframe element has no visible bounds. Trying frame URL matching...");
                for (const frame of page.frames()) {
                    if (frame.url().includes("challenges.cloudflare.com")) {
                        console.log(`CF: Found CF frame: ${frame.url().substring(0, 100)}`);
                        try {
                            const frameElement = await frame.frameElement();
                            box = await frameElement.boundingBox();
                            if (box) {
                                console.log(`CF: Frame element bounds: x=${Math.round(box.x)} y=${Math.round(box.y)} w=${Math.round(box.width)} h=${Math.round(box.height)}`);
                                break;
                            }
                        } catch (e2) {
                            console.log(`CF: frameElement() fallback failed: ${(e2 as Error).message}`);
                        }
                    }
                }
            }

            if (box && box.width > 0 && box.height > 0) {
                const xTarget = box.x + 30 + (Math.random() * 10 - 5);
                const yTarget = box.y + (box.height / 2) + (Math.random() * 6 - 3);

                console.log(`CF: Clicking checkbox at (${xTarget.toFixed(1)}, ${yTarget.toFixed(1)})...`);

                const steps = Math.floor(Math.random() * 9) + 10; // 10 to 18 steps
                await page.mouse.move(xTarget, yTarget, { steps });
                
                const hoverDelay = Math.random() * 250 + 150; // 150 to 400ms
                await page.waitForTimeout(hoverDelay);
                
                await page.mouse.down();
                const clickDuration = Math.floor(Math.random() * 81) + 50; // 50 to 130ms
                await page.waitForTimeout(clickDuration);
                await page.mouse.up();

                console.log("CF: Click executed. Waiting 8s for verification...");
                await page.waitForTimeout(8000);

                const newTitle = await page.title().catch(() => '');
                if (!newTitle.toLowerCase().includes("just a moment")) {
                    console.log("CF: Challenge appears solved! Page title changed.");
                    return true;
                } else {
                    console.log("CF: Page title still shows challenge. May need retry.");
                }
            } else {
                console.log("CF: FAILED - Could not find any clickable Turnstile iframe.");
            }

        } catch (e) {
            console.error(`CF: Exception during bypass:`, e);
        }

        console.log("CF: Proceeding without successful bypass or bypass failed.");
        return false;
    }
}

export const cloudflareChallengeService = CloudflareChallengeService.getInstance();
