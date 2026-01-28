import { Router } from 'express';
import { ScrapeController } from '../controllers/ScrapeController';
import { ApiKeyGuard } from '../middleware/ApiKeyGuard';
import { RequestLogger } from '../middleware/RequestLogger';

const router = Router();

// Middleware Stack
// 1. Log Request Result (Finish)
// 2. Guard API Key (Start)
router.use(RequestLogger);
router.use(ApiKeyGuard);

// Scrape Endpoints
router.post('/html', ScrapeController.getHtml);
router.post('/html-js', ScrapeController.getHtmlJs);
router.post('/content', ScrapeController.gptContent);
router.post('/screenshot', ScrapeController.screenshot);

// Config Endpoints
import { ConfigController } from '../controllers/ConfigController';
router.get('/config', ConfigController.getConfig);
router.patch('/config', ConfigController.updateConfig);

// Logs & Keys
import { RequestController } from '../controllers/RequestController';
router.get('/logs', RequestController.getLogs);
router.get('/api-keys', RequestController.getApiKeys);
router.post('/api-keys', RequestController.createApiKey);

export default router;
