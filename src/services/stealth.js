/**
 * Stealth Service v1.3.0 - Enhanced Anti-Detection
 * Advanced stealth techniques with comprehensive fingerprinting control
 * Features: Canvas, WebGL, WebRTC, Audio, Hardware, Behavioral Simulation
 */

const crypto = require('crypto');
const { getRandomUserAgent, getRandomLocale, generateRealisticHeaders } = require('../config/browser');

// Enhanced WebGL renderers list for advanced fingerprint spoofing
const WEBGL_RENDERERS = [
    // NVIDIA High-End Cards
    'ANGLE (NVIDIA GeForce RTX 4080 Direct3D11 vs_5_0 ps_5_0)',
    'ANGLE (NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0)',
    'ANGLE (NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0)',
    'ANGLE (NVIDIA GeForce GTX 1660 Ti Direct3D11 vs_5_0 ps_5_0)',
    'ANGLE (NVIDIA Quadro RTX 4000 Direct3D11 vs_5_0 ps_5_0)',
    'ANGLE (NVIDIA Quadro K2000M Direct3D11 vs_5_0 ps_5_0)',
    'ANGLE (NVIDIA GeForce GTX 760 Direct3D11 vs_5_0 ps_5_0)',
    'ANGLE (NVIDIA GeForce GTX 550 Ti Direct3D9Ex vs_3_0 ps_3_0)',
    'ANGLE (NVIDIA GeForce GT 430 Direct3D9Ex vs_3_0 ps_3_0)',
    // Intel Integrated Graphics
    'ANGLE (Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0)',
    'ANGLE (Intel(R) HD Graphics 4000 Direct3D11 vs_5_0 ps_5_0)',
    'ANGLE (Intel(R) HD Graphics 4600 Direct3D9Ex vs_3_0 ps_3_0)',
    'ANGLE (Intel(R) HD Graphics Family Direct3D9Ex vs_3_0 ps_3_0)',
    // AMD Cards
    'ANGLE (AMD Radeon RX 6800 XT Direct3D11 vs_5_0 ps_5_0)',
    'ANGLE (AMD Radeon RX 580 Series Direct3D11 vs_5_0 ps_5_0)',
    'ANGLE (AMD Radeon R9 200 Series Direct3D11 vs_5_0 ps_5_0)',
    'ANGLE (AMD Radeon HD 6450 Direct3D9Ex vs_3_0 ps_3_0)'
];

// Enhanced device profiles for comprehensive fingerprinting
const DEVICE_PROFILES = {
    'high-end-desktop': {
        screen: { width: 1920, height: 1080, devicePixelRatio: 1 },
        hardware: { cores: 8, memory: 16, gpu: 'nvidia-rtx' },
        behavioral: { mouseProfile: 'confident', typingSpeed: 'fast' }
    },
    'mid-range-desktop': {
        screen: { width: 1920, height: 1080, devicePixelRatio: 1 },
        hardware: { cores: 4, memory: 8, gpu: 'intel-uhd' },
        behavioral: { mouseProfile: 'natural', typingSpeed: 'normal' }
    },
    'business-laptop': {
        screen: { width: 1366, height: 768, devicePixelRatio: 1 },
        hardware: { cores: 4, memory: 8, gpu: 'intel-hd' },
        behavioral: { mouseProfile: 'cautious', typingSpeed: 'normal' }
    },
    'gaming-laptop': {
        screen: { width: 1920, height: 1080, devicePixelRatio: 1 },
        hardware: { cores: 6, memory: 16, gpu: 'nvidia-gtx' },
        behavioral: { mouseProfile: 'confident', typingSpeed: 'fast' }
    }
};

// Audio context fingerprint profiles
const AUDIO_PROFILES = {
    'windows-chrome': { sampleRate: 44100, baseLatency: 0.01, outputLatency: 0.02 },
    'windows-firefox': { sampleRate: 44100, baseLatency: 0.008, outputLatency: 0.015 },
    'macos-safari': { sampleRate: 44100, baseLatency: 0.012, outputLatency: 0.025 }
};

