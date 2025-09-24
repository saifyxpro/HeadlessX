/**
 * Enhanced System Controller v1.3.0
 * Handles health checks, status, fingerprint testing, and advanced system diagnostics
 * Features: Device profile testing, geolocation validation, anti-detection status
 */

const config = require('../config');
const browserService = require('../services/browser');
const StealthService = require('../services/stealth');
const { logger } = require('../utils/logger');

class SystemController {
    
    /**
     * Enhanced health check with v1.3.0 features status
     */
    static getHealth(req, res) {
        const requestId = req.requestId;
        
        try {
            const uptime = Math.floor((Date.now() - config.server.startTime.getTime()) / 1000);
            const memoryUsage = process.memoryUsage();
            
            const healthStatus = {
                status: 'OK',
                timestamp: new Date().toISOString(),
                version: '1.3.0',
                browserConnected: browserService.getStatus().connected,
                uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`,
                memory: {
                    rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
                    heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
                    heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                    external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
                },
                antiDetectionFeatures: {
                    canvasFingerprinting: 'enabled',
                    webglSpoofing: 'enabled',
                    audioContextSpoofing: 'enabled',
                    webrtcBlocking: 'enabled',
                    behaviorSimulation: 'enabled',
                    advancedStealth: 'enabled'
                },
                availableProfiles: {
                    device: ['high-end-desktop', 'mid-range-desktop', 'business-laptop'],
                    geolocation: ['us-east', 'us-west', 'us-central', 'uk', 'germany', 'france'],
                    behavior: ['confident', 'natural', 'cautious']
                }
            };
            
            logger.info(requestId, 'Enhanced health check requested', { status: 'healthy', version: '1.3.0' });
            res.json(healthStatus);
            
        } catch (error) {
            logger.error(requestId, 'Health check failed', error);
            res.status(503).json({
                status: 'ERROR',
                timestamp: new Date().toISOString(),
                version: '1.3.0',
                error: 'Health check failed',
                details: error.message
            });
        }
    }

    /**
     * New fingerprint testing endpoint for v1.3.0
     */
    static async testFingerprint(req, res) {
        const requestId = req.requestId;
        
        try {
            const { deviceProfile, geoProfile } = req.body;
            
            logger.info(requestId, `Testing fingerprint with profile: ${deviceProfile}/${geoProfile}`);
            
            // Generate test fingerprint
            const fingerprint = StealthService.generateAdvancedFingerprint(undefined, deviceProfile);
            
            // Test fingerprint consistency
            const fingerprintTest = {
                timestamp: new Date().toISOString(),
                requestId,
                profiles: {
                    device: deviceProfile || 'mid-range-desktop',
                    geolocation: geoProfile || 'us-east'
                },
                fingerprint: {
                    id: fingerprint.id,
                    webgl: {
                        vendor: fingerprint.webgl.vendor,
                        renderer: fingerprint.webgl.renderer.substring(0, 50) + '...',
                        version: fingerprint.webgl.version
                    },
                    canvas: {
                        noiseLength: fingerprint.canvas.noise.length,
                        textBaseline: fingerprint.canvas.textBaseline
                    },
                    audioContext: {
                        sampleRate: fingerprint.audioContext.sampleRate,
                        baseLatency: fingerprint.audioContext.baseLatency,
                        outputLatency: fingerprint.audioContext.outputLatency
                    },
                    hardware: {
                        cores: fingerprint.hardwareConcurrency,
                        memory: fingerprint.deviceMemory,
                        platform: fingerprint.platform
                    },
                    screen: {
                        width: fingerprint.screenWidth,
                        height: fingerprint.screenHeight,
                        pixelRatio: fingerprint.devicePixelRatio
                    },
                    behavioral: fingerprint.behavioral
                },
                validation: {
                    consistency: true,
                    entropyScore: fingerprint.entropy.length,
                    uniqueness: fingerprint.id.substring(0, 8)
                }
            };
            
            logger.info(requestId, 'Fingerprint test completed successfully');
            res.json(fingerprintTest);
            
        } catch (error) {
            logger.error(requestId, 'Fingerprint test failed', error);
            res.status(500).json({
                error: 'Fingerprint test failed',
                details: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    // Status endpoint with server information (requires authentication)
    static getStatus(req, res) {
        const requestId = req.requestId;
        
        try {
            const uptime = Math.floor((Date.now() - config.server.startTime.getTime()) / 1000);
            const browserStatus = browserService.getStatus();
            
            const statusInfo = {
                server: {
                    name: 'HeadlessX - Advanced Browserless Web Scraping API',
                    version: '1.2.0',
                    uptime: uptime,
                    startTime: config.server.startTime.toISOString(),
                    environment: process.env.NODE_ENV || 'development'
                },
                browser: {
                    connected: browserStatus.connected,
                    activeContexts: browserStatus.activeContexts,
                    type: browserStatus.type
                },
                configuration: {
                    maxConcurrency: config.browser.maxConcurrency,
                    defaultTimeout: config.browser.timeout,
                    extraWaitTime: config.browser.extraWaitTime,
                    bodyLimit: config.api.bodyLimit,
                    maxBatchUrls: config.api.maxBatchUrls
                },
                endpoints: [
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
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString()
            };
            
            logger.info(requestId, 'Status check requested', { 
                uptime: statusInfo.server.uptime,
                browserConnected: statusInfo.browser.connected,
                activeContexts: statusInfo.browser.activeContexts
            });
            
            res.json(statusInfo);
            
        } catch (error) {
            logger.error(requestId, 'Status endpoint error', error);
            res.status(500).json({ 
                error: 'Failed to get server status', 
                details: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    // Get system metrics for monitoring
    static getMetrics(req, res) {
        const requestId = req.requestId;
        
        try {
            const uptime = Math.floor((Date.now() - config.server.startTime.getTime()) / 1000);
            const memoryUsage = process.memoryUsage();
            const browserStatus = browserService.getStatus();
            
            const metrics = {
                timestamp: new Date().toISOString(),
                uptime_seconds: uptime,
                memory_usage_bytes: {
                    rss: memoryUsage.rss,
                    heap_total: memoryUsage.heapTotal,
                    heap_used: memoryUsage.heapUsed,
                    external: memoryUsage.external
                },
                browser_connected: browserStatus.connected ? 1 : 0,
                active_contexts: browserStatus.activeContexts,
                process_id: process.pid,
                node_version: process.version
            };
            
            logger.debug(requestId, 'Metrics requested', metrics);
            res.json(metrics);
            
        } catch (error) {
            logger.error(requestId, 'Metrics endpoint error', error);
            res.status(500).json({
                error: 'Failed to get system metrics',
                details: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
}

module.exports = SystemController;