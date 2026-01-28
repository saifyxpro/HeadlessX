import { Router } from 'express';
import { ScrapeControllerV2 } from '../controllers/ScrapeControllerV2';
import { ConfigController } from '../controllers/ConfigController';
import { ApiKeyGuard } from '../middleware/ApiKeyGuard';
import { RequestLogger } from '../middleware/RequestLogger';

const router = Router();

// Middleware Stack
router.use(RequestLogger);
router.use(ApiKeyGuard);

// Scrape Endpoints (V2 Spec)
router.post('/html', ScrapeControllerV2.getHtml);
router.post('/content', ScrapeControllerV2.getContent);
router.post('/screenshot', ScrapeControllerV2.getScreenshot);
router.post('/pdf', ScrapeControllerV2.getPdf);
router.post('/html-js', ScrapeControllerV2.getHtmlJs); // Full JS rendering with network idle

// Config Endpoints (Shared)
router.get('/config', ConfigController.getConfig);
router.patch('/config', ConfigController.updateConfig);

export default router;
