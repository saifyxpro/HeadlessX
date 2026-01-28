import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/client';

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
        const clientIp = req.ip || req.socket.remoteAddress;

        // 1. Internal / Localhost Trust
        // If request is from localhost, allow it (Dashboard usage)
        if (clientIp === '::1' || clientIp === '127.0.0.1' || clientIp === '::ffff:127.0.0.1') {
            req.isInternal = true;
            return next();
        }

        // 2. Dashboard internal key (for frontend-backend communication)
        if (apiKey === 'dashboard-internal' || apiKey === 'test-key-dashboard') {
            req.isInternal = true;
            return next();
        }

        // 3. Validate API Key
        if (!apiKey) {
            return res.status(401).json({ success: false, error: { code: 'MISSING_API_KEY', message: 'x-api-key header is missing' } });
        }

        // Check DB
        // Note: In production you might want to hash the key. For now we store plain for simplicity/mvp.
        const keyRecord = await prisma.apiKey.findFirst({
            where: {
                key_hash: apiKey, // In real app, verify hash
                is_active: true
            }
        });

        if (!keyRecord) {
            return res.status(403).json({ success: false, error: { code: 'INVALID_API_KEY', message: 'Invalid or revoked API Key' } });
        }

        // 3. Attach Context & Update Stats
        req.apiKeyId = keyRecord.id;

        // Update last_used (Fire and forget)
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
