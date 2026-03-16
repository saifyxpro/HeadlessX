import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/client';
import { TavilyServiceError, tavilyService } from '../../services/ai/TavilyService';

const DomainListSchema = z.array(z.string().trim().min(1)).max(300).optional();

const TavilySearchSchema = z.object({
    query: z.string().trim().min(1),
    searchDepth: z.enum(['basic', 'advanced']).default('basic'),
    topic: z.enum(['general', 'news', 'finance']).default('general'),
    maxResults: z.number().int().min(1).max(20).default(5),
    includeAnswer: z.boolean().default(true),
    includeImages: z.boolean().default(false),
    includeRawContent: z.union([z.literal(false), z.enum(['markdown', 'text'])]).default(false),
    includeDomains: DomainListSchema,
    excludeDomains: DomainListSchema,
    timeRange: z.enum(['day', 'week', 'month', 'year']).optional(),
    timeout: z.number().int().min(5).max(120).optional(),
});

const TavilyResearchSchema = z.object({
    query: z.string().trim().min(1),
    model: z.enum(['auto', 'mini', 'pro']).default('auto'),
    citationFormat: z.enum(['numbered', 'mla', 'apa', 'chicago']).default('numbered'),
    timeout: z.number().int().min(30).max(300).optional(),
});

const ResearchRequestIdSchema = z.object({
    requestId: z.string().trim().min(1),
});

function getErrorDetails(error: unknown) {
    if (error instanceof TavilyServiceError) {
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

export class TavilyController {
    static async search(req: Request, res: Response) {
        const startTime = Date.now();
        const apiKeyId = (req as any).apiKeyId;

        try {
            const payload = TavilySearchSchema.parse(req.body);
            const data = await tavilyService.search(payload);

            await logRequest({
                apiKeyId,
                url: `tavily-search://${payload.query}`,
                method: 'POST',
                statusCode: 200,
                durationMs: Date.now() - startTime,
            });

            res.json({ success: true, data });
        } catch (error) {
            const details = getErrorDetails(error);

            await logRequest({
                apiKeyId,
                url: `tavily-search://${req.body?.query || 'unknown'}`,
                method: 'POST',
                statusCode: details.status,
                durationMs: Date.now() - startTime,
                errorMessage: details.message,
            });

            res.status(details.status).json({
                success: false,
                error: { code: 'TAVILY_SEARCH_FAILED', message: details.message },
            });
        }
    }

    static async research(req: Request, res: Response) {
        const startTime = Date.now();
        const apiKeyId = (req as any).apiKeyId;

        try {
            const payload = TavilyResearchSchema.parse(req.body);
            const data = await tavilyService.startResearch(payload);

            await logRequest({
                apiKeyId,
                url: `tavily-research://${payload.query}`,
                method: 'POST',
                statusCode: 200,
                durationMs: Date.now() - startTime,
            });

            res.json({ success: true, data });
        } catch (error) {
            const details = getErrorDetails(error);

            await logRequest({
                apiKeyId,
                url: `tavily-research://${req.body?.query || 'unknown'}`,
                method: 'POST',
                statusCode: details.status,
                durationMs: Date.now() - startTime,
                errorMessage: details.message,
            });

            res.status(details.status).json({
                success: false,
                error: { code: 'TAVILY_RESEARCH_FAILED', message: details.message },
            });
        }
    }

    static async getResearch(req: Request, res: Response) {
        const startTime = Date.now();
        const apiKeyId = (req as any).apiKeyId;

        try {
            const { requestId } = ResearchRequestIdSchema.parse(req.params);
            const data = await tavilyService.getResearch(requestId);

            await logRequest({
                apiKeyId,
                url: `tavily-research://${requestId}`,
                method: 'GET',
                statusCode: 200,
                durationMs: Date.now() - startTime,
            });

            res.json({ success: true, data });
        } catch (error) {
            const details = getErrorDetails(error);

            await logRequest({
                apiKeyId,
                url: `tavily-research://${req.params?.requestId || 'unknown'}`,
                method: 'GET',
                statusCode: details.status,
                durationMs: Date.now() - startTime,
                errorMessage: details.message,
            });

            res.status(details.status).json({
                success: false,
                error: { code: 'TAVILY_RESEARCH_STATUS_FAILED', message: details.message },
            });
        }
    }

    static async getStatus(req: Request, res: Response) {
        res.json({
            success: true,
            data: {
                status: 'online',
                configured: tavilyService.isConfigured(),
                service: 'tavily-v1',
            },
        });
    }
}
