/**
 * HeadlessX v1.2.0 - Minimal Server for Debugging
 * This version removes all potential blocking operations
 */

console.log('🔍 STEP 1: Starting minimal server...');

const express = require('express');
console.log('🔍 STEP 2: Express loaded');

const app = express();
console.log('🔍 STEP 3: Express app created');

// Minimal middleware
app.use(express.json({ limit: '10mb' }));
console.log('🔍 STEP 4: Basic middleware configured');

// Simple health endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        minimal: true
    });
});
console.log('🔍 STEP 5: Health endpoint configured');

// Error handler
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
});
console.log('🔍 STEP 6: Error handler configured');

// Start server function
function startMinimalServer() {
    console.log('🔍 STEP 7: Starting HTTP server...');

    const server = app.listen(3000, '0.0.0.0', () => {
        console.log('🔍 STEP 8: ✅ MINIMAL SERVER STARTED SUCCESSFULLY!');
        console.log('🔍 STEP 9: Server running on http://localhost:3000');
        console.log('🔍 STEP 10: Health check: http://localhost:3000/api/health');
    });

    server.on('error', (error) => {
        console.error('🔍 STEP ERROR: Server error:', error);
        process.exit(1);
    });
}

// Check if this is the main module
if (require.main === module) {
    console.log('🔍 STEP 11: Initializing minimal server...');
    try {
        startMinimalServer();
    } catch (error) {
        console.error('🔍 STEP ERROR: Startup failed:', error);
        process.exit(1);
    }
}

module.exports = app;
