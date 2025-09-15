/**
 * HeadlessX v1.2.0 - Advanced Browserless Web Scraping API with Human-like Behavior
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
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Error categorization system for proper handling
class HeadlessXError extends Error {
    constructor(message, category = 'unknown', isRecoverable = false, originalError = null) {
        super(message);
        this.name = 'HeadlessXError';
        this.category = category; // 'network', 'timeout', 'validation', 'resource', 'browser', 'script'
        this.isRecoverable = isRecoverable;
        this.originalError = originalError;
        this.timestamp = new Date().toISOString();
    }
}

// Error categories for classification
const ERROR_CATEGORIES = {
    NETWORK: 'network',           // Network connectivity issues
    TIMEOUT: 'timeout',           // Operation timeouts
    VALIDATION: 'validation',     // Input validation failures
    RESOURCE: 'resource',         // Resource exhaustion (memory, browser contexts)
    BROWSER: 'browser',           // Browser/page issues
    SCRIPT: 'script',            // JavaScript execution errors
    AUTHENTICATION: 'auth',       // Authentication failures
    RATE_LIMIT: 'rate_limit'     // Rate limiting errors
};

// Enhanced logging system with error categorization
function createStructuredLogger() {
    return {
        info: (requestId, message, data = {}) => {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] [${requestId}] [INFO] ${message}`, 
                Object.keys(data).length > 0 ? JSON.stringify(data) : '');
        },
        warn: (requestId, message, data = {}) => {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] [${requestId}] [WARN] ${message}`, 
                Object.keys(data).length > 0 ? JSON.stringify(data) : '');
        },
        error: (requestId, message, error = null, data = {}) => {
            const timestamp = new Date().toISOString();
            const errorInfo = error ? {
                message: error.message,
                category: error.category || 'unknown',
                isRecoverable: error.isRecoverable || false,
                stack: error.stack
            } : {};
            console.error(`[${timestamp}] [${requestId}] [ERROR] ${message}`, 
                JSON.stringify({ ...errorInfo, ...data }));
        },
        debug: (requestId, message, data = {}) => {
            if (process.env.DEBUG === 'true') {
                const timestamp = new Date().toISOString();
                console.log(`[${timestamp}] [${requestId}] [DEBUG] ${message}`, 
                    Object.keys(data).length > 0 ? JSON.stringify(data) : '');
            }
        }
    };
}

const logger = createStructuredLogger();

// Generate unique request ID for correlation
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Enhanced error handler for proper categorization and response
function handleError(error, requestId, context = '') {
    let categorizedError;
    
    if (error instanceof HeadlessXError) {
        categorizedError = error;
    } else {
        // Categorize common errors
        let category = ERROR_CATEGORIES.BROWSER;
        let isRecoverable = false;
        
        if (error.message.includes('timeout') || error.name === 'TimeoutError') {
            category = ERROR_CATEGORIES.TIMEOUT;
            isRecoverable = true;
        } else if (error.message.includes('net::') || error.message.includes('NetworkError')) {
            category = ERROR_CATEGORIES.NETWORK;
            isRecoverable = true;
        } else if (error.message.includes('Script') || error.message.includes('evaluate')) {
            category = ERROR_CATEGORIES.SCRIPT;
            isRecoverable = false;
        } else if (error.message.includes('Memory') || error.message.includes('context')) {
            category = ERROR_CATEGORIES.RESOURCE;
            isRecoverable = true;
        }
        
        categorizedError = new HeadlessXError(
            error.message,
            category,
            isRecoverable,
            error
        );
    }
    
    logger.error(requestId, `${context}: ${categorizedError.message}`, categorizedError);
    
    return categorizedError;
}

// Load environment variables if .env file exists
try {
    if (fs.existsSync('.env')) {
        const envFile = fs.readFileSync('.env', 'utf8');
        envFile.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value && !process.env[key]) {
                process.env[key] = value.trim();
            }
        });
    }
} catch (error) {
    console.log('⚠️ Could not load .env file:', error.message);
}

const app = express();

// Import and configure rate limiter
const rateLimiter = require('./rate-limiter');

// Apply rate limiting before other middleware
app.use('/api', rateLimiter.middleware());

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Global error handler middleware
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error', 
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;

// Security: Require TOKEN environment variable - no default for production
if (!process.env.TOKEN) {
    console.error('❌ SECURITY ERROR: TOKEN environment variable is required!');
    console.error('   Please set a secure random token: export TOKEN="your_secure_random_token_here"');
    console.error('   Generate one with: openssl rand -hex 32');
    process.exit(1);
}
const AUTH_TOKEN = process.env.TOKEN;

// Server startup time
const serverStartTime = new Date();

// DESKTOP-ONLY Chrome User Agents Pool - No Mobile, No Other Browsers
const REALISTIC_USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
];

// Realistic Windows locales and languages
const REALISTIC_LOCALES = [
    { locale: 'en-US', timezone: 'America/New_York', languages: ['en-US', 'en'] },
    { locale: 'en-GB', timezone: 'Europe/London', languages: ['en-GB', 'en'] }
];

// Function to get random realistic user agent
function getRandomUserAgent() {
    return REALISTIC_USER_AGENTS[Math.floor(Math.random() * REALISTIC_USER_AGENTS.length)];
}

// Function to get random locale settings
function getRandomLocale() {
    return REALISTIC_LOCALES[Math.floor(Math.random() * REALISTIC_LOCALES.length)];
}

// Function to generate CHROME-ONLY realistic headers (no mobile detection)
function generateRealisticHeaders(userAgent, customHeaders = {}) {
    // Extract Chrome version from user agent
    const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
    const chromeVersion = chromeMatch ? chromeMatch[1] : '129';
    
    const baseHeaders = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Cache-Control': 'max-age=0',
        'Upgrade-Insecure-Requests': '1',
        'Connection': 'keep-alive',
        // FORCE CHROME DESKTOP HEADERS ONLY
        'sec-ch-ua': `"Google Chrome";v="${chromeVersion}", "Not=A?Brand";v="8", "Chromium";v="${chromeVersion}"`,
        'sec-ch-ua-mobile': '?0',  // CRITICAL: Force desktop
        'sec-ch-ua-platform': '"Windows"',
        'sec-ch-ua-platform-version': '"15.0.0"',
        'sec-ch-ua-arch': '"x86"',
        'sec-ch-ua-bitness': '"64"',
        'sec-ch-ua-full-version-list': `"Google Chrome";v="${chromeVersion}.0.6668.70", "Not=A?Brand";v="8.0.0.0", "Chromium";v="${chromeVersion}.0.6668.70"`,
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1'
    };

    // Remove any random headers that might trigger mobile detection
    // Always include essential desktop-only headers

    // Merge with custom headers (custom headers take priority)
    return { ...baseHeaders, ...customHeaders };
}

// Browser pool for better performance and isolation
let browserInstance = null;
const activeContexts = new Set(); // Track active contexts to prevent memory leaks

// Initialize persistent browser with better error handling
async function getBrowser() {
    if (!browserInstance || !browserInstance.isConnected()) {
        console.log('🚀 Launching new realistic browser instance...');
        try {
            browserInstance = await chromium.launch({
                headless: true,
                args: [
                    // Security & Sandboxing (required for servers)
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    
                    // Stealth & Anti-Detection
                    '--disable-blink-features=AutomationControlled',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-component-extensions-with-background-pages',
                    '--no-default-browser-check',
                    '--no-first-run',
                    '--disable-default-apps',
                    '--disable-extensions',
                    '--disable-plugins-discovery',
                    '--disable-prompt-on-repost',
                    '--disable-hang-monitor',
                    '--disable-ipc-flooding-protection',
                    '--disable-popup-blocking',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-background-timer-throttling',
                    '--disable-renderer-backgrounding',
                    '--disable-field-trial-config',
                    '--disable-back-forward-cache',
                    
                    // Performance & Memory
                    '--memory-pressure-off',
                    '--disable-client-side-phishing-detection',
                    '--disable-sync',
                    '--disable-translate',
                    '--disable-background-networking',
                    '--disable-domain-reliability',
                    '--disable-component-update',
                    '--disable-features=TranslateUI',
                    '--disable-features=BlinkGenPropertyTrees',
                    
                    // Media & Hardware
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--disable-gpu-sandbox',
                    '--disable-software-rasterizer',
                    '--disable-gl-drawing-for-tests',
                    '--no-zygote',
                    
                    // Realistic Windows Chrome flags
                    '--enable-features=NetworkService,NetworkServiceInProcess',
                    '--enable-automation=false',
                    '--password-store=basic',
                    '--use-mock-keychain',
                    '--disable-web-security', // Only for scraping
                    
                    // Window & Display settings
                    '--force-device-scale-factor=1',
                    '--hide-scrollbars',
                    '--mute-audio',
                    '--disable-logging',
                    '--disable-gpu-logging',
                    '--silent',
                    '--log-level=3',
                    '--disable-dev-tools',
                    
                    // Network & Privacy
                    '--disable-features=VizDisplayCompositor,VizHitTestSurfaceLayer',
                    '--disable-breakpad',
                    '--disable-crash-reporter',
                    '--disable-metrics',
                    '--disable-metrics-reporting',
                    '--no-report-upload',
                    
                    // Additional stealth
                    '--user-agent-override-header', // Will be set by context
                    '--disable-automation',
                    '--exclude-switches=enable-automation',
                    '--disable-blink-features=AutomationControlled'
                ],
                // Additional launch options for realism
                ignoreDefaultArgs: [
                    '--enable-automation',
                    '--enable-blink-features=IdleDetection'
                ],
                env: {
                    ...process.env,
                    // Remove automation indicators from environment
                    'PLAYWRIGHT_DOWNLOAD_HOST': undefined,
                    'PLAYWRIGHT_BROWSERS_PATH': undefined
                }
            });
            console.log('✅ Realistic browser launched successfully');
            
            // Handle browser disconnect
            browserInstance.on('disconnected', () => {
                console.log('⚠️ Browser disconnected, cleaning up contexts...');
                browserInstance = null;
                // Clean up active contexts
                activeContexts.clear();
            });
            
        } catch (error) {
            console.error('❌ Failed to launch browser:', error);
            throw new Error(`Browser launch failed: ${error.message}`);
        }
    }
    return browserInstance;
}

// Clean context management function
async function createIsolatedContext(browser, options = {}) {
    const context = await browser.newContext(options);
    activeContexts.add(context);
    
    // Auto-cleanup on close
    context.on('close', () => {
        activeContexts.delete(context);
    });
    
    return context;
}

// Safe context cleanup
async function safeCloseContext(context, requestId) {
    if (context && !context._closed) {
        try {
            await context.close();
            activeContexts.delete(context);
            logWithId(requestId, 'debug', 'Context closed successfully');
        } catch (error) {
            logWithId(requestId, 'error', 'Failed to close context', { error: error.message });
        }
    }
}

// Enhanced timeout handler function with anti-bot detection fallback
async function withTimeoutFallback(asyncOperation, fallbackOperation = null, timeoutMs = 30000) {
    return new Promise(async (resolve, reject) => {
        let completed = false;
        
        // Set timeout with shorter intervals for anti-bot sites
        const timeoutId = setTimeout(() => {
            if (!completed) {
                completed = true;
                console.log(`⏰ Operation timed out after ${timeoutMs}ms, attempting fallback...`);
                if (fallbackOperation) {
                    fallbackOperation().then(resolve).catch(reject);
                } else {
                    // Provide partial content instead of complete failure
                    reject(new HeadlessXError(
                        `Operation timed out after ${timeoutMs}ms - site may have anti-bot protection`,
                        'TIMEOUT',
                        'timeout',
                        { suggestion: 'Try with a different URL or reduce timeout', timeout: timeoutMs }
                    ));
                }
            }
        }, timeoutMs);
        
        try {
            const result = await asyncOperation();
            if (!completed) {
                completed = true;
                clearTimeout(timeoutId);
                resolve(result);
            }
        } catch (error) {
            if (!completed) {
                completed = true;
                clearTimeout(timeoutId);
                
                // Check if this is an anti-bot detection error
                const isAntiBotError = error.message.includes('net::ERR_FAILED') || 
                                     error.message.includes('Navigation timeout') ||
                                     error.message.includes('Timeout') ||
                                     error.message.includes('blocked');
                
                if (isAntiBotError) {
                    console.log(`🤖 Possible anti-bot detection: ${error.message}, attempting fallback...`);
                } else {
                    console.log(`❌ Operation failed: ${error.message}, attempting fallback...`);
                }
                
                if (fallbackOperation) {
                    try {
                        const fallbackResult = await fallbackOperation();
                        resolve(fallbackResult);
                    } catch (fallbackError) {
                        reject(error); // Return original error
                    }
                } else {
                    reject(error);
                }
            }
        }
    });
}

// Advanced page rendering function with timeout handling
async function renderPageAdvanced(options) {
    const {
        url,
        waitUntil = 'networkidle',
        timeout = 120000, // Increased from 60000 to 120000ms
        extraWaitTime = 15000, // Increased from 10000 to 15000ms
        userAgent,
        cookies = [],
        headers = {},
        viewport = { width: 1920, height: 1080 },
        scrollToBottom = true,
        waitForSelectors = [],
        clickSelectors = [],
        removeElements = [],
        customScript = null,
        waitForNetworkIdle = true,
        captureConsole = false,
        returnPartialOnTimeout = false, // Changed default to false - prioritize complete execution
        fullPage = false,
        screenshotPath = null,
        screenshotFormat = 'png',
        pdfPath = null,
        pdfFormat = 'A4'
    } = options;

    const browser = await getBrowser();
    let context = null;
    let page = null;
    const consoleLogs = [];
    let wasTimeout = false;

    try {
        // Get realistic user agent and locale settings
        // Force high-end desktop user agent to get full desktop version
        const realisticUserAgent = userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';
        const realisticLocale = getRandomLocale();
        const realisticHeaders = generateRealisticHeaders(realisticUserAgent, headers);
        
        console.log(`🎭 Using User Agent: ${realisticUserAgent.substring(0, 80)}...`);
        console.log(`🌍 Using Locale: ${realisticLocale.locale} (${realisticLocale.timezone})`);
        
        // Create new browser context with PERFECT CHROME DESKTOP HEADERS
        context = await browser.newContext({
            viewport: { width: 1920, height: 1080 }, // Large desktop viewport
            userAgent: realisticUserAgent,
            locale: 'en-US', // Force English US
            timezoneId: 'America/New_York',
            extraHTTPHeaders: {
                // CRITICAL: Perfect Chrome 129 header order and values
                'sec-ch-ua': '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'Upgrade-Insecure-Requests': '1',
                'User-Agent': realisticUserAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-User': '?1',
                'Sec-Fetch-Dest': 'document',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive',
                // ENTERPRISE: Additional Chrome-specific headers that Schema.org checks
                'sec-ch-ua-arch': '"x86"',
                'sec-ch-ua-bitness': '"64"',
                'sec-ch-ua-full-version': '"129.0.6668.89"',
                'sec-ch-ua-full-version-list': '"Google Chrome";v="129.0.6668.89", "Not=A?Brand";v="8.0.0.0", "Chromium";v="129.0.6668.89"',
                'sec-ch-ua-model': '""',
                'sec-ch-ua-platform-version': '"15.0.0"',
                'sec-ch-ua-wow64': '?0',
                'sec-ch-viewport-width': '1920',
                'sec-ch-viewport-height': '1080',
                'sec-ch-device-memory': '8',
                'sec-ch-dpr': '1',
                // CRITICAL: Add missing headers that real Chrome sends
                'sec-gpc': '1',
                'dnt': '1'
            },
            ignoreHTTPSErrors: true,
            javaScriptEnabled: true,
            // Enhanced permissions for better compatibility
            permissions: ['geolocation', 'notifications', 'camera', 'microphone', 'clipboard-read', 'clipboard-write'],
            colorScheme: 'light', // Force light mode for better CSS compatibility
            reducedMotion: 'no-preference', // Allow animations for proper rendering
            forcedColors: 'none',
            // Realistic screen settings - force desktop
            screen: {
                width: 1920,
                height: 1080
            },
            // Enhanced device features for better rendering - FORCE DESKTOP
            hasTouch: false,
            isMobile: false,
            deviceScaleFactor: 1, // Fixed scale for consistent CSS rendering
            // Critical: Enable bypass for CSP and security headers that block resources
            bypassCSP: true,
            // Accept all downloads for complete resource loading
            acceptDownloads: false,
            // Enhanced media settings for better compatibility
            recordVideo: undefined,
            recordHar: undefined
        });

        // Pre-seed Google consent cookie to bypass consent page for EU/UK
        try {
            if (url.includes('google.')) {
                const host = new URL(url).hostname.replace(/^www\./, '');
                const cookieDomain = '.' + host; // e.g., .google.com or .google.co.uk
                await context.addCookies([
                    {
                        name: 'CONSENT',
                        value: 'YES+CB.en+V14',
                        domain: cookieDomain,
                        path: '/',
                        httpOnly: false,
                        secure: true,
                        sameSite: 'None',
                        expires: Math.floor(Date.now() / 1000) + 3600 * 24 * 365
                    },
                    {
                        name: 'SOCS',
                        value: 'CAI',
                        domain: cookieDomain,
                        path: '/',
                        httpOnly: false,
                        secure: true,
                        sameSite: 'None',
                        expires: Math.floor(Date.now() / 1000) + 3600 * 24 * 365
                    }
                ]);
            }
        } catch (cookieErr) {
            console.log('⚠️ Failed to set Google consent cookies (continuing):', cookieErr.message);
        }

        // Add cookies if provided
        if (cookies.length > 0) {
            await context.addCookies(cookies);
        }

        // Create page
        page = await context.newPage();

        // ULTIMATE CHROME SPOOFING: Intercept ALL requests and inject perfect headers
        await page.route('**/*', async (route) => {
            const request = route.request();
            
            // CRITICAL: Perfect Chrome headers for Schema.org detection bypass
            const perfectChromeHeaders = {
                ...request.headers(),
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'accept-language': 'en-US,en;q=0.9',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'sec-ch-ua': '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-ch-ua-arch': '"x86"',
                'sec-ch-ua-bitness': '"64"',
                'sec-ch-ua-model': '""',
                'sec-ch-ua-platform-version': '"15.0.0"',
                'sec-ch-ua-full-version': '"129.0.6668.89"',
                'sec-ch-ua-wow64': '?0',
                'sec-fetch-dest': request.url().includes('.css') ? 'style' : 
                                 request.url().includes('.js') ? 'script' : 'document',
                'sec-fetch-mode': 'navigate',
                'sec-fetch-site': 'none',
                'sec-fetch-user': '?1',
                'upgrade-insecure-requests': '1',
                'cache-control': 'max-age=0',
                'dnt': '1',
                'connection': 'keep-alive'
            };

            // Remove automation headers that might leak
            delete perfectChromeHeaders['x-requested-with'];
            delete perfectChromeHeaders['pragma'];
            
            await route.continue({
                headers: perfectChromeHeaders
            });
        });

        // Set more reasonable timeouts to handle anti-bot sites
        page.setDefaultTimeout(45000); // Reduced from 60000ms to 45000ms
        page.setDefaultNavigationTimeout(Math.min(timeout, 60000)); // Cap navigation timeout at 60s

        // Capture console logs if requested
        if (captureConsole) {
            page.on('console', msg => {
                consoleLogs.push({
                    type: msg.type(),
                    text: msg.text(),
                    location: msg.location()
                });
            });
        }

    // GOOGLE-LEVEL ENTERPRISE STEALTH SCRIPT - Force Chrome Desktop Rendering
    await context.addInitScript(() => {
            // FORCE LATEST CHROME DESKTOP MODE - Zero mobile detection
            Object.defineProperty(navigator, 'userAgent', {
                get: () => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
                configurable: false
            });
            
            // ENTERPRISE-GRADE CHROME FINGERPRINTING
            Object.defineProperty(navigator, 'userAgentData', {
                get: () => ({
                    brands: [
                        { brand: 'Google Chrome', version: '129' },
                        { brand: 'Not=A?Brand', version: '8' },
                        { brand: 'Chromium', version: '129' }
                    ],
                    mobile: false,
                    platform: 'Windows',
                    getHighEntropyValues: async () => ({
                        architecture: 'x86',
                        bitness: '64',
                        brands: [
                            { brand: 'Google Chrome', version: '129' },
                            { brand: 'Not=A?Brand', version: '8' },
                            { brand: 'Chromium', version: '129' }
                        ],
                        fullVersionList: [
                            { brand: 'Google Chrome', version: '129.0.6668.70' },
                            { brand: 'Not=A?Brand', version: '8.0.0.0' },
                            { brand: 'Chromium', version: '129.0.6668.70' }
                        ],
                        mobile: false,
                        model: '',
                        platform: 'Windows',
                        platformVersion: '15.0.0',
                        uaFullVersion: '129.0.6668.70',
                        wow64: false
                    })
                }),
                configurable: true
            });
            
            // COMPLETE AUTOMATION REMOVAL
            delete navigator.__proto__.webdriver;
            delete navigator.webdriver;
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
                configurable: true
            });

            // Remove all automation indicators
            [
                'cdc_adoQpoasnfa76pfcZLmcfl_Array', 'cdc_adoQpoasnfa76pfcZLmcfl_Promise', 'cdc_adoQpoasnfa76pfcZLmcfl_Symbol',
                '__playwright', '__pw_manual', '__pw_originals',
                '__webdriver_evaluate', '__selenium_evaluate', '__webdriver_script_function', '__webdriver_script_func', '__webdriver_script_fn', '__fxdriver_evaluate', '__driver_unwrapped', '__webdriver_unwrapped', '__driver_evaluate', '__selenium_unwrapped', '__fxdriver_unwrapped'
            ].forEach(prop => {
                delete window[prop];
            });
            
            // AGGRESSIVE DESKTOP SCREEN FORCING (4K Desktop)
            Object.defineProperty(screen, 'width', {
                get: () => 1920,
                configurable: true
            });
            Object.defineProperty(screen, 'height', {
                get: () => 1080,
                configurable: true
            });
            Object.defineProperty(screen, 'availWidth', {
                get: () => 1920,
                configurable: true
            });
            Object.defineProperty(screen, 'availHeight', {
                get: () => 1040,
                configurable: true
            });
            Object.defineProperty(screen, 'colorDepth', {
                get: () => 24,
                configurable: true
            });
            Object.defineProperty(screen, 'pixelDepth', {
                get: () => 24,
                configurable: true
            });
            
            // FORCE LARGE DESKTOP WINDOW
            Object.defineProperty(window, 'innerWidth', {
                get: () => 1920,
                configurable: true
            });
            Object.defineProperty(window, 'innerHeight', {
                get: () => 1080,
                configurable: true
            });
            Object.defineProperty(window, 'outerWidth', {
                get: () => 1920,
                configurable: true
            });
            Object.defineProperty(window, 'outerHeight', {
                get: () => 1080,
                configurable: true
            });
            
            // ZERO TOUCH/MOBILE CAPABILITY
            Object.defineProperty(navigator, 'maxTouchPoints', {
                get: () => 0,
                configurable: true
            });
            
            // ENTERPRISE MEDIA QUERY OVERRIDE - Force Desktop CSS
            const originalMatchMedia = window.matchMedia;
            window.matchMedia = function(query) {
                // FORCE ALL DESKTOP MEDIA QUERIES TO MATCH
                if (query.includes('min-width: 1200px') || query.includes('min-width: 1024px') || query.includes('min-width: 768px') || query.includes('min-width: 992px')) {
                    return { matches: true, media: query, addListener: () => {}, removeListener: () => {} };
                }
                // FORCE ALL MOBILE/SMALL SCREEN QUERIES TO FAIL
                if (query.includes('max-width') && (query.includes('767px') || query.includes('768px') || query.includes('1023px') || query.includes('991px'))) {
                    return { matches: false, media: query, addListener: () => {}, removeListener: () => {} };
                }
                // Force desktop orientation
                if (query.includes('orientation: portrait')) {
                    return { matches: false, media: query, addListener: () => {}, removeListener: () => {} };
                }
                if (query.includes('orientation: landscape')) {
                    return { matches: true, media: query, addListener: () => {}, removeListener: () => {} };
                }
                // Force high-resolution display
                if (query.includes('min-resolution') || query.includes('-webkit-min-device-pixel-ratio')) {
                    return { matches: true, media: query, addListener: () => {}, removeListener: () => {} };
                }
                return originalMatchMedia.call(this, query);
            };
            
            // FORCE DESKTOP CSS VIEWPORT
            const viewportMeta = document.querySelector('meta[name="viewport"]');
            if (viewportMeta) {
                viewportMeta.setAttribute('content', 'width=1920, initial-scale=1.0');
            } else {
                const meta = document.createElement('meta');
                meta.name = 'viewport';
                meta.content = 'width=1920, initial-scale=1.0';
                document.head?.appendChild(meta);
            }
            
            // SCHEMA.ORG SPECIFIC: Force desktop CSS overrides
            const schemaDesktopCSS = document.createElement('style');
            schemaDesktopCSS.id = 'schema-desktop-force';
            schemaDesktopCSS.textContent = `
                /* FORCE SCHEMA.ORG DESKTOP LAYOUT */
                body { 
                    min-width: 1920px !important; 
                    max-width: none !important;
                    width: 100% !important; 
                }
                
                /* Force desktop navigation */
                .navbar, .nav, header { 
                    display: block !important; 
                    width: 100% !important; 
                }
                
                /* Force desktop search box */
                .search-container, .search-box, input[type="search"] { 
                    display: block !important; 
                    width: auto !important; 
                    min-width: 300px !important; 
                }
                
                /* Hide mobile-only elements */
                .mobile-only, .d-block.d-md-none, .visible-xs { 
                    display: none !important; 
                }
                
                /* Show desktop-only elements */
                .desktop-only, .d-none.d-md-block, .hidden-xs { 
                    display: block !important; 
                }
                
                /* Force desktop grid system */
                .container, .container-fluid { 
                    max-width: none !important; 
                    width: 100% !important; 
                    padding: 0 15px !important; 
                }
                
                /* Override responsive breakpoints */
                @media (max-width: 767px) { 
                    .container { max-width: none !important; width: 100% !important; } 
                    .col-xs-*, .col-sm-*, .col-md-*, .col-lg-* { 
                        width: auto !important; 
                        float: left !important; 
                    }
                }
            `;
            document.head.appendChild(schemaDesktopCSS);
            
            // Override chrome runtime to appear more realistic
            if (!window.chrome) {
                window.chrome = {};
            }
            
            if (!window.chrome.runtime) {
                window.chrome.runtime = {
                    onConnect: undefined,
                    onMessage: undefined,
                    id: 'mmfbcljfglbokpmkimbfghdkjmjhdgbg' // Realistic extension ID
                };
            }

            // Enhanced plugins for better compatibility
            const plugins = [
                { name: 'PDF Viewer', description: 'Portable Document Format', filename: 'internal-pdf-viewer', length: 1 },
                { name: 'Chrome PDF Viewer', description: 'Portable Document Format', filename: 'internal-pdf-viewer', length: 1 }
            ];
            
            Object.defineProperty(navigator, 'plugins', {
                get: () => plugins,
                configurable: true
            });

            // Enhanced mimeTypes for better compatibility
            const mimeTypes = [
                { type: 'application/pdf', description: 'Portable Document Format', suffixes: 'pdf', enabledPlugin: plugins[0] },
                { type: 'text/css', description: 'CSS Stylesheet', suffixes: 'css', enabledPlugin: null },
                { type: 'text/html', description: 'HTML Document', suffixes: 'html,htm', enabledPlugin: null }
            ];
            Object.defineProperty(navigator, 'mimeTypes', {
                get: () => mimeTypes,
                configurable: true
            });

            // More realistic language settings
            const languages = ['en-US', 'en'];
            Object.defineProperty(navigator, 'languages', {
                get: () => languages,
                configurable: true
            });

            // Realistic hardware concurrency (modern Windows values)
            const cores = [8, 12, 16][Math.floor(Math.random() * 3)];
            Object.defineProperty(navigator, 'hardwareConcurrency', {
                get: () => cores,
                configurable: true
            });

            // Realistic device memory (modern Windows values)
            const memory = [8, 16, 32][Math.floor(Math.random() * 3)];
            Object.defineProperty(navigator, 'deviceMemory', {
                get: () => memory,
                configurable: true
            });

            // Enhanced connection information
            Object.defineProperty(navigator, 'connection', {
                get: () => ({
                    effectiveType: '4g',
                    rtt: 50,
                    downlink: 25,
                    saveData: false
                }),
                configurable: true
            });

            // Override permissions API to avoid blocking
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => {
                switch(parameters.name) {
                    case 'notifications':
                        return Promise.resolve({ state: 'default' });
                    case 'geolocation':
                        return Promise.resolve({ state: 'granted' });
                    default:
                        return originalQuery ? originalQuery.call(navigator.permissions, parameters) : Promise.resolve({ state: 'granted' });
                }
            };

            // Enhanced CSS and resource loading monitoring
            const originalFetch = window.fetch;
            window.fetch = function(...args) {
                const [resource] = args;
                if (typeof resource === 'string') {
                    if (resource.includes('.css')) {
                        console.debug('🎨 Loading CSS:', resource);
                    } else if (resource.includes('.js')) {
                        console.debug('📜 Loading JS:', resource);
                    }
                }
                return originalFetch.apply(this, args);
            };

            // Enhanced stylesheet monitoring
            const originalCreateElement = document.createElement;
            document.createElement = function(tagName) {
                const element = originalCreateElement.call(document, tagName);
                if (tagName.toLowerCase() === 'link') {
                    element.addEventListener('load', () => {
                        console.debug('✅ Stylesheet loaded:', element.href);
                    });
                    element.addEventListener('error', () => {
                        console.warn('❌ Stylesheet failed:', element.href);
                    });
                }
                return element;
            };

            // Monitor for dynamic CSS additions
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.tagName === 'LINK' && node.rel === 'stylesheet') {
                            console.debug('🆕 Dynamic stylesheet:', node.href);
                        } else if (node.tagName === 'STYLE') {
                            console.debug('🆕 Inline styles added');
                        }
                    });
                });
            });
            
            // Start observing when DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    observer.observe(document.head || document.documentElement, {
                        childList: true,
                        subtree: true
                    });
                });
            } else {
                observer.observe(document.head || document.documentElement, {
                    childList: true,
                    subtree: true
                });
            }

            // Enhance window.navigator.userAgentData for better detection avoidance
            if (!navigator.userAgentData) {
                Object.defineProperty(navigator, 'userAgentData', {
                    get: () => ({
                        brands: [
                            { brand: 'Not_A Brand', version: '8' },
                            { brand: 'Chromium', version: '120' },
                            { brand: 'Google Chrome', version: '120' }
                        ],
                        mobile: false,
                        platform: 'Windows'
                    }),
                    configurable: true
                });
            }

            // Override screen properties for consistency
            Object.defineProperty(screen, 'colorDepth', {
                get: () => 24,
                configurable: true
            });
            
            Object.defineProperty(screen, 'pixelDepth', {
                get: () => 24,
                configurable: true
            });

            // Add realistic timing variations to prevent detection
            const originalSetTimeout = window.setTimeout;
            const originalSetInterval = window.setInterval;
            
            window.setTimeout = function(callback, delay, ...args) {
                const variation = delay * 0.1 * (Math.random() - 0.5); // ±5% variation
                return originalSetTimeout.call(this, callback, delay + variation, ...args);
            };
            
            window.setInterval = function(callback, delay, ...args) {
                const variation = delay * 0.05 * (Math.random() - 0.5); // ±2.5% variation
                return originalSetInterval.call(this, callback, delay + variation, ...args);
            };

            // Override toString methods to hide function modifications
            const originalToString = Function.prototype.toString;
            Function.prototype.toString = function() {
                if (this === navigator.permissions.query) {
                    return 'function query() { [native code] }';
                }
                if (this === performance.now) {
                    return 'function now() { [native code] }';
                }
                if (this === window.fetch) {
                    return 'function fetch() { [native code] }';
                }
                return originalToString.call(this);
            };
        });

        // Add Google-specific anti-detection measures
        if (url.includes('google.') || url.includes('googleapis.')) {
            await context.addInitScript(() => {
                // Google-specific bot detection bypass
                console.debug('🔧 Applying Google-specific stealth measures...');
                
                // Override Google-specific bot detection properties
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined,
                    configurable: true
                });
                
                // Hide automation indicators
                delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
                delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
                delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
                
                // Override runtime detection
                Object.defineProperty(window.chrome, 'runtime', {
                    get: () => ({
                        onConnect: undefined,
                        onMessage: undefined,
                        id: 'chrome-extension://boadgeojelhgndaghljhdicfkmllpafd/'
                    }),
                    configurable: true
                });
                
                // Add realistic mouse/keyboard event history
                window._eventHistory = {
                    mouse: Date.now() - Math.random() * 30000,
                    keyboard: Date.now() - Math.random() * 20000,
                    touch: null
                };
                
                // Simulate realistic user interaction timing
                ['mousedown', 'mouseup', 'click'].forEach(eventType => {
                    document.addEventListener(eventType, () => {
                        window._eventHistory.mouse = Date.now();
                    }, true);
                });
                
                ['keydown', 'keyup'].forEach(eventType => {
                    document.addEventListener(eventType, () => {
                        window._eventHistory.keyboard = Date.now();
                    }, true);
                });
                
                // Override Google's specific detection methods
                if (window.google && window.google.ima) {
                    const originalGetVersion = window.google.ima.getVersion;
                    window.google.ima.getVersion = function() {
                        return originalGetVersion ? originalGetVersion.call(this) : '3.517.2';
                    };
                }
                
                // Hide Playwright/automation traces
                const originalQuerySelector = document.querySelector;
                document.querySelector = function(selector) {
                    if (selector.includes('playwright') || selector.includes('webdriver')) {
                        return null;
                    }
                    return originalQuerySelector.call(this, selector);
                };
                
                console.debug('✅ Google stealth measures applied');
            });
        }

        console.log(`🌐 Navigating to: ${url}`);

        // Helper: Try to accept Google consent if visible (supports iframe)
        async function tryAcceptGoogleConsent(page) {
            try {
                // Try top-level consent buttons
                const selectors = [
                    'button[aria-label="Accept all"]',
                    'button:has-text("I agree")',
                    'button:has-text("Accept all")',
                    '#introAgreeButton',
                ];
                for (const sel of selectors) {
                    const el = await page.$(sel);
                    if (el) {
                        await el.click({ timeout: 2000 });
                        await page.waitForTimeout(500);
                        console.log('✅ Accepted consent (top-level)');
                        return true;
                    }
                }
                // Try inside iframes (Google often wraps consent in an iframe)
                for (const frame of page.frames()) {
                    for (const sel of selectors) {
                        const el = await frame.$(sel);
                        if (el) {
                            await el.click({ timeout: 2000 });
                            await page.waitForTimeout(500);
                            console.log('✅ Accepted consent (iframe)');
                            return true;
                        }
                    }
                }
            } catch (e) {
                console.log('⚠️ Consent accept attempt failed (continuing)');
            }
            return false;
        }

        // Enhanced navigation with better error handling and fallbacks
        await withTimeoutFallback(
            async () => {
                // Google-specific pre-check: avoid waiting forever on bot pages
                const isGoogle = url.includes('google.');
                try {
                    // For Google, use faster strategy and consent handling
                    if (isGoogle) {
                        // Faster initial load
                        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: Math.min(timeout * 0.5, 15000) });
                        // Early detection: unusual traffic / bot checks
                        const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 2000));
                        if (/unusual traffic|automated queries|are you a robot/i.test(bodyText)) {
                            throw new HeadlessXError('Google anti-bot page detected', 'ANTI_BOT_DETECTED', false);
                        }
                        // Attempt to accept consent if present
                        await tryAcceptGoogleConsent(page);
                        // Then wait briefly for resources
                        await page.waitForTimeout(1000);
                        console.log('📄 Page navigation completed (google/domcontentloaded)');
                    } else {
                        // Try 'networkidle' first (best for complete loading)
                        await page.goto(url, { 
                            waitUntil: 'networkidle', 
                            timeout: Math.min(timeout * 0.7, 30000) // Use 70% of timeout or max 30s
                        });
                        console.log('📄 Page navigation completed (networkidle)');
                    }
                } catch (navError) {
                    console.log('⚠️ Primary navigation failed, trying domcontentloaded...');
                    // Fallback to faster domcontentloaded
                    await page.goto(url, { 
                        waitUntil: 'domcontentloaded', 
                        timeout: Math.min(timeout * 0.5, 20000) // Use 50% of timeout or max 20s
                    });
                    // Attempt consent acceptance post-fallback for Google
                    if (isGoogle) {
                        await tryAcceptGoogleConsent(page);
                    }
                    console.log('📄 Page navigation completed (domcontentloaded)');
                }
                
                // Smart wait - only wait if page seems to be loading resources
                const isStillLoading = await page.evaluate(() => {
                    return document.readyState !== 'complete' || 
                           performance.getEntriesByType('resource').some(r => !r.responseEnd);
                });
                
                if (isStillLoading) {
                    // Additional wait for CSS rendering (reduced from 3s to 1.5s)
                    await page.waitForTimeout(1500);
                } else {
                    // Quick wait for immediate rendering
                    await page.waitForTimeout(500);
                }
                
                // Force CSS evaluation to ensure styles are applied
                await page.evaluate(() => {
                    // Force style recalculation
                    document.body.offsetHeight;
                    
                    // Force desktop layout
                    const viewport = document.querySelector('meta[name="viewport"]');
                    if (viewport) {
                        viewport.setAttribute('content', 'width=1920');
                    }
                    
                    // Wait for any remaining stylesheets
                    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
                    return Promise.all(stylesheets.map(link => {
                        if (link.sheet) return Promise.resolve();
                        return new Promise((resolve) => {
                            link.onload = () => resolve();
                            link.onerror = () => resolve();
                            setTimeout(() => resolve(), 2000); // Increased timeout
                        });
                    }));
                });
                
                console.log('✅ Page loaded with CSS verification');
            },
            // Enhanced fallback for anti-bot protected sites
            returnPartialOnTimeout ? async () => {
                wasTimeout = true;
                console.log('⚠️ Navigation timeout detected - implementing anti-bot fallback strategy...');
                
                try {
                    // Strategy 1: Quick reload with minimal waiting
                    console.log('🔄 Attempting quick reload...');
                    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
                    await page.waitForTimeout(1000); // Brief wait
                    console.log('📄 Quick reload successful');
                } catch (reloadError) {
                    console.log('⚠️ Quick reload failed, trying basic navigation...');
                    
                    try {
                        // Strategy 2: Basic navigation without waiting
                        await page.goto(url, { waitUntil: 'load', timeout: 8000 });
                        console.log('📄 Basic navigation successful');
                    } catch (basicError) {
                        console.log('⚠️ Basic navigation failed, checking current page state...');
                        
                        // Strategy 3: Check if we have any usable content
                        const currentUrl = page.url();
                        const hasContent = await page.evaluate(() => {
                            return document.body && document.body.innerHTML.length > 100;
                        });
                        
                        if (!currentUrl || currentUrl === 'about:blank' || !hasContent) {
                            throw new HeadlessXError(
                                'Site appears to be blocking automated access',
                                'ANTI_BOT_DETECTED',
                                'network',
                                { 
                                    url: url,
                                    suggestion: 'This site may have anti-bot protection. Try a different URL or use a proxy.',
                                    currentUrl: currentUrl
                                }
                            );
                        }
                        
                        console.log('📄 Found partial content, proceeding...');
                    }
                }
            } : null,
            Math.min(timeout, 45000) // Cap timeout at 45 seconds maximum
        );

        // Continue with dynamic content loading - always execute JavaScript features
        const remainingTime = extraWaitTime; // Always use full extra wait time
        
        console.log('📄 Page loaded, waiting for dynamic content...');
        
        // Wait for specific selectors if provided (with increased timeout)
        if (waitForSelectors.length > 0) {
            console.log(`⏳ Waiting for selectors: ${waitForSelectors.join(', ')}`);
            for (const selector of waitForSelectors) {
                try {
                    await withTimeoutFallback(
                        () => page.waitForSelector(selector, { timeout: 30000 }), // Increased from 15000 to 30000ms
                        () => {
                            console.log(`⚠️ Selector timeout (continuing): ${selector}`);
                            return Promise.resolve();
                        },
                        30000
                    );
                    console.log(`✅ Found selector: ${selector}`);
                } catch (e) {
                    console.log(`⚠️ Selector not found: ${selector}`);
                }
            }
        }

        // Click elements if specified (with increased timeout)
        if (clickSelectors.length > 0) {
            console.log(`🖱️ Clicking elements: ${clickSelectors.join(', ')}`);
            for (const selector of clickSelectors) {
                try {
                    await withTimeoutFallback(
                        async () => {
                            await page.click(selector);
                            await page.waitForTimeout(2000);
                            console.log(`✅ Clicked: ${selector}`);
                        },
                        () => {
                            console.log(`⚠️ Click timeout (continuing): ${selector}`);
                            return Promise.resolve();
                        },
                        20000 // Increased from 10000 to 20000ms
                    );
                } catch (e) {
                    console.log(`⚠️ Could not click: ${selector}`);
                }
            }
        }

        // ENTERPRISE-GRADE CSS AND DESKTOP LAYOUT FORCING
        console.log('🎨 FORCING DESKTOP CSS AND LAYOUT...');
        try {
            await withTimeoutFallback(
                async () => {
                    await page.evaluate(async () => {
                        console.log('Starting desktop CSS forcing...');
                        
                        // Force desktop viewport
                        const viewport = window.innerWidth;
                        console.log(`Desktop viewport: ${viewport}px`);
                        
                        // Force desktop CSS loading
                        const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
                        console.log(`Processing ${stylesheets.length} stylesheets for desktop`);
                        
                        // Inject desktop-forcing CSS
                        const desktopCSS = document.createElement('style');
                        desktopCSS.textContent = `
                            body, html { min-width: 1920px !important; width: 100% !important; }
                            .mobile-only, .mobile, [class*="mobile"] { display: none !important; }
                            .desktop-only, .desktop, [class*="desktop"] { display: block !important; }
                            @media (max-width: 768px) { * { display: none !important; } }
                        `;
                        document.head.appendChild(desktopCSS);
                        
                        // Wait for fonts and CSS
                        if (document.fonts && document.fonts.ready) {
                            await document.fonts.ready;
                        }
                        
                        // Force layout recalculation
                        document.body.offsetHeight;
                        
                        console.log('Desktop CSS forcing completed');
                    });
                },
                () => {
                    console.log('⚠️ Desktop CSS forcing timeout (continuing)');
                    return Promise.resolve();
                },
                10000
            );
        } catch (cssError) {
            console.log('⚠️ Desktop CSS forcing failed:', cssError.message);
        }

        // Wait for JavaScript execution to complete
        console.log('📜 Waiting for JavaScript execution...');
        try {
            await withTimeoutFallback(
                async () => {
                    await page.evaluate(async () => {
                        // Wait for common JavaScript frameworks to initialize
                        const checkFrameworks = () => {
                            return new Promise((resolve) => {
                                let checksCompleted = 0;
                                const totalChecks = 5;
                                
                                const completeCheck = () => {
                                    checksCompleted++;
                                    if (checksCompleted >= totalChecks) {
                                        resolve();
                                    }
                                };
                                
                                // Check for jQuery
                                if (window.jQuery) {
                                    window.jQuery(document).ready(() => completeCheck());
                                } else {
                                    completeCheck();
                                }
                                
                                // Check for React
                                setTimeout(() => {
                                    if (window.React || document.querySelector('[data-reactroot]')) {
                                        // Wait a bit more for React to render
                                        setTimeout(completeCheck, 500);
                                    } else {
                                        completeCheck();
                                    }
                                }, 100);
                                
                                // Check for Vue
                                setTimeout(() => {
                                    if (window.Vue || document.querySelector('[data-server-rendered]')) {
                                        setTimeout(completeCheck, 500);
                                    } else {
                                        completeCheck();
                                    }
                                }, 100);
                                
                                // Check for Angular
                                setTimeout(() => {
                                    if (window.ng || document.querySelector('[ng-app]') || document.querySelector('[data-ng-app]')) {
                                        setTimeout(completeCheck, 500);
                                    } else {
                                        completeCheck();
                                    }
                                }, 100);
                                
                                // General timeout
                                setTimeout(completeCheck, 2000);
                            });
                        };
                        
                        await checkFrameworks();
                    });
                },
                () => {
                    console.log('⚠️ JavaScript execution timeout (continuing)');
                    return Promise.resolve();
                },
                10000
            );
        } catch (jsError) {
            console.log('⚠️ JavaScript execution check failed:', jsError.message);
        }

        // Always simulate human-like behavior for complete rendering
        console.log('🎭 Simulating human behavior...');
        try {
            await simulateHumanBehavior(page);
        } catch (behaviorError) {
            // Human behavior simulation failure is non-critical but should be logged
            const requestId = generateRequestId();
            const categorizedError = handleError(behaviorError, requestId, 'Human behavior simulation');
            
            // Only continue if this is a recoverable error
            if (categorizedError.isRecoverable) {
                logger.warn(requestId, 'Human behavior simulation failed but continuing', { 
                    error: categorizedError.message,
                    category: categorizedError.category 
                });
            } else {
                // Non-recoverable behavior errors might indicate page issues
                throw new HeadlessXError(
                    `Human behavior simulation failed: ${behaviorError.message}`,
                    ERROR_CATEGORIES.BROWSER,
                    false,
                    behaviorError
                );
            }
        }

        // Always scroll to bottom to trigger lazy loading
        if (scrollToBottom) {
            console.log('📜 Scrolling to load all content...');
            try {
                await withTimeoutFallback(
                    () => autoScroll(page),
                    () => {
                        console.log('⚠️ Scroll timeout (continuing)');
                        return Promise.resolve();
                    },
                    25000 // Increased from 15000 to 25000ms
                );
            } catch (scrollError) {
                // Scrolling failure might indicate page loading issues
                const requestId = generateRequestId();
                const categorizedError = handleError(scrollError, requestId, 'Page scrolling');
                
                // Scrolling errors are usually recoverable but important for lazy loading
                logger.warn(requestId, 'Page scrolling failed - some content may not be loaded', { 
                    error: categorizedError.message,
                    category: categorizedError.category,
                    impact: 'Some lazy-loaded content may be missing' 
                });
            }
        }

        // Always wait for network to be idle
        if (waitForNetworkIdle) {
            console.log('🌐 Waiting for network idle...');
            try {
                await withTimeoutFallback(
                    () => page.waitForLoadState('networkidle', { timeout: 30000 }), // Increased from 20000 to 30000ms
                    () => {
                        console.log('⚠️ Network idle timeout (continuing)');
                        return Promise.resolve();
                    },
                    30000
                );
            } catch (networkError) {
                // Network idle failure might indicate ongoing network activity
                const requestId = generateRequestId();
                const categorizedError = handleError(networkError, requestId, 'Network idle wait');
                
                // Network errors can be recoverable but affect content completeness
                if (categorizedError.category === ERROR_CATEGORIES.NETWORK) {
                    logger.warn(requestId, 'Network still active - content may be incomplete', { 
                        error: categorizedError.message,
                        impact: 'Dynamic content may still be loading' 
                    });
                } else {
                    logger.error(requestId, 'Network idle wait failed unexpectedly', categorizedError);
                }
            }
        }

        // Extra wait time for dynamic content (reduced if there was a timeout)
        if (remainingTime > 0) {
            console.log(`⏰ Extra wait time: ${remainingTime}ms`);
            await page.waitForTimeout(remainingTime);
        }

        // Execute custom script if provided (with increased timeout)
        if (customScript) {
            console.log('🔧 Executing custom script...');
            try {
                await withTimeoutFallback(
                    () => page.evaluate(customScript),
                    () => {
                        console.log('⚠️ Custom script timeout (continuing)');
                        return Promise.resolve();
                    },
                    20000 // Increased from 10000 to 20000ms
                );
            } catch (scriptError) {
                // Custom script errors are often non-recoverable and should be reported
                const requestId = generateRequestId();
                const categorizedError = handleError(scriptError, requestId, 'Custom script execution');
                
                // Script errors should be treated seriously as they might break functionality
                if (categorizedError.category === ERROR_CATEGORIES.SCRIPT) {
                    throw new HeadlessXError(
                        `Custom script execution failed: ${scriptError.message}`,
                        ERROR_CATEGORIES.SCRIPT,
                        false,
                        scriptError
                    );
                } else {
                    // Timeout or other recoverable errors
                    logger.warn(requestId, 'Custom script execution failed but continuing', { 
                        error: categorizedError.message,
                        category: categorizedError.category 
                    });
                }
            }
        }

        // Always remove unwanted elements
        if (removeElements.length > 0) {
            console.log(`🗑️ Removing elements: ${removeElements.join(', ')}`);
            for (const selector of removeElements) {
                try {
                    await page.evaluate((sel) => {
                        const elements = document.querySelectorAll(sel);
                        elements.forEach(el => el.remove());
                    }, selector);
                } catch (e) {
                    console.log(`⚠️ Could not remove elements: ${selector}`);
                }
            }
        }

        // Take screenshot if requested
        let screenshotBuffer = null;
        if (screenshotPath) {
            try {
                console.log('📸 Taking screenshot...');
                screenshotBuffer = await page.screenshot({
                    path: screenshotPath,
                    fullPage: fullPage,
                    type: screenshotFormat,
                    quality: screenshotFormat === 'jpeg' ? 90 : undefined
                });
                console.log(`✅ Screenshot saved: ${screenshotPath}`);
            } catch (screenshotError) {
                // Screenshot errors are usually resource-related and should be logged
                const requestId = generateRequestId();
                const categorizedError = handleError(screenshotError, requestId, 'Screenshot generation');
                
                logger.warn(requestId, 'Screenshot generation failed', { 
                    error: categorizedError.message,
                    category: categorizedError.category,
                    path: screenshotPath 
                });
                // Screenshot failure doesn't affect main functionality, so continue
            }
        }

        // Generate PDF if requested
        let pdfBuffer = null;
        if (pdfPath) {
            try {
                console.log('📄 Generating PDF...');
                pdfBuffer = await page.pdf({
                    path: pdfPath,
                    format: pdfFormat,
                    printBackground: true,
                    margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
                });
                console.log(`✅ PDF saved: ${pdfPath}`);
            } catch (pdfError) {
                // PDF generation errors are usually resource-related
                const requestId = generateRequestId();
                const categorizedError = handleError(pdfError, requestId, 'PDF generation');
                
                logger.warn(requestId, 'PDF generation failed', { 
                    error: categorizedError.message,
                    category: categorizedError.category,
                    path: pdfPath 
                });
                // PDF failure doesn't affect main functionality, so continue
            }
        }

        // Get final HTML content
        console.log('📋 Extracting final HTML...');
        const content = await page.content();

        // Get page info
        let title = 'Unknown';
        let currentUrl = url;
        
        try {
            title = await page.title() || 'Unknown';
            currentUrl = page.url() || url;
        } catch (e) {
            console.log('⚠️ Could not get page title/URL, using defaults');
        }

        await context.close();

        const result = {
            html: content,
            title,
            url: currentUrl,
            originalUrl: url,
            consoleLogs: captureConsole ? consoleLogs : null,
            timestamp: new Date().toISOString(),
            wasTimeout,
            contentLength: content.length,
            screenshotBuffer,
            pdfBuffer
        };

        if (wasTimeout) {
            console.log(`⚠️ Content extracted with timeout warnings - Length: ${content.length} chars`);
        } else {
            console.log(`✅ Content fully extracted - Length: ${content.length} chars`);
        }

        return result;

    } catch (error) {
        if (context) await context.close();
        
        // Enhanced error analysis and user-friendly messages
        const isTimeoutError = error.message.includes('Timeout') || error.name === 'TimeoutError';
        const isNetworkError = error.message.includes('net::ERR_FAILED') || error.message.includes('ERR_NAME_NOT_RESOLVED');
        const isAntiBot = error.message.includes('blocked') || error.message.includes('denied') || 
                         (isTimeoutError && (url.includes('google.') || url.includes('facebook.') || url.includes('amazon.')));
        
        console.error(`❌ Page rendering failed: ${error.message}`);
        
        // If we have returnPartialOnTimeout enabled and this is a timeout, try to get whatever content we can
        if (returnPartialOnTimeout && isTimeoutError) {
            console.log('🔄 Final attempt to get partial content...');
            try {
                // Try to get content even after timeout with realistic settings
                const browser2 = await getBrowser();
                const emergencyUserAgent = userAgent || getRandomUserAgent();
                const emergencyLocale = getRandomLocale();
                const emergencyHeaders = generateRealisticHeaders(emergencyUserAgent);
                
                console.log(`🆘 Emergency extraction with: ${emergencyUserAgent.substring(0, 50)}...`);
                
                const context2 = await browser2.newContext({
                    viewport,
                    userAgent: emergencyUserAgent,
                    locale: emergencyLocale.locale,
                    timezoneId: emergencyLocale.timezone,
                    extraHTTPHeaders: emergencyHeaders,
                    ignoreHTTPSErrors: true,
                    javaScriptEnabled: true
                });
                
                const page2 = await context2.newPage();
                page2.setDefaultTimeout(30000); // Increased from 10000 to 30000ms
                page2.setDefaultNavigationTimeout(45000); // Increased from 15000 to 45000ms
                
                try {
                    await page2.goto(url, { waitUntil: 'networkidle', timeout: 45000 }); // Changed from domcontentloaded to networkidle
                    await page2.waitForTimeout(5000); // Increased from 3000 to 5000ms for better content loading
                    
                    const content = await page2.content();
                    const title = await page2.title().catch(() => 'Unknown');
                    const currentUrl = page2.url();
                    
                    await context2.close();
                    
                    console.log(`🆘 Emergency content extraction successful - Length: ${content.length} chars`);
                    
                    return {
                        html: content,
                        title,
                        url: currentUrl,
                        originalUrl: url,
                        consoleLogs: null,
                        timestamp: new Date().toISOString(),
                        wasTimeout: true,
                        isEmergencyContent: true,
                        contentLength: content.length
                    };
                } catch (e) {
                    await context2.close();
                    throw error; // Throw original error if emergency extraction fails
                }
            } catch (emergencyError) {
                console.log('🆘 Emergency content extraction also failed');
                throw error; // Throw original error
            }
        }
        
        // Enhance error with user-friendly information
        if (isAntiBot) {
            throw new HeadlessXError(
                `Site appears to be blocking automated access: ${error.message}`,
                'ANTI_BOT_DETECTED',
                'network',
                { 
                    url: url,
                    suggestion: 'This site has sophisticated anti-bot protection. Try: 1) Using a different URL, 2) Adding delays, 3) Using residential proxies, or 4) Trying during off-peak hours.',
                    originalError: error.message,
                    errorType: 'anti-bot-protection'
                }
            );
        } else if (isNetworkError) {
            throw new HeadlessXError(
                `Network connection failed: ${error.message}`,
                'NETWORK_ERROR',
                'network',
                { 
                    url: url,
                    suggestion: 'Check if the URL is accessible and your internet connection is stable.',
                    originalError: error.message,
                    errorType: 'network-connectivity'
                }
            );
        } else if (isTimeoutError) {
            throw new HeadlessXError(
                `Operation timed out: ${error.message}`,
                'TIMEOUT_ERROR',
                'timeout',
                { 
                    url: url,
                    suggestion: 'Site is taking too long to load. Try: 1) Increasing timeout, 2) Using returnPartialOnTimeout=true, or 3) Checking site performance.',
                    originalError: error.message,
                    errorType: 'timeout'
                }
            );
        }
        
        throw error;
    }
}

