/**
 * Attention Model Engine
 * Advanced human attention and focus simulation
 * HeadlessX v1.3.0 - Enhanced Anti-Detection
 */

const crypto = require('crypto');
const { logger } = require('../../utils/logger');

class AttentionModel {
    constructor() {
        this.attentionProfiles = this.initializeAttentionProfiles();
        this.currentFocus = null;
        this.attentionHistory = [];
        this.logger = logger;
    }

    /**
     * Initialize attention behavior profiles
     */
    initializeAttentionProfiles() {
        return {
            // Focused, task-oriented user
            focused: {
                attentionSpan: { min: 30000, max: 180000 }, // 30s - 3min
                distractionChance: 0.1,
                multitaskingTendency: 0.2,
                scrollReadingRatio: 0.8, // High reading comprehension
                tabSwitchingFrequency: 0.05,
                mouseIdleChance: 0.3
            },
            // Normal web browsing behavior
            casual: {
                attentionSpan: { min: 10000, max: 60000 }, // 10s - 1min
                distractionChance: 0.25,
                multitaskingTendency: 0.5,
                scrollReadingRatio: 0.6,
                tabSwitchingFrequency: 0.15,
                mouseIdleChance: 0.5
            },
            // Distracted, quickly browsing
            scattered: {
                attentionSpan: { min: 3000, max: 20000 }, // 3s - 20s
                distractionChance: 0.4,
                multitaskingTendency: 0.8,
                scrollReadingRatio: 0.3, // Skimming behavior
                tabSwitchingFrequency: 0.3,
                mouseIdleChance: 0.7
            },
            // Mobile user behavior
            mobile: {
                attentionSpan: { min: 5000, max: 30000 }, // 5s - 30s
                distractionChance: 0.35,
                multitaskingTendency: 0.6,
                scrollReadingRatio: 0.4,
                tabSwitchingFrequency: 0.2,
                mouseIdleChance: 0.1 // Less mouse movement on mobile
            }
        };
    }

    /**
     * Start attention simulation for a page session
     */
    async startAttentionSimulation(page, profile = 'casual', duration = 60000) {
        try {
            const attentionProfile = this.attentionProfiles[profile];
            const seed = this.createSeed(profile + Date.now());
            const random = this.seededRandom(seed);
            
            this.currentFocus = {
                startTime: Date.now(),
                profile,
                totalDuration: duration,
                remainingTime: duration
            };
            
            // Start attention behaviors
            this.simulateAttentionPatterns(page, attentionProfile, random, duration);
            
            this.logger.debug(`Attention simulation started: ${profile} profile for ${duration}ms`);
            return true;
            
        } catch (error) {
            this.logger.error('Attention simulation failed to start:', error);
            return false;
        }
    }

    /**
     * Simulate various attention patterns
     */
    async simulateAttentionPatterns(page, profile, random, duration) {
        const startTime = Date.now();
        const endTime = startTime + duration;
        
        while (Date.now() < endTime && this.currentFocus) {
            // Calculate remaining time
            const remaining = endTime - Date.now();
            if (remaining <= 0) break;
            
            // Choose attention behavior
            const behavior = this.selectAttentionBehavior(profile, random);
            
            try {
                switch (behavior) {
                    case 'reading':
                        await this.simulateReadingBehavior(page, profile, random);
                        break;
                    case 'scanning':
                        await this.simulateScanningBehavior(page, profile, random);
                        break;
                    case 'idle':
                        await this.simulateIdleBehavior(page, profile, random);
                        break;
                    case 'distraction':
                        await this.simulateDistractionBehavior(page, profile, random);
                        break;
                    case 'interaction':
                        await this.simulateInteractionBehavior(page, profile, random);
                        break;
                }
            } catch (error) {
                this.logger.debug('Attention behavior error:', error.message);
            }
            
            // Record attention event
            this.recordAttentionEvent(behavior, Date.now() - startTime);
            
            // Brief pause between behaviors
            const pauseDuration = 100 + random() * 500;
            await this.wait(Math.min(pauseDuration, remaining));
        }
    }

