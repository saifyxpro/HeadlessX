/**
 * HeadlessX v1.3.0 Configuration
 * Enhanced centralized configuration management with anti-detection features
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
    // Server settings (Enhanced)
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || '0.0.0.0',
        authToken: process.env.AUTH_TOKEN,
        adminToken: process.env.ADMIN_TOKEN,
        profileToken: process.env.PROFILE_MANAGEMENT_TOKEN,
        startTime: new Date(),
        nodeEnv: process.env.NODE_ENV || 'development'
    },

    // Enhanced Browser settings v1.3.0
    browser: {
        headless: process.env.BROWSER_HEADLESS !== 'false',
        timeout: parseInt(process.env.BROWSER_TIMEOUT) || 90000,
        extraWaitTime: parseInt(process.env.BROWSER_EXTRA_WAIT) || 10000,
        maxConcurrency: parseInt(process.env.BROWSER_MAX_CONCURRENCY) || 3,
        navigationTimeout: parseInt(process.env.BROWSER_NAVIGATION_TIMEOUT) || 60000,
        antiBotRetryDelay: parseInt(process.env.BROWSER_ANTIBOT_RETRY_DELAY) || 5000,
        // v1.3.0 New settings
        poolSize: parseInt(process.env.BROWSER_POOL_SIZE) || 5,
        contextReuse: process.env.CONTEXT_REUSE !== 'false',
        instancePooling: process.env.BROWSER_INSTANCE_POOLING !== 'false',
        maxInstances: parseInt(process.env.MAX_BROWSER_INSTANCES) || 10,
        cleanupThreshold: parseFloat(process.env.INSTANCE_CLEANUP_THRESHOLD) || 0.8
    },

    // v1.3.0 Anti-Detection Configuration
    antiDetection: {
        // Core stealth settings
        stealthMode: process.env.STEALTH_MODE || 'advanced', // basic, advanced, maximum
        consistencyCheck: process.env.STEALTH_CONSISTENCY_CHECK !== 'false',
        validation: process.env.STEALTH_VALIDATION !== 'false',

        // Fingerprint settings
        fingerprintProfile: process.env.FINGERPRINT_PROFILE || 'desktop-chrome',
        profileRotation: process.env.PROFILE_ROTATION_ENABLED === 'true',
        profileRotationInterval: parseInt(process.env.PROFILE_ROTATION_INTERVAL) || 3600000,
        customProfilesPath: process.env.CUSTOM_PROFILES_PATH || './src/config/profiles',

        // Behavioral simulation
        behavioralSimulation: process.env.BEHAVIORAL_SIMULATION !== 'disabled',
        mouseMovementNatural: process.env.MOUSE_MOVEMENT_NATURAL !== 'false',
        keyboardDynamics: process.env.KEYBOARD_DYNAMICS !== 'false',
        scrollBehavior: process.env.SCROLL_BEHAVIOR || 'natural',
        attentionSimulation: process.env.ATTENTION_SIMULATION !== 'false',
        microMovements: process.env.MICRO_MOVEMENTS !== 'false',

        // Advanced fingerprinting controls
        webrtcLeakProtection: process.env.WEBRTC_LEAK_PROTECTION !== 'disabled',
        canvasNoiseLevel: process.env.CANVAS_NOISE_LEVEL || 'medium',
        webglSpoofing: process.env.WEBGL_SPOOFING !== 'disabled',
        audioFingerprintNoise: process.env.AUDIO_FINGERPRINT_NOISE !== 'disabled',
        hardwareSpoofing: process.env.HARDWARE_SPOOFING !== 'disabled',
        timezoneIntelligence: process.env.TIMEZONE_INTELLIGENCE !== 'disabled',

        // Geolocation intelligence
        geolocationConsistency: process.env.GEOLOCATION_CONSISTENCY !== 'disabled',
        autoTimezoneMatching: process.env.AUTO_TIMEZONE_MATCHING !== 'false',
        languageHeaderCorrelation: process.env.LANGUAGE_HEADER_CORRELATION !== 'false',
        currencyLocaleMatching: process.env.CURRENCY_LOCALE_MATCHING !== 'false',
        ispFingerprintProfiles: process.env.ISP_FINGERPRINT_PROFILES !== 'false',

        // Additional spoofing controls
        fontFingerprintControl: process.env.FONT_FINGERPRINT_CONTROL !== 'disabled',
        mediaDeviceSpoofing: process.env.MEDIA_DEVICE_SPOOFING !== 'disabled',
        navigatorPropsSpoofing: process.env.NAVIGATOR_PROPS_SPOOFING !== 'disabled',
        clientRectsSpoofing: process.env.CLIENT_RECTS_SPOOFING !== 'disabled',
        speechSynthesisSpoofing: process.env.SPEECH_SYNTHESIS_SPOOFING !== 'disabled'
    },

    // WAF Bypass Configuration
    wafBypass: {
        cloudflareBypass: process.env.CLOUDFLARE_BYPASS !== 'disabled',
        datadomeEvasion: process.env.DATADOME_EVASION !== 'disabled',
        incapsulaBypass: process.env.INCAPSULA_BYPASS !== 'disabled',
        akamaiBypass: process.env.AKAMAI_BYPASS !== 'disabled',
        tlsFingerprintMasking: process.env.TLS_FINGERPRINT_MASKING !== 'disabled',
        http2FingerprintSpoofing: process.env.HTTP2_FINGERPRINT_SPOOFING !== 'disabled',

        // Header manipulation
        userAgentRotation: process.env.USER_AGENT_ROTATION !== 'disabled',
        headerOrderRandomization: process.env.HEADER_ORDER_RANDOMIZATION !== 'false',
        acceptHeaderVariation: process.env.ACCEPT_HEADER_VARIATION !== 'false',
        acceptLanguageIntelligence: process.env.ACCEPT_LANGUAGE_INTELLIGENCE !== 'false',
        secChUaSpoofing: process.env.SEC_CH_UA_SPOOFING !== 'disabled',

        // Timing controls
        requestTimingRandomization: process.env.REQUEST_TIMING_RANDOMIZATION !== 'false',
        responseDelaySimulation: process.env.RESPONSE_DELAY_SIMULATION !== 'false',
        networkLatencySimulation: process.env.NETWORK_LATENCY_SIMULATION === 'true',
        resourceLoadingDelays: process.env.RESOURCE_LOADING_DELAYS !== 'false'
    },

    // Enhanced Rate limiting v1.3.0
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        perToken: process.env.RATE_LIMIT_PER_TOKEN !== 'false',
        skipSuccessful: process.env.RATE_LIMIT_SKIP_SUCCESSFUL === 'true',
        message: 'Too many requests from this IP, please try again later.'
    },

    // Enhanced API settings v1.3.0
    api: {
        bodyLimit: process.env.API_BODY_LIMIT || '50mb',
        maxBatchUrls: parseInt(process.env.API_MAX_BATCH_URLS) || 10,
        defaultReturnPartialOnTimeout: process.env.API_DEFAULT_PARTIAL_TIMEOUT === 'true',
        requestBatching: process.env.REQUEST_BATCHING !== 'false',
        responseCaching: process.env.RESPONSE_CACHING !== 'false'
    },

    // Enhanced Security settings v1.3.0
    security: {
        corsEnabled: process.env.CORS_ENABLED !== 'false',
        allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'],
        helmetEnabled: process.env.HELMET_ENABLED !== 'false',
        secureProfileStorage: process.env.SECURE_PROFILE_STORAGE !== 'false',
        memoryCleanupInterval: parseInt(process.env.MEMORY_CLEANUP_INTERVAL) || 300000,
        auditTrailEnabled: process.env.AUDIT_TRAIL_ENABLED !== 'false'
    },

    // Testing & Monitoring v1.3.0
    testing: {
        detectionTesting: process.env.DETECTION_TESTING !== 'disabled',
        automatedBotTests: process.env.AUTOMATED_BOT_TESTS === 'true',
        fingerprintValidation: process.env.FINGERPRINT_VALIDATION !== 'disabled',
        successRateMonitoring: process.env.SUCCESS_RATE_MONITORING !== 'false',
        testMode: process.env.TEST_MODE === 'true',
        mockBrowserResponses: process.env.MOCK_BROWSER_RESPONSES === 'true',
        skipActualRequests: process.env.SKIP_ACTUAL_REQUESTS === 'true',
        testFingerprintConsistency: process.env.TEST_FINGERPRINT_CONSISTENCY === 'true'
    },

    // Performance Monitoring v1.3.0
    performance: {
        monitoring: process.env.PERFORMANCE_MONITORING !== 'disabled',
        resourceUsageTracking: process.env.RESOURCE_USAGE_TRACKING !== 'false',
        responseTimeLogging: process.env.RESPONSE_TIME_LOGGING !== 'false',
        memoryLeakDetection: process.env.MEMORY_LEAK_DETECTION !== 'false',
        memoryOptimization: process.env.MEMORY_OPTIMIZATION || 'normal', // normal, aggressive
        cpuUsageControl: process.env.CPU_USAGE_CONTROL || 'adaptive', // fixed, adaptive
        networkOptimization: process.env.NETWORK_OPTIMIZATION !== 'disabled',

        // Scaling and concurrency
        smartLoadBalancing: process.env.SMART_LOAD_BALANCING !== 'false',
        adaptiveScaling: process.env.ADAPTIVE_SCALING !== 'false',
        profileQueueManagement: process.env.PROFILE_QUEUE_MANAGEMENT !== 'disabled'
    },

    // Enhanced Logging v1.3.0
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        debug: process.env.DEBUG === 'true',
        filePath: process.env.LOG_FILE_PATH || './logs/headlessx.log',
        rotation: process.env.LOG_ROTATION !== 'false',
        maxSize: process.env.LOG_MAX_SIZE || '10MB',
        maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,

        // Advanced logging features
        fingerprintChangeTracking: process.env.FINGERPRINT_CHANGE_TRACKING !== 'false',
        detectionAttemptLogging: process.env.DETECTION_ATTEMPT_LOGGING !== 'false',
        profileUsageAnalytics: process.env.PROFILE_USAGE_ANALYTICS !== 'false',
        errorCategorization: process.env.ERROR_CATEGORIZATION || 'basic', // basic, enhanced

        // Debug configurations
        verboseLogging: process.env.VERBOSE_LOGGING === 'true',
        fingerprintDebug: process.env.FINGERPRINT_DEBUG === 'true',
        stealthDebug: process.env.STEALTH_DEBUG === 'true',
        performanceDebug: process.env.PERFORMANCE_DEBUG === 'true',
        behavioralDebug: process.env.BEHAVIORAL_DEBUG === 'true'
    },

    // Development Tools v1.3.0
    development: {
        devToolsEnabled: process.env.DEV_TOOLS_ENABLED === 'true',
        interactiveFingerprintTesting: process.env.INTERACTIVE_FINGERPRINT_TESTING === 'true',
        profileGeneratorEnabled: process.env.PROFILE_GENERATOR_ENABLED === 'true',
        detectionCheckerEnabled: process.env.DETECTION_CHECKER_ENABLED === 'true'
    },

    // Website settings (Legacy - Maintained)
    website: {
        enabled: process.env.WEBSITE_ENABLED !== 'false',
        path: path.join(__dirname, '..', '..', 'website', 'out')
    },

    // Domain configuration (Legacy - Maintained)
    domain: {
        main: process.env.DOMAIN || 'localhost',
        subdomain: process.env.SUBDOMAIN || 'headlessx',
        apiUrl: process.env.NEXT_PUBLIC_API_URL || `http://localhost:${process.env.PORT || 3000}`,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:${process.env.PORT || 3000}`
    }
};

module.exports = config;
