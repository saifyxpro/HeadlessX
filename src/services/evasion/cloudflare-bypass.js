/**
 * Cloudflare Protection Bypass v1.3.0
 * Advanced techniques to bypass Cloudflare Bot Management, DDoS protection, and WAF
 */

const { logger } = require('../../utils/logger');

class CloudflareBypass {
    constructor(browserService) {
        this.browserService = browserService;
        this.challengeTimeout = 10000;
    }

    /**
   * Apply Cloudflare-specific bypasses
   */
    async applyBypasses(context, options = {}) {
        try {
            const page = context.pages()[0] || await context.newPage();

            // Apply JS challenge bypasses
            await this.setupJSChallengeBypass(page);

            // Apply TLS fingerprint bypass
            await this.setupTLSBypass(context);

            // Apply HTTP/2 fingerprint bypass
            await this.setupHTTP2Bypass(context);

            // Apply timing bypasses
            await this.setupTimingBypasses(page);

            logger.info('Cloudflare bypass techniques applied');
            return true;
        } catch (error) {
            logger.error('Failed to apply Cloudflare bypasses:', error);
            return false;
        }
    }

    /**
   * Setup JavaScript challenge bypass
   */
    async setupJSChallengeBypass(page) {
        await page.addInitScript(() => {
            // Override WebGL debugging info to avoid detection
            const getParameter = WebGLRenderingContext.prototype.getParameter;
            WebGLRenderingContext.prototype.getParameter = function(parameter) {
                if (parameter === 37446) { // UNMASKED_VENDOR_WEBGL
                    return 'Intel Inc.';
                }
                if (parameter === 37445) { // UNMASKED_RENDERER_WEBGL
                    return 'Intel(R) HD Graphics 620';
                }
                return getParameter.call(this, parameter);
            };

            // Override performance.now() to add jitter
            const originalNow = performance.now;
            performance.now = function() {
                return originalNow.call(this) + (Math.random() - 0.5) * 0.1;
            };

            // Override Date.now() for consistency
            const originalDateNow = Date.now;
            Date.now = function() {
                return originalDateNow.call(this) + Math.floor((Math.random() - 0.5) * 2);
            };

            // Override Notification API
            if (window.Notification) {
                Object.defineProperty(Notification, 'permission', {
                    get: () => 'denied'
                });
            }

            // Override battery API
            if (navigator.getBattery) {
                navigator.getBattery = undefined;
            }
        });
    }

    /**
   * Setup TLS fingerprint bypass
   */
    async setupTLSBypass(context) {
    // Cloudflare analyzes TLS handshake patterns
    // This is handled at the browser level through Playwright's configuration
        await context.route('**/*', (route) => {
            const headers = route.request().headers();

            // Ensure proper header order for Chrome
            const orderedHeaders = {
                ':authority': headers[':authority'] || headers.host,
                ':method': headers[':method'] || 'GET',
                ':path': headers[':path'] || '/',
                ':scheme': headers[':scheme'] || 'https',
                accept: headers.accept || 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'accept-encoding': headers['accept-encoding'] || 'gzip, deflate, br',
                'accept-language': headers['accept-language'] || 'en-US,en;q=0.9',
                'cache-control': headers['cache-control'] || 'no-cache',
                pragma: headers.pragma || 'no-cache',
                'sec-ch-ua': headers['sec-ch-ua'] || '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'sec-ch-ua-mobile': headers['sec-ch-ua-mobile'] || '?0',
                'sec-ch-ua-platform': headers['sec-ch-ua-platform'] || '"Windows"',
                'sec-fetch-dest': headers['sec-fetch-dest'] || 'document',
                'sec-fetch-mode': headers['sec-fetch-mode'] || 'navigate',
                'sec-fetch-site': headers['sec-fetch-site'] || 'none',
                'sec-fetch-user': headers['sec-fetch-user'] || '?1',
                'upgrade-insecure-requests': headers['upgrade-insecure-requests'] || '1',
                'user-agent': headers['user-agent']
            };

            // Remove undefined headers
            Object.keys(orderedHeaders).forEach(key => {
                if (!orderedHeaders[key]) delete orderedHeaders[key];
            });

            route.continue({ headers: orderedHeaders });
        });
    }

