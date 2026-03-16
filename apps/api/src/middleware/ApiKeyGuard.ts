import { Request, Response, NextFunction } from 'express';
import { apiKeyAuthService } from '../services/auth/ApiKeyAuthService';

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
        const apiKey = req.headers['x-api-key'] as string | undefined;

        if (!apiKey) {
            return res.status(401).json({ success: false, error: { code: 'MISSING_API_KEY', message: 'x-api-key header is missing' } });
        }

        const authenticatedKey = await apiKeyAuthService.authenticate(apiKey);
        if (!authenticatedKey) {
            return res.status(403).json({ success: false, error: { code: 'INVALID_API_KEY', message: 'Invalid or revoked API Key' } });
        }

        req.isInternal = authenticatedKey.isInternal;
        if (!authenticatedKey.isInternal) {
            req.apiKeyId = authenticatedKey.id;
        }

        next();

    } catch (error) {
        console.error('ApiKeyGuard Error:', error);
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Auth service failure' } });
    }
};
