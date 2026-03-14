import { type Request, type Response } from 'express';
import { z } from 'zod';
import { jobManager } from '../../services/JobManager';
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
    static async streamMap(req: Request, res: Response) {
        const startedAt = Date.now();

        try {
            const input = MapRequestSchema.parse(req.body);
            const job = jobManager.createJob(input.url, 'map', {
                waitForSelector: input.waitForSelector,
                timeout: input.timeout,
            });
            jobManager.updateStatus(job.id, 'running');

            const abortController = new AbortController();

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');
            res.flushHeaders();
            res.locals.skipLogging = true;

            const sendEvent = (event: string, data: any) => {
                if (res.writableEnded || res.destroyed) {
                    return;
                }

                res.write(`event: ${event}\n`);
                res.write(`data: ${JSON.stringify(data)}\n\n`);
            };

            let cleanedUp = false;
            const cleanup = () => {
                if (cleanedUp) {
                    return;
                }
                cleanedUp = true;
                req.removeListener('aborted', handleAbort);
                res.removeListener('close', handleClose);
                res.removeListener('finish', cleanup);
            };

            const handleAbort = () => {
                abortController.abort();
                jobManager.cancelJob(job.id);
                cleanup();
            };

            const handleClose = () => {
                if (!res.writableEnded) {
                    abortController.abort();
                    jobManager.cancelJob(job.id);
                }
                cleanup();
            };

            req.on('aborted', handleAbort);
            res.on('close', handleClose);
            res.on('finish', cleanup);

            sendEvent('start', { url: input.url, type: 'map', jobId: job.id, timestamp: Date.now() });

            const result = await websiteDiscoveryService.map(input, {
                abortSignal: abortController.signal,
                onProgress: (progress) => {
                    jobManager.updateProgress(job.id, progress);
                },
            });

            jobManager.completeJob(job.id, {
                success: true,
                url: result.url,
                duration: Date.now() - startedAt,
            });

            const payload = {
                success: true,
                type: 'map',
                data: result,
                url: result.url,
                duration: Date.now() - startedAt,
            };

            sendEvent('result', payload);
            sendEvent('done', { timestamp: Date.now() });
            cleanup();
            res.end();
        } catch (error) {
            if (!res.headersSent) {
                return res.status(400).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Map request failed',
                });
            }

            if (!res.writableEnded && !res.destroyed) {
                res.write(`event: error\n`);
                res.write(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Map request failed' })}\n\n`);
                res.write(`event: done\n`);
                res.write(`data: ${JSON.stringify({ timestamp: Date.now(), cancelled: (error as Error)?.name === 'JobCancelledError' })}\n\n`);
                res.end();
            }
        }
    }

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
