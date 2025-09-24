/**
 * Enhanced Fingerprint Management System
 * Comprehensive fingerprint control with profile consistency validation
 * HeadlessX v1.3.0 - Enhanced Anti-Detection
 */

const crypto = require('crypto');
const FINGERPRINT_PROFILES = require('./profiles/fingerprint-profiles');

// Import fingerprinting modules
const CanvasSpoofing = require('../services/fingerprinting/canvas-spoofing');
const WebGLSpoofing = require('../services/fingerprinting/webgl-spoofing');
const WebRTCController = require('../services/fingerprinting/webrtc-controller');
const AudioContextSpoofing = require('../services/fingerprinting/audio-context');

class FingerprintManager {
    constructor() {
        this.profiles = FINGERPRINT_PROFILES;
        this.canvasSpoofing = new CanvasSpoofing();
        this.webglSpoofing = new WebGLSpoofing();
        this.webrtcController = new WebRTCController();
        this.audioSpoofing = new AudioContextSpoofing();
        
        this.activeProfiles = new Map(); // Track active profiles per context
        this.consistencyCache = new Map(); // Cache for validation results
    }

    /**
     * Get all available fingerprint profiles
     * @returns {Object} All available profiles
     */
    getAllProfiles() {
        return this.profiles;
    }

    /**
     * Get profile by ID
     * @param {string} profileId - Profile identifier
     * @returns {Object|null} Profile data or null if not found
     */
    getProfile(profileId) {
        return this.profiles[profileId] || null;
    }

    /**
     * Get profiles by category
     * @param {string} category - Category (desktop, laptop, mobile, tablet)
     * @returns {Array} Array of matching profiles
     */
    getProfilesByCategory(category) {
        return Object.values(this.profiles).filter(profile => profile.category === category);
    }

    /**
     * Get profiles by platform
     * @param {string} platform - Platform (windows, macos, linux, android, ios)
     * @returns {Array} Array of matching profiles
     */
    getProfilesByPlatform(platform) {
        return Object.values(this.profiles).filter(profile => profile.platform === platform);
    }

    /**
     * Generate a consistent profile ID based on session data
     * @param {string} baseId - Base identifier
     * @param {Object} options - Options for profile generation
     * @returns {string} Consistent profile ID
     */
    generateProfileId(baseId, options = {}) {
        const seed = baseId + JSON.stringify(options) + Date.now().toString().slice(0, -3); // Hour precision
        return crypto.createHash('sha256').update(seed).digest('hex').slice(0, 16);
    }

