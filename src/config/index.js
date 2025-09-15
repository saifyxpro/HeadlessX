/**
 * HeadlessX Configuration
 * Centralized configuration management for the application
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env file if it exists
function loadEnvironmentVariables() {
    try {
        const envPath = path.join(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const envFile = fs.readFileSync(envPath, 'utf8');
            envFile.split('\n').forEach(line => {
                // Skip comments and empty lines
                if (line.trim() === '' || line.trim().startsWith('#')) {
                    return;
                }
                
                const equalIndex = line.indexOf('=');
                if (equalIndex > 0) {
                    const key = line.substring(0, equalIndex).trim();
                    const value = line.substring(equalIndex + 1).trim();
                    
                    // Remove quotes if present
                    const cleanValue = value.replace(/^["']|["']$/g, '');
                    
                    if (key && !process.env[key]) {
                        process.env[key] = cleanValue;
                    }
                }
            });
            console.log('✅ Environment variables loaded from .env file');
        }
    } catch (error) {
        console.log('⚠️ Could not load .env file:', error.message);
    }
}

// Initialize environment variables
loadEnvironmentVariables();

// Validate required environment variables
function validateConfig() {
    if (!process.env.AUTH_TOKEN) {
        console.error('❌ SECURITY ERROR: AUTH_TOKEN environment variable is required!');
        console.error('   Please set a secure random token: export AUTH_TOKEN="your_secure_random_token_here"');
        console.error('   Generate one with: openssl rand -hex 32');
        process.exit(1);
    }
}

// Validate configuration on startup
validateConfig();

// Application configuration
const config = {
    // Server settings
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || '0.0.0.0',
        authToken: process.env.AUTH_TOKEN,
        startTime: new Date()
    },

    // Browser settings
    browser: {
        headless: process.env.BROWSER_HEADLESS !== 'false',
        timeout: parseInt(process.env.BROWSER_TIMEOUT) || 120000,
        extraWaitTime: parseInt(process.env.BROWSER_EXTRA_WAIT) || 15000,
        maxConcurrency: parseInt(process.env.BROWSER_MAX_CONCURRENCY) || 3
    },

    // Rate limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.'
    },

    // API settings
    api: {
        bodyLimit: process.env.API_BODY_LIMIT || '50mb',
        maxBatchUrls: parseInt(process.env.API_MAX_BATCH_URLS) || 10,
        defaultReturnPartialOnTimeout: process.env.API_DEFAULT_PARTIAL_TIMEOUT === 'true'
    },

    // Security settings
    security: {
        corsEnabled: process.env.CORS_ENABLED !== 'false',
        allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'],
        helmetEnabled: process.env.HELMET_ENABLED !== 'false'
    },

    // Logging
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        debug: process.env.DEBUG === 'true'
    },

    // Website settings
    website: {
        enabled: process.env.WEBSITE_ENABLED !== 'false',
        path: path.join(__dirname, '..', '..', 'website', 'out')
    }
};

module.exports = config;