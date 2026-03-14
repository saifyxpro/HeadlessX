import { Worker, type Job as BullJob } from 'bullmq';
import { QueueJobStatus, type QueueJobType } from '@prisma/client';
import { prisma } from '../../database/client';
import { jobManager } from '../JobManager';
import { type StreamProgress, streamingScraperService } from '../scrape/StreamingScraperService';
import { websiteCrawlService } from '../scrape/WebsiteCrawlService';
import { queueCancellationChannel } from './cancellationChannel';
import { formatQueueCrawlResult, formatQueueExtractResult, formatQueueIndexResult, formatQueueScrapeResult } from './jobFormatter';
import type {
    CrawlJobPayload,
    ExtractJobPayload,
    IndexJobPayload,
    QueueJobEnvelope,
    QueueJobTypeName,
    ScrapeJobPayload,
} from './jobSchemas';
import { queueConfig } from './queueConfig';
import { createRedisConnection } from './redis';

class QueueWorkerService {
    private worker: Worker<QueueJobEnvelope, unknown, QueueJobTypeName> | null = null;

    public async start() {
        if (this.worker) {
            return;
        }

        await queueCancellationChannel.subscribe((jobId) => {
            jobManager.cancelJob(jobId);
        });

        this.worker = new Worker<QueueJobEnvelope, unknown, QueueJobTypeName>(
            queueConfig.queueName,
            async (job) => this.processJob(job),
            {
                connection: createRedisConnection('headlessx-queue-worker'),
                concurrency: queueConfig.workerConcurrency,
            }
        );

        this.worker.on('completed', (job) => {
            console.log(`✅ Queue job completed: ${job.id}`);
        });

        this.worker.on('failed', async (job, error) => {
            if (!job?.id) {
                return;
            }

            const finalAttempt = job.attemptsMade >= (job.opts.attempts ?? queueConfig.defaultJobAttempts);
            await prisma.queueJob.update({
                where: { id: job.id },
                data: {
                    status: finalAttempt ? QueueJobStatus.FAILED : QueueJobStatus.QUEUED,
                    attempts_made: job.attemptsMade,
                    error_message: error.message,
                    completed_at: finalAttempt ? new Date() : null,
                    progress_payload: {
                        step: 0,
                        total: 0,
                        message: finalAttempt
                            ? `Job failed: ${error.message}`
                            : `Retrying after error: ${error.message}`,
                        status: 'error',
                    } as any,
                },
            }).catch((updateError) => {
                console.error('Failed to update queue job failure state:', updateError);
            });
        });

        this.worker.on('error', (error) => {
            console.error('❌ Queue worker error:', error);
        });
    }

    private async processJob(job: BullJob<QueueJobEnvelope, unknown, QueueJobTypeName>) {
        const queueJobId = job.id!;
        const target = 'url' in job.data.payload ? job.data.payload.url : job.name;
        const managedType = this.getManagedType(job);

        jobManager.registerJob(queueJobId, target, managedType, {
            waitForSelector: (job.data.payload as any).waitForSelector,
            timeout: (job.data.payload as any).timeout,
            fullPage: (job.data.payload as any).fullPage,
        });
        jobManager.updateStatus(queueJobId, 'running');

        await prisma.queueJob.update({
            where: { id: queueJobId },
            data: {
                status: QueueJobStatus.ACTIVE,
                started_at: new Date(),
                attempts_made: job.attemptsMade + 1,
                error_message: null,
                progress_payload: {
                    step: 0,
                    total: 0,
                    message: 'Worker accepted job',
                    status: 'active',
                } as any,
            },
        });

        const queueRecord = await prisma.queueJob.findUnique({
            where: { id: queueJobId },
            select: { cancel_requested: true },
        });

        if (queueRecord?.cancel_requested) {
            jobManager.cancelJob(queueJobId);
        }

        try {
            let resultPayload: any;

            switch (job.data.type) {
                case 'scrape':
                    resultPayload = await this.runScrapeJob(queueJobId, job, job.data.payload as ScrapeJobPayload);
                    break;
                case 'crawl':
                    resultPayload = await this.runCrawlJob(queueJobId, job, job.data.payload as CrawlJobPayload);
                    break;
                case 'extract':
                    resultPayload = await this.runExtractJob(queueJobId, job, job.data.payload as ExtractJobPayload);
                    break;
                case 'index':
                    resultPayload = await this.runIndexJob(queueJobId, job, job.data.payload as IndexJobPayload);
                    break;
                default:
                    throw new Error(`Unsupported queue job type: ${job.data.type}`);
            }

            return resultPayload;
        } finally {
            jobManager.removeJob(queueJobId);
        }
    }

    private getManagedType(job: BullJob<QueueJobEnvelope, unknown, QueueJobTypeName>) {
        if (job.data.type === 'scrape') {
            return (job.data.payload as ScrapeJobPayload).outputType;
        }

        return job.data.type;
    }

