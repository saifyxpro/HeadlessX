import { Router } from 'express';
import { ScrapeControllerV2 } from '../controllers/ScrapeControllerV2';
import { StreamingScrapeController } from '../controllers/StreamingScrapeController';
import { ApiKeyGuard } from '../middleware/ApiKeyGuard';
import { RequestLogger } from '../middleware/RequestLogger';

const router = Router();

// Middleware Stack
router.use(RequestLogger);
router.use(ApiKeyGuard);

/**
 * Website Scraping Endpoints
 * Base: /api/website
 */

// POST /api/website/stream - SSE Streaming scrape with real-time progress
router.post('/stream', StreamingScrapeController.streamScrape);

// POST /api/website/html - Basic HTML scrape (fast, no JS)
router.post('/html', ScrapeControllerV2.getHtml);
router.post('/html', ScrapeControllerV2.getHtml);

// POST /api/website/html-js - HTML with JavaScript rendering
router.post('/html-js', ScrapeControllerV2.getHtmlJs);

// POST /api/website/content - Markdown content extraction
router.post('/content', ScrapeControllerV2.getContent);

// POST /api/website/screenshot - Full page screenshot (JPEG)
router.post('/screenshot', ScrapeControllerV2.getScreenshot);

// POST /api/website/pdf - PDF export
router.post('/pdf', ScrapeControllerV2.getPdf);

export default router;
