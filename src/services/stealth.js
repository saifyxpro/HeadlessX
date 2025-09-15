/**
 * Stealth Service
 * Advanced stealth techniques and scripts for avoiding bot detection
 * Enhanced with playwright-stealth.js techniques
 */

const crypto = require('crypto');
const { getRandomUserAgent, getRandomLocale, generateRealisticHeaders } = require('../config/browser');

// Enhanced WebGL renderers list for advanced fingerprint spoofing
const WEBGL_RENDERERS = [
    'ANGLE (NVIDIA Quadro 2000M Direct3D11 vs_5_0 ps_5_0)',
    'ANGLE (NVIDIA Quadro K420 Direct3D9Ex vs_3_0 ps_3_0)',
    'ANGLE (NVIDIA Quadro K2000M Direct3D11 vs_5_0 ps_5_0)',
    'ANGLE (Intel(R) HD Graphics 4000 Direct3D11 vs_5_0 ps_5_0)',
    'ANGLE (AMD Radeon R9 200 Series Direct3D11 vs_5_0 ps_5_0)',
    'ANGLE (Intel(R) HD Graphics Family Direct3D9Ex vs_3_0 ps_3_0)',
    'ANGLE (NVIDIA GeForce GTX 760 Direct3D11 vs_5_0 ps_5_0)',
    'ANGLE (Intel(R) HD Graphics 4600 Direct3D9Ex vs_3_0 ps_3_0)',
    'ANGLE (NVIDIA GeForce GTX 550 Ti Direct3D9Ex vs_3_0 ps_3_0)',
    'ANGLE (Intel(R) HD Graphics Direct3D9Ex vs_3_0 ps_3_0)',
    'ANGLE (AMD Radeon HD 6450 Direct3D9Ex vs_3_0 ps_3_0)',
    'ANGLE (NVIDIA GeForce GT 430 Direct3D9Ex vs_3_0 ps_3_0)'
];

// Generate consistent browser fingerprint
function generateAdvancedFingerprint(buid = crypto.randomUUID()) {
    const buidHash = crypto.createHash('sha512').update(buid).digest();
    
    const fingerprint = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        platform: 'Win32',
        appName: 'Netscape',
        screenWidth: 1920,
        screenHeight: 1080,
        viewportWidth: 1366,
        viewportHeight: 768,
        deviceCategory: 'desktop',
        WEBGL_VENDOR: 'Google Inc.',
        WEBGL_RENDERER: WEBGL_RENDERERS[Math.floor(Math.random() * WEBGL_RENDERERS.length)],
        BUID: buidHash.toString('base64'),
        languages: ['en-US', 'en'],
        timezone: 'America/New_York',
        deviceMemory: 8,
        hardwareConcurrency: 4
    };

    // Add random function for consistent randomness
    fingerprint.random = (index) => {
        const idx = index % 124;
        if (idx < 62) return buidHash.readUInt32BE(idx) / (2 ** 32 - 1);
        return buidHash.readUInt32LE(idx - 62) / (2 ** 32 - 1);
    };

    return fingerprint;
}

class StealthService {

    // ADVANCED PLAYWRIGHT-STEALTH FINGERPRINTING
    static async enhancePageWithAdvancedStealth(page) {
        try {
            console.log('🎭 Applying advanced playwright-stealth fingerprinting...');
            
            const fingerprint = generateAdvancedFingerprint();
            
            // Advanced fingerprint injection script
            await page.addInitScript((fp) => {
                // Remove webdriver property completely
                delete navigator.webdriver;
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined,
                    configurable: true
                });

                // Enhanced screen and window properties with fingerprint consistency
                Object.defineProperty(screen, 'width', { get: () => fp.screenWidth });
                Object.defineProperty(screen, 'height', { get: () => fp.screenHeight });
                Object.defineProperty(screen, 'availWidth', { get: () => fp.screenWidth });
                Object.defineProperty(screen, 'availHeight', { get: () => fp.screenHeight - 40 });
                Object.defineProperty(window, 'innerWidth', { get: () => fp.viewportWidth });
                Object.defineProperty(window, 'innerHeight', { get: () => fp.viewportHeight - 74 });
                Object.defineProperty(window, 'outerWidth', { get: () => fp.viewportWidth });
                Object.defineProperty(window, 'outerHeight', { get: () => fp.viewportHeight });

                // Enhanced navigator properties
                Object.defineProperty(navigator, 'userAgent', { get: () => fp.userAgent });
                Object.defineProperty(navigator, 'platform', { get: () => fp.platform });
                Object.defineProperty(navigator, 'appName', { get: () => fp.appName });
                Object.defineProperty(navigator, 'languages', { get: () => fp.languages });
                Object.defineProperty(navigator, 'deviceMemory', { get: () => fp.deviceMemory });
                Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => fp.hardwareConcurrency });

