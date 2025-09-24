/**
 * Advanced Random Generators
 * Consistent randomization utilities for fingerprinting
 * HeadlessX v1.3.0 - Enhanced Anti-Detection
 */

const crypto = require('crypto');

class RandomGenerators {
    constructor() {
        this.seedCache = new Map();
    }

    /**
     * Generate consistent random number based on seed
     * @param {string} seed - Seed string
     * @param {number} index - Index for variation
     * @param {number} min - Minimum value (default: 0)
     * @param {number} max - Maximum value (default: 1)
     * @returns {number} Consistent random number
     */
    seededRandom(seed, index = 0, min = 0, max = 1) {
        const fullSeed = seed + index.toString();

        if (!this.seedCache.has(fullSeed)) {
            const hash = crypto.createHash('sha256').update(fullSeed).digest();
            this.seedCache.set(fullSeed, hash);
        }

        const hash = this.seedCache.get(fullSeed);
        const value = hash.readUInt32BE(0) / 0xffffffff;

        return min + value * (max - min);
    }

    /**
     * Generate consistent random integer
     * @param {string} seed - Seed string
     * @param {number} index - Index for variation
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Consistent random integer
     */
    seededRandomInt(seed, index = 0, min = 0, max = 100) {
        return Math.floor(this.seededRandom(seed, index, min, max + 1));
    }

    /**
     * Generate consistent random boolean
     * @param {string} seed - Seed string
     * @param {number} index - Index for variation
     * @param {number} probability - Probability of true (0-1)
     * @returns {boolean} Consistent random boolean
     */
    seededRandomBool(seed, index = 0, probability = 0.5) {
        return this.seededRandom(seed, index) < probability;
    }

    /**
     * Generate consistent random choice from array
     * @param {string} seed - Seed string
     * @param {number} index - Index for variation
     * @param {Array} choices - Array of choices
     * @returns {any} Consistent random choice
     */
    seededRandomChoice(seed, index = 0, choices = []) {
        if (choices.length === 0) return null;
        const randomIndex = this.seededRandomInt(seed, index, 0, choices.length - 1);
        return choices[randomIndex];
    }

    /**
     * Generate consistent UUID based on seed
     * @param {string} seed - Seed string
     * @returns {string} Consistent UUID
     */
    seededUUID(seed) {
        const hash = crypto.createHash('sha256').update(seed).digest('hex');

        return [
            hash.slice(0, 8),
            hash.slice(8, 12),
            '4' + hash.slice(13, 16), // Version 4
            ((parseInt(hash.slice(16, 17), 16) & 0x3) | 0x8).toString(16) + hash.slice(17, 20), // Variant bits
            hash.slice(20, 32)
        ].join('-');
    }

    /**
     * Generate realistic timing variations
     * @param {string} seed - Seed string
     * @param {number} baseTime - Base time in milliseconds
     * @param {number} variationPercent - Variation percentage (0-100)
     * @returns {number} Time with realistic variation
     */
    generateTimingVariation(seed, baseTime, variationPercent = 20) {
        const variation = this.seededRandom(seed, Date.now() % 1000,
            -variationPercent / 100, variationPercent / 100);
        return Math.max(1, Math.round(baseTime * (1 + variation)));
    }

    /**
     * Generate Gaussian distributed random number (Box-Muller transform)
     * @param {string} seed - Seed string
     * @param {number} index - Index for variation
     * @param {number} mean - Mean value
     * @param {number} stddev - Standard deviation
     * @returns {number} Gaussian distributed random number
     */
    seededGaussian(seed, index = 0, mean = 0, stddev = 1) {
        // Generate two uniform random numbers
        const u1 = this.seededRandom(seed, index * 2);
        const u2 = this.seededRandom(seed, index * 2 + 1);

        // Box-Muller transform
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

        return z0 * stddev + mean;
    }

    /**
     * Generate realistic human-like delays
     * @param {string} seed - Seed string
     * @param {string} action - Action type (click, type, move, etc.)
     * @returns {number} Realistic delay in milliseconds
     */
    generateHumanDelay(seed, action = 'click') {
        const baseDelays = {
            click: { min: 50, max: 200, mean: 120 },
            type: { min: 80, max: 300, mean: 150 },
            move: { min: 20, max: 100, mean: 60 },
            scroll: { min: 100, max: 400, mean: 250 },
            think: { min: 500, max: 3000, mean: 1200 }
        };

        const delayConfig = baseDelays[action] || baseDelays.click;

        // Use Gaussian distribution for more natural timing
        const gaussianDelay = this.seededGaussian(
            seed + action,
            Date.now() % 100,
            delayConfig.mean,
            (delayConfig.max - delayConfig.min) / 4
        );

        // Clamp to realistic bounds
        return Math.max(delayConfig.min,
            Math.min(delayConfig.max, Math.round(gaussianDelay)));
    }

