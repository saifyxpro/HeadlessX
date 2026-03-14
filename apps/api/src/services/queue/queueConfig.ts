function parseInteger(value: string | undefined, fallback: number) {
    const parsed = Number.parseInt(value || '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const queueConfig = {
    redisUrl: process.env.REDIS_URL?.trim() || '',
    queueName: process.env.BULLMQ_QUEUE_NAME?.trim() || 'headlessx-jobs',
    workerConcurrency: parseInteger(
        process.env.QUEUE_WORKER_CONCURRENCY,
        parseInteger(process.env.MAX_CONCURRENCY, 2)
    ),
    defaultJobAttempts: parseInteger(process.env.QUEUE_JOB_ATTEMPTS, 3),
    jobBackoffMs: parseInteger(process.env.QUEUE_JOB_BACKOFF_MS, 5000),
    streamPollMs: parseInteger(process.env.QUEUE_STREAM_POLL_MS, 1000),
    connectionRetryMs: parseInteger(process.env.QUEUE_CONNECTION_RETRY_MS, 10000),
};
