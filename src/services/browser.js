/**
 * Browser Management Service
 * Handles browser instance lifecycle, context management, and cleanup
 */

const { chromium } = require('playwright');
const config = require('../config');
const { BROWSER_LAUNCH_OPTIONS } = require('../config/browser');
const { logger, generateRequestId } = require('../utils/logger');
const { HeadlessXError, ERROR_CATEGORIES, handleError } = require('../utils/errors');

class BrowserService {
    constructor() {
        this.browserInstance = null;
        this.activeContexts = new Set(); // Track active contexts to prevent memory leaks
    }

    // Initialize persistent browser with better error handling
    async getBrowser() {
        if (!this.browserInstance || !this.browserInstance.isConnected()) {
            const requestId = generateRequestId();
            logger.info(requestId, 'Launching new realistic browser instance...');
            
            try {
                this.browserInstance = await chromium.launch(BROWSER_LAUNCH_OPTIONS);
                logger.info(requestId, 'Realistic browser launched successfully');
                
                // Handle browser disconnect
                this.browserInstance.on('disconnected', () => {
                    logger.warn(requestId, 'Browser disconnected, cleaning up contexts...');
                    this.browserInstance = null;
                    // Clean up active contexts
                    this.activeContexts.clear();
                });
                
            } catch (error) {
                const categorizedError = handleError(error, requestId, 'Browser launch');
                throw new HeadlessXError(
                    `Browser launch failed: ${error.message}`,
                    ERROR_CATEGORIES.BROWSER,
                    false,
                    error
                );
            }
        }
        return this.browserInstance;
    }

    // Clean context management function
    async createIsolatedContext(browser = null, options = {}) {
        const requestId = generateRequestId();
        
        if (!browser) {
            browser = await this.getBrowser();
        }
        
        try {
            const context = await browser.newContext(options);
            this.activeContexts.add(context);
            
            // Auto-cleanup on close
            context.on('close', () => {
                this.activeContexts.delete(context);
            });
            
            logger.debug(requestId, 'Isolated context created', { activeContexts: this.activeContexts.size });
            return context;
            
        } catch (error) {
            const categorizedError = handleError(error, requestId, 'Context creation');
            throw new HeadlessXError(
                `Failed to create browser context: ${error.message}`,
                ERROR_CATEGORIES.BROWSER,
                true,
                error
            );
        }
    }

    // Safe context cleanup
    async safeCloseContext(context, requestId = null) {
        if (!requestId) {
            requestId = generateRequestId();
        }
        
        if (context && !context._closed) {
            try {
                await context.close();
                this.activeContexts.delete(context);
                logger.debug(requestId, 'Context closed successfully');
            } catch (error) {
                logger.error(requestId, 'Failed to close context', { error: error.message });
            }
        }
    }

    // Get browser status and statistics
    getStatus() {
        return {
            connected: this.browserInstance ? this.browserInstance.isConnected() : false,
            activeContexts: this.activeContexts.size,
            type: 'Chromium'
        };
    }

    // Graceful shutdown of browser and all contexts
    async shutdown() {
        const requestId = generateRequestId();
        logger.info(requestId, 'Shutting down browser service...');
        
        try {
            // Close all active contexts first
            const contextPromises = Array.from(this.activeContexts).map(context => 
                this.safeCloseContext(context, requestId)
            );
            await Promise.all(contextPromises);
            
            // Close browser instance
            if (this.browserInstance && this.browserInstance.isConnected()) {
                await this.browserInstance.close();
                logger.info(requestId, 'Browser instance closed successfully');
            }
            
            this.browserInstance = null;
            this.activeContexts.clear();
            
        } catch (error) {
            logger.error(requestId, 'Error during browser shutdown', error);
        }
    }

    // Force cleanup of stale contexts (maintenance function)
    async cleanupStaleContexts() {
        const requestId = generateRequestId();
        logger.debug(requestId, 'Cleaning up stale contexts...');
        
        const staleContexts = [];
        for (const context of this.activeContexts) {
            try {
                // Try to access context - if it throws, it's stale
                await context.pages();
            } catch (error) {
                staleContexts.push(context);
            }
        }
        
        for (const staleContext of staleContexts) {
            this.activeContexts.delete(staleContext);
        }
        
        if (staleContexts.length > 0) {
            logger.info(requestId, `Cleaned up ${staleContexts.length} stale contexts`);
        }
    }
}

// Create singleton instance
const browserService = new BrowserService();

// Set up periodic cleanup
setInterval(() => {
    browserService.cleanupStaleContexts();
}, 5 * 60 * 1000); // Every 5 minutes

module.exports = browserService;