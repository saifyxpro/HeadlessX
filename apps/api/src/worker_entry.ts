import './env';
import { assertSecurityConfiguration } from './utils/security';
import { queueWorkerService } from './services/queue/QueueWorker';

async function startWorker() {
    try {
        assertSecurityConfiguration();
        const state = await queueWorkerService.start();

        if (state === 'running') {
            console.log('👷 HeadlessX Queue Worker is running');
        } else {
            console.log('⏳ HeadlessX Queue Worker is waiting for Redis');
        }
    } catch (error) {
        console.error('❌ Failed to start queue worker:', error);
        process.exit(1);
    }
}

startWorker();
