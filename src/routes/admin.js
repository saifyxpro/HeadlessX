/**
 * Admin Routes
 * Administrative panel and management endpoints
 * HeadlessX v1.3.0 - Enhanced Anti-Detection
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const DetectionTestController = require('../controllers/detection-test');
const BrowserService = require('../services/browser');
const FingerprintManager = require('../config/fingerprints');
const { logger } = require('../utils/logger');
const { HeadlessXError, ERROR_CATEGORIES } = require('../utils/errors');

const router = express.Router();

// Rate limiting for admin endpoints
const adminRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Too many admin requests from this IP',
        retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Apply rate limiting to all admin routes
router.use(adminRateLimit);

// Initialize controllers and services (lazy initialization)
let detectionTestController = null;
function getDetectionTestController() {
    if (!detectionTestController) {
        detectionTestController = new DetectionTestController();
    }
    return detectionTestController;
}

const browserService = BrowserService;
const fingerprintManager = new FingerprintManager();

/**
 * Admin authentication middleware (basic implementation)
 * In production, implement proper JWT or session-based auth
 */
const adminAuth = (req, res, next) => {
    const apiKey = req.headers['x-admin-key'] || req.query.adminKey;
    const expectedKey = process.env.ADMIN_API_KEY || 'headlessx-admin-key';
    
    if (!apiKey || apiKey !== expectedKey) {
        return res.status(401).json({
            success: false,
            error: 'Admin authentication required',
            code: 'ADMIN_AUTH_REQUIRED'
        });
    }
    
    next();
};

// Apply admin authentication to all routes
router.use(adminAuth);

/**
 * Admin Dashboard - System Status
 */
router.get('/dashboard', async (req, res) => {
    try {
        const status = {
            system: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                nodeVersion: process.version,
                platform: process.platform,
                timestamp: new Date().toISOString()
            },
            browser: {
                available: await browserService.isAvailable(),
                activeContexts: browserService.getActiveContextsCount(),
                totalSessions: browserService.getTotalSessions(),
                browserPath: browserService.getBrowserPath()
            },
            fingerprinting: {
                availableProfiles: Object.keys(await fingerprintManager.getAvailableProfiles()),
                lastGenerated: fingerprintManager.getLastGeneratedTime(),
                cacheSize: fingerprintManager.getCacheSize()
            },
            detection: {
                testSuitesAvailable: Object.keys(detectionTestController.testSuites).length,
                lastTestRun: await getLastTestRunTime(),
                successRate: await getOverallSuccessRate()
            }
        };

        logger.info('Admin dashboard accessed', { 
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({
            success: true,
            dashboard: status
        });

    } catch (error) {
        logger.error('Admin dashboard error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            code: 'DASHBOARD_ERROR'
        });
    }
});

/**
 * System Health Check
 */
router.get('/health', async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            checks: {},
            timestamp: new Date().toISOString()
        };

        // Check browser service
        try {
            health.checks.browser = {
                status: await browserService.isAvailable() ? 'healthy' : 'unhealthy',
                details: {
                    available: await browserService.isAvailable(),
                    activeContexts: browserService.getActiveContextsCount()
                }
            };
        } catch (error) {
            health.checks.browser = {
                status: 'unhealthy',
                error: error.message
            };
            health.status = 'degraded';
        }

        // Check fingerprint manager
        try {
            const profiles = await fingerprintManager.getAvailableProfiles();
            health.checks.fingerprinting = {
                status: Object.keys(profiles).length > 0 ? 'healthy' : 'unhealthy',
                details: {
                    profileCount: Object.keys(profiles).length,
                    cacheSize: fingerprintManager.getCacheSize()
                }
            };
        } catch (error) {
            health.checks.fingerprinting = {
                status: 'unhealthy',
                error: error.message
            };
            health.status = 'degraded';
        }

        // Check memory usage
        const memoryUsage = process.memoryUsage();
        const memoryThreshold = 1024 * 1024 * 1024; // 1GB
        health.checks.memory = {
            status: memoryUsage.heapUsed < memoryThreshold ? 'healthy' : 'warning',
            details: {
                heapUsed: memoryUsage.heapUsed,
                heapTotal: memoryUsage.heapTotal,
                external: memoryUsage.external,
                rss: memoryUsage.rss
            }
        };

        if (health.checks.memory.status === 'warning') {
            health.status = 'degraded';
        }

        // Overall status
        const unhealthyChecks = Object.values(health.checks).filter(check => 
            check.status === 'unhealthy'
        );

        if (unhealthyChecks.length > 0) {
            health.status = 'unhealthy';
        }

        const statusCode = health.status === 'healthy' ? 200 : 
                          health.status === 'degraded' ? 200 : 503;

        res.status(statusCode).json({
            success: health.status !== 'unhealthy',
            health
        });

    } catch (error) {
        logger.error('Health check error:', error);
        res.status(503).json({
            success: false,
            health: {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            }
        });
    }
});

