/**
 * Utility Functions
 * Common helper functions used across the application
 */

// Enhanced timeout handler function with anti-bot detection fallback
async function withTimeoutFallback(asyncOperation, fallbackOperation = null, timeoutMs = 60000) {
    return new Promise(async (resolve, reject) => {
        let completed = false;
        
        // Set timeout with more reasonable intervals for anti-bot sites
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
                                     error.message.includes('blocked') ||
                                     error.message.includes('ERR_TIMED_OUT') ||
                                     error.message.includes('ERR_CONNECTION_REFUSED');
                
                if (isAntiBotError) {
                    console.log(`🤖 Possible anti-bot detection detected: ${error.message}`);
                    if (fallbackOperation) {
                        console.log(`🔄 Attempting fallback operation...`);
                    } else {
                        console.log(`⚠️ No fallback available, returning partial content if possible`);
                    }
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

// Enhanced clean text extraction function with real content detection
async function extractCleanText(htmlContent, browserService) {
    try {
        // Check if we actually have HTML content
        if (!htmlContent || htmlContent.trim().length === 0) {
            return 'No content available - page may be empty or failed to load';
        }

        // Simple text extraction for basic HTML without needing a browser
        if (htmlContent.length < 50000) { // For smaller content, use regex parsing
            let textContent = htmlContent
                // Remove script and style blocks completely
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                // Remove comments
                .replace(/<!--[\s\S]*?-->/g, '')
                // Remove all HTML tags
                .replace(/<[^>]*>/g, ' ')
                // Decode HTML entities
                .replace(/&nbsp;/g, ' ')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                // Clean up whitespace
                .replace(/\s+/g, ' ')
                .replace(/\n\s*\n/g, '\n\n')
                .trim();

            if (textContent && textContent.length > 50) {
                return textContent;
            }
        }

        // For complex content or when simple parsing fails, use browser
        const context = await browserService.createIsolatedContext();
        const page = await context.newPage();
        
        try {
            // Set HTML content directly
            await page.setContent(htmlContent, { waitUntil: 'networkidle' });
            
            // Wait a moment for any dynamic content to load
            await page.waitForTimeout(1000);
            
            // Enhanced text extraction with better content detection
            const textContent = await page.evaluate(() => {
                // Remove unwanted elements first
                const unwantedSelectors = [
                    'script', 'style', 'noscript', 'iframe', 'object', 'embed',
                    'nav', 'header', 'footer', '.nav', '.navigation', '.menu',
                    '.sidebar', '.advertisement', '.ads', '.social', '.share',
                    '.comments', '.comment', '.popup', '.modal', '.overlay',
                    '[role="banner"]', '[role="navigation"]', '[role="complementary"]',
                    '.cookie-banner', '.newsletter', '.subscription', '#comments'
                ];
                
                unwantedSelectors.forEach(selector => {
                    try {
                        const elements = document.querySelectorAll(selector);
                        elements.forEach(el => el.remove());
                    } catch (e) {}
                });

                // Try to find main content areas in order of preference
                const contentSelectors = [
                    'main[role="main"]', 'main', '[role="main"]',
                    '.main-content', '.content', '.post-content', 
                    '.article-content', '.page-content', '.entry-content',
                    'article', '.article', '.post', '.entry',
                    '#content', '#main', '#main-content',
                    '.container .content', '.wrapper .content'
                ];
                
                let mainContent = null;
                for (const selector of contentSelectors) {
                    try {
                        const element = document.querySelector(selector);
                        if (element && element.textContent.trim().length > 100) {
                            mainContent = element;
                            break;
                        }
                    } catch (e) {}
                }
                
                // If no main content found, try body but filter out navigation
                if (!mainContent) {
                    mainContent = document.body;
                    
                    // Remove likely navigation elements from body
                    const navElements = document.querySelectorAll('nav, .nav, .navigation, header, footer');
                    navElements.forEach(el => {
                        try {
                            el.remove();
                        } catch (e) {}
                    });
                }

                if (!mainContent) {
                    return 'No readable content found - page structure may be unusual';
                }

                // Extract meaningful text with proper formatting
                let extractedText = '';
                
                // Get all text nodes and organize them
                const walker = document.createTreeWalker(
                    mainContent,
                    NodeFilter.SHOW_TEXT,
                    {
                        acceptNode: function(node) {
                            // Skip empty or whitespace-only nodes
                            const text = node.textContent.trim();
                            if (!text || text.length < 3) {
                                return NodeFilter.FILTER_REJECT;
                            }
                            
                            // Skip nodes that are likely not content
                            const parent = node.parentElement;
                            if (parent) {
                                const tagName = parent.tagName.toLowerCase();
                                const className = parent.className || '';
                                const id = parent.id || '';
                                
                                // Skip navigation, menu, and other non-content elements
                                if (tagName === 'button' || tagName === 'input' || 
                                    className.includes('nav') || className.includes('menu') ||
                                    className.includes('button') || id.includes('nav')) {
                                    return NodeFilter.FILTER_REJECT;
                                }
                            }
                            
                            return NodeFilter.FILTER_ACCEPT;
                        }
                    },
                    false
                );

                const textBlocks = [];
                let node;
                
                while (node = walker.nextNode()) {
                    const text = node.textContent.trim();
                    if (text && text.length >= 3) {
                        const parent = node.parentElement;
                        const tagName = parent ? parent.tagName.toLowerCase() : '';
                        
                        // Add appropriate spacing based on element type
                        let formattedText = text;
                        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
                            formattedText = '\n\n=== ' + text + ' ===\n';
                        } else if (['p', 'div', 'li', 'td'].includes(tagName)) {
                            formattedText = text + '\n';
                        } else if (tagName === 'br') {
                            formattedText = '\n';
                        } else {
                            formattedText = text + ' ';
                        }
                        
                        textBlocks.push(formattedText);
                    }
                }
                
                // Join all text blocks
                extractedText = textBlocks.join('');
                
                // Clean up the final text
                extractedText = extractedText
                    // Remove excessive whitespace
                    .replace(/[ \t]+/g, ' ')
                    // Normalize line breaks
                    .replace(/\n\s*\n\s*\n/g, '\n\n')
                    // Remove leading/trailing whitespace from lines
                    .split('\n').map(line => line.trim()).join('\n')
                    // Remove empty lines at start/end
                    .trim();

                // Fallback: if we still don't have good content, try innerText
                if (!extractedText || extractedText.length < 50) {
                    extractedText = mainContent.innerText || mainContent.textContent || '';
                    extractedText = extractedText.trim();
                }

                // Final validation
                if (!extractedText || extractedText.length < 20) {
                    return 'Content extraction failed - page may contain mostly dynamic content or be protected';
                }

                return extractedText;
            });
            
            await context.close();
            return textContent || 'No readable text content found';
            
        } catch (error) {
            await context.close();
            console.error('Error in browser-based text extraction:', error);
            
            // Fallback to simple regex-based extraction
            return htmlContent
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim() || 'Text extraction failed - unable to parse content';
        }
        
    } catch (error) {
        console.error('Error extracting clean text:', error);
        return 'Error extracting content: ' + error.message;
    }
}

module.exports = {
    withTimeoutFallback,
    validateUrl,
    validateUrls,
    extractOptionsFromQuery,
    extractCleanText
};