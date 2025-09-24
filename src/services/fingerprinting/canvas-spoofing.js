/**
 * Canvas Fingerprinting Control
 * Advanced canvas fingerprint manipulation with consistent noise injection
 * HeadlessX v1.3.0 - Enhanced Anti-Detection
 */

const crypto = require('crypto');

class CanvasSpoofing {
    constructor() {
        this.noiseProfiles = {
            low: { intensity: 1, frequency: 0.1 },
            medium: { intensity: 2, frequency: 0.3 },
            high: { intensity: 4, frequency: 0.5 }
        };
    }

    /**
     * Generate consistent noise for canvas fingerprinting
     * @param {string} seed - Consistent seed for noise generation
     * @param {string} level - Noise level (low, medium, high)
     * @returns {Function} Noise generation function
     */
    generateCanvasNoise(seed, level = 'medium') {
        const profile = this.noiseProfiles[level];
        const hash = crypto.createHash('sha256').update(seed).digest();
        
        return (index) => {
            const byteIndex = index % hash.length;
            const noiseValue = (hash[byteIndex] / 255) * profile.intensity - (profile.intensity / 2);
            return Math.random() < profile.frequency ? Math.floor(noiseValue) : 0;
        };
    }

    /**
     * Get canvas spoofing script for page injection
     * @param {string} profileId - Profile identifier for consistent fingerprinting
     * @param {string} noiseLevel - Noise level for canvas modification
     * @returns {string} JavaScript code for canvas spoofing
     */
    getCanvasSpoofingScript(profileId, noiseLevel = 'medium') {
        return `
        (function() {
            const profileId = '${profileId}';
            const noiseLevel = '${noiseLevel}';
            
            // Generate consistent noise function
            const generateNoise = (seed, level) => {
                const profiles = {
                    low: { intensity: 1, frequency: 0.1 },
                    medium: { intensity: 2, frequency: 0.3 },
                    high: { intensity: 4, frequency: 0.5 }
                };
                const profile = profiles[level] || profiles.medium;
                
                // Simple hash function for consistency
                let hash = 0;
                for (let i = 0; i < seed.length; i++) {
                    hash = ((hash << 5) - hash + seed.charCodeAt(i)) & 0xffffffff;
                }
                
                return (index) => {
                    const seedValue = Math.sin(hash + index) * 10000;
                    const noiseValue = (seedValue - Math.floor(seedValue)) * profile.intensity - (profile.intensity / 2);
                    return Math.random() < profile.frequency ? Math.floor(noiseValue) : 0;
                };
            };
            
            const noise = generateNoise(profileId, noiseLevel);
            
            // Override toDataURL for 2D canvas
            const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
            HTMLCanvasElement.prototype.toDataURL = function(...args) {
                const context = this.getContext('2d');
                if (context && this.width > 0 && this.height > 0) {
                    try {
                        // Add consistent noise to canvas
                        const imageData = context.getImageData(0, 0, this.width, this.height);
                        const data = imageData.data;
                        
                        for (let i = 0; i < data.length; i += 4) {
                            if (data[i + 3] > 0) { // Only modify non-transparent pixels
                                const noiseValue = noise(i);
                                data[i] = Math.max(0, Math.min(255, data[i] + noiseValue));
                                data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise(i + 1)));
                                data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise(i + 2)));
                            }
                        }
                        
                        context.putImageData(imageData, 0, 0);
                    } catch (e) {
                        // Silently continue if noise injection fails
                    }
                }
                return originalToDataURL.apply(this, args);
            };

            // Override toBlob for 2D canvas
            const originalToBlob = HTMLCanvasElement.prototype.toBlob;
            HTMLCanvasElement.prototype.toBlob = function(callback, ...args) {
                const context = this.getContext('2d');
                if (context && this.width > 0 && this.height > 0) {
                    try {
                        // Add consistent noise to canvas
                        const imageData = context.getImageData(0, 0, this.width, this.height);
                        const data = imageData.data;
                        
                        for (let i = 0; i < data.length; i += 4) {
                            if (data[i + 3] > 0) {
                                const noiseValue = noise(i);
                                data[i] = Math.max(0, Math.min(255, data[i] + noiseValue));
                                data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise(i + 1)));
                                data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise(i + 2)));
                            }
                        }
                        
                        context.putImageData(imageData, 0, 0);
                    } catch (e) {
                        // Silently continue if noise injection fails
                    }
                }
                return originalToBlob.apply(this, [callback, ...args]);
            };

            // Override fillText for text rendering fingerprinting
            const originalFillText = CanvasRenderingContext2D.prototype.fillText;
            CanvasRenderingContext2D.prototype.fillText = function(text, x, y, maxWidth) {
                try {
                    // Add subtle positioning variations based on profile
                    const offsetX = noise(text.length) * 0.1;
                    const offsetY = noise(text.length + 10) * 0.1;
                    return originalFillText.call(this, text, x + offsetX, y + offsetY, maxWidth);
                } catch (e) {
                    return originalFillText.call(this, text, x, y, maxWidth);
                }
            };

            // Override strokeText for text rendering fingerprinting
            const originalStrokeText = CanvasRenderingContext2D.prototype.strokeText;
            CanvasRenderingContext2D.prototype.strokeText = function(text, x, y, maxWidth) {
                try {
                    const offsetX = noise(text.length + 20) * 0.1;
                    const offsetY = noise(text.length + 30) * 0.1;
                    return originalStrokeText.call(this, text, x + offsetX, y + offsetY, maxWidth);
                } catch (e) {
                    return originalStrokeText.call(this, text, x, y, maxWidth);
                }
            };

            // Override getImageData for reading fingerprinting
            const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
            CanvasRenderingContext2D.prototype.getImageData = function(x, y, width, height) {
                const imageData = originalGetImageData.call(this, x, y, width, height);
                const data = imageData.data;
                
                // Add minimal noise to read operations
                for (let i = 0; i < data.length; i += 400) { // Less frequent noise
                    if (data[i + 3] > 0) {
                        const noiseValue = noise(i + Date.now() % 100);
                        if (Math.abs(noiseValue) > 0.5) {
                            data[i] = Math.max(0, Math.min(255, data[i] + Math.sign(noiseValue)));
                        }
                    }
                }
                
                return imageData;
            };

            console.log('🎨 Canvas fingerprint spoofing active - Profile:', profileId.slice(0, 8));
            
        })();
        `;
    }