/**
 * Browser Management
 */
router.get('/browser/status', async (req, res) => {
    try {
        const browserStatus = {
            available: await browserService.isAvailable(),
            activeContexts: browserService.getActiveContextsCount(),
            totalSessions: browserService.getTotalSessions(),
            browserPath: browserService.getBrowserPath(),
            version: await browserService.getBrowserVersion(),
            capabilities: await browserService.getCapabilities(),
            performance: await browserService.getPerformanceMetrics()
        };

        res.json({
            success: true,
            browser: browserStatus
        });

    } catch (error) {
        logger.error('Browser status error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/browser/restart', async (req, res) => {
    try {
        await browserService.restart();
        
        logger.info('Browser service restarted via admin', {
            ip: req.ip,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            message: 'Browser service restarted successfully'
        });

    } catch (error) {
        logger.error('Browser restart error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.delete('/browser/sessions', async (req, res) => {
    try {
        const { force = false } = req.body;
        const closedSessions = await browserService.closeAllSessions(force);
        
        logger.info('All browser sessions closed via admin', {
            ip: req.ip,
            closedSessions,
            force,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            message: `${closedSessions} sessions closed`,
            closedSessions
        });

    } catch (error) {
        logger.error('Close sessions error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Fingerprint Management
 */
router.get('/fingerprints', async (req, res) => {
    try {
        const profiles = await fingerprintManager.getAvailableProfiles();
        const stats = {
            totalProfiles: Object.keys(profiles).length,
            cacheSize: fingerprintManager.getCacheSize(),
            lastGenerated: fingerprintManager.getLastGeneratedTime(),
            profiles: Object.keys(profiles).map(key => ({
                id: key,
                name: profiles[key].name || key,
                platform: profiles[key].platform,
                browser: profiles[key].browser,
                quality: profiles[key].quality,
                lastUsed: profiles[key].lastUsed || null
            }))
        };

        res.json({
            success: true,
            fingerprints: stats
        });

    } catch (error) {
        logger.error('Fingerprints list error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/fingerprints/generate', async (req, res) => {
    try {
        const { 
            profile = 'random', 
            count = 1, 
            options = {} 
        } = req.body;

        if (count > 10) {
            throw new HeadlessXError(
                'Cannot generate more than 10 fingerprints at once',
                400,
                ERROR_CATEGORIES.VALIDATION
            );
        }

        const generated = [];
        for (let i = 0; i < count; i++) {
            const fingerprint = await fingerprintManager.generateProfile(profile, options);
            generated.push({
                id: fingerprint.id,
                profile,
                timestamp: new Date().toISOString()
            });
        }

        logger.info('Fingerprints generated via admin', {
            ip: req.ip,
            profile,
            count,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            message: `${count} fingerprint(s) generated`,
            generated
        });

    } catch (error) {
        logger.error('Fingerprint generation error:', error);
        res.status(error.status || 500).json({
            success: false,
            error: error.message
        });
    }
});

router.delete('/fingerprints/cache', async (req, res) => {
    try {
        const clearedCount = await fingerprintManager.clearCache();
        
        logger.info('Fingerprint cache cleared via admin', {
            ip: req.ip,
            clearedCount,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            message: `Cache cleared: ${clearedCount} items removed`,
            clearedCount
        });

    } catch (error) {
        logger.error('Cache clear error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Detection Testing Management
 */
router.get('/detection/suites', (req, res) => {
    detectionTestController.getTestSuites(req, res);
});

router.get('/detection/status', (req, res) => {
    detectionTestController.getDetectionStatus(req, res);
});

router.post('/detection/test', async (req, res) => {
    try {
        logger.info('Detection test started via admin', {
            ip: req.ip,
            suite: req.body.suite,
            profile: req.body.profile,
            timestamp: new Date().toISOString()
        });

        await detectionTestController.runDetectionTest(req, res);
    } catch (error) {
        logger.error('Detection test error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * System Configuration
 */
router.get('/config', async (req, res) => {
    try {
        const config = {
            environment: process.env.NODE_ENV || 'development',
            headless: process.env.HEADLESS !== 'false',
            rateLimiting: {
                enabled: process.env.RATE_LIMITING !== 'false',
                windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
                max: parseInt(process.env.RATE_LIMIT_MAX) || 100
            },
            browser: {
                executablePath: process.env.BROWSER_EXECUTABLE_PATH || null,
                args: (process.env.BROWSER_ARGS || '').split(',').filter(Boolean),
                timeout: parseInt(process.env.BROWSER_TIMEOUT) || 30000
            },
            fingerprinting: {
                cacheEnabled: process.env.FINGERPRINT_CACHE !== 'false',
                cacheSize: parseInt(process.env.FINGERPRINT_CACHE_SIZE) || 1000,
                defaultProfile: process.env.DEFAULT_FINGERPRINT_PROFILE || 'windows-chrome-high-end'
            },
            logging: {
                level: process.env.LOG_LEVEL || 'info',
                file: process.env.LOG_FILE || null,
                console: process.env.LOG_CONSOLE !== 'false'
            }
        };

        res.json({
            success: true,
            config
        });

    } catch (error) {
        logger.error('Config retrieval error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Logs Management
 */
router.get('/logs', async (req, res) => {
    try {
        const { 
            level = 'info',
            limit = 100,
            offset = 0,
            since
        } = req.query;

        const logs = await logger.getLogs({
            level,
            limit: parseInt(limit),
            offset: parseInt(offset),
            since: since ? new Date(since) : null
        });

        res.json({
            success: true,
            logs: {
                entries: logs,
                total: logs.length,
                level,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });

    } catch (error) {
        logger.error('Logs retrieval error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.delete('/logs', async (req, res) => {
    try {
        const { level, olderThan } = req.body;
        
        const options = {};
        if (level) options.level = level;
        if (olderThan) options.olderThan = new Date(olderThan);
        
        const deletedCount = await logger.clearLogs(options);
        
        logger.info('Logs cleared via admin', {
            ip: req.ip,
            deletedCount,
            options,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            message: `${deletedCount} log entries cleared`,
            deletedCount
        });

    } catch (error) {
        logger.error('Logs clear error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Performance Metrics
 */
router.get('/metrics', async (req, res) => {
    try {
        const metrics = {
            system: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                platform: {
                    arch: process.arch,
                    platform: process.platform,
                    nodeVersion: process.version,
                    pid: process.pid
                }
            },
            browser: await browserService.getPerformanceMetrics(),
            fingerprinting: {
                cacheHitRate: fingerprintManager.getCacheHitRate(),
                averageGenerationTime: fingerprintManager.getAverageGenerationTime(),
                totalGenerated: fingerprintManager.getTotalGenerated()
            },
            requests: {
                total: global.requestCount || 0,
                errors: global.errorCount || 0,
                averageResponseTime: global.averageResponseTime || 0,
                activeConnections: global.activeConnections || 0
            },
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            metrics
        });

    } catch (error) {
        logger.error('Metrics retrieval error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Maintenance Operations
 */
router.post('/maintenance/cleanup', async (req, res) => {
    try {
        const { 
            clearCache = true,
            clearOldLogs = true,
            clearTempFiles = true,
            restartBrowser = false
        } = req.body;

        const results = {
            cacheCleared: 0,
            logsCleared: 0,
            tempFilesCleared: 0,
            browserRestarted: false
        };

        if (clearCache) {
            results.cacheCleared = await fingerprintManager.clearCache();
        }

        if (clearOldLogs) {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            results.logsCleared = await logger.clearLogs({ olderThan: oneDayAgo });
        }

        if (clearTempFiles) {
            // Implement temp file cleanup
            results.tempFilesCleared = 0; // Placeholder
        }

        if (restartBrowser) {
            await browserService.restart();
            results.browserRestarted = true;
        }

        logger.info('Maintenance cleanup performed via admin', {
            ip: req.ip,
            results,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            message: 'Maintenance cleanup completed',
            results
        });

    } catch (error) {
        logger.error('Maintenance cleanup error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Helper functions
async function getLastTestRunTime() {
    // This would typically query a database or log file
    // For now, return a placeholder
    return null;
}

async function getOverallSuccessRate() {
    // This would calculate success rate from historical test data
    // For now, return a placeholder
    return null;
}

// Error handling middleware for admin routes
router.use((error, req, res, next) => {
    logger.error('Admin route error:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });

    res.status(error.status || 500).json({
        success: false,
        error: error.message || 'Internal server error',
        code: error.code || 'ADMIN_ERROR',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;