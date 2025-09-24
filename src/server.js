/**
 * HeadlessX v1.2.0 Server Entry Point
 *
 * Main entry point for PM2 and production deployments
 */

console.log('🔄 HeadlessX Server Starting...');

// Validate Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 18) {
    console.error(`❌ Node.js ${nodeVersion} is not supported. Please use Node.js 18 or higher.`);
    process.exit(1);
}

// Validate environment
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
    console.log('🔧 NODE_ENV not set, defaulting to production');
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Load and start the main application
try {
    require('./app');
} catch (error) {
    console.error('❌ Failed to start HeadlessX:', error);
    process.exit(1);
}
