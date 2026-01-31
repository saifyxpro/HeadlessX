import { Request, Response } from 'express';
import { streamingScraperService, StreamProgress } from '../services/StreamingScraperService';
import { jobManager, Job } from '../services/JobManager';
import { prisma } from '../database/client';
import { z } from 'zod';

const StreamRequestSchema = z.object({
    url: z.string().url(),
    type: z.enum(['html', 'html-js', 'html-css-js', 'content', 'screenshot', 'pdf']),
    profileId: z.string().optional(),
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
     * POST /api/website/stream
     */
    static async streamScrape(req: Request, res: Response) {
        const startTime = Date.now();
        console.log('🔥 Stream endpoint hit');
        try {
            const { url, type, profileId, stealth, fullPage, options } = StreamRequestSchema.parse(req.body);
            console.log('📋 Request parsed:', { url, type, profileId, stealth, fullPage });

            // Create job for tracking
            const job = jobManager.createJob(url, type, {
                waitForSelector: options?.waitForSelector,
                timeout: options?.timeout,
                profileId,
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
                    waitForSelector: options?.waitForSelector,
                    timeout: options?.timeout,
                    profileId,
                    stealth, // Pass stealth for speed mode
                    jsEnabled: type === 'html-js',
                    fullPage: fullPage
                },
                onProgress
            );

            // Complete the job
            jobManager.completeJob(job.id, result);

            // Format and send result
            const formattedResult = StreamingScrapeController.formatResult(type, result);
            jobManager.broadcast(job.id, 'result', formattedResult);

            // Close connection
            jobManager.broadcast(job.id, 'done', { timestamp: Date.now() });

            // Log the request
            const duration = Date.now() - startTime;
            prisma.requestLog.create({
                data: {
                    api_key_id: req.apiKeyId || null,
                    url: url,
                    method: 'POST',
                    status_code: result.success ? 200 : 500,
                    duration_ms: duration,
                    error_message: result.error || null,
                }
            }).catch(err => console.error('Log failed:', err));

            // Remove listener and end response
            jobManager.removeListener(job.id, sendEvent);
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
                res.write(`event: error\n`);
                res.write(`data: ${JSON.stringify({ error: (error as Error).message })}\n\n`);
                res.end();
            }
        }
    }

    /**
     * Get the currently active job
     * GET /api/jobs/active
     */
    static async getActiveJob(req: Request, res: Response) {
        const job = jobManager.getActiveJob();

        if (!job) {
            return res.json({ active: false, job: null });
        }

        res.json({
            active: true,
            job: {
                id: job.id,
                url: job.url,
                type: job.type,
                status: job.status,
                progress: job.progress,
                createdAt: job.createdAt
            }
        });
    }

    /**
     * Get a specific job by ID
     * GET /api/jobs/:id
     */
    static async getJob(req: Request, res: Response) {
        const id = req.params.id as string;
        const job = jobManager.getJob(id);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        // Include result if job is completed
        let formattedResult: any = null;
        if (job.status === 'completed' && job.result) {
            formattedResult = StreamingScrapeController.formatResult(job.type, job.result);
        }

        res.json({
            id: job.id,
            url: job.url,
            type: job.type,
            status: job.status,
            progress: job.progress,
            result: formattedResult,
            error: job.error,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt
        });
    }

    /**
     * Reconnect to a job's SSE stream
     * GET /api/jobs/:id/stream
     */
    static async reconnectToJob(req: Request, res: Response) {
        const id = req.params.id as string;
        const job = jobManager.getJob(id);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
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

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        if (job.status === 'completed' || job.status === 'error' || job.status === 'cancelled') {
            return res.status(400).json({ error: 'Job is already finished' });
        }

        jobManager.cancelJob(id);
        res.json({ success: true, message: 'Job cancelled' });
    }

    /**
     * Helper to format result based on type
     */
    private static formatResult(type: string, result: any) {
        if (!result.success) {
            return {
                success: false,
                type: 'error',
                error: result.error,
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
        } else if (type === 'pdf' && result.pdf) {
            return {
                success: true,
                type: 'pdf',
                data: `data:application/pdf;base64,${result.pdf.toString('base64')}`,
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
        } else if (type === 'html-css-js') {
            return {
                success: true,
                type,
                data: {
                    html: result.html,
                    title: result.title,
                    metadata: result.metadata,
                    styles: result.styles,
                    scripts: result.scripts,
                    inlineStyles: result.inlineStyles,
                    inlineScripts: result.inlineScripts
                },
                url: result.url,
                duration: result.duration,
                statusCode: result.statusCode
            };
        } else {
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
}