// Auto scroll function to trigger lazy loading (with better error handling)
// Realistic auto scroll function with human-like behavior
async function autoScroll(page) {
    try {
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                let currentPosition = 0;
                let scrollAttempts = 0;
                const maxScrollAttempts = 50;
                
                // Human-like scrolling with variable speeds and pauses
                const humanScroll = () => {
                    const scrollHeight = document.body.scrollHeight;
                    
                    // Variable scroll distance (humans don't scroll perfectly)
                    const baseDistance = 100;
                    const variation = Math.random() * 50 - 25; // -25 to +25
                    const distance = Math.max(50, baseDistance + variation);
                    
                    // Scroll with easing (like mouse wheel)
                    const startPos = window.pageYOffset;
                    const targetPos = startPos + distance;
                    const duration = 150 + Math.random() * 100; // 150-250ms
                    const startTime = performance.now();
                    
                    const scroll = (currentTime) => {
                        const elapsed = currentTime - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        
                        // Easing function (ease-out)
                        const easeOut = 1 - Math.pow(1 - progress, 3);
                        const currentPos = startPos + (distance * easeOut);
                        
                        window.scrollTo(0, currentPos);
                        
                        if (progress < 1) {
                            requestAnimationFrame(scroll);
                        } else {
                            totalHeight = currentPos;
                            currentPosition = currentPos;
                            scrollAttempts++;
                            
                            // Human-like pause between scrolls
                            const pauseTime = 200 + Math.random() * 300; // 200-500ms
                            setTimeout(() => {
                                if (currentPosition >= scrollHeight - window.innerHeight - 100 || 
                                    scrollAttempts >= maxScrollAttempts) {
                                    resolve();
                                } else {
                                    humanScroll();
                                }
                            }, pauseTime);
                        }
                    };
                    
                    requestAnimationFrame(scroll);
                };
                
                // Start scrolling
                humanScroll();
                
                // Safety timeout
                setTimeout(() => {
                    resolve();
                }, 15000);
            });
        });
        
        // Human-like pause before scrolling back to top
        await page.waitForTimeout(500 + Math.random() * 1000);
        
        // Scroll back to top with animation
        await page.evaluate(() => {
            const startPos = window.pageYOffset;
            const duration = 800;
            const startTime = performance.now();
            
            const scrollToTop = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Smooth scroll to top
                const easeInOut = progress < 0.5 
                    ? 2 * progress * progress 
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                    
                const currentPos = startPos * (1 - easeInOut);
                window.scrollTo(0, currentPos);
                
                if (progress < 1) {
                    requestAnimationFrame(scrollToTop);
                }
            };
            
            requestAnimationFrame(scrollToTop);
        });
        
        // Wait for scroll animation to complete
        await page.waitForTimeout(1000);
        
        // Final pause for any lazy-loaded content
        await page.waitForTimeout(1500 + Math.random() * 1000);
        
    } catch (error) {
        console.log('⚠️ Human-like auto scroll failed:', error.message);
        // Don't throw error, just log it
    }
}

