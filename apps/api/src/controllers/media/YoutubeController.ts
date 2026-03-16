import { Readable } from 'stream';
import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/client';
import { YoutubeEngineServiceError, youtubeEngineService } from '../../services/media/YoutubeEngineService';

const YoutubeExtractSchema = z.object({
    url: z.string().url(),
    flatPlaylist: z.boolean().optional().default(true),
    includeFormats: z.boolean().optional().default(true),
    includeSubtitles: z.boolean().optional().default(true),
    playlistPreviewLimit: z.number().int().min(1).max(50).optional().default(10),
    playerClientProfile: z.enum(['mobile', 'default']).optional().default('mobile'),
    metadataLanguage: z.string().trim().min(2).max(16).optional(),
    socketTimeout: z.number().int().min(10).max(180).optional().default(30),
    cleanupJobId: z.string().trim().min(1).max(128).optional(),
});

const YoutubeSaveSchema = z.object({
    url: z.string().url(),
    qualityPreset: z.enum(['best', '1080p', '720p', '480p']).optional().default('best'),
    formatId: z.string().trim().min(1).max(64).optional(),
    playerClientProfile: z.enum(['mobile', 'default']).optional().default('mobile'),
    metadataLanguage: z.string().trim().min(2).max(16).optional(),
    socketTimeout: z.number().int().min(10).max(180).optional().default(30),
    cleanupJobId: z.string().trim().min(1).max(128).optional(),
});

