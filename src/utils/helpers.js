/**
 * Utility Functions
 * Common helper functions used across the application
 */

// Enhanced timeout handler function with anti-bot detection fallback
async function withTimeoutFallback(asyncOperation, fallbackOperation = null, timeoutMs = 30000) {
    return new Promise(async (resolve, reject) => {
        let completed = false;
        
        // Set timeout with shorter intervals for anti-bot sites
        const timeoutId = setTimeout(() => {
            if (!completed) {
                completed = true;
                console.log(`⏰ Operation timed out after ${timeoutMs}ms, attempting fallback...`);
                if (fallbackOperation) {
                    fallbackOperation().then(resolve).catch(reject);
                } else {
                    // Provide partial content instead of complete failure
                    const { HeadlessXError, ERROR_CATEGORIES } = require('./errors');
                    reject(new HeadlessXError(
                        `Operation timed out after ${timeoutMs}ms - site may have anti-bot protection`,
                        ERROR_CATEGORIES.TIMEOUT,
                        true,
                        { suggestion: 'Try with a different URL or reduce timeout', timeout: timeoutMs }
                    ));
                }
            }
        }, timeoutMs);
        
        try {
            const result = await asyncOperation();
            if (!completed) {
                completed = true;
                clearTimeout(timeoutId);
                resolve(result);
            }
        } catch (error) {
            if (!completed) {
                completed = true;
                clearTimeout(timeoutId);
                
                // Check if this is an anti-bot detection error
                const isAntiBotError = error.message.includes('net::ERR_FAILED') || 
                                     error.message.includes('Navigation timeout') ||
                                     error.message.includes('Timeout') ||
                                     error.message.includes('blocked');
                
                if (isAntiBotError) {
                    console.log(`🤖 Possible anti-bot detection: ${error.message}, attempting fallback...`);
                } else {
                    console.log(`❌ Operation failed: ${error.message}, attempting fallback...`);
                }
                
                if (fallbackOperation) {
                    try {
                        const fallbackResult = await fallbackOperation();
                        resolve(fallbackResult);
                    } catch (fallbackError) {
                        reject(error); // Return original error
                    }
                } else {
                    reject(error);
                }
            }
        }
    });
}

// URL validation function
function validateUrl(url) {
    if (!url) {
        return { valid: false, error: 'Missing required field: url' };
    }
    
    try {
        new URL(url);
        return { valid: true };
    } catch (e) {
        return { valid: false, error: 'Invalid URL format' };
    }
}

// Validate multiple URLs for batch processing
function validateUrls(urls, maxUrls = 10) {
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return { valid: false, error: 'Missing required field: urls (array)' };
    }

    if (urls.length > maxUrls) {
        return { valid: false, error: `Maximum ${maxUrls} URLs allowed per batch` };
    }

    // Validate all URLs
    for (const url of urls) {
        const validation = validateUrl(url);
        if (!validation.valid) {
            return { valid: false, error: `Invalid URL format: ${url}` };
        }
    }
    
    return { valid: true };
}

// Extract options from query parameters for GET requests
function extractOptionsFromQuery(query) {
    const options = {
        url: query.url,
        waitForSelector: query.waitForSelector,
        timeout: query.timeout ? parseInt(query.timeout) : undefined,
        delay: query.delay ? parseInt(query.delay) : undefined,
        returnPartialOnTimeout: query.returnPartialOnTimeout === 'true',
        fullPage: query.fullPage === 'true',
        format: query.format,
        width: query.width ? parseInt(query.width) : undefined,
        height: query.height ? parseInt(query.height) : undefined
    };
    
    // Remove undefined values
    Object.keys(options).forEach(key => {
        if (options[key] === undefined) {
            delete options[key];
        }
    });
    
    return options;
}

// Clean text extraction function
async function extractCleanText(htmlContent, browserService) {
    const context = await browserService.createIsolatedContext();
    const page = await context.newPage();
    
    try {
        // Set HTML content and extract text
        await page.setContent(htmlContent);
        
        // Remove script, style, and other non-content elements
        const textContent = await page.evaluate(() => {
            // Remove unwanted elements
            const unwantedSelectors = [
                'script', 'style', 'noscript', 'iframe', 'object', 'embed',
                'nav', 'header', 'footer', '.nav', '.navigation', '.menu',
                '.sidebar', '.advertisement', '.ads', '.social', '.share',
                '.comments', '.comment', '.popup', '.modal', '.overlay',
                '[role="banner"]', '[role="navigation"]', '[role="complementary"]'
            ];
            
            unwantedSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => el.remove());
            });

            // Get main content areas first
            const contentSelectors = [
                'main', '[role="main"]', '.main-content', '.content', 
                '.post-content', '.article-content', '.page-content',
                'article', '.article', '.post', '.entry-content'
            ];
            
            let mainContent = null;
            for (const selector of contentSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    mainContent = element;
                    break;
                }
            }
            
            // If no main content found, use body
            if (!mainContent) {
                mainContent = document.body;
            }

            // Get text content with proper spacing
            const walker = document.createTreeWalker(
                mainContent,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );

            let textContent = '';
            let node;
            
            while (node = walker.nextNode()) {
                const text = node.textContent.trim();
                if (text && text.length > 1) {
                    // Add spacing between different elements
                    const parent = node.parentElement;
                    if (parent) {
                        const tagName = parent.tagName.toLowerCase();
                        if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'].includes(tagName)) {
                            textContent += text + '\n\n';
                        } else if (['br'].includes(tagName)) {
                            textContent += '\n';
                        } else {
                            textContent += text + ' ';
                        }
                    } else {
                        textContent += text + ' ';
                    }
                }
            }

            // Clean up text
            return textContent
                .replace(/\s+/g, ' ')           // Multiple spaces to single space
                .replace(/\n\s*\n/g, '\n\n')    // Multiple newlines to double newline
                .replace(/^\s+|\s+$/g, '')      // Trim start and end
                .replace(/\n{3,}/g, '\n\n');   // Max 2 consecutive newlines
        });

        await context.close();
        return textContent;
        
    } catch (error) {
        await context.close();
        throw error;
    }
}

module.exports = {
    withTimeoutFallback,
    validateUrl,
    validateUrls,
    extractOptionsFromQuery,
    extractCleanText
};