                // Advanced WebGL fingerprint spoofing
                const getContext = HTMLCanvasElement.prototype.getContext;
                HTMLCanvasElement.prototype.getContext = function(contextType, ...args) {
                    const context = getContext.call(this, contextType, ...args);
                    
                    if (contextType === 'webgl' || contextType === 'experimental-webgl') {
                        const getParameter = context.getParameter;
                        context.getParameter = function(parameter) {
                            // WEBGL_debug_renderer_info constants  
                            if (parameter === 37445) return fp.WEBGL_VENDOR; // UNMASKED_VENDOR_WEBGL
                            if (parameter === 37446) return fp.WEBGL_RENDERER; // UNMASKED_RENDERER_WEBGL
                            
                            // Additional WebGL parameters for consistency
                            if (parameter === 33901) return new Float32Array([1, 8191]);
                            if (parameter === 3386) return new Int32Array([16384, 16384]);
                            if (parameter === 35661) return 80;
                            if (parameter === 34076) return 16384;
                            if (parameter === 36349) return 1024;
                            if (parameter === 34024) return 16384;
                            if (parameter === 3379) return 16384;
                            if (parameter === 34921) return 16;
                            if (parameter === 36347) return 1024;
                            
                            return getParameter.call(this, parameter);
                        };
                        
                        // Enhanced extension spoofing
                        const getSupportedExtensions = context.getSupportedExtensions;
                        context.getSupportedExtensions = function() {
                            return [
                                'ANGLE_instanced_arrays', 'EXT_blend_minmax', 'EXT_color_buffer_half_float',
                                'EXT_frag_depth', 'EXT_shader_texture_lod', 'EXT_texture_filter_anisotropic',
                                'WEBKIT_EXT_texture_filter_anisotropic', 'EXT_sRGB', 'OES_element_index_uint',
                                'OES_standard_derivatives', 'OES_texture_float', 'OES_texture_float_linear',
                                'OES_texture_half_float', 'OES_texture_half_float_linear', 'OES_vertex_array_object',
                                'WEBGL_color_buffer_float', 'WEBGL_compressed_texture_s3tc', 'WEBKIT_WEBGL_compressed_texture_s3tc',
                                'WEBGL_compressed_texture_s3tc_srgb', 'WEBGL_debug_renderer_info', 'WEBGL_debug_shaders',
                                'WEBGL_depth_texture', 'WEBKIT_WEBGL_depth_texture', 'WEBGL_draw_buffers', 'WEBGL_lose_context'
                            ];
                        };
                    }
                    
                    return context;
                };

                // Enhanced plugins spoofing with realistic plugin list
                const plugins = {
                    length: 4,
                    0: {
                        name: 'Chrome PDF Plugin',
                        filename: 'internal-pdf-viewer',
                        description: 'Portable Document Format',
                        length: 1,
                        0: { type: 'application/x-google-chrome-pdf', suffixes: 'pdf', description: 'Portable Document Format' }
                    },
                    1: {
                        name: 'Chrome PDF Viewer',
                        filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
                        description: '',
                        length: 1,
                        0: { type: 'application/pdf', suffixes: 'pdf', description: '' }
                    },
                    2: {
                        name: 'Native Client',
                        filename: fp.platform === 'Win32' ? 'pepflashplayer.dll' : 'internal-nacl-plugin',
                        description: '',
                        length: 5,
                        0: { type: 'application/x-nacl', suffixes: '', description: 'Native Client Executable' },
                        1: { type: 'application/x-pnacl', suffixes: '', description: 'Portable Native Client Executable' },
                        2: { type: 'text/html', suffixes: '', description: '' },
                        3: { type: 'application/x-ppapi-vysor', suffixes: '', description: '' },
                        4: { type: 'application/x-ppapi-vysor-audio', suffixes: '', description: '' }
                    },
                    3: {
                        name: 'Widevine Content Decryption Module',
                        filename: fp.platform === 'Win32' ? 'widevinecdmadapter.dll' : 'widevinecdmadapter.plugin',
                        description: 'Enables Widevine licenses for playback of HTML audio/video content.',
                        length: 1,
                        0: { type: 'application/x-ppapi-widevine-cdm', suffixes: '', description: 'Widevine Content Decryption Module' }
                    }
                };
                Object.defineProperty(navigator, 'plugins', { get: () => plugins });

