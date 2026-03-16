import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpToolContext } from './types';
import { registerExaTools } from './tools/exaTools';
import { registerGoogleSerpTools } from './tools/googleSerpTools';
import { registerJobTools } from './tools/jobTools';
import { registerTavilyTools } from './tools/tavilyTools';
import { registerWebsiteTools } from './tools/websiteTools';
import { registerYoutubeTools } from './tools/youtubeTools';

export function registerHeadlessXTools(server: McpServer, context: McpToolContext) {
    registerWebsiteTools(server, context);
    registerGoogleSerpTools(server, context);
    registerTavilyTools(server, context);
    registerExaTools(server, context);
    registerYoutubeTools(server, context);
    registerJobTools(server, context);
}
