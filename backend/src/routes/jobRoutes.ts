import { Router } from 'express';
import { StreamingScrapeController } from '../controllers/StreamingScrapeController';

const router = Router();

// Get active job
router.get('/active', StreamingScrapeController.getActiveJob);

// Get job by ID
router.get('/:id', StreamingScrapeController.getJob);

// Reconnect to job's SSE stream
router.get('/:id/stream', StreamingScrapeController.reconnectToJob);

// Cancel a job
router.post('/:id/cancel', StreamingScrapeController.cancelJob);

export default router;
