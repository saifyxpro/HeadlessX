import { randomUUID } from 'crypto';
import { Queue } from 'bullmq';
import {
    QueueJobStatus,
    QueueJobType,
    type QueueJob,
} from '@prisma/client';
import { prisma } from '../../database/client';
import { queueCancellationChannel } from './cancellationChannel';
import type {
    CreateQueueJobInput,
    ListQueueJobsInput,
    QueueJobEnvelope,
    QueueJobTypeName,
} from './jobSchemas';
import { queueConfig } from './queueConfig';
import {
    createQueueUnavailableError,
    createRedisConnection,
    formatRedisTarget,
    isRedisConnectionError,
    isQueueUnavailableError,
} from './redis';

const PRISMA_TYPE_MAP: Record<QueueJobTypeName, QueueJobType> = {
    scrape: QueueJobType.SCRAPE,
    crawl: QueueJobType.CRAWL,
    extract: QueueJobType.EXTRACT,
    index: QueueJobType.INDEX,
};

const PRISMA_STATUS_MAP = {
    queued: QueueJobStatus.QUEUED,
    active: QueueJobStatus.ACTIVE,
    completed: QueueJobStatus.COMPLETED,
    failed: QueueJobStatus.FAILED,
    cancelled: QueueJobStatus.CANCELLED,
} as const;

function formatType(type: QueueJobType): QueueJobTypeName {
    return type.toLowerCase() as QueueJobTypeName;
}

function formatStatus(status: QueueJobStatus) {
    return status.toLowerCase();
}

function isQueueStateRemovable(state: string) {
    return state === 'waiting' || state === 'delayed' || state === 'prioritized';
}

class QueueJobService {
    private static instance: QueueJobService;
    private queue: Queue<QueueJobEnvelope, unknown, QueueJobTypeName> | null = null;
    private pendingCancellationIds = new Map<string, number>();
    private readonly pendingCancellationTtlMs = 5 * 60 * 1000;

    public static getInstance() {
        if (!QueueJobService.instance) {
            QueueJobService.instance = new QueueJobService();
        }
        return QueueJobService.instance;
    }

    private cleanupPendingCancellations() {
        const expiresBefore = Date.now() - this.pendingCancellationTtlMs;
        for (const [jobId, createdAt] of this.pendingCancellationIds.entries()) {
            if (createdAt < expiresBefore) {
                this.pendingCancellationIds.delete(jobId);
            }
        }
    }

    private rememberPendingCancellation(jobId: string) {
        this.cleanupPendingCancellations();
        this.pendingCancellationIds.set(jobId, Date.now());
    }

    private consumePendingCancellation(jobId: string) {
        this.cleanupPendingCancellations();
        const pending = this.pendingCancellationIds.has(jobId);
        if (pending) {
            this.pendingCancellationIds.delete(jobId);
        }
        return pending;
    }

    private async getQueue() {
        if (!this.queue) {
            this.queue = new Queue<QueueJobEnvelope, unknown, QueueJobTypeName>(queueConfig.queueName, {
                connection: createRedisConnection('headlessx-queue-producer'),
            });
        }

        try {
            await this.queue.waitUntilReady();
            return this.queue;
        } catch (error) {
            this.queue = null;

            if (isRedisConnectionError(error)) {
                throw createQueueUnavailableError();
            }

            throw error;
        }
    }

    public serializeJob(job: QueueJob) {
        return {
            id: job.id,
            type: formatType(job.type),
            status: formatStatus(job.status),
            target: job.target,
            progress: job.progress_payload,
            result: job.result_payload,
            error: job.error_message,
            attemptsMade: job.attempts_made,
            maxAttempts: job.max_attempts,
            cancelRequested: job.cancel_requested,
            createdAt: job.created_at,
            updatedAt: job.updated_at,
            startedAt: job.started_at,
            completedAt: job.completed_at,
        };
    }

    public async createJob(input: CreateQueueJobInput, apiKeyId: string | null) {
        const payloadJobId = typeof (input.payload as { jobId?: unknown }).jobId === 'string'
            ? (input.payload as { jobId?: string }).jobId?.trim()
            : undefined;
        const id = payloadJobId || randomUUID();
        const pendingCancellation = this.consumePendingCancellation(id);
        const attempts = input.options?.attempts ?? queueConfig.defaultJobAttempts;
        const queueType = PRISMA_TYPE_MAP[input.type];
        const target = 'url' in input.payload ? input.payload.url : null;

        await prisma.queueJob.create({
            data: {
                id,
                api_key_id: apiKeyId || undefined,
                type: queueType,
                status: pendingCancellation ? QueueJobStatus.CANCELLED : QueueJobStatus.QUEUED,
                queue_name: queueConfig.queueName,
                target,
                request_payload: input.payload as any,
                max_attempts: attempts,
                cancel_requested: pendingCancellation,
                error_message: pendingCancellation ? 'Job cancelled before enqueue' : null,
                completed_at: pendingCancellation ? new Date() : null,
                progress_payload: pendingCancellation
                    ? ({
                        step: 0,
                        total: 0,
                        message: 'Job cancelled before enqueue',
                        status: 'error',
                    } as any)
                    : undefined,
            },
        });

        if (pendingCancellation) {
            const cancelledJob = await prisma.queueJob.findUniqueOrThrow({ where: { id } });
            return this.serializeJob(cancelledJob);
        }

        const queue = await this.getQueue();

        try {
            await queue.add(
                input.type as QueueJobTypeName,
                {
                    id,
                    type: input.type,
                    apiKeyId,
                    createdAt: Date.now(),
                    payload: input.payload,
                },
                {
                    jobId: id,
                    attempts,
                    priority: input.options?.priority,
                    backoff: {
                        type: 'exponential',
                        delay: queueConfig.jobBackoffMs,
                    },
                    removeOnComplete: false,
                    removeOnFail: false,
                }
            );
        } catch (error) {
            await prisma.queueJob.update({
                where: { id },
                data: {
                    status: QueueJobStatus.FAILED,
                    error_message: error instanceof Error ? error.message : 'Failed to enqueue job',
                    completed_at: new Date(),
                },
            });

            if (isRedisConnectionError(error)) {
                throw createQueueUnavailableError();
            }

            throw error;
        }

        const job = await prisma.queueJob.findUniqueOrThrow({ where: { id } });
        return this.serializeJob(job);
    }

