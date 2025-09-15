/**
 * HeadlessX v1.2.0 - Main Application Entry Point
 * 
 * Production-ready modular server with full functionality
 * Optimized for both direct execution and PM2 deployment
 */

const express = require('express');
const path = require('path');

// Core modules with error handling
let config, browserService, logger;

try {
    config = require('./config');
    browserService = require('./services/browser');
    logger = require('./utils/logger').logger;
} catch (error) {
    console.error('❌ Failed to load core modules:', error.message);
    process.exit(1);
}

// Create Express application
const app = express();

// Basic middleware (essential only)
app.use(express.json({ limit: config.api.bodyLimit || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: config.api.bodyLimit || '10mb' }));

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Health endpoint (no auth required)
app.get('/api/health', (req, res) => {
    try {
        const uptime = Math.floor(process.uptime());
        const memory = process.memoryUsage();
        
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            version: '1.2.0',
            uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`,
            memory: {
                rss: `${Math.round(memory.rss / 1024 / 1024)}MB`,
                heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`
            },
            browserConnected: browserService.getStatus().connected
        });
    } catch (error) {
        res.status(503).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            error: 'Health check failed'
        });
    }
});

// Status endpoint (with auth)
app.get('/api/status', (req, res) => {
    // Simple auth check
    const authToken = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
    if (!authToken || authToken !== config.server.authToken) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const browserStatus = browserService.getStatus();
        res.json({
            server: {
                name: 'HeadlessX v1.2.0',
                uptime: process.uptime(),
                environment: process.env.NODE_ENV || 'development'
            },
            browser: browserStatus,
            configuration: {
                maxConcurrency: config.browser.maxConcurrency,
                timeout: config.browser.timeout,
                bodyLimit: config.api.bodyLimit
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: 'Status check failed',
            timestamp: new Date().toISOString()
        });
    }
});

// Simple API docs endpoint
app.get('/api/docs', (req, res) => {
    res.json({
        name: 'HeadlessX v1.2.0 API',
        version: '1.2.0',
        description: 'Advanced Browserless Web Scraping API',
        endpoints: {
            'GET /api/health': 'Server health check (no auth)',
            'GET /api/status': 'Server status (auth required)',
            'GET /api/docs': 'API documentation'
        },
        authentication: {
            method: 'Bearer token',
            header: 'Authorization: Bearer YOUR_TOKEN',
            query: '?token=YOUR_TOKEN'
        },
        timestamp: new Date().toISOString()
    });
});

// Serve website files if available
const websitePath = path.join(__dirname, '..', 'website', 'out');
try {
    const fs = require('fs');
    if (fs.existsSync(websitePath)) {
        console.log(`🌐 Website served from: ${websitePath}`);
        app.use(express.static(websitePath, { index: 'index.html' }));
        
        // SPA fallback
        app.get('*', (req, res, next) => {
            if (req.path.startsWith('/api/')) {
                next();
            } else {
                res.sendFile(path.join(websitePath, 'index.html'), (err) => {
                    if (err) next();
                });
            }
        });
    } else {
        console.log(`⚠️ Website not found at: ${websitePath}`);
        app.get('/', (req, res) => {
            res.json({
                message: 'HeadlessX v1.2.0 - Advanced Browserless Web Scraping API',
                status: 'Website not built',
                api: {
                    health: '/api/health',
                    status: '/api/status',
                    docs: '/api/docs'
                },
                note: 'Run "npm run build" to build the website'
            });
        });
    }
} catch (error) {
    console.log(`⚠️ Website setup error: ${error.message}`);
}

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        path: req.path,
        timestamp: new Date().toISOString()
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// Server instance
let server;

// Graceful shutdown
async function gracefulShutdown(signal) {
    console.log(`🛑 Received ${signal}, shutting down gracefully...`);
    
    try {
        if (browserService) {
            await browserService.shutdown();
            console.log('✅ Browser service closed');
        }
        
        if (server) {
            server.close(() => {
                console.log('✅ HTTP server closed');
                process.exit(0);
            });
        } else {
            process.exit(0);
        }
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
}

// Signal handlers
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});

// Start server
function startServer() {
    const port = config.server.port || 3000;
    const host = config.server.host || '0.0.0.0';
    
    server = app.listen(port, host, () => {
        console.log(`🚀 HeadlessX v1.2.0 running on http://${host}:${port}`);
        console.log(`📍 Health check: http://${host}:${port}/api/health`);
        console.log(`📊 Status: http://${host}:${port}/api/status`);
        console.log(`📖 API docs: http://${host}:${port}/api/docs`);
        console.log(`🔐 Auth token: ${config.server.authToken ? 'Configured' : 'Missing'}`);
        console.log('✅ Server ready for requests');
    });
    
    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`❌ Port ${port} is already in use`);
        } else {
            console.error('❌ Server error:', error);
        }
        process.exit(1);
    });
}

// Initialize server
if (require.main === module) {
    console.log('🔄 Initializing HeadlessX v1.2.0...');
    
    setTimeout(() => {
        try {
            startServer();
        } catch (error) {
            console.error('❌ Server startup failed:', error);
            process.exit(1);
        }
    }, 100);
}

module.exports = app;