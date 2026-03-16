import type { Request, Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { AuthenticatedApiKey } from '../services/auth/ApiKeyAuthService';
import { resolveMcpApiKey } from './auth';
import { registerHeadlessXTools } from './registerTools';

function createHeadlessXMcpServer(authenticatedKey: AuthenticatedApiKey) {
    const server = new McpServer({
        name: 'headlessx-mcp-server',
        version: '1.0.0',
    });

    registerHeadlessXTools(server, { authenticatedKey });

    return server;
}

export async function handleMcpRequest(req: Request, res: Response) {
    const authResult = await resolveMcpApiKey(req);
    if (!authResult.ok) {
        res.status(authResult.status).json(authResult.body);
        return;
    }

    const server = createHeadlessXMcpServer(authResult.authenticatedKey);
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
    });

    try {
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: error instanceof Error ? error.message : 'MCP request failed',
                },
                id: null,
            });
        }
    } finally {
        await server.close().catch(() => { });
    }
}