    /**
     * Generate canvas fingerprint test data
     * @param {string} profileId - Profile identifier
     * @returns {Object} Test data for validation
     */
    generateTestFingerprint(profileId) {
        const canvas = {
            width: 200,
            height: 50,
            text: 'HeadlessX 1.3.0 🚀',
            font: '14px Arial',
            baseline: 'top'
        };

        // Simulate canvas operations for testing
        const textMetrics = {
            width: canvas.text.length * 8.2,
            actualBoundingBoxLeft: 0,
            actualBoundingBoxRight: canvas.text.length * 8.2,
            fontBoundingBoxAscent: 11,
            fontBoundingBoxDescent: 3,
            actualBoundingBoxAscent: 11,
            actualBoundingBoxDescent: 0
        };

        return {
            profileId,
            canvas,
            textMetrics,
            timestamp: Date.now(),
            fingerprint: crypto.createHash('sha256')
                .update(profileId + canvas.text + canvas.font)
                .digest('hex').slice(0, 16)
        };
    }

    /**
     * Add noise to canvas data
     */
    addNoise(imageData, profile = 'medium') {
        const noiseProfile = this.noiseProfiles[profile];
        if (!noiseProfile) return imageData;

        for (let i = 0; i < imageData.data.length; i += 4) {
            if (Math.random() < noiseProfile.frequency) {
                imageData.data[i] += (Math.random() - 0.5) * noiseProfile.intensity;     // R
                imageData.data[i + 1] += (Math.random() - 0.5) * noiseProfile.intensity; // G
                imageData.data[i + 2] += (Math.random() - 0.5) * noiseProfile.intensity; // B
            }
        }
        return imageData;
    }
}

module.exports = CanvasSpoofing;