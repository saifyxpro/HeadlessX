import type IORedis from 'ioredis';
import { createQueueUnavailableError, createRedisConnection, isRedisConnectionError } from './redis';
import { queueConfig } from './queueConfig';

class QueueCancellationChannel {
    private readonly channelName = `${queueConfig.queueName}:cancel`;
    private publisher: IORedis | null = null;
    private subscriber: IORedis | null = null;
    private subscribed = false;

    private getPublisher() {
        if (!this.publisher) {
            this.publisher = createRedisConnection('headlessx-queue-cancel-publisher');
        }

        return this.publisher;
    }

    async publishCancel(jobId: string) {
        try {
            await this.getPublisher().publish(this.channelName, jobId);
        } catch (error) {
            if (isRedisConnectionError(error)) {
                throw createQueueUnavailableError();
            }

            throw error;
        }
    }

    async subscribe(handler: (jobId: string) => void) {
        if (this.subscribed) {
            return;
        }

        try {
            this.subscriber = createRedisConnection('headlessx-queue-cancel-subscriber');
            await this.subscriber.subscribe(this.channelName);
            this.subscriber.on('message', (channel, message) => {
                if (channel === this.channelName) {
                    handler(message);
                }
            });
            this.subscribed = true;
        } catch (error) {
            this.subscriber?.disconnect(false);
            this.subscriber = null;

            if (isRedisConnectionError(error)) {
                throw createQueueUnavailableError();
            }

            throw error;
        }
    }
}

export const queueCancellationChannel = new QueueCancellationChannel();
