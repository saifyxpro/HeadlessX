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

// Serve static website files if enabled and available
if (config.website.enabled && fs.existsSync(config.website.path)) {
    // Serve static files from the website build
    router.use(express.static(config.website.path, {
        index: 'index.html',
        setHeaders: (res, path) => {
            // Cache static assets
            if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
                res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
            } else {
                res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour for HTML
            }
        }
    }));
    
    // Handle client-side routing - serve index.html for all non-API routes
    router.get('*', (req, res) => {
        // Only handle routes that don't start with /api/
        if (!req.path.startsWith('/api/')) {
            res.sendFile(path.join(config.website.path, 'index.html'));
        }
    });
    
    console.log(`🌐 Website served from: ${config.website.path}`);
} else {
    console.log(`⚠️ Website build not found at: ${config.website.path}`);
    console.log(`   Run 'npm run build' in the website directory to build the website`);
    
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