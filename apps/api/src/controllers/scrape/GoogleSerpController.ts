import { Request, Response } from 'express';
import { googleSerpService } from '../../services/scrape/GoogleSerpService';
import { z } from 'zod';
import { prisma } from '../../database/client';

const SearchSchema = z.object({
    query: z.string().min(1),
    gl: z.string().trim().toLowerCase().regex(/^[a-z]{2}$/).optional(),
    hl: z.string().trim().toLowerCase().regex(/^[a-z]{2}$/).optional(),
    tbs: z.enum(['qdr:h', 'qdr:d', 'qdr:w']).optional(),
    stealth: z.boolean().optional(),
});

export class GoogleSerpController {
    static async search(req: Request, res: Response) {
        const startTime = Date.now();
        try {
            const { query, gl, hl, tbs, stealth } = SearchSchema.parse(req.body);

            // Set headers for long polling/streaming if needed, but for now standard JSON response
            // The scraping might take 10-20s, so ensure client timeout is high enough.

            const data = await googleSerpService.search(query, { gl, hl, tbs, stealth });

            // Log successful request
            const duration = Date.now() - startTime;
            prisma.requestLog.create({
                data: {
                    api_key_id: (req as any).apiKeyId || null,
                    url: `google-ai-search://${query}`,
                    method: 'POST',
                    status_code: 200,
                    duration_ms: duration,
                    error_message: null,
                }
            }).catch(err => console.error('Log failed:', err));

            res.json({
                success: true,
                data
            });
        } catch (error) {
            console.error('SERP Search error:', error);

            // Log failed request
            const duration = Date.now() - startTime;
            prisma.requestLog.create({
                data: {
                    api_key_id: (req as any).apiKeyId || null,
                    url: `google-ai-search://${req.body?.query || 'unknown'}`,
                    method: 'POST',
                    status_code: 500,
                    duration_ms: duration,
                    error_message: error instanceof Error ? error.message : 'Unknown error',
                }
            }).catch(err => console.error('Log failed:', err));

            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    static async searchStream(req: Request, res: Response) {
        const apiKeyId = (req as any).apiKeyId;
        const query = req.query.query as string;
        // Clamp timeout to the range exposed by the UI.
        const parsedTimeoutSeconds = parseInt(req.query.timeout as string, 10);
        const timeoutSeconds = Number.isFinite(parsedTimeoutSeconds)
            ? Math.max(30, Math.min(120, parsedTimeoutSeconds))
            : 60;
        const timeoutMs = timeoutSeconds * 1000;
        const gl = typeof req.query.gl === 'string' ? req.query.gl.trim().toLowerCase() : undefined;
        const hl = typeof req.query.hl === 'string' ? req.query.hl.trim().toLowerCase() : undefined;
        const rawTbs = typeof req.query.tbs === 'string' ? req.query.tbs.trim() : undefined;
        const stealth = typeof req.query.stealth === 'string'
            ? req.query.stealth.trim().toLowerCase() === 'true'
            : undefined;

        if (!query) {
            res.status(400).json({ success: false, error: 'Query parameter is required' });
            return;
        }

        if (gl && !/^[a-z]{2}$/.test(gl)) {
            res.status(400).json({ success: false, error: 'Invalid gl parameter' });
            return;
        }

        if (hl && !/^[a-z]{2}$/.test(hl)) {
            res.status(400).json({ success: false, error: 'Invalid hl parameter' });
            return;
        }

        if (rawTbs && !['qdr:h', 'qdr:d', 'qdr:w'].includes(rawTbs)) {
            res.status(400).json({ success: false, error: 'Invalid tbs parameter' });
            return;
        }

        const tbs = rawTbs as 'qdr:h' | 'qdr:d' | 'qdr:w' | undefined;

        // Set headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering
        res.flushHeaders();

        const startTime = Date.now();

        // Helper to send SSE event (matching website stream format)
        const sendEvent = (event: string, data: any) => {
            console.log(`📤 Sending SSE: ${event}`, JSON.stringify(data).slice(0, 150));
            res.write(`event: ${event}\n`);
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        // Send start event
        sendEvent('start', { query, timestamp: Date.now() });

        try {
            const result = await googleSerpService.scrapeWithProgress(
                query,
                timeoutMs, // Pass timeout here
                { gl, hl, tbs, stealth },
                (progress) => {
                    console.log('⏳ Progress:', progress);
                    sendEvent('progress', progress);
                }
            );

            // Send final result
            sendEvent('result', { success: true, data: result });

            // Log successful request
            const duration = Date.now() - startTime;
            prisma.requestLog.create({
                data: {
                    api_key_id: apiKeyId || null,
                    url: `google-ai-search://${query}`,
                    method: 'GET_SSE',
                    status_code: 200,
                    duration_ms: duration,
                    error_message: null,
                }
            }).catch(err => console.error('Log failed:', err));

        } catch (error) {
            console.error('SERP Stream error:', error);
            sendEvent('error', { success: false, error: error instanceof Error ? error.message : 'Unknown error' });

            // Log failed request
            const duration = Date.now() - startTime;
            prisma.requestLog.create({
                data: {
                    api_key_id: apiKeyId || null,
                    url: `google-ai-search://${query}`,
                    method: 'GET_SSE',
                    status_code: 500,
                    duration_ms: duration,
                    error_message: error instanceof Error ? error.message : 'Unknown error',
                }
            }).catch(err => console.error('Log failed:', err));
        } finally {
            res.write('event: end\ndata: {}\n\n');
            res.end();
        }
    }

    static async getStatus(req: Request, res: Response) {
        res.json({
            status: 'online',
            service: 'google-ai-search-v1'
        });
    }
}
