import type { Request } from 'express';
import { apiKeyAuthService } from '../services/auth/ApiKeyAuthService';

export async function resolveMcpApiKey(req: Request) {
    const apiKey = typeof req.headers['x-api-key'] === 'string'
        ? req.headers['x-api-key']
        : undefined;

    if (!apiKey) {
        return {
            ok: false as const,
            status: 401,
            body: {
                jsonrpc: '2.0',
                error: { code: -32001, message: 'x-api-key header is missing' },
                id: null,
            },
        };
    }

    const authenticatedKey = await apiKeyAuthService.authenticate(apiKey);
    if (!authenticatedKey) {
        return {
            ok: false as const,
            status: 403,
            body: {
                jsonrpc: '2.0',
                error: { code: -32001, message: 'Invalid or revoked API key' },
                id: null,
            },
        };
    }

    if (authenticatedKey.isInternal) {
        return {
            ok: false as const,
            status: 403,
            body: {
                jsonrpc: '2.0',
                error: { code: -32001, message: 'DASHBOARD_INTERNAL_API_KEY cannot be used for MCP access' },
                id: null,
            },
        };
    }

    return {
        ok: true as const,
        authenticatedKey,
    };
}
