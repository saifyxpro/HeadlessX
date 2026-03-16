import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ACTION_TOOL_ANNOTATIONS, READ_ONLY_TOOL_ANNOTATIONS } from '../annotations';
import { jsonTitleMarkdown } from '../formatters';
import { createToolError, createToolSuccess } from '../responses';
import { GenericToolResultSchema, ResponseFormatSchema } from '../schemas';
import type { McpToolContext } from '../types';
import { tavilyService } from '../../services/ai/TavilyService';

export function registerTavilyTools(server: McpServer, _context: McpToolContext) {
    server.registerTool(
        'headlessx_tavily_search',
        {
            title: 'HeadlessX Tavily Search',
            description: 'Run a Tavily search through the configured backend integration.',
            inputSchema: z.object({
                query: z.string().trim().min(1),
                search_depth: z.enum(['basic', 'advanced']).optional().default('basic'),
                topic: z.enum(['general', 'news', 'finance']).optional().default('general'),
                max_results: z.number().int().min(1).max(20).optional().default(5),
                include_answer: z.boolean().optional().default(true),
                include_images: z.boolean().optional().default(false),
                include_raw_content: z.union([z.literal(false), z.enum(['markdown', 'text'])]).optional().default(false),
                include_domains: z.array(z.string().trim().min(1)).max(300).optional(),
                exclude_domains: z.array(z.string().trim().min(1)).max(300).optional(),
                time_range: z.enum(['day', 'week', 'month', 'year']).optional(),
                timeout_seconds: z.number().int().min(5).max(120).optional(),
                response_format: ResponseFormatSchema,
            }),
            outputSchema: GenericToolResultSchema,
            annotations: READ_ONLY_TOOL_ANNOTATIONS,
        },
        async (args) => {
            try {
                const result = await tavilyService.search({
                    query: args.query,
                    searchDepth: args.search_depth,
                    topic: args.topic,
                    maxResults: args.max_results,
                    includeAnswer: args.include_answer,
                    includeImages: args.include_images,
                    includeRawContent: args.include_raw_content,
                    includeDomains: args.include_domains,
                    excludeDomains: args.exclude_domains,
                    timeRange: args.time_range,
                    timeout: args.timeout_seconds,
                });

                return createToolSuccess(result, args.response_format);
            } catch (error) {
                return createToolError(error instanceof Error ? error.message : 'Tavily search failed');
            }
        }
    );

    server.registerTool(
        'headlessx_tavily_research',
        {
            title: 'HeadlessX Tavily Research',
            description: 'Start a Tavily research workflow and return the request details for later polling.',
            inputSchema: z.object({
                query: z.string().trim().min(1),
                model: z.enum(['auto', 'mini', 'pro']).optional().default('auto'),
                citation_format: z.enum(['numbered', 'mla', 'apa', 'chicago']).optional().default('numbered'),
                timeout_seconds: z.number().int().min(30).max(300).optional(),
                response_format: ResponseFormatSchema,
            }),
            outputSchema: GenericToolResultSchema,
            annotations: ACTION_TOOL_ANNOTATIONS,
        },
        async (args) => {
            try {
                const result = await tavilyService.startResearch({
                    query: args.query,
                    model: args.model,
                    citationFormat: args.citation_format,
                    timeout: args.timeout_seconds,
                });

                return createToolSuccess(result, args.response_format, jsonTitleMarkdown('Tavily Research Request', result));
            } catch (error) {
                return createToolError(error instanceof Error ? error.message : 'Tavily research failed');
            }
        }
    );

    server.registerTool(
        'headlessx_tavily_get_research',
        {
            title: 'HeadlessX Tavily Research Result',
            description: 'Fetch the result of a previously created Tavily research request.',
            inputSchema: z.object({
                request_id: z.string().trim().min(1),
                response_format: ResponseFormatSchema,
            }),
            outputSchema: GenericToolResultSchema,
            annotations: READ_ONLY_TOOL_ANNOTATIONS,
        },
        async ({ request_id, response_format }) => {
            try {
                const result = await tavilyService.getResearch(request_id);
                return createToolSuccess(result, response_format, jsonTitleMarkdown('Tavily Research Result', result));
            } catch (error) {
                return createToolError(error instanceof Error ? error.message : 'Tavily research lookup failed');
            }
        }
    );

    server.registerTool(
        'headlessx_tavily_status',
        {
            title: 'HeadlessX Tavily Status',
            description: 'Return the current Tavily integration status.',
            inputSchema: z.object({
                response_format: ResponseFormatSchema,
            }),
            outputSchema: GenericToolResultSchema,
            annotations: READ_ONLY_TOOL_ANNOTATIONS,
        },
        async ({ response_format }) => {
            const result = {
                status: 'online',
                configured: tavilyService.isConfigured(),
                service: 'tavily-v1',
            };

            return createToolSuccess(result, response_format, jsonTitleMarkdown('Tavily Status', result));
        }
    );
}
