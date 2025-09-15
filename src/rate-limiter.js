// Advanced Rate Limiting System for HeadlessX
// Prevents abuse and resource exhaustion with intelligent throttling

const crypto = require('crypto');

class RateLimiter {
    constructor() {
        // Different limits for different endpoint types
        this.limits = {
            // Core rendering endpoints (most resource intensive)
            render: { requests: 10, window: 60000, burst: 2 }, // 10 requests per minute, 2 burst
            batch: { requests: 5, window: 60000, burst: 1 },   // 5 batch requests per minute
            
            // Content extraction endpoints (medium resource usage)
            extract: { requests: 20, window: 60000, burst: 5 }, // 20 requests per minute
            screenshot: { requests: 15, window: 60000, burst: 3 }, // 15 screenshots per minute
            pdf: { requests: 10, window: 60000, burst: 2 },      // 10 PDFs per minute
            
            // Status/health endpoints (low resource usage)
            status: { requests: 60, window: 60000, burst: 10 },  // 60 status checks per minute
            health: { requests: 120, window: 60000, burst: 20 }, // 120 health checks per minute
            
            // Authentication endpoints
            auth: { requests: 30, window: 60000, burst: 5 }      // 30 auth requests per minute
        };
        
        // Track requests by IP and token
        this.requestCounts = new Map(); // IP/token -> { count, window, burst }
        this.blockedIPs = new Map();    // IP -> { until, reason }
        
        // Global resource tracking
        this.activeRequests = 0;
        this.maxConcurrentRequests = 50; // Prevent resource exhaustion
        
        // Cleanup interval
        this.cleanupInterval = setInterval(() => this.cleanup(), 30000); // Clean every 30 seconds
    }
    
    // Generate unique key for rate limiting (IP + token combo)
    generateKey(req) {
        const ip = this.getClientIP(req);
        const token = this.extractToken(req);
        return crypto.createHash('sha256').update(`${ip}:${token || 'anonymous'}`).digest('hex').substring(0, 16);
    }
    
    // Extract client IP with proxy support
    getClientIP(req) {
        return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
               req.headers['x-real-ip'] ||
               req.connection?.remoteAddress ||
               req.socket?.remoteAddress ||
               'unknown';
    }
    
    // Extract token from various sources
    extractToken(req) {
        return req.query.token ||
               req.headers['authorization']?.replace(/Bearer\s+/i, '') ||
               req.headers['x-api-key'] ||
               null;
    }
    
    // Determine endpoint category for rate limiting
    categorizeEndpoint(path) {
        if (path.includes('/api/render') || path.includes('/api/content')) return 'render';
        if (path.includes('/api/batch')) return 'batch';
        if (path.includes('/api/extract') || path.includes('/api/text')) return 'extract';
        if (path.includes('/api/screenshot')) return 'screenshot';
        if (path.includes('/api/pdf')) return 'pdf';
        if (path.includes('/api/status')) return 'status';
        if (path.includes('/api/health')) return 'health';
        return 'auth'; // Default for other endpoints
    }
    
    // Check if request should be rate limited
    shouldLimit(req) {
        const key = this.generateKey(req);
        const ip = this.getClientIP(req);
        const endpoint = this.categorizeEndpoint(req.path);
        const limit = this.limits[endpoint];
        const now = Date.now();
        
        // Check if IP is blocked
        if (this.blockedIPs.has(ip)) {
            const blockInfo = this.blockedIPs.get(ip);
            if (now < blockInfo.until) {
                return {
                    limited: true,
                    reason: 'IP_BLOCKED',
                    retryAfter: Math.ceil((blockInfo.until - now) / 1000),
                    details: blockInfo.reason
                };
            } else {
                this.blockedIPs.delete(ip); // Unblock expired IPs
            }
        }
        
        // Check global concurrent request limit
        if (this.activeRequests >= this.maxConcurrentRequests) {
            return {
                limited: true,
                reason: 'RESOURCE_EXHAUSTION',
                retryAfter: 30,
                details: `Server is processing ${this.activeRequests} concurrent requests`
            };
        }
        
        // Get or create request tracking for this key
        if (!this.requestCounts.has(key)) {
            this.requestCounts.set(key, {
                count: 0,
                windowStart: now,
                burstCount: 0,
                burstWindowStart: now
            });
        }
        
        const requestData = this.requestCounts.get(key);
        
        // Reset window if expired
        if (now - requestData.windowStart >= limit.window) {
            requestData.count = 0;
            requestData.windowStart = now;
        }
        
        // Reset burst window if expired (burst window is 10 seconds)
        if (now - requestData.burstWindowStart >= 10000) {
            requestData.burstCount = 0;
            requestData.burstWindowStart = now;
        }
        
        // Check burst limit (short-term)
        if (requestData.burstCount >= limit.burst) {
            return {
                limited: true,
                reason: 'BURST_LIMIT',
                retryAfter: Math.ceil((10000 - (now - requestData.burstWindowStart)) / 1000),
                details: `Burst limit exceeded: ${limit.burst} requests per 10 seconds`
            };
        }
        
        // Check rate limit (long-term)
        if (requestData.count >= limit.requests) {
            // Block IP if consistently hitting limits
            this.checkForAbuse(ip, key);
            
            return {
                limited: true,
                reason: 'RATE_LIMIT',
                retryAfter: Math.ceil((limit.window - (now - requestData.windowStart)) / 1000),
                details: `Rate limit exceeded: ${limit.requests} requests per ${limit.window/1000} seconds`
            };
        }
        
        return { limited: false };
    }
    