// Simulate realistic mouse movements and interactions
async function simulateHumanBehavior(page) {
    try {
        console.log('🎭 Starting enhanced human behavior simulation...');
        
        // Step 1: Initial page assessment and realistic delays
        await page.waitForTimeout(500 + Math.random() * 1000); // 0.5-1.5s initial delay
        
        // Step 2: Enhanced mouse movement simulation
        await page.evaluate(() => {
            // Simulate realistic mouse movements with acceleration/deceleration
            const simulateRealisticMovement = (startX, startY, endX, endY, duration) => {
                const steps = Math.floor(duration / 16); // 60fps
                const movements = [];
                
                for (let i = 0; i <= steps; i++) {
                    const progress = i / steps;
                    // Ease-in-out curve for realistic acceleration
                    const easeProgress = progress < 0.5 
                        ? 2 * progress * progress 
                        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                    
                    const x = startX + (endX - startX) * easeProgress;
                    const y = startY + (endY - startY) * easeProgress;
                    
                    // Add slight randomness for human-like imperfection
                    const jitterX = (Math.random() - 0.5) * 2;
                    const jitterY = (Math.random() - 0.5) * 2;
                    
                    movements.push({
                        x: Math.round(x + jitterX),
                        y: Math.round(y + jitterY),
                        delay: i * 16
                    });
                }
                return movements;
            };
            
            // Generate 3-7 realistic mouse movements
            const moveCount = 3 + Math.floor(Math.random() * 5);
            let currentX = Math.floor(Math.random() * window.innerWidth);
            let currentY = Math.floor(Math.random() * window.innerHeight);
            
            const allMovements = [];
            let totalDelay = 0;
            
            for (let i = 0; i < moveCount; i++) {
                const targetX = Math.floor(Math.random() * window.innerWidth);
                const targetY = Math.floor(Math.random() * window.innerHeight);
                const duration = 200 + Math.random() * 300; // 200-500ms per movement
                
                const movements = simulateRealisticMovement(currentX, currentY, targetX, targetY, duration);
                movements.forEach(move => {
                    allMovements.push({
                        ...move,
                        delay: totalDelay + move.delay
                    });
                });
                
                totalDelay += duration + 100 + Math.random() * 200; // Pause between movements
                currentX = targetX;
                currentY = targetY;
            }
            
            // Execute all movements
            allMovements.forEach((move) => {
                setTimeout(() => {
                    const event = new MouseEvent('mousemove', {
                        clientX: move.x,
                        clientY: move.y,
                        bubbles: true,
                        cancelable: true,
                        view: window
                    });
                    document.dispatchEvent(event);
                }, move.delay);
            });
            
            // Simulate scroll behavior
            setTimeout(() => {
                const scrollDistance = Math.floor(Math.random() * 300) + 100; // 100-400px
                const scrollSteps = 10;
                const scrollDelay = 50;
                
                for (let i = 0; i < scrollSteps; i++) {
                    setTimeout(() => {
                        window.scrollBy(0, scrollDistance / scrollSteps);
                    }, i * scrollDelay);
                }
                
                // Scroll back up slightly (human behavior)
                setTimeout(() => {
                    const backScroll = Math.floor(scrollDistance * 0.3);
                    for (let i = 0; i < 5; i++) {
                        setTimeout(() => {
                            window.scrollBy(0, -backScroll / 5);
                        }, i * 30);
                    }
                }, scrollSteps * scrollDelay + 500);
            }, totalDelay + 500);
            
            // Simulate occasional clicks on safe elements
            setTimeout(() => {
                const safeSelectors = [
                    'body', 'main', '.content', '.container', 'article', 
                    '.page', '.wrapper', '#content', '#main'
                ];
                
                for (const selector of safeSelectors) {
                    const element = document.querySelector(selector);
                    if (element && Math.random() > 0.8) { // 20% chance to click
                        const rect = element.getBoundingClientRect();
                        if (rect.width > 0 && rect.height > 0) {
                            const clickX = rect.left + Math.random() * rect.width;
                            const clickY = rect.top + Math.random() * rect.height;
                            
                            // Realistic click sequence: mousedown -> mouseup -> click
                            ['mousedown', 'mouseup', 'click'].forEach((eventType, index) => {
                                setTimeout(() => {
                                    const clickEvent = new MouseEvent(eventType, {
                                        clientX: clickX,
                                        clientY: clickY,
                                        bubbles: true,
                                        cancelable: true,
                                        view: window,
                                        button: 0
                                    });
                                    element.dispatchEvent(clickEvent);
                                }, index * 50);
                            });
                            break; // Only click one element
                        }
                    }
                }
            }, totalDelay + 1000);
            
            // Simulate focus events
            setTimeout(() => {
                const focusableElements = document.querySelectorAll('input, textarea, select, button, a[href]');
                if (focusableElements.length > 0 && Math.random() > 0.7) {
                    const element = focusableElements[Math.floor(Math.random() * focusableElements.length)];
                    element.focus();
                    setTimeout(() => element.blur(), 500 + Math.random() * 1000);
                }
            }, totalDelay + 1500);
            
            return totalDelay + 2000; // Return total simulation time
        });
        
        // Step 3: Wait for the simulation to complete
        const simulationTime = await page.evaluate(() => {
            return new Promise(resolve => {
                setTimeout(() => resolve(), 3000); // Give extra time for all events
            });
        });
        
        // Step 4: Additional realistic behaviors
        await page.evaluate(() => {
            // Simulate keyboard activity (without actual typing)
            if (Math.random() > 0.8) {
                const keyEvents = ['keydown', 'keyup'];
                const keys = ['Tab', 'Shift', 'Control', 'Alt'];
                const key = keys[Math.floor(Math.random() * keys.length)];
                
                keyEvents.forEach((eventType, index) => {
                    setTimeout(() => {
                        const keyEvent = new KeyboardEvent(eventType, {
                            key: key,
                            bubbles: true,
                            cancelable: true
                        });
                        document.dispatchEvent(keyEvent);
                    }, index * 50);
                });
            }
            
            // Simulate window focus/blur
            setTimeout(() => {
                window.dispatchEvent(new Event('blur'));
                setTimeout(() => {
                    window.dispatchEvent(new Event('focus'));
                }, 100 + Math.random() * 200);
            }, 1000);
        });
        
        // Step 5: Final wait and page interaction check
        await page.waitForTimeout(1000 + Math.random() * 500);
        
        console.log('✅ Enhanced human behavior simulation completed');
        
    } catch (error) {
        console.log('⚠️ Human behavior simulation failed:', error.message);
        // Fallback: simple mouse movement
        try {
            await page.mouse.move(
                Math.random() * 800,
                Math.random() * 600
            );
            await page.waitForTimeout(500);
        } catch (fallbackError) {
            console.log('⚠️ Fallback behavior simulation also failed');
        }
    }
}

