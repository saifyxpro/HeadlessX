import { Request, Response } from 'express';
import { scraperService } from '../services/ScraperService';
import { z } from 'zod';
import { CloudflareChallengeError } from '../services/CloudflareChallengeService';

const ScrapeRequestSchema = z.object({
    url: z.string().url(),
    profileId: z.string().optional(),
    // Backward-compatible top-level fields
    stealth: z.boolean().optional(),
    waitForSelector: z.string().optional(),
    screenshotOnError: z.boolean().optional(),
    options: z.object({
        waitForSelector: z.string().optional(),
        waitForTimeout: z.number().optional(),
        stealth: z.boolean().optional(),
        proxy: z.string().optional(),
        screenshotOnError: z.boolean().optional()
    }).optional()
});

type ScrapeRequestInput = z.infer<typeof ScrapeRequestSchema>;

function normalizeOptions(input: ScrapeRequestInput) {
    return {
        waitForSelector: input.options?.waitForSelector ?? input.waitForSelector,
        stealth: input.options?.stealth ?? input.stealth,
        screenshotOnError: input.options?.screenshotOnError ?? input.screenshotOnError ?? true,
    };
}

function buildErrorResponse(error: unknown, fallbackCode: string) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (error instanceof CloudflareChallengeError) {
        return {
            status: 403,
            body: {
                success: false,
                error: {
                    code: error.code,
                    message
                },
                challenge: error.challenge
            }
        };
    }

    return {
        status: 500,
        body: {
            success: false,
            error: {
                code: fallbackCode,
                message
            }
        }
    };
}

export class ScrapeControllerV2 {

    static async getHtml(req: Request, res: Response) {
        try {
            const parsed = ScrapeRequestSchema.parse(req.body);
            const { url, profileId } = parsed;
            const normalized = normalizeOptions(parsed);

            const start = Date.now();
            const result = await scraperService.scrape(url, {
                waitForSelector: normalized.waitForSelector,
                apiKeyId: req.apiKeyId,
                profileId,
                stealth: normalized.stealth,
                screenshotOnError: normalized.screenshotOnError,
                jsEnabled: false // Standard HTML scrape
            });

            res.json({
                url: result.url,
                html: result.html,
                stats: {
                    duration: Date.now() - start,
                    statusCode: result.statusCode
                }
            });

        } catch (error) {
            const formatted = buildErrorResponse(error, 'SCRAPE_FAILED');
            res.status(formatted.status).json(formatted.body);
        }
    }

    static async getHtmlJs(req: Request, res: Response) {
        try {
            const parsed = ScrapeRequestSchema.parse(req.body);
            const { url, profileId } = parsed;
            const normalized = normalizeOptions(parsed);

            const start = Date.now();
            // Force strict JS waiting
            const result = await scraperService.scrape(url, {
                waitForSelector: normalized.waitForSelector || 'body',
                apiKeyId: req.apiKeyId,
                profileId,
                stealth: normalized.stealth ?? true, // Default to stealth for JS sites
                screenshotOnError: normalized.screenshotOnError,
                jsEnabled: true
            });

            res.json({
                url: result.url,
                html: result.html,
                stats: {
                    duration: Date.now() - start,
                    statusCode: result.statusCode
                }
            });

        } catch (error) {
            const formatted = buildErrorResponse(error, 'JS_SCRAPE_FAILED');
            res.status(formatted.status).json(formatted.body);
        }
    }

    static async getContent(req: Request, res: Response) {
        try {
            const parsed = ScrapeRequestSchema.parse(req.body);
            const { url, profileId } = parsed;
            const normalized = normalizeOptions(parsed);

            const result = await scraperService.scrapeContent(url, {
                waitForSelector: normalized.waitForSelector,
                apiKeyId: req.apiKeyId,
                profileId,
                stealth: normalized.stealth,
                screenshotOnError: normalized.screenshotOnError
            });

            res.json({
                url: result.url,
                markdown: result.markdown,
                title: result.title,
                metadata: {
                    description: result.metadata?.description,
                    keywords: typeof result.metadata?.keywords === 'string'
                        ? result.metadata.keywords.split(',').map(k => k.trim())
                        : [],
                    author: result.metadata?.author
                }
            });

        } catch (error) {
            const formatted = buildErrorResponse(error, 'CONTENT_EXTRACT_FAILED');
            res.status(formatted.status).json(formatted.body);
        }
    }

    static async getScreenshot(req: Request, res: Response) {
        try {
            const parsed = ScrapeRequestSchema.parse(req.body);
            const { url, profileId } = parsed;
            const normalized = normalizeOptions(parsed);
            const buffer = await scraperService.screenshot(url, {
                waitForSelector: normalized.waitForSelector,
                apiKeyId: req.apiKeyId,
                profileId,
                stealth: normalized.stealth
            });

            res.setHeader('Content-Type', 'image/jpeg');
            res.send(buffer);
        } catch (error) {
            const formatted = buildErrorResponse(error, 'SCREENSHOT_FAILED');
            res.status(formatted.status).json(formatted.body);
        }
    }

}
