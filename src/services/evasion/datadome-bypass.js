/**
 * DataDome Protection Bypass v1.3.0
 * Advanced techniques to bypass DataDome bot detection and anti-fraud systems
 */

const { logger } = require('../../utils/logger');

class DataDomeBypass {
    constructor(browserService) {
        this.browserService = browserService;
        this.datadomeSignatures = [
            'datadome',
            'dd_',
            'challenge.datadome.co',
            'js.datadome.co',
            'cap.datadome.co'
        ];
    }

    /**
   * Apply DataDome-specific bypasses
   */
    async applyBypasses(context, options = {}) {
        try {
            const page = context.pages()[0] || await context.newPage();

            // Block DataDome scripts and beacons
            await this.blockDataDomeResources(context);

            // Override DataDome detection methods
            await this.setupDetectionOverrides(page);

            // Apply behavioral pattern bypasses
            await this.setupBehavioralBypasses(page);

            // Setup mouse movement patterns
            await this.setupMousePatterns(page);

            logger.info('DataDome bypass techniques applied');
            return true;
        } catch (error) {
            logger.error('Failed to apply DataDome bypasses:', error);
            return false;
        }
    }

    /**
   * Block DataDome tracking resources
   */
    async blockDataDomeResources(context) {
        await context.route('**/*', (route) => {
            const url = route.request().url();

            // Block DataDome domains and signatures
            const shouldBlock = this.datadomeSignatures.some(signature =>
                url.includes(signature)
            );

            if (shouldBlock) {
                logger.debug(`Blocking DataDome resource: ${url}`);
                route.abort();
                return;
            }

            // Continue with modified headers
            const headers = route.request().headers();

            // Remove DataDome-related headers
            delete headers['x-datadome-clientid'];
            delete headers['x-datadome-cid'];
            delete headers['x-datadome-sid'];

            route.continue({ headers });
        });
    }

