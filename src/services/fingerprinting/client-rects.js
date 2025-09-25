/**
 * Client Rects Fingerprinting Control
 * Advanced DOM element positioning and measurement spoofing
 * HeadlessX v1.3.0 - Enhanced Anti-Detection
 */

const crypto = require('crypto');
const { logger } = require('../../utils/logger');

class ClientRectsSpoofing {
    constructor() {
        this.logger = logger;
        this.measurementVariations = this.initializeMeasurementVariations();
    }

    /**
     * Initialize measurement variations for different rendering engines
     */
    initializeMeasurementVariations() {
        return {
            chrome: {
                subpixelVariation: 0.1,
                rounding: 'round',
                zoomFactor: 1.0
            },
            firefox: {
                subpixelVariation: 0.05,
                rounding: 'floor',
                zoomFactor: 1.0
            },
            safari: {
                subpixelVariation: 0.15,
                rounding: 'ceil',
                zoomFactor: 1.0
            }
        };
    }

    /**
     * Generate consistent client rect measurements
     */
    generateClientRectProfile(profile) {
        const seed = this.createSeed(profile.userAgent + profile.screen.width + profile.screen.height);
        const random = this.seededRandom(seed);
        
        const engine = this.detectRenderingEngine(profile.userAgent);
        const variation = this.measurementVariations[engine] || this.measurementVariations.chrome;
        
        return {
            engine,
            baseVariation: variation.subpixelVariation * (random() - 0.5),
            roundingMethod: variation.rounding,
            zoomFactor: variation.zoomFactor + (random() - 0.5) * 0.01,
            seed
        };
    }