// Generate consistent browser fingerprint with enhanced profiles
function generateAdvancedFingerprint(buid = crypto.randomUUID(), profileType = 'mid-range-desktop') {
    const buidHash = crypto.createHash('sha512').update(buid).digest();
    const profile = DEVICE_PROFILES[profileType] || DEVICE_PROFILES['mid-range-desktop'];
    const audioProfile = AUDIO_PROFILES['windows-chrome'];

    const fingerprint = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        platform: 'Win32',
        appName: 'Netscape',
        screenWidth: profile.screen.width,
        screenHeight: profile.screen.height,
        viewportWidth: Math.floor(profile.screen.width * 0.8),
        viewportHeight: Math.floor(profile.screen.height * 0.7),
        devicePixelRatio: profile.screen.devicePixelRatio,
        deviceCategory: 'desktop',
        WEBGL_VENDOR: 'Google Inc.',
        WEBGL_RENDERER: WEBGL_RENDERERS[Math.floor(buidHash.readUInt32BE(0) / (2 ** 32 - 1) * WEBGL_RENDERERS.length)],
        BUID: buidHash.toString('base64'),
        languages: ['en-US', 'en'],
        timezone: 'America/New_York',
        deviceMemory: profile.hardware.memory,
        hardwareConcurrency: profile.hardware.cores,
        // Enhanced fingerprint components
        canvas: {
            noise: buidHash.slice(0, 16).toString('hex'),
            textBaseline: 'alphabetic',
            textAlign: 'start'
        },
        webgl: {
            vendor: 'Google Inc.',
            renderer: WEBGL_RENDERERS[Math.floor(buidHash.readUInt32BE(4) / (2 ** 32 - 1) * WEBGL_RENDERERS.length)],
            version: 'WebGL 1.0',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0',
            maxTextureSize: 16384,
            maxVertexTextureImageUnits: 16
        },
        audioContext: {
            sampleRate: audioProfile.sampleRate,
            baseLatency: audioProfile.baseLatency + (buidHash.readUInt8(8) / 255) * 0.005,
            outputLatency: audioProfile.outputLatency + (buidHash.readUInt8(9) / 255) * 0.01,
            maxChannelCount: 2,
            numberOfInputs: 1,
            numberOfOutputs: 1
        },
        webrtc: {
            localIPs: [`192.168.1.${100 + (buidHash.readUInt8(10) % 155)}`, `10.0.0.${50 + (buidHash.readUInt8(11) % 205)}`],
            publicIP: null,
            stunDisabled: true,
            turnDisabled: true
        },
        behavioral: profile.behavioral
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
    /**
     * Generate advanced fingerprint with enhanced profiles
     */
    static generateAdvancedFingerprint(buid = crypto.randomUUID(), profileType = 'mid-range-desktop') {
        return generateAdvancedFingerprint(buid, profileType);
    }

    // ADVANCED PLAYWRIGHT-STEALTH FINGERPRINTING
    static async enhancePageWithAdvancedStealth(page) {
        try {
            console.log('🎭 Applying advanced playwright-stealth fingerprinting...');

            const fingerprint = generateAdvancedFingerprint();

            // Advanced fingerprint injection script
            await page.addInitScript((fp) => {
                // CRITICAL: Complete webdriver property removal (all possible traces)
                ['webdriver', '__webdriver_evaluate', '__selenium_evaluate', '__webdriver_script_function',
                 '__webdriver_script_func', '__webdriver_script_fn', '__fxdriver_evaluate', '__driver_unwrapped',
                 '__webdriver_unwrapped', '__driver_evaluate', '__selenium_unwrapped', '__fxdriver_unwrapped'].forEach(prop => {
                    try {
                        delete window[prop];
                        delete navigator[prop];
                        delete document[prop];
                    } catch (e) {}
                });
                
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined,  // Must return undefined, not false
                    configurable: false,
                    enumerable: false
                });
                
                // Remove webdriver from constructor prototype
                delete Navigator.prototype.webdriver;

                // Remove Chrome DevTools Protocol indicators
                ['cdc_adoQpoasnfa76pfcZLmcfl_Array', 'cdc_adoQpoasnfa76pfcZLmcfl_Promise', 
                 'cdc_adoQpoasnfa76pfcZLmcfl_Symbol', 'cdc_adoQpoasnfa76pfcZLmcfl_JSON', 
                 'cdc_adoQpoasnfa76pfcZLmcfl_Object', '$cdc_asdjflasutopfhvcZLmcfl_'].forEach(prop => {
                    try { delete window[prop]; } catch (e) {}
                });

                // CRITICAL: Perfect Chrome runtime object that passes all detection tests
                const chromeRuntime = {
                    onConnect: null,
                    onMessage: null,
                    connect: function() { 
                        return { 
                            postMessage: function() {}, 
                            disconnect: function() {},
                            name: '',
                            sender: undefined
                        }; 
                    },
                    sendMessage: function() {},
                    id: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
                    getManifest: function() {
                        return {
                            name: 'Chrome PDF Viewer',
                            version: '1.0.0.0'
                        };
                    }
                };
                
                const chromeApp = {
                    isInstalled: false,
                    InstallState: { 
                        DISABLED: 'disabled', 
                        INSTALLED: 'installed', 
                        NOT_INSTALLED: 'not_installed' 
                    },
                    RunningState: { 
                        CANNOT_RUN: 'cannot_run', 
                        READY_TO_RUN: 'ready_to_run', 
                        RUNNING: 'running' 
                    },
                    getDetails: function() { return null; },
                    getIsInstalled: function() { return false; }
                };
                
                window.chrome = {
                    runtime: chromeRuntime,
                    app: chromeApp,
                    webstore: { 
                        onInstallStageChanged: {}, 
                        onDownloadProgress: {},
                        install: function(url, successCallback, failureCallback) {
                            if (failureCallback) failureCallback('User cancelled install');
                        }
                    },
                    csi: function() { 
                        return { 
                            startE: Date.now() - Math.random() * 1000,
                            onloadT: Date.now() - Math.random() * 500,
                            tran: Math.floor(Math.random() * 20) + 10
                        }; 
                    },
                    loadTimes: function() {
                        const now = Date.now() / 1000;
                        const navigationStart = now - Math.random() * 2;
                        return {
                            requestTime: navigationStart,
                            startLoadTime: navigationStart + 0.1,
                            commitLoadTime: navigationStart + 0.2,
                            finishDocumentLoadTime: navigationStart + 0.5,
                            finishLoadTime: navigationStart + 0.8,
                            firstPaintTime: navigationStart + 0.6,
                            firstPaintAfterLoadTime: 0,
                            navigationType: 'Navigation',
                            wasFetchedViaSpdy: false,
                            wasNpnNegotiated: false,
                            npnNegotiatedProtocol: 'unknown',
                            wasAlternateProtocolAvailable: false,
                            connectionInfo: 'http/1.1'
                        };
                    }
                };
                
                // Make chrome object non-configurable to prevent tampering
                Object.defineProperty(window, 'chrome', {
                    value: window.chrome,
                    writable: false,
                    enumerable: false,
                    configurable: false
                });

                // CRITICAL: Realistic plugins array that exactly mimics Chrome structure
                const mimeTypes = [
                    { type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format', enabledPlugin: null },
                    { type: 'application/x-google-chrome-pdf', suffixes: 'pdf', description: 'Portable Document Format', enabledPlugin: null },
                    { type: 'application/x-nacl', suffixes: '', description: 'Native Client Executable', enabledPlugin: null },
                    { type: 'application/x-pnacl', suffixes: '', description: 'Portable Native Client Executable', enabledPlugin: null }
                ];

                const plugins = [];
                plugins[0] = {
                    name: 'Chrome PDF Plugin',
                    filename: 'internal-pdf-viewer',
                    description: 'Portable Document Format',
                    length: 1,
                    0: mimeTypes[1]
                };
                plugins[1] = {
                    name: 'Chrome PDF Viewer', 
                    filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
                    description: '',
                    length: 1,
                    0: mimeTypes[0]
                };
                plugins[2] = {
                    name: 'Native Client',
                    filename: 'internal-nacl-plugin',
                    description: '',
                    length: 2,
                    0: mimeTypes[2],
                    1: mimeTypes[3]
                };
                plugins[3] = {
                    name: 'Widevine Content Decryption Module',
                    filename: 'widevinecdmadapter.dll',
                    description: 'Enables Widevine licenses for playback of HTML audio/video content.',
                    length: 1,
                    0: { type: 'application/x-ppapi-widevine-cdm', suffixes: '', description: 'Widevine Content Decryption Module', enabledPlugin: null }
                };
                
                // Set up bi-directional references
                mimeTypes[0].enabledPlugin = plugins[1];
                mimeTypes[1].enabledPlugin = plugins[0];
                mimeTypes[2].enabledPlugin = plugins[2];
                mimeTypes[3].enabledPlugin = plugins[2];
                plugins[3][0].enabledPlugin = plugins[3];

                plugins.length = 4;
                plugins.item = function(index) { return this[index] || null; };
                plugins.namedItem = function(name) {
                    for (let i = 0; i < this.length; i++) {
                        if (this[i] && this[i].name === name) return this[i];
                    }
                    return null;
                };
                plugins.refresh = function() {};
                
                mimeTypes.length = 4;
                mimeTypes.item = function(index) { return this[index] || null; };
                mimeTypes.namedItem = function(name) {
                    for (let i = 0; i < this.length; i++) {
                        if (this[i] && this[i].type === name) return this[i];
                    }
                    return null;
                };
                
                Object.defineProperty(navigator, 'plugins', { 
                    get: () => plugins,
                    configurable: false,
                    enumerable: true
                });
                
                Object.defineProperty(navigator, 'mimeTypes', {
                    get: () => mimeTypes,
                    configurable: false,
                    enumerable: true
                });

                // CRITICAL: Platform consistency - match user agent
                Object.defineProperty(navigator, 'platform', { 
                    get: () => 'Win32',  // Force Windows to match user agent
                    configurable: false,
                    enumerable: true
                });

                // CRITICAL: Screen and window properties with perfect consistency
                // Use consistent screen dimensions that match real Windows desktops
                const screenWidth = 1920;
                const screenHeight = 1080;
                const availWidth = 1920;
                const availHeight = 1040; // Account for taskbar
                const innerWidth = 1920;
                const innerHeight = 969; // Browser viewport height
                
                Object.defineProperty(screen, 'width', { get: () => screenWidth, configurable: false });
                Object.defineProperty(screen, 'height', { get: () => screenHeight, configurable: false });
                Object.defineProperty(screen, 'availWidth', { get: () => availWidth, configurable: false });
                Object.defineProperty(screen, 'availHeight', { get: () => availHeight, configurable: false });
                Object.defineProperty(screen, 'colorDepth', { get: () => 24, configurable: false });
                Object.defineProperty(screen, 'pixelDepth', { get: () => 24, configurable: false });
                
                Object.defineProperty(window, 'innerWidth', { get: () => innerWidth, configurable: false });
                Object.defineProperty(window, 'innerHeight', { get: () => innerHeight, configurable: false });
                Object.defineProperty(window, 'outerWidth', { get: () => innerWidth, configurable: false });
                Object.defineProperty(window, 'outerHeight', { get: () => innerHeight + 111, configurable: false }); // Add browser chrome height
                Object.defineProperty(window, 'screenX', { get: () => 0, configurable: false });
                Object.defineProperty(window, 'screenY', { get: () => 0, configurable: false });
                Object.defineProperty(window, 'screenLeft', { get: () => 0, configurable: false });
                Object.defineProperty(window, 'screenTop', { get: () => 0, configurable: false });

                // Enhanced navigator properties with Windows consistency
                Object.defineProperty(navigator, 'userAgent', { get: () => fp.userAgent, configurable: false });
                Object.defineProperty(navigator, 'appName', { get: () => 'Netscape', configurable: false });
                Object.defineProperty(navigator, 'appVersion', { get: () => '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', configurable: false });
                Object.defineProperty(navigator, 'languages', { get: () => fp.languages, configurable: false });
                Object.defineProperty(navigator, 'language', { get: () => 'en-US', configurable: false });
                Object.defineProperty(navigator, 'deviceMemory', { get: () => fp.deviceMemory, configurable: false });
                Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => fp.hardwareConcurrency, configurable: false });
                Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 0, configurable: false });
                
                // CRITICAL: Media devices with realistic count and proper structure
                if (navigator.mediaDevices) {
                    // Override enumerateDevices to return realistic devices
                    Object.defineProperty(navigator.mediaDevices, 'enumerateDevices', {
                        value: function() {
                            return Promise.resolve([
                                { 
                                    deviceId: 'default',
                                    kind: 'audioinput', 
                                    label: 'Default - Microphone Array (Realtek(R) Audio)',
                                    groupId: 'b8f5c479a0cb77db61b2b7f8f8c8e3a14e71e15f8b89c4d26e1a12d34567890a'
                                },
                                { 
                                    deviceId: 'communications',
                                    kind: 'audioinput', 
                                    label: 'Communications - Microphone Array (Realtek(R) Audio)',
                                    groupId: 'b8f5c479a0cb77db61b2b7f8f8c8e3a14e71e15f8b89c4d26e1a12d34567890a'
                                },
                                { 
                                    deviceId: 'default',
                                    kind: 'audiooutput', 
                                    label: 'Default - Speakers (Realtek(R) Audio)',
                                    groupId: 'b8f5c479a0cb77db61b2b7f8f8c8e3a14e71e15f8b89c4d26e1a12d34567890a'
                                },
                                { 
                                    deviceId: 'communications',
                                    kind: 'audiooutput', 
                                    label: 'Communications - Speakers (Realtek(R) Audio)',
                                    groupId: 'b8f5c479a0cb77db61b2b7f8f8c8e3a14e71e15f8b89c4d26e1a12d34567890a'
                                },
                                { 
                                    deviceId: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2',
                                    kind: 'videoinput', 
                                    label: 'HD Pro Webcam C920 (046d:082d)',
                                    groupId: '9d2b3e4c5a8f7b6e1d4c7a9f2e5b8c1d4e7a0c3f6b9e2d5c8a1f4b7e0d3c6a9f2'
                                }
                            ]);
                        },
                        configurable: false,
                        enumerable: true
                    });
                }

                // CRITICAL: Advanced WebGL fingerprint spoofing - ensure context creation
                const originalGetContext = HTMLCanvasElement.prototype.getContext;
                HTMLCanvasElement.prototype.getContext = function(contextType, ...args) {
                    // First try to get the real context
                    let context = originalGetContext.call(this, contextType, ...args);
                    
                    // If WebGL context creation fails, force creation with different approach
                    if (!context && (contextType === 'webgl' || contextType === 'experimental-webgl')) {
                        // Try alternative WebGL creation methods
                        context = originalGetContext.call(this, 'experimental-webgl', ...args) ||
                                 originalGetContext.call(this, 'webgl', ...args) ||
                                 originalGetContext.call(this, 'moz-webgl', ...args) ||
                                 originalGetContext.call(this, 'webkit-3d', ...args);
                    }

                    if (context && (contextType === 'webgl' || contextType === 'experimental-webgl')) {
                        const originalGetParameter = context.getParameter;
                        context.getParameter = function(parameter) {
                            try {
                                // WEBGL_debug_renderer_info constants
                                if (parameter === 37445) return fp.webgl.vendor; // UNMASKED_VENDOR_WEBGL
                                if (parameter === 37446) return fp.webgl.renderer; // UNMASKED_RENDERER_WEBGL

                                // Enhanced WebGL parameters with fingerprint consistency
                                if (parameter === 7938) return fp.webgl.version; // VERSION
                                if (parameter === 35724) return fp.webgl.shadingLanguageVersion; // SHADING_LANGUAGE_VERSION
                                if (parameter === 3379) return fp.webgl.maxTextureSize; // MAX_TEXTURE_SIZE
                                if (parameter === 35660) return fp.webgl.maxVertexTextureImageUnits; // MAX_VERTEX_TEXTURE_IMAGE_UNITS
                                if (parameter === 33901) return new Float32Array([1, 8191]);
                                if (parameter === 3386) return new Int32Array([16384, 16384]);
                                if (parameter === 35661) return 80;
                                if (parameter === 34076) return 16384;
                                if (parameter === 36349) return 1024;
                                if (parameter === 34024) return 16384;
                                if (parameter === 34921) return 16;
                                if (parameter === 36347) return 1024;

                                // Use original function for other parameters
                                return originalGetParameter.call(this, parameter);
                            } catch (e) {
                                // Fallback to prevent recursion errors
                                return null;
                            }
                        };

                        // Enhanced extension spoofing with consistent extensions
                        const originalGetSupportedExtensions = context.getSupportedExtensions;
                        if (originalGetSupportedExtensions) {
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
                    }

                    return context;
                };

                // Plugins already defined above, no need to redefine

                // CRITICAL: Canvas fingerprinting protection with transparent pixel fix
                const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
                const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
                
                HTMLCanvasElement.prototype.toDataURL = function(...args) {
                    try {
                        const context = originalGetContext.call(this, '2d');
                        if (context) {
                            // Add subtle, consistent noise
                            const imageData = context.getImageData(0, 0, this.width, this.height);
                            const data = imageData.data;
                            
                            // Use consistent seed based on canvas size
                            const seed = (this.width * this.height) % 1000;
                            
                            for (let i = 0; i < data.length; i += 4) {
                                const noise = ((seed + i) % 3) - 1; // -1, 0, or 1
                                if (data[i + 3] > 0) { // Only modify non-transparent pixels
                                    data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
                                    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G  
                                    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
                                }
                            }
                            
                            context.putImageData(imageData, 0, 0);
                        }
                        return originalToDataURL.apply(this, args);
                    } catch (e) {
                        return originalToDataURL.apply(this, args);
                    }
                };
                
                // Override getImageData to return consistent transparent pixels
                CanvasRenderingContext2D.prototype.getImageData = function(sx, sy, sw, sh) {
                    const imageData = originalGetImageData.call(this, sx, sy, sw, sh);
                    
                    // Ensure transparent pixels are exactly [0,0,0,0]
                    const data = imageData.data;
                    for (let i = 0; i < data.length; i += 4) {
                        if (data[i + 3] === 0) { // Transparent pixel
                            data[i] = 0;     // R
                            data[i + 1] = 0; // G
                            data[i + 2] = 0; // B
                        }
                    }
                    
                    return imageData;
                };

                // Enhanced canvas text rendering with consistent fingerprint
                const originalFillText = CanvasRenderingContext2D.prototype.fillText;
                CanvasRenderingContext2D.prototype.fillText = function(text, x, y, maxWidth) {
                    try {
                        // Apply canvas fingerprint properties
                        this.textBaseline = fp.canvas.textBaseline;
                        this.textAlign = fp.canvas.textAlign;

                        // Add subtle positioning variations based on BUID
                        const xOffset = (fp.random(text.length) - 0.5) * 0.1;
                        const yOffset = (fp.random(text.length + 1) - 0.5) * 0.1;

                        return originalFillText.call(this, text, x + xOffset, y + yOffset, maxWidth);
                    } catch (e) {
                        // Fallback to original on error
                        return originalFillText.call(this, text, x, y, maxWidth);
                    }
                };

                // Advanced AudioContext fingerprinting with consistent values
                if (window.AudioContext || window.webkitAudioContext) {
                    const OriginalAudioContext = window.AudioContext || window.webkitAudioContext;

                    function StealthAudioContext(...args) {
                        const context = new OriginalAudioContext(...args);

                        // Override sampleRate with fingerprint value
                        Object.defineProperty(context, 'sampleRate', {
                            get: () => fp.audioContext.sampleRate
                        });

                        Object.defineProperty(context, 'baseLatency', {
                            get: () => fp.audioContext.baseLatency
                        });

                        Object.defineProperty(context, 'outputLatency', {
                            get: () => fp.audioContext.outputLatency
                        });

                        // Override destination properties
                        Object.defineProperty(context.destination, 'maxChannelCount', {
                            get: () => fp.audioContext.maxChannelCount
                        });

                        Object.defineProperty(context.destination, 'numberOfInputs', {
                            get: () => fp.audioContext.numberOfInputs
                        });

                        Object.defineProperty(context.destination, 'numberOfOutputs', {
                            get: () => fp.audioContext.numberOfOutputs
                        });

                        return context;
                    }

                    window.AudioContext = StealthAudioContext;
                    if (window.webkitAudioContext) {
                        window.webkitAudioContext = StealthAudioContext;
                    }
                }

                // Enhanced WebRTC blocking and spoofing
                const mockRTCPeerConnection = function() {
                    throw new Error('WebRTC is disabled for privacy');
                };

                Object.defineProperty(window, 'RTCPeerConnection', {
                    get: () => mockRTCPeerConnection,
                    configurable: false
                });
                Object.defineProperty(window, 'webkitRTCPeerConnection', {
                    get: () => mockRTCPeerConnection,
                    configurable: false
                });
                Object.defineProperty(window, 'mozRTCPeerConnection', {
                    get: () => mockRTCPeerConnection,
                    configurable: false
                });

                // Block getUserMedia to prevent media device enumeration
                const mockGetUserMedia = () => Promise.reject(new DOMException('Permission denied', 'NotAllowedError'));
                Object.defineProperty(navigator, 'getUserMedia', { get: () => mockGetUserMedia });
                Object.defineProperty(navigator, 'webkitGetUserMedia', { get: () => mockGetUserMedia });
                Object.defineProperty(navigator, 'mozGetUserMedia', { get: () => mockGetUserMedia });

                if (navigator.mediaDevices) {
                    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { get: () => mockGetUserMedia });
                    Object.defineProperty(navigator.mediaDevices, 'enumerateDevices', {
                        get: () => () => Promise.resolve([])
                    });
                }

                // Enhanced Timezone spoofing
                const originalDate = Date;
                const timezoneOffset = -300; // EST offset in minutes

                window.Date = class extends originalDate {
                    getTimezoneOffset() {
                        return timezoneOffset;
                    }

                    toString() {
                        return super.toString().replace(/GMT[+-]\d{4} \(.+\)/, 'GMT-0500 (Eastern Standard Time)');
                    }
                };

                // Copy static methods
                Object.getOwnPropertyNames(originalDate).forEach(prop => {
                    if (prop !== 'prototype' && prop !== 'name' && prop !== 'length') {
                        window.Date[prop] = originalDate[prop];
                    }
                });
                // CRITICAL: Enhanced permissions API spoofing with realistic responses
                if (navigator.permissions && navigator.permissions.query) {
                    const originalQuery = navigator.permissions.query;
                    navigator.permissions.query = (parameters) => {
                        const permissionStates = {
                            notifications: 'default',
                            geolocation: 'prompt',
                            camera: 'prompt',
                            microphone: 'prompt',
                            midi: 'granted',
                            push: 'granted',
                            'background-sync': 'granted'
                        };

                        const state = permissionStates[parameters.name] || 'granted';
                        return Promise.resolve({ state });
                    };
                }
                
                // CRITICAL: Video codec support with realistic Chrome responses
                const videoCodecSupport = {
                    'video/mp4; codecs="avc1.42E01E"': 'probably',
                    'video/mp4; codecs="avc1.4D401F"': 'probably', 
                    'video/mp4; codecs="avc1.640028"': 'probably',
                    'video/mp4; codecs="mp4v.20.8"': 'probably',
                    'video/mp4; codecs="mp4v.20.240"': 'probably',
                    'video/mp4; codecs="mp4a.40.2"': 'probably',
                    'video/mp4': 'maybe',
                    'video/webm; codecs="vp8, vorbis"': 'probably',
                    'video/webm; codecs="vp9"': 'probably',
                    'video/webm': 'maybe',
                    'video/ogg; codecs="theora"': '',
                    'video/ogg': '',
                    'video/3gpp': '',
                    'video/x-msvideo': ''
                };
                
                const audioCodecSupport = {
                    'audio/mpeg': 'probably',
                    'audio/mp3': 'probably',
                    'audio/wav': 'probably',
                    'audio/wave': 'probably',
                    'audio/x-wav': 'probably',
                    'audio/ogg; codecs="vorbis"': 'probably',
                    'audio/ogg': 'probably',
                    'audio/mp4; codecs="mp4a.40.2"': 'probably',
                    'audio/mp4': 'maybe',
                    'audio/aac': 'probably',
                    'audio/aacp': 'probably',
                    'audio/webm; codecs="vorbis"': 'probably',
                    'audio/webm': 'maybe',
                    'audio/flac': 'probably',
                    'audio/x-flac': 'probably'
                };

                if (window.HTMLVideoElement && window.HTMLVideoElement.prototype.canPlayType) {
                    const originalVideoCanPlayType = window.HTMLVideoElement.prototype.canPlayType;
                    window.HTMLVideoElement.prototype.canPlayType = function(type) {
                        const normalizedType = type.toLowerCase().trim();
                        
                        // Check exact matches first
                        if (videoCodecSupport.hasOwnProperty(normalizedType)) {
                            return videoCodecSupport[normalizedType];
                        }
                        
                        // Check partial matches for h264/avc1
                        if (normalizedType.includes('h264') || normalizedType.includes('avc1')) {
                            return 'probably';
                        }
                        
                        // Check for mp4 container
                        if (normalizedType.includes('mp4')) {
                            return normalizedType.includes('codecs') ? 'probably' : 'maybe';
                        }
                        
                        return originalVideoCanPlayType.call(this, type) || '';
                    };
                }
                
                if (window.HTMLAudioElement && window.HTMLAudioElement.prototype.canPlayType) {
                    const originalAudioCanPlayType = window.HTMLAudioElement.prototype.canPlayType;
                    window.HTMLAudioElement.prototype.canPlayType = function(type) {
                        const normalizedType = type.toLowerCase().trim();
                        
                        // Check exact matches first
                        if (audioCodecSupport.hasOwnProperty(normalizedType)) {
                            return audioCodecSupport[normalizedType];
                        }
                        
                        // Check partial matches
                        for (const supportedType in audioCodecSupport) {
                            if (normalizedType.includes(supportedType.split(';')[0].replace('audio/', ''))) {
                                return audioCodecSupport[supportedType];
                            }
                        }
                        
                        return originalAudioCanPlayType.call(this, type) || '';
                    };
                }

                // Enhanced media devices spoofing
                if (navigator.mediaDevices) {
                    // Override getDisplayMedia
                    Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', {
                        get: () => () => Promise.reject(new DOMException('Permission denied', 'NotAllowedError'))
                    });
                }

                // Remove privacy-concerning APIs
                if ('getBattery' in navigator) delete navigator.getBattery;
                if ('getGamepads' in navigator) delete navigator.getGamepads;
                if ('sendBeacon' in navigator) delete navigator.sendBeacon;

                // Speech synthesis spoofing for consistency
                if (window.speechSynthesis && window.speechSynthesis.getVoices) {
                    const originalGetVoices = window.speechSynthesis.getVoices;
                    window.speechSynthesis.getVoices = function() {
                        return [
                            { name: 'Microsoft David Desktop - English (United States)', lang: 'en-US', localService: true, default: true },
                            { name: 'Microsoft Zira Desktop - English (United States)', lang: 'en-US', localService: true, default: false }
                        ];
                    };
                }

                // CRITICAL: Fix iframe chrome access - runs after DOM ready
                const ensureIframeChromeAccess = function() {
                    try {
                        // Override iframe creation to inject chrome object
                        const originalCreateElement = document.createElement;
                        document.createElement = function(tagName) {
                            const element = originalCreateElement.call(this, tagName);
                            if (tagName.toLowerCase() === 'iframe') {
                                element.addEventListener('load', function() {
                                    try {
                                        if (this.contentWindow && !this.contentWindow.chrome) {
                                            this.contentWindow.chrome = window.chrome;
                                        }
                                    } catch (e) {
                                        // Cross-origin iframe, ignore
                                    }
                                });
                            }
                            return element;
                        };
                        
                        // Also patch existing iframes
                        const iframes = document.getElementsByTagName('iframe');
                        for (let i = 0; i < iframes.length; i++) {
                            try {
                                if (iframes[i].contentWindow && !iframes[i].contentWindow.chrome) {
                                    iframes[i].contentWindow.chrome = window.chrome;
                                }
                            } catch (e) {
                                // Cross-origin iframe, ignore
                            }
                        }
                    } catch (e) {
                        // Silently ignore errors
                    }
                };
                
                // Run immediately and on DOM ready
                ensureIframeChromeAccess();
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', ensureIframeChromeAccess);
                }
                
                // CRITICAL: Add getBattery with realistic response
                if (!navigator.getBattery) {
                    navigator.getBattery = function() {
                        return Promise.resolve({
                            charging: true,
                            chargingTime: Infinity,
                            dischargingTime: Infinity,
                            level: 1.0,
                            addEventListener: function() {},
                            removeEventListener: function() {}
                        });
                    };
                }

                // Device pixel ratio consistency
                Object.defineProperty(window, 'devicePixelRatio', {
                    get: () => fp.devicePixelRatio
                });

                console.log('🎯 Advanced fingerprint applied:', {
                    webgl: fp.webgl.renderer.slice(0, 40) + '...',
                    ua: fp.userAgent.slice(0, 30) + '...',
                    viewport: `${fp.viewportWidth}x${fp.viewportHeight}`,
                    audio: `${fp.audioContext.sampleRate}Hz`,
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
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': fingerprint.languages.join(',') + ';q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'max-age=0',
                'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not?A_Brand";v="99"',
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
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-User': '?1',
                'Sec-Fetch-Dest': 'document',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'Accept-Language': 'en-US,en;q=0.9',
                Connection: 'keep-alive',
                // DATACENTER FRIENDLY: Additional headers to appear more residential
                'sec-ch-viewport-width': '1920',
                'sec-ch-viewport-height': '1080',
                'sec-ch-device-memory': '8',
                'sec-ch-dpr': '1',
                'sec-gpc': '1',
                dnt: '1',
                'Cache-Control': 'max-age=0',
                Pragma: 'no-cache',
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
                        getHighEntropyValues: async(hints) => ({
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
        await page.route('**/*', async(route) => {
            const request = route.request();

            // CRITICAL: Perfect Chrome headers for Schema.org detection bypass
            const perfectChromeHeaders = {
                ...request.headers(),
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
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
                'sec-fetch-dest': request.url().includes('.css')
                    ? 'style'
                    : request.url().includes('.js') ? 'script' : 'document',
                'sec-fetch-mode': 'navigate',
                'sec-fetch-site': 'none',
                'sec-fetch-user': '?1',
                'upgrade-insecure-requests': '1',
                'cache-control': 'max-age=0',
                dnt: '1',
                connection: 'keep-alive'
            };

            // Remove automation headers that might leak
            delete perfectChromeHeaders['x-requested-with'];
            delete perfectChromeHeaders.pragma;

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
