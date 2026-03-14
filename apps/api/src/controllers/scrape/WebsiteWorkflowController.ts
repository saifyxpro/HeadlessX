import { type Request, type Response } from 'express';
import { z } from 'zod';
import { queueJobService } from '../../services/queue/QueueJobService';
import { CrawlJobPayloadSchema } from '../../services/queue/jobSchemas';
import { isQueueUnavailableError } from '../../services/queue/redis';
import { websiteDiscoveryService } from '../../services/scrape/WebsiteDiscoveryService';

const MapRequestSchema = z.object({
    url: z.string().url(),
    limit: z.number().int().min(1).max(250).optional(),
    includeSubdomains: z.boolean().optional(),
    includeExternal: z.boolean().optional(),
    useSitemap: z.boolean().optional(),
    timeout: z.number().int().positive().optional(),
    stealth: z.boolean().optional(),
    waitForSelector: z.string().min(1).optional(),
});

export class WebsiteWorkflowController {
    static async map(req: Request, res: Response) {
        try {
            const input = MapRequestSchema.parse(req.body);
            const result = await websiteDiscoveryService.map(input);
            res.json({
                success: true,
                type: 'map',
                data: result,
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Map request failed',
            });
        }
    }

    static async crawl(req: Request, res: Response) {
        try {
            const payload = CrawlJobPayloadSchema.parse(req.body);
            const job = await queueJobService.createJob(
                { type: 'crawl', payload, options: undefined },
                req.apiKeyId || null
            );

            res.status(202).json({ success: true, job });
        } catch (error) {
            res.status(isQueueUnavailableError(error) ? 503 : 400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Invalid crawl job request',
            });
        }
    }
}
