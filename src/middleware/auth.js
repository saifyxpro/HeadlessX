/**
 * Authentication Middleware
 * Token-based authentication for API endpoints
 */

const config = require('../config');
const { logger, generateRequestId } = require('../utils/logger');
const crypto = require('crypto');

// Secure token comparison to prevent timing attacks
function secureCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') {
        return false;
    }
    
    if (a.length !== b.length) {
        return false;
    }
    
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// Authentication middleware
function authenticate(req, res, next) {
    const requestId = generateRequestId();
    req.requestId = requestId;
    
    // Extract token from various sources
    const token = req.query.token || 
                  req.headers['x-token'] || 
                  req.headers['authorization']?.replace('Bearer ', '');
    
    if (!secureCompare(token || '', config.server.authToken || '')) {
        logger.warn(requestId, 'Authentication failed', { 
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path 
        });
        return res.status(401).json({ 
            error: 'Unauthorized: Invalid token',
            timestamp: new Date().toISOString()
        });
    }
    
    logger.info(requestId, 'Authentication successful', { 
        ip: req.ip,
        path: req.path,
        method: req.method 
    });
    
    next();
}

// Authentication middleware for text responses
function authenticateText(req, res, next) {
    const requestId = generateRequestId();
    req.requestId = requestId;
    
    const token = req.query.token || 
                  req.headers['x-token'] || 
                  req.headers['authorization']?.replace('Bearer ', '');
    
    if (!secureCompare(token || '', config.server.authToken || '')) {
        logger.warn(requestId, 'Authentication failed (text endpoint)', { 
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path 
        });
        return res.status(401).send('Unauthorized: Invalid token');
    }
    
    logger.info(requestId, 'Authentication successful (text endpoint)', { 
        ip: req.ip,
        path: req.path,
        method: req.method 
    });
    
    next();
}

// Request ID middleware (for endpoints that don't require auth)
function addRequestId(req, res, next) {
    if (!req.requestId) {
        req.requestId = generateRequestId();
    }
    next();
}

module.exports = {
    authenticate,
    authenticateText,
    addRequestId
};