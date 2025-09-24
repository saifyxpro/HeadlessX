/**
 * Structured Logging System
 * Enhanced logging with error categorization and request correlation
 */

const config = require('../config');

// Enhanced logging system with error categorization
function createStructuredLogger() {
    return {
        info: (requestId, message, data = {}) => {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] [${requestId}] [INFO] ${message}`,
                Object.keys(data).length > 0 ? JSON.stringify(data) : '');
        },
        warn: (requestId, message, data = {}) => {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] [${requestId}] [WARN] ${message}`,
                Object.keys(data).length > 0 ? JSON.stringify(data) : '');
        },
        error: (requestId, message, error = null, data = {}) => {
            const timestamp = new Date().toISOString();
            const errorInfo = error
                ? {
                    message: error.message,
                    category: error.category || 'unknown',
                    isRecoverable: error.isRecoverable || false,
                    stack: error.stack
                }
                : {};
            console.error(`[${timestamp}] [${requestId}] [ERROR] ${message}`,
                JSON.stringify({ ...errorInfo, ...data }));
        },
        debug: (requestId, message, data = {}) => {
            if (config.logging.debug) {
                const timestamp = new Date().toISOString();
                console.log(`[${timestamp}] [${requestId}] [DEBUG] ${message}`,
                    Object.keys(data).length > 0 ? JSON.stringify(data) : '');
            }
        }
    };
}

// Generate unique request ID for correlation
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Simplified logging function for legacy compatibility
function logWithId(requestId, level, message, data = {}) {
    const logger = createStructuredLogger();
    if (logger[level]) {
        logger[level](requestId, message, data);
    } else {
        logger.info(requestId, `[${level.toUpperCase()}] ${message}`, data);
    }
}

const logger = createStructuredLogger();

module.exports = {
    logger,
    generateRequestId,
    logWithId,
    createStructuredLogger
};