    /**
     * Generate consistent noise for fingerprinting
     * @param {string} seed - Seed string
     * @param {number} index - Index for variation
     * @param {number} amplitude - Noise amplitude
     * @returns {number} Noise value
     */
    generateNoise(seed, index, amplitude = 1) {
        return this.seededRandom(seed, index, -amplitude, amplitude);
    }

    /**
     * Generate realistic mouse jitter
     * @param {string} seed - Seed string
     * @param {number} index - Index for variation
     * @param {number} intensity - Jitter intensity (1-10)
     * @returns {Object} Jitter coordinates {x, y}
     */
    generateMouseJitter(seed, index, intensity = 3) {
        return {
            x: this.generateNoise(seed, index, intensity),
            y: this.generateNoise(seed, index + 1, intensity)
        };
    }

    /**
     * Generate consistent device-specific characteristics
     * @param {string} seed - Seed string
     * @param {string} deviceType - Device type (desktop, laptop, mobile)
     * @returns {Object} Device characteristics
     */
    generateDeviceCharacteristics(seed, deviceType = 'desktop') {
        const characteristics = {
            desktop: {
                mousePrecision: () => this.seededRandom(seed, 1, 0.9, 1.0),
                clickVariation: () => this.seededRandom(seed, 2, 0.8, 1.2),
                scrollSmoothing: () => this.seededRandom(seed, 3, 0.7, 0.9),
                typingSpeed: () => this.seededRandom(seed, 4, 0.8, 1.3)
            },
            laptop: {
                mousePrecision: () => this.seededRandom(seed, 1, 0.6, 0.8),
                clickVariation: () => this.seededRandom(seed, 2, 1.0, 1.4),
                scrollSmoothing: () => this.seededRandom(seed, 3, 0.8, 1.0),
                typingSpeed: () => this.seededRandom(seed, 4, 0.9, 1.1)
            },
            mobile: {
                mousePrecision: () => this.seededRandom(seed, 1, 0.4, 0.6),
                clickVariation: () => this.seededRandom(seed, 2, 1.2, 1.8),
                scrollSmoothing: () => this.seededRandom(seed, 3, 0.5, 0.7),
                typingSpeed: () => this.seededRandom(seed, 4, 0.6, 0.9)
            }
        };

        const deviceChars = characteristics[deviceType] || characteristics.desktop;

        return {
            mousePrecision: deviceChars.mousePrecision(),
            clickVariation: deviceChars.clickVariation(),
            scrollSmoothing: deviceChars.scrollSmoothing(),
            typingSpeed: deviceChars.typingSpeed()
        };
    }

    /**
     * Generate realistic user behavior patterns
     * @param {string} seed - Seed string
     * @param {string} userType - User type (casual, professional, power_user)
     * @returns {Object} Behavior patterns
     */
    generateBehaviorPattern(seed, userType = 'casual') {
        const patterns = {
            casual: {
                readingSpeed: () => this.seededRandom(seed, 10, 0.6, 1.0),
                impatienceLevel: () => this.seededRandom(seed, 11, 0.3, 0.7),
                errorProneness: () => this.seededRandom(seed, 12, 0.05, 0.15),
                multitaskingTendency: () => this.seededRandom(seed, 13, 0.2, 0.5)
            },
            professional: {
                readingSpeed: () => this.seededRandom(seed, 10, 1.0, 1.4),
                impatienceLevel: () => this.seededRandom(seed, 11, 0.5, 0.8),
                errorProneness: () => this.seededRandom(seed, 12, 0.02, 0.08),
                multitaskingTendency: () => this.seededRandom(seed, 13, 0.4, 0.8)
            },
            power_user: {
                readingSpeed: () => this.seededRandom(seed, 10, 1.3, 1.8),
                impatienceLevel: () => this.seededRandom(seed, 11, 0.7, 0.9),
                errorProneness: () => this.seededRandom(seed, 12, 0.01, 0.05),
                multitaskingTendency: () => this.seededRandom(seed, 13, 0.6, 0.9)
            }
        };

        const userPattern = patterns[userType] || patterns.casual;

        return {
            readingSpeed: userPattern.readingSpeed(),
            impatienceLevel: userPattern.impatienceLevel(),
            errorProneness: userPattern.errorProneness(),
            multitaskingTendency: userPattern.multitaskingTendency()
        };
    }

    /**
     * Clear seed cache to prevent memory leaks
     */
    clearCache() {
        this.seedCache.clear();
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        return {
            size: this.seedCache.size,
            memoryUsage: this.seedCache.size * 64, // Approximate bytes
            maxRecommendedSize: 1000
        };
    }
}

module.exports = RandomGenerators;
