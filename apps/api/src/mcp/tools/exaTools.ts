import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { READ_ONLY_TOOL_ANNOTATIONS } from '../annotations';
import { jsonTitleMarkdown } from '../formatters';
import { createToolError, createToolSuccess } from '../responses';
import { GenericToolResultSchema, ResponseFormatSchema } from '../schemas';
import type { McpToolContext } from '../types';
import { exaService } from '../../services/ai/ExaService';

export function registerExaTools(server: McpServer, _context: McpToolContext) {
    server.registerTool(
        'headlessx_exa_search',
        {
            title: 'HeadlessX Exa Search',
            description: 'Run an Exa search through the configured backend integration.',
            inputSchema: z.object({
                query: z.string().trim().min(1),
                type: z.enum(['auto', 'fast', 'instant', 'deep']).optional().default('auto'),
                num_results: z.number().int().min(1).max(20).optional().default(5),
                content_mode: z.enum(['highlights', 'text']).optional().default('highlights'),
                max_characters: z.number().int().min(200).max(20000).optional().default(4000),
                max_age_hours: z.number().int().min(-1).max(720).optional(),
                category: z.enum(['company', 'research paper', 'news', 'personal site', 'financial report', 'people']).optional(),
                include_domains: z.array(z.string().trim().min(1)).max(200).optional(),
                exclude_domains: z.array(z.string().trim().min(1)).max(200).optional(),
                system_prompt: z.string().trim().max(1000).optional(),
                response_format: ResponseFormatSchema,
            }),
            outputSchema: GenericToolResultSchema,
            annotations: READ_ONLY_TOOL_ANNOTATIONS,
        },
        async (args) => {
            try {
                const result = await exaService.search({
                    query: args.query,
                    type: args.type,
                    numResults: args.num_results,
                    contentMode: args.content_mode,
                    maxCharacters: args.max_characters,
                    maxAgeHours: args.max_age_hours,
                    category: args.category,
                    includeDomains: args.include_domains,
                    excludeDomains: args.exclude_domains,
                    systemPrompt: args.system_prompt,
                });

                return createToolSuccess(result, args.response_format);
            } catch (error) {
                return createToolError(error instanceof Error ? error.message : 'Exa search failed');
            }
        }
    );

    server.registerTool(
        'headlessx_exa_status',
        {
            title: 'HeadlessX Exa Status',
            description: 'Return the current Exa integration status.',
            inputSchema: z.object({
                response_format: ResponseFormatSchema,
            }),
            outputSchema: GenericToolResultSchema,
            annotations: READ_ONLY_TOOL_ANNOTATIONS,
        },
        async ({ response_format }) => {
            const result = {
                status: 'online',
                configured: exaService.isConfigured(),
                service: 'exa-v1',
            };

            return createToolSuccess(result, response_format, jsonTitleMarkdown('Exa Status', result));
        }
    );
}
