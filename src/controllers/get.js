/**
 * GET Endpoints Controller
 * Handles GET requests for HTML, content, and other endpoints
 */

const RenderingService = require('../services/rendering');
const { validateUrl, extractOptionsFromQuery, extractCleanText } = require('../utils/helpers');
const { logger } = require('../utils/logger');
const { createErrorResponse } = require('../utils/errors');
const browserService = require('../services/browser');

class GetController {
    // HTML endpoint (GET version - returns raw HTML directly)
    static async getHtml(req, res) {
        const requestId = req.requestId;

        try {
            // Validate URL (from query parameter for GET)
            const { url } = req.query;
            const validation = validateUrl(url);
            if (!validation.valid) {
                return res.status(400).send(validation.error);
            }

            logger.info(requestId, `Advanced HTML rendering (GET): ${url}`);

            // Extract options from query parameters
            const options = extractOptionsFromQuery(req.query);

            const result = await RenderingService.renderPageAdvanced(options);

            logger.info(requestId, `Successfully rendered HTML (GET): ${url} (${result.wasTimeout ? 'with timeouts' : 'complete'})`);

            // Return raw HTML with proper headers
            res.set({
                'Content-Type': 'text/html; charset=utf-8',
                'X-Rendered-URL': result.url,
                'X-Page-Title': result.title,
                'X-Timestamp': result.timestamp,
                'X-Was-Timeout': result.wasTimeout.toString(),
                'X-Content-Length': result.contentLength.toString(),
                'X-Is-Emergency': (result.isEmergencyContent || false).toString()
            });
            res.send(result.html);
        } catch (error) {
            logger.error(requestId, 'HTML rendering error (GET)', error);
            const { statusCode, errorResponse } = createErrorResponse(error, req.query?.url);
            res.status(statusCode).send(`Error: ${error.message}`);
        }
    }

    // Content endpoint (GET version - returns clean text only)
    static async getContent(req, res) {
        const requestId = req.requestId;

        try {
            // Validate URL (from query parameter for GET)
            const { url } = req.query;
            const validation = validateUrl(url);
            if (!validation.valid) {
                return res.status(400).send(validation.error);
            }

            logger.info(requestId, `Advanced content extraction (GET): ${url}`);

            // Extract options from query parameters
            const options = extractOptionsFromQuery(req.query);

            const result = await RenderingService.renderPageAdvanced(options);

            // Extract clean text content
            const textContent = await extractCleanText(result.html, browserService);

            logger.info(requestId, `Successfully extracted content (GET): ${url} (${result.wasTimeout ? 'with timeouts' : 'complete'})`);
            logger.info(requestId, `Content length: ${textContent.length} characters`);

            // Return plain text with proper headers
            res.set({
                'Content-Type': 'text/plain; charset=utf-8',
                'X-Rendered-URL': result.url,
                'X-Page-Title': result.title,
                'X-Content-Length': textContent.length,
                'X-Timestamp': result.timestamp,
                'X-Was-Timeout': result.wasTimeout.toString(),
                'X-Is-Emergency': (result.isEmergencyContent || false).toString()
            });
            res.send(textContent);
        } catch (error) {
            logger.error(requestId, 'Content extraction error (GET)', error);
            const { statusCode } = createErrorResponse(error, req.query?.url);
            res.status(statusCode).send(`Error: ${error.message}`);
        }
    }

