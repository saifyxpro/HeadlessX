import { Request, Response } from 'express';
import { scraperService } from '../../services/scrape/ScraperService';
import { browserService } from '../../services/scrape/BrowserService';
import { z } from 'zod';

// Validation Schema
const ScrapeSchema = z.object({
    url: z.string().url(),
    waitForSelector: z.string().optional(),
    proxy: z.string().optional(),
    stealth: z.boolean().optional(),
    screenshotOnError: z.boolean().optional()
});

export class ScrapeController {

    static async getHtml(req: Request, res: Response) {
        try {
            const options = ScrapeSchema.parse(req.body);
            const result = await scraperService.scrape(options.url, {
                waitForSelector: options.waitForSelector,
                apiKeyId: req.apiKeyId,
                screenshotOnError: options.screenshotOnError
            });
            res.json({ success: true, ...result });
        } catch (error) {
            res.locals.errorMessage = (error as Error).message;
            res.status(500).json({ success: false, error: { code: 'SCRAPE_FAILED', message: (error as Error).message } });
        }
    }

    static async getHtmlJs(req: Request, res: Response) {
        try {
            const options = ScrapeSchema.parse(req.body);
            const result = await scraperService.scrape(options.url, {
                waitForSelector: options.waitForSelector,
                jsEnabled: true,
                apiKeyId: req.apiKeyId,
                screenshotOnError: options.screenshotOnError
            });
            res.json({ success: true, ...result });
        } catch (error) {
            res.locals.errorMessage = (error as Error).message;
            res.status(500).json({ success: false, error: { code: 'JS_SCRAPE_FAILED', message: (error as Error).message } });
        }
    }


    static async gptContent(req: Request, res: Response) {
        try {
            const options = ScrapeSchema.parse(req.body);
            const result = await scraperService.scrapeContent(options.url, {
                waitForSelector: options.waitForSelector,
                apiKeyId: req.apiKeyId,
                screenshotOnError: options.screenshotOnError
            });
            res.json({ success: true, ...result });
        } catch (error) {
            res.locals.errorMessage = (error as Error).message;
            res.status(500).json({ success: false, error: { code: 'CONTENT_EXTRACT_FAILED', message: (error as Error).message } });
        }
    }

    static async screenshot(req: Request, res: Response) {
        try {
            const { url, waitForSelector } = ScrapeSchema.parse(req.body);
            const { page, context } = await browserService.getPage();

            try {
                await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
                if (waitForSelector) await page.waitForSelector(waitForSelector);

                const buffer = await page.screenshot({ fullPage: true, type: 'jpeg', quality: 80 });

                res.setHeader('Content-Type', 'image/jpeg');
                res.send(buffer);
            } finally {
                await browserService.release(context, page);
            }
        } catch (error) {
            res.locals.errorMessage = (error as Error).message;
            res.status(500).json({ success: false, error: { code: 'SCREENSHOT_FAILED', message: (error as Error).message } });
        }
    }
}