    /**
   * Setup detection method overrides
   */
    async setupDetectionOverrides(page) {
        await page.addInitScript(() => {
            // Override DataDome's automation detection
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false,
                configurable: true
            });

            // Block DataDome's window.external checks
            if (window.external && window.external.toString) {
                window.external = undefined;
            }

            // Override automation-related properties
            Object.defineProperty(window, 'chrome', {
                get: () => ({
                    runtime: {},
                    loadTimes: function() {},
                    csi: function() {},
                    app: {}
                }),
                configurable: true
            });

            // Override permissions API to avoid suspicion
            if (navigator.permissions) {
                const originalQuery = navigator.permissions.query;
                navigator.permissions.query = function(parameters) {
                    return Promise.resolve({
                        state: 'denied',
                        addEventListener: function() {},
                        removeEventListener: function() {}
                    });
                };
            }

            // Override WebGL debugging extensions
            const getExtension = WebGLRenderingContext.prototype.getExtension;
            WebGLRenderingContext.prototype.getExtension = function(name) {
                if (name === 'WEBGL_debug_renderer_info') {
                    return {
                        UNMASKED_VENDOR_WEBGL: 37445,
                        UNMASKED_RENDERER_WEBGL: 37446
                    };
                }
                return getExtension.call(this, name);
            };

            // Override mouse event properties
            const originalMouseEvent = window.MouseEvent;
            window.MouseEvent = function(type, eventInitDict) {
                if (eventInitDict) {
                    // Add natural variation to coordinates
                    if (typeof eventInitDict.clientX === 'number') {
                        eventInitDict.clientX += (Math.random() - 0.5) * 0.1;
                    }
                    if (typeof eventInitDict.clientY === 'number') {
                        eventInitDict.clientY += (Math.random() - 0.5) * 0.1;
                    }
                }
                return new originalMouseEvent(type, eventInitDict);
            };
        });
    }

    /**
   * Setup behavioral pattern bypasses
   */
    async setupBehavioralBypasses(page) {
        await page.addInitScript(() => {
            // Override timing functions to add natural variance
            const originalGetTime = Date.prototype.getTime;
            Date.prototype.getTime = function() {
                return originalGetTime.call(this) + Math.floor((Math.random() - 0.5) * 2);
            };

            // Override performance.now() with realistic jitter
            const originalNow = performance.now;
            performance.now = function() {
                return originalNow.call(this) + (Math.random() - 0.5) * 0.5;
            };

            // Add natural variance to setTimeout/setInterval
            const originalSetTimeout = window.setTimeout;
            window.setTimeout = function(callback, delay, ...args) {
                const variance = delay * 0.05 * (Math.random() - 0.5);
                return originalSetTimeout.call(this, callback, delay + variance, ...args);
            };

            const originalSetInterval = window.setInterval;
            window.setInterval = function(callback, delay, ...args) {
                const variance = delay * 0.02 * (Math.random() - 0.5);
                return originalSetInterval.call(this, callback, delay + variance, ...args);
            };

            // Override requestAnimationFrame for smooth animations
            const originalRAF = window.requestAnimationFrame;
            window.requestAnimationFrame = function(callback) {
                return originalRAF.call(this, function(timestamp) {
                    // Add micro-jitter to animation timestamps
                    const jitteredTimestamp = timestamp + (Math.random() - 0.5) * 0.1;
                    callback(jitteredTimestamp);
                });
            };
        });
    }

    /**
   * Setup mouse movement patterns
   */
    async setupMousePatterns(page) {
        await page.addInitScript(() => {
            let mouseTrajectory = [];
            let lastMouseMove = Date.now();

            // Track mouse movements with natural patterns
            const originalDispatchEvent = EventTarget.prototype.dispatchEvent;
            EventTarget.prototype.dispatchEvent = function(event) {
                if (event.type === 'mousemove') {
                    const now = Date.now();
                    const timeDelta = now - lastMouseMove;

                    // Add to trajectory with timing information
                    mouseTrajectory.push({
                        x: event.clientX,
                        y: event.clientY,
                        timestamp: now,
                        timeDelta
                    });

                    // Keep trajectory manageable
                    if (mouseTrajectory.length > 50) {
                        mouseTrajectory = mouseTrajectory.slice(-25);
                    }

                    lastMouseMove = now;
                }

                return originalDispatchEvent.call(this, event);
            };

            // Override mouse event creation
            const createMouseEvent = (type, properties) => {
                const event = new MouseEvent(type, {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    ...properties
                });

                // Add natural movement patterns
                if (mouseTrajectory.length > 1) {
                    const lastMove = mouseTrajectory[mouseTrajectory.length - 1];
                    const prevMove = mouseTrajectory[mouseTrajectory.length - 2];

                    // Calculate movement velocity and acceleration
                    const velocity = Math.sqrt(
                        Math.pow(lastMove.x - prevMove.x, 2) +
            Math.pow(lastMove.y - prevMove.y, 2)
                    ) / (lastMove.timeDelta || 1);

                    // Ensure realistic movement patterns
                    if (velocity > 5) { // Reasonable maximum velocity
                        event.__isNatural = true;
                    }
                }

                return event;
            };

            // Store original for legitimate use
            window.__createNaturalMouseEvent = createMouseEvent;
        });
    }

    /**
   * Apply keyboard pattern bypasses
   */
    async setupKeyboardPatterns(page) {
        await page.addInitScript(() => {
            let keyPressTimings = [];

            // Track keyboard timings
            const originalKeyDown = document.addEventListener;
            document.addEventListener = function(type, listener, options) {
                if (type === 'keydown' || type === 'keyup') {
                    const wrappedListener = function(event) {
                        keyPressTimings.push({
                            key: event.key,
                            type: event.type,
                            timestamp: Date.now(),
                            duration: Math.random() * 50 + 50 // 50-100ms key press
                        });

                        // Keep timing history manageable
                        if (keyPressTimings.length > 100) {
                            keyPressTimings = keyPressTimings.slice(-50);
                        }

                        listener.call(this, event);
                    };
                    return originalKeyDown.call(this, type, wrappedListener, options);
                }
                return originalKeyDown.call(this, type, listener, options);
            };
        });
    }

    /**
   * Detect DataDome challenge pages
   */
    async detectDataDomeChallenge(page) {
        try {
            return await page.evaluate(() => {
                // Check for DataDome challenge indicators
                return !!(
                    document.querySelector('[data-dd]') ||
          document.querySelector('.dd-challenge') ||
          window.DD_RUM ||
          window.dataDomeOptions ||
          document.documentElement.innerHTML.includes('datadome') ||
          document.documentElement.innerHTML.includes('DataDome')
                );
            });
        } catch (error) {
            logger.warn('Error detecting DataDome challenge:', error.message);
            return false;
        }
    }

    /**
   * Handle DataDome challenge if present
   */
    async handleChallenge(page) {
        try {
            const challengePresent = await this.detectDataDomeChallenge(page);

            if (challengePresent) {
                logger.info('DataDome challenge detected');

                // Wait for potential redirect or challenge completion
                await page.waitForLoadState('networkidle', { timeout: 15000 });

                // Check if challenge was resolved
                const stillChallenged = await this.detectDataDomeChallenge(page);
                if (!stillChallenged) {
                    logger.info('DataDome challenge resolved');
                    return true;
                }

                logger.warn('DataDome challenge persists');
                return false;
            }

            return true;
        } catch (error) {
            logger.warn('DataDome challenge handling error:', error.message);
            return false;
        }
    }

    /**
   * Apply cookie and storage bypasses
   */
    async setupStorageBypasses(context) {
        const page = context.pages()[0] || await context.newPage();

        await page.addInitScript(() => {
            // Override localStorage to prevent DataDome tracking
            const originalSetItem = Storage.prototype.setItem;
            Storage.prototype.setItem = function(key, value) {
                if (key.includes('datadome') || key.includes('dd_')) {
                    return; // Block DataDome storage
                }
                return originalSetItem.call(this, key, value);
            };

            const originalGetItem = Storage.prototype.getItem;
            Storage.prototype.getItem = function(key) {
                if (key.includes('datadome') || key.includes('dd_')) {
                    return null; // Return null for DataDome keys
                }
                return originalGetItem.call(this, key);
            };

            // Override sessionStorage similarly
            const originalSessionSetItem = sessionStorage.setItem;
            sessionStorage.setItem = function(key, value) {
                if (key.includes('datadome') || key.includes('dd_')) {
                    return;
                }
                return originalSessionSetItem.call(this, key, value);
            };
        });
    }
}

module.exports = { DataDomeBypass };
