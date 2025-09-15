// Optimized Content Extraction System for HeadlessX
// Reduces redundant operations and optimizes memory usage

const crypto = require('crypto');

class ContentCache {
    constructor(maxSize = 100, ttl = 300000) { // 5 minutes TTL
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttl = ttl;
        this.accessTimes = new Map();
        
        // Cleanup interval
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Clean every minute
    }
    
    // Generate cache key from URL and options
    generateKey(url, options = {}) {
        const keyObject = {
            url: url.split('#')[0], // Remove fragment
            viewport: options.viewport,
            waitUntil: options.waitUntil,
            userAgent: options.userAgent,
            customScript: options.customScript,
            removeElements: options.removeElements,
            scrollToBottom: options.scrollToBottom
        };
        return crypto.createHash('sha256').update(JSON.stringify(keyObject)).digest('hex').substring(0, 16);
    }
    
    // Check if content is cached and fresh
    get(key) {
        if (!this.cache.has(key)) return null;
        
        const item = this.cache.get(key);
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            this.accessTimes.delete(key);
            return null;
        }
        
        this.accessTimes.set(key, Date.now());
        return item.content;
    }
    
    // Store content in cache
    set(key, content) {
        // Evict oldest items if cache is full
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }
        
        this.cache.set(key, {
            content,
            timestamp: Date.now()
        });
        this.accessTimes.set(key, Date.now());
    }
    
    // Evict least recently used item
    evictOldest() {
        let oldestKey = null;
        let oldestTime = Date.now();
        
        for (const [key, time] of this.accessTimes) {
            if (time < oldestTime) {
                oldestTime = time;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.accessTimes.delete(oldestKey);
        }
    }
    
    // Clean up expired entries
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache) {
            if (now - item.timestamp > this.ttl) {
                this.cache.delete(key);
                this.accessTimes.delete(key);
            }
        }
    }
    
    // Get cache statistics
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            ttl: this.ttl,
            hitRate: this.hitRate || 0
        };
    }
    
    // Clear cache
    clear() {
        this.cache.clear();
        this.accessTimes.clear();
    }
    
    // Cleanup on destroy
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.clear();
    }
}

class OptimizedExtractor {
    constructor() {
        this.cache = new ContentCache();
        this.extractionStats = {
            requests: 0,
            cacheHits: 0,
            cacheMisses: 0,
            averageExtractionTime: 0,
            memoryOptimizations: 0
        };
    }
    
    // Check if content extraction can be cached
    isCacheable(options) {
        // Don't cache if:
        // - Taking screenshots or PDFs (unique outputs)
        // - Using custom scripts that might have side effects
        // - Has dynamic elements that change frequently
        return !options.screenshotPath && 
               !options.pdfPath && 
               !options.customScript && 
               !options.clickSelectors?.length &&
               options.waitUntil !== 'networkidle'; // Network activity indicates dynamic content
    }
    
    // Optimize content extraction with caching and memory management
    async extractOptimized(renderFunction, url, options = {}) {
        const startTime = Date.now();
        this.extractionStats.requests++;
        
        // Check cache first if content is cacheable
        let cacheKey = null;
        if (this.isCacheable(options)) {
            cacheKey = this.cache.generateKey(url, options);
            const cachedContent = this.cache.get(cacheKey);
            
            if (cachedContent) {
                this.extractionStats.cacheHits++;
                return {
                    ...cachedContent,
                    fromCache: true,
                    extractionTime: Date.now() - startTime
                };
            }
        }
        
        this.extractionStats.cacheMisses++;
        
        // Optimize options for memory efficiency
        const optimizedOptions = this.optimizeOptions(options);
        
        try {
            // Execute the rendering with optimized settings
            const result = await renderFunction(url, optimizedOptions);
            
            // Post-process and optimize the result
            const optimizedResult = this.optimizeResult(result);
            
            // Cache the result if appropriate
            if (cacheKey && optimizedResult.html) {
                this.cache.set(cacheKey, {
                    html: optimizedResult.html,
                    title: optimizedResult.title,
                    url: optimizedResult.url,
                    contentLength: optimizedResult.contentLength,
                    timestamp: optimizedResult.timestamp
                });
            }
            
            // Update statistics
            const extractionTime = Date.now() - startTime;
            this.extractionStats.averageExtractionTime = 
                (this.extractionStats.averageExtractionTime * (this.extractionStats.requests - 1) + extractionTime) / 
                this.extractionStats.requests;
            
            return {
                ...optimizedResult,
                fromCache: false,
                extractionTime
            };
            
        } catch (error) {
            // Don't cache errors, just re-throw
            throw error;
        }
    }
    
