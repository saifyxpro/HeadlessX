/**
 * Page Rendering Service
 * Advanced page rendering with timeout handling and anti-bot detection
 */

const config = require('../config');
const browserService = require('./browser');
const StealthService = require('./stealth');
const InteractionService = require('./interaction');
const { withTimeoutFallback } = require('../utils/helpers');
const { logger, generateRequestId } = require('../utils/logger');
const { HeadlessXError, ERROR_CATEGORIES, handleError } = require('../utils/errors');

class RenderingService {
    /**
     * Enhanced page rendering function with v1.3.0 anti-detection features
     */
    static async renderPageAdvanced(options) {
        const {
            url,
            waitUntil = 'networkidle',
            timeout = config.browser.timeout,
            extraWaitTime = config.browser.extraWaitTime,
            userAgent,
            cookies = [],
            headers = {},
            viewport = { width: 1920, height: 1080 },
            scrollToBottom = true,
            waitForSelectors = [],
            clickSelectors = [],
            removeElements = [],
            customScript = null,
            waitForNetworkIdle = true,
            captureConsole = false,
            returnPartialOnTimeout = config.api.defaultReturnPartialOnTimeout,
            fullPage = false,
            generatePDF = false,

            // v1.3.0 Enhanced Anti-Detection Options
            deviceProfile = 'mid-range-desktop',
            geoProfile = 'us-east',
            behaviorProfile = 'natural',
            enableCanvasSpoofing = true,
            enableWebGLSpoofing = true,
            enableAudioSpoofing = true,
            enableWebRTCBlocking = true,
            enableAdvancedStealth = true,
            simulateMouseMovement = true,
            simulateScrolling = true,
            simulateTyping = false,
            humanDelays = true,
            randomizeTimings = true
        } = options;

        const requestId = generateRequestId();
        const browser = await browserService.getBrowser();
        let context = null;
        let page = null;
        const consoleLogs = [];
        let wasTimeout = false;

        try {
            logger.info(requestId, `Starting v1.3.0 enhanced rendering: ${url} [${deviceProfile}/${geoProfile}/${behaviorProfile}]`);

            // Enhanced context creation with device profiles
            const contextOptions = {
                userAgent,
                headers,
                viewport,
                deviceProfile,
                geoProfile
            };

            // Add custom cookies to context options
            if (cookies.length > 0) {
                contextOptions.cookies = cookies;
            }

            logger.debug(requestId, 'Creating enhanced v1.3.0 context', {
                deviceProfile,
                geoProfile,
                userAgent: (userAgent || 'default').substring(0, 80) + '...'
            });

            // Create enhanced stealth context with v1.3.0 features
            context = await browserService.createIsolatedContext(browser, contextOptions);

            // Setup Google consent cookies
            await StealthService.setupGoogleCookies(context, url);

            // Add custom cookies if provided
            if (cookies.length > 0) {
                await context.addCookies(cookies);
            }

            // Create page with enhanced stealth
            page = await context.newPage();

            // Setup request interception for perfect headers
            await StealthService.setupRequestInterception(page);

            // Set reasonable timeouts (more generous for Google and slow sites)
            page.setDefaultTimeout(90000); // Increased from 75s to 90s for Google
            page.setDefaultNavigationTimeout(Math.min(timeout + 15000, 90000)); // Add 15s buffer

            // Capture console logs if requested
            if (captureConsole) {
                page.on('console', msg => {
                    consoleLogs.push({
                        type: msg.type(),
                        text: msg.text(),
                        location: msg.location()
                    });
                });
            }

            // Add stealth script
            await context.addInitScript(StealthService.getStealthScript());

            logger.info(requestId, `Navigating to: ${url}`);

            // Enhanced navigation with Google-specific handling
            await withTimeoutFallback(
                async() => {
                    const isGoogle = url.includes('google.');
                    try {
                        if (isGoogle) {
                            // Special Google navigation strategy
                            logger.info(requestId, 'Using Google-optimized navigation strategy');

                            // First, navigate with minimal timeout but allow for longer waits
                            await page.goto(url, {
                                waitUntil: 'domcontentloaded',
                                timeout: 40000 // Increased from 30s
                            });

                            // Longer wait for any redirects or anti-bot checks
                            await page.waitForTimeout(5000); // Increased from 2s

                            // Check for anti-bot detection
                            const bodyText = await page.evaluate(() => {
                                return document.body ? document.body.innerText.slice(0, 2000) : '';
                            });

                            if (/unusual traffic|automated queries|are you a robot|captcha/i.test(bodyText)) {
                                logger.warn(requestId, 'Google anti-bot detection triggered, using enhanced evasion...');
                                
                                // Enhanced wait and retry strategy
                                await page.waitForTimeout(15000); // Longer wait
                                
                                // Check if we can proceed anyway or need to refresh
                                const stillBlocked = await page.evaluate(() => {
                                    return /unusual traffic|automated queries|are you a robot/i.test(document.body ? document.body.innerText : '');
                                });
                                
                                if (stillBlocked) {
                                    // Try to refresh with a different approach
                                    logger.warn(requestId, 'Still detected, attempting page refresh...');
                                    await page.reload({ waitUntil: 'networkidle2', timeout: 45000 });
                                    await page.waitForTimeout(8000); // Wait longer after refresh
                                    
                                    // If still blocked, we'll continue but may get timeout error
                                    const finalCheck = await page.evaluate(() => {
                                        return /unusual traffic|automated queries|are you a robot/i.test(document.body ? document.body.innerText : '');
                                    });
                                    
                                    if (finalCheck) {
                                        logger.error(requestId, 'Google anti-bot detection persists after refresh');
                                        // Don't throw error here - let it timeout naturally
                                    }
                                } else {
                                    logger.info(requestId, 'Google anti-bot detection resolved');
                                }
                            }

                            // Handle Google consent if present
                            await StealthService.handleGoogleConsent(page);

                            // Wait for content to stabilize
                            await page.waitForTimeout(3000); // Slightly longer wait
                            logger.info(requestId, 'Google navigation completed successfully');
                        } else {
                            // Standard navigation for non-Google sites with better timeout handling
                            try {
                                // First try with networkidle2 which is more reliable than networkidle0
                                await page.goto(url, {
                                    waitUntil: 'networkidle2',
                                    timeout: Math.min(timeout * 0.7, 50000) // Increased timeout allocation
                                });
                                logger.info(requestId, 'Standard navigation completed (networkidle2)');
                            } catch (networkIdleError) {
                                logger.warn(requestId, 'NetworkIdle2 failed, trying domcontentloaded...');
                                await page.goto(url, {
                                    waitUntil: 'domcontentloaded',
                                    timeout: Math.min(timeout * 0.5, 35000)
                                });
                                logger.info(requestId, 'Standard navigation completed (domcontentloaded)');
                            }
                        }
                    } catch (navError) {
                        logger.warn(requestId, `Primary navigation failed (${navError.message.slice(0, 100)}), trying fallback...`);
                        try {
                            await page.goto(url, {
                                waitUntil: 'domcontentloaded',
                                timeout: Math.min(timeout * 0.4, 30000) // Slightly longer fallback
                            });
                        } catch (domError) {
                            // Last resort: try with just load event
                            logger.warn(requestId, 'DOMContentLoaded failed, trying basic load...');
                            await page.goto(url, {
                                waitUntil: 'load',
                                timeout: Math.min(timeout * 0.3, 25000) // Increased from 20s
                            });
                        }
                        if (isGoogle) {
                            await StealthService.handleGoogleConsent(page);
                        }
                        logger.info(requestId, 'Page navigation completed (fallback)');
                    }

                    // Wait for page to load
                    await page.waitForTimeout(Math.max(extraWaitTime, 5000));

                    logger.info(requestId, 'Page loaded successfully');
                },
                returnPartialOnTimeout
                    ? async() => {
                        wasTimeout = true;
                        logger.warn(requestId, 'Navigation timeout - trying quick reload...');
                        try {
                            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
                            await page.waitForTimeout(1000);
                        } catch (e) {
                            logger.warn(requestId, 'Quick reload failed, proceeding with partial content');
                        }
                    }
                    : null,
                Math.min(timeout, 60000) // Increased from 45s to 60s to match helper default
            ); // Enhanced CSS and resource loading wait with v1.3.0 advanced stealth
            logger.info(requestId, 'Applying v1.3.0 advanced stealth and behavioral simulation...');

            // Apply enhanced stealth fingerprinting with device profile
            if (enableAdvancedStealth) {
                await StealthService.enhancePageWithAdvancedStealth(page);
            }

            // Human-like behavioral simulation
            if (simulateMouseMovement || simulateScrolling) {
                logger.info(requestId, `Simulating human behavior [${behaviorProfile} profile]`);
                await InteractionService.autoScroll(page, behaviorProfile, 0.3); // Light initial scroll

                if (humanDelays) {
                    await InteractionService.randomDelay(500, 1500);
                }
            }

            await page.evaluate(async() => {
                // Advanced stylesheet loading detection
                await new Promise((resolve) => {
                    const checkStyleSheets = () => {
                        try {
                            // Check both link elements and document.styleSheets
                            const linkSheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
                            const allDocSheets = Array.from(document.styleSheets);

                            const linkSheetsLoaded = linkSheets.every(link => {
                                try {
                                    return link.sheet && link.sheet.cssRules && link.sheet.cssRules.length >= 0;
                                } catch (e) {
                                    // Cross-origin sheets might throw but are loaded
                                    return link.sheet !== null;
                                }
                            });

                            const docSheetsLoaded = allDocSheets.every(sheet => {
                                try {
                                    return sheet.cssRules && sheet.cssRules.length >= 0;
                                } catch (e) {
                                    return true; // Cross-origin or loaded
                                }
                            });

                            if ((linkSheetsLoaded && docSheetsLoaded) || Date.now() - startTime > 15000) {
                                resolve();
                            } else {
                                setTimeout(checkStyleSheets, 200);
                            }
                        } catch (e) {
                            resolve(); // Fallback on any error
                        }
                    };

                    const startTime = Date.now();
                    checkStyleSheets();
                });

                // Wait for fonts with better error handling
                if (document.fonts && document.fonts.ready) {
                    try {
                        await Promise.race([
                            document.fonts.ready,
                            new Promise(resolve => setTimeout(resolve, 8000))
                        ]);
                    } catch (e) {
                        // Font loading can fail, continue anyway
                    }
                }

                // Enhanced image loading with better detection
                const images = Array.from(document.querySelectorAll('img, picture img, [style*="background-image"]'));
                await Promise.all(images.map(img => {
                    return new Promise((resolve) => {
                        if (img.tagName === 'IMG') {
                            if (img.complete && img.naturalHeight !== 0) {
                                resolve();
                            } else {
                                const cleanup = () => {
                                    img.removeEventListener('load', handleLoad);
                                    img.removeEventListener('error', handleError);
                                };

                                const handleLoad = () => {
                                    cleanup();
                                    resolve();
                                };

                                const handleError = () => {
                                    cleanup();
                                    resolve();
                                };

                                img.addEventListener('load', handleLoad);
                                img.addEventListener('error', handleError);
                                setTimeout(() => {
                                    cleanup();
                                    resolve();
                                }, 6000);
                            }
                        } else {
                            // For background images, just wait a bit
                            setTimeout(resolve, 1000);
                        }
                    });
                }));

                // Wait for JavaScript frameworks to initialize (React, Vue, Angular)
                let jsFrameworkReady = false;
                for (let i = 0; i < 20 && !jsFrameworkReady; i++) {
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Check for common framework indicators
                    const hasReact = window.React || document.querySelector('[data-reactroot]');
                    const hasVue = window.Vue || document.querySelector('[data-v-]');
                    const hasAngular = window.ng || document.querySelector('[ng-version]');

                    if (hasReact || hasVue || hasAngular) {
                        // Give frameworks extra time to render
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        jsFrameworkReady = true;
                    }

                    // Check if there's still dynamic content loading
                    const hasLoaders = document.querySelectorAll('.loading, .spinner, .loader, [class*="load"]').length > 0;
                    if (!hasLoaders) {
                        jsFrameworkReady = true;
                    }
                }

                // Wait for CSS animations and transitions to stabilize
                await new Promise(resolve => setTimeout(resolve, 3000));

                // Final check for any remaining async operations
                if (typeof window.requestIdleCallback !== 'undefined') {
                    await new Promise(resolve => {
                        window.requestIdleCallback(resolve, { timeout: 2000 });
                    });
                }
            });

            // Wait for specific selectors if provided
            await InteractionService.waitForSelectors(page, waitForSelectors);

            // Click elements if specified (with enhanced human-like behavior)
            if (clickSelectors.length > 0) {
                for (const selector of clickSelectors) {
                    if (simulateMouseMovement) {
                        const element = await page.locator(selector).first();
                        const box = await element.boundingBox();
                        if (box) {
                            await InteractionService.moveMouseNaturally(page,
                                box.x + box.width / 2,
                                box.y + box.height / 2,
                                behaviorProfile
                            );
                        }
                    }
                    await InteractionService.clickElements(page, [selector]);

                    if (humanDelays) {
                        await InteractionService.randomDelay(300, 800);
                    }
                }
            }

            // Force desktop CSS and layout
            logger.info(requestId, 'Forcing desktop CSS and layout...');
            await InteractionService.forceDesktopLayout(page);

            // Wait for JavaScript execution to complete
            logger.info(requestId, 'Waiting for JavaScript execution...');
            await InteractionService.waitForJavaScriptFrameworks(page);

            // Enhanced human-like behavior simulation with v1.3.0 profiles
            if (simulateMouseMovement || simulateScrolling) {
                logger.info(requestId, `Simulating enhanced human behavior [${behaviorProfile}]...`);
                await InteractionService.simulateHumanBehavior(page, behaviorProfile);
            }

            // Enhanced auto-scroll with behavioral profiles
            if (scrollToBottom && simulateScrolling) {
                logger.info(requestId, `Auto-scrolling with ${behaviorProfile} behavior pattern...`);
                await InteractionService.autoScroll(page, behaviorProfile, 0.85);
            } else if (scrollToBottom) {
                logger.info(requestId, 'Standard auto-scrolling...');
                await InteractionService.autoScroll(page);
            }

            // Wait for network to be idle
            if (waitForNetworkIdle) {
                logger.info(requestId, 'Waiting for network idle...');
                try {
                    await page.waitForLoadState('networkidle', { timeout: 30000 });
                } catch (networkError) {
                    logger.warn(requestId, 'Network idle timeout (continuing)');
                }
            }

            // Execute custom script if provided
            if (customScript) {
                logger.info(requestId, 'Executing custom script...');
                try {
                    await page.evaluate(customScript);
                    logger.info(requestId, 'Custom script executed successfully');
                } catch (e) {
                    logger.warn(requestId, `Custom script failed: ${e.message}`);
                }
            }

            // Remove unwanted elements
            await InteractionService.removeElements(page, removeElements);

            // Final content extraction with enhanced CSS inlining for HTML endpoint
            logger.info(requestId, 'Extracting final content with inline CSS...');

            // Inline CSS styles for better HTML rendering
            const content = await page.evaluate(() => {
                try {
                    // Get all external stylesheets and inline them
                    const styleSheets = Array.from(document.styleSheets);
                    let inlineCSS = '';

                    styleSheets.forEach(sheet => {
                        try {
                            const rules = Array.from(sheet.cssRules || sheet.rules || []);
                            rules.forEach(rule => {
                                if (rule.cssText) {
                                    inlineCSS += rule.cssText + '\n';
                                }
                            });
                        } catch (e) {
                            // Cross-origin stylesheets might throw errors, skip them
                        }
                    });

                    // Create a comprehensive style tag
                    let styleTag = '';
                    if (inlineCSS) {
                        styleTag = `<style type="text/css">\n${inlineCSS}\n</style>`;
                    }

                    // Get the document HTML
                    let htmlContent = document.documentElement.outerHTML;

                    // Inject the inline CSS into the head
                    if (styleTag && htmlContent.includes('<head>')) {
                        htmlContent = htmlContent.replace('<head>', `<head>\n${styleTag}`);
                    } else if (styleTag && htmlContent.includes('<html>')) {
                        // Fallback: add after opening HTML tag
                        htmlContent = htmlContent.replace('<html>', `<html>\n<head>\n${styleTag}\n</head>`);
                    }

                    // Also inline computed styles for better compatibility
                    const allElements = document.querySelectorAll('*');
                    allElements.forEach(element => {
                        try {
                            const computedStyle = window.getComputedStyle(element);
                            const importantStyles = [
                                'display', 'position', 'width', 'height', 'margin', 'padding',
                                'color', 'background', 'background-color', 'font-family', 'font-size',
                                'font-weight', 'text-align', 'border', 'border-radius'
                            ];

                            let inlineStyle = element.getAttribute('style') || '';
                            importantStyles.forEach(prop => {
                                const value = computedStyle.getPropertyValue(prop);
                                if (value && value !== 'initial' && value !== 'normal') {
                                    if (!inlineStyle.includes(prop + ':')) {
                                        inlineStyle += `${prop}: ${value}; `;
                                    }
                                }
                            });

                            if (inlineStyle) {
                                element.setAttribute('style', inlineStyle);
                            }
                        } catch (e) {
                            // Skip elements that can't be styled
                        }
                    });

                    return document.documentElement.outerHTML;
                } catch (error) {
                    // Fallback to basic content extraction
                    return document.documentElement.outerHTML;
                }
            });

            const title = await page.title().catch(() => 'Unknown Title');
            const currentUrl = page.url();

            // Take screenshot if requested
            let screenshotBuffer = null;
            if (fullPage) {
                try {
                    screenshotBuffer = await page.screenshot({
                        fullPage: true,
                        type: 'png'
                    });
                    logger.info(requestId, 'Screenshot captured');
                } catch (screenshotError) {
                    logger.warn(requestId, 'Screenshot generation failed', { error: screenshotError.message });
                }
            }

            // Generate PDF if requested
            let pdfBuffer = null;
            if (generatePDF) {
                try {
                    pdfBuffer = await page.pdf({
                        format: 'A4',
                        printBackground: true,
                        displayHeaderFooter: false,
                        margin: {
                            top: '1cm',
                            right: '1cm',
                            bottom: '1cm',
                            left: '1cm'
                        }
                    });
                    logger.info(requestId, 'PDF generated');
                } catch (pdfError) {
                    logger.warn(requestId, `PDF generation failed: ${pdfError.message}`);
                }
            }

            // Clean up
            await browserService.safeCloseContext(context, requestId);

            const result = {
                html: content,
                title,
                url: currentUrl,
                originalUrl: url,
                consoleLogs: captureConsole ? consoleLogs : null,
                timestamp: new Date().toISOString(),
                wasTimeout,
                contentLength: content.length,
                screenshotBuffer,
                pdfBuffer
            };

            if (wasTimeout) {
                logger.warn(requestId, `Content extracted with timeout warnings - Length: ${content.length} chars`);
            } else {
                logger.info(requestId, `Content fully extracted - Length: ${content.length} chars`);
            }

            return result;
        } catch (error) {
            if (context) await browserService.safeCloseContext(context, requestId);

            const categorizedError = handleError(error, requestId, 'Page rendering');

            // Enhanced error analysis and user-friendly messages
            const isTimeoutError = error.message.includes('Timeout') || error.name === 'TimeoutError';
            const isNetworkError = error.message.includes('net::ERR_FAILED') || error.message.includes('ERR_NAME_NOT_RESOLVED');
            const isAntiBot = error.message.includes('blocked') || error.message.includes('denied') ||
                             (isTimeoutError && (url.includes('google.') || url.includes('facebook.') || url.includes('amazon.')));

            logger.error(requestId, `Page rendering failed: ${error.message}`);

            // Emergency fallback for timeouts
            if (returnPartialOnTimeout && isTimeoutError) {
                logger.info(requestId, 'Attempting emergency content extraction...');
                try {
                    const emergencyResult = await this.emergencyContentExtraction(url, requestId);
                    return emergencyResult;
                } catch (emergencyError) {
                    logger.error(requestId, 'Emergency content extraction also failed');
                }
            }

            // Enhance error with user-friendly information
            if (isAntiBot) {
                throw new HeadlessXError(
                    `Site appears to be blocking automated access: ${error.message}`,
                    ERROR_CATEGORIES.NETWORK,
                    false,
                    {
                        url,
                        suggestion: 'This site has sophisticated anti-bot protection. Try using different URLs, adding delays, or using proxies.',
                        originalError: error.message,
                        errorType: 'anti-bot-protection'
                    }
                );
            } else if (isNetworkError) {
                throw new HeadlessXError(
                    `Network connection failed: ${error.message}`,
                    ERROR_CATEGORIES.NETWORK,
                    true,
                    {
                        url,
                        suggestion: 'Check if the URL is accessible and your internet connection is stable.',
                        originalError: error.message,
                        errorType: 'network-connectivity'
                    }
                );
            } else if (isTimeoutError) {
                throw new HeadlessXError(
                    `Operation timed out: ${error.message}`,
                    ERROR_CATEGORIES.TIMEOUT,
                    true,
                    {
                        url,
                        suggestion: 'Site is taking too long to load. Try increasing timeout or using returnPartialOnTimeout=true.',
                        originalError: error.message,
                        errorType: 'timeout'
                    }
                );
            }

            throw categorizedError;
        }
    }

