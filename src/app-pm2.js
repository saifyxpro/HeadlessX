/**
 * HeadlessX v1.2.0 - PM2 Compatible Server
 * Minimal version designed specifically for PM2 deployment
 */

console.log('🔍 PM2: Starting PM2-optimized server...');

// Basic requires with error handling
let express, config;

try {
    express = require('express');
    console.log('🔍 PM2: Express loaded');

    // bodyParser = require('body-parser'); // Not used
    console.log('🔍 PM2: BodyParser loaded');

    config = require('./config');
    console.log('🔍 PM2: Config loaded');
} catch (error) {
    console.error('❌ PM2: Failed to load basic modules:', error);
    process.exit(1);
}

const app = express();

// Minimal middleware only
app.use(express.json({ limit: '5mb' }));
console.log('🔍 PM2: Basic JSON middleware configured');

// Essential headers only
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});
console.log('🔍 PM2: Security headers configured');

// Health endpoint (essential for PM2)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        pm2_optimized: true,
        version: '1.2.0'
    });
});
console.log('🔍 PM2: Health endpoint configured');

// Simple status endpoint
app.get('/api/status', (req, res) => {
    res.json({
        server: 'HeadlessX v1.2.0',
        status: 'running',
        pm2_mode: true,
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});
console.log('🔍 PM2: Status endpoint configured');

// Simple home page
app.get('/', (req, res) => {
    res.json({
        message: 'HeadlessX v1.2.0 - PM2 Optimized Mode',
        status: 'running',
        endpoints: {
            health: '/api/health',
            status: '/api/status'
        }
    });
});
console.log('🔍 PM2: Home endpoint configured');

// Error handler
app.use((error, req, res, _next) => {
    console.error('❌ PM2: Request error:', error);
    res.status(500).json({ error: 'Internal Server Error', pm2_mode: true });
});
console.log('🔍 PM2: Error handler configured');

// Start server with PM2-specific configuration
function startPM2Server() {
    console.log('🔍 PM2: Starting HTTP server...');

    const server = app.listen(config.server.port, config.server.host, () => {
        console.log('🚀 PM2: ✅ SERVER STARTED SUCCESSFULLY!');
        console.log(`🚀 PM2: HeadlessX v1.2.0 running on port ${config.server.port}`);
        console.log(`🌐 PM2: Health check: http://localhost:${config.server.port}/api/health`);
        console.log(`📊 PM2: Status: http://localhost:${config.server.port}/api/status`);
        console.log('🎯 PM2: Server is ready for requests');
    });

    server.on('error', (error) => {
        console.error('❌ PM2: Server error:', error);
        process.exit(1);
    });

    // PM2 graceful shutdown
    process.on('SIGINT', () => {
        console.log('🛑 PM2: Received SIGINT, shutting down...');
        server.close(() => {
            console.log('✅ PM2: Server closed gracefully');
            process.exit(0);
        });
    });

    process.on('SIGTERM', () => {
        console.log('🛑 PM2: Received SIGTERM, shutting down...');
        server.close(() => {
            console.log('✅ PM2: Server closed gracefully');
            process.exit(0);
        });
    });
}

// Initialize server
if (require.main === module) {
    console.log('🔍 PM2: Initializing PM2-optimized server...');

    // Add small delay for PM2 stability
    setTimeout(() => {
        try {
            startPM2Server();
        } catch (error) {
            console.error('❌ PM2: Startup failed:', error);
            process.exit(1);
        }
    }, 100);
}

module.exports = app;
