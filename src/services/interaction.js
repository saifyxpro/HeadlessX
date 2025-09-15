/**
 * Page Interaction Service
 * Handles human-like interactions, scrolling, and behavior simulation
 */

class InteractionService {
    
    // Realistic auto scroll function with human-like behavior
    static async autoScroll(page) {
        try {
            await page.evaluate(async () => {
                await new Promise((resolve) => {
                    let totalHeight = 0;
                    let currentPosition = 0;
                    let scrollAttempts = 0;
                    const maxScrollAttempts = 50;
                    
                    // Human-like scrolling with variable speeds and pauses
                    const humanScroll = () => {
                        const scrollHeight = document.body.scrollHeight;
                        
                        // Variable scroll distance (humans don't scroll perfectly)
                        const baseDistance = 100;
                        const variation = Math.random() * 50 - 25; // -25 to +25
                        const distance = Math.max(50, baseDistance + variation);
                        
                        // Scroll with easing (like mouse wheel)
                        const startPos = window.pageYOffset;
                        const targetPos = startPos + distance;
                        const duration = 150 + Math.random() * 100; // 150-250ms
                        const startTime = performance.now();
                        
                        const scroll = (currentTime) => {
                            const elapsed = currentTime - startTime;
                            const progress = Math.min(elapsed / duration, 1);
                            
                            // Easing function (ease-out)
                            const easeOut = 1 - Math.pow(1 - progress, 3);
                            const currentPos = startPos + (distance * easeOut);
                            
                            window.scrollTo(0, currentPos);
                            
                            if (progress < 1) {
                                requestAnimationFrame(scroll);
                            } else {
                                totalHeight = currentPos;
                                currentPosition = currentPos;
                                scrollAttempts++;
                                
                                // Human-like pause between scrolls
                                const pauseTime = 200 + Math.random() * 300; // 200-500ms
                                setTimeout(() => {
                                    if (currentPosition >= scrollHeight - window.innerHeight - 100 || 
                                        scrollAttempts >= maxScrollAttempts) {
                                        resolve();
                                    } else {
                                        humanScroll();
                                    }
                                }, pauseTime);
                            }
                        };
                        
                        requestAnimationFrame(scroll);
                    };
                    
                    // Start scrolling
                    humanScroll();
                    
                    // Safety timeout
                    setTimeout(() => {
                        resolve();
                    }, 15000);
                });
            });
            
            // Human-like pause before scrolling back to top
            await page.waitForTimeout(500 + Math.random() * 1000);
            
            // Scroll back to top with animation
            await page.evaluate(() => {
                const startPos = window.pageYOffset;
                const duration = 800;
                const startTime = performance.now();
                
                const scrollToTop = (currentTime) => {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // Smooth scroll to top
                    const easeInOut = progress < 0.5 
                        ? 2 * progress * progress 
                        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                        
                    const currentPos = startPos * (1 - easeInOut);
                    window.scrollTo(0, currentPos);
                    
                    if (progress < 1) {
                        requestAnimationFrame(scrollToTop);
                    }
                };
                
                requestAnimationFrame(scrollToTop);
            });
            
            // Wait for scroll animation to complete
            await page.waitForTimeout(1000);
            
            // Final pause for any lazy-loaded content
            await page.waitForTimeout(1500 + Math.random() * 1000);
            
            console.log('✅ Auto-scroll completed');
        } catch (error) {
            console.log('⚠️ Human-like auto scroll failed:', error.message);
            // Don't throw error, just log it
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