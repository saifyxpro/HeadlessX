/**
 * HeadlessX v1.1.0 - Advanced Browserless Web Scraping API with Human-like Behavior
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
 * Updated: September 12, 2025
 */

const express = require('express');
const bodyParser = require('body-parser');
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

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

// Realistic Windows User Agents Pool (Updated September 2025)
const REALISTIC_USER_AGENTS = [
    // Chrome on Windows 11
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    
    // Edge on Windows 11
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0',
    
    // Firefox on Windows 11
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
    
    // Chrome on Windows 10
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
];

// Realistic Windows locales and languages
const REALISTIC_LOCALES = [
    { locale: 'en-US', timezone: 'America/New_York', languages: ['en-US', 'en'] },
    { locale: 'en-GB', timezone: 'Europe/London', languages: ['en-GB', 'en'] },
    { locale: 'en-US', timezone: 'America/Los_Angeles', languages: ['en-US', 'en'] },
    { locale: 'en-US', timezone: 'America/Chicago', languages: ['en-US', 'en'] },
    { locale: 'en-CA', timezone: 'America/Toronto', languages: ['en-CA', 'en'] }
];

// Function to get random realistic user agent
function getRandomUserAgent() {
    return REALISTIC_USER_AGENTS[Math.floor(Math.random() * REALISTIC_USER_AGENTS.length)];
}

// Function to get random locale settings
function getRandomLocale() {
    return REALISTIC_LOCALES[Math.floor(Math.random() * REALISTIC_LOCALES.length)];
}

// Function to generate realistic headers based on user agent
function generateRealisticHeaders(userAgent, customHeaders = {}) {
    const isChrome = userAgent.includes('Chrome') && !userAgent.includes('Edg');
    const isEdge = userAgent.includes('Edg');
    const isFirefox = userAgent.includes('Firefox');
    
    const baseHeaders = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Cache-Control': 'max-age=0',
        'Upgrade-Insecure-Requests': '1',
        'DNT': '1', // Do Not Track
        'Connection': 'keep-alive'
    };

    // Browser-specific headers
    if (isChrome || isEdge) {
        baseHeaders['sec-ch-ua'] = isEdge 
            ? '"Chromium";v="128", "Not;A=Brand";v="24", "Microsoft Edge";v="128"'
            : '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"';
        baseHeaders['sec-ch-ua-mobile'] = '?0';
        baseHeaders['sec-ch-ua-platform'] = '"Windows"';
        baseHeaders['Sec-Fetch-Dest'] = 'document';
        baseHeaders['Sec-Fetch-Mode'] = 'navigate';
        baseHeaders['Sec-Fetch-Site'] = 'none';
        baseHeaders['Sec-Fetch-User'] = '?1';
    } else if (isFirefox) {
        // Firefox doesn't send sec-ch-ua headers
        delete baseHeaders['sec-ch-ua'];
        delete baseHeaders['sec-ch-ua-mobile'];
        delete baseHeaders['sec-ch-ua-platform'];
        // Firefox uses different Sec-Fetch headers
        baseHeaders['Sec-Fetch-Dest'] = 'document';
        baseHeaders['Sec-Fetch-Mode'] = 'navigate';
        baseHeaders['Sec-Fetch-Site'] = 'none';
        baseHeaders['Sec-Fetch-User'] = '?1';
    }

    // Add random realistic headers occasionally
    if (Math.random() > 0.7) {
        baseHeaders['Pragma'] = 'no-cache';
    }
    
    if (Math.random() > 0.8) {
        baseHeaders['X-Requested-With'] = Math.random() > 0.5 ? 'XMLHttpRequest' : undefined;
    }

    // Merge with custom headers (custom headers take priority)
    return { ...baseHeaders, ...customHeaders };
}

// Browser pool for better performance
let browserInstance = null;

// Initialize persistent browser
async function getBrowser() {
    if (!browserInstance || !browserInstance.isConnected()) {
        console.log('🚀 Launching new realistic browser instance...');
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
    }
    return browserInstance;
}

