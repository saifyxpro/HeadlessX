import type IORedis from 'ioredis';
import { createRedisConnection } from './redis';
import { queueConfig } from './queueConfig';

class QueueCancellationChannel {
    private readonly channelName = `${queueConfig.queueName}:cancel`;
    private readonly publisher = createRedisConnection('headlessx-queue-cancel-publisher');
    private subscriber: IORedis | null = null;
    private subscribed = false;

    async publishCancel(jobId: string) {
        await this.publisher.publish(this.channelName, jobId);
    }

    async subscribe(handler: (jobId: string) => void) {
        if (this.subscribed) {
            return;
        }

        this.subscriber = createRedisConnection('headlessx-queue-cancel-subscriber');
        await this.subscriber.subscribe(this.channelName);
        this.subscriber.on('message', (channel, message) => {
            if (channel === this.channelName) {
                handler(message);
            }
        });
        this.subscribed = true;
    }
}

export const queueCancellationChannel = new QueueCancellationChannel();
