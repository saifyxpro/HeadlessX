// Improved page rendering with proper context isolation and error handling

// Generate unique request correlation ID for debugging
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Structured logging with correlation IDs
function logWithId(requestId, level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        requestId,
        level,
        message,
        ...data
    };
    console.log(`[${timestamp}] [${requestId}] [${level.toUpperCase()}] ${message}`, 
        Object.keys(data).length > 0 ? JSON.stringify(data) : '');
}

// Clean context management function
async function createIsolatedContext(browser, options = {}) {
    const context = await browser.newContext(options);
    
    // Auto-cleanup on close
    context.on('close', () => {
        console.log('Context closed automatically');
    });
    
    return context;
}

// Safe context cleanup
async function safeCloseContext(context, requestId) {
    if (context && !context._closed) {
        try {
            await context.close();
            logWithId(requestId, 'debug', 'Context closed successfully');
        } catch (error) {
            logWithId(requestId, 'error', 'Failed to close context', { error: error.message });
        }
    }
}

// Improved page rendering with proper isolation and error handling
async function renderPageAdvanced(options) {
    const requestId = generateRequestId();
    logWithId(requestId, 'info', 'Starting page render', { url: options.url, options: Object.keys(options) });
    
    const {
        url,
        waitUntil = 'networkidle',
        timeout = 120000,
        extraWaitTime = 15000,
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
        returnPartialOnTimeout = false,
        fullPage = false,
        screenshotPath = null,
        screenshotFormat = 'png',
        pdfPath = null,
        pdfFormat = 'A4'
    } = options;

    const startTime = Date.now();
    let context = null;
    let page = null;
    const consoleLogs = [];
    let wasTimeout = false;

    try {
        const browser = await getBrowser();
        
        // Create isolated context for this request with realistic settings
        const realisticUserAgent = userAgent || getRandomUserAgent();
        const realisticLocale = getRandomLocale();
        const realisticHeaders = generateRealisticHeaders(realisticUserAgent, headers);
        
        logWithId(requestId, 'debug', 'Creating context', { 
            userAgent: realisticUserAgent.substring(0, 80) + '...',
            locale: realisticLocale.locale 
        });

        context = await createIsolatedContext(browser, {
            viewport,
            userAgent: realisticUserAgent,
            locale: realisticLocale.locale,
            timezoneId: realisticLocale.timezone,
            extraHTTPHeaders: realisticHeaders,
            ignoreHTTPSErrors: true,
            javaScriptEnabled: true,
            permissions: ['geolocation', 'notifications', 'camera', 'microphone'],
            colorScheme: Math.random() > 0.2 ? 'light' : 'dark',
            reducedMotion: Math.random() > 0.9 ? 'reduce' : 'no-preference',
            forcedColors: 'none',
            screen: {
                width: viewport.width,
                height: viewport.height
            },
            hasTouch: false,
            isMobile: false,
            deviceScaleFactor: Math.random() > 0.7 ? 1.25 : 1,
        });

        // Add cookies if provided
        if (cookies.length > 0) {
            await context.addCookies(cookies);
            logWithId(requestId, 'debug', 'Added cookies', { count: cookies.length });
        }

        page = await context.newPage();

        // Set adequate timeouts for complete JavaScript execution
        page.setDefaultTimeout(60000);
        page.setDefaultNavigationTimeout(timeout);

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

        // Add comprehensive stealth scripts to avoid detection
        await page.addInitScript(() => {
            // Remove webdriver properties completely
            delete navigator.__proto__.webdriver;
            delete navigator.webdriver;
            
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
                configurable: true
            });

            // Remove automation indicators
            delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
            delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
            delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
            
            // Override chrome runtime
            if (!window.chrome) {
                window.chrome = {};
            }
            
            if (!window.chrome.runtime) {
                window.chrome.runtime = {
                    onConnect: undefined,
                    onMessage: undefined,
                    id: 'extension-id-placeholder'
                };
            }

            // Realistic plugins array
            const plugins = [
                { name: 'PDF Viewer', description: 'Portable Document Format', filename: 'internal-pdf-viewer' },
                { name: 'Chrome PDF Viewer', description: 'Portable Document Format', filename: 'internal-pdf-viewer' }
            ];
            
            Object.defineProperty(navigator, 'plugins', {
                get: () => plugins,
                configurable: true
            });

            // Realistic language settings
            const languages = ['en-US', 'en'];
            Object.defineProperty(navigator, 'languages', {
                get: () => languages,
                configurable: true
            });

            // Realistic hardware concurrency
            const cores = [4, 6, 8, 12, 16][Math.floor(Math.random() * 5)];
            Object.defineProperty(navigator, 'hardwareConcurrency', {
                get: () => cores,
                configurable: true
            });

            // Override permissions API to be more realistic
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => {
                switch(parameters.name) {
                    case 'notifications':
                        return Promise.resolve({ state: Math.random() > 0.5 ? 'default' : 'denied' });
                    case 'geolocation':
                        return Promise.resolve({ state: 'prompt' });
                    default:
                        return originalQuery ? originalQuery.call(navigator.permissions, parameters) : Promise.resolve({ state: 'prompt' });
                }
            };
        });

        logWithId(requestId, 'debug', 'Starting navigation', { url });

        // Navigate with comprehensive timeout settings - complete execution priority
        const response = await page.goto(url, {
            waitUntil: waitUntil,
            timeout: timeout
        });

        if (!response) {
            throw new Error('Navigation failed - no response received');
        }

        if (!response.ok()) {
            logWithId(requestId, 'warn', 'Non-200 response', { 
                status: response.status(), 
                statusText: response.statusText() 
            });
        }

        logWithId(requestId, 'debug', 'Navigation completed, processing dynamic content');

        // Wait for specific selectors if provided
        if (waitForSelectors.length > 0) {
            logWithId(requestId, 'debug', 'Waiting for selectors', { selectors: waitForSelectors });
            for (const selector of waitForSelectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 30000 });
                    logWithId(requestId, 'debug', 'Found selector', { selector });
                } catch (e) {
                    logWithId(requestId, 'warn', 'Selector not found', { selector, error: e.message });
                }
            }
        }

        // Click elements if specified
        if (clickSelectors.length > 0) {
            logWithId(requestId, 'debug', 'Clicking elements', { selectors: clickSelectors });
            for (const selector of clickSelectors) {
                try {
                    await page.click(selector);
                    await page.waitForTimeout(2000);
                    logWithId(requestId, 'debug', 'Clicked element', { selector });
                } catch (e) {
                    logWithId(requestId, 'warn', 'Could not click', { selector, error: e.message });
                }
            }
        }

        // Simulate human-like behavior for complete rendering
        logWithId(requestId, 'debug', 'Simulating human behavior');
        try {
            await simulateHumanBehavior(page);
        } catch (e) {
            logWithId(requestId, 'warn', 'Human behavior simulation failed', { error: e.message });
        }

        // Scroll to bottom to trigger lazy loading
        if (scrollToBottom) {
            logWithId(requestId, 'debug', 'Scrolling to load content');
            try {
                await autoScroll(page);
            } catch (e) {
                logWithId(requestId, 'warn', 'Scrolling failed', { error: e.message });
            }
        }

        // Wait for network to be idle
        if (waitForNetworkIdle) {
            logWithId(requestId, 'debug', 'Waiting for network idle');
            try {
                await page.waitForLoadState('networkidle', { timeout: 30000 });
            } catch (e) {
                logWithId(requestId, 'warn', 'Network idle wait failed', { error: e.message });
                wasTimeout = true;
            }
        }

        // Extra wait time for dynamic content
        if (extraWaitTime > 0) {
            logWithId(requestId, 'debug', 'Extra wait time', { duration: extraWaitTime });
            await page.waitForTimeout(extraWaitTime);
        }

        // Execute custom script if provided
        if (customScript) {
            logWithId(requestId, 'debug', 'Executing custom script');
            try {
                await page.evaluate(customScript);
            } catch (e) {
                logWithId(requestId, 'error', 'Custom script failed', { error: e.message });
                throw new Error(`Script execution failed: ${e.message}`);
            }
        }

        // Remove unwanted elements
        if (removeElements.length > 0) {
            logWithId(requestId, 'debug', 'Removing elements', { selectors: removeElements });
            for (const selector of removeElements) {
                try {
                    await page.evaluate((sel) => {
                        const elements = document.querySelectorAll(sel);
                        elements.forEach(el => el.remove());
                    }, selector);
                } catch (e) {
                    logWithId(requestId, 'warn', 'Could not remove elements', { selector, error: e.message });
                }
            }
        }

        // Take screenshot if requested
        let screenshotBuffer = null;
        if (screenshotPath) {
            try {
                logWithId(requestId, 'debug', 'Taking screenshot');
                screenshotBuffer = await page.screenshot({
                    path: screenshotPath,
                    fullPage: fullPage,
                    type: screenshotFormat,
                    quality: screenshotFormat === 'jpeg' ? 90 : undefined
                });
                logWithId(requestId, 'debug', 'Screenshot saved', { path: screenshotPath });
            } catch (e) {
                logWithId(requestId, 'warn', 'Screenshot failed', { error: e.message });
            }
        }

        // Generate PDF if requested
        let pdfBuffer = null;
        if (pdfPath) {
            try {
                logWithId(requestId, 'debug', 'Generating PDF');
                pdfBuffer = await page.pdf({
                    path: pdfPath,
                    format: pdfFormat,
                    printBackground: true,
                    margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
                });
                logWithId(requestId, 'debug', 'PDF saved', { path: pdfPath });
            } catch (e) {
                logWithId(requestId, 'warn', 'PDF generation failed', { error: e.message });
            }
        }

        // Get final HTML content
        logWithId(requestId, 'debug', 'Extracting final content');
        const content = await page.content();

        // Get page info
        let title = 'Unknown';
        let currentUrl = url;
        
        try {
            title = await page.title() || 'Unknown';
            currentUrl = page.url() || url;
        } catch (e) {
            logWithId(requestId, 'warn', 'Could not get page title/URL', { error: e.message });
        }

        const renderTime = Date.now() - startTime;
        logWithId(requestId, 'info', 'Render completed successfully', { 
            renderTime, 
            contentLength: content.length,
            finalUrl: currentUrl,
            wasTimeout
        });

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
            pdfBuffer,
            renderTime,
            requestId
        };

        return result;

    } catch (error) {
        const renderTime = Date.now() - startTime;
        logWithId(requestId, 'error', 'Render failed', { 
            error: error.message, 
            renderTime,
            errorType: error.name 
        });
        
        // Handle emergency extraction for timeout errors if enabled
        if (returnPartialOnTimeout && (error.message.includes('Timeout') || error.name === 'TimeoutError')) {
            logWithId(requestId, 'warn', 'Attempting emergency content extraction');
            try {
                // Try emergency extraction with minimal settings
                const browser2 = await getBrowser();
                const emergencyContext = await createIsolatedContext(browser2, {
                    viewport,
                    userAgent: userAgent || getRandomUserAgent(),
                    javaScriptEnabled: true
                });
                
                const emergencyPage = await emergencyContext.newPage();
                emergencyPage.setDefaultTimeout(30000);
                
                await emergencyPage.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
                await emergencyPage.waitForTimeout(5000);
                
                const emergencyContent = await emergencyPage.content();
                const emergencyTitle = await emergencyPage.title().catch(() => 'Unknown');
                const emergencyUrl = emergencyPage.url();
                
                await safeCloseContext(emergencyContext, requestId);
                
                logWithId(requestId, 'warn', 'Emergency extraction successful', { 
                    contentLength: emergencyContent.length 
                });
                
                return {
                    html: emergencyContent,
                    title: emergencyTitle,
                    url: emergencyUrl,
                    originalUrl: url,
                    consoleLogs: null,
                    timestamp: new Date().toISOString(),
                    wasTimeout: true,
                    isEmergencyContent: true,
                    contentLength: emergencyContent.length,
                    renderTime: Date.now() - startTime,
                    requestId
                };
            } catch (emergencyError) {
                logWithId(requestId, 'error', 'Emergency extraction failed', { error: emergencyError.message });
            }
        }
        
        throw new Error(`Page rendering failed: ${error.message}`);
        
    } finally {
        // Always clean up resources
        if (page && !page.isClosed()) {
            try {
                await page.close();
                logWithId(requestId, 'debug', 'Page closed successfully');
            } catch (closeError) {
                logWithId(requestId, 'warn', 'Failed to close page', { error: closeError.message });
            }
        }
        
        if (context) {
            await safeCloseContext(context, requestId);
        }
    }
}

module.exports = {
    renderPageAdvanced,
    generateRequestId,
    logWithId,
    createIsolatedContext,
    safeCloseContext
};