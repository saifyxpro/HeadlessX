/**
 * System Controller
 * Handles health checks, status, and system information endpoints
 */

const config = require('../config');
const browserService = require('../services/browser');
const { logger } = require('../utils/logger');

class SystemController {
    
    // Health check endpoint with detailed status
    static getHealth(req, res) {
        const requestId = req.requestId;
        
        try {
            const uptime = Math.floor((Date.now() - config.server.startTime.getTime()) / 1000);
            const memoryUsage = process.memoryUsage();
            
            const healthStatus = {
                status: 'OK',
                timestamp: new Date().toISOString(),
                browserConnected: browserService.getStatus().connected,
                uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`,
                memory: {
                    rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
                    heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
                    heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                    external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
                },
                version: '1.2.0'
            };
            
            logger.info(requestId, 'Health check requested', { status: 'healthy' });
            res.json(healthStatus);
            
        } catch (error) {
            logger.error(requestId, 'Health check failed', error);
            res.status(503).json({
                status: 'ERROR',
                timestamp: new Date().toISOString(),
                error: 'Health check failed',
                details: error.message
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