// Enhanced timeout handler function with fallback
async function withTimeoutFallback(asyncOperation, fallbackOperation = null, timeoutMs = 30000) {
    return new Promise(async (resolve, reject) => {
        let completed = false;
        
        // Set timeout
        const timeoutId = setTimeout(() => {
            if (!completed) {
                completed = true;
                console.log(`⏰ Operation timed out after ${timeoutMs}ms, attempting fallback...`);
                if (fallbackOperation) {
                    fallbackOperation().then(resolve).catch(reject);
                } else {
                    reject(new Error(`Operation timed out after ${timeoutMs}ms`));
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
                console.log(`❌ Operation failed: ${error.message}, attempting fallback...`);
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
        timeout = 60000,
        extraWaitTime = 10000,
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
        returnPartialOnTimeout = true, // New option to return partial content on timeout
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
        const realisticUserAgent = userAgent || getRandomUserAgent();
        const realisticLocale = getRandomLocale();
        const realisticHeaders = generateRealisticHeaders(realisticUserAgent, headers);
        
        console.log(`🎭 Using User Agent: ${realisticUserAgent.substring(0, 80)}...`);
        console.log(`🌍 Using Locale: ${realisticLocale.locale} (${realisticLocale.timezone})`);
        
        // Create new browser context with realistic stealth settings
        context = await browser.newContext({
            viewport,
            userAgent: realisticUserAgent,
            locale: realisticLocale.locale,
            timezoneId: realisticLocale.timezone,
            extraHTTPHeaders: realisticHeaders,
            ignoreHTTPSErrors: true,
            javaScriptEnabled: true,
            permissions: ['geolocation', 'notifications', 'camera', 'microphone'],
            colorScheme: Math.random() > 0.2 ? 'light' : 'dark', // Mostly light mode
            reducedMotion: Math.random() > 0.9 ? 'reduce' : 'no-preference',
            forcedColors: 'none',
            // Realistic screen settings
            screen: {
                width: viewport.width,
                height: viewport.height
            },
            // Add realistic device features
            hasTouch: false, // Desktop Windows
            isMobile: false,
            deviceScaleFactor: Math.random() > 0.7 ? 1.25 : 1, // Some users have scaling
        });

        // Add cookies if provided
        if (cookies.length > 0) {
            await context.addCookies(cookies);
        }

        // Create page
        page = await context.newPage();

        // Set shorter individual timeouts but handle them gracefully
        page.setDefaultTimeout(Math.min(timeout / 2, 30000));
        page.setDefaultNavigationTimeout(Math.min(timeout, 60000));

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

        // Add comprehensive stealth scripts to avoid detection
        await page.addInitScript(() => {
            // Remove webdriver properties completely
            delete navigator.__proto__.webdriver;
            delete navigator.webdriver;
            
            // Override webdriver property more thoroughly
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
                configurable: true
            });

            // Remove automation indicators
            delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
            delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
            delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
            
            // Override chrome runtime
            if (!window.chrome) {
                window.chrome = {};
            }
            
            if (!window.chrome.runtime) {
                window.chrome.runtime = {
                    onConnect: undefined,
                    onMessage: undefined,
                    id: 'extension-id-placeholder'
                };
            }

            // Realistic plugins array (Windows typical plugins)
            const plugins = [
                { name: 'PDF Viewer', description: 'Portable Document Format', filename: 'internal-pdf-viewer' },
                { name: 'Chrome PDF Viewer', description: 'Portable Document Format', filename: 'internal-pdf-viewer' },
                { name: 'Chromium PDF Viewer', description: 'Portable Document Format', filename: 'internal-pdf-viewer' },
                { name: 'Microsoft Edge PDF Viewer', description: 'Portable Document Format', filename: 'internal-pdf-viewer' },
                { name: 'WebKit built-in PDF', description: 'Portable Document Format', filename: 'internal-pdf-viewer' }
            ];
            
            Object.defineProperty(navigator, 'plugins', {
                get: () => plugins,
                configurable: true
            });

            // Realistic mimeTypes
            Object.defineProperty(navigator, 'mimeTypes', {
                get: () => [
                    { type: 'application/pdf', description: 'Portable Document Format', suffixes: 'pdf' }
                ],
                configurable: true
            });

            // More realistic language settings
            const languages = ['en-US', 'en'];
            Object.defineProperty(navigator, 'languages', {
                get: () => languages,
                configurable: true
            });

            // Realistic hardware concurrency (common Windows values)
            const cores = [4, 6, 8, 12, 16][Math.floor(Math.random() * 5)];
            Object.defineProperty(navigator, 'hardwareConcurrency', {
                get: () => cores,
                configurable: true
            });

            // Realistic device memory (Windows typical)
            const memory = [4, 8, 16, 32][Math.floor(Math.random() * 4)];
            Object.defineProperty(navigator, 'deviceMemory', {
                get: () => memory,
                configurable: true
            });

            // Override permissions API to be more realistic
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => {
                switch(parameters.name) {
                    case 'notifications':
                        return Promise.resolve({ state: Math.random() > 0.5 ? 'default' : 'denied' });
                    case 'geolocation':
                        return Promise.resolve({ state: 'prompt' });
                    case 'camera':
                        return Promise.resolve({ state: 'prompt' });
                    case 'microphone':
                        return Promise.resolve({ state: 'prompt' });
                    default:
                        return originalQuery ? originalQuery(parameters) : Promise.resolve({ state: 'prompt' });
                }
            };

            // Battery API (if supported)
            if ('getBattery' in navigator) {
                const originalGetBattery = navigator.getBattery;
                navigator.getBattery = () => Promise.resolve({
                    charging: Math.random() > 0.3, // 70% chance charging
                    chargingTime: Math.random() * 7200, // 0-2 hours
                    dischargingTime: Math.random() * 14400 + 3600, // 1-5 hours
                    level: Math.random() * 0.8 + 0.2 // 20-100%
                });
            }

            // Connection API (simulate Windows typical connection)
            if ('connection' in navigator) {
                Object.defineProperty(navigator, 'connection', {
                    get: () => ({
                        effectiveType: ['4g', 'wifi'][Math.floor(Math.random() * 2)],
                        rtt: Math.floor(Math.random() * 50) + 20, // 20-70ms
                        downlink: Math.floor(Math.random() * 90) + 10, // 10-100 Mbps
                        saveData: false
                    })
                });
            }

            // Screen properties (realistic Windows values)
            const screenWidth = screen.width;
            const screenHeight = screen.height;
            Object.defineProperty(screen, 'availWidth', {
                get: () => screenWidth,
                configurable: true
            });
            Object.defineProperty(screen, 'availHeight', {
                get: () => screenHeight - 40, // Taskbar height
                configurable: true
            });

            // Timezone consistency
            try {
                Date.prototype.getTimezoneOffset = function() {
                    return new Date().getTimezoneOffset();
                };
            } catch (e) {}

            // Remove automation-related properties from window
            ['_phantom', '__phantom', '_selenium', 'callPhantom', 'callSelenium', '__webdriver_script_fn'].forEach(prop => {
                delete window[prop];
            });

            // Add some noise to timing functions (slight randomness)
            const originalNow = performance.now;
            performance.now = function() {
                return originalNow.call(performance) + (Math.random() - 0.5) * 0.1;
            };

            // Mouse movement tracking (add some realism)
            let mouseX = Math.floor(Math.random() * window.innerWidth);
            let mouseY = Math.floor(Math.random() * window.innerHeight);
            
            document.addEventListener('mousemove', (e) => {
                mouseX = e.clientX;
                mouseY = e.clientY;
            });

            // Override toString methods to hide function modifications
            const originalToString = Function.prototype.toString;
            Function.prototype.toString = function() {
                if (this === navigator.permissions.query) {
                    return 'function query() { [native code] }';
                }
                if (this === performance.now) {
                    return 'function now() { [native code] }';
                }
                return originalToString.call(this);
            };
        });

        console.log(`🌐 Navigating to: ${url}`);

        // Navigate with timeout handling and fallback
        await withTimeoutFallback(
            async () => {
                await page.goto(url, { 
                    waitUntil: waitUntil === 'networkidle0' ? 'networkidle' : waitUntil,
                    timeout: timeout
                });
                console.log('📄 Page loaded successfully');
            },
            returnPartialOnTimeout ? async () => {
                wasTimeout = true;
                console.log('⚠️ Navigation timeout, but continuing with partial content...');
                // Try a simpler navigation
                try {
                    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
                    console.log('📄 Page loaded with domcontentloaded (partial)');
                } catch (e) {
                    console.log('⚠️ Even simple navigation failed, checking if page has any content...');
                    // Check if we have any content at all
                    const currentUrl = page.url();
                    if (!currentUrl || currentUrl === 'about:blank') {
                        throw new Error('Page failed to load completely');
                    }
                }
            } : null,
            timeout
        );

        // Continue with dynamic content loading (with shorter timeouts due to potential initial timeout)
        const remainingTime = wasTimeout ? Math.min(extraWaitTime, 5000) : extraWaitTime;
        
        if (!wasTimeout) {
            console.log('📄 Page loaded, waiting for dynamic content...');
            
            // Wait for specific selectors if provided (with timeout handling)
            if (waitForSelectors.length > 0) {
                console.log(`⏳ Waiting for selectors: ${waitForSelectors.join(', ')}`);
                for (const selector of waitForSelectors) {
                    try {
                        await withTimeoutFallback(
                            () => page.waitForSelector(selector, { timeout: 15000 }),
                            () => {
                                console.log(`⚠️ Selector timeout (continuing): ${selector}`);
                                return Promise.resolve();
                            },
                            15000
                        );
                        console.log(`✅ Found selector: ${selector}`);
                    } catch (e) {
                        console.log(`⚠️ Selector not found: ${selector}`);
                    }
                }
            }

            // Click elements if specified (with timeout handling)
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
                            10000
                        );
                    } catch (e) {
                        console.log(`⚠️ Could not click: ${selector}`);
                    }
                }
            }

            // Simulate human-like behavior (mouse movements, interactions)
            console.log('🎭 Simulating human behavior...');
            try {
                await simulateHumanBehavior(page);
            } catch (e) {
                console.log('⚠️ Human behavior simulation failed, continuing...');
            }

            // Scroll to bottom to trigger lazy loading (with timeout handling)
            if (scrollToBottom) {
                console.log('📜 Scrolling to load all content...');
                try {
                    await withTimeoutFallback(
                        () => autoScroll(page),
                        () => {
                            console.log('⚠️ Scroll timeout (continuing)');
                            return Promise.resolve();
                        },
                        15000
                    );
                } catch (e) {
                    console.log('⚠️ Scrolling failed, continuing...');
                }
            }

            // Wait for network to be idle (with timeout handling)
            if (waitForNetworkIdle) {
                console.log('🌐 Waiting for network idle...');
                try {
                    await withTimeoutFallback(
                        () => page.waitForLoadState('networkidle', { timeout: 20000 }),
                        () => {
                            console.log('⚠️ Network idle timeout (continuing)');
                            return Promise.resolve();
                        },
                        20000
                    );
                } catch (e) {
                    console.log('⚠️ Network idle wait failed, continuing...');
                }
            }
        }

        // Extra wait time for dynamic content (reduced if there was a timeout)
        if (remainingTime > 0) {
            console.log(`⏰ Extra wait time: ${remainingTime}ms`);
            await page.waitForTimeout(remainingTime);
        }

        // Execute custom script if provided (with timeout handling)
        if (customScript && !wasTimeout) {
            console.log('🔧 Executing custom script...');
            try {
                await withTimeoutFallback(
                    () => page.evaluate(customScript),
                    () => {
                        console.log('⚠️ Custom script timeout (continuing)');
                        return Promise.resolve();
                    },
                    10000
                );
            } catch (e) {
                console.log('⚠️ Custom script failed, continuing...');
            }
        }

        // Remove unwanted elements (with timeout handling)
        if (removeElements.length > 0 && !wasTimeout) {
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
            } catch (e) {
                console.log('⚠️ Screenshot failed, continuing...');
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
            } catch (e) {
                console.log('⚠️ PDF generation failed, continuing...');
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
        
        // If we have returnPartialOnTimeout enabled and this is a timeout, try to get whatever content we can
        if (returnPartialOnTimeout && (error.message.includes('Timeout') || error.name === 'TimeoutError')) {
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
                page2.setDefaultTimeout(10000);
                page2.setDefaultNavigationTimeout(15000);
                
                try {
                    await page2.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
                    await page2.waitForTimeout(3000); // Wait a bit for content
                    
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
        await page.evaluate(() => {
            // Simulate random mouse movements
            const moveCount = 3 + Math.floor(Math.random() * 5); // 3-7 movements
            let currentX = Math.floor(Math.random() * window.innerWidth);
            let currentY = Math.floor(Math.random() * window.innerHeight);
            
            const movements = [];
            for (let i = 0; i < moveCount; i++) {
                const targetX = Math.floor(Math.random() * window.innerWidth);
                const targetY = Math.floor(Math.random() * window.innerHeight);
                movements.push({ x: targetX, y: targetY });
            }
            
            // Dispatch mouse move events
            movements.forEach((pos, index) => {
                setTimeout(() => {
                    const event = new MouseEvent('mousemove', {
                        clientX: pos.x,
                        clientY: pos.y,
                        bubbles: true,
                        cancelable: true
                    });
                    document.dispatchEvent(event);
                    currentX = pos.x;
                    currentY = pos.y;
                }, index * 200 + Math.random() * 100);
            });
            
            // Simulate occasional clicks on safe elements
            setTimeout(() => {
                const safeElements = ['body', 'main', '.content', '.container'];
                const element = document.querySelector(safeElements[Math.floor(Math.random() * safeElements.length)]);
                if (element && Math.random() > 0.7) {
                    const rect = element.getBoundingClientRect();
                    const clickX = rect.left + Math.random() * rect.width;
                    const clickY = rect.top + Math.random() * rect.height;
                    
                    const clickEvent = new MouseEvent('click', {
                        clientX: clickX,
                        clientY: clickY,
                        bubbles: true,
                        cancelable: true
                    });
                    element.dispatchEvent(clickEvent);
                }
            }, moveCount * 250);
        });
        
        // Wait for mouse simulation to complete
        await page.waitForTimeout(2000);
        
    } catch (error) {
        console.log('⚠️ Human behavior simulation failed:', error.message);
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
        version: '1.1.0',
        features: [
            'Advanced timeout handling',
            'Partial content recovery',
            'Emergency extraction',
            'Screenshot capture',
            'PDF generation',
            'Batch processing',
            'Clean text extraction',
            'Realistic user agent rotation',
            'Human-like behavior simulation',
            'Advanced stealth techniques'
        ]
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

        // Enable partial content return by default
        const options = { 
            ...req.body, 
            returnPartialOnTimeout: req.body.returnPartialOnTimeout !== false 
        };
        
        const result = await renderPageAdvanced(options);
        
        console.log(`✅ Successfully rendered: ${url} (${result.wasTimeout ? 'with timeouts' : 'complete'})`);
        res.json(result);

    } catch (error) {
        console.error('❌ Rendering error:', error);
        res.status(500).json({ 
            error: 'Failed to render page', 
            details: error.message,
            timestamp: new Date().toISOString()
        });
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

        // Enable partial content return by default
        const options = { 
            ...req.body, 
            returnPartialOnTimeout: req.body.returnPartialOnTimeout !== false 
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
        res.status(500).send(`Error: ${error.message}`);
    }
});

// GET endpoint for HTML (easier for testing) with enhanced timeout handling
app.get('/api/html', async (req, res) => {
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

        console.log(`🚀 Advanced HTML rendering (GET): ${url}`);

        // Build options from query parameters
        const options = {
            url,
            waitUntil: req.query.waitUntil || 'networkidle',
            timeout: parseInt(req.query.timeout) || 60000,
            extraWaitTime: parseInt(req.query.extraWait) || 10000,
            scrollToBottom: req.query.scroll !== 'false',
            waitForNetworkIdle: req.query.networkIdle !== 'false',
            captureConsole: req.query.console === 'true',
            returnPartialOnTimeout: req.query.returnPartial !== 'false' // Default to true
        };

        // Parse arrays from query parameters
        if (req.query.waitForSelectors) {
            options.waitForSelectors = req.query.waitForSelectors.split(',');
        }
        if (req.query.clickSelectors) {
            options.clickSelectors = req.query.clickSelectors.split(',');
        }
        if (req.query.removeElements) {
            options.removeElements = req.query.removeElements.split(',');
        }

        const result = await renderPageAdvanced(options);
        
        console.log(`✅ Successfully rendered HTML (GET): ${url} (${result.wasTimeout ? 'with timeouts' : 'complete'})`);
        
        // Return raw HTML with headers
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
        console.error('❌ GET HTML rendering error:', error);
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

        // Enable partial content return by default
        const options = { 
            ...req.body, 
            returnPartialOnTimeout: req.body.returnPartialOnTimeout !== false 
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

// Content endpoint (returns clean text only - GET) with enhanced timeout handling
app.get('/api/content', async (req, res) => {
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

        console.log(`🚀 Advanced content extraction (GET): ${url}`);

        // Build options from query parameters
        const options = {
            url,
            waitUntil: req.query.waitUntil || 'networkidle',
            timeout: parseInt(req.query.timeout) || 60000,
            extraWaitTime: parseInt(req.query.extraWait) || 10000,
            scrollToBottom: req.query.scroll !== 'false',
            waitForNetworkIdle: req.query.networkIdle !== 'false',
            captureConsole: req.query.console === 'true',
            returnPartialOnTimeout: req.query.returnPartial !== 'false' // Default to true
        };

        // Parse arrays from query parameters
        if (req.query.waitForSelectors) {
            options.waitForSelectors = req.query.waitForSelectors.split(',');
        }
        if (req.query.clickSelectors) {
            options.clickSelectors = req.query.clickSelectors.split(',');
        }
        if (req.query.removeElements) {
            options.removeElements = req.query.removeElements.split(',');
        }

        const result = await renderPageAdvanced(options);
        
        // Extract clean text content
        const textContent = await extractCleanText(result.html);
        
        console.log(`✅ Successfully extracted content (GET): ${url} (${result.wasTimeout ? 'with timeouts' : 'complete'})`);
        console.log(`📝 Content length: ${textContent.length} characters`);
        
        // Return plain text with headers
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
        console.error('❌ GET Content extraction error:', error);
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
            returnPartialOnTimeout: req.query.returnPartial !== 'false'
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
            returnPartialOnTimeout: req.query.returnPartial !== 'false'
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
                        returnPartialOnTimeout: commonOptions.returnPartialOnTimeout !== false 
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
    app.get('*', (req, res) => {
        // Skip API routes
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({
                error: 'API endpoint not found',
                message: 'Check available API endpoints at /api/status'
            });
        }
        
        // Serve index.html for all other routes (SPA routing)
        res.sendFile(path.join(websitePath, 'index.html'));
    });
    
    console.log(`🌐 Website served from: ${websitePath}`);
} else {
    console.log(`⚠️ Website build not found at: ${websitePath}`);
    console.log(`   Run 'npm run build' in the website directory to build the website`);
    
    // Fallback route for when website is not built
    app.get('/', (req, res) => {
        res.json({
            message: 'HeadlessX v1.1.0 - Advanced Browserless Web Scraping API',
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
        error: 'Endpoint not found',
        availableEndpoints: [
            'GET /api/health - Server health check',
            'GET /api/status - Detailed server status',
            'POST /api/render - Full page rendering with JSON response',
            'POST /api/html - Raw HTML extraction',
            'GET /api/html - Raw HTML extraction (GET)',
            'POST /api/content - Clean text extraction',
            'GET /api/content - Clean text extraction (GET)',
            'GET /api/screenshot - Screenshot generation',
            'GET /api/pdf - PDF generation',
            'POST /api/batch - Batch URL processing'
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
    console.log(`🚀 HeadlessX v1.1.0 - Advanced Browserless Web Scraping API running on port ${PORT}`);
    console.log(`🌐 Website: http://localhost:${PORT}/`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📊 Status: http://localhost:${PORT}/api/status`);
    console.log(`🔐 Auth token: ${AUTH_TOKEN}`);
    console.log(`✨ Features: Human-like behavior, anti-detection, advanced timeout handling`);
    console.log(`🎯 API Endpoints: /api/render, /api/html, /api/content, /api/screenshot, /api/pdf, /api/batch`);
    console.log(`📖 Documentation: Visit the website for full API documentation`);
});
