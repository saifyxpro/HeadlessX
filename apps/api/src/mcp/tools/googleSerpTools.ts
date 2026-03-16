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
        'headlessx_google_serp_search',
        {
            title: 'HeadlessX Google SERP Search',
            description: 'Run a Google search scrape and return structured SERP results.',
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
                return createToolError(error instanceof Error ? error.message : 'Google SERP search failed');
            }
        }
    );

    server.registerTool(
        'headlessx_google_serp_status',
        {
            title: 'HeadlessX Google SERP Status',
            description: 'Return the current Google SERP backend status.',
            inputSchema: z.object({
                response_format: ResponseFormatSchema,
            }),
            outputSchema: GenericToolResultSchema,
            annotations: READ_ONLY_TOOL_ANNOTATIONS,
        },
        async ({ response_format }) => {
            const result = {
                status: 'online',
                service: 'google-serp-v1',
            };

            return createToolSuccess(result, response_format, jsonTitleMarkdown('Google SERP Status', result));
        }
    );
}
