import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/client';

export const RequestLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const originalEnd = res.end;

    // Hook into response end
    // @ts-ignore
    res.end = function (chunk: any, encoding: any) {
        const duration = Date.now() - start;

        // Fire and forget logging
        // Only log if it's an API request or has a key
        if (req.path.startsWith('/api') && req.method !== 'OPTIONS' && !res.locals.skipLogging) {
            prisma.requestLog.create({
                data: {
                    api_key_id: req.apiKeyId || null, // Might be null if internal
                    url: req.body?.url || req.query?.url || 'unknown',
                    method: req.method,
                    status_code: res.statusCode,
                    duration_ms: duration,
                    error_message: res.locals.errorMessage || null, // Capture from ErrorHandler
                    error_screenshot_path: res.locals.errorScreenshot || null
                }
            }).catch(err => console.error('Logged failed:', err));
        }

        // Call original
        originalEnd.apply(res, arguments as any);
    };

    next();
};