    /**
     * Select attention behavior based on profile
     */
    selectAttentionBehavior(profile, random) {
        const rand = random();
        
        // Behavior probabilities based on profile
        const behaviors = {
            focused: {
                reading: 0.4,
                scanning: 0.2,
                interaction: 0.25,
                idle: 0.1,
                distraction: 0.05
            },
            casual: {
                reading: 0.25,
                scanning: 0.3,
                interaction: 0.2,
                idle: 0.15,
                distraction: 0.1
            },
            scattered: {
                reading: 0.15,
                scanning: 0.4,
                interaction: 0.15,
                idle: 0.2,
                distraction: 0.1
            },
            mobile: {
                reading: 0.2,
                scanning: 0.35,
                interaction: 0.25,
                idle: 0.15,
                distraction: 0.05
            }
        };
        
        const profileBehaviors = behaviors[profile.constructor.name] || behaviors.casual;
        let cumulative = 0;
        
        for (const [behavior, probability] of Object.entries(profileBehaviors)) {
            cumulative += probability;
            if (rand <= cumulative) {
                return behavior;
            }
        }
        
        return 'reading'; // default
    }

    /**
     * Simulate reading behavior with realistic eye movement patterns
     */
    async simulateReadingBehavior(page, profile, random) {
        const readingDuration = 2000 + random() * 8000; // 2-10 seconds
        const startTime = Date.now();
        
        // Simulate reading patterns
        while (Date.now() - startTime < readingDuration) {
            // Small mouse movements simulating reading focus
            if (random() < 0.3) {
                const currentPos = await this.getCurrentMousePosition(page);
                const newX = currentPos.x + (random() - 0.5) * 50;
                const newY = currentPos.y + (random() - 0.5) * 20;
                
                await page.mouse.move(newX, newY);
            }
            
            // Occasional small scrolls during reading
            if (random() < 0.1) {
                await page.mouse.wheel({ deltaY: 50 + random() * 100 });
            }
            
            await this.wait(200 + random() * 800);
        }
    }

    /**
     * Simulate scanning behavior (quick page overview)
     */
    async simulateScanningBehavior(page, profile, random) {
        const scanDuration = 1000 + random() * 4000; // 1-5 seconds
        const startTime = Date.now();
        const scanSteps = 3 + Math.floor(random() * 5); // 3-8 scan points
        
        for (let i = 0; i < scanSteps && Date.now() - startTime < scanDuration; i++) {
            // Move to different areas of the page
            const viewportSize = await page.viewport();
            const targetX = 100 + random() * (viewportSize.width - 200);
            const targetY = 100 + random() * (viewportSize.height - 200);
            
            // Quick movement to scan target
            await page.mouse.move(targetX, targetY);
            
            // Brief pause to "read" the area
            await this.wait(300 + random() * 700);
            
            // Small scroll to see more content
            if (random() < 0.6) {
                await page.mouse.wheel({ deltaY: 100 + random() * 300 });
            }
        }
    }

    /**
     * Simulate idle behavior (user thinking or distracted)
     */
    async simulateIdleBehavior(page, profile, random) {
        const idleDuration = 1000 + random() * 5000; // 1-6 seconds
        
        // Very minimal activity during idle
        const idleSteps = Math.floor(idleDuration / 1000);
        
        for (let i = 0; i < idleSteps; i++) {
            // Very small, occasional mouse movements
            if (random() < 0.2) {
                const currentPos = await this.getCurrentMousePosition(page);
                const newX = currentPos.x + (random() - 0.5) * 10;
                const newY = currentPos.y + (random() - 0.5) * 10;
                
                await page.mouse.move(newX, newY);
            }
            
            await this.wait(1000);
        }
    }

