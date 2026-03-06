import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/client';
import { hashApiKey, matchesInternalApiKey } from '../utils/security';

// Add user property to Request
declare global {
    namespace Express {
        interface Request {
            apiKeyId?: string;
            isInternal?: boolean;
        }
    }
}

export const ApiKeyGuard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const apiKey = req.headers['x-api-key'] as string;
        const dashboardApiKey = process.env.DASHBOARD_INTERNAL_API_KEY?.trim();

        if (dashboardApiKey && matchesInternalApiKey(apiKey, dashboardApiKey)) {
            req.isInternal = true;
            return next();
        }

        if (!apiKey) {
            return res.status(401).json({ success: false, error: { code: 'MISSING_API_KEY', message: 'x-api-key header is missing' } });
        }

        const hashedApiKey = hashApiKey(apiKey);

        let keyRecord = await prisma.apiKey.findFirst({
            where: {
                key_hash: hashedApiKey,
                is_active: true
            }
        });

        if (!keyRecord) {
            keyRecord = await prisma.apiKey.findFirst({
                where: {
                    key_hash: apiKey,
                    is_active: true
                }
            });

            if (keyRecord) {
                await prisma.apiKey.update({
                    where: { id: keyRecord.id },
                    data: {
                        key_hash: hashedApiKey,
                        prefix: apiKey.substring(0, 7)
                    }
                }).catch(() => { });
            }
        }

        if (!keyRecord) {
            return res.status(403).json({ success: false, error: { code: 'INVALID_API_KEY', message: 'Invalid or revoked API Key' } });
        }

        req.apiKeyId = keyRecord.id;

        prisma.apiKey.update({
            where: { id: keyRecord.id },
            data: { last_used_at: new Date() }
        }).catch(() => { }); // If this fails, don't block the request

        next();

    } catch (error) {
        console.error('ApiKeyGuard Error:', error);
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Auth service failure' } });
    }
};
