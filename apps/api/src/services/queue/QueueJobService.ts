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
import { createRedisConnection } from './redis';

const PRISMA_TYPE_MAP: Record<QueueJobTypeName, QueueJobType> = {
    scrape: QueueJobType.SCRAPE,
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

function formatRedisTarget(redisUrl: string) {
    try {
        const parsed = new URL(redisUrl);
        const authPrefix = parsed.username || parsed.password ? '***@' : '';
        const database = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : '';
        return `${parsed.protocol}//${authPrefix}${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}${database}`;
    } catch {
        return 'configured';
    }
}

function isQueueStateRemovable(state: string) {
    return state === 'waiting' || state === 'delayed' || state === 'prioritized';
}

class QueueJobService {
    private static instance: QueueJobService;
    private readonly queue = new Queue<QueueJobEnvelope, unknown, QueueJobTypeName>(queueConfig.queueName, {
        connection: createRedisConnection('headlessx-queue-producer'),
    });

    public static getInstance() {
        if (!QueueJobService.instance) {
            QueueJobService.instance = new QueueJobService();
        }
        return QueueJobService.instance;
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
        const id = randomUUID();
        const attempts = input.options?.attempts ?? queueConfig.defaultJobAttempts;
        const queueType = PRISMA_TYPE_MAP[input.type];
        const target = 'url' in input.payload ? input.payload.url : null;

        await prisma.queueJob.create({
            data: {
                id,
                api_key_id: apiKeyId || undefined,
                type: queueType,
                status: QueueJobStatus.QUEUED,
                queue_name: queueConfig.queueName,
                target,
                request_payload: input.payload as any,
                max_attempts: attempts,
            },
        });

        try {
            await this.queue.add(
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
            throw error;
        }

        const job = await prisma.queueJob.findUniqueOrThrow({ where: { id } });
        return this.serializeJob(job);
    }

    public async listJobs(filters: ListQueueJobsInput) {
        const jobs = await prisma.queueJob.findMany({
            where: {
                type: filters.type ? PRISMA_TYPE_MAP[filters.type] : undefined,
                status: filters.status ? PRISMA_STATUS_MAP[filters.status] : undefined,
            },
            orderBy: { created_at: 'desc' },
            take: filters.limit,
        });

        return jobs.map((job) => this.serializeJob(job));
    }

    public async getJobById(id: string) {
        return prisma.queueJob.findUnique({ where: { id } });
    }

    public async getFirstActiveJob() {
        return prisma.queueJob.findFirst({
            where: {
                status: {
                    in: [QueueJobStatus.QUEUED, QueueJobStatus.ACTIVE],
                },
            },
            orderBy: { created_at: 'asc' },
        });
    }

    public async getQueueMetrics() {
        const counts = await this.queue.getJobCounts(
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
            counts,
        };
    }

    public async cancelJob(id: string) {
        const record = await prisma.queueJob.findUnique({ where: { id } });

        if (!record) {
            return { found: false as const };
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

        const bullJob = await this.queue.getJob(id);
        if (!bullJob) {
            await prisma.queueJob.update({
                where: { id },
                data: {
                    status: QueueJobStatus.CANCELLED,
                    error_message: 'Job cancelled before worker pickup',
                    completed_at: new Date(),
                },
            });

            return {
                found: true as const,
                cancelled: true as const,
                mode: 'db-only',
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