    // Record a request (call after allowing request)
    recordRequest(req) {
        const key = this.generateKey(req);
        const requestData = this.requestCounts.get(key);
        
        if (requestData) {
            requestData.count++;
            requestData.burstCount++;
        }
        
        this.activeRequests++;
    }
    
    // Record request completion (call when request finishes)
    recordCompletion(req) {
        this.activeRequests = Math.max(0, this.activeRequests - 1);
    }
    
    // Check for abusive behavior and block if necessary
    checkForAbuse(ip, key) {
        const requestData = this.requestCounts.get(key);
        if (!requestData) return;
        
        // If hitting rate limits repeatedly, escalate blocking
        const now = Date.now();
        if (!requestData.violations) {
            requestData.violations = 0;
            requestData.firstViolation = now;
        }
        
        requestData.violations++;
        
        // Block for increasing durations based on violations
        if (requestData.violations >= 5) {
            const blockDuration = Math.min(3600000, 60000 * Math.pow(2, requestData.violations - 5)); // Max 1 hour
            this.blockedIPs.set(ip, {
                until: now + blockDuration,
                reason: `Repeated rate limit violations (${requestData.violations} times)`
            });
            
            // Log the blocking
            console.log(`[RATE_LIMIT] Blocked IP ${ip} for ${blockDuration/1000} seconds due to ${requestData.violations} violations`);
        }
    }
    
    // Clean up expired entries
    cleanup() {
        const now = Date.now();
        
        // Clean up expired request counts
        for (const [key, data] of this.requestCounts.entries()) {
            if (now - data.windowStart > 300000) { // Keep for 5 minutes after window
                this.requestCounts.delete(key);
            }
        }
        
        // Clean up expired IP blocks
        for (const [ip, blockInfo] of this.blockedIPs.entries()) {
            if (now >= blockInfo.until) {
                this.blockedIPs.delete(ip);
            }
        }
    }
    
    // Get current statistics
    getStats() {
        return {
            activeRequests: this.activeRequests,
            maxConcurrentRequests: this.maxConcurrentRequests,
            trackedClients: this.requestCounts.size,
            blockedIPs: this.blockedIPs.size,
            limits: this.limits
        };
    }
    
    // Express middleware factory
    middleware() {
        return (req, res, next) => {
            const limitCheck = this.shouldLimit(req);
            
            if (limitCheck.limited) {
                res.status(429).json({
                    error: 'Rate limit exceeded',
                    reason: limitCheck.reason,
                    details: limitCheck.details,
                    retryAfter: limitCheck.retryAfter,
                    timestamp: new Date().toISOString()
                });
                return;
            }
            
            // Record the request
            this.recordRequest(req);
            
            // Add completion handler
            const originalEnd = res.end;
            res.end = (...args) => {
                this.recordCompletion(req);
                originalEnd.apply(res, args);
            };
            
            next();
        };
    }
    
    // Cleanup on shutdown
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.requestCounts.clear();
        this.blockedIPs.clear();
    }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

// Graceful shutdown
process.on('SIGINT', () => {
    rateLimiter.destroy();
});

process.on('SIGTERM', () => {
    rateLimiter.destroy();
});

module.exports = rateLimiter;