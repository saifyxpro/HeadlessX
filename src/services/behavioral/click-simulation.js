/**
 * Click Simulation Engine
 * Advanced human-like click behavior simulation
 * HeadlessX v1.3.0 - Enhanced Anti-Detection
 */

const crypto = require('crypto');
const { logger } = require('../../utils/logger');

class ClickSimulation {
    constructor() {
        this.clickProfiles = this.initializeClickProfiles();
        this.logger = logger;
    }

    /**
     * Initialize click behavior profiles
     */
    initializeClickProfiles() {
        return {
            // Careful, methodical clicker
            cautious: {
                clickDelay: { min: 800, max: 2000 },
                dwellTime: { min: 150, max: 400 },
                accuracy: 0.95,
                doubleClickChance: 0.05,
                rightClickChance: 0.02,
                missClickChance: 0.01,
                retryAfterMiss: true
            },
            // Normal user behavior
            normal: {
                clickDelay: { min: 300, max: 1200 },
                dwellTime: { min: 80, max: 200 },
                accuracy: 0.92,
                doubleClickChance: 0.08,
                rightClickChance: 0.05,
                missClickChance: 0.03,
                retryAfterMiss: true
            },
            // Fast, confident clicker
            aggressive: {
                clickDelay: { min: 100, max: 600 },
                dwellTime: { min: 50, max: 120 },
                accuracy: 0.88,
                doubleClickChance: 0.12,
                rightClickChance: 0.08,
                missClickChance: 0.05,
                retryAfterMiss: false
            },
            // Mobile-like behavior
            mobile: {
                clickDelay: { min: 400, max: 1000 },
                dwellTime: { min: 200, max: 500 },
                accuracy: 0.85,
                doubleClickChance: 0.02,
                rightClickChance: 0.01,
                missClickChance: 0.08,
                retryAfterMiss: true
            }
        };
    }

    /**
     * Simulate human-like click with realistic timing and positioning
     */
    async simulateHumanClick(page, selector, options = {}) {
        try {
            const profileType = options.profile || 'normal';
            const profile = this.clickProfiles[profileType];
            const seed = this.createSeed(selector + Date.now());
            const random = this.seededRandom(seed);
            
            // Wait for element to be visible
            await page.waitForSelector(selector, { timeout: 10000 });
            
            // Get element position and dimensions
            const element = await page.$(selector);
            if (!element) {
                throw new Error(`Element ${selector} not found`);
            }
            
            const boundingBox = await element.boundingBox();
            if (!boundingBox) {
                throw new Error(`Element ${selector} not visible`);
            }
            
            // Calculate click position with human-like variations
            const clickPosition = this.calculateHumanClickPosition(boundingBox, profile, random);
            
            // Pre-click delay (user decision time)
            const preClickDelay = this.calculateDelay(profile.clickDelay, random);
            await this.wait(preClickDelay);
            
            // Move mouse to position with realistic movement
            await this.simulateMouseMovement(page, clickPosition, random);
            
            // Simulate potential miss-click
            if (random() < profile.missClickChance && profile.retryAfterMiss) {
                await this.simulateMissClick(page, clickPosition, boundingBox, random);
                // Brief pause before retry
                await this.wait(100 + random() * 200);
            }
            
            // Perform the actual click
            const clickType = this.determineClickType(profile, random);
            await this.performClick(page, clickPosition, clickType, profile, random);
            
            // Post-click dwell time
            const dwellTime = this.calculateDelay(profile.dwellTime, random);
            await this.wait(dwellTime);
            
            this.logger.debug(`Human click simulated on ${selector} at (${clickPosition.x}, ${clickPosition.y})`);
            return true;
            
        } catch (error) {
            this.logger.error('Click simulation failed:', error);
            return false;
        }
    }

    /**
     * Calculate human-like click position within element bounds
     */
    calculateHumanClickPosition(boundingBox, profile, random) {
        const { x, y, width, height } = boundingBox;
        
        // Most humans click slightly off-center
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        // Add gaussian-distributed offset
        const offsetX = this.gaussianRandom(random) * width * 0.2;
        const offsetY = this.gaussianRandom(random) * height * 0.2;
        
        // Ensure click stays within element bounds
        const clickX = Math.max(x + 5, Math.min(x + width - 5, centerX + offsetX));
        const clickY = Math.max(y + 5, Math.min(y + height - 5, centerY + offsetY));
        
        return { x: Math.round(clickX), y: Math.round(clickY) };
    }

