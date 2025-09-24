/**
 * Enhanced Page Interaction Service v1.3.0
 * Handles advanced human-like interactions, behavioral simulation, and anti-detection
 * Features: Bezier curve mouse movement, keyboard dynamics, scroll patterns, timing variations
 */

const crypto = require('crypto');

// Behavioral profiles for different user types
const BEHAVIORAL_PROFILES = {
    confident: {
        mouseSpeed: { min: 800, max: 1500 },
        acceleration: { min: 0.8, max: 1.2 },
        pauseBetweenActions: { min: 100, max: 300 },
        scrollPattern: 'aggressive',
        typingSpeed: { min: 80, max: 120 }
    },
    natural: {
        mouseSpeed: { min: 600, max: 1000 },
        acceleration: { min: 0.6, max: 0.9 },
        pauseBetweenActions: { min: 200, max: 500 },
        scrollPattern: 'smooth',
        typingSpeed: { min: 60, max: 90 }
    },
    cautious: {
        mouseSpeed: { min: 400, max: 700 },
        acceleration: { min: 0.4, max: 0.7 },
        pauseBetweenActions: { min: 300, max: 800 },
        scrollPattern: 'careful',
        typingSpeed: { min: 40, max: 70 }
    }
};

class InteractionService {

    /**
     * Generate Bezier curve points for natural mouse movement
     */
    static generateBezierPath(start, end, complexity = 2) {
        const points = [];
        const distance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
        const steps = Math.max(10, Math.floor(distance / 20));
        
        // Generate control points for natural curves
        const controlPoints = [];
        for (let i = 0; i < complexity; i++) {
            const factor = (i + 1) / (complexity + 1);
            const deviation = (Math.random() - 0.5) * distance * 0.3;
            controlPoints.push({
                x: start.x + (end.x - start.x) * factor + deviation,
                y: start.y + (end.y - start.y) * factor + deviation
            });
        }
        
        // Calculate Bezier curve points
        for (let t = 0; t <= 1; t += 1/steps) {
            const point = this.calculateBezierPoint(t, [start, ...controlPoints, end]);
            points.push(point);
        }
        
        return points;
    }
    
    /**
     * Calculate point on Bezier curve
     */
    static calculateBezierPoint(t, points) {
        if (points.length === 1) return points[0];
        
        const newPoints = [];
        for (let i = 0; i < points.length - 1; i++) {
            newPoints.push({
                x: points[i].x + t * (points[i + 1].x - points[i].x),
                y: points[i].y + t * (points[i + 1].y - points[i].y)
            });
        }
        
        return this.calculateBezierPoint(t, newPoints);
    }

    /**
     * Enhanced mouse movement with Bezier curves and behavioral profiles
     */
    static async moveMouseNaturally(page, targetX, targetY, profile = 'natural') {
        const behavior = BEHAVIORAL_PROFILES[profile];
        const currentPos = await page.evaluate(() => ({ x: window.mouseX || 0, y: window.mouseY || 0 }));
        
        const path = this.generateBezierPath(currentPos, { x: targetX, y: targetY });
        const totalDuration = Math.random() * (behavior.mouseSpeed.max - behavior.mouseSpeed.min) + behavior.mouseSpeed.min;
        const stepDuration = totalDuration / path.length;
        
        for (let i = 0; i < path.length; i++) {
            const point = path[i];
            
            // Add micro-movements for realism
            const jitterX = (Math.random() - 0.5) * 2;
            const jitterY = (Math.random() - 0.5) * 2;
            
            await page.mouse.move(point.x + jitterX, point.y + jitterY);
            await page.evaluate((x, y) => {
                window.mouseX = x;
                window.mouseY = y;
            }, point.x, point.y);
            
            // Variable timing between movements
            const variation = (Math.random() - 0.5) * stepDuration * 0.3;
            await this.randomDelay(Math.max(5, stepDuration + variation));
        }
    }

