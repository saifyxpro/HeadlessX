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
}

export const cloudflareChallengeService = CloudflareChallengeService.getInstance();
