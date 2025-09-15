/**
 * Stealth Service
 * Advanced stealth techniques and scripts for avoiding bot detection
 */

const { getRandomUserAgent, getRandomLocale, generateRealisticHeaders } = require('../config/browser');

class StealthService {
    
    // Generate stealth context options
    static generateStealthContextOptions(userAgent = null, customHeaders = {}) {
        const realisticUserAgent = userAgent || getRandomUserAgent();
        const realisticLocale = getRandomLocale();
        const realisticHeaders = generateRealisticHeaders(realisticUserAgent, customHeaders);
        
        return {
            viewport: { width: 1920, height: 1080 }, // Large desktop viewport
            userAgent: realisticUserAgent,
            locale: realisticLocale.locale,
            timezoneId: realisticLocale.timezone,
            extraHTTPHeaders: {
                // CRITICAL: Perfect Chrome 131 header order and values
                'sec-ch-ua': '"Google Chrome";v="131", "Not=A?Brand";v="8", "Chromium";v="131"',
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
                // ENTERPRISE: Additional Chrome-specific headers
                'sec-ch-ua-arch': '"x86"',
                'sec-ch-ua-bitness': '"64"',
                'sec-ch-ua-full-version': '"131.0.6778.86"',
                'sec-ch-ua-full-version-list': '"Google Chrome";v="131.0.6778.86", "Not=A?Brand";v="8.0.0.0", "Chromium";v="131.0.6778.86"',
                'sec-ch-ua-model': '""',
                'sec-ch-ua-platform-version': '"15.0.0"',
                'sec-ch-ua-wow64': '?0',
                'sec-ch-viewport-width': '1920',
                'sec-ch-viewport-height': '1080',
                'sec-ch-device-memory': '8',
                'sec-ch-dpr': '1',
                'sec-gpc': '1',
                'dnt': '1',
                ...realisticHeaders
            },
            ignoreHTTPSErrors: true,
            javaScriptEnabled: true,
            permissions: ['geolocation', 'notifications', 'camera', 'microphone', 'clipboard-read', 'clipboard-write'],
            colorScheme: 'light',
            reducedMotion: 'no-preference',
            forcedColors: 'none',
            screen: {
                width: 1920,
                height: 1080
            },
            hasTouch: false,
            isMobile: false,
            deviceScaleFactor: 1,
            bypassCSP: true,
            acceptDownloads: false
        };
    }

