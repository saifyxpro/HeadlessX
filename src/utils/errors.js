/**
 * Error Categories and Custom Error Classes
 * Centralized error handling for HeadlessX
 */

// Error categories for classification
const ERROR_CATEGORIES = {
    NETWORK: 'network', // Network connectivity issues
    TIMEOUT: 'timeout', // Operation timeouts
    VALIDATION: 'validation', // Input validation failures
    RESOURCE: 'resource', // Resource exhaustion (memory, browser contexts)
    BROWSER: 'browser', // Browser/page issues
    SCRIPT: 'script', // JavaScript execution errors
    AUTHENTICATION: 'auth', // Authentication failures
    RATE_LIMIT: 'rate_limit' // Rate limiting errors
};

// Error categorization system for proper handling
class HeadlessXError extends Error {
    constructor(message, category = 'unknown', isRecoverable = false, originalError = null) {
        super(message);
        this.name = 'HeadlessXError';
        this.category = category; // 'network', 'timeout', 'validation', 'resource', 'browser', 'script'
        this.isRecoverable = isRecoverable;
        this.originalError = originalError;
        this.timestamp = new Date().toISOString();
    }
}

// Enhanced error handler for proper categorization and response
function handleError(error, requestId, context = '') {
    let categorizedError;

    if (error instanceof HeadlessXError) {
        categorizedError = error;
    } else {
        // Categorize common errors
        let category = ERROR_CATEGORIES.BROWSER;
        let isRecoverable = false;

        if (error.message.includes('timeout') || error.name === 'TimeoutError') {
            category = ERROR_CATEGORIES.TIMEOUT;
            isRecoverable = true;
        } else if (error.message.includes('net::') || error.message.includes('NetworkError')) {
            category = ERROR_CATEGORIES.NETWORK;
            isRecoverable = true;
        } else if (error.message.includes('Script') || error.message.includes('evaluate')) {
            category = ERROR_CATEGORIES.SCRIPT;
            isRecoverable = false;
        } else if (error.message.includes('Memory') || error.message.includes('context')) {
            category = ERROR_CATEGORIES.RESOURCE;
            isRecoverable = true;
        }

        categorizedError = new HeadlessXError(
            error.message,
            category,
            isRecoverable,
            error
        );
    }

    // Import logger here to avoid circular dependency
    const { logger } = require('./logger');
    logger.error(requestId, `${context}: ${categorizedError.message}`, categorizedError);

    return categorizedError;
}

// Create error response for API endpoints
function createErrorResponse(error, url = null) {
    let statusCode = 500;
    let errorResponse = {
        error: 'Operation failed',
        details: error.message,
        timestamp: new Date().toISOString()
    };

    // Check if this is a HeadlessXError with specific information
    if (error.category) {
        errorResponse = {
            ...errorResponse,
            errorType: error.category,
            isRecoverable: error.isRecoverable,
            url
        };

        // Set appropriate status codes
        switch (error.category) {
        case ERROR_CATEGORIES.NETWORK:
            statusCode = 502; // Bad Gateway
            errorResponse.suggestion = 'Check if the URL is accessible and your internet connection is stable.';
            break;
        case ERROR_CATEGORIES.TIMEOUT:
            statusCode = 408; // Request Timeout
            errorResponse.suggestion = 'Site is taking too long to load. Try increasing timeout or using returnPartialOnTimeout=true.';
            break;
        case ERROR_CATEGORIES.VALIDATION:
            statusCode = 400; // Bad Request
            errorResponse.suggestion = 'Check your request parameters and try again.';
            break;
        case ERROR_CATEGORIES.AUTHENTICATION:
            statusCode = 401; // Unauthorized
            errorResponse.suggestion = 'Provide a valid authentication token.';
            break;
        case ERROR_CATEGORIES.RATE_LIMIT:
            statusCode = 429; // Too Many Requests
            errorResponse.suggestion = 'You are making too many requests. Please wait and try again.';
            break;
        case ERROR_CATEGORIES.RESOURCE:
            statusCode = 503; // Service Unavailable
            errorResponse.suggestion = 'Server resources are temporarily unavailable. Please try again later.';
            break;
        default:
            if (error.message.includes('blocked') || error.message.includes('denied')) {
                statusCode = 403; // Forbidden
                errorResponse.errorType = 'anti-bot-protection';
                errorResponse.suggestion = 'This site has sophisticated anti-bot protection. Try using different URLs, adding delays, or using proxies.';
            }
        }
    }

    return { statusCode, errorResponse };
}

module.exports = {
    ERROR_CATEGORIES,
    HeadlessXError,
    handleError,
    createErrorResponse
};
