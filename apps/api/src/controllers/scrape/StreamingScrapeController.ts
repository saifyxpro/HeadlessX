import { Request, Response } from 'express';
import { streamingScraperService, StreamProgress } from '../../services/scrape/StreamingScraperService';
import { jobManager } from '../../services/JobManager';
import { prisma } from '../../database/client';
import { queueConfig } from '../../services/queue/queueConfig';
import { queueJobService } from '../../services/queue/QueueJobService';
import { z } from 'zod';

const StreamRequestSchema = z.object({
    url: z.string().url(),
    type: z.enum(['html', 'html-js', 'content', 'screenshot']),
    stealth: z.boolean().optional(), // Speed mode when false
    fullPage: z.boolean().optional(),
    options: z.object({
        waitForSelector: z.string().optional(),
        timeout: z.number().optional(),
    }).optional()
});

export class StreamingScrapeController {
    /**
     * SSE Streaming endpoint for real-time scraping progress
     * POST /api/website/scrape
     */
    static async streamScrape(req: Request, res: Response) {
        const startTime = Date.now();
        console.log('🔥 Stream endpoint hit');
        try {
            const { url, type, stealth, fullPage, options } = StreamRequestSchema.parse(req.body);
            console.log('📋 Request parsed:', { url, type, stealth, fullPage });

            // Create job for tracking
            const job = jobManager.createJob(url, type, {
                waitForSelector: options?.waitForSelector,
                timeout: options?.timeout,
                fullPage
            });
            jobManager.updateStatus(job.id, 'running');

            // Set SSE headers
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');
            res.flushHeaders();

            // Prevent double logging (middleware vs manual)
            res.locals.skipLogging = true;

            // Helper to send SSE event
            // Helper to send SSE event
            const sendEvent = (event: string, data: any) => {
                if (res.writableEnded || res.destroyed) {
                    return;
                }

                // Optimization: Don't stringify large payloads for logging to prevent OOM
                let logPreview = '';
                if (data && (event === 'result' || event === 'progress')) {
                    if (data.data && typeof data.data === 'string' && data.data.length > 500) {
                        // Create a shallow copy for logging to avoid mutating original
                        const preview = { ...data, data: `[Large Content: ${data.data.length} chars]...` };
                        logPreview = JSON.stringify(preview);
                    } else if (data.screenshot) { // Handle raw buffer if present
                        const preview = { ...data, screenshot: '[Buffer]...' };
                        logPreview = JSON.stringify(preview);
                    } else {
                        logPreview = JSON.stringify(data);
                    }
                } else {
                    logPreview = JSON.stringify(data);
                }

                console.log('📤 Sending SSE:', event, logPreview.slice(0, 200));

                res.write(`event: ${event}\n`);
                res.write(`data: ${JSON.stringify(data)}\n\n`);
            };

            // Add this response as a listener for the job
            jobManager.addListener(job.id, sendEvent);

            let cleanedUp = false;
            const cleanupStream = () => {
                if (cleanedUp) {
                    return;
                }
                cleanedUp = true;
                jobManager.removeListener(job.id, sendEvent);
                req.removeListener('aborted', handleRequestAborted);
                res.removeListener('close', handleResponseClosed);
                res.removeListener('finish', handleResponseFinished);
            };

            const cancelIfStillRunning = () => {
                const currentJob = jobManager.getJob(job.id);
                if (currentJob && (currentJob.status === 'pending' || currentJob.status === 'running')) {
                    jobManager.cancelJob(job.id);
                }
            };

            const handleRequestAborted = () => {
                cleanupStream();
                cancelIfStillRunning();
            };

            const handleResponseClosed = () => {
                cleanupStream();

                // `close` fires after `finish` on normal completion. Only treat it as a disconnect
                // when the response did not finish writing the SSE stream.
                if (!res.writableEnded) {
                    cancelIfStillRunning();
                }
            };

            const handleResponseFinished = () => {
                cleanupStream();
            };

            req.on('aborted', handleRequestAborted);
            res.on('close', handleResponseClosed);
            res.on('finish', handleResponseFinished);

            // Progress callback - stores in job and broadcasts
            const onProgress = (progress: StreamProgress) => {
                console.log('⏳ Progress:', progress);
                jobManager.updateProgress(job.id, progress);
            };

            // Start scraping - include jobId in start event
            sendEvent('start', { url, type, jobId: job.id, timestamp: Date.now() });

            const result = await streamingScraperService.scrapeWithProgress(
                url,
                type,
                {
                    jobId: job.id,
                    abortSignal: jobManager.getAbortSignal(job.id),
                    waitForSelector: options?.waitForSelector,
                    timeout: options?.timeout,
                    stealth, // Pass stealth for speed mode
                    jsEnabled: type === 'html-js',
                    fullPage: fullPage
                },
                onProgress
            );

            // Complete the job
            jobManager.completeJob(job.id, result);

            if (!result.cancelled && !jobManager.isCancelled(job.id)) {
                const formattedResult = StreamingScrapeController.formatResult(type, result);
                jobManager.broadcast(job.id, 'result', formattedResult);
                jobManager.broadcast(job.id, 'done', { timestamp: Date.now() });
            } else {
                jobManager.broadcast(job.id, 'done', { timestamp: Date.now(), cancelled: true });
            }

            // Log the request
            const duration = Date.now() - startTime;
            prisma.requestLog.create({
                data: {
                    api_key_id: req.apiKeyId || null,
                    url: url,
                    method: 'POST',
                    status_code: result.success
                        ? 200
                        : result.code === 'CLOUDFLARE_CHALLENGE_DETECTED'
                            ? 403
                            : 500,
                    duration_ms: duration,
                    error_message: result.error || null,
                }
            }).catch(err => console.error('Log failed:', err));

            // Remove listener and end response
            cleanupStream();
            res.end();

        } catch (error) {
            const duration = Date.now() - startTime;

            prisma.requestLog.create({
                data: {
                    api_key_id: req.apiKeyId || null,
                    url: req.body?.url || 'unknown',
                    method: 'POST',
                    status_code: 400,
                    duration_ms: duration,
                    error_message: (error as Error).message,
                }
            }).catch(err => console.error('Log failed:', err));

            if (!res.headersSent) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: (error as Error).message
                    }
                });
            } else {
                if (!res.writableEnded && !res.destroyed) {
                    res.write(`event: error\n`);
                    res.write(`data: ${JSON.stringify({ error: (error as Error).message })}\n\n`);
                    res.end();
                }
            }
        }
    }

    /**
     * Get the currently active job
     * GET /api/jobs/active
     */
    static async getActiveJob(req: Request, res: Response) {
        const streamJob = jobManager.getActiveJob();
        if (streamJob) {
            return res.json({
                active: true,
                job: {
                    id: streamJob.id,
                    url: streamJob.url,
                    type: streamJob.type,
                    status: streamJob.status,
                    progress: streamJob.progress,
                    createdAt: streamJob.createdAt,
                    source: 'stream'
                }
            });
        }

        const queueJob = await queueJobService.getFirstActiveJob();
        if (!queueJob) {
            return res.json({ active: false, job: null });
        }

        res.json({ active: true, job: { ...queueJobService.serializeJob(queueJob), source: 'queue' } });
    }

    /**
     * Get a specific job by ID
     * GET /api/jobs/:id
     */
    static async getJob(req: Request, res: Response) {
        const id = req.params.id as string;
        const streamJob = jobManager.getJob(id);

        if (streamJob) {
            let formattedResult: any = null;
            if ((streamJob.status === 'completed' || streamJob.status === 'cancelled') && streamJob.result) {
                formattedResult = StreamingScrapeController.formatResult(streamJob.type, streamJob.result);
            }

            return res.json({
                id: streamJob.id,
                url: streamJob.url,
                type: streamJob.type,
                status: streamJob.status,
                progress: streamJob.progress,
                result: formattedResult,
                error: streamJob.error,
                createdAt: streamJob.createdAt,
                updatedAt: streamJob.updatedAt
            });
        }

        const queueJob = await queueJobService.getJobById(id);
        if (!queueJob) {
            return res.status(404).json({ error: 'Job not found' });
        }

        res.json(queueJobService.serializeJob(queueJob));
    }

    /**
     * Reconnect to a job's SSE stream
     * GET /api/jobs/:id/stream
     */
    static async reconnectToJob(req: Request, res: Response) {
        const id = req.params.id as string;
        const job = jobManager.getJob(id);

        if (!job) {
            const queuedJob = await queueJobService.getJobById(id);
            if (!queuedJob) {
                return res.status(404).json({ error: 'Job not found' });
            }

            return StreamingScrapeController.streamQueueJob(req, res, id);
        }

        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();

        const sendEvent = (event: string, data: any) => {
            res.write(`event: ${event}\n`);
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        // Send reconnect event with current state
        sendEvent('reconnect', {
            jobId: job.id,
            url: job.url,
            type: job.type,
            status: job.status
        });

        // Replay all progress events so far
        for (const progress of job.progress) {
            sendEvent('progress', progress);
        }

        // If job is already complete, send result and done
        if (job.status === 'completed' || job.status === 'error') {
            if (job.result) {
                const formattedResult = StreamingScrapeController.formatResult(job.type, job.result);
                sendEvent('result', formattedResult);
            } else if (job.error) {
                sendEvent('error', { success: false, error: job.error });
            }
            sendEvent('done', { timestamp: Date.now() });
            res.end();
            return;
        }

        if (job.status === 'cancelled') {
            sendEvent('cancelled', { jobId: job.id });
            sendEvent('done', { timestamp: Date.now() });
            res.end();
            return;
        }

        // Job is still running - add listener for future events
        jobManager.addListener(job.id, sendEvent);

        // Handle client disconnect
        req.on('close', () => {
            jobManager.removeListener(job.id, sendEvent);
        });
    }

    /**
     * Cancel a job
     * POST /api/jobs/:id/cancel
     */
    static async cancelJob(req: Request, res: Response) {
        const id = req.params.id as string;
        const job = jobManager.getJob(id);

        if (job) {
            if (job.status === 'completed' || job.status === 'error' || job.status === 'cancelled') {
                return res.status(400).json({ error: 'Job is already finished' });
            }

            jobManager.cancelJob(id);
            return res.json({ success: true, message: 'Job cancelled' });
        }

        const cancelled = await queueJobService.cancelJob(id);
        if (!cancelled.found) {
            return res.status(404).json({ error: 'Job not found' });
        }

        if (!cancelled.cancelled) {
            return res.status(400).json({ error: cancelled.reason });
        }

        res.json({ success: true, message: 'Job cancellation requested', mode: cancelled.mode });
    }

    private static async streamQueueJob(req: Request, res: Response, jobId: string) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();

        let lastUpdatedAt = '';
        let isClosed = false;
        let lastSyntheticProgressKey = '';

        const sendEvent = (event: string, data: any) => {
            if (res.writableEnded || res.destroyed) {
                return;
            }

            res.write(`event: ${event}\n`);
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        const poll = async () => {
            if (isClosed) {
                return;
            }

            const queuedJob = await queueJobService.getJobById(jobId);
            if (!queuedJob) {
                sendEvent('error', { success: false, error: 'Job not found' });
                sendEvent('done', { timestamp: Date.now() });
                res.end();
                isClosed = true;
                return;
            }

            if (!lastUpdatedAt) {
                sendEvent('reconnect', {
                    jobId: queuedJob.id,
                    url: queuedJob.target,
                    type: queuedJob.type.toLowerCase(),
                    status: queuedJob.status.toLowerCase(),
                });
            }

            const maybeSendSyntheticProgress = () => {
                let syntheticProgress: StreamProgress | null = null;

                if (queuedJob.status === 'QUEUED') {
                    syntheticProgress = {
                        step: 1,
                        total: 6,
                        message: 'Queue accepted, waiting for worker',
                        status: 'active',
                    };
                } else if (queuedJob.status === 'ACTIVE') {
                    syntheticProgress = {
                        step: 2,
                        total: 6,
                        message: 'Worker accepted job',
                        status: 'active',
                    };
                }

                if (!syntheticProgress) {
                    return;
                }

                const nextKey = `${queuedJob.status}:${queuedJob.updated_at.toISOString()}`;
                if (lastSyntheticProgressKey === nextKey) {
                    return;
                }

                lastSyntheticProgressKey = nextKey;
                sendEvent('progress', syntheticProgress);
            };

            const nextUpdatedAt = queuedJob.updated_at.toISOString();
            if (lastUpdatedAt !== nextUpdatedAt) {
                if (queuedJob.progress_payload) {
                    sendEvent('progress', queuedJob.progress_payload);
                } else {
                    maybeSendSyntheticProgress();
                }
                if (queuedJob.result_payload) {
                    sendEvent('result', queuedJob.result_payload);
                } else if (queuedJob.error_message && queuedJob.status === 'FAILED') {
                    sendEvent('error', { success: false, error: queuedJob.error_message });
                }

                if (queuedJob.status === 'CANCELLED') {
                    sendEvent('cancelled', { jobId: queuedJob.id });
                }

                lastUpdatedAt = nextUpdatedAt;
            } else if (!queuedJob.progress_payload) {
                maybeSendSyntheticProgress();
            }

            if (queuedJob.status === 'COMPLETED' || queuedJob.status === 'FAILED' || queuedJob.status === 'CANCELLED') {
                sendEvent('done', {
                    timestamp: Date.now(),
                    cancelled: queuedJob.status === 'CANCELLED',
                });
                res.end();
                isClosed = true;
            }
        };

        const interval = setInterval(() => {
            poll().catch((error) => {
                sendEvent('error', {
                    success: false,
                    error: error instanceof Error ? error.message : 'Queue stream polling failed',
                });
                sendEvent('done', { timestamp: Date.now() });
                res.end();
                isClosed = true;
            });
        }, queueConfig.streamPollMs);

        req.on('close', () => {
            isClosed = true;
            clearInterval(interval);
        });

        await poll();
    }

    /**
     * Helper to format result based on type
     */
    private static formatResult(type: string, result: any) {
        if (!result.success) {
            return {
                success: false,
                type: result.cancelled ? 'cancelled' : 'error',
                error: result.cancelled ? 'Job cancelled' : result.error,
                code: result.code,
                challenge: result.challenge,
                cancelled: result.cancelled,
                duration: result.duration
            };
        }

        if (type === 'screenshot' && result.screenshot) {
            return {
                success: true,
                type: 'screenshot',
                data: `data:image/jpeg;base64,${result.screenshot.toString('base64')}`,
                duration: result.duration
            };
        } else if (type === 'content') {
            return {
                success: true,
                type: 'content',
                data: {
                    markdown: result.markdown,
                    title: result.title,
                    metadata: result.metadata
                },
                url: result.url,
                duration: result.duration,
                statusCode: result.statusCode
            };
        }

        return {
            success: true,
            type,
            data: {
                html: result.html,
                title: result.title,
                metadata: result.metadata
            },
            url: result.url,
            duration: result.duration,
            statusCode: result.statusCode
        };
    }
}
