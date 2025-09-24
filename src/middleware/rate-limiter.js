/**
 * Enhanced Rate Limiter Middleware
 * Advanced rate limiting with intelligent request analysis
 * HeadlessX v1.3.0 - Enhanced Anti-Detection
 */

const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { logger } = require('../utils/logger');
const { HeadlessXError, ERROR_CATEGORIES } = require('../utils/errors');

class EnhancedRateLimiter {
    constructor() {
        this.requestHistory = new Map();
        this.suspiciousIPs = new Set();
        this.whitelistedIPs = new Set();
        this.logger = logger;
        
        // Initialize rate limiting configurations
        this.configs = this.initializeConfigs();
    }

    /**
     * Initialize rate limiting configurations
     */
    initializeConfigs() {
        return {
            // Basic API rate limiting
            api: {
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 100, // requests per window
                standardHeaders: true,
                legacyHeaders: false,
                message: {
                    error: 'Too many requests from this IP',
                    retryAfter: '15 minutes'
                }
            },
            
            // Strict rate limiting for resource-intensive endpoints
            strict: {
                windowMs: 5 * 60 * 1000, // 5 minutes
                max: 10, // requests per window
                standardHeaders: true,
                legacyHeaders: false,
                message: {
                    error: 'Rate limit exceeded for resource-intensive requests',
                    retryAfter: '5 minutes'
                }
            },
            
            // Burst protection
            burst: {
                windowMs: 60 * 1000, // 1 minute
                max: 20, // requests per minute
                standardHeaders: true,
                legacyHeaders: false,
                message: {
                    error: 'Too many requests in a short period',
                    retryAfter: '1 minute'
                }
            },
            
            // Batch processing rate limiting
            batch: {
                windowMs: 10 * 60 * 1000, // 10 minutes
                max: 5, // batch requests per window
                standardHeaders: true,
                legacyHeaders: false,
                message: {
                    error: 'Batch processing rate limit exceeded',
                    retryAfter: '10 minutes'
                }
            },
            
            // IP-based progressive slowdown
            slowdown: {
                windowMs: 15 * 60 * 1000, // 15 minutes
                delayAfter: 50, // allow 50 requests per windowMs without delay
                delayMs: 100, // add 100ms delay per request after delayAfter
                maxDelayMs: 5000, // maximum delay of 5 seconds
                skipFailedRequests: true,
                skipSuccessfulRequests: false
            }
        };
    }

