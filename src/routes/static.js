/**
 * Static Routes
 * Handles static file serving and website routes
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const config = require('../config');

const router = express.Router();

// Favicon handler
router.get('/favicon.ico', (req, res) => {
    const websitePath = config.website.path;
    const faviconPath = path.join(websitePath, 'favicon.ico');

    if (fs.existsSync(faviconPath)) {
        res.sendFile(faviconPath);
    } else {
        res.status(204).end(); // No content
    }
});

// Robots.txt
router.get('/robots.txt', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send('User-agent: *\nDisallow: /api/\nAllow: /\n');
});

// Serve static website files if enabled and available (PM2-optimized)
if (config.website.enabled) {
    console.log(`🌐 Website served from: ${config.website.path}`);

    // Simple static file serving without complex headers (PM2-friendly)
    router.use(express.static(config.website.path, {
        index: 'index.html'
    }));

    // Simple fallback for SPA routing
    router.get('*', (req, res) => {
        if (!req.path.startsWith('/api/')) {
            res.sendFile(path.join(config.website.path, 'index.html'), (err) => {
                if (err) {
                    res.status(404).send('Website not found');
                }
            });
        }
    });
} else {
    console.log(`⚠️ Website build not found at: ${config.website.path}`);
    console.log('   Run \'npm run build\' in the website directory to build the website');

    // Fallback route for when website is not built
    router.get('/', (req, res) => {
        res.json({
            message: 'HeadlessX v1.2.0 - Advanced Browserless Web Scraping API',
            status: 'Website not built',
            instructions: 'Run "npm run build" in the website directory to build the website',
            api: {
                health: '/api/health',
                status: '/api/status',
                documentation: '/api/docs'
            },
            timestamp: new Date().toISOString()
        });
    });
}

module.exports = router;