    /**
     * Simulate distraction behavior
     */
    async simulateDistractionBehavior(page, profile, random) {
        // Simulate brief attention loss
        const distractionDuration = 500 + random() * 2000;
        
        // Quick, erratic movements
        const movements = 2 + Math.floor(random() * 4);
        
        for (let i = 0; i < movements; i++) {
            const viewportSize = await page.viewport();
            const targetX = random() * viewportSize.width;
            const targetY = random() * viewportSize.height;
            
            await page.mouse.move(targetX, targetY);
            await this.wait(distractionDuration / movements);
        }
        
        // Return to previous focus area (if any)
        if (this.attentionHistory.length > 0) {
            const lastFocus = this.attentionHistory[this.attentionHistory.length - 1];
            if (lastFocus.mousePosition) {
                await page.mouse.move(lastFocus.mousePosition.x, lastFocus.mousePosition.y);
            }
        }
    }

    /**
     * Simulate interaction behavior (clicking, form filling)
     */
    async simulateInteractionBehavior(page, profile, random) {
        try {
            // Look for interactive elements
            const interactiveElements = await page.$$eval('a, button, input, select', elements => {
                return elements.slice(0, 10).map((el, index) => ({
                    index,
                    tag: el.tagName.toLowerCase(),
                    type: el.type || '',
                    visible: el.offsetParent !== null
                }));
            });
            
            if (interactiveElements.length > 0) {
                const targetElement = interactiveElements[Math.floor(random() * interactiveElements.length)];
                
                if (targetElement.visible) {
                    // Simulate consideration time
                    await this.wait(500 + random() * 1500);
                    
                    // Move to element and potentially interact
                    const selector = this.generateElementSelector(targetElement);
                    
                    try {
                        await page.hover(selector);
                        await this.wait(200 + random() * 800);
                        
                        // Sometimes click, sometimes just hover
                        if (random() < 0.3) {
                            await page.click(selector);
                        }
                    } catch (error) {
                        // Element might not be interactable, that's ok
                    }
                }
            }
        } catch (error) {
            // No interactive elements found or error occurred
            await this.simulateReadingBehavior(page, profile, random);
        }
    }

    /**
     * Generate selector for element interaction
     */
    generateElementSelector(element) {
        switch (element.tag) {
            case 'a':
                return `a:nth-child(${element.index + 1})`;
            case 'button':
                return `button:nth-child(${element.index + 1})`;
            case 'input':
                return `input:nth-child(${element.index + 1})`;
            default:
                return `${element.tag}:nth-child(${element.index + 1})`;
        }
    }

    /**
     * Get current mouse position (or estimate)
     */
    async getCurrentMousePosition(page) {
        try {
            return await page.evaluate(() => ({
                x: window.mouseX || 200,
                y: window.mouseY || 200
            }));
        } catch (error) {
            return { x: 200, y: 200 }; // Default position
        }
    }

    /**
     * Record attention event for analytics
     */
    recordAttentionEvent(behavior, timestamp) {
        this.attentionHistory.push({
            behavior,
            timestamp,
            duration: timestamp - (this.attentionHistory.length > 0 ? 
                this.attentionHistory[this.attentionHistory.length - 1].timestamp : 0)
        });
        
        // Keep history manageable
        if (this.attentionHistory.length > 100) {
            this.attentionHistory = this.attentionHistory.slice(-50);
        }
    }

    /**
     * Stop attention simulation
     */
    stopAttentionSimulation() {
        this.currentFocus = null;
        
        const summary = {
            totalEvents: this.attentionHistory.length,
            behaviors: this.attentionHistory.reduce((acc, event) => {
                acc[event.behavior] = (acc[event.behavior] || 0) + 1;
                return acc;
            }, {}),
            averageDuration: this.attentionHistory.length > 0 ? 
                this.attentionHistory.reduce((sum, event) => sum + event.duration, 0) / this.attentionHistory.length : 0
        };
        
        this.logger.debug('Attention simulation stopped:', summary);
        return summary;
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
     * Get attention statistics
     */
    getAttentionStatistics() {
        if (!this.currentFocus) {
            return null;
        }
        
        return {
            profile: this.currentFocus.profile,
            elapsedTime: Date.now() - this.currentFocus.startTime,
            remainingTime: Math.max(0, this.currentFocus.remainingTime - (Date.now() - this.currentFocus.startTime)),
            totalEvents: this.attentionHistory.length,
            recentBehaviors: this.attentionHistory.slice(-10).map(event => event.behavior)
        };
    }
}

module.exports = AttentionModel;