    // Emergency content extraction for timeout scenarios
    static async emergencyContentExtraction(url, requestId) {
        logger.info(requestId, 'Starting emergency content extraction...');

        const browser = await browserService.getBrowser();
        const emergencyOptions = StealthService.generateStealthContextOptions();
        const context = await browserService.createIsolatedContext(browser, emergencyOptions);

        try {
            const page = await context.newPage();
            page.setDefaultTimeout(30000);

            await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
            await page.waitForTimeout(5000);

            const content = await page.content();
            const title = await page.title().catch(() => 'Unknown');
            const currentUrl = page.url();

            await browserService.safeCloseContext(context, requestId);

            logger.info(requestId, `Emergency content extraction successful - Length: ${content.length} chars`);

            return {
                html: content,
                title,
                url: currentUrl,
                originalUrl: url,
                consoleLogs: null,
                timestamp: new Date().toISOString(),
                wasTimeout: true,
                isEmergencyContent: true,
                contentLength: content.length
            };
        } catch (e) {
            await browserService.safeCloseContext(context, requestId);
            throw e;
        }
    }

    // Generate screenshot from HTML content
    static async generateScreenshot(htmlContent, options = {}) {
        const requestId = generateRequestId();
        const browser = await browserService.getBrowser();
        const context = await browserService.createIsolatedContext(browser);

        try {
            const page = await context.newPage();
            await page.setContent(htmlContent);
            await page.waitForTimeout(2000); // Wait for rendering

            const screenshotBuffer = await page.screenshot({
                fullPage: options.fullPage || false,
                type: options.format || 'png',
                quality: options.format === 'jpeg' ? 90 : undefined
            });

            await browserService.safeCloseContext(context, requestId);
            return screenshotBuffer;
        } catch (error) {
            await browserService.safeCloseContext(context, requestId);
            throw error;
        }
    }