    // API documentation endpoint
    static getApiDocs(req, res) {
        const requestId = req.requestId;

        const documentation = {
            name: 'HeadlessX API',
            version: '1.2.0',
            description: 'Advanced Browserless Web Scraping API with Human-like Behavior',
            baseUrl: `${req.protocol}://${req.get('host')}`,
            authentication: {
                type: 'Token-based',
                description: 'Include token in query parameter, X-Token header, or Authorization header',
                example: '?token=your_token_here'
            },
            endpoints: {
                health: {
                    method: 'GET',
                    path: '/api/health',
                    description: 'Server health check',
                    authentication: false,
                    response: 'JSON with server status'
                },
                status: {
                    method: 'GET',
                    path: '/api/status',
                    description: 'Detailed server status and configuration',
                    authentication: true,
                    response: 'JSON with detailed server information'
                },
                render: {
                    method: 'POST',
                    path: '/api/render',
                    description: 'Full page rendering with comprehensive options',
                    authentication: true,
                    parameters: {
                        url: 'Required. URL to render',
                        timeout: 'Optional. Timeout in milliseconds (default: 120000)',
                        waitForSelectors: 'Optional. Array of CSS selectors to wait for',
                        clickSelectors: 'Optional. Array of CSS selectors to click',
                        customScript: 'Optional. Custom JavaScript to execute',
                        returnPartialOnTimeout: 'Optional. Return partial content on timeout'
                    },
                    response: 'JSON with HTML, title, URL, and metadata'
                },
                html: {
                    methods: ['POST', 'GET'],
                    path: '/api/html',
                    description: 'Raw HTML extraction',
                    authentication: true,
                    parameters: {
                        url: 'Required. URL to render (POST: body, GET: query)',
                        timeout: 'Optional. Timeout in milliseconds',
                        returnPartialOnTimeout: 'Optional. Return partial content on timeout'
                    },
                    response: 'Raw HTML content with custom headers'
                },
                content: {
                    methods: ['POST', 'GET'],
                    path: '/api/content',
                    description: 'Clean text content extraction',
                    authentication: true,
                    parameters: {
                        url: 'Required. URL to render (POST: body, GET: query)',
                        timeout: 'Optional. Timeout in milliseconds',
                        returnPartialOnTimeout: 'Optional. Return partial content on timeout'
                    },
                    response: 'Plain text content with custom headers'
                },
                screenshot: {
                    method: 'GET',
                    path: '/api/screenshot',
                    description: 'Generate page screenshot',
                    authentication: true,
                    parameters: {
                        url: 'Required. URL to screenshot',
                        fullPage: 'Optional. Full page screenshot (true/false)',
                        format: 'Optional. Image format (png/jpeg)',
                        width: 'Optional. Viewport width',
                        height: 'Optional. Viewport height'
                    },
                    response: 'Binary image data'
                },
                pdf: {
                    method: 'GET',
                    path: '/api/pdf',
                    description: 'Generate PDF from page',
                    authentication: true,
                    parameters: {
                        url: 'Required. URL to convert to PDF',
                        format: 'Optional. Page format (A4, Letter, etc.)',
                        marginTop: 'Optional. Top margin',
                        marginRight: 'Optional. Right margin',
                        marginBottom: 'Optional. Bottom margin',
                        marginLeft: 'Optional. Left margin'
                    },
                    response: 'Binary PDF data'
                },
                batch: {
                    method: 'POST',
                    path: '/api/batch',
                    description: 'Batch processing of multiple URLs',
                    authentication: true,
                    parameters: {
                        urls: 'Required. Array of URLs to process',
                        concurrency: 'Optional. Number of concurrent requests (max 3)',
                        '...options': 'Optional. Any rendering options applied to all URLs'
                    },
                    response: 'JSON with results and errors for each URL'
                }
            },
            features: [
                'Realistic Windows user agent rotation',
                'Human-like mouse movements and interactions',
                'Advanced stealth techniques to avoid bot detection',
                'Comprehensive header spoofing',
                'Natural scrolling patterns',
                'Emergency content extraction with fallback methods',
                'Multiple output formats (HTML, text, screenshots, PDFs)',
                'Batch processing with controlled concurrency',
                'Timeout handling with partial content recovery'
            ],
            examples: {
                basicHtml: {
                    method: 'POST',
                    url: '/api/html',
                    body: {
                        url: 'https://example.com'
                    }
                },
                advancedRendering: {
                    method: 'POST',
                    url: '/api/render',
                    body: {
                        url: 'https://example.com',
                        timeout: 60000,
                        waitForSelectors: ['.content', '#main'],
                        scrollToBottom: true,
                        returnPartialOnTimeout: true
                    }
                },
                batchProcessing: {
                    method: 'POST',
                    url: '/api/batch',
                    body: {
                        urls: ['https://example1.com', 'https://example2.com'],
                        concurrency: 2,
                        timeout: 30000
                    }
                }
            }
        };

        logger.info(requestId, 'API documentation requested');
        res.json(documentation);
    }
}

module.exports = GetController;