    // Optimize options for better memory usage and performance
    optimizeOptions(options) {
        const optimized = { ...options };
        
        // Reduce memory usage for large pages
        if (!optimized.viewport) {
            optimized.viewport = { width: 1366, height: 768 }; // Common resolution, smaller than default
        }
        
        // Optimize wait strategies
        if (!optimized.waitUntil) {
            optimized.waitUntil = 'domcontentloaded'; // Faster than networkidle for most cases
        }
        
        // Reduce unnecessary waits for performance
        if (optimized.extraWaitTime === undefined) {
            optimized.extraWaitTime = 5000; // Reduced from default 15000
        }
        
        // Disable console logging for better performance unless explicitly needed
        if (optimized.captureConsole === undefined) {
            optimized.captureConsole = false;
        }
        
        // Enable partial content return for better user experience
        if (optimized.returnPartialOnTimeout === undefined) {
            optimized.returnPartialOnTimeout = true;
        }
        
        this.extractionStats.memoryOptimizations++;
        
        return optimized;
    }
    
    // Optimize the result for memory efficiency
    optimizeResult(result) {
        const optimized = { ...result };
        
        // Compress large HTML content if needed
        if (optimized.html && optimized.html.length > 2000000) { // 2MB
            // Remove large embedded data URIs
            optimized.html = optimized.html.replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g, '[IMAGE_DATA_REMOVED]');
            optimized.html = optimized.html.replace(/data:video\/[^;]+;base64,[A-Za-z0-9+/=]+/g, '[VIDEO_DATA_REMOVED]');
            
            // Remove large inline styles and scripts if they're very long
            optimized.html = optimized.html.replace(/<style[^>]*>[\s\S]{10000,}?<\/style>/gi, '<style>/* LARGE_STYLE_REMOVED */</style>');
            optimized.html = optimized.html.replace(/<script[^>]*>[\s\S]{10000,}?<\/script>/gi, '<script>/* LARGE_SCRIPT_REMOVED */</script>');
            
            optimized.contentOptimized = true;
            optimized.originalContentLength = result.contentLength;
            optimized.contentLength = optimized.html.length;
        }
        
        // Remove or summarize console logs if they're excessive
        if (optimized.consoleLogs && optimized.consoleLogs.length > 100) {
            const errorLogs = optimized.consoleLogs.filter(log => log.type === 'error');
            const warningLogs = optimized.consoleLogs.filter(log => log.type === 'warn');
            
            optimized.consoleLogs = [
                ...errorLogs.slice(0, 10), // Keep first 10 errors
                ...warningLogs.slice(0, 10), // Keep first 10 warnings
                {
                    type: 'info',
                    text: `... and ${optimized.consoleLogs.length - 20} more log entries (truncated for memory optimization)`,
                    location: { url: '', lineNumber: 0, columnNumber: 0 }
                }
            ];
            optimized.consoleLogsOptimized = true;
        }
        
        return optimized;
    }
    
    // Extract clean text with memory optimization
    extractCleanText(html) {
        if (!html || typeof html !== 'string') return '';
        
        try {
            // Fast text extraction without full DOM parsing for large documents
            if (html.length > 1000000) { // 1MB
                // Use regex-based extraction for very large documents
                return this.extractTextRegex(html);
            } else {
                // Use more accurate but memory-intensive method for smaller documents
                return this.extractTextAccurate(html);
            }
        } catch (error) {
            console.warn('Text extraction failed, falling back to simple method:', error.message);
            return this.extractTextSimple(html);
        }
    }
    
    // Fast regex-based text extraction for large documents
    extractTextRegex(html) {
        return html
            // Remove script and style content
            .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
            // Remove HTML tags
            .replace(/<[^>]+>/g, ' ')
            // Decode common HTML entities
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            // Clean up whitespace
            .replace(/\s+/g, ' ')
            .trim();
    }
    
    // Accurate text extraction for smaller documents
    extractTextAccurate(html) {
        // More sophisticated extraction (simplified for this example)
        return this.extractTextRegex(html); // For now, use regex method
    }
    
    // Simple fallback text extraction
    extractTextSimple(html) {
        return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    
    // Get extraction statistics
    getStats() {
        return {
            ...this.extractionStats,
            cache: this.cache.getStats(),
            cacheHitRate: this.extractionStats.requests > 0 ? 
                (this.extractionStats.cacheHits / this.extractionStats.requests * 100).toFixed(2) + '%' : '0%'
        };
    }
    
    // Clear all caches and reset stats
    reset() {
        this.cache.clear();
        this.extractionStats = {
            requests: 0,
            cacheHits: 0,
            cacheMisses: 0,
            averageExtractionTime: 0,
            memoryOptimizations: 0
        };
    }
    
    // Cleanup on destroy
    destroy() {
        this.cache.destroy();
    }
}

// Create singleton instance
const optimizedExtractor = new OptimizedExtractor();

// Graceful shutdown
process.on('SIGINT', () => {
    optimizedExtractor.destroy();
});

process.on('SIGTERM', () => {
    optimizedExtractor.destroy();
});

module.exports = optimizedExtractor;