    /**
     * Advanced typing simulation with keystroke dynamics
     */
    static async typeNaturally(page, selector, text, profile = 'natural') {
        const behavior = BEHAVIORAL_PROFILES[profile];
        
        // Clear existing text first
        await page.click(selector);
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Control');
        
        await this.randomDelay(100, 200);
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            // Realistic keystroke timing variations
            let keyDelay;
            if (char === ' ') {
                keyDelay = Math.random() * 100 + 150; // Longer pause for spaces
            } else if (char.match(/[A-Z]/)) {
                keyDelay = Math.random() * 80 + 120; // Slightly longer for capitals
            } else {
                keyDelay = Math.random() * (1000 / behavior.typingSpeed.max - 1000 / behavior.typingSpeed.min) + 1000 / behavior.typingSpeed.max;
            }
            
            // Simulate occasional hesitation or correction
            if (Math.random() < 0.05) { // 5% chance
                await this.randomDelay(300, 800); // Thinking pause
            }
            
            // Press and hold timing variation
            const holdTime = Math.random() * 50 + 20;
            await page.keyboard.down(char);
            await this.randomDelay(holdTime);
            await page.keyboard.up(char);
            
            await this.randomDelay(keyDelay);
        }
    }

    /**
     * Generate random delay with optional range
     */
    static async randomDelay(min = 100, max = null) {
        const delay = max ? Math.random() * (max - min) + min : min;
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Enhanced auto scroll with behavioral patterns
     */
    static async autoScroll(page, profile = 'natural', targetPercentage = 0.8) {
        const behavior = BEHAVIORAL_PROFILES[profile];
        
        try {
            await page.evaluate(async (scrollPattern, targetPct) => {
                await new Promise((resolve) => {
                    let currentPosition = 0;
                    let scrollAttempts = 0;
                    const maxScrollAttempts = 50;
                    
                    const getScrollDistance = () => {
                        switch (scrollPattern) {
                            case 'aggressive':
                                return Math.random() * 150 + 100; // 100-250px
                            case 'careful':
                                return Math.random() * 80 + 40;   // 40-120px
                            default: // smooth
                                return Math.random() * 120 + 80;  // 80-200px
                        }
                    };
                    
                    const getPauseTime = () => {
                        switch (scrollPattern) {
                            case 'aggressive':
                                return Math.random() * 200 + 100; // 100-300ms
                            case 'careful':
                                return Math.random() * 400 + 300; // 300-700ms
                            default: // smooth
                                return Math.random() * 300 + 200; // 200-500ms
                        }
                    };
                    
                    // Enhanced human-like scrolling with behavioral patterns
                    const humanScroll = () => {
                        const scrollHeight = document.body.scrollHeight;
                        const targetHeight = scrollHeight * targetPct;
                        
                        if (currentPosition >= targetHeight || scrollAttempts >= maxScrollAttempts) {
                            resolve();
                            return;
                        }
                        
                        const distance = getScrollDistance();
                        const startPos = window.pageYOffset;
                        const targetPos = Math.min(startPos + distance, targetHeight);
                        const duration = 150 + Math.random() * 100;
                        const startTime = performance.now();
                        
                        const scroll = (currentTime) => {
                            const elapsed = currentTime - startTime;
                            const progress = Math.min(elapsed / duration, 1);
                            
                            const easeOut = 1 - Math.pow(1 - progress, 2.5 + Math.random() * 0.5);
                            let currentPos = startPos + ((targetPos - startPos) * easeOut);
                            
                            if (Math.random() < 0.3) {
                                currentPos += (Math.random() - 0.5) * 5;
                            }
                            
                            window.scrollTo(0, currentPos);
                            
                            if (progress < 1) {
                                requestAnimationFrame(scroll);
                            } else {
                                currentPosition = currentPos;
                                scrollAttempts++;
                                
                                const baseReadingPause = getPauseTime();
                                const readingPause = Math.random() < 0.2 ? baseReadingPause * 2 : baseReadingPause;
                                
                                setTimeout(() => {
                                    if (Math.random() < 0.1) {
                                        const backScroll = Math.random() * 30 + 10;
                                        window.scrollTo(0, Math.max(0, currentPosition - backScroll));
                                        setTimeout(humanScroll, 500 + Math.random() * 500);
                                    } else {
                                        humanScroll();
                                    }
                                }, readingPause);
                            }
                        };
                        
                        requestAnimationFrame(scroll);
                    };
                    
                    humanScroll();
                });
            }, behavior.scrollPattern, targetPercentage);
            
            console.log('✅ Auto-scroll completed');
        } catch (error) {
            console.log('⚠️ Human-like auto scroll failed:', error.message);
        }
    }

    // Simulate realistic mouse movements and interactions
    static async simulateHumanBehavior(page) {
        try {
            console.log('🎭 Starting enhanced human behavior simulation...');
            
            // Step 1: Initial page assessment and realistic delays
            await page.waitForTimeout(500 + Math.random() * 1000); // 0.5-1.5s initial delay
            
            // Step 2: Enhanced mouse movement simulation
            await page.evaluate(() => {
                // Simulate realistic mouse movements with acceleration/deceleration
                const simulateRealisticMovement = (startX, startY, endX, endY, duration) => {
                    const steps = Math.floor(duration / 16); // 60fps
                    const movements = [];
                    
                    for (let i = 0; i <= steps; i++) {
                        const progress = i / steps;
                        // Ease-in-out curve for realistic acceleration
                        const easeProgress = progress < 0.5 
                            ? 2 * progress * progress 
                            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                        
                        const x = startX + (endX - startX) * easeProgress;
                        const y = startY + (endY - startY) * easeProgress;
                        
                        // Add slight randomness for human-like imperfection
                        const jitterX = (Math.random() - 0.5) * 2;
                        const jitterY = (Math.random() - 0.5) * 2;
                        
                        movements.push({
                            x: Math.round(x + jitterX),
                            y: Math.round(y + jitterY),
                            delay: i * 16
                        });
                    }
                    return movements;
                };
                
                // Generate 3-7 realistic mouse movements
                const moveCount = 3 + Math.floor(Math.random() * 5);
                let currentX = Math.floor(Math.random() * window.innerWidth);
                let currentY = Math.floor(Math.random() * window.innerHeight);
                
                const allMovements = [];
                let totalDelay = 0;
                
                for (let i = 0; i < moveCount; i++) {
                    const targetX = Math.floor(Math.random() * window.innerWidth);
                    const targetY = Math.floor(Math.random() * window.innerHeight);
                    const duration = 200 + Math.random() * 300; // 200-500ms per movement
                    
                    const movements = simulateRealisticMovement(currentX, currentY, targetX, targetY, duration);
                    movements.forEach(move => {
                        allMovements.push({
                            ...move,
                            delay: totalDelay + move.delay
                        });
                    });
                    
                    totalDelay += duration + 100 + Math.random() * 200; // Pause between movements
                    currentX = targetX;
                    currentY = targetY;
                }
                
                // Execute all movements
                allMovements.forEach((move) => {
                    setTimeout(() => {
                        const event = new MouseEvent('mousemove', {
                            clientX: move.x,
                            clientY: move.y,
                            bubbles: true,
                            cancelable: true,
                            view: window
                        });
                        document.dispatchEvent(event);
                    }, move.delay);
                });
                
                return totalDelay + 2000; // Return total simulation time
            });
            
            // Step 3: Wait for the simulation to complete
            await page.waitForTimeout(3000);
            
            // Step 4: Additional realistic behaviors
            await page.evaluate(() => {
                // Simulate keyboard activity (without actual typing)
                if (Math.random() > 0.8) {
                    const keyEvents = ['keydown', 'keyup'];
                    const keys = ['Tab', 'Shift', 'Control', 'Alt'];
                    const key = keys[Math.floor(Math.random() * keys.length)];
                    
                    keyEvents.forEach((eventType, index) => {
                        setTimeout(() => {
                            const keyEvent = new KeyboardEvent(eventType, {
                                key: key,
                                bubbles: true,
                                cancelable: true
                            });
                            document.dispatchEvent(keyEvent);
                        }, index * 50);
                    });
                }
                
                // Simulate window focus/blur
                setTimeout(() => {
                    window.dispatchEvent(new Event('blur'));
                    setTimeout(() => {
                        window.dispatchEvent(new Event('focus'));
                    }, 100 + Math.random() * 200);
                }, 1000);
            });
            
            // Step 5: Final wait and page interaction check
            await page.waitForTimeout(1000 + Math.random() * 500);
            
            console.log('✅ Enhanced human behavior simulation completed');
            
        } catch (error) {
            console.log('⚠️ Human behavior simulation failed:', error.message);
            // Fallback: simple mouse movement
            try {
                await page.mouse.move(
                    Math.random() * 800,
                    Math.random() * 600
                );
                await page.waitForTimeout(500);
            } catch (fallbackError) {
                console.log('⚠️ Fallback behavior simulation also failed');
            }
        }
    }

    // Force desktop CSS and layout
    static async forceDesktopLayout(page) {
        try {
            await page.evaluate(async () => {
                console.log('Starting desktop CSS forcing...');
                
                // Force desktop viewport
                const viewport = window.innerWidth;
                console.log(`Desktop viewport: ${viewport}px`);
                
                // Inject desktop-forcing CSS
                const desktopCSS = document.createElement('style');
                desktopCSS.textContent = `
                    body, html { min-width: 1920px !important; width: 100% !important; }
                    .mobile-only, .mobile, [class*="mobile"] { display: none !important; }
                    .desktop-only, .desktop, [class*="desktop"] { display: block !important; }
                    @media (max-width: 768px) { * { display: none !important; } }
                `;
                document.head.appendChild(desktopCSS);
                
                // Wait for fonts and CSS
                if (document.fonts && document.fonts.ready) {
                    await document.fonts.ready;
                }
                
                // Force layout recalculation
                document.body.offsetHeight;
                
                console.log('Desktop CSS forcing completed');
            });
        } catch (error) {
            console.log('⚠️ Desktop CSS forcing failed:', error.message);
        }
    }

    // Wait for JavaScript frameworks to initialize
    static async waitForJavaScriptFrameworks(page) {
        try {
            await page.evaluate(async () => {
                // Wait for common JavaScript frameworks to initialize
                const checkFrameworks = () => {
                    return new Promise((resolve) => {
                        let checksCompleted = 0;
                        const totalChecks = 5;
                        
                        const completeCheck = () => {
                            checksCompleted++;
                            if (checksCompleted >= totalChecks) {
                                resolve();
                            }
                        };
                        
                        // Check for jQuery
                        if (window.jQuery) {
                            window.jQuery(document).ready(() => completeCheck());
                        } else {
                            completeCheck();
                        }
                        
                        // Check for React
                        setTimeout(() => {
                            if (window.React || document.querySelector('[data-reactroot]')) {
                                // Wait a bit more for React to render
                                setTimeout(completeCheck, 500);
                            } else {
                                completeCheck();
                            }
                        }, 100);
                        
                        // Check for Vue
                        setTimeout(() => {
                            if (window.Vue || document.querySelector('[data-server-rendered]')) {
                                setTimeout(completeCheck, 500);
                            } else {
                                completeCheck();
                            }
                        }, 100);
                        
                        // Check for Angular
                        setTimeout(() => {
                            if (window.ng || document.querySelector('[ng-app]') || document.querySelector('[data-ng-app]')) {
                                setTimeout(completeCheck, 500);
                            } else {
                                completeCheck();
                            }
                        }, 100);
                        
                        // General timeout
                        setTimeout(completeCheck, 2000);
                    });
                };
                
                await checkFrameworks();
            });
        } catch (error) {
            console.log('⚠️ JavaScript framework check failed:', error.message);
        }
    }

    // Wait for specific selectors with timeout
    static async waitForSelectors(page, selectors = [], timeout = 30000) {
        if (selectors.length === 0) return;
        
        console.log(`⏳ Waiting for selectors: ${selectors.join(', ')}`);
        for (const selector of selectors) {
            try {
                await page.waitForSelector(selector, { timeout });
                console.log(`✅ Found selector: ${selector}`);
            } catch (e) {
                console.log(`⚠️ Selector not found: ${selector}`);
            }
        }
    }

    // Click elements if specified
    static async clickElements(page, selectors = [], timeout = 20000) {
        if (selectors.length === 0) return;
        
        console.log(`🖱️ Clicking elements: ${selectors.join(', ')}`);
        for (const selector of selectors) {
            try {
                await page.click(selector, { timeout });
                await page.waitForTimeout(2000);
                console.log(`✅ Clicked: ${selector}`);
            } catch (e) {
                console.log(`⚠️ Could not click: ${selector}`);
            }
        }
    }

    // Remove unwanted elements
    static async removeElements(page, selectors = []) {
        if (selectors.length === 0) return;
        
        console.log(`🗑️ Removing elements: ${selectors.join(', ')}`);
        for (const selector of selectors) {
            try {
                await page.evaluate((sel) => {
                    const elements = document.querySelectorAll(sel);
                    elements.forEach(el => el.remove());
                }, selector);
            } catch (e) {
                console.log(`⚠️ Could not remove elements: ${selector}`);
            }
        }
    }
}

module.exports = InteractionService;