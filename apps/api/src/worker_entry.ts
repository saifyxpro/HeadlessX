import './env';
import { assertSecurityConfiguration } from './utils/security';
import { queueWorkerService } from './services/queue/QueueWorker';

async function startWorker() {
    try {
        assertSecurityConfiguration();
        await queueWorkerService.start();
        console.log('👷 HeadlessX Queue Worker is running');
    } catch (error) {
        console.error('❌ Failed to start queue worker:', error);
        process.exit(1);
    }
}

startWorker();
