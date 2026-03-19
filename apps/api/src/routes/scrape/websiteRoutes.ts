import { Router } from 'express';
import { ScrapeControllerV2 } from '../../controllers/scrape/ScrapeControllerV2';
import { StreamingScrapeController } from '../../controllers/scrape/StreamingScrapeController';
import { WebsiteWorkflowController } from '../../controllers/scrape/WebsiteWorkflowController';
import { ApiKeyGuard } from '../../middleware/ApiKeyGuard';
import { RequestLogger } from '../../middleware/RequestLogger';

const router = Router();

// Middleware Stack
router.use(RequestLogger);
router.use(ApiKeyGuard);

/**
 * Website operator endpoints
 * Base: /api/operators/website
 */

// POST /api/operators/website/scrape/stream - SSE streaming scrape with real-time progress
router.post('/scrape/stream', StreamingScrapeController.streamScrape);

// POST /api/operators/website/map - Fast website link discovery
router.post('/map', WebsiteWorkflowController.map);

// POST /api/operators/website/map/stream - SSE website link discovery
router.post('/map/stream', WebsiteWorkflowController.streamMap);

// POST /api/operators/website/crawl - Queue-backed website crawl
router.post('/crawl', WebsiteWorkflowController.crawl);

// POST /api/operators/website/scrape/html - Basic HTML scrape (fast, no JS)
router.post('/scrape/html', ScrapeControllerV2.getHtml);

// POST /api/operators/website/scrape/html-js - HTML with JavaScript rendering
router.post('/scrape/html-js', ScrapeControllerV2.getHtmlJs);

// POST /api/operators/website/scrape/content - Markdown content extraction
router.post('/scrape/content', ScrapeControllerV2.getContent);

// POST /api/operators/website/scrape/screenshot - Full page screenshot (JPEG)
router.post('/scrape/screenshot', ScrapeControllerV2.getScreenshot);

export default router;