    /**
     * Create a comprehensive fingerprint script
     * @param {string} profileId - Profile identifier
     * @param {Object} options - Spoofing options
     * @returns {string} Complete fingerprint script
     */
    generateFingerprintScript(profileId, options = {}) {
        const profile = this.getProfile(options.profileType || 'windows-chrome-high-end');
        if (!profile) {
            throw new Error(`Profile not found: ${options.profileType}`);
        }

        const canvasScript = this.canvasSpoofing.getCanvasSpoofingScript(
            profileId, 
            options.canvasNoiseLevel || 'medium'
        );

        const webglScript = this.webglSpoofing.getWebGLSpoofingScript(
            profileId,
            options.webglVendor || 'nvidia-gtx'
        );

        const webrtcScript = this.webrtcController.getWebRTCControlScript(
            options.webrtcMode || 'disabled',
            profile.category
        );

        const audioScript = this.audioSpoofing.getAudioContextSpoofingScript(
            profileId,
            `${profile.platform}-${profile.browser}`
        );

        return `
        (function() {
            console.log('🛡️ HeadlessX v1.3.0 Advanced Fingerprint Protection Loading...');
            console.log('Profile:', '${profile.name}', 'ID:', '${profileId.slice(0, 8)}...');
            
            const profile = ${JSON.stringify(profile)};
            const profileId = '${profileId}';
            
            // === CORE NAVIGATOR SPOOFING ===
            Object.defineProperty(navigator, 'userAgent', {
                get: () => profile.userAgent,
                configurable: false,
                enumerable: true
            });

            Object.defineProperty(navigator, 'platform', {
                get: () => profile.hardware.platform,
                configurable: false,
                enumerable: true
            });

            Object.defineProperty(navigator, 'hardwareConcurrency', {
                get: () => profile.hardware.cores,
                configurable: false,
                enumerable: true
            });

            Object.defineProperty(navigator, 'deviceMemory', {
                get: () => profile.hardware.memory,
                configurable: false,
                enumerable: true
            });

            Object.defineProperty(navigator, 'maxTouchPoints', {
                get: () => profile.hardware.maxTouchPoints,
                configurable: false,
                enumerable: true
            });

            Object.defineProperty(navigator, 'languages', {
                get: () => profile.geolocation.languages,
                configurable: false,
                enumerable: true
            });

            Object.defineProperty(navigator, 'language', {
                get: () => profile.geolocation.language,
                configurable: false,
                enumerable: true
            });

            // === SCREEN SPOOFING ===
            Object.defineProperty(screen, 'width', {
                get: () => profile.screen.width,
                configurable: false,
                enumerable: true
            });

            Object.defineProperty(screen, 'height', {
                get: () => profile.screen.height,
                configurable: false,
                enumerable: true
            });

            Object.defineProperty(screen, 'availWidth', {
                get: () => profile.screen.availWidth,
                configurable: false,
                enumerable: true
            });

            Object.defineProperty(screen, 'availHeight', {
                get: () => profile.screen.availHeight,
                configurable: false,
                enumerable: true
            });

            Object.defineProperty(screen, 'colorDepth', {
                get: () => profile.screen.colorDepth,
                configurable: false,
                enumerable: true
            });

            Object.defineProperty(screen, 'pixelDepth', {
                get: () => profile.screen.pixelDepth,
                configurable: false,
                enumerable: true
            });

            // === WINDOW/VIEWPORT SPOOFING ===
            Object.defineProperty(window, 'innerWidth', {
                get: () => profile.viewport.width,
                configurable: false,
                enumerable: true
            });

            Object.defineProperty(window, 'innerHeight', {
                get: () => profile.viewport.height,
                configurable: false,
                enumerable: true
            });

            Object.defineProperty(window, 'outerWidth', {
                get: () => profile.viewport.width,
                configurable: false,
                enumerable: true
            });

            Object.defineProperty(window, 'outerHeight', {
                get: () => profile.viewport.height + 85, // Browser chrome
                configurable: false,
                enumerable: true
            });

            Object.defineProperty(window, 'devicePixelRatio', {
                get: () => profile.screen.devicePixelRatio,
                configurable: false,
                enumerable: true
            });

            // === TIMEZONE & LOCALE SPOOFING ===
            try {
                const originalIntlDateTimeFormat = Intl.DateTimeFormat;
                Intl.DateTimeFormat = function(...args) {
                    const options = args[1] || {};
                    if (!options.timeZone) {
                        options.timeZone = profile.geolocation.timezone;
                    }
                    args[1] = options;
                    return new originalIntlDateTimeFormat(...args);
                };
                
                Intl.DateTimeFormat.prototype.resolvedOptions = function() {
                    const options = originalIntlDateTimeFormat.prototype.resolvedOptions.call(this);
                    return {
                        ...options,
                        timeZone: profile.geolocation.timezone,
                        locale: profile.geolocation.locale
                    };
                };
            } catch (e) {
                console.warn('Timezone spoofing failed:', e.message);
            }

            // === WEBDRIVER DETECTION REMOVAL ===
            // Remove all webdriver traces
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

            // Define webdriver as undefined (not just delete)
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
                configurable: false,
                enumerable: false
            });

            console.log('✅ Core fingerprint spoofing applied');

            // === LOAD SPECIALIZED SPOOFING MODULES ===
            
            ${canvasScript}
            
            ${webglScript}
            
            ${webrtcScript}
            
            ${audioScript}

            console.log('🎯 HeadlessX v1.3.0 Advanced Fingerprint Protection ACTIVE');
            console.log('Profile loaded:', profile.name);
            console.log('Stealth modules: Canvas, WebGL, WebRTC, Audio, Hardware');
            
        })();
        `;
    }

    /**
     * Validate fingerprint consistency
     * @param {string} profileId - Profile identifier
     * @param {Object} testResults - Test results from browser
     * @returns {Object} Validation results
     */
    validateFingerprintConsistency(profileId, testResults) {
        const cacheKey = profileId + JSON.stringify(testResults);
        
        if (this.consistencyCache.has(cacheKey)) {
            return this.consistencyCache.get(cacheKey);
        }

        const validation = {
            profileId,
            timestamp: Date.now(),
            consistent: true,
            issues: [],
            score: 100,
            recommendations: []
        };

        // Validate against expected profile
        const activeProfile = this.activeProfiles.get(profileId);
        if (activeProfile) {
            // Check screen properties
            if (testResults.screen) {
                if (testResults.screen.width !== activeProfile.screen.width) {
                    validation.issues.push({
                        type: 'screen_width_mismatch',
                        expected: activeProfile.screen.width,
                        actual: testResults.screen.width,
                        severity: 'high'
                    });
                    validation.score -= 20;
                }
            }

            // Check WebGL renderer consistency
            if (testResults.webgl) {
                if (testResults.webgl.renderer !== activeProfile.webgl.renderer) {
                    validation.issues.push({
                        type: 'webgl_renderer_mismatch',
                        expected: activeProfile.webgl.renderer,
                        actual: testResults.webgl.renderer,
                        severity: 'medium'
                    });
                    validation.score -= 15;
                }
            }

            // Check canvas fingerprint stability
            if (testResults.canvas) {
                const expectedHash = this.canvasSpoofing.generateTestFingerprint(profileId);
                if (testResults.canvas.fingerprint !== expectedHash.fingerprint) {
                    validation.issues.push({
                        type: 'canvas_fingerprint_inconsistent',
                        severity: 'low'
                    });
                    validation.score -= 5;
                }
            }
        }

        // Check for common detection patterns
        if (testResults.webdriver !== undefined) {
            validation.issues.push({
                type: 'webdriver_detected',
                value: testResults.webdriver,
                severity: 'critical'
            });
            validation.score -= 50;
        }

        // Determine consistency
        validation.consistent = validation.score >= 80;
        
        // Generate recommendations
        if (validation.score < 90) {
            validation.recommendations.push('Consider using a different fingerprint profile');
        }
        
        if (validation.issues.some(i => i.severity === 'critical')) {
            validation.recommendations.push('Critical detection issues found - review stealth configuration');
        }

        this.consistencyCache.set(cacheKey, validation);
        return validation;
    }

