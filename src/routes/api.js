/**
 * Enhanced API Routes v1.3.0
 * Defines all API endpoints including new anti-detection and fingerprint testing features
 */

const express = require('express');
const router = express.Router();

// Import controllers
const SystemController = require('../controllers/system');
const RenderingController = require('../controllers/rendering');
const GetController = require('../controllers/get');
const BatchController = require('../controllers/batch');
const ProfilesController = require('../controllers/profiles');
const DetectionTestController = require('../controllers/detection-test');

// Import middleware
const { authenticate, authenticateText, addRequestId } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');

// Public endpoints (no authentication required)
router.get('/health', addRequestId, SystemController.getHealth);
router.get('/docs', addRequestId, GetController.getApiDocs);

// Protected endpoints (authentication required)
router.get('/status', authenticate, SystemController.getStatus);
router.get('/metrics', authenticate, SystemController.getMetrics);

// v1.3.0 New anti-detection endpoints
router.post('/test-fingerprint', authenticate, asyncHandler(SystemController.testFingerprint));
router.get('/profiles', authenticate, asyncHandler(ProfilesController.getProfiles));
router.post('/profiles/validate', authenticate, asyncHandler(ProfilesController.validateProfile));
router.post('/profiles/generate-fingerprint', authenticate, asyncHandler(ProfilesController.generateFingerprint));
router.get('/stealth/status', authenticate, ProfilesController.getStealthStatus);

// v1.3.0 Detection testing endpoints
const detectionTestController = new DetectionTestController();
router.post('/detection/test', authenticate, asyncHandler(async (req, res) => {
    return await detectionTestController.runDetectionTest(req, res);
}));
router.get('/detection/suites', authenticate, asyncHandler(async (req, res) => {
    return await detectionTestController.getTestSuites(req, res);
}));
router.get('/detection/status', authenticate, asyncHandler(async (req, res) => {
    return await detectionTestController.getDetectionStatus(req, res);
}));

// Main rendering endpoints (enhanced with v1.3.0 features)
router.post('/render', authenticate, asyncHandler(RenderingController.renderPage));
router.post('/render/stealth', authenticate, asyncHandler(RenderingController.renderPage)); // Alias for maximum stealth
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