    // Generate screenshot directly from URL with full CSS loading
    static async generateScreenshotFromUrl(url, options = {}) {
        const requestId = generateRequestId();
        const browser = await browserService.getBrowser();

        try {
            logger.info(requestId, `Generating screenshot with full CSS loading for: ${url}`);

            // Use the same stealth context as normal rendering
            const stealthOptions = StealthService.generateStealthContextOptions();
            const context = await browserService.createIsolatedContext(browser, stealthOptions);

            // Setup Google consent cookies for better compatibility
            await StealthService.setupGoogleCookies(context, url);

            const page = await context.newPage();

            // Setup request interception for perfect headers
            await StealthService.setupRequestInterception(page);

            // Add stealth script
            await context.addInitScript(StealthService.getStealthScript());

            // Set viewport
            await page.setViewportSize({
                width: options.viewport?.width || 1920,
                height: options.viewport?.height || 1080
            });

            // Set timeouts for screenshot generation
            page.setDefaultTimeout(60000);
            page.setDefaultNavigationTimeout(60000);

            logger.info(requestId, `Navigating to URL for screenshot: ${url}`);

            // Navigate to the actual URL to load all CSS/JS resources
            await page.goto(url, {
                waitUntil: 'networkidle',
                timeout: 60000
            });

            // Apply advanced stealth fingerprinting
            await StealthService.enhancePageWithAdvancedStealth(page);

            // Handle Google consent if it's a Google URL
            if (url.includes('google.')) {
                await StealthService.handleGoogleConsent(page);
            }

            // Wait for complete CSS and content loading
            await page.evaluate(async() => {
                // Wait for all stylesheets to load
                await new Promise((resolve) => {
                    const checkStyleSheets = () => {
                        try {
                            const linkSheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
                            const allDocSheets = Array.from(document.styleSheets);

                            const linkSheetsLoaded = linkSheets.every(link => {
                                try {
                                    return link.sheet && link.sheet.cssRules;
                                } catch (e) {
                                    return link.sheet !== null;
                                }
                            });

                            const docSheetsLoaded = allDocSheets.every(sheet => {
                                try {
                                    return sheet.cssRules;
                                } catch (e) {
                                    return true;
                                }
                            });

                            if ((linkSheetsLoaded && docSheetsLoaded) || Date.now() - startTime > 10000) {
                                resolve();
                            } else {
                                setTimeout(checkStyleSheets, 200);
                            }
                        } catch (e) {
                            resolve();
                        }
                    };

                    const startTime = Date.now();
                    checkStyleSheets();
                });

                // Wait for images to load
                const images = Array.from(document.querySelectorAll('img'));
                await Promise.all(images.map(img => {
                    return new Promise((resolve) => {
                        if (img.complete && img.naturalHeight !== 0) {
                            resolve();
                        } else {
                            const cleanup = () => {
                                img.removeEventListener('load', handleLoad);
                                img.removeEventListener('error', handleError);
                            };

                            const handleLoad = () => {
                                cleanup();
                                resolve();
                            };

                            const handleError = () => {
                                cleanup();
                                resolve();
                            };

                            img.addEventListener('load', handleLoad);
                            img.addEventListener('error', handleError);
                            setTimeout(() => {
                                cleanup();
                                resolve();
                            }, 5000);
                        }
                    });
                }));

                // Wait for fonts
                if (document.fonts && document.fonts.ready) {
                    try {
                        await Promise.race([
                            document.fonts.ready,
                            new Promise(resolve => setTimeout(resolve, 5000))
                        ]);
                    } catch (e) {}
                }
            });

            // Additional wait for content to stabilize
            await page.waitForTimeout(3000);

            logger.info(requestId, 'Taking screenshot with proper CSS loading...');

            // Take the screenshot
            const screenshotBuffer = await page.screenshot({
                fullPage: options.fullPage || false,
                type: options.format || 'png',
                quality: options.quality || (options.format === 'jpeg' ? 90 : undefined)
            });

            logger.info(requestId, `Screenshot completed: ${screenshotBuffer.length} bytes`);

            await browserService.safeCloseContext(context, requestId);
            return screenshotBuffer;
        } catch (error) {
            await browserService.safeCloseContext(context, requestId);
            throw error;
        }
    }