    // ADVANCED ENTERPRISE STEALTH SCRIPT - Complete Bot Detection Bypass
    static getStealthScript() {
        return () => {
            try {
                // === CORE AUTOMATION DETECTION REMOVAL ===
                // Remove all possible webdriver traces
                ['webdriver', '__webdriver_evaluate', '__selenium_evaluate', '__webdriver_script_function', 
                 '__webdriver_script_func', '__webdriver_script_fn', '__fxdriver_evaluate', '__driver_unwrapped', 
                 '__webdriver_unwrapped', '__driver_evaluate', '__selenium_unwrapped', '__fxdriver_unwrapped',
                 'webdriver', '__webdriver_script_fn', '__webdriver_script_func'].forEach(prop => {
                    try {
                        delete window[prop];
                        delete navigator[prop];
                        delete document[prop];
                        if (navigator.__proto__ && navigator.__proto__[prop]) {
                            delete navigator.__proto__[prop];
                        }
                    } catch (e) {}
                });

                // Chrome DevTools Protocol indicators
                ['cdc_adoQpoasnfa76pfcZLmcfl_Array', 'cdc_adoQpoasnfa76pfcZLmcfl_Promise', 'cdc_adoQpoasnfa76pfcZLmcfl_Symbol',
                 'cdc_adoQpoasnfa76pfcZLmcfl_JSON', 'cdc_adoQpoasnfa76pfcZLmcfl_Object'].forEach(prop => {
                    try {
                        delete window[prop];
                    } catch (e) {}
                });

                // Playwright indicators
                ['__playwright', '__pw_manual', '__pw_originals', '_playwright'].forEach(prop => {
                    try {
                        delete window[prop];
                    } catch (e) {}
                });

                // === NAVIGATOR SPOOFING ===
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined,
                    configurable: true,
                    enumerable: false
                });

                // Realistic User Agent (Latest Chrome)
                const realUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
                Object.defineProperty(navigator, 'userAgent', {
                    get: () => realUserAgent,
                    configurable: true
                });

                // Modern User Agent Data
                Object.defineProperty(navigator, 'userAgentData', {
                    get: () => ({
                        brands: [
                            { brand: 'Google Chrome', version: '131' },
                            { brand: 'Chromium', version: '131' },
                            { brand: 'Not_A Brand', version: '24' }
                        ],
                        mobile: false,
                        platform: 'Windows',
                        getHighEntropyValues: async (hints) => ({
                            architecture: 'x86',
                            bitness: '64',
                            brands: [
                                { brand: 'Google Chrome', version: '131' },
                                { brand: 'Chromium', version: '131' },
                                { brand: 'Not_A Brand', version: '24' }
                            ],
                            fullVersionList: [
                                { brand: 'Google Chrome', version: '131.0.6778.86' },
                                { brand: 'Chromium', version: '131.0.6778.86' },
                                { brand: 'Not_A Brand', version: '24.0.0.0' }
                            ],
                            mobile: false,
                            model: '',
                            platform: 'Windows',
                            platformVersion: '15.0.0',
                            uaFullVersion: '131.0.6778.86',
                            wow64: false
                        })
                    }),
                    configurable: true
                });

                // === SCREEN & VIEWPORT SPOOFING ===
                Object.defineProperty(screen, 'width', { get: () => 1920, configurable: true });
                Object.defineProperty(screen, 'height', { get: () => 1080, configurable: true });
                Object.defineProperty(screen, 'availWidth', { get: () => 1920, configurable: true });
                Object.defineProperty(screen, 'availHeight', { get: () => 1040, configurable: true });
                Object.defineProperty(screen, 'colorDepth', { get: () => 24, configurable: true });
                Object.defineProperty(screen, 'pixelDepth', { get: () => 24, configurable: true });

                Object.defineProperty(window, 'innerWidth', { get: () => 1920, configurable: true });
                Object.defineProperty(window, 'innerHeight', { get: () => 1080, configurable: true });
                Object.defineProperty(window, 'outerWidth', { get: () => 1920, configurable: true });
                Object.defineProperty(window, 'outerHeight', { get: () => 1080, configurable: true });

                // === DEVICE SPOOFING ===
                Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 0, configurable: true });
                Object.defineProperty(navigator, 'msMaxTouchPoints', { get: () => 0, configurable: true });
                Object.defineProperty(navigator, 'platform', { get: () => 'Win32', configurable: true });
                Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8, configurable: true });
                Object.defineProperty(navigator, 'deviceMemory', { get: () => 8, configurable: true });

                // === LANGUAGE & LOCALE ===
                Object.defineProperty(navigator, 'language', { get: () => 'en-US', configurable: true });
                Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'], configurable: true });

                // === PLUGINS & MIMETYPES ===
                const mockPlugins = [
                    { name: 'PDF Viewer', description: 'Portable Document Format', filename: 'internal-pdf-viewer' },
                    { name: 'Chrome PDF Viewer', description: 'Portable Document Format', filename: 'internal-pdf-viewer' },
                    { name: 'Chromium PDF Viewer', description: 'Portable Document Format', filename: 'internal-pdf-viewer' },
                    { name: 'Microsoft Edge PDF Viewer', description: 'Portable Document Format', filename: 'internal-pdf-viewer' },
                    { name: 'WebKit built-in PDF', description: 'Portable Document Format', filename: 'internal-pdf-viewer' }
                ];
                Object.defineProperty(navigator, 'plugins', {
                    get: () => mockPlugins,
                    configurable: true
                });

                const mockMimeTypes = [
                    { type: 'application/pdf', description: 'Portable Document Format', suffixes: 'pdf' },
                    { type: 'text/pdf', description: 'Portable Document Format', suffixes: 'pdf' }
                ];
                Object.defineProperty(navigator, 'mimeTypes', {
                    get: () => mockMimeTypes,
                    configurable: true
                });

                // === CHROME RUNTIME SPOOFING ===
                if (!window.chrome) {
                    window.chrome = {};
                }
                if (!window.chrome.runtime) {
                    window.chrome.runtime = {
                        onConnect: undefined,
                        onMessage: undefined,
                        id: 'mhjfbmdgcfjbbpaeojofohoefgiehjai'
                    };
                }

                // === PERMISSIONS API ===
                if (navigator.permissions && navigator.permissions.query) {
                    const originalQuery = navigator.permissions.query;
                    navigator.permissions.query = function(parameters) {
                        return originalQuery.call(this, parameters).catch(() => Promise.resolve({ state: 'granted' }));
                    };
                }

                // === GOOGLE-SPECIFIC BYPASSES ===
                if (location.href.includes('google.')) {
                    // Hide automation traces from Google's detection
                    const originalQuerySelector = document.querySelector;
                    document.querySelector = function(selector) {
                        if (typeof selector === 'string' && (selector.includes('playwright') || selector.includes('webdriver'))) {
                            return null;
                        }
                        return originalQuerySelector.call(this, selector);
                    };

                    // Simulate realistic interaction history
                    window._mouseHistory = [];
                    window._keyHistory = [];
                    
                    // Add event listeners for realistic behavior tracking
                    ['mousedown', 'mouseup', 'click', 'mousemove'].forEach(event => {
                        document.addEventListener(event, (e) => {
                            window._mouseHistory.push({ type: event, timestamp: Date.now(), x: e.clientX, y: e.clientY });
                            if (window._mouseHistory.length > 50) window._mouseHistory.shift();
                        }, true);
                    });

                    ['keydown', 'keyup'].forEach(event => {
                        document.addEventListener(event, (e) => {
                            window._keyHistory.push({ type: event, timestamp: Date.now(), key: e.key });
                            if (window._keyHistory.length > 50) window._keyHistory.shift();
                        }, true);
                    });

                    // Force desktop viewport for Google
                    const viewportMeta = document.querySelector('meta[name="viewport"]');
                    if (viewportMeta) {
                        viewportMeta.setAttribute('content', 'width=1920, initial-scale=1.0');
                    } else {
                        const meta = document.createElement('meta');
                        meta.name = 'viewport';
                        meta.content = 'width=1920, initial-scale=1.0';
                        document.head?.appendChild(meta);
                    }
                }

                // === ADVANCED STEALTH ===
                // Override toString to hide modifications
                const descriptors = Object.getOwnPropertyDescriptors(Function.prototype);
                const originalToString = descriptors.toString.value;
                
                Function.prototype.toString = function() {
                    if (this === navigator.permissions.query) {
                        return 'function query() { [native code] }';
                    }
                    if (this === Function.prototype.toString) {
                        return 'function toString() { [native code] }';
                    }
                    return originalToString.call(this);
                };

                // Hide script modifications by making them non-enumerable
                Object.defineProperty(Function.prototype, 'toString', {
                    ...descriptors.toString,
                    value: Function.prototype.toString
                });

            } catch (e) {
                // Silently fail to avoid detection
            }
        };
    }

    // Google consent handling
    static async handleGoogleConsent(page) {
        try {
            // Wait for potential consent forms
            await page.waitForTimeout(1000);
            
            // Try to accept Google consent
            const consentSelectors = [
                'button[id*="accept"]',
                'button[data-action="accept"]',
                'button:has-text("Accept all")',
                'button:has-text("I agree")',
                'button:has-text("Accept")',
                '#L2AGLb', // Google consent button
                '[aria-label*="Accept"]'
            ];
            
            for (const selector of consentSelectors) {
                try {
                    const button = await page.locator(selector).first();
                    if (await button.isVisible({ timeout: 2000 })) {
                        await button.click();
                        console.log(`✅ Clicked consent button: ${selector}`);
                        await page.waitForTimeout(1000);
                        break;
                    }
                } catch (e) {
                    // Continue to next selector
                }
            }
        } catch (error) {
            console.log('⚠️ Google consent handling failed (continuing):', error.message);
        }
    }

    // Set up request interception for perfect headers
    static async setupRequestInterception(page) {
        await page.route('**/*', async (route) => {
            const request = route.request();
            
            // CRITICAL: Perfect Chrome headers for Schema.org detection bypass
            const perfectChromeHeaders = {
                ...request.headers(),
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'accept-language': 'en-US,en;q=0.9',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'sec-ch-ua': '"Google Chrome";v="131", "Not=A?Brand";v="8", "Chromium";v="131"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-ch-ua-arch': '"x86"',
                'sec-ch-ua-bitness': '"64"',
                'sec-ch-ua-model': '""',
                'sec-ch-ua-platform-version': '"15.0.0"',
                'sec-ch-ua-full-version': '"131.0.6778.86"',
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
    }

    // Setup Google consent cookies
    static async setupGoogleCookies(context, url) {
        try {
            if (url.includes('google.')) {
                const host = new URL(url).hostname.replace(/^www\./, '');
                const cookieDomain = '.' + host;
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
        } catch (error) {
            console.log('⚠️ Failed to set Google consent cookies (continuing):', error.message);
        }
    }
}

module.exports = StealthService;