    public async listJobs(filters: ListQueueJobsInput, apiKeyId?: string | null) {
        const page = await this.listJobsPage(filters, apiKeyId);
        return page.jobs;
    }

    public async listJobsPage(filters: ListQueueJobsInput, apiKeyId?: string | null) {
        const where = {
            type: filters.type ? PRISMA_TYPE_MAP[filters.type] : undefined,
            status: filters.status ? PRISMA_STATUS_MAP[filters.status] : undefined,
            api_key_id: apiKeyId === undefined ? undefined : (apiKeyId || null),
        };

        const [jobs, totalCount] = await prisma.$transaction([
            prisma.queueJob.findMany({
                where,
                orderBy: { created_at: 'desc' },
                take: filters.limit,
                skip: filters.offset,
            }),
            prisma.queueJob.count({ where }),
        ]);

        return {
            totalCount,
            count: jobs.length,
            offset: filters.offset,
            limit: filters.limit,
            hasMore: filters.offset + jobs.length < totalCount,
            nextOffset: filters.offset + jobs.length < totalCount ? filters.offset + jobs.length : null,
            jobs: jobs.map((job) => this.serializeJob(job)),
        };
    }

    public async getJobById(id: string) {
        return prisma.queueJob.findUnique({ where: { id } });
    }

    public async getFirstActiveJob(apiKeyId?: string | null) {
        return prisma.queueJob.findFirst({
            where: {
                api_key_id: apiKeyId === undefined ? undefined : (apiKeyId || null),
                status: {
                    in: [QueueJobStatus.QUEUED, QueueJobStatus.ACTIVE],
                },
            },
            orderBy: { created_at: 'asc' },
        });
    }

    public async getQueueMetrics() {
        try {
            const queue = await this.getQueue();
            const counts = await queue.getJobCounts(
                'active',
                'waiting',
                'delayed',
                'completed',
                'failed',
                'paused'
            );

            return {
                queueName: queueConfig.queueName,
                redisTarget: formatRedisTarget(queueConfig.redisUrl),
                available: true,
                counts,
            };
        } catch (error) {
            if (!isRedisConnectionError(error) && !isQueueUnavailableError(error)) {
                throw error;
            }

            return {
                queueName: queueConfig.queueName,
                redisTarget: formatRedisTarget(queueConfig.redisUrl),
                available: false,
                counts: {
                    active: 0,
                    waiting: 0,
                    delayed: 0,
                    completed: 0,
                    failed: 0,
                    paused: 0,
                },
                error: createQueueUnavailableError().message,
            };
        }
    }

    public async cancelJob(id: string) {
        const record = await prisma.queueJob.findUnique({ where: { id } });

        if (!record) {
            this.rememberPendingCancellation(id);
            return {
                found: true as const,
                cancelled: true as const,
                mode: 'pending',
            };
        }

        if (
            record.status === QueueJobStatus.COMPLETED ||
            record.status === QueueJobStatus.FAILED ||
            record.status === QueueJobStatus.CANCELLED
        ) {
            return {
                found: true as const,
                cancelled: false as const,
                reason: 'Job is already finished',
            };
        }

        await prisma.queueJob.update({
            where: { id },
            data: { cancel_requested: true },
        });

        let queue: Queue<QueueJobEnvelope, unknown, QueueJobTypeName> | null = null;

        try {
            queue = await this.getQueue();
        } catch (error) {
            if (!isRedisConnectionError(error) && !isQueueUnavailableError(error)) {
                throw error;
            }
        }

        if (!queue) {
            await prisma.queueJob.update({
                where: { id },
                data: {
                    progress_payload: {
                        step: 0,
                        total: 0,
                        message: 'Cancellation requested; waiting for queue backend',
                        status: 'active',
                    } as any,
                },
            });

            return {
                found: true as const,
                cancelled: true as const,
                mode: 'deferred',
            };
        }

        const bullJob = await queue.getJob(id);
        if (!bullJob) {
            await prisma.queueJob.update({
                where: { id },
                data: {
                    progress_payload: {
                        step: 0,
                        total: 0,
                        message: 'Cancellation requested; job lookup is pending',
                        status: 'active',
                    } as any,
                },
            });

            return {
                found: true as const,
                cancelled: true as const,
                mode: 'deferred',
            };
        }

        const state = await bullJob.getState();
        if (isQueueStateRemovable(state)) {
            await bullJob.remove();
            await prisma.queueJob.update({
                where: { id },
                data: {
                    status: QueueJobStatus.CANCELLED,
                    error_message: 'Job cancelled before execution',
                    completed_at: new Date(),
                    progress_payload: {
                        step: 0,
                        total: 0,
                        message: 'Job cancelled before execution',
                        status: 'error',
                    } as any,
                },
            });

            return {
                found: true as const,
                cancelled: true as const,
                mode: 'removed',
            };
        }

        await queueCancellationChannel.publishCancel(id);
        return {
            found: true as const,
            cancelled: true as const,
            mode: 'signal',
            state,
        };
    }
}

export const queueJobService = QueueJobService.getInstance();