    // Enhanced PDF generation with proper CSS loading and rendering
    static async generatePDF(url, options = {}) {
        const requestId = generateRequestId();
        const browser = await browserService.getBrowser();

        try {
            logger.info(requestId, `Generating PDF with full CSS loading for: ${url}`);

            // Use the same stealth context as normal rendering
            const stealthOptions = StealthService.generateStealthContextOptions();
            const context = await browserService.createIsolatedContext(browser, stealthOptions);

            // Setup Google consent cookies for better compatibility
            await StealthService.setupGoogleCookies(context, url);

            const page = await context.newPage();

            // Setup request interception for perfect headers
            await StealthService.setupRequestInterception(page);

            // Add stealth script
            await context.addInitScript(StealthService.getStealthScript());

            // Set timeouts for PDF generation
            page.setDefaultTimeout(60000);
            page.setDefaultNavigationTimeout(60000);

            logger.info(requestId, `Navigating to URL for PDF: ${url}`);

            // Navigate to the actual URL to load all CSS/JS resources
            await page.goto(url, {
                waitUntil: 'networkidle',
                timeout: 60000
            });

            // Enhanced wait for complete rendering
            await page.waitForTimeout(3000);

            // Wait for CSS to load completely
            await page.evaluate(async() => {
                // Wait for all stylesheets to load
                const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
                await Promise.all(stylesheets.map(link => {
                    return new Promise((resolve) => {
                        if (link.sheet) {
                            resolve();
                        } else {
                            link.addEventListener('load', resolve);
                            link.addEventListener('error', resolve);
                            setTimeout(resolve, 5000); // Timeout fallback
                        }
                    });
                }));

                // Wait for fonts to load
                if (document.fonts) {
                    await document.fonts.ready;
                }

                // Wait for any lazy-loaded images
                const images = Array.from(document.querySelectorAll('img'));
                await Promise.all(images.map(img => {
                    return new Promise((resolve) => {
                        if (img.complete) {
                            resolve();
                        } else {
                            img.addEventListener('load', resolve);
                            img.addEventListener('error', resolve);
                            setTimeout(resolve, 3000); // Timeout fallback
                        }
                    });
                }));
            });

            // Additional wait for any dynamic content
            await page.waitForTimeout(2000);

            // Handle Google consent if needed
            if (url.includes('google.')) {
                await StealthService.handleGoogleConsent(page);
                await page.waitForTimeout(2000);
            }

            logger.info(requestId, 'Generating PDF with complete styling...');

            // Generate PDF with enhanced options
            const pdfBuffer = await page.pdf({
                format: options.format || 'A4',
                printBackground: true, // Always include background for better appearance
                margin: {
                    top: options.marginTop || '20px',
                    right: options.marginRight || '20px',
                    bottom: options.marginBottom || '20px',
                    left: options.marginLeft || '20px'
                },
                preferCSSPageSize: true,
                displayHeaderFooter: false,
                scale: 1.0
            });

            await browserService.safeCloseContext(context, requestId);
            logger.info(requestId, `PDF generated successfully: ${pdfBuffer.length} bytes`);

            return pdfBuffer;
        } catch (error) {
            await browserService.safeCloseContext(context, requestId);
            logger.error(requestId, 'PDF generation failed', error);
            throw error;
        }
    }
}

module.exports = RenderingService;
