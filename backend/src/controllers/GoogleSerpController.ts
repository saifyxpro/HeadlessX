import { Request, Response } from 'express';
import { googleSerpService, GoogleSerpService } from '../services/GoogleSerpService';
import { z } from 'zod';
import { prisma } from '../database/client';

const SearchSchema = z.object({
    query: z.string().min(1),
    profileId: z.string().optional()
});

export class GoogleSerpController {
    static async search(req: Request, res: Response) {
        const startTime = Date.now();
        try {
            const { query, profileId } = SearchSchema.parse(req.body);

            // Set headers for long polling/streaming if needed, but for now standard JSON response
            // The scraping might take 10-20s, so ensure client timeout is high enough.

            const data = await googleSerpService.search(query, profileId);

            // Log successful request
            const duration = Date.now() - startTime;
            prisma.requestLog.create({
                data: {
                    api_key_id: (req as any).apiKeyId || null,
                    url: `google-serp://${query}`,
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
                    url: `google-serp://${req.body?.query || 'unknown'}`,
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
        const profileId = req.query.profileId as string;
        // Parse timeout or default to 60s
        const timeoutSeconds = parseInt(req.query.timeout as string) || 60;
        const timeoutMs = timeoutSeconds * 1000;

        if (!query) {
            res.status(400).json({ success: false, error: 'Query parameter is required' });
            return;
        }

        // Set headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering
        res.flushHeaders();

        const startTime = Date.now();

        // Helper to send SSE event (matching website scraper format)
        const sendEvent = (event: string, data: any) => {
            console.log(`📤 Sending SSE: ${event}`, JSON.stringify(data).slice(0, 150));
            res.write(`event: ${event}\n`);
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        // Send start event
        sendEvent('start', { query, timestamp: Date.now() });

        try {
            const googleSerpService = new GoogleSerpService();
            const result = await googleSerpService.scrapeWithProgress(
                query,
                profileId,
                timeoutMs, // Pass timeout here
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
                    url: `google-serp://${query}`,
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
                    url: `google-serp://${query}`,
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
            service: 'google-serp-v1'
        });
    }
}
