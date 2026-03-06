import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { ApiKeyGuard } from '../middleware/ApiKeyGuard';
import { RequestLogger } from '../middleware/RequestLogger';

const router = Router();

router.use(RequestLogger);
router.use(ApiKeyGuard);

// Get dashboard stats
router.get('/stats', DashboardController.getStats);

export default router;