    /**
     * Inject client rects spoofing into page
     */
    async injectClientRectsSpoofing(page, profile) {
        try {
            const rectProfile = this.generateClientRectProfile(profile);
            
            await page.evaluateOnNewDocument((profile) => {
                const { baseVariation, roundingMethod, zoomFactor, seed } = profile;
                
                // Create seeded random function for consistent variations
                const seededRandom = (function() {
                    let s = seed;
                    return function() {
                        s = (s * 9301 + 49297) % 233280;
                        return s / 233280;
                    };
                })();

                // Helper function to apply variation
                function applyVariation(value, elementId = '') {
                    // Create element-specific seed for consistency
                    let elementSeed = 0;
                    for (let i = 0; i < elementId.length; i++) {
                        elementSeed += elementId.charCodeAt(i);
                    }
                    
                    const variation = baseVariation + (elementSeed % 100) / 10000;
                    const result = value * zoomFactor + variation;
                    
                    switch (roundingMethod) {
                        case 'floor': return Math.floor(result);
                        case 'ceil': return Math.ceil(result);
                        default: return Math.round(result);
                    }
                }

                // Override getBoundingClientRect
                const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
                Element.prototype.getBoundingClientRect = function() {
                    const rect = originalGetBoundingClientRect.call(this);
                    const elementId = this.id || this.className || this.tagName;
                    
                    // Apply consistent variations to measurements
                    return {
                        top: applyVariation(rect.top, elementId + 'top'),
                        left: applyVariation(rect.left, elementId + 'left'),
                        bottom: applyVariation(rect.bottom, elementId + 'bottom'),
                        right: applyVariation(rect.right, elementId + 'right'),
                        width: applyVariation(rect.width, elementId + 'width'),
                        height: applyVariation(rect.height, elementId + 'height'),
                        x: applyVariation(rect.x || rect.left, elementId + 'x'),
                        y: applyVariation(rect.y || rect.top, elementId + 'y')
                    };
                };

                // Override getClientRects
                const originalGetClientRects = Element.prototype.getClientRects;
                Element.prototype.getClientRects = function() {
                    const rects = originalGetClientRects.call(this);
                    const elementId = this.id || this.className || this.tagName;
                    
                    // Apply variations to all rects
                    const modifiedRects = [];
                    for (let i = 0; i < rects.length; i++) {
                        const rect = rects[i];
                        modifiedRects.push({
                            top: applyVariation(rect.top, elementId + i + 'top'),
                            left: applyVariation(rect.left, elementId + i + 'left'),
                            bottom: applyVariation(rect.bottom, elementId + i + 'bottom'),
                            right: applyVariation(rect.right, elementId + i + 'right'),
                            width: applyVariation(rect.width, elementId + i + 'width'),
                            height: applyVariation(rect.height, elementId + i + 'height'),
                            x: applyVariation(rect.x || rect.left, elementId + i + 'x'),
                            y: applyVariation(rect.y || rect.top, elementId + i + 'y')
                        });
                    }
                    
                    // Return array-like object with length property
                    modifiedRects.length = rects.length;
                    return modifiedRects;
                };

                // Override Range.getBoundingClientRect
                if (typeof Range !== 'undefined') {
                    const originalRangeGetBoundingClientRect = Range.prototype.getBoundingClientRect;
                    Range.prototype.getBoundingClientRect = function() {
                        const rect = originalRangeGetBoundingClientRect.call(this);
                        const rangeId = 'range' + this.toString().length;
                        
                        return {
                            top: applyVariation(rect.top, rangeId + 'top'),
                            left: applyVariation(rect.left, rangeId + 'left'),
                            bottom: applyVariation(rect.bottom, rangeId + 'bottom'),
                            right: applyVariation(rect.right, rangeId + 'right'),
                            width: applyVariation(rect.width, rangeId + 'width'),
                            height: applyVariation(rect.height, rangeId + 'height'),
                            x: applyVariation(rect.x || rect.left, rangeId + 'x'),
                            y: applyVariation(rect.y || rect.top, rangeId + 'y')
                        };
                    };

                    const originalRangeGetClientRects = Range.prototype.getClientRects;
                    Range.prototype.getClientRects = function() {
                        const rects = originalRangeGetClientRects.call(this);
                        const rangeId = 'range' + this.toString().length;
                        
                        const modifiedRects = [];
                        for (let i = 0; i < rects.length; i++) {
                            const rect = rects[i];
                            modifiedRects.push({
                                top: applyVariation(rect.top, rangeId + i + 'top'),
                                left: applyVariation(rect.left, rangeId + i + 'left'),
                                bottom: applyVariation(rect.bottom, rangeId + i + 'bottom'),
                                right: applyVariation(rect.right, rangeId + i + 'right'),
                                width: applyVariation(rect.width, rangeId + i + 'width'),
                                height: applyVariation(rect.height, rangeId + i + 'height'),
                                x: applyVariation(rect.x || rect.left, rangeId + i + 'x'),
                                y: applyVariation(rect.y || rect.top, rangeId + i + 'y')
                            });
                        }
                        
                        modifiedRects.length = rects.length;
                        return modifiedRects;
                    };
                }

                // Override scroll measurements
                Object.defineProperties(Element.prototype, {
                    scrollTop: {
                        get: function() {
                            const original = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTop') ||
                                           Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTop');
                            if (original && original.get) {
                                const value = original.get.call(this);
                                const elementId = this.id || this.className || this.tagName;
                                return applyVariation(value, elementId + 'scrollTop');
                            }
                            return 0;
                        },
                        set: function(value) {
                            const original = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTop') ||
                                           Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTop');
                            if (original && original.set) {
                                original.set.call(this, value);
                            }
                        }
                    },
                    scrollLeft: {
                        get: function() {
                            const original = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollLeft') ||
                                           Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollLeft');
                            if (original && original.get) {
                                const value = original.get.call(this);
                                const elementId = this.id || this.className || this.tagName;
                                return applyVariation(value, elementId + 'scrollLeft');
                            }
                            return 0;
                        },
                        set: function(value) {
                            const original = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollLeft') ||
                                           Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollLeft');
                            if (original && original.set) {
                                original.set.call(this, value);
                            }
                        }
                    }
                });

            }, rectProfile);

            this.logger.debug(`Client rects spoofing injected for ${profile.userAgent.substring(0, 50)}...`);
            return true;
        } catch (error) {
            this.logger.error('Client rects spoofing injection failed:', error);
            return false;
        }
    }

    /**
     * Detect rendering engine from user agent
     */
    detectRenderingEngine(userAgent) {
        const ua = userAgent.toLowerCase();
        if (ua.includes('firefox')) return 'firefox';
        if (ua.includes('safari') && !ua.includes('chrome')) return 'safari';
        if (ua.includes('chrome') || ua.includes('chromium')) return 'chrome';
        return 'chrome'; // default
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
     * Test client rects consistency
     */
    async testClientRectsConsistency(profile, iterations = 5) {
        const results = [];
        
        for (let i = 0; i < iterations; i++) {
            const rectProfile = this.generateClientRectProfile(profile);
            results.push(rectProfile);
        }
        
        // Check consistency
        const firstResult = JSON.stringify(results[0]);
        const consistent = results.every(result => 
            JSON.stringify(result) === firstResult
        );
        
        return {
            consistent,
            profile: results[0],
            iterations
        };
    }
}

module.exports = ClientRectsSpoofing;