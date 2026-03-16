import { z } from 'zod';

export const QueueJobTypeSchema = z.enum(['scrape', 'crawl', 'extract', 'index']);
export const ScrapeOutputTypeSchema = z.enum(['html', 'html-js', 'screenshot']);

export const QueueEnqueueOptionsSchema = z.object({
    attempts: z.number().int().min(1).max(10).optional(),
    priority: z.number().int().min(1).max(100).optional(),
}).optional();

export const ScrapeJobPayloadSchema = z.object({
    url: z.string().url(),
    outputType: ScrapeOutputTypeSchema.default('html'),
    waitForSelector: z.string().min(1).optional(),
    timeout: z.number().int().positive().optional(),
    stealth: z.boolean().optional(),
    fullPage: z.boolean().optional(),
});

export const ExtractJobPayloadSchema = z.object({
    url: z.string().url(),
    waitForSelector: z.string().min(1).optional(),
    timeout: z.number().int().positive().optional(),
    stealth: z.boolean().optional(),
});

export const CrawlJobPayloadSchema = z.object({
    url: z.string().url(),
    limit: z.number().int().min(1).max(100).optional(),
    maxDepth: z.number().int().min(0).max(4).optional(),
    includeSubdomains: z.boolean().optional(),
    includeExternal: z.boolean().optional(),
    includePaths: z.array(z.string().min(1)).max(20).optional(),
    excludePaths: z.array(z.string().min(1)).max(20).optional(),
    crawlEntireDomain: z.boolean().optional(),
    ignoreQueryParameters: z.boolean().optional(),
    waitForSelector: z.string().min(1).optional(),
    timeout: z.number().int().positive().optional(),
    stealth: z.boolean().optional(),
});

export const IndexJobPayloadSchema = z.object({
    url: z.string().url(),
    waitForSelector: z.string().min(1).optional(),
    timeout: z.number().int().positive().optional(),
    stealth: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export const CreateQueueJobSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('scrape'),
        payload: ScrapeJobPayloadSchema,
        options: QueueEnqueueOptionsSchema,
    }),
    z.object({
        type: z.literal('extract'),
        payload: ExtractJobPayloadSchema,
        options: QueueEnqueueOptionsSchema,
    }),
    z.object({
        type: z.literal('crawl'),
        payload: CrawlJobPayloadSchema,
        options: QueueEnqueueOptionsSchema,
    }),
    z.object({
        type: z.literal('index'),
        payload: IndexJobPayloadSchema,
        options: QueueEnqueueOptionsSchema,
    }),
]);

export const ListQueueJobsSchema = z.object({
    type: QueueJobTypeSchema.optional(),
    status: z.enum(['queued', 'active', 'completed', 'failed', 'cancelled']).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
});

export type QueueJobTypeName = z.infer<typeof QueueJobTypeSchema>;
export type ScrapeOutputTypeName = z.infer<typeof ScrapeOutputTypeSchema>;
export type QueueEnqueueOptions = NonNullable<z.infer<typeof QueueEnqueueOptionsSchema>>;
export type ScrapeJobPayload = z.infer<typeof ScrapeJobPayloadSchema>;
export type CrawlJobPayload = z.infer<typeof CrawlJobPayloadSchema>;
export type ExtractJobPayload = z.infer<typeof ExtractJobPayloadSchema>;
export type IndexJobPayload = z.infer<typeof IndexJobPayloadSchema>;
export type CreateQueueJobInput = z.infer<typeof CreateQueueJobSchema>;
export type ListQueueJobsInput = z.infer<typeof ListQueueJobsSchema>;

export interface QueueJobEnvelope {
    id: string;
    type: QueueJobTypeName;
    apiKeyId: string | null;
    createdAt: number;
    payload: ScrapeJobPayload | CrawlJobPayload | ExtractJobPayload | IndexJobPayload;
}
