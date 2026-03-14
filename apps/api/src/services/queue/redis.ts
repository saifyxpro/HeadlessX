import IORedis from 'ioredis';
import { queueConfig } from './queueConfig';

export function createRedisConnection(connectionName: string) {
    return new IORedis(queueConfig.redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        connectionName,
    });
}