    /**
     * Create intelligent rate limiter with adaptive behavior
     */
    createIntelligentLimiter(type = 'api') {
        const config = this.configs[type];
        
        return rateLimit({
            ...config,
            
            // Custom key generator with IP and user agent consideration
            keyGenerator: (req) => {
                const ip = this.getClientIP(req);
                const userAgent = req.get('User-Agent') || 'unknown';
                const userAgentHash = this.hashString(userAgent).substring(0, 8);
                
                return `${ip}_${userAgentHash}`;
            },
            
            // Custom skip function for whitelisted IPs and legitimate requests
            skip: (req) => {
                const ip = this.getClientIP(req);
                
                // Skip rate limiting for whitelisted IPs
                if (this.whitelistedIPs.has(ip)) {
                    return true;
                }
                
                // Skip for health check requests
                if (req.path === '/api/health') {
                    return true;
                }
                
                // Skip for requests with valid authorization
                if (this.isAuthorizedRequest(req)) {
                    return true;
                }
                
                return false;
            },
            
            // Enhanced request handler with logging
            handler: (req, res) => {
                const ip = this.getClientIP(req);
                const userAgent = req.get('User-Agent');
                
                // Log rate limit violation
                this.logger.warn('Rate limit exceeded', {
                    ip,
                    userAgent,
                    path: req.path,
                    method: req.method,
                    type
                });
                
                // Track suspicious activity
                this.trackSuspiciousActivity(ip, req);
                
                // Send structured error response
                const error = new HeadlessXError(
                    `Rate limit exceeded: ${config.message.error}`,
                    429,
                    ERROR_CATEGORIES.RATE_LIMIT,
                    {
                        retryAfter: config.message.retryAfter,
                        limit: config.max,
                        windowMs: config.windowMs,
                        type
                    }
                );
                
                res.status(429).json({
                    error: error.message,
                    code: error.code,
                    category: error.category,
                    retryAfter: config.message.retryAfter,
                    timestamp: new Date().toISOString()
                });
            },
            
            // On limit reached callback for monitoring
            onLimitReached: (req) => {
                const ip = this.getClientIP(req);
                this.logger.info('Rate limit threshold reached', {
                    ip,
                    path: req.path,
                    type,
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    /**
     * Create progressive slowdown middleware
     */
    createProgressiveSlowdown() {
        return slowDown({
            ...this.configs.slowdown,
            
            keyGenerator: (req) => {
                const ip = this.getClientIP(req);
                return ip;
            },
            
            skip: (req) => {
                const ip = this.getClientIP(req);
                return this.whitelistedIPs.has(ip) || this.isAuthorizedRequest(req);
            },
            
            onLimitReached: (req) => {
                const ip = this.getClientIP(req);
                this.logger.info('Progressive slowdown activated', {
                    ip,
                    path: req.path,
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    /**
     * Adaptive rate limiting based on request patterns
     */
    createAdaptiveLimiter() {
        return (req, res, next) => {
            const ip = this.getClientIP(req);
            const requestPattern = this.analyzeRequestPattern(req, ip);
            
            // Apply different limits based on pattern analysis
            let limiterType = 'api';
            
            if (requestPattern.isSuspicious) {
                limiterType = 'strict';
                this.trackSuspiciousActivity(ip, req);
            } else if (requestPattern.isBatchRequest) {
                limiterType = 'batch';
            } else if (requestPattern.isBurstTraffic) {
                limiterType = 'burst';
            }
            
            // Apply the appropriate limiter
            const limiter = this.createIntelligentLimiter(limiterType);
            limiter(req, res, next);
        };
    }

    /**
     * Analyze request patterns for intelligent limiting
     */
    analyzeRequestPattern(req, ip) {
        const now = Date.now();
        const userAgent = req.get('User-Agent') || '';
        const path = req.path;
        const method = req.method;
        
        // Get or create request history for this IP
        if (!this.requestHistory.has(ip)) {
            this.requestHistory.set(ip, []);
        }
        
        const history = this.requestHistory.get(ip);
        
        // Clean old entries (older than 1 hour)
        const oneHourAgo = now - (60 * 60 * 1000);
        const recentHistory = history.filter(entry => entry.timestamp > oneHourAgo);
        
        // Add current request
        recentHistory.push({
            timestamp: now,
            path,
            method,
            userAgent
        });
        
        // Update history
        this.requestHistory.set(ip, recentHistory);
        
        // Analyze patterns
        const analysis = {
            isSuspicious: this.detectSuspiciousPattern(recentHistory, userAgent),
            isBatchRequest: path.includes('/batch'),
            isBurstTraffic: this.detectBurstTraffic(recentHistory),
            requestFrequency: this.calculateRequestFrequency(recentHistory),
            pathDiversity: this.calculatePathDiversity(recentHistory),
            userAgentConsistency: this.checkUserAgentConsistency(recentHistory)
        };
        
        return analysis;
    }

    /**
     * Detect suspicious request patterns
     */
    detectSuspiciousPattern(history, userAgent) {
        // Check for bot-like user agents
        const botPatterns = [
            'bot', 'crawler', 'spider', 'scraper',
            'python', 'curl', 'wget', 'postman',
            'automation', 'selenium', 'headless'
        ];
        
        const isBotUA = botPatterns.some(pattern => 
            userAgent.toLowerCase().includes(pattern)
        );
        
        // Check for rapid sequential requests
        const recentRequests = history.slice(-10);
        if (recentRequests.length >= 10) {
            const timeSpan = recentRequests[recentRequests.length - 1].timestamp - recentRequests[0].timestamp;
            const isRapidFire = timeSpan < 30000; // 10 requests in 30 seconds
            
            if (isRapidFire) return true;
        }
        
        // Check for identical path patterns
        const pathCounts = {};
        history.forEach(entry => {
            pathCounts[entry.path] = (pathCounts[entry.path] || 0) + 1;
        });
        
        const hasRepeatedPaths = Object.values(pathCounts).some(count => count > 20);
        
        return isBotUA || hasRepeatedPaths;
    }

    /**
     * Detect burst traffic patterns
     */
    detectBurstTraffic(history) {
        if (history.length < 5) return false;
        
        const lastMinute = Date.now() - (60 * 1000);
        const recentRequests = history.filter(entry => entry.timestamp > lastMinute);
        
        return recentRequests.length > 15; // More than 15 requests per minute
    }

    /**
     * Calculate request frequency
     */
    calculateRequestFrequency(history) {
        if (history.length < 2) return 0;
        
        const timeSpan = history[history.length - 1].timestamp - history[0].timestamp;
        return history.length / (timeSpan / 1000); // requests per second
    }

    /**
     * Calculate path diversity
     */
    calculatePathDiversity(history) {
        const uniquePaths = new Set(history.map(entry => entry.path));
        return uniquePaths.size / history.length;
    }

    /**
     * Check user agent consistency
     */
    checkUserAgentConsistency(history) {
        const userAgents = new Set(history.map(entry => entry.userAgent));
        return userAgents.size === 1; // True if consistent
    }

    /**
     * Track suspicious activity
     */
    trackSuspiciousActivity(ip, req) {
        this.suspiciousIPs.add(ip);
        
        this.logger.warn('Suspicious activity detected', {
            ip,
            userAgent: req.get('User-Agent'),
            path: req.path,
            method: req.method,
            timestamp: new Date().toISOString()
        });
        
        // Auto-cleanup suspicious IPs after 1 hour
        setTimeout(() => {
            this.suspiciousIPs.delete(ip);
        }, 60 * 60 * 1000);
    }

    /**
     * Get client IP address with proxy support
     */
    getClientIP(req) {
        return req.ip ||
               req.connection.remoteAddress ||
               req.socket.remoteAddress ||
               (req.connection.socket && req.connection.socket.remoteAddress) ||
               req.headers['x-forwarded-for']?.split(',')[0] ||
               req.headers['x-real-ip'] ||
               'unknown';
    }

    /**
     * Check if request is from authorized source
     */
    isAuthorizedRequest(req) {
        const authToken = req.headers.authorization || req.query.token;
        return authToken && this.validateAuthToken(authToken);
    }

    /**
     * Validate authorization token (simplified)
     */
    validateAuthToken(token) {
        // Remove 'Bearer ' prefix if present
        const cleanToken = token.replace(/^Bearer\s+/, '');
        
        // Check against configured auth tokens
        const validTokens = [
            process.env.AUTH_TOKEN,
            process.env.API_KEY,
            process.env.ACCESS_TOKEN
        ].filter(Boolean);
        
        return validTokens.includes(cleanToken);
    }

    /**
     * Hash string for consistent identification
     */
    hashString(str) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(str).digest('hex');
    }

    /**
     * Add IP to whitelist
     */
    addToWhitelist(ip) {
        this.whitelistedIPs.add(ip);
        this.logger.info(`IP added to whitelist: ${ip}`);
    }

    /**
     * Remove IP from whitelist
     */
    removeFromWhitelist(ip) {
        this.whitelistedIPs.delete(ip);
        this.logger.info(`IP removed from whitelist: ${ip}`);
    }

    /**
     * Get rate limiting statistics
     */
    getStatistics() {
        return {
            suspiciousIPs: this.suspiciousIPs.size,
            whitelistedIPs: this.whitelistedIPs.size,
            trackedIPs: this.requestHistory.size,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Clean up old request history
     */
    cleanupHistory() {
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);
        
        for (const [ip, history] of this.requestHistory.entries()) {
            const recentHistory = history.filter(entry => entry.timestamp > oneHourAgo);
            
            if (recentHistory.length === 0) {
                this.requestHistory.delete(ip);
            } else {
                this.requestHistory.set(ip, recentHistory);
            }
        }
        
        this.logger.debug('Request history cleanup completed');
    }

    /**
     * Start periodic cleanup
     */
    startCleanupSchedule() {
        setInterval(() => {
            this.cleanupHistory();
        }, 15 * 60 * 1000); // Clean every 15 minutes
    }
}

// Create singleton instance
const rateLimiter = new EnhancedRateLimiter();

// Start cleanup schedule
rateLimiter.startCleanupSchedule();

module.exports = {
    EnhancedRateLimiter,
    rateLimiter,
    
    // Middleware exports
    apiLimiter: rateLimiter.createIntelligentLimiter('api'),
    strictLimiter: rateLimiter.createIntelligentLimiter('strict'),
    batchLimiter: rateLimiter.createIntelligentLimiter('batch'),
    adaptiveLimiter: rateLimiter.createAdaptiveLimiter(),
    progressiveSlowdown: rateLimiter.createProgressiveSlowdown()
};