function getErrorDetails(error: unknown) {
    if (error instanceof YoutubeEngineServiceError) {
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

async function cleanupPreviousDownload(jobId?: string) {
    if (!jobId) {
        return;
    }

    try {
        await youtubeEngineService.deleteDownload(jobId);
    } catch (error) {
        console.warn(`YouTube temp cleanup failed for job ${jobId}:`, error);
    }
}

export class YoutubeController {
    static async streamInfo(req: Request, res: Response) {
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
            const payload = YoutubeExtractSchema.parse(req.body);

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');
            res.flushHeaders();
            res.locals.skipLogging = true;

            sendEvent('start', {
                url: payload.url,
                timestamp: Date.now(),
            });
            sendEvent('progress', {
                step: 1,
                total: 4,
                message: 'Cleaning previous temporary video',
                status: 'active',
            });
            await cleanupPreviousDownload(payload.cleanupJobId);
            sendEvent('progress', {
                step: 1,
                total: 4,
                message: 'Cleaning previous temporary video',
                status: 'completed',
            });
            sendEvent('progress', {
                step: 2,
                total: 4,
                message: 'Sending extract request to yt-engine',
                status: 'active',
            });
            sendEvent('progress', {
                step: 2,
                total: 4,
                message: 'Sending extract request to yt-engine',
                status: 'completed',
            });
            sendEvent('progress', {
                step: 3,
                total: 4,
                message: 'Extracting metadata, formats, and subtitles',
                status: 'active',
            });

            const data = await youtubeEngineService.getInfo(payload);

            sendEvent('progress', {
                step: 3,
                total: 4,
                message: 'Extracting metadata, formats, and subtitles',
                status: 'completed',
            });
            sendEvent('progress', {
                step: 4,
                total: 4,
                message: 'Building extract result',
                status: 'active',
            });
            sendEvent('progress', {
                step: 4,
                total: 4,
                message: 'Building extract result',
                status: 'completed',
            });
            sendEvent('result', data);
            sendEvent('done', { timestamp: Date.now() });

            await logRequest({
                apiKeyId,
                url: `youtube-stream://${payload.url}`,
                method: 'POST',
                statusCode: 200,
                durationMs: Date.now() - startTime,
            });

            res.end();
        } catch (error) {
            const details = getErrorDetails(error);

            await logRequest({
                apiKeyId,
                url: `youtube-stream://${req.body?.url || 'unknown'}`,
                method: 'POST',
                statusCode: details.status,
                durationMs: Date.now() - startTime,
                errorMessage: details.message,
            });

            if (!res.headersSent) {
                res.status(details.status).json({
                    success: false,
                    error: { code: 'YOUTUBE_ENGINE_FAILED', message: details.message },
                });
                return;
            }

            sendEvent('error', { error: details.message });
            sendEvent('done', { timestamp: Date.now() });
            res.end();
        }
    }

    static async info(req: Request, res: Response) {
        return YoutubeController.runExtract(req, res, 'info');
    }

    static async formats(req: Request, res: Response) {
        return YoutubeController.runExtract(req, res, 'formats');
    }

    static async subtitles(req: Request, res: Response) {
        return YoutubeController.runExtract(req, res, 'subtitles');
    }

    static async save(req: Request, res: Response) {
        const startTime = Date.now();
        const apiKeyId = (req as any).apiKeyId;

        try {
            const payload = YoutubeSaveSchema.parse(req.body);
            const data = await youtubeEngineService.save(payload);

            await logRequest({
                apiKeyId,
                url: `youtube-save://${payload.url}`,
                method: 'POST',
                statusCode: 200,
                durationMs: Date.now() - startTime,
            });

            res.json({ success: true, data });
        } catch (error) {
            const details = getErrorDetails(error);

            await logRequest({
                apiKeyId,
                url: `youtube-save://${req.body?.url || 'unknown'}`,
                method: 'POST',
                statusCode: details.status,
                durationMs: Date.now() - startTime,
                errorMessage: details.message,
            });

            res.status(details.status).json({
                success: false,
                error: { code: 'YOUTUBE_ENGINE_SAVE_FAILED', message: details.message },
            });
        }
    }

    static async streamSave(req: Request, res: Response) {
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
            const payload = YoutubeSaveSchema.parse(req.body);

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');
            res.flushHeaders();
            res.locals.skipLogging = true;

            sendEvent('start', {
                url: payload.url,
                timestamp: Date.now(),
            });

            sendEvent('progress', {
                step: 1,
                total: 4,
                message: 'Cleaning previous temporary video',
                status: 'active',
            });
            await cleanupPreviousDownload(payload.cleanupJobId);
            sendEvent('progress', {
                step: 1,
                total: 4,
                message: 'Cleaning previous temporary video',
                status: 'completed',
            });

            sendEvent('progress', {
                step: 2,
                total: 4,
                message: payload.formatId ? 'Preparing selected extracted format' : `Preparing ${payload.qualityPreset.toUpperCase()} MP4 preset`,
                status: 'active',
            });
            sendEvent('progress', {
                step: 2,
                total: 4,
                message: payload.formatId ? 'Preparing selected extracted format' : `Preparing ${payload.qualityPreset.toUpperCase()} MP4 preset`,
                status: 'completed',
            });

            sendEvent('progress', {
                step: 3,
                total: 4,
                message: 'Downloading media and building zip',
                status: 'active',
            });
            const data = await youtubeEngineService.save({
                ...payload,
                cleanupJobId: undefined,
            });
            sendEvent('progress', {
                step: 3,
                total: 4,
                message: 'Downloading media and building zip',
                status: 'completed',
            });

            sendEvent('progress', {
                step: 4,
                total: 4,
                message: 'Handing zip back to the browser',
                status: 'active',
            });
            sendEvent('progress', {
                step: 4,
                total: 4,
                message: 'Handing zip back to the browser',
                status: 'completed',
            });
            sendEvent('result', data);
            sendEvent('done', { timestamp: Date.now() });

            await logRequest({
                apiKeyId,
                url: `youtube-save-stream://${payload.url}`,
                method: 'POST',
                statusCode: 200,
                durationMs: Date.now() - startTime,
            });

            res.end();
        } catch (error) {
            const details = getErrorDetails(error);

            await logRequest({
                apiKeyId,
                url: `youtube-save-stream://${req.body?.url || 'unknown'}`,
                method: 'POST',
                statusCode: details.status,
                durationMs: Date.now() - startTime,
                errorMessage: details.message,
            });

            if (!res.headersSent) {
                res.status(details.status).json({
                    success: false,
                    error: { code: 'YOUTUBE_ENGINE_SAVE_FAILED', message: details.message },
                });
                return;
            }

            sendEvent('error', { error: details.message });
            sendEvent('done', { timestamp: Date.now() });
            res.end();
        }
    }

    static async download(req: Request, res: Response) {
        try {
            const { jobId } = z.object({ jobId: z.string().min(1).max(128) }).parse(req.params);
            const upstream = await youtubeEngineService.download(jobId);

            res.status(upstream.status);
            upstream.headers.forEach((value, key) => {
                if (key.toLowerCase() === 'content-length') {
                    return;
                }
                res.setHeader(key, value);
            });

            if (!upstream.body) {
                res.end();
                return;
            }

            Readable.fromWeb(upstream.body as any).pipe(res);
        } catch (error) {
            const details = getErrorDetails(error);
            res.status(details.status).json({
                success: false,
                error: { code: 'YOUTUBE_ENGINE_DOWNLOAD_FAILED', message: details.message },
            });
        }
    }

    static async deleteDownload(req: Request, res: Response) {
        try {
            const { jobId } = z.object({ jobId: z.string().min(1).max(128) }).parse(req.params);
            const data = await youtubeEngineService.deleteDownload(jobId);
            res.json({ success: true, data });
        } catch (error) {
            const details = getErrorDetails(error);
            res.status(details.status).json({
                success: false,
                error: { code: 'YOUTUBE_ENGINE_DELETE_FAILED', message: details.message },
            });
        }
    }

    private static async runExtract(req: Request, res: Response, mode: 'info' | 'formats' | 'subtitles') {
        const startTime = Date.now();
        const apiKeyId = (req as any).apiKeyId;

        try {
            const payload = YoutubeExtractSchema.parse(req.body);
            await cleanupPreviousDownload(payload.cleanupJobId);
            const data = mode === 'info'
                ? await youtubeEngineService.getInfo(payload)
                : mode === 'formats'
                    ? await youtubeEngineService.getFormats(payload)
                    : await youtubeEngineService.getSubtitles(payload);

            await logRequest({
                apiKeyId,
                url: `youtube-${mode}://${payload.url}`,
                method: 'POST',
                statusCode: 200,
                durationMs: Date.now() - startTime,
            });

            res.json({ success: true, data });
        } catch (error) {
            const details = getErrorDetails(error);

            await logRequest({
                apiKeyId,
                url: `youtube-${mode}://${req.body?.url || 'unknown'}`,
                method: 'POST',
                statusCode: details.status,
                durationMs: Date.now() - startTime,
                errorMessage: details.message,
            });

            res.status(details.status).json({
                success: false,
                error: { code: 'YOUTUBE_ENGINE_FAILED', message: details.message },
            });
        }
    }

    static async getStatus(req: Request, res: Response) {
        try {
            const data = await youtubeEngineService.getStatus();
            res.json({
                success: true,
                data: {
                    ...data,
                    configured: youtubeEngineService.isConfigured(),
                },
            });
        } catch (error) {
            const details = getErrorDetails(error);
            res.status(details.status).json({
                success: false,
                error: { code: 'YOUTUBE_ENGINE_STATUS_FAILED', message: details.message },
            });
        }
    }
}
