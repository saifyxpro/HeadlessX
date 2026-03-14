import { type Request, type Response } from 'express';
import {
    CreateQueueJobSchema,
    ExtractJobPayloadSchema,
    IndexJobPayloadSchema,
    ListQueueJobsSchema,
    ScrapeJobPayloadSchema,
} from '../../services/queue/jobSchemas';
import { queueJobService } from '../../services/queue/QueueJobService';

export class QueueJobController {
    static async createJob(req: Request, res: Response) {
        try {
            const input = CreateQueueJobSchema.parse(req.body);
            const job = await queueJobService.createJob(input, req.apiKeyId || null);
            res.status(202).json({ success: true, job });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Invalid queue job request',
            });
        }
    }

    static async enqueueScrapeJob(req: Request, res: Response) {
        try {
            const payload = ScrapeJobPayloadSchema.parse(req.body);
            const job = await queueJobService.createJob(
                { type: 'scrape', payload, options: undefined },
                req.apiKeyId || null
            );
            res.status(202).json({ success: true, job });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Invalid scrape job request',
            });
        }
    }

    static async enqueueExtractJob(req: Request, res: Response) {
        try {
            const payload = ExtractJobPayloadSchema.parse(req.body);
            const job = await queueJobService.createJob(
                { type: 'extract', payload, options: undefined },
                req.apiKeyId || null
            );
            res.status(202).json({ success: true, job });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Invalid extract job request',
            });
        }
    }

    static async enqueueIndexJob(req: Request, res: Response) {
        try {
            const payload = IndexJobPayloadSchema.parse(req.body);
            const job = await queueJobService.createJob(
                { type: 'index', payload, options: undefined },
                req.apiKeyId || null
            );
            res.status(202).json({ success: true, job });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Invalid index job request',
            });
        }
    }

    static async listJobs(req: Request, res: Response) {
        try {
            const filters = ListQueueJobsSchema.parse(req.query);
            const jobs = await queueJobService.listJobs(filters);
            res.json({ success: true, jobs });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Invalid queue filters',
            });
        }
    }

    static async getMetrics(req: Request, res: Response) {
        try {
            const metrics = await queueJobService.getQueueMetrics();
            res.json({ success: true, metrics });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to read queue metrics',
            });
        }
    }
}
