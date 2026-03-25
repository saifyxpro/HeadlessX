import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/client';
import { browserService } from '../../services/scrape/BrowserService';
import { GoogleSerpSetupError, googleSerpService } from '../../services/scrape/GoogleSerpService';

const SearchSchema = z.object({
    query: z.string().min(1),
    gl: z.string().trim().toLowerCase().regex(/^[a-z]{2}$/).optional(),
    hl: z.string().trim().toLowerCase().regex(/^[a-z]{2}$/).optional(),
    tbs: z.enum(['qdr:h', 'qdr:d', 'qdr:w']).optional(),
    stealth: z.boolean().optional(),
});

function buildErrorPayload(error: unknown) {
    if (error instanceof GoogleSerpSetupError) {
        return {
            status: error.statusCode,
            payload: {
                success: false,
                error: error.message,
                code: error.code,
                details: browserService.getGoogleCookieBootstrapStatus(),
            },
        };
    }

    return {
        status: 500,
        payload: {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        },
    };
}

export class GoogleSerpController {
    static async search(req: Request, res: Response) {
        const startTime = Date.now();
        try {
            const { query, gl, hl, tbs, stealth } = SearchSchema.parse(req.body);
            const data = await googleSerpService.search(query, { gl, hl, tbs, stealth });

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

            const duration = Date.now() - startTime;
            const normalized = buildErrorPayload(error);
            prisma.requestLog.create({
                data: {
                    api_key_id: (req as any).apiKeyId || null,
                    url: `google-ai-search://${req.body?.query || 'unknown'}`,
                    method: 'POST',
                    status_code: normalized.status,
                    duration_ms: duration,
                    error_message: normalized.payload.error,
                }
            }).catch(err => console.error('Log failed:', err));

            res.status(normalized.status).json(normalized.payload);
        }
    }

    static async searchStream(req: Request, res: Response) {
        const apiKeyId = (req as any).apiKeyId;
        const query = req.query.query as string;
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

        try {
            googleSerpService.assertSearchReady();
        } catch (error) {
            const normalized = buildErrorPayload(error);
            res.status(normalized.status).json(normalized.payload);
            return;
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();

        const startTime = Date.now();

        const sendEvent = (event: string, data: any) => {
            console.log(`📤 Sending SSE: ${event}`, JSON.stringify(data).slice(0, 150));
            res.write(`event: ${event}\n`);
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        sendEvent('start', { query, timestamp: Date.now() });

        try {
            const result = await googleSerpService.scrapeWithProgress(
                query,
                timeoutMs,
                { gl, hl, tbs, stealth },
                (progress) => {
                    console.log('⏳ Progress:', progress);
                    sendEvent('progress', progress);
                }
            );

            sendEvent('result', { success: true, data: result });

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
            const normalized = buildErrorPayload(error);
            sendEvent('error', normalized.payload);

            const duration = Date.now() - startTime;
            prisma.requestLog.create({
                data: {
                    api_key_id: apiKeyId || null,
                    url: `google-ai-search://${query}`,
                    method: 'GET_SSE',
                    status_code: normalized.status,
                    duration_ms: duration,
                    error_message: normalized.payload.error,
                }
            }).catch(err => console.error('Log failed:', err));
        } finally {
            res.write('event: end\ndata: {}\n\n');
            res.end();
        }
    }

    static async getStatus(_req: Request, res: Response) {
        res.json({
            status: 'online',
            service: 'google-ai-search-v1',
            cookies: browserService.getGoogleCookieBootstrapStatus(),
        });
    }

    static async getCookieStatus(_req: Request, res: Response) {
        res.json({
            success: true,
            data: browserService.getGoogleCookieBootstrapStatus(),
        });
    }

    static async buildCookies(_req: Request, res: Response) {
        try {
            const data = await browserService.startGoogleCookieBootstrap();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Google cookie bootstrap error:', error);
            const normalized = buildErrorPayload(error);
            res.status(normalized.status).json(normalized.payload);
        }
    }

    static async stopCookies(_req: Request, res: Response) {
        try {
            const data = await browserService.stopGoogleCookieBootstrap();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Google cookie stop error:', error);
            const normalized = buildErrorPayload(error);
            res.status(normalized.status).json(normalized.payload);
        }
    }
}