    /**
     * Get fingerprint test script for validation
     * @returns {string} JavaScript test code
     */
    getFingerprintTestScript() {
        return `
        (function() {
            const collectFingerprint = async () => {
                const fingerprint = {
                    timestamp: Date.now(),
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    languages: navigator.languages,
                    hardwareConcurrency: navigator.hardwareConcurrency,
                    deviceMemory: navigator.deviceMemory,
                    screen: {
                        width: screen.width,
                        height: screen.height,
                        availWidth: screen.availWidth,
                        availHeight: screen.availHeight,
                        colorDepth: screen.colorDepth,
                        pixelDepth: screen.pixelDepth
                    },
                    viewport: {
                        width: window.innerWidth,
                        height: window.innerHeight
                    },
                    devicePixelRatio: window.devicePixelRatio,
                    webdriver: navigator.webdriver
                };

                // Test WebGL
                try {
                    const canvas = document.createElement('canvas');
                    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                    if (gl) {
                        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                        fingerprint.webgl = {
                            vendor: gl.getParameter(gl.VENDOR),
                            renderer: gl.getParameter(gl.RENDERER),
                            unmaskedVendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : null,
                            unmaskedRenderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : null,
                            extensions: gl.getSupportedExtensions()
                        };
                    }
                } catch (e) {
                    fingerprint.webgl = { error: e.message };
                }

                // Test Canvas
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    ctx.textBaseline = 'top';
                    ctx.font = '14px Arial';
                    ctx.fillText('HeadlessX Test 🎯', 2, 2);
                    fingerprint.canvas = {
                        dataUrl: canvas.toDataURL().slice(0, 100) + '...',
                        fingerprint: btoa(canvas.toDataURL()).slice(0, 16)
                    };
                } catch (e) {
                    fingerprint.canvas = { error: e.message };
                }

                // Test Audio
                try {
                    if (window.AudioContext || window.webkitAudioContext) {
                        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                        fingerprint.audio = {
                            sampleRate: audioContext.sampleRate,
                            baseLatency: audioContext.baseLatency,
                            outputLatency: audioContext.outputLatency
                        };
                        audioContext.close();
                    }
                } catch (e) {
                    fingerprint.audio = { error: e.message };
                }

                // Test WebRTC
                fingerprint.webrtc = {
                    available: !!(window.RTCPeerConnection || window.webkitRTCPeerConnection),
                    mediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
                };

                return fingerprint;
            };

            window.collectFingerprint = collectFingerprint;
            console.log('🧪 Fingerprint test collector installed: window.collectFingerprint()');
        })();
        `;
    }

    /**
     * Register active profile for session
     * @param {string} profileId - Profile identifier
     * @param {string} profileType - Profile type
     */
    registerActiveProfile(profileId, profileType) {
        const profile = this.getProfile(profileType);
        if (profile) {
            this.activeProfiles.set(profileId, profile);
        }
    }

    /**
     * Cleanup expired profiles and cache
     */
    cleanup() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        // Clear old cache entries
        for (const [key, validation] of this.consistencyCache.entries()) {
            if (now - validation.timestamp > maxAge) {
                this.consistencyCache.delete(key);
            }
        }

        console.log(`Cleaned up fingerprint cache. Active profiles: ${this.activeProfiles.size}, Cache entries: ${this.consistencyCache.size}`);
    }

    /**
     * Get statistics about profile usage
     * @returns {Object} Usage statistics
     */
    getUsageStatistics() {
        const categories = {};
        const platforms = {};
        const browsers = {};

        for (const profile of Object.values(this.profiles)) {
            categories[profile.category] = (categories[profile.category] || 0) + 1;
            platforms[profile.platform] = (platforms[profile.platform] || 0) + 1;
            browsers[profile.browser] = (browsers[profile.browser] || 0) + 1;
        }

        return {
            totalProfiles: Object.keys(this.profiles).length,
            activeProfiles: this.activeProfiles.size,
            cacheSize: this.consistencyCache.size,
            categories,
            platforms,
            browsers,
            lastCleanup: Date.now()
        };
    }
}

module.exports = FingerprintManager;