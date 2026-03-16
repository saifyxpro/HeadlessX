import type { AuthenticatedApiKey } from '../services/auth/ApiKeyAuthService';

export type McpToolContext = {
    authenticatedKey: AuthenticatedApiKey;
};
