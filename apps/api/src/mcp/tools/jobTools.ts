import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { READ_ONLY_TOOL_ANNOTATIONS } from '../annotations';
import { jsonTitleMarkdown } from '../formatters';
import { createToolError, createToolSuccess } from '../responses';
import { GenericToolResultSchema, ResponseFormatSchema } from '../schemas';
import type { McpToolContext } from '../types';
import { jobManager } from '../../services/JobManager';
import { queueJobService } from '../../services/queue/QueueJobService';
import { ListQueueJobsSchema } from '../../services/queue/jobSchemas';

function serializeStreamJob(streamJob: ReturnType<typeof jobManager.getJob>) {
    if (!streamJob) {
        return null;
    }

    return {
        id: streamJob.id,
        url: streamJob.url,
        type: streamJob.type,
        status: streamJob.status,
        progress: streamJob.progress,
        result: streamJob.result ?? null,
        error: streamJob.error ?? null,
        createdAt: streamJob.createdAt,
        updatedAt: streamJob.updatedAt,
        source: 'stream',
    };
}

export function registerJobTools(server: McpServer, context: McpToolContext) {
    server.registerTool(
        'headlessx_job_get_status',
        {
            title: 'HeadlessX Job Status',
            description: 'Get the current status for an in-memory or queued HeadlessX job.',
            inputSchema: z.object({
                job_id: z.string().trim().min(1),
                response_format: ResponseFormatSchema,
            }),
            outputSchema: GenericToolResultSchema,
            annotations: READ_ONLY_TOOL_ANNOTATIONS,
        },
        async ({ job_id, response_format }) => {
            try {
                const streamJob = jobManager.getJob(job_id);

                if (streamJob) {
                    if (streamJob.apiKeyId !== context.authenticatedKey.id) {
                        return createToolError('Job does not belong to the current API key');
                    }

                    const data = serializeStreamJob(streamJob);
                    return createToolSuccess(data, response_format, jsonTitleMarkdown('HeadlessX Job Status', data));
                }

                const queueJob = await queueJobService.getJobById(job_id);
                if (!queueJob) {
                    return createToolError('Job not found');
                }

                if ((queueJob.api_key_id || null) !== context.authenticatedKey.id) {
                    return createToolError('Job does not belong to the current API key');
                }

                const data = {
                    ...queueJobService.serializeJob(queueJob),
                    source: 'queue',
                };

                return createToolSuccess(data, response_format, jsonTitleMarkdown('HeadlessX Job Status', data));
            } catch (error) {
                return createToolError(error instanceof Error ? error.message : 'Job status lookup failed');
            }
        }
    );

    server.registerTool(
        'headlessx_job_get_active',
        {
            title: 'HeadlessX Active Job',
            description: 'Return the currently active stream or queued job for the current API key.',
            inputSchema: z.object({
                response_format: ResponseFormatSchema,
            }),
            outputSchema: GenericToolResultSchema,
            annotations: READ_ONLY_TOOL_ANNOTATIONS,
        },
        async ({ response_format }) => {
            try {
                const streamJob = jobManager.getActiveJob(context.authenticatedKey.id);
                if (streamJob) {
                    const data = serializeStreamJob(streamJob);
                    return createToolSuccess(data, response_format, jsonTitleMarkdown('HeadlessX Active Job', data));
                }

                const queueJob = await queueJobService.getFirstActiveJob(context.authenticatedKey.id);
                const data = queueJob
                    ? { ...queueJobService.serializeJob(queueJob), source: 'queue' }
                    : { active: false };

                return createToolSuccess(data, response_format, jsonTitleMarkdown('HeadlessX Active Job', data));
            } catch (error) {
                return createToolError(error instanceof Error ? error.message : 'Active job lookup failed');
            }
        }
    );

    server.registerTool(
        'headlessx_job_list',
        {
            title: 'HeadlessX Job List',
            description: 'List queued jobs for the current API key with optional type and status filters.',
            inputSchema: z.object({
                type: z.enum(['scrape', 'crawl', 'extract', 'index']).optional(),
                status: z.enum(['queued', 'active', 'completed', 'failed', 'cancelled']).optional(),
                limit: z.number().int().min(1).max(100).optional().default(20),
                offset: z.number().int().min(0).optional().default(0),
                response_format: ResponseFormatSchema,
            }),
            outputSchema: GenericToolResultSchema,
            annotations: READ_ONLY_TOOL_ANNOTATIONS,
        },
        async ({ type, status, limit, offset, response_format }) => {
            try {
                const filters = ListQueueJobsSchema.parse({ type, status, limit, offset });
                const data = await queueJobService.listJobsPage(filters, context.authenticatedKey.id);

                return createToolSuccess(data, response_format, jsonTitleMarkdown('HeadlessX Job List', data));
            } catch (error) {
                return createToolError(error instanceof Error ? error.message : 'Job listing failed');
            }
        }
    );

    server.registerTool(
        'headlessx_job_get_metrics',
        {
            title: 'HeadlessX Queue Metrics',
            description: 'Read current BullMQ queue metrics from the backend.',
            inputSchema: z.object({
                response_format: ResponseFormatSchema,
            }),
            outputSchema: GenericToolResultSchema,
            annotations: READ_ONLY_TOOL_ANNOTATIONS,
        },
        async ({ response_format }) => {
            try {
                const result = await queueJobService.getQueueMetrics();
                return createToolSuccess(result, response_format, jsonTitleMarkdown('HeadlessX Queue Metrics', result));
            } catch (error) {
                return createToolError(error instanceof Error ? error.message : 'Queue metrics lookup failed');
            }
        }
    );
}
