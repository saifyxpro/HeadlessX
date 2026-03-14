import IORedis from 'ioredis';
import { queueConfig } from './queueConfig';

const seenRedisErrors = new Set<string>();

export function formatRedisTarget(redisUrl: string) {
    if (!redisUrl) {
        return 'not configured';
    }

    try {
        const parsed = new URL(redisUrl);
        const authPrefix = parsed.username || parsed.password ? '***@' : '';
        const database = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : '';
        return `${parsed.protocol}//${authPrefix}${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}${database}`;
    } catch {
        return 'configured';
    }
}

export function isRedisConnectionError(error: unknown) {
    if (!(error instanceof Error)) {
        return false;
    }

    return 'code' in error && (
        (error as NodeJS.ErrnoException).code === 'ECONNREFUSED' ||
        (error as NodeJS.ErrnoException).code === 'ENOTFOUND' ||
        (error as NodeJS.ErrnoException).code === 'ECONNRESET' ||
        (error as NodeJS.ErrnoException).code === 'EHOSTUNREACH'
    );
}

function logRedisError(connectionName: string, error: Error) {
    const message = `${connectionName}:${(error as NodeJS.ErrnoException).code || error.message}`;
    if (seenRedisErrors.has(message)) {
        return;
    }

    seenRedisErrors.add(message);
    console.warn(
        `⚠️ Redis unavailable for ${connectionName} at ${formatRedisTarget(queueConfig.redisUrl)}: ${error.message}`
    );
}

export function createQueueUnavailableError() {
    return new Error(
        queueConfig.redisUrl
            ? `Redis is unavailable at ${formatRedisTarget(queueConfig.redisUrl)}. Start Redis or update REDIS_URL to enable async jobs.`
            : 'REDIS_URL is not configured. Set REDIS_URL in your environment to enable async jobs.'
    );
}

export function isQueueUnavailableError(error: unknown) {
    return error instanceof Error && error.message === createQueueUnavailableError().message;
}

export async function probeRedisConnection(connectionName: string) {
    const client = createRedisConnection(connectionName, { lazyConnect: true });

    try {
        await client.connect();
        await client.ping();
        return true;
    } catch (error) {
        if (error instanceof Error) {
            logRedisError(connectionName, error);
        }
        return false;
    } finally {
        client.disconnect(false);
    }
}

export function createRedisConnection(
    connectionName: string,
    options?: { lazyConnect?: boolean }
) {
    if (!queueConfig.redisUrl) {
        throw createQueueUnavailableError();
    }

    const client = new IORedis(queueConfig.redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: options?.lazyConnect ?? true,
        connectionName,
    });

    client.on('error', (error) => {
        logRedisError(connectionName, error);
    });

    return client;
}