// Clean text extraction function
async function extractCleanText(htmlContent) {
    const browser = await getBrowser();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // Set HTML content and extract text
        await page.setContent(htmlContent);
        
        // Remove script, style, and other non-content elements
        const textContent = await page.evaluate(() => {
            // Remove unwanted elements
            const unwantedSelectors = [
                'script', 'style', 'noscript', 'iframe', 'object', 'embed',
                'nav', 'header', 'footer', '.nav', '.navigation', '.menu',
                '.sidebar', '.advertisement', '.ads', '.social', '.share',
                '.comments', '.comment', '.popup', '.modal', '.overlay',
                '[role="banner"]', '[role="navigation"]', '[role="complementary"]'
            ];
            
            unwantedSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => el.remove());
            });

            // Get main content areas first
            const contentSelectors = [
                'main', '[role="main"]', '.main-content', '.content', 
                '.post-content', '.article-content', '.page-content',
                'article', '.article', '.post', '.entry-content'
            ];
            
            let mainContent = null;
            for (const selector of contentSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    mainContent = element;
                    break;
                }
            }
            
            // If no main content found, use body
            if (!mainContent) {
                mainContent = document.body;
            }

            // Get text content with proper spacing
            const walker = document.createTreeWalker(
                mainContent,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );

            let textContent = '';
            let node;
            
            while (node = walker.nextNode()) {
                const text = node.textContent.trim();
                if (text && text.length > 1) {
                    // Add spacing between different elements
                    const parent = node.parentElement;
                    if (parent) {
                        const tagName = parent.tagName.toLowerCase();
                        if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'].includes(tagName)) {
                            textContent += text + '\n\n';
                        } else if (['br'].includes(tagName)) {
                            textContent += '\n';
                        } else {
                            textContent += text + ' ';
                        }
                    } else {
                        textContent += text + ' ';
                    }
                }
            }

            // Clean up text
            return textContent
                .replace(/\s+/g, ' ')           // Multiple spaces to single space
                .replace(/\n\s*\n/g, '\n\n')    // Multiple newlines to double newline
                .replace(/^\s+|\s+$/g, '')      // Trim start and end
                .replace(/\n{3,}/g, '\n\n');   // Max 2 consecutive newlines
        });

        await context.close();
        return textContent;
        
    } catch (error) {
        await context.close();
        throw error;
    }
}

