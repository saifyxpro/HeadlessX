import { Router } from 'express';
import { QueueJobController } from '../../controllers/jobs/QueueJobController';
import { StreamingScrapeController } from '../../controllers/scrape/StreamingScrapeController';
import { ApiKeyGuard } from '../../middleware/ApiKeyGuard';
import { RequestLogger } from '../../middleware/RequestLogger';

const router = Router();

router.use(RequestLogger);
router.use(ApiKeyGuard);

// Queue-backed async jobs
router.get('/', QueueJobController.listJobs);
router.get('/metrics', QueueJobController.getMetrics);
router.post('/', QueueJobController.createJob);
router.post('/scrape', QueueJobController.enqueueScrapeJob);
router.post('/extract', QueueJobController.enqueueExtractJob);
router.post('/index', QueueJobController.enqueueIndexJob);

// Get active job
router.get('/active', StreamingScrapeController.getActiveJob);

// Get job by ID
router.get('/:id', StreamingScrapeController.getJob);

// Reconnect to job's SSE stream
router.get('/:id/stream', StreamingScrapeController.reconnectToJob);

// Cancel a job
router.post('/:id/cancel', StreamingScrapeController.cancelJob);

export default router;
