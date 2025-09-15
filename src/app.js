/**
 * HeadlessX v1.2.0 - Advanced Browserless Web Scraping API with Human-like Behavior
 * 
 * Main Application Entry Point
 * Modular, production-ready Node.js server with proper separation of concerns
 * 
 * Features:
 * - Realistic Windows user agent rotation (Chrome, Edge, Firefox)
 * - Human-like mouse movements and interactions
 * - Advanced stealth techniques to avoid bot detection
 * - Comprehensive header spoofing with browser-specific headers
 * - Natural scrolling patterns with easing and pauses
 * - Emergency content extraction with fallback methods
 * - Multiple output formats (HTML, text, screenshots, PDFs)
 * - Batch processing with controlled concurrency
 * - Timeout handling with partial content recovery
 * 
 * Anti-Detection Measures:
 * - Randomized realistic user agents from popular Windows browsers
 * - Browser-specific headers (sec-ch-ua, Sec-Fetch, etc.)
 * - Randomized device properties (memory, CPU cores, etc.)
 * - Natural timing variations and human-like pauses
 * - Comprehensive webdriver property removal
 * - Realistic plugin and MIME type spoofing
 * - Natural mouse movement patterns
 * - Variable scroll speeds with easing animations
 * 
 * Author: SaifyXPRO
 * Updated: September 15, 2025
 */

const express = require('express');
const bodyParser = require('body-parser');

// Import configuration and services
const config = require('./config');
const browserService = require('./services/browser');
const { logger } = require('./utils/logger');

// Import middleware
const { errorHandler, notFoundHandler } = require('./middleware/error');

// Import routes
const apiRoutes = require('./routes/api');
const staticRoutes = require('./routes/static');

// Create Express application
const app = express();

// Import and configure rate limiter
const rateLimiter = require('./rate-limiter');

// Apply rate limiting before other middleware
app.use('/api', rateLimiter.middleware());

// Basic middleware
app.use(bodyParser.json({ limit: config.api.bodyLimit }));
app.use(bodyParser.urlencoded({ extended: true, limit: config.api.bodyLimit }));

// Trust proxy for accurate IP addresses
app.set('trust proxy', true);

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// API routes
app.use('/api', apiRoutes);

// Static file and website routes
app.use('/', staticRoutes);

// 404 handler for API routes only
app.use('/api/*', notFoundHandler);

// Global error handler middleware (must be last)
app.use(errorHandler);

// Graceful shutdown handlers
async function gracefulShutdown(signal) {
    console.log(`🛑 Received ${signal}, shutting down gracefully...`);
    
    try {
        // Close browser service
        await browserService.shutdown();
        console.log('✅ Browser service closed');
        
        // Close server
        if (server) {
            server.close(() => {
                console.log('✅ HTTP server closed');
                process.exit(0);
            });
        } else {
            process.exit(0);
        }
    } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});

// Start server
let server;

function startServer() {
    server = app.listen(config.server.port, config.server.host, () => {
        console.log(`🚀 HeadlessX v1.2.0 - Advanced Browserless Web Scraping API running on port ${config.server.port}`);
        console.log(`🌐 Website: http://localhost:${config.server.port}/`);
        console.log(`📍 Health check: http://localhost:${config.server.port}/api/health`);
        console.log(`📊 Status: http://localhost:${config.server.port}/api/status`);
        console.log(`📖 API Documentation: http://localhost:${config.server.port}/api/docs`);
        console.log(`🔐 Auth token configured: ${config.server.authToken ? 'Yes' : 'No'}`);
        console.log(`✨ Features: Human-like behavior, anti-detection, advanced timeout handling`);
        console.log(`🎯 API Endpoints: /api/render, /api/html, /api/content, /api/screenshot, /api/pdf, /api/batch`);
        console.log(`📖 Documentation: Visit /api/docs for full API documentation`);
        
        // Log configuration summary
        console.log(`\n📋 Configuration Summary:`);
        console.log(`   ├── Port: ${config.server.port}`);
        console.log(`   ├── Host: ${config.server.host}`);
        console.log(`   ├── Browser Timeout: ${config.browser.timeout}ms`);
        console.log(`   ├── Extra Wait Time: ${config.browser.extraWaitTime}ms`);
        console.log(`   ├── Max Concurrency: ${config.browser.maxConcurrency}`);
        console.log(`   ├── Body Limit: ${config.api.bodyLimit}`);
        console.log(`   ├── Max Batch URLs: ${config.api.maxBatchUrls}`);
        console.log(`   ├── Website Enabled: ${config.website.enabled}`);
        console.log(`   └── Debug Mode: ${config.logging.debug}`);
    });
    
    // Handle server errors
    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`❌ Port ${config.server.port} is already in use`);
        } else {
            console.error('❌ Server error:', error);
        }
        process.exit(1);
    });
}

// Initialize and start server
if (require.main === module) {
    startServer();
}

module.exports = app;