// Special routes that should be handled before the API routes
// Favicon
app.get('/favicon.ico', (req, res) => {
    const websitePath = path.join(__dirname, '..', 'website', 'out');
    const faviconPath = path.join(websitePath, 'favicon.ico');
    
    if (fs.existsSync(faviconPath)) {
        res.sendFile(faviconPath);
    } else {
        res.status(204).end(); // No content
    }
});

// Robots.txt
app.get('/robots.txt', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send('User-agent: *\nDisallow: /api/\nAllow: /\n');
});

// Health check endpoint with detailed status
app.get('/api/health', (req, res) => {
    const uptime = Math.floor((Date.now() - serverStartTime.getTime()) / 1000);
    const memoryUsage = process.memoryUsage();
    
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        browserConnected: browserInstance ? browserInstance.isConnected() : false,
        uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`,
        memory: {
            rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
            external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
        },
        version: '1.1.0'
    });
});

// Status endpoint with server information (requires authentication)
app.get('/api/status', (req, res) => {
    try {
        // Check authentication
        const token = req.query.token || req.headers['x-token'] || req.headers['authorization']?.replace('Bearer ', '');
        if (token !== AUTH_TOKEN) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        const uptime = Math.floor((Date.now() - serverStartTime.getTime()) / 1000);
        
        res.json({
            server: {
                name: 'HeadlessX - Advanced Browserless Web Scraping API',
                version: '1.1.0',
                uptime: uptime,
                startTime: serverStartTime.toISOString()
            },
            browser: {
                connected: browserInstance ? browserInstance.isConnected() : false,
                type: 'Chromium'
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
        });
    } catch (error) {
        console.error('❌ Status endpoint error:', error);
        res.status(500).json({ 
            error: 'Failed to get server status', 
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Main rendering endpoint (JSON response) with enhanced timeout handling
app.post('/api/render', async (req, res) => {
    try {
        // Check authentication
        const token = req.query.token || req.headers['x-token'] || req.headers['authorization']?.replace('Bearer ', '');
        if (token !== AUTH_TOKEN) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        // Validate URL
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'Missing required field: url' });
        }

        try {
            new URL(url);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        console.log(`🚀 Advanced rendering: ${url}`);

        // Disable partial content return by default - prioritize complete execution
        const options = { 
            ...req.body, 
            returnPartialOnTimeout: req.body.returnPartialOnTimeout === true 
        };
        
        const result = await renderPageAdvanced(options);
        
        console.log(`✅ Successfully rendered: ${url} (${result.wasTimeout ? 'with timeouts' : 'complete'})`);
        res.json(result);

    } catch (error) {
        console.error('❌ Rendering error:', error);
        
        // Enhanced error response with helpful information
        let statusCode = 500;
        let errorResponse = {
            error: 'Failed to render page',
            details: error.message,
            timestamp: new Date().toISOString()
        };
        
        // Check if this is a HeadlessXError with specific information
        if (error.metadata) {
            errorResponse = {
                ...errorResponse,
                errorType: error.metadata.errorType || 'unknown',
                suggestion: error.metadata.suggestion,
                url: error.metadata.url
            };
            
            // Set appropriate status codes
            if (error.metadata.errorType === 'anti-bot-protection') {
                statusCode = 403; // Forbidden
            } else if (error.metadata.errorType === 'network-connectivity') {
                statusCode = 502; // Bad Gateway
            } else if (error.metadata.errorType === 'timeout') {
                statusCode = 408; // Request Timeout
            }
        }
        
        res.status(statusCode).json(errorResponse);
    }
});

// HTML endpoint (returns raw HTML directly) with enhanced timeout handling
app.post('/api/html', async (req, res) => {
    try {
        // Check authentication
        const token = req.query.token || req.headers['x-token'] || req.headers['authorization']?.replace('Bearer ', '');
        if (token !== AUTH_TOKEN) {
            return res.status(401).send('Unauthorized: Invalid token');
        }

        // Validate URL
        const { url } = req.body;
        if (!url) {
            return res.status(400).send('Missing required field: url');
        }

        try {
            new URL(url);
        } catch (e) {
            return res.status(400).send('Invalid URL format');
        }

        console.log(`🚀 Advanced HTML rendering: ${url}`);

        // Disable partial content return by default - prioritize complete execution
        const options = { 
            ...req.body, 
            returnPartialOnTimeout: req.body.returnPartialOnTimeout === true 
        };
        
        const result = await renderPageAdvanced(options);
        
        console.log(`✅ Successfully rendered HTML: ${url} (${result.wasTimeout ? 'with timeouts' : 'complete'})`);
        
        // Return raw HTML with proper headers
        res.set({
            'Content-Type': 'text/html; charset=utf-8',
            'X-Rendered-URL': result.url,
            'X-Page-Title': result.title,
            'X-Timestamp': result.timestamp,
            'X-Was-Timeout': result.wasTimeout.toString(),
            'X-Content-Length': result.contentLength.toString(),
            'X-Is-Emergency': (result.isEmergencyContent || false).toString()
        });
        res.send(result.html);

    } catch (error) {
        console.error('❌ HTML rendering error:', error);
        
        // Enhanced error response for HTML endpoint
        let statusCode = 500;
        let errorMessage = `Error: ${error.message}`;
        
        // Check if this is a HeadlessXError with specific information
        if (error.metadata) {
            if (error.metadata.errorType === 'anti-bot-protection') {
                statusCode = 403;
                errorMessage = `Anti-bot protection detected: ${error.message}\nSuggestion: ${error.metadata.suggestion}`;
            } else if (error.metadata.errorType === 'network-connectivity') {
                statusCode = 502;
                errorMessage = `Network error: ${error.message}\nSuggestion: ${error.metadata.suggestion}`;
            } else if (error.metadata.errorType === 'timeout') {
                statusCode = 408;
                errorMessage = `Timeout error: ${error.message}\nSuggestion: ${error.metadata.suggestion}`;
            }
        }
        
        res.status(statusCode).send(errorMessage);
    }
});

// HTML endpoint (GET version - returns raw HTML directly) with enhanced timeout handling
app.get('/api/html', async (req, res) => {
    try {
        // Check authentication
        const token = req.query.token || req.headers['x-token'] || req.headers['authorization']?.replace('Bearer ', '');
        if (token !== AUTH_TOKEN) {
            return res.status(401).send('Unauthorized: Invalid token');
        }

        // Validate URL (from query parameter for GET)
        const { url } = req.query;
        if (!url) {
            return res.status(400).send('Missing required parameter: url');
        }

        try {
            new URL(url);
        } catch (e) {
            return res.status(400).send('Invalid URL format');
        }

        console.log(`🚀 Advanced HTML rendering (GET): ${url}`);

        // Disable partial content return by default - prioritize complete execution
        const options = { 
            url,
            waitForSelector: req.query.waitForSelector,
            timeout: req.query.timeout ? parseInt(req.query.timeout) : undefined,
            delay: req.query.delay ? parseInt(req.query.delay) : undefined,
            returnPartialOnTimeout: req.query.returnPartialOnTimeout === 'true'
        };
        
        const result = await renderPageAdvanced(options);
        
        console.log(`✅ Successfully rendered HTML (GET): ${url} (${result.wasTimeout ? 'with timeouts' : 'complete'})`);
        
        // Return raw HTML with proper headers
        res.set({
            'Content-Type': 'text/html; charset=utf-8',
            'X-Rendered-URL': result.url,
            'X-Page-Title': result.title,
            'X-Timestamp': result.timestamp,
            'X-Was-Timeout': result.wasTimeout.toString(),
            'X-Content-Length': result.contentLength.toString(),
            'X-Is-Emergency': (result.isEmergencyContent || false).toString()
        });
        res.send(result.html);

    } catch (error) {
        console.error('❌ HTML rendering error (GET):', error);
        res.status(500).send(`Error: ${error.message}`);
    }
});

// Content endpoint (returns clean text only - POST) with enhanced timeout handling
app.post('/api/content', async (req, res) => {
    try {
        // Check authentication
        const token = req.query.token || req.headers['x-token'] || req.headers['authorization']?.replace('Bearer ', '');
        if (token !== AUTH_TOKEN) {
            return res.status(401).send('Unauthorized: Invalid token');
        }

        // Validate URL
        const { url } = req.body;
        if (!url) {
            return res.status(400).send('Missing required field: url');
        }

        try {
            new URL(url);
        } catch (e) {
            return res.status(400).send('Invalid URL format');
        }

        console.log(`🚀 Advanced content extraction: ${url}`);

        // Disable partial content return by default - prioritize complete execution
        const options = { 
            ...req.body, 
            returnPartialOnTimeout: req.body.returnPartialOnTimeout === true 
        };

        const result = await renderPageAdvanced(options);
        
        // Extract clean text content
        const textContent = await extractCleanText(result.html);
        
        console.log(`✅ Successfully extracted content: ${url} (${result.wasTimeout ? 'with timeouts' : 'complete'})`);
        console.log(`📝 Content length: ${textContent.length} characters`);
        
        // Return plain text with proper headers
        res.set({
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Rendered-URL': result.url,
            'X-Page-Title': result.title,
            'X-Content-Length': textContent.length,
            'X-Timestamp': result.timestamp,
            'X-Was-Timeout': result.wasTimeout.toString(),
            'X-Is-Emergency': (result.isEmergencyContent || false).toString()
        });
        res.send(textContent);

    } catch (error) {
        console.error('❌ Content extraction error:', error);
        res.status(500).send(`Error: ${error.message}`);
    }
});

// Content endpoint (GET version - returns clean text only) with enhanced timeout handling
app.get('/api/content', async (req, res) => {
    try {
        // Check authentication
        const token = req.query.token || req.headers['x-token'] || req.headers['authorization']?.replace('Bearer ', '');
        if (token !== AUTH_TOKEN) {
            return res.status(401).send('Unauthorized: Invalid token');
        }

        // Validate URL (from query parameter for GET)
        const { url } = req.query;
        if (!url) {
            return res.status(400).send('Missing required parameter: url');
        }

        try {
            new URL(url);
        } catch (e) {
            return res.status(400).send('Invalid URL format');
        }

        console.log(`🚀 Advanced content extraction (GET): ${url}`);

        // Disable partial content return by default - prioritize complete execution
        const options = { 
            url,
            waitForSelector: req.query.waitForSelector,
            timeout: req.query.timeout ? parseInt(req.query.timeout) : undefined,
            delay: req.query.delay ? parseInt(req.query.delay) : undefined,
            returnPartialOnTimeout: req.query.returnPartialOnTimeout === 'true'
        };

        const result = await renderPageAdvanced(options);
        
        // Extract clean text content
        const textContent = await extractCleanText(result.html);
        
        console.log(`✅ Successfully extracted content (GET): ${url} (${result.wasTimeout ? 'with timeouts' : 'complete'})`);
        console.log(`📝 Content length: ${textContent.length} characters`);
        
        // Return plain text with proper headers
        res.set({
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Rendered-URL': result.url,
            'X-Page-Title': result.title,
            'X-Content-Length': textContent.length,
            'X-Timestamp': result.timestamp,
            'X-Was-Timeout': result.wasTimeout.toString(),
            'X-Is-Emergency': (result.isEmergencyContent || false).toString()
        });
        res.send(textContent);

    } catch (error) {
        console.error('❌ Content extraction error (GET):', error);
        res.status(500).send(`Error: ${error.message}`);
    }
});

// Screenshot endpoint (GET)
app.get('/api/screenshot', async (req, res) => {
    try {
        // Check authentication
        const token = req.query.token;
        if (token !== AUTH_TOKEN) {
            return res.status(401).send('Unauthorized: Invalid token');
        }

        // Get URL from query parameter
        const url = req.query.url;
        if (!url) {
            return res.status(400).send('Missing required parameter: url');
        }

        try {
            new URL(url);
        } catch (e) {
            return res.status(400).send('Invalid URL format');
        }

        console.log(`📸 Taking screenshot: ${url}`);

        // Build options from query parameters
        const options = {
            url,
            timeout: parseInt(req.query.timeout) || 30000,
            fullPage: req.query.fullPage === 'true',
            screenshotFormat: req.query.format === 'jpeg' ? 'jpeg' : 'png',
            viewport: {
                width: parseInt(req.query.width) || 1920,
                height: parseInt(req.query.height) || 1080
            },
            returnPartialOnTimeout: req.query.returnPartial === 'true' // Default to false - prioritize complete execution
        };

        const result = await renderPageAdvanced(options);
        
        // Take screenshot
        const browser = await getBrowser();
        const context = await browser.newContext({ viewport: options.viewport });
        const page = await context.newPage();
        
        await page.setContent(result.html);
        await page.waitForTimeout(2000); // Wait for rendering
        
        const screenshotBuffer = await page.screenshot({
            fullPage: options.fullPage,
            type: options.screenshotFormat,
            quality: options.screenshotFormat === 'jpeg' ? 90 : undefined
        });
        
        await context.close();
        
        console.log(`✅ Screenshot taken: ${url}`);
        
        // Return screenshot with proper headers
        res.set({
            'Content-Type': `image/${options.screenshotFormat}`,
            'X-Rendered-URL': result.url,
            'X-Page-Title': result.title,
            'X-Timestamp': result.timestamp,
            'X-Was-Timeout': result.wasTimeout.toString(),
            'Content-Disposition': `inline; filename="screenshot-${Date.now()}.${options.screenshotFormat}"`
        });
        res.send(screenshotBuffer);

    } catch (error) {
        console.error('❌ Screenshot error:', error);
        res.status(500).send(`Error: ${error.message}`);
    }
});

// PDF endpoint (GET)
app.get('/api/pdf', async (req, res) => {
    try {
        // Check authentication
        const token = req.query.token;
        if (token !== AUTH_TOKEN) {
            return res.status(401).send('Unauthorized: Invalid token');
        }

        // Get URL from query parameter
        const url = req.query.url;
        if (!url) {
            return res.status(400).send('Missing required parameter: url');
        }

        try {
            new URL(url);
        } catch (e) {
            return res.status(400).send('Invalid URL format');
        }

        console.log(`📄 Generating PDF: ${url}`);

        // Build options from query parameters
        const options = {
            url,
            timeout: parseInt(req.query.timeout) || 30000,
            returnPartialOnTimeout: req.query.returnPartial === 'true' // Default to false - prioritize complete execution
        };

        const result = await renderPageAdvanced(options);
        
        // Generate PDF
        const browser = await getBrowser();
        const context = await browser.newContext();
        const page = await context.newPage();
        
        await page.setContent(result.html);
        await page.waitForTimeout(2000); // Wait for rendering
        
        const pdfBuffer = await page.pdf({
            format: req.query.format || 'A4',
            printBackground: req.query.background !== 'false',
            margin: {
                top: req.query.marginTop || '20px',
                right: req.query.marginRight || '20px',
                bottom: req.query.marginBottom || '20px',
                left: req.query.marginLeft || '20px'
            }
        });
        
        await context.close();
        
        console.log(`✅ PDF generated: ${url}`);
        
        // Return PDF with proper headers
        res.set({
            'Content-Type': 'application/pdf',
            'X-Rendered-URL': result.url,
            'X-Page-Title': result.title,
            'X-Timestamp': result.timestamp,
            'X-Was-Timeout': result.wasTimeout.toString(),
            'Content-Disposition': `inline; filename="page-${Date.now()}.pdf"`
        });
        res.send(pdfBuffer);

    } catch (error) {
        console.error('❌ PDF error:', error);
        res.status(500).send(`Error: ${error.message}`);
    }
});

// Batch processing endpoint (POST)
app.post('/api/batch', async (req, res) => {
    try {
        // Check authentication
        const token = req.query.token || req.headers['x-token'] || req.headers['authorization']?.replace('Bearer ', '');
        if (token !== AUTH_TOKEN) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        // Validate URLs
        const { urls, concurrency = 3, ...commonOptions } = req.body;
        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return res.status(400).json({ error: 'Missing required field: urls (array)' });
        }

        if (urls.length > 10) {
            return res.status(400).json({ error: 'Maximum 10 URLs allowed per batch' });
        }

        // Validate all URLs
        for (const url of urls) {
            try {
                new URL(url);
            } catch (e) {
                return res.status(400).json({ error: `Invalid URL format: ${url}` });
            }
        }

        console.log(`🚀 Batch processing ${urls.length} URLs with concurrency ${concurrency}`);

        const results = [];
        const errors = [];
        
        // Process URLs in batches with controlled concurrency
        for (let i = 0; i < urls.length; i += concurrency) {
            const batch = urls.slice(i, i + concurrency);
            
            const batchPromises = batch.map(async (url) => {
                try {
                    const options = { 
                        ...commonOptions, 
                        url,
                        returnPartialOnTimeout: commonOptions.returnPartialOnTimeout === true 
                    };
                    const result = await renderPageAdvanced(options);
                    console.log(`✅ Batch item completed: ${url}`);
                    return { url, success: true, result };
                } catch (error) {
                    console.error(`❌ Batch item failed: ${url}`, error);
                    return { url, success: false, error: error.message };
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            
            batchResults.forEach(item => {
                if (item.success) {
                    results.push(item);
                } else {
                    errors.push(item);
                }
            });
        }

        console.log(`✅ Batch processing completed: ${results.length} successful, ${errors.length} failed`);

        res.json({
            totalUrls: urls.length,
            successful: results.length,
            failed: errors.length,
            results,
            errors,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Batch processing error:', error);
        res.status(500).json({ 
            error: 'Batch processing failed', 
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Serve static website files
// This should be after all API routes but before the 404 handler
const websitePath = path.join(__dirname, '..', 'website', 'out');

// Check if website build exists
if (fs.existsSync(websitePath)) {
    // Serve static files from the website build
    app.use(express.static(websitePath, {
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
    app.get(/^(?!\/api\/).*/, (req, res) => {
        // This regex ensures we only match routes that DON'T start with /api/
        res.sendFile(path.join(websitePath, 'index.html'));
    });
    
    console.log(`🌐 Website served from: ${websitePath}`);
} else {
    console.log(`⚠️ Website build not found at: ${websitePath}`);
    console.log(`   Run 'npm run build' in the website directory to build the website`);
    
    // Fallback route for when website is not built
    app.get('/', (req, res) => {
        res.json({
            message: 'HeadlessX v1.2.0 - Advanced Browserless Web Scraping API',
            status: 'Website not built',
            instructions: 'Run "npm run build" in the website directory to build the website',
            api: {
                health: '/api/health',
                status: '/api/status',
                documentation: 'See README.md for API endpoints'
            },
            timestamp: new Date().toISOString()
        });
    });
}

// 404 handler with helpful information (only for API routes now)
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        requestedPath: req.path,
        requestedMethod: req.method,
        availableEndpoints: [
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
        message: 'Use one of the available endpoints above',
        timestamp: new Date().toISOString()
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Shutting down gracefully...');
    if (browserInstance) {
        await browserInstance.close();
        console.log('✅ Browser closed');
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    if (browserInstance) {
        await browserInstance.close();
        console.log('✅ Browser closed');
    }
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 HeadlessX v1.2.0 - Advanced Browserless Web Scraping API running on port ${PORT}`);
    console.log(`🌐 Website: http://localhost:${PORT}/`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📊 Status: http://localhost:${PORT}/api/status`);
    console.log(`🔐 Auth token: ${AUTH_TOKEN}`);
    console.log(`✨ Features: Human-like behavior, anti-detection, advanced timeout handling`);
    console.log(`🎯 API Endpoints: /api/render, /api/html, /api/content, /api/screenshot, /api/pdf, /api/batch`);
    console.log(`📖 Documentation: Visit the website for full API documentation`);
});
