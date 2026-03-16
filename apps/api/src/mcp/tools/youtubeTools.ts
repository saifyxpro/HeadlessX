import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { READ_ONLY_TOOL_ANNOTATIONS } from '../annotations';
import { jsonTitleMarkdown } from '../formatters';
import { createToolError, createToolSuccess } from '../responses';
import { GenericToolResultSchema, ResponseFormatSchema } from '../schemas';
import type { McpToolContext } from '../types';
import { youtubeEngineService } from '../../services/media/YoutubeEngineService';

export function registerYoutubeTools(server: McpServer, _context: McpToolContext) {
    const youtubeExtractSchema = z.object({
        url: z.string().url(),
        flat_playlist: z.boolean().optional().default(true),
        playlist_preview_limit: z.number().int().min(1).max(50).optional().default(10),
        player_client_profile: z.enum(['mobile', 'default']).optional().default('mobile'),
        metadata_language: z.string().trim().min(2).max(16).optional(),
        socket_timeout: z.number().int().min(10).max(180).optional().default(30),
        response_format: ResponseFormatSchema,
    });

    server.registerTool(
        'headlessx_youtube_extract_info',
        {
            title: 'HeadlessX YouTube Extract Info',
            description: 'Extract YouTube metadata, playlist preview, formats, and subtitles.',
            inputSchema: youtubeExtractSchema.extend({
                include_formats: z.boolean().optional().default(true),
                include_subtitles: z.boolean().optional().default(true),
            }),
            outputSchema: GenericToolResultSchema,
            annotations: READ_ONLY_TOOL_ANNOTATIONS,
        },
        async (args) => {
            try {
                const result = await youtubeEngineService.getInfo({
                    url: args.url,
                    flatPlaylist: args.flat_playlist,
                    includeFormats: args.include_formats,
                    includeSubtitles: args.include_subtitles,
                    playlistPreviewLimit: args.playlist_preview_limit,
                    playerClientProfile: args.player_client_profile,
                    metadataLanguage: args.metadata_language,
                    socketTimeout: args.socket_timeout,
                });

                return createToolSuccess(result, args.response_format, jsonTitleMarkdown('YouTube Extract Info', result));
            } catch (error) {
                return createToolError(error instanceof Error ? error.message : 'YouTube extract failed');
            }
        }
    );

    server.registerTool(
        'headlessx_youtube_list_formats',
        {
            title: 'HeadlessX YouTube Formats',
            description: 'List extracted YouTube format inventory for a given video URL.',
            inputSchema: youtubeExtractSchema,
            outputSchema: GenericToolResultSchema,
            annotations: READ_ONLY_TOOL_ANNOTATIONS,
        },
        async (args) => {
            try {
                const result = await youtubeEngineService.getFormats({
                    url: args.url,
                    flatPlaylist: args.flat_playlist,
                    includeFormats: true,
                    includeSubtitles: false,
                    playlistPreviewLimit: args.playlist_preview_limit,
                    playerClientProfile: args.player_client_profile,
                    metadataLanguage: args.metadata_language,
                    socketTimeout: args.socket_timeout,
                });

                return createToolSuccess(result, args.response_format, jsonTitleMarkdown('YouTube Formats', result));
            } catch (error) {
                return createToolError(error instanceof Error ? error.message : 'YouTube formats extraction failed');
            }
        }
    );

    server.registerTool(
        'headlessx_youtube_list_subtitles',
        {
            title: 'HeadlessX YouTube Subtitles',
            description: 'List extracted YouTube subtitles and captions for a given video URL.',
            inputSchema: youtubeExtractSchema,
            outputSchema: GenericToolResultSchema,
            annotations: READ_ONLY_TOOL_ANNOTATIONS,
        },
        async (args) => {
            try {
                const result = await youtubeEngineService.getSubtitles({
                    url: args.url,
                    flatPlaylist: args.flat_playlist,
                    includeFormats: false,
                    includeSubtitles: true,
                    playlistPreviewLimit: args.playlist_preview_limit,
                    playerClientProfile: args.player_client_profile,
                    metadataLanguage: args.metadata_language,
                    socketTimeout: args.socket_timeout,
                });

                return createToolSuccess(result, args.response_format, jsonTitleMarkdown('YouTube Subtitles', result));
            } catch (error) {
                return createToolError(error instanceof Error ? error.message : 'YouTube subtitles extraction failed');
            }
        }
    );

    server.registerTool(
        'headlessx_youtube_status',
        {
            title: 'HeadlessX YouTube Status',
            description: 'Return the current YouTube engine integration status.',
            inputSchema: z.object({
                response_format: ResponseFormatSchema,
            }),
            outputSchema: GenericToolResultSchema,
            annotations: READ_ONLY_TOOL_ANNOTATIONS,
        },
        async ({ response_format }) => {
            try {
                const result = await youtubeEngineService.getStatus();
                return createToolSuccess(result, response_format, jsonTitleMarkdown('YouTube Status', result));
            } catch (error) {
                return createToolError(error instanceof Error ? error.message : 'YouTube status lookup failed');
            }
        }
    );
}
