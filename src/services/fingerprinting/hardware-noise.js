/**
 * Hardware Noise Generation v1.3.0
 * Generates realistic hardware fingerprint variations
 */

const crypto = require('crypto');

class HardwareNoise {
    /**
     * Generate hardware-specific fingerprint noise
     */
    static generateHardwareNoise(seed = crypto.randomBytes(16)) {
        const noiseGenerator = this.createSeededRandom(seed);
        
        return {
            performanceNoise: this.generatePerformanceNoise(noiseGenerator),
            timingNoise: this.generateTimingNoise(noiseGenerator),
            memoryNoise: this.generateMemoryNoise(noiseGenerator),
            cpuNoise: this.generateCPUNoise(noiseGenerator),
            gpuNoise: this.generateGPUNoise(noiseGenerator)
        };
    }
    
    /**
     * Create seeded random number generator
     */
    static createSeededRandom(seed) {
        let seedValue = 0;
        for (let i = 0; i < seed.length; i++) {
            seedValue += seed[i] * (i + 1);
        }
        
        return () => {
            seedValue = (seedValue * 9301 + 49297) % 233280;
            return seedValue / 233280;
        };
    }
    
    /**
     * Generate performance timing variations
     */
    static generatePerformanceNoise(random) {
        return {
            navigationStart: Math.floor(random() * 100) + 1500000000000,
            domainLookupStart: Math.floor(random() * 50) + 10,
            domainLookupEnd: Math.floor(random() * 30) + 50,
            connectStart: Math.floor(random() * 20) + 60,
            connectEnd: Math.floor(random() * 40) + 80,
            requestStart: Math.floor(random() * 10) + 120,
            responseStart: Math.floor(random() * 200) + 200,
            responseEnd: Math.floor(random() * 100) + 400,
            domLoading: Math.floor(random() * 50) + 450,
            domInteractive: Math.floor(random() * 300) + 800,
            domContentLoadedEventStart: Math.floor(random() * 50) + 1000,
            domContentLoadedEventEnd: Math.floor(random() * 20) + 1020,
            domComplete: Math.floor(random() * 200) + 1200,
            loadEventStart: Math.floor(random() * 10) + 1400,
            loadEventEnd: Math.floor(random() * 30) + 1420
        };
    }
    
    /**
     * Generate memory allocation noise
     */
    static generateMemoryNoise(random) {
        return {
            usedJSHeapSize: Math.floor(random() * 10000000) + 20000000,
            totalJSHeapSize: Math.floor(random() * 5000000) + 40000000,
            jsHeapSizeLimit: Math.floor(random() * 20000000) + 2000000000,
            heapFragmentation: random() * 0.3 + 0.1
        };
    }
    
    /**
     * Generate CPU timing noise
     */
    static generateCPUNoise(random) {
        return {
            coreVariations: Array.from({ length: 8 }, () => ({
                clockSpeed: random() * 200 + 2800, // MHz variations
                loadAverage: random() * 0.5 + 0.1,
                temperature: random() * 20 + 45 // Celsius
            })),
            instructionCache: Math.floor(random() * 1000) + 32000,
            dataCache: Math.floor(random() * 2000) + 32000,
            l3Cache: Math.floor(random() * 5000) + 8000000
        };
    }
    
    /**
     * Generate GPU rendering noise
     */
    static generateGPUNoise(random) {
        return {
            renderingVariations: {
                triangleStripError: random() * 0.1 - 0.05,
                pointSizeRange: [random() * 2 + 1, random() * 50 + 50],
                lineWidthRange: [random() * 2 + 1, random() * 10 + 10],
                viewportDimensions: [
                    Math.floor(random() * 100) + 16384,
                    Math.floor(random() * 100) + 16384
                ]
            },
            memoryInfo: {
                totalAvailableMemory: Math.floor(random() * 2048) + 4096,
                currentlyUsedMemory: Math.floor(random() * 512) + 256
            },
            shaderPrecision: {
                vertexHighFloat: {
                    precision: Math.floor(random() * 10) + 23,
                    rangeMin: Math.floor(random() * 10) + 127,
                    rangeMax: Math.floor(random() * 10) + 127
                },
                fragmentHighFloat: {
                    precision: Math.floor(random() * 10) + 23,
                    rangeMin: Math.floor(random() * 10) + 127,
                    rangeMax: Math.floor(random() * 10) + 127
                }
            }
        };
    }
    
    /**
     * Apply noise to existing hardware fingerprint
     */
    static applyNoiseToFingerprint(fingerprint, noiseLevel = 'medium') {
        const noise = this.generateHardwareNoise();
        const levels = {
            low: 0.05,
            medium: 0.15,
            high: 0.25
        };
        
        const factor = levels[noiseLevel] || levels.medium;
        
        // Apply subtle variations to performance metrics
        if (fingerprint.performance) {
            Object.keys(fingerprint.performance).forEach(key => {
                if (typeof fingerprint.performance[key] === 'number') {
                    const variation = (Math.random() - 0.5) * 2 * factor;
                    fingerprint.performance[key] *= (1 + variation);
                }
            });
        }
        
        // Apply memory variations
        if (fingerprint.memory) {
            Object.keys(fingerprint.memory).forEach(key => {
                if (typeof fingerprint.memory[key] === 'number') {
                    const variation = (Math.random() - 0.5) * 2 * factor;
                    fingerprint.memory[key] *= (1 + variation);
                }
            });
        }
        
        // Apply timing jitter
        if (fingerprint.timing) {
            Object.keys(fingerprint.timing).forEach(key => {
                if (typeof fingerprint.timing[key] === 'number') {
                    const jitter = (Math.random() - 0.5) * 20 * factor;
                    fingerprint.timing[key] += jitter;
                }
            });
        }
        
        return fingerprint;
    }
    
    /**
     * Generate consistent hardware noise for a session
     */
    static generateSessionNoise(sessionId) {
        const seed = crypto.createHash('sha256').update(sessionId).digest();
        return this.generateHardwareNoise(seed);
    }
}

module.exports = HardwareNoise;