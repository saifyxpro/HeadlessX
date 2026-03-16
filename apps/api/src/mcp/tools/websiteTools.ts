import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { READ_ONLY_TOOL_ANNOTATIONS } from '../annotations';
import { websiteHtmlMarkdown, websiteMapMarkdown, websiteMarkdownResult } from '../formatters';
import { createToolError, createToolSuccess } from '../responses';
import { GenericToolResultSchema, ResponseFormatSchema } from '../schemas';
import type { McpToolContext } from '../types';
import { scraperService } from '../../services/scrape/ScraperService';
import { websiteDiscoveryService } from '../../services/scrape/WebsiteDiscoveryService';

export function registerWebsiteTools(server: McpServer, context: McpToolContext) {
    server.registerTool(
        'headlessx_website_get_html',
        {
            title: 'HeadlessX Website HTML',
            description: 'Fetch raw HTML from a website using the HeadlessX scraping engine.',
            inputSchema: z.object({
                url: z.string().url(),
                render_javascript: z.boolean().optional().default(false),
                wait_for_selector: z.string().trim().min(1).optional(),
                timeout_ms: z.number().int().positive().max(180000).optional(),
                stealth: z.boolean().optional(),
                response_format: ResponseFormatSchema,
            }),
            outputSchema: GenericToolResultSchema,
            annotations: READ_ONLY_TOOL_ANNOTATIONS,
        },
        async ({ url, render_javascript, wait_for_selector, timeout_ms, stealth, response_format }) => {
            try {
                const result = await scraperService.scrape(url, {
                    apiKeyId: context.authenticatedKey.id,
                    jsEnabled: render_javascript,
                    waitForSelector: wait_for_selector,
                    timeout: timeout_ms,
                    stealth,
                    screenshotOnError: false,
                });

                const data = {
                    url: result.url,
                    title: result.title,
                    statusCode: result.statusCode,
                    metadata: result.metadata || {},
                    html: result.html,
                };

                return createToolSuccess(data, response_format, websiteHtmlMarkdown(data));
            } catch (error) {
                return createToolError(error instanceof Error ? error.message : 'Website HTML scrape failed');
            }
        }
    );

    server.registerTool(
        'headlessx_website_get_markdown',
        {
            title: 'HeadlessX Website Markdown',
            description: 'Fetch markdown content from a website using HeadlessX content extraction.',
            inputSchema: z.object({
                url: z.string().url(),
                render_javascript: z.boolean().optional().default(true),
                wait_for_selector: z.string().trim().min(1).optional(),
                timeout_ms: z.number().int().positive().max(180000).optional(),
                stealth: z.boolean().optional(),
                response_format: ResponseFormatSchema,
            }),
            outputSchema: GenericToolResultSchema,
            annotations: READ_ONLY_TOOL_ANNOTATIONS,
        },
        async ({ url, render_javascript, wait_for_selector, timeout_ms, stealth, response_format }) => {
            try {
                const result = await scraperService.scrapeContent(url, {
                    apiKeyId: context.authenticatedKey.id,
                    jsEnabled: render_javascript,
                    waitForSelector: wait_for_selector,
                    timeout: timeout_ms,
                    stealth,
                    screenshotOnError: false,
                });

                const data = {
                    url: result.url,
                    title: result.title,
                    metadata: result.metadata || {},
                    markdown: result.markdown || '',
                };

                return createToolSuccess(data, response_format, websiteMarkdownResult(data));
            } catch (error) {
                return createToolError(error instanceof Error ? error.message : 'Website markdown extraction failed');
            }
        }
    );

    server.registerTool(
        'headlessx_website_map_links',
        {
            title: 'HeadlessX Website Map',
            description: 'Discover and summarize links from a target website.',
            inputSchema: z.object({
                url: z.string().url(),
                limit: z.number().int().min(1).max(250).optional(),
                include_subdomains: z.boolean().optional(),
                include_external: z.boolean().optional(),
                use_sitemap: z.boolean().optional(),
                max_discovery_depth: z.number().int().min(0).max(3).optional(),
                include_paths: z.array(z.string().min(1)).max(20).optional(),
                exclude_paths: z.array(z.string().min(1)).max(20).optional(),
                crawl_entire_domain: z.boolean().optional(),
                ignore_query_parameters: z.boolean().optional(),
                timeout_ms: z.number().int().positive().max(180000).optional(),
                wait_for_selector: z.string().trim().min(1).optional(),
                stealth: z.boolean().optional(),
                response_format: ResponseFormatSchema,
            }),
            outputSchema: GenericToolResultSchema,
            annotations: READ_ONLY_TOOL_ANNOTATIONS,
        },
        async (args) => {
            try {
                const result = await websiteDiscoveryService.map({
                    url: args.url,
                    limit: args.limit,
                    includeSubdomains: args.include_subdomains,
                    includeExternal: args.include_external,
                    useSitemap: args.use_sitemap,
                    maxDiscoveryDepth: args.max_discovery_depth,
                    includePaths: args.include_paths,
                    excludePaths: args.exclude_paths,
                    crawlEntireDomain: args.crawl_entire_domain,
                    ignoreQueryParameters: args.ignore_query_parameters,
                    timeout: args.timeout_ms,
                    waitForSelector: args.wait_for_selector,
                    stealth: args.stealth,
                });

                return createToolSuccess(result, args.response_format, websiteMapMarkdown(result));
            } catch (error) {
                return createToolError(error instanceof Error ? error.message : 'Website map failed');
            }
        }
    );
}
