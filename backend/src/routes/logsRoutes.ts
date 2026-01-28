import { Router } from 'express';
import { RequestController } from '../controllers/RequestController';
import { ApiKeyGuard } from '../middleware/ApiKeyGuard';
import { RequestLogger } from '../middleware/RequestLogger';

const router = Router();

// Middleware Stack
router.use(RequestLogger);
router.use(ApiKeyGuard);

/**
 * Request Logs Endpoints
 * Base: /api/logs
 */

// GET /api/logs/stats - Get aggregated stats
router.get('/stats', RequestController.getStats);

// GET /api/logs - Get paginated request logs
router.get('/', RequestController.getLogs);

export default router;