    /**
   * Setup HTTP/2 bypass
   */
    async setupHTTP2Bypass(context) {
    // Ensure proper HTTP/2 stream prioritization
        await context.addInitScript(() => {
            // Override fetch to ensure proper stream priorities
            const originalFetch = window.fetch;
            window.fetch = function(...args) {
                const request = new Request(...args);

                // Add proper priorities for resources
                if (request.url.match(/\.(css|js)$/)) {
                    request.priority = 'high';
                } else if (request.url.match(/\.(png|jpg|jpeg|gif|webp)$/)) {
                    request.priority = 'low';
                }

                return originalFetch.call(this, request);
            };
        });
    }

    /**
   * Setup timing-based bypasses
   */
    async setupTimingBypasses(page) {
        await page.addInitScript(() => {
            // Add realistic delays to match human behavior
            const originalAddEventListener = EventTarget.prototype.addEventListener;
            EventTarget.prototype.addEventListener = function(type, listener, options) {
                if (type === 'mousemove' || type === 'click' || type === 'keydown') {
                    const wrappedListener = function(event) {
                        // Add micro-delays to events
                        setTimeout(() => listener.call(this, event), Math.random() * 2);
                    };
                    return originalAddEventListener.call(this, type, wrappedListener, options);
                }
                return originalAddEventListener.call(this, type, listener, options);
            };

            // Override setTimeout for consistency
            const originalSetTimeout = window.setTimeout;
            window.setTimeout = function(callback, delay, ...args) {
                const jitteredDelay = delay + (Math.random() - 0.5) * Math.min(delay * 0.1, 10);
                return originalSetTimeout.call(this, callback, jitteredDelay, ...args);
            };
        });
    }

    /**
   * Detect and handle Cloudflare challenge pages
   */
    async handleChallenge(page) {
        try {
            // Wait for potential challenge
            await page.waitForLoadState('networkidle', { timeout: this.challengeTimeout });

            // Check for Cloudflare challenge indicators
            const challengePresent = await page.evaluate(() => {
                return !!(
                    document.querySelector('[data-ray]') ||
          document.querySelector('#challenge-form') ||
          document.querySelector('.cf-browser-verification') ||
          document.title.includes('Just a moment') ||
          window.location.href.includes('/cdn-cgi/challenge-platform/')
                );
            });

            if (challengePresent) {
                logger.info('Cloudflare challenge detected, waiting for resolution');

                // Wait for challenge to complete
                await page.waitForFunction(() => {
                    return !!(
                        document.readyState === 'complete' &&
            !document.querySelector('[data-ray]') &&
            !document.querySelector('#challenge-form') &&
            !document.querySelector('.cf-browser-verification')
                    );
                }, { timeout: 30000 });

                logger.info('Cloudflare challenge resolved');
            }

            return true;
        } catch (error) {
            logger.warn('Challenge handling timeout or error:', error.message);
            return false;
        }
    }

    /**
   * Apply user agent consistency fixes
   */
    async applyUserAgentFixes(context, userAgent) {
        await context.addInitScript((ua) => {
            // Ensure navigator.userAgent matches header
            Object.defineProperty(navigator, 'userAgent', {
                get: () => ua,
                configurable: true
            });

            // Update related properties for consistency
            const chromeMatch = ua.match(/Chrome\/(\d+)/);
            if (chromeMatch) {
                Object.defineProperty(navigator, 'appVersion', {
                    get: () => ua.substring(ua.indexOf('/') + 1),
                    configurable: true
                });
            }
        }, userAgent);
    }

    /**
   * Apply canvas fingerprint consistency
   */
    async applyCanvasConsistency(context) {
        await context.addInitScript(() => {
            // Ensure canvas fingerprint is consistent across requests
            const canvasCache = new Map();

            const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
            HTMLCanvasElement.prototype.toDataURL = function(...args) {
                const key = this.width + 'x' + this.height + args.join('');

                if (!canvasCache.has(key)) {
                    const result = originalToDataURL.apply(this, args);
                    canvasCache.set(key, result);
                    return result;
                }

                return canvasCache.get(key);
            };
        });
    }
}

module.exports = { CloudflareBypass };
