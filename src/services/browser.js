/**
 * Enhanced Browser Management Service v1.3.0
 * Handles browser instance lifecycle, context management, advanced fingerprinting, and cleanup
 * Features: Device profiles, geolocation spoofing, timezone management, hardware emulation
 */

const { chromium } = require('playwright');
const config = require('../config');
const { BROWSER_LAUNCH_OPTIONS } = require('../config/browser');
const { logger, generateRequestId } = require('../utils/logger');
const { HeadlessXError, ERROR_CATEGORIES, handleError } = require('../utils/errors');

// Enhanced geolocation database for IP-based location spoofing
const GEOLOCATION_PROFILES = {
    'us-east': { latitude: 40.7128, longitude: -74.0060, timezone: 'America/New_York' },     // New York
    'us-west': { latitude: 34.0522, longitude: -118.2437, timezone: 'America/Los_Angeles' }, // Los Angeles
    'us-central': { latitude: 41.8781, longitude: -87.6298, timezone: 'America/Chicago' },   // Chicago
    'uk': { latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' },              // London
    'germany': { latitude: 52.5200, longitude: 13.4050, timezone: 'Europe/Berlin' },        // Berlin
    'france': { latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris' },           // Paris
    'canada': { latitude: 45.5017, longitude: -73.5673, timezone: 'America/Toronto' },      // Montreal
    'australia': { latitude: -33.8688, longitude: 151.2093, timezone: 'Australia/Sydney' }  // Sydney
};

// Device profile templates for consistent hardware emulation
const DEVICE_PROFILES = {
    'high-end-desktop': {
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        hardware: { cores: 8, memory: 16, devicePixelRatio: 1 },
        screen: { width: 1920, height: 1080, availWidth: 1920, availHeight: 1040 },
        behavioral: 'confident'
    },
    'mid-range-desktop': {
        viewport: { width: 1366, height: 768 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        hardware: { cores: 4, memory: 8, devicePixelRatio: 1 },
        screen: { width: 1366, height: 768, availWidth: 1366, availHeight: 728 },
        behavioral: 'natural'
    },
    'business-laptop': {
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        hardware: { cores: 4, memory: 8, devicePixelRatio: 1 },
        screen: { width: 1280, height: 720, availWidth: 1280, availHeight: 680 },
        behavioral: 'cautious'
    }
};

class BrowserService {
    constructor() {
        this.browserInstance = null;
        this.activeContexts = new Set(); // Track active contexts to prevent memory leaks
    }

    // Initialize persistent browser with better error handling
    async getBrowser() {
        if (!this.browserInstance || !this.browserInstance.isConnected()) {
            const requestId = generateRequestId();
            logger.info(requestId, 'Launching new realistic browser instance...');
            
            try {
                this.browserInstance = await chromium.launch(BROWSER_LAUNCH_OPTIONS);
                logger.info(requestId, 'Realistic browser launched successfully');
                
                // Handle browser disconnect
                this.browserInstance.on('disconnected', () => {
                    logger.warn(requestId, 'Browser disconnected, cleaning up contexts...');
                    this.browserInstance = null;
                    // Clean up active contexts
                    this.activeContexts.clear();
                });
                
            } catch (error) {
                const categorizedError = handleError(error, requestId, 'Browser launch');
                throw new HeadlessXError(
                    `Browser launch failed: ${error.message}`,
                    ERROR_CATEGORIES.BROWSER,
                    false,
                    error
                );
            }
        }
        return this.browserInstance;
    }

    /**
     * Enhanced context creation with advanced fingerprinting profiles
     */
    async createIsolatedContext(browser = null, options = {}) {
        const requestId = generateRequestId();
        
        if (!browser) {
            browser = await this.getBrowser();
        }

        // Enhanced context options with fingerprint profiles
        const deviceProfile = options.deviceProfile || 'mid-range-desktop';
        const geoProfile = options.geoProfile || 'us-east';
        const profile = DEVICE_PROFILES[deviceProfile];
        const geoLocation = GEOLOCATION_PROFILES[geoProfile];

        const enhancedOptions = {
            viewport: profile.viewport,
            userAgent: profile.userAgent,
            deviceScaleFactor: profile.hardware.devicePixelRatio,
            hasTouch: false,
            isMobile: false,
            
            // Enhanced permissions and features
            permissions: [],
            
            // Geolocation spoofing
            geolocation: {
                latitude: geoLocation.latitude,
                longitude: geoLocation.longitude,
                accuracy: 20 + Math.random() * 30 // 20-50m accuracy variation
            },
            
            // Timezone consistency with geolocation
            timezoneId: geoLocation.timezone,
            
            // Locale settings
            locale: geoProfile.startsWith('us') ? 'en-US' : 'en-GB',
            
            // Enhanced browser features
            reducedMotion: 'no-preference',
            forcedColors: 'none',
            colorScheme: 'light',
            
            // Additional security settings
            acceptDownloads: false,
            bypassCSP: false,
            
            // Override default options with user provided
            ...options
        };
        
        try {
            const context = await browser.newContext(enhancedOptions);
            this.activeContexts.add(context);
            
            // Enhanced context setup with device profile injection
            await context.addInitScript(({ profile, geoLocation, deviceProfile }) => {
                // Inject device profile data
                window.__DEVICE_PROFILE__ = profile;
                window.__GEO_PROFILE__ = geoLocation;
                window.__PROFILE_TYPE__ = deviceProfile;
                
                // Enhanced navigator properties
                Object.defineProperty(navigator, 'hardwareConcurrency', {
                    get: () => profile.hardware.cores
                });
                
                Object.defineProperty(navigator, 'deviceMemory', {
                    get: () => profile.hardware.memory
                });
                
                // Screen resolution consistency
                Object.defineProperty(screen, 'width', {
                    get: () => profile.screen.width
                });
                
                Object.defineProperty(screen, 'height', {
                    get: () => profile.screen.height
                });
                
                Object.defineProperty(screen, 'availWidth', {
                    get: () => profile.screen.availWidth
                });
                
                Object.defineProperty(screen, 'availHeight', {
                    get: () => profile.screen.availHeight
                });
                
            }, { profile, geoLocation, deviceProfile });
            
            // Auto-cleanup on close
            context.on('close', () => {
                this.activeContexts.delete(context);
            });
            
            logger.debug(requestId, 'Isolated context created', { activeContexts: this.activeContexts.size });
            return context;
            
        } catch (error) {
            const categorizedError = handleError(error, requestId, 'Context creation');
            throw new HeadlessXError(
                `Failed to create browser context: ${error.message}`,
                ERROR_CATEGORIES.BROWSER,
                true,
                error
            );
        }
    }

    // Safe context cleanup
    async safeCloseContext(context, requestId = null) {
        if (!requestId) {
            requestId = generateRequestId();
        }
        
        if (context && !context._closed) {
            try {
                await context.close();
                this.activeContexts.delete(context);
                logger.debug(requestId, 'Context closed successfully');
            } catch (error) {
                logger.error(requestId, 'Failed to close context', { error: error.message });
            }
        }
    }

    // Get browser status and statistics
    getStatus() {
        return {
            connected: this.browserInstance ? this.browserInstance.isConnected() : false,
            activeContexts: this.activeContexts.size,
            type: 'Chromium'
        };
    }

    // Graceful shutdown of browser and all contexts
    async shutdown() {
        const requestId = generateRequestId();
        logger.info(requestId, 'Shutting down browser service...');
        
        try {
            // Close all active contexts first
            const contextPromises = Array.from(this.activeContexts).map(context => 
                this.safeCloseContext(context, requestId)
            );
            await Promise.all(contextPromises);
            
            // Close browser instance
            if (this.browserInstance && this.browserInstance.isConnected()) {
                await this.browserInstance.close();
                logger.info(requestId, 'Browser instance closed successfully');
            }
            
            this.browserInstance = null;
            this.activeContexts.clear();
            
        } catch (error) {
            logger.error(requestId, 'Error during browser shutdown', error);
        }
    }

    // Force cleanup of stale contexts (maintenance function)
    async cleanupStaleContexts() {
        const requestId = generateRequestId();
        logger.debug(requestId, 'Cleaning up stale contexts...');
        
        const staleContexts = [];
        for (const context of this.activeContexts) {
            try {
                // Try to access context - if it throws, it's stale
                await context.pages();
            } catch (error) {
                staleContexts.push(context);
            }
        }
        
        for (const staleContext of staleContexts) {
            this.activeContexts.delete(staleContext);
        }
        
        if (staleContexts.length > 0) {
            logger.info(requestId, `Cleaned up ${staleContexts.length} stale contexts`);
        }
    }
}

// Create singleton instance
const browserService = new BrowserService();

// Set up periodic cleanup
setInterval(() => {
    browserService.cleanupStaleContexts();
}, 5 * 60 * 1000); // Every 5 minutes

module.exports = browserService;