import { Router, Request, Response } from 'express';
import { ApiKeyGuard } from '../../middleware/ApiKeyGuard';
import { RequestLogger } from '../../middleware/RequestLogger';
import { GoogleSerpController } from '../../controllers/scrape/GoogleSerpController';

const router = Router();

// Middleware Stack
router.use(RequestLogger);
router.use(ApiKeyGuard);

/**
 * Google AI Search operator endpoints
 * Base: /api/operators/google/ai-search
 */

router.post('/search', GoogleSerpController.search);
router.get('/stream', GoogleSerpController.searchStream);
router.get('/status', GoogleSerpController.getStatus);


export default router;
