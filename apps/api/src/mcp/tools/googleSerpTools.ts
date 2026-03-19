import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { READ_ONLY_TOOL_ANNOTATIONS } from '../annotations';
import { jsonTitleMarkdown } from '../formatters';
import { createToolError, createToolSuccess } from '../responses';
import { GenericToolResultSchema, ResponseFormatSchema } from '../schemas';
import type { McpToolContext } from '../types';
import { googleSerpService } from '../../services/scrape/GoogleSerpService';

export function registerGoogleSerpTools(server: McpServer, _context: McpToolContext) {
    server.registerTool(
        'headlessx_google_ai_search',
        {
            title: 'HeadlessX Google AI Search',
            description: 'Run a Google AI Search scrape and return structured Google results.',
            inputSchema: z.object({
                query: z.string().trim().min(1),
                response_format: ResponseFormatSchema,
            }),
            outputSchema: GenericToolResultSchema,
            annotations: READ_ONLY_TOOL_ANNOTATIONS,
        },
        async ({ query, response_format }) => {
            try {
                const result = await googleSerpService.search(query);
                return createToolSuccess(result, response_format, result.markdown);
            } catch (error) {
                return createToolError(error instanceof Error ? error.message : 'Google AI Search failed');
            }
        }
    );

    server.registerTool(
        'headlessx_google_ai_search_status',
        {
            title: 'HeadlessX Google AI Search Status',
            description: 'Return the current Google AI Search backend status.',
            inputSchema: z.object({
                response_format: ResponseFormatSchema,
            }),
            outputSchema: GenericToolResultSchema,
            annotations: READ_ONLY_TOOL_ANNOTATIONS,
        },
        async ({ response_format }) => {
            const result = {
                status: 'online',
                service: 'google-ai-search-v1',
            };

            return createToolSuccess(result, response_format, jsonTitleMarkdown('Google AI Search Status', result));
        }
    );
}