                // Canvas fingerprinting protection with BUID consistency
                const toDataURL = HTMLCanvasElement.prototype.toDataURL;
                HTMLCanvasElement.prototype.toDataURL = function(...args) {
                    const context = this.getContext('2d');
                    if (context) {
                        // Add consistent noise based on BUID
                        const imageData = context.getImageData(0, 0, this.width, this.height);
                        const data = imageData.data;
                        
                        for (let i = 0; i < data.length; i += 4) {
                            const noise = Math.floor(fp.random(i) * 3) - 1;
                            data[i] = Math.max(0, Math.min(255, data[i] + noise));
                        }
                        
                        context.putImageData(imageData, 0, 0);
                    }
                    return toDataURL.apply(this, args);
                };

                // Enhanced canvas text rendering with BUID signature
                const fillText = CanvasRenderingContext2D.prototype.fillText;
                CanvasRenderingContext2D.prototype.fillText = function(text, x, y, maxWidth) {
                    // Inject BUID into canvas for consistency
                    const modifiedText = text + fp.BUID.slice(-4);
                    return fillText.call(this, modifiedText, Math.max(0, x - 2), Math.max(0, y - 2), maxWidth);
                };

                // Block WebRTC completely to prevent IP leaks
                const blockWebRTC = () => undefined;
                Object.defineProperty(window, 'RTCPeerConnection', { get: blockWebRTC });
                Object.defineProperty(window, 'webkitRTCPeerConnection', { get: blockWebRTC });
                Object.defineProperty(window, 'mozRTCPeerConnection', { get: blockWebRTC });
                Object.defineProperty(navigator, 'getUserMedia', { get: blockWebRTC });
                Object.defineProperty(navigator, 'webkitGetUserMedia', { get: blockWebRTC });

                // Enhanced permissions API spoofing
                if (navigator.permissions && navigator.permissions.query) {
                    const originalQuery = navigator.permissions.query;
                    navigator.permissions.query = (parameters) => {
                        if (parameters.name === 'notifications') {
                            return Promise.resolve({ state: 'default' });
                        }
                        return originalQuery.call(navigator.permissions, parameters);
                    };
                }

                // Remove battery API (privacy concern)
                if ('getBattery' in navigator) {
                    delete navigator.getBattery;
                }

                // Chrome runtime spoofing for better compatibility
                if (!window.chrome) {
                    window.chrome = {
                        runtime: {
                            onConnect: undefined,
                            onMessage: undefined
                        }
                    };
                }

