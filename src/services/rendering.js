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
    
    // Advanced page rendering function with timeout handling
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
            generatePDF = false
        } = options;

        const requestId = generateRequestId();
        const browser = await browserService.getBrowser();
        let context = null;
        let page = null;
        const consoleLogs = [];
        let wasTimeout = false;

        try {
            logger.info(requestId, `Starting advanced rendering for: ${url}`);
            
            // Generate stealth context options
            const stealthOptions = StealthService.generateStealthContextOptions(userAgent, headers);
            
            // Add custom cookies to stealth options
            if (cookies.length > 0) {
                stealthOptions.cookies = cookies;
            }
            
            logger.debug(requestId, 'Creating stealth context', { 
                userAgent: stealthOptions.userAgent.substring(0, 80) + '...',
                locale: stealthOptions.locale 
            });

            // Create stealth context
            context = await browserService.createIsolatedContext(browser, stealthOptions);

            // Setup Google consent cookies
            await StealthService.setupGoogleCookies(context, url);

            // Add custom cookies if provided
            if (cookies.length > 0) {
                await context.addCookies(cookies);
            }

            // Create page
            page = await context.newPage();

            // Setup request interception for perfect headers
            await StealthService.setupRequestInterception(page);

            // Set reasonable timeouts
            page.setDefaultTimeout(45000);
            page.setDefaultNavigationTimeout(Math.min(timeout, 60000));

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

            // Enhanced navigation with better error handling
            await withTimeoutFallback(
                async () => {
                    const isGoogle = url.includes('google.');
                    try {
                        if (isGoogle) {
                            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: Math.min(timeout * 0.5, 15000) });
                            const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 2000));
                            if (/unusual traffic|automated queries|are you a robot/i.test(bodyText)) {
                                throw new HeadlessXError('Google anti-bot page detected', ERROR_CATEGORIES.NETWORK, false);
                            }
                            await StealthService.handleGoogleConsent(page);
                            await page.waitForTimeout(1000);
                            logger.info(requestId, 'Page navigation completed (google/domcontentloaded)');
                        } else {
                            await page.goto(url, { 
                                waitUntil: 'networkidle', 
                                timeout: Math.min(timeout * 0.7, 30000)
                            });
                            logger.info(requestId, 'Page navigation completed (networkidle)');
                        }
                    } catch (navError) {
                        logger.warn(requestId, 'Primary navigation failed, trying domcontentloaded...');
                        await page.goto(url, { 
                            waitUntil: 'domcontentloaded', 
                            timeout: Math.min(timeout * 0.5, 20000)
                        });
                        if (isGoogle) {
                            await StealthService.handleGoogleConsent(page);
                        }
                        logger.info(requestId, 'Page navigation completed (domcontentloaded)');
                    }
                    
                    // Wait for page to load
                    await page.waitForTimeout(Math.max(extraWaitTime, 5000));
                    
                    logger.info(requestId, 'Page loaded successfully');
                },
                returnPartialOnTimeout ? async () => {
                    wasTimeout = true;
                    logger.warn(requestId, 'Navigation timeout - trying quick reload...');
                    try {
                        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
                        await page.waitForTimeout(1000);
                    } catch (e) {
                        logger.warn(requestId, 'Quick reload failed, proceeding with partial content');
                    }
                } : null,
                Math.min(timeout, 45000)
            );

            // Wait for specific selectors if provided
            await InteractionService.waitForSelectors(page, waitForSelectors);

            // Click elements if specified
            await InteractionService.clickElements(page, clickSelectors);

            // Force desktop CSS and layout
            logger.info(requestId, 'Forcing desktop CSS and layout...');
            await InteractionService.forceDesktopLayout(page);

            // Wait for JavaScript execution to complete
            logger.info(requestId, 'Waiting for JavaScript execution...');
            await InteractionService.waitForJavaScriptFrameworks(page);

            // Simulate human-like behavior
            logger.info(requestId, 'Simulating human behavior...');
            await InteractionService.simulateHumanBehavior(page);

            // Auto-scroll if enabled
            if (scrollToBottom) {
                logger.info(requestId, 'Auto-scrolling to load all content...');
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

            // Final content extraction
            logger.info(requestId, 'Extracting final content...');
            const content = await page.content();
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
                        url: url,
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
                        url: url,
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
                        url: url,
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

    // Generate PDF from HTML content
    static async generatePDF(htmlContent, options = {}) {
        const requestId = generateRequestId();
        const browser = await browserService.getBrowser();
        const context = await browserService.createIsolatedContext(browser);
        
        try {
            const page = await context.newPage();
            await page.setContent(htmlContent);
            await page.waitForTimeout(2000); // Wait for rendering
            
            const pdfBuffer = await page.pdf({
                format: options.format || 'A4',
                printBackground: options.background !== false,
                margin: {
                    top: options.marginTop || '20px',
                    right: options.marginRight || '20px',
                    bottom: options.marginBottom || '20px',
                    left: options.marginLeft || '20px'
                }
            });
            
            await browserService.safeCloseContext(context, requestId);
            return pdfBuffer;
        } catch (error) {
            await browserService.safeCloseContext(context, requestId);
            throw error;
        }
    }
}

module.exports = RenderingService;