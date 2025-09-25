/**
 * Rate Limiter for HeadlessX API
 *
 * Implements rate limiting to prevent API abuse and ensure fair usage
 * Uses memory-based rate limiting with configurable limits per IP
 */

const { HeadlessXError } = require('./utils/errors');
const { logger } = require('./utils/logger');

class RateLimiter {
    constructor(options = {}) {
        this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
        this.maxRequests = options.maxRequests || 100; // 100 requests per window
        this.skipSuccessfulRequests = options.skipSuccessfulRequests || false;
        this.skipFailedRequests = options.skipFailedRequests || false;
        this.keyGenerator = options.keyGenerator || this.defaultKeyGenerator;

        // In-memory store for rate limiting data
        this.store = new Map();

        // Cleanup interval to remove expired entries
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, this.windowMs);

        logger.info('Rate limiter initialized', {
            windowMs: this.windowMs,
            maxRequests: this.maxRequests,
            component: 'rate-limiter'
        });
    }

    defaultKeyGenerator(req) {
        // Use IP address as the key, with forwarded IP support
        return req.ip || req.connection.remoteAddress || req.socket.remoteAddress ||
               (req.connection.socket ? req.connection.socket.remoteAddress : null) || 'unknown';
    }

    middleware() {
        return (req, res, next) => {
            const key = this.keyGenerator(req);
            const now = Date.now();

            // Get or create rate limit data for this key
            let rateData = this.store.get(key);
            if (!rateData) {
                rateData = {
                    count: 0,
                    resetTime: now + this.windowMs,
                    firstRequest: now
                };
                this.store.set(key, rateData);
            }

            // Check if window has expired
            if (now > rateData.resetTime) {
                rateData.count = 0;
                rateData.resetTime = now + this.windowMs;
                rateData.firstRequest = now;
            }

            // Increment request count
            rateData.count++;

            // Set rate limit headers
            res.set({
                'X-RateLimit-Limit': this.maxRequests,
                'X-RateLimit-Remaining': Math.max(0, this.maxRequests - rateData.count),
                'X-RateLimit-Reset': new Date(rateData.resetTime).toISOString()
            });

            // Check if rate limit exceeded
            if (rateData.count > this.maxRequests) {
                const retryAfter = Math.ceil((rateData.resetTime - now) / 1000);
                res.set('Retry-After', retryAfter);

                logger.warn('Rate limit exceeded', {
                    ip: key,
                    count: rateData.count,
                    limit: this.maxRequests,
                    retryAfter,
                    component: 'rate-limiter'
                });

                const error = new HeadlessXError(
                    `Rate limit exceeded. Too many requests from this IP. Limit: ${this.maxRequests} requests per ${this.windowMs / 1000 / 60} minutes.`,
                    'rate_limit',
                    true
                );

                return res.status(429).json({
                    success: false,
                    error: error.message,
                    category: error.category,
                    rateLimit: {
                        limit: this.maxRequests,
                        remaining: 0,
                        reset: new Date(rateData.resetTime).toISOString(),
                        retryAfter
                    }
                });
            }

            // Log request for monitoring
            if (rateData.count % 10 === 0 || rateData.count > this.maxRequests * 0.8) {
                logger.debug('Rate limit status', {
                    ip: key,
                    count: rateData.count,
                    limit: this.maxRequests,
                    remaining: this.maxRequests - rateData.count,
                    component: 'rate-limiter'
                });
            }

            next();
        };
    }

    cleanup() {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [key, data] of this.store.entries()) {
            if (now > data.resetTime) {
                this.store.delete(key);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            logger.debug('Rate limiter cleanup completed', {
                cleanedEntries: cleanedCount,
                activeEntries: this.store.size,
                component: 'rate-limiter'
            });
        }
    }

    getStats() {
        return {
            activeEntries: this.store.size,
            windowMs: this.windowMs,
            maxRequests: this.maxRequests,
            uptime: Date.now() - this.startTime
        };
    }

    reset() {
        this.store.clear();
        logger.info('Rate limiter store cleared', { component: 'rate-limiter' });
    }

    shutdown() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.store.clear();
        logger.info('Rate limiter shutdown completed', { component: 'rate-limiter' });
    }
}

// Create and export a default rate limiter instance
const defaultRateLimiter = new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per window
    skipSuccessfulRequests: false,
    skipFailedRequests: false
});

module.exports = defaultRateLimiter;
module.exports.RateLimiter = RateLimiter;
