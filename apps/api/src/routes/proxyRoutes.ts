import { Router } from 'express';
import * as ProxyController from '../controllers/ProxyController';
import { ApiKeyGuard } from '../middleware/ApiKeyGuard';
import { RequestLogger } from '../middleware/RequestLogger';

const router = Router();

router.use(RequestLogger);
router.use(ApiKeyGuard);

// GET /api/proxies - List all proxies
router.get('/', ProxyController.list);

// GET /api/proxies/active - List active proxies only (for dropdowns)
router.get('/active', ProxyController.listActive);

// GET /api/proxies/:id - Get a single proxy
router.get('/:id', ProxyController.get);

// POST /api/proxies - Create a new proxy
router.post('/', ProxyController.create);

// PATCH /api/proxies/:id - Update a proxy
router.patch('/:id', ProxyController.update);

// DELETE /api/proxies/:id - Delete a proxy
router.delete('/:id', ProxyController.remove);

// POST /api/proxies/:id/toggle - Toggle active status
router.post('/:id/toggle', ProxyController.toggleActive);

// POST /api/proxies/:id/test - Test proxy connection
router.post('/:id/test', ProxyController.testConnection);

export default router;
