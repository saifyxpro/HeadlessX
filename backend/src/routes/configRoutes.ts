import { Router } from 'express';
import { ConfigController } from '../controllers/ConfigController';
import { ApiKeyGuard } from '../middleware/ApiKeyGuard';
import { RequestLogger } from '../middleware/RequestLogger';

const router = Router();

// Middleware Stack
router.use(RequestLogger);
router.use(ApiKeyGuard);

/**
 * System Configuration Endpoints
 * Base: /api/config
 */

// GET /api/config - Get current configuration
router.get('/', ConfigController.getConfig);

// PATCH /api/config - Update configuration
router.patch('/', ConfigController.updateConfig);

export default router;