    private async runScrapeJob(
        queueJobId: string,
        job: BullJob<QueueJobEnvelope, unknown, QueueJobTypeName>,
        payload: ScrapeJobPayload
    ) {
        const result = await streamingScraperService.scrapeWithProgress(
            payload.url,
            payload.outputType,
            {
                jobId: queueJobId,
                abortSignal: jobManager.getAbortSignal(queueJobId),
                waitForSelector: payload.waitForSelector,
                timeout: payload.timeout,
                stealth: payload.stealth,
                fullPage: payload.fullPage,
                jsEnabled: payload.outputType === 'html-js',
            },
            (progress) => this.persistProgress(queueJobId, job, progress)
        );

        const resultPayload = formatQueueScrapeResult(payload.outputType, result);
        if (result.cancelled || jobManager.isCancelled(queueJobId)) {
            await this.markCancelled(queueJobId, resultPayload);
            return resultPayload;
        }

        if (!result.success) {
            await this.persistExecutionError(queueJobId, job, result.error || 'Scrape job failed');
            throw new Error(result.error || 'Scrape job failed');
        }

        await this.markCompleted(queueJobId, resultPayload);
        return resultPayload;
    }

    private async runCrawlJob(
        queueJobId: string,
        job: BullJob<QueueJobEnvelope, unknown, QueueJobTypeName>,
        payload: CrawlJobPayload
    ) {
        const result = await websiteCrawlService.crawl(payload, {
            jobId: queueJobId,
            abortSignal: jobManager.getAbortSignal(queueJobId),
            onProgress: (progress) => this.persistProgress(queueJobId, job, progress),
        });

        const resultPayload = formatQueueCrawlResult(result);
        if (result.cancelled || jobManager.isCancelled(queueJobId)) {
            await this.markCancelled(queueJobId, resultPayload);
            return resultPayload;
        }

        if (!result.success) {
            await this.persistExecutionError(queueJobId, job, result.error || 'Crawl job failed');
            throw new Error(result.error || 'Crawl job failed');
        }

        await this.markCompleted(queueJobId, resultPayload);
        return resultPayload;
    }

    private async runExtractJob(
        queueJobId: string,
        job: BullJob<QueueJobEnvelope, unknown, QueueJobTypeName>,
        payload: ExtractJobPayload
    ) {
        const result = await streamingScraperService.scrapeWithProgress(
            payload.url,
            'content',
            {
                jobId: queueJobId,
                abortSignal: jobManager.getAbortSignal(queueJobId),
                waitForSelector: payload.waitForSelector,
                timeout: payload.timeout,
                stealth: payload.stealth,
            },
            (progress) => this.persistProgress(queueJobId, job, progress)
        );

        const resultPayload = formatQueueExtractResult(result);
        if (result.cancelled || jobManager.isCancelled(queueJobId)) {
            await this.markCancelled(queueJobId, resultPayload);
            return resultPayload;
        }

        if (!result.success) {
            await this.persistExecutionError(queueJobId, job, result.error || 'Extraction job failed');
            throw new Error(result.error || 'Extraction job failed');
        }

        await this.markCompleted(queueJobId, resultPayload);
        return resultPayload;
    }

    private async runIndexJob(
        queueJobId: string,
        job: BullJob<QueueJobEnvelope, unknown, QueueJobTypeName>,
        payload: IndexJobPayload
    ) {
        const result = await streamingScraperService.scrapeWithProgress(
            payload.url,
            'content',
            {
                jobId: queueJobId,
                abortSignal: jobManager.getAbortSignal(queueJobId),
                waitForSelector: payload.waitForSelector,
                timeout: payload.timeout,
                stealth: payload.stealth,
            },
            (progress) => this.persistProgress(queueJobId, job, progress)
        );

        const resultPayload = formatQueueIndexResult(queueJobId, payload, result);
        if (result.cancelled || jobManager.isCancelled(queueJobId)) {
            await this.markCancelled(queueJobId, resultPayload);
            return resultPayload;
        }

        if (!result.success) {
            await this.persistExecutionError(queueJobId, job, result.error || 'Indexing job failed');
            throw new Error(result.error || 'Indexing job failed');
        }

        await this.markCompleted(queueJobId, resultPayload);
        return resultPayload;
    }

    private async persistProgress(
        queueJobId: string,
        job: BullJob<QueueJobEnvelope, unknown, QueueJobTypeName>,
        progress: StreamProgress
    ) {
        await Promise.all([
            job.updateProgress(progress),
            prisma.queueJob.update({
                where: { id: queueJobId },
                data: {
                    status: QueueJobStatus.ACTIVE,
                    progress_payload: progress as any,
                    attempts_made: job.attemptsMade + 1,
                },
            }),
        ]);
    }

    private async persistExecutionError(
        queueJobId: string,
        job: BullJob<QueueJobEnvelope, unknown, QueueJobTypeName>,
        message: string
    ) {
        await prisma.queueJob.update({
            where: { id: queueJobId },
            data: {
                status: QueueJobStatus.ACTIVE,
                attempts_made: job.attemptsMade + 1,
                error_message: message,
                progress_payload: {
                    step: 0,
                    total: 0,
                    message,
                    status: 'error',
                } as any,
            },
        });
    }

    private async markCompleted(queueJobId: string, resultPayload: any) {
        await prisma.queueJob.update({
            where: { id: queueJobId },
            data: {
                status: QueueJobStatus.COMPLETED,
                result_payload: resultPayload as any,
                error_message: null,
                cancel_requested: false,
                completed_at: new Date(),
            },
        });
    }

    private async markCancelled(queueJobId: string, resultPayload: any) {
        await prisma.queueJob.update({
            where: { id: queueJobId },
            data: {
                status: QueueJobStatus.CANCELLED,
                result_payload: resultPayload as any,
                error_message: 'Job cancelled',
                cancel_requested: false,
                completed_at: new Date(),
            },
        });
    }
}

export const queueWorkerService = new QueueWorkerService();
