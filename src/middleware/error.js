/**
 * Error Handling Middleware
 * Global error handling and response formatting
 */

const { logger } = require('../utils/logger');
const { createErrorResponse } = require('../utils/errors');

// Global error handler middleware
function errorHandler(err, req, res, next) {
    const requestId = req.requestId || 'unknown';

    logger.error(requestId, 'Unhandled error occurred', err, {
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query
    });

    // Create standardized error response
    const { statusCode, errorResponse } = createErrorResponse(err, req.body?.url || req.query?.url);

    res.status(statusCode).json(errorResponse);
}

// Async error wrapper for route handlers
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

// 404 handler for API routes
function notFoundHandler(req, res) {
    res.status(404).json({
        error: 'API endpoint not found',
        requestedPath: req.path,
        requestedMethod: req.method,
        availableEndpoints: [
            'GET /api/health - Server health check (no auth required)',
            'GET /api/status - Detailed server status (auth required)',
            'POST /api/render - Full page rendering with JSON response (auth required)',
            'POST /api/html - Raw HTML extraction (auth required)',
            'GET /api/html - Raw HTML extraction (GET) (auth required)',
            'POST /api/content - Clean text extraction (auth required)',
            'GET /api/content - Clean text extraction (GET) (auth required)',
            'GET /api/screenshot - Screenshot generation (auth required)',
            'GET /api/pdf - PDF generation (auth required)',
            'POST /api/batch - Batch URL processing (auth required)'
        ],
        message: 'Use one of the available endpoints above',
        timestamp: new Date().toISOString()
    });
}

module.exports = {
    errorHandler,
    asyncHandler,
    notFoundHandler
};
