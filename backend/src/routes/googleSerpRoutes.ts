import { Router, Request, Response } from 'express';
import { ApiKeyGuard } from '../middleware/ApiKeyGuard';
import { RequestLogger } from '../middleware/RequestLogger';
import { GoogleSerpController } from '../controllers/GoogleSerpController';

const router = Router();

// Middleware Stack
router.use(RequestLogger);
router.use(ApiKeyGuard);

/**
 * Google SERP Scraping Endpoints
 * Base: /api/google-serp
 */


router.post('/search', GoogleSerpController.search);
router.get('/stream', GoogleSerpController.searchStream);
router.get('/status', GoogleSerpController.getStatus);


export default router;
