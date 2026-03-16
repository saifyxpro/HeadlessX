import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/client';
import { ExaServiceError, exaService } from '../../services/ai/ExaService';

const DomainListSchema = z.array(z.string().trim().min(1)).max(200).optional();

const ExaSearchSchema = z.object({
    query: z.string().trim().min(1),
    type: z.enum(['auto', 'fast', 'instant', 'deep']).default('auto'),
    numResults: z.number().int().min(1).max(20).default(5),
    contentMode: z.enum(['highlights', 'text']).default('highlights'),
    maxCharacters: z.number().int().min(200).max(20000).default(4000),
    maxAgeHours: z.number().int().min(-1).max(720).optional(),
    category: z.enum(['company', 'research paper', 'news', 'personal site', 'financial report', 'people']).optional(),
    includeDomains: DomainListSchema,
    excludeDomains: DomainListSchema,
    systemPrompt: z.string().trim().max(1000).optional(),
});

function getErrorDetails(error: unknown) {
    if (error instanceof ExaServiceError) {
        return { status: error.statusCode, message: error.message };
    }

    if (error instanceof z.ZodError) {
        return {
            status: 400,
            message: error.issues.map((issue) => issue.message).join(', '),
        };
    }

    return {
        status: 500,
        message: error instanceof Error ? error.message : 'Unknown error',
    };
}

async function logRequest(input: {
    apiKeyId?: string | null;
    url: string;
    method: string;
    statusCode: number;
    durationMs: number;
    errorMessage?: string | null;
}) {
    return prisma.requestLog.create({
        data: {
            api_key_id: input.apiKeyId || null,
            url: input.url,
            method: input.method,
            status_code: input.statusCode,
            duration_ms: input.durationMs,
            error_message: input.errorMessage || null,
        },
    }).catch((err) => console.error('Log failed:', err));
}

export class ExaController {
    static async streamSearch(req: Request, res: Response) {
        const startTime = Date.now();
        const apiKeyId = (req as any).apiKeyId;

        const sendEvent = (event: string, data: unknown) => {
            if (res.writableEnded || res.destroyed) {
                return;
            }

            res.write(`event: ${event}\n`);
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        try {
            const payload = ExaSearchSchema.parse(req.body);

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');
            res.flushHeaders();
            res.locals.skipLogging = true;

            sendEvent('start', {
                query: payload.query,
                type: payload.type,
                timestamp: Date.now(),
            });
            sendEvent('progress', {
                step: 1,
                total: 3,
                message: 'Preparing Exa query',
                status: 'active',
            });
            sendEvent('progress', {
                step: 1,
                total: 3,
                message: 'Preparing Exa query',
                status: 'completed',
            });
            sendEvent('progress', {
                step: 2,
                total: 3,
                message: 'Submitting search request',
                status: 'active',
            });

            const data = await exaService.search(payload);

            sendEvent('progress', {
                step: 2,
                total: 3,
                message: 'Submitting search request',
                status: 'completed',
            });
            sendEvent('progress', {
                step: 3,
                total: 3,
                message: 'Processing Exa response',
                status: 'active',
            });
            sendEvent('result', data);
            sendEvent('progress', {
                step: 3,
                total: 3,
                message: 'Processing Exa response',
                status: 'completed',
            });
            sendEvent('done', { timestamp: Date.now() });

            await logRequest({
                apiKeyId,
                url: `exa-search://${payload.query}`,
                method: 'POST',
                statusCode: 200,
                durationMs: Date.now() - startTime,
            });

            res.end();
        } catch (error) {
            const details = getErrorDetails(error);

            await logRequest({
                apiKeyId,
                url: `exa-search://${req.body?.query || 'unknown'}`,
                method: 'POST',
                statusCode: details.status,
                durationMs: Date.now() - startTime,
                errorMessage: details.message,
            });

            if (!res.headersSent) {
                res.status(details.status).json({
                    success: false,
                    error: { code: 'EXA_SEARCH_FAILED', message: details.message },
                });
                return;
            }

            sendEvent('error', { error: details.message });
            sendEvent('done', { timestamp: Date.now() });
            res.end();
        }
    }

    static async search(req: Request, res: Response) {
        const startTime = Date.now();
        const apiKeyId = (req as any).apiKeyId;

        try {
            const payload = ExaSearchSchema.parse(req.body);
            const data = await exaService.search(payload);

            await logRequest({
                apiKeyId,
                url: `exa-search://${payload.query}`,
                method: 'POST',
                statusCode: 200,
                durationMs: Date.now() - startTime,
            });

            res.json({ success: true, data });
        } catch (error) {
            const details = getErrorDetails(error);

            await logRequest({
                apiKeyId,
                url: `exa-search://${req.body?.query || 'unknown'}`,
                method: 'POST',
                statusCode: details.status,
                durationMs: Date.now() - startTime,
                errorMessage: details.message,
            });

            res.status(details.status).json({
                success: false,
                error: { code: 'EXA_SEARCH_FAILED', message: details.message },
            });
        }
    }

    static async getStatus(req: Request, res: Response) {
        res.json({
            success: true,
            data: {
                status: 'online',
                configured: exaService.isConfigured(),
                service: 'exa-v1',
            },
        });
    }
}
