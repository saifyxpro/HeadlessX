import { Request, Response } from 'express';
import { scraperService } from '../services/ScraperService';
import { z } from 'zod';

const ScrapeRequestSchema = z.object({
    url: z.string().url(),
    profileId: z.string().optional(),
    options: z.object({
        waitForSelector: z.string().optional(),
        waitForTimeout: z.number().optional(),
        stealth: z.boolean().optional(),
        proxy: z.string().optional(),
        screenshotOnError: z.boolean().optional()
    }).optional()
});

export class ScrapeControllerV2 {

    static async getHtml(req: Request, res: Response) {
        try {
            const { url, profileId, options } = ScrapeRequestSchema.parse(req.body);

            const start = Date.now();
            const result = await scraperService.scrape(url, {
                waitForSelector: options?.waitForSelector,
                apiKeyId: req.apiKeyId,
                profileId,
                stealth: options?.stealth,
                screenshotOnError: options?.screenshotOnError ?? true,
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
            res.status(500).json({
                success: false,
                error: {
                    code: 'SCRAPE_FAILED',
                    message: (error as Error).message
                }
            });
        }
    }

    static async getHtmlJs(req: Request, res: Response) {
        try {
            const { url, profileId, options } = ScrapeRequestSchema.parse(req.body);

            const start = Date.now();
            // Force strict JS waiting
            const result = await scraperService.scrape(url, {
                waitForSelector: options?.waitForSelector || 'body',
                apiKeyId: req.apiKeyId,
                profileId,
                stealth: options?.stealth ?? true, // Default to stealth for JS sites
                screenshotOnError: options?.screenshotOnError ?? true,
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
            res.status(500).json({
                success: false,
                error: {
                    code: 'JS_SCRAPE_FAILED',
                    message: (error as Error).message
                }
            });
        }
    }

    static async getContent(req: Request, res: Response) {
        try {
            const { url, profileId, options } = ScrapeRequestSchema.parse(req.body);

            const result = await scraperService.scrapeContent(url, {
                waitForSelector: options?.waitForSelector,
                apiKeyId: req.apiKeyId,
                profileId,
                stealth: options?.stealth,
                screenshotOnError: options?.screenshotOnError ?? true
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
            res.status(500).json({
                success: false,
                error: {
                    code: 'CONTENT_EXTRACT_FAILED',
                    message: (error as Error).message
                }
            });
        }
    }

    static async getScreenshot(req: Request, res: Response) {
        try {
            const { url, profileId, options } = ScrapeRequestSchema.parse(req.body);
            const buffer = await scraperService.screenshot(url, {
                waitForSelector: options?.waitForSelector,
                apiKeyId: req.apiKeyId,
                profileId,
                stealth: options?.stealth
            });

            res.setHeader('Content-Type', 'image/jpeg');
            res.send(buffer);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: {
                    code: 'SCREENSHOT_FAILED',
                    message: (error as Error).message
                }
            });
        }
    }

    static async getPdf(req: Request, res: Response) {
        try {
            const { url, profileId, options } = ScrapeRequestSchema.parse(req.body);
            const buffer = await scraperService.pdf(url, {
                waitForSelector: options?.waitForSelector,
                apiKeyId: req.apiKeyId,
                profileId,
                stealth: options?.stealth
            });

            res.setHeader('Content-Type', 'application/pdf');
            res.send(buffer);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: {
                    code: 'PDF_FAILED',
                    message: (error as Error).message
                }
            });
        }
    }
}