                console.log('🎯 Advanced fingerprint applied:', {
                    webgl: fp.WEBGL_RENDERER,
                    ua: fp.userAgent.slice(0, 30) + '...',
                    viewport: `${fp.viewportWidth}x${fp.viewportHeight}`,
                    buid: fp.BUID.slice(0, 8) + '...'
                });

            }, fingerprint);

            // Set realistic viewport
            await page.setViewportSize({ 
                width: fingerprint.viewportWidth, 
                height: fingerprint.viewportHeight 
            });

            // Enhanced headers with fingerprint data
            await page.setExtraHTTPHeaders({
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': fingerprint.languages.join(',') + ';q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'max-age=0',
                'Sec-Ch-Ua': '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': `"${fingerprint.platform === 'Win32' ? 'Windows' : 'Linux'}"`,
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
                'User-Agent': fingerprint.userAgent
            });

            console.log('✅ Advanced playwright-stealth fingerprinting complete');
            return fingerprint;

        } catch (error) {
            console.error('❌ Error applying advanced stealth:', error);
            return null;
        }
    }
    
    // Generate stealth context options optimized for datacenter IPs and Google bypass
    static generateStealthContextOptions(userAgent = null, customHeaders = {}) {
        const realisticUserAgent = userAgent || getRandomUserAgent();
        const realisticLocale = getRandomLocale();
        const realisticHeaders = generateRealisticHeaders(realisticUserAgent, customHeaders);
        
        return {
            viewport: { width: 1920, height: 1080 }, // Standard desktop viewport
            userAgent: realisticUserAgent,
            locale: realisticLocale.locale,
            timezoneId: realisticLocale.timezone,
            extraHTTPHeaders: {
                // DATACENTER IP OPTIMIZATION: Perfect Chrome headers for server environments
                'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not=A?Brand";v="8"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-ch-ua-arch': '"x86"',
                'sec-ch-ua-bitness': '"64"',
                'sec-ch-ua-full-version': '"131.0.6778.86"',
                'sec-ch-ua-full-version-list': '"Google Chrome";v="131.0.6778.86", "Chromium";v="131.0.6778.86", "Not=A?Brand";v="8.0.0.0"',
                'sec-ch-ua-model': '""',
                'sec-ch-ua-platform-version': '"15.0.0"',
                'sec-ch-ua-wow64': '?0',
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
                // DATACENTER FRIENDLY: Additional headers to appear more residential
                'sec-ch-viewport-width': '1920',
                'sec-ch-viewport-height': '1080',
                'sec-ch-device-memory': '8',
                'sec-ch-dpr': '1',
                'sec-gpc': '1',
                'dnt': '1',
                'Cache-Control': 'max-age=0',
                'Pragma': 'no-cache',
                // GOOGLE BYPASS: Additional enterprise-like headers
                'sec-ch-prefers-color-scheme': 'light',
                'sec-ch-prefers-reduced-motion': 'no-preference',
                ...realisticHeaders
            },
            ignoreHTTPSErrors: true,
            javaScriptEnabled: true,
            permissions: ['geolocation'], // Minimal permissions to avoid suspicion
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
            acceptDownloads: false,
            // DATACENTER OPTIMIZATION: Additional context options
            geolocation: { latitude: 40.7128, longitude: -74.0060 } // New York coordinates
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

                // === GOOGLE-SPECIFIC BYPASSES FOR DATACENTER IPs ===
                if (location.href.includes('google.')) {
                    // Hide automation traces from Google's detection
                    const originalQuerySelector = document.querySelector;
                    document.querySelector = function(selector) {
                        if (typeof selector === 'string' && (selector.includes('playwright') || selector.includes('webdriver'))) {
                            return null;
                        }
                        return originalQuerySelector.call(this, selector);
                    };

                    // DATACENTER IP OPTIMIZATION: Simulate enterprise browser behavior
                    Object.defineProperty(navigator, 'connection', {
                        get: () => ({
                            effectiveType: '4g',
                            rtt: 50,
                            downlink: 10,
                            saveData: false,
                            onchange: null
                        }),
                        configurable: true
                    });

                    // Enterprise-like timezone handling
                    try {
                        Intl.DateTimeFormat().resolvedOptions = function() {
                            return {
                                locale: 'en-US',
                                numberingSystem: 'latn',
                                calendar: 'gregory',
                                timeZone: 'America/New_York'
                            };
                        };
                    } catch (e) {}

                    // Simulate realistic interaction history for Google
                    window._mouseHistory = [];
                    window._keyHistory = [];
                    window._scrollHistory = [];
                    
                    // Add realistic event listeners
                    ['mousedown', 'mouseup', 'click', 'mousemove'].forEach(event => {
                        document.addEventListener(event, (e) => {
                            window._mouseHistory.push({ 
                                type: event, 
                                timestamp: Date.now(), 
                                x: e.clientX, 
                                y: e.clientY,
                                isTrusted: true
                            });
                            if (window._mouseHistory.length > 100) window._mouseHistory.shift();
                        }, true);
                    });

                    ['keydown', 'keyup', 'keypress'].forEach(event => {
                        document.addEventListener(event, (e) => {
                            window._keyHistory.push({ 
                                type: event, 
                                timestamp: Date.now(), 
                                key: e.key,
                                isTrusted: true
                            });
                            if (window._keyHistory.length > 50) window._keyHistory.shift();
                        }, true);
                    });

                    // Scroll behavior tracking
                    document.addEventListener('scroll', (e) => {
                        window._scrollHistory.push({
                            timestamp: Date.now(),
                            scrollY: window.scrollY,
                            scrollX: window.scrollX
                        });
                        if (window._scrollHistory.length > 50) window._scrollHistory.shift();
                    }, true);

                    // DATACENTER BYPASS: Override geolocation for consistency
                    if (navigator.geolocation) {
                        const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition;
                        navigator.geolocation.getCurrentPosition = function(success, error, options) {
                            setTimeout(() => {
                                success({
                                    coords: {
                                        latitude: 40.7128,
                                        longitude: -74.0060,
                                        accuracy: 100,
                                        altitude: null,
                                        altitudeAccuracy: null,
                                        heading: null,
                                        speed: null
                                    },
                                    timestamp: Date.now()
                                });
                            }, Math.random() * 100 + 50);
                        };
                    }

                    // Force desktop viewport for Google consistency
                    const viewportMeta = document.querySelector('meta[name="viewport"]');
                    if (viewportMeta) {
                        viewportMeta.setAttribute('content', 'width=1920, initial-scale=1.0');
                    } else {
                        const meta = document.createElement('meta');
                        meta.name = 'viewport';
                        meta.content = 'width=1920, initial-scale=1.0';
                        if (document.head) document.head.appendChild(meta);
                    }

                    // Simulate enterprise network characteristics
                    Object.defineProperty(window, 'performance', {
                        get: () => ({
                            ...window.performance,
                            timing: {
                                ...window.performance.timing,
                                connectStart: window.performance.timing.navigationStart + 10,
                                connectEnd: window.performance.timing.navigationStart + 25,
                                domainLookupStart: window.performance.timing.navigationStart + 5,
                                domainLookupEnd: window.performance.timing.navigationStart + 15
                            }
                        }),
                        configurable: true
                    });
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

    // Enhanced Google consent and anti-bot handling
    static async handleGoogleConsent(page) {
        try {
            // Wait for any dynamic content to load
            await page.waitForTimeout(2000);
            
            // Check for CAPTCHA or anti-bot pages first
            const pageContent = await page.evaluate(() => {
                return {
                    title: document.title,
                    bodyText: document.body ? document.body.innerText.slice(0, 1000) : '',
                    hasRecaptcha: !!document.querySelector('.g-recaptcha, #recaptcha, [data-recaptcha]'),
                    hasUnusualTraffic: /unusual traffic|automated queries|are you a robot/i.test(document.body ? document.body.innerText : '')
                };
            });
            
            if (pageContent.hasUnusualTraffic || pageContent.hasRecaptcha) {
                console.log('⚠️ Google anti-bot detection detected, attempting to wait it out...');
                await page.waitForTimeout(10000); // Wait longer for potential auto-resolution
                
                // Try refreshing the page once
                try {
                    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
                    await page.waitForTimeout(3000);
                } catch (e) {
                    console.log('⚠️ Page refresh failed during anti-bot handling');
                }
            }
            
            // Enhanced consent button detection
            const consentSelectors = [
                'button[id*="accept"]',
                'button[data-action="accept"]',
                'button:has-text("Accept all")',
                'button:has-text("I agree")',
                'button:has-text("Accept")',
                'button:has-text("Acepto")', // Spanish
                'button:has-text("Accepter")', // French
                '#L2AGLb', // Google consent button
                '[aria-label*="Accept"]',
                '[aria-label*="accept"]',
                '.VfPpkd-LgbsSe[aria-label*="Accept"]', // Material Design button
                'button[jsname]', // Google buttons often have jsname
                '[role="button"]:has-text("Accept")',
                '[role="button"]:has-text("I agree")'
            ];
            
            let consentHandled = false;
            for (const selector of consentSelectors) {
                try {
                    const elements = await page.locator(selector);
                    const count = await elements.count();
                    
                    for (let i = 0; i < count; i++) {
                        const element = elements.nth(i);
                        if (await element.isVisible({ timeout: 1000 })) {
                            await element.click({ timeout: 5000 });
                            console.log(`✅ Clicked consent button: ${selector} (${i})`);
                            await page.waitForTimeout(2000);
                            consentHandled = true;
                            break;
                        }
                    }
                    if (consentHandled) break;
                } catch (e) {
                    // Continue to next selector
                }
            }
            
            // Additional wait after consent
            if (consentHandled) {
                await page.waitForTimeout(3000);
                console.log('✅ Google consent handling completed');
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