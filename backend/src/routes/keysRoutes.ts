import { Router } from 'express';
import { RequestController } from '../controllers/RequestController';
import { ApiKeyGuard } from '../middleware/ApiKeyGuard';
import { RequestLogger } from '../middleware/RequestLogger';

const router = Router();

// Middleware Stack
router.use(RequestLogger);
router.use(ApiKeyGuard);

/**
 * API Keys Management Endpoints
 * Base: /api/keys
 */

// GET /api/keys - List all API keys
router.get('/', RequestController.getApiKeys);

// POST /api/keys - Create new API key
router.post('/', RequestController.createApiKey);

// PATCH /api/keys/:id/revoke - Revoke API key
router.patch('/:id/revoke', RequestController.revokeApiKey);

// DELETE /api/keys/:id - Delete API key
router.delete('/:id', RequestController.deleteApiKey);

export default router;