    /**
     * Simulate realistic mouse movement to target
     */
    async simulateMouseMovement(page, targetPosition, random) {
        // Get current mouse position (or use default)
        const currentPosition = { x: 100 + random() * 200, y: 100 + random() * 200 };
        
        // Generate bezier curve path
        const controlPoints = this.generateBezierPath(currentPosition, targetPosition, random);
        
        // Move along the path
        const steps = 8 + Math.floor(random() * 12); // 8-20 steps
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const point = this.calculateBezierPoint(controlPoints, t);
            
            await page.mouse.move(point.x, point.y);
            
            // Small delay between movements
            if (i < steps) {
                await this.wait(5 + random() * 15);
            }
        }
    }

    /**
     * Generate bezier curve control points for natural mouse movement
     */
    generateBezierPath(start, end, random) {
        const distance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
        const curvature = Math.min(distance * 0.3, 100); // Adjust curvature based on distance
        
        // Control points for bezier curve
        const cp1 = {
            x: start.x + (end.x - start.x) * 0.3 + (random() - 0.5) * curvature,
            y: start.y + (end.y - start.y) * 0.3 + (random() - 0.5) * curvature
        };
        
        const cp2 = {
            x: start.x + (end.x - start.x) * 0.7 + (random() - 0.5) * curvature,
            y: start.y + (end.y - start.y) * 0.7 + (random() - 0.5) * curvature
        };
        
        return [start, cp1, cp2, end];
    }

    /**
     * Calculate point on bezier curve
     */
    calculateBezierPoint(points, t) {
        const [p0, p1, p2, p3] = points;
        const invT = 1 - t;
        const invT2 = invT * invT;
        const invT3 = invT2 * invT;
        const t2 = t * t;
        const t3 = t2 * t;
        
        return {
            x: invT3 * p0.x + 3 * invT2 * t * p1.x + 3 * invT * t2 * p2.x + t3 * p3.x,
            y: invT3 * p0.y + 3 * invT2 * t * p1.y + 3 * invT * t2 * p2.y + t3 * p3.y
        };
    }

    /**
     * Simulate miss-click behavior
     */
    async simulateMissClick(page, targetPosition, boundingBox, random) {
        // Click slightly outside the target
        const missOffset = 10 + random() * 30;
        const angle = random() * 2 * Math.PI;
        
        const missX = targetPosition.x + Math.cos(angle) * missOffset;
        const missY = targetPosition.y + Math.sin(angle) * missOffset;
        
        await page.mouse.click(missX, missY);
        
        // Brief pause as user realizes the mistake
        await this.wait(200 + random() * 300);
    }

    /**
     * Determine click type (left, right, double)
     */
    determineClickType(profile, random) {
        const rand = random();
        
        if (rand < profile.rightClickChance) {
            return 'right';
        } else if (rand < profile.rightClickChance + profile.doubleClickChance) {
            return 'double';
        }
        
        return 'left';
    }

    /**
     * Perform the actual click with specified type
     */
    async performClick(page, position, clickType, profile, random) {
        const { x, y } = position;
        
        switch (clickType) {
            case 'right':
                await page.mouse.click(x, y, { button: 'right' });
                break;
                
            case 'double':
                const doubleClickDelay = 50 + random() * 100; // Realistic double-click timing
                await page.mouse.click(x, y);
                await this.wait(doubleClickDelay);
                await page.mouse.click(x, y);
                break;
                
            default: // left click
                // Simulate mouse down/up with realistic timing
                await page.mouse.move(x, y);
                await page.mouse.down();
                
                // Hold time varies for different click types
                const holdTime = 30 + random() * 70;
                await this.wait(holdTime);
                
                await page.mouse.up();
                break;
        }
    }

    /**
     * Calculate delay based on range and human-like distribution
     */
    calculateDelay(delayRange, random) {
        const { min, max } = delayRange;
        
        // Use gamma distribution for more realistic timing
        const alpha = 2;
        const beta = 2;
        const gamma = this.gammaRandom(alpha, beta, random);
        
        // Scale to desired range
        const normalized = Math.min(1, gamma / 4); // Clamp to reasonable range
        return Math.round(min + (max - min) * normalized);
    }

    /**
     * Generate gaussian-distributed random number
     */
    gaussianRandom(random) {
        // Box-Muller transform
        const u1 = random();
        const u2 = random();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return z0;
    }

    /**
     * Generate gamma-distributed random number
     */
    gammaRandom(alpha, beta, random) {
        // Simple gamma distribution approximation
        let result = 0;
        for (let i = 0; i < alpha; i++) {
            result += -Math.log(random());
        }
        return result / beta;
    }

    /**
     * Simulate click sequence on multiple elements
     */
    async simulateClickSequence(page, selectors, options = {}) {
        const results = [];
        
        for (let i = 0; i < selectors.length; i++) {
            const selector = selectors[i];
            
            // Add inter-click delay
            if (i > 0) {
                const interDelay = 500 + Math.random() * 1500;
                await this.wait(interDelay);
            }
            
            const result = await this.simulateHumanClick(page, selector, options);
            results.push({ selector, success: result });
            
            if (!result && options.stopOnError) {
                break;
            }
        }
        
        return results;
    }

    /**
     * Create deterministic seed from string
     */
    createSeed(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
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
     * Promise-based wait function
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Test click behavior consistency
     */
    async testClickConsistency(profileType = 'normal', iterations = 5) {
        const profile = this.clickProfiles[profileType];
        const results = [];
        
        for (let i = 0; i < iterations; i++) {
            const seed = this.createSeed(`test${i}`);
            const random = this.seededRandom(seed);
            
            const clickDelay = this.calculateDelay(profile.clickDelay, random);
            const dwellTime = this.calculateDelay(profile.dwellTime, random);
            
            results.push({ clickDelay, dwellTime });
        }
        
        return {
            profile: profileType,
            results,
            iterations
        };
    }
}

module.exports = ClickSimulation;