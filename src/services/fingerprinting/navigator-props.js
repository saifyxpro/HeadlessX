/**
 * Navigator Properties Spoofing
 * Advanced navigator object properties manipulation and spoofing
 * HeadlessX v1.3.0 - Enhanced Anti-Detection
 */

const crypto = require('crypto');
const { logger } = require('../../utils/logger');

class NavigatorPropertiesSpoofing {
    constructor() {
        this.navigatorProfiles = this.initializeNavigatorProfiles();
        this.logger = logger;
    }

    /**
     * Initialize navigator profiles for different platforms and browsers
     */
    initializeNavigatorProfiles() {
        return {
            'chrome-windows': {
                appCodeName: 'Mozilla',
                appName: 'Netscape',
                appVersion: '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                platform: 'Win32',
                product: 'Gecko',
                productSub: '20030107',
                vendor: 'Google Inc.',
                vendorSub: '',
                language: 'en-US',
                languages: ['en-US', 'en'],
                onLine: true,
                cookieEnabled: true,
                doNotTrack: null,
                maxTouchPoints: 0,
                hardwareConcurrency: 8,
                deviceMemory: 8,
                connection: {
                    effectiveType: '4g',
                    rtt: 50,
                    downlink: 10
                }
            },
            'chrome-macos': {
                appCodeName: 'Mozilla',
                appName: 'Netscape',
                appVersion: '5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                platform: 'MacIntel',
                product: 'Gecko',
                productSub: '20030107',
                vendor: 'Google Inc.',
                vendorSub: '',
                language: 'en-US',
                languages: ['en-US', 'en'],
                onLine: true,
                cookieEnabled: true,
                doNotTrack: null,
                maxTouchPoints: 0,
                hardwareConcurrency: 8,
                deviceMemory: 8,
                connection: {
                    effectiveType: '4g',
                    rtt: 45,
                    downlink: 12
                }
            },
            'chrome-linux': {
                appCodeName: 'Mozilla',
                appName: 'Netscape',
                appVersion: '5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                platform: 'Linux x86_64',
                product: 'Gecko',
                productSub: '20030107',
                vendor: 'Google Inc.',
                vendorSub: '',
                language: 'en-US',
                languages: ['en-US', 'en'],
                onLine: true,
                cookieEnabled: true,
                doNotTrack: null,
                maxTouchPoints: 0,
                hardwareConcurrency: 4,
                deviceMemory: 4,
                connection: {
                    effectiveType: '4g',
                    rtt: 60,
                    downlink: 8
                }
            },
            'firefox-windows': {
                appCodeName: 'Mozilla',
                appName: 'Netscape',
                appVersion: '5.0 (Windows)',
                platform: 'Win32',
                product: 'Gecko',
                productSub: '20100101',
                vendor: '',
                vendorSub: '',
                language: 'en-US',
                languages: ['en-US', 'en'],
                onLine: true,
                cookieEnabled: true,
                doNotTrack: 'unspecified',
                maxTouchPoints: 0,
                hardwareConcurrency: 8,
                deviceMemory: undefined, // Firefox doesn't expose this
                connection: undefined // Firefox doesn't expose this by default
            },
            'safari-macos': {
                appCodeName: 'Mozilla',
                appName: 'Netscape',
                appVersion: '5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
                platform: 'MacIntel',
                product: 'Gecko',
                productSub: '20030107',
                vendor: 'Apple Computer, Inc.',
                vendorSub: '',
                language: 'en-US',
                languages: ['en-US', 'en'],
                onLine: true,
                cookieEnabled: true,
                doNotTrack: 'unspecified',
                maxTouchPoints: 0,
                hardwareConcurrency: 8,
                deviceMemory: undefined, // Safari doesn't expose this
                connection: undefined // Safari doesn't expose this
            }
        };
    }

    /**
     * Generate navigator properties for profile
     */
    generateNavigatorProperties(profile) {
        const seed = this.createSeed(profile.userAgent + profile.platform);
        const random = this.seededRandom(seed);
        
        const browserPlatform = this.detectBrowserPlatform(profile.userAgent, profile.platform);
        const baseProperties = this.navigatorProfiles[browserPlatform] || this.navigatorProfiles['chrome-windows'];
        
        // Add variations based on hardware profile
        const properties = { ...baseProperties };
        
        // Adjust hardware concurrency based on profile
        if (profile.hardware && profile.hardware.cores) {
            properties.hardwareConcurrency = profile.hardware.cores;
        } else {
            properties.hardwareConcurrency = this.generateHardwareConcurrency(random);
        }
        
        // Adjust device memory if supported
        if (properties.deviceMemory !== undefined) {
            if (profile.hardware && profile.hardware.memory) {
                properties.deviceMemory = Math.floor(profile.hardware.memory / 1024); // Convert MB to GB
            } else {
                properties.deviceMemory = this.generateDeviceMemory(random);
            }
        }
        
        // Adjust language settings
        if (profile.geolocation && profile.geolocation.language) {
            properties.language = profile.geolocation.language;
            properties.languages = this.generateLanguages(profile.geolocation.language);
        }
        
        // Add network connection properties for Chrome
        if (properties.connection) {
            properties.connection = this.generateConnectionProperties(random);
        }
        
        return properties;
    }

    /**
     * Generate hardware concurrency value
     */
    generateHardwareConcurrency(random) {
        const common = [2, 4, 6, 8, 12, 16];
        const weights = [0.1, 0.3, 0.2, 0.25, 0.1, 0.05];
        
        let cumulative = 0;
        const rand = random();
        
        for (let i = 0; i < common.length; i++) {
            cumulative += weights[i];
            if (rand <= cumulative) {
                return common[i];
            }
        }
        
        return 8; // default
    }

    /**
     * Generate device memory value
     */
    generateDeviceMemory(random) {
        const common = [2, 4, 8, 16];
        const weights = [0.15, 0.35, 0.35, 0.15];
        
        let cumulative = 0;
        const rand = random();
        
        for (let i = 0; i < common.length; i++) {
            cumulative += weights[i];
            if (rand <= cumulative) {
                return common[i];
            }
        }
        
        return 8; // default
    }

    /**
     * Generate languages array based on primary language
     */
    generateLanguages(primaryLang) {
        const baseLang = primaryLang.split('-')[0];
        if (baseLang === primaryLang) {
            return [primaryLang];
        }
        return [primaryLang, baseLang];
    }

    /**
     * Generate connection properties
     */
    generateConnectionProperties(random) {
        const effectiveTypes = ['slow-2g', '2g', '3g', '4g'];
        const weights = [0.02, 0.05, 0.13, 0.8];
        
        let cumulative = 0;
        const rand = random();
        let effectiveType = '4g';
        
        for (let i = 0; i < effectiveTypes.length; i++) {
            cumulative += weights[i];
            if (rand <= cumulative) {
                effectiveType = effectiveTypes[i];
                break;
            }
        }
        
        // Generate appropriate rtt and downlink based on effective type
        const connectionSpecs = {
            'slow-2g': { rtt: [2000, 5000], downlink: [0.025, 0.05] },
            '2g': { rtt: [1400, 2000], downlink: [0.05, 0.25] },
            '3g': { rtt: [270, 700], downlink: [0.4, 1.5] },
            '4g': { rtt: [0, 170], downlink: [1.5, 10] }
        };
        
        const spec = connectionSpecs[effectiveType];
        const rtt = Math.round(spec.rtt[0] + random() * (spec.rtt[1] - spec.rtt[0]));
        const downlink = Math.round((spec.downlink[0] + random() * (spec.downlink[1] - spec.downlink[0])) * 100) / 100;
        
        return {
            effectiveType,
            rtt,
            downlink
        };
    }

    /**
     * Inject navigator properties spoofing into page
     */
    async injectNavigatorSpoofing(page, profile) {
        try {
            const navigatorProps = this.generateNavigatorProperties(profile);
            
            await page.evaluateOnNewDocument((props) => {
                // Override navigator properties
                Object.keys(props).forEach(key => {
                    if (key === 'connection' && props[key]) {
                        // Handle connection object specially
                        if (navigator.connection) {
                            Object.defineProperty(navigator, 'connection', {
                                value: props[key],
                                writable: false,
                                configurable: true
                            });
                        }
                    } else if (props[key] !== undefined) {
                        Object.defineProperty(navigator, key, {
                            value: props[key],
                            writable: false,
                            configurable: true
                        });
                    }
                });

                // Override navigator.getBattery if it exists (Chrome)
                if (navigator.getBattery) {
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

                // Override navigator.getGamepads if it exists
                if (navigator.getGamepads) {
                    navigator.getGamepads = function() {
                        return [null, null, null, null]; // No gamepads connected
                    };
                }

                // Override navigator.sendBeacon
                if (navigator.sendBeacon) {
                    const originalSendBeacon = navigator.sendBeacon;
                    navigator.sendBeacon = function(url, data) {
                        // Add realistic delay and success rate
                        return new Promise((resolve) => {
                            setTimeout(() => {
                                resolve(originalSendBeacon.call(this, url, data));
                            }, 1 + Math.random() * 5);
                        });
                    };
                }

                // Add realistic timing to navigator.serviceWorker operations
                if (navigator.serviceWorker) {
                    const originalRegister = navigator.serviceWorker.register;
                    navigator.serviceWorker.register = function(scriptURL, options) {
                        return new Promise((resolve, reject) => {
                            setTimeout(() => {
                                originalRegister.call(this, scriptURL, options)
                                    .then(resolve)
                                    .catch(reject);
                            }, 50 + Math.random() * 200);
                        });
                    };
                }
            }, navigatorProps);

            this.logger.debug(`Navigator spoofing injected for ${profile.userAgent.substring(0, 50)}...`);
            return true;
        } catch (error) {
            this.logger.error('Navigator spoofing injection failed:', error);
            return false;
        }
    }

    /**
     * Detect browser and platform combination
     */
    detectBrowserPlatform(userAgent, platform) {
        const ua = userAgent.toLowerCase();
        const platformLower = platform.toLowerCase();
        
        let browser = 'chrome';
        if (ua.includes('firefox')) browser = 'firefox';
        else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'safari';
        
        let os = 'windows';
        if (platformLower.includes('mac')) os = 'macos';
        else if (platformLower.includes('linux') || platformLower.includes('unix')) os = 'linux';
        
        return `${browser}-${os}`;
    }

    /**
     * Create deterministic seed from string
     */
    createSeed(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Seeded random number generator
     */
    seededRandom(seed) {
        return function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }

    /**
     * Test navigator properties consistency
     */
    async testNavigatorConsistency(profile, iterations = 5) {
        const results = [];
        
        for (let i = 0; i < iterations; i++) {
            const props = this.generateNavigatorProperties(profile);
            results.push(props);
        }
        
        // Check consistency
        const firstResult = JSON.stringify(results[0]);
        const consistent = results.every(result => 
            JSON.stringify(result) === firstResult
        );
        
        return {
            consistent,
            properties: results[0],
            iterations
        };
    }
}

module.exports = NavigatorPropertiesSpoofing;