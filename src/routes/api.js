/**
 * API Routes
 * Defines all API endpoints and their handlers
 */

const express = require('express');
const router = express.Router();

// Import controllers
const SystemController = require('../controllers/system');
const RenderingController = require('../controllers/rendering');
const GetController = require('../controllers/get');
const BatchController = require('../controllers/batch');

// Import middleware
const { authenticate, authenticateText, addRequestId } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');

// Public endpoints (no authentication required)
router.get('/health', addRequestId, SystemController.getHealth);
router.get('/docs', addRequestId, GetController.getApiDocs);

// Protected endpoints (authentication required)
router.get('/status', authenticate, SystemController.getStatus);
router.get('/metrics', authenticate, SystemController.getMetrics);

// Main rendering endpoints
router.post('/render', authenticate, asyncHandler(RenderingController.renderPage));
router.post('/html', authenticateText, asyncHandler(RenderingController.renderHtml));
router.post('/content', authenticateText, asyncHandler(RenderingController.renderContent));

// GET endpoints for convenience
router.get('/html', authenticateText, asyncHandler(GetController.getHtml));
router.get('/content', authenticateText, asyncHandler(GetController.getContent));

// Screenshot and PDF endpoints
router.get('/screenshot', authenticateText, asyncHandler(RenderingController.renderScreenshot));
router.get('/pdf', authenticateText, asyncHandler(RenderingController.renderPdf));

// Batch processing
router.post('/batch', authenticate, asyncHandler(BatchController.processBatch));
router.get('/batch/:batchId', authenticate, asyncHandler(BatchController.getBatchStatus));

module.exports = router;