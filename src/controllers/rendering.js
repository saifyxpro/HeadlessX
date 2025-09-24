/**
 * Enhanced Rendering Controller v1.3.0
 * Handles page rendering with advanced anti-detection, fingerprinting, and behavioral simulation
 * Features: Device profiles, geolocation spoofing, behavioral patterns, advanced stealth
 */

const RenderingService = require('../services/rendering');
const { validateUrl } = require('../utils/helpers');
const { extractCleanText } = require('../utils/helpers');
const { logger } = require('../utils/logger');
const { createErrorResponse } = require('../utils/errors');
const browserService = require('../services/browser');

class RenderingController {
    
    /**
     * Enhanced main rendering endpoint with advanced anti-detection
     */
    static async renderPage(req, res) {
        const requestId = req.requestId;
        
        try {
            // Validate URL
            const { url } = req.body;
            const validation = validateUrl(url);
            if (!validation.valid) {
                return res.status(400).json({ 
                    error: validation.error,
                    timestamp: new Date().toISOString()
                });
            }

            logger.info(requestId, `Advanced v1.3.0 rendering request for: ${url}`);

            // Enhanced options with v1.3.0 features
            const options = { 
                ...req.body, 
                returnPartialOnTimeout: req.body.returnPartialOnTimeout === true,
                
                // v1.3.0 Anti-detection features
                deviceProfile: req.body.deviceProfile || 'mid-range-desktop',
                geoProfile: req.body.geoProfile || 'us-east',
                behaviorProfile: req.body.behaviorProfile || 'natural',
                enableCanvasSpoofing: req.body.enableCanvasSpoofing !== false,
                enableWebGLSpoofing: req.body.enableWebGLSpoofing !== false,
                enableAudioSpoofing: req.body.enableAudioSpoofing !== false,
                enableWebRTCBlocking: req.body.enableWebRTCBlocking !== false,
                enableAdvancedStealth: req.body.enableAdvancedStealth !== false,
                
                // Behavioral simulation
                simulateMouseMovement: req.body.simulateMouseMovement !== false,
                simulateScrolling: req.body.simulateScrolling !== false,
                simulateTyping: req.body.simulateTyping !== false,
                
                // Timing and performance
                humanDelays: req.body.humanDelays !== false,
                randomizeTimings: req.body.randomizeTimings !== false
            };
            
            const result = await RenderingService.renderPageAdvanced(options);
            
            // Enhanced logging with v1.3.0 metrics
            logger.info(requestId, `Successfully rendered: ${url} (${result.wasTimeout ? 'with timeouts' : 'complete'}) - Profile: ${options.deviceProfile}/${options.geoProfile}`);
            
            // Add v1.3.0 metadata to response
            result.metadata = {
                ...result.metadata,
                version: '1.3.0',
                deviceProfile: options.deviceProfile,
                geoProfile: options.geoProfile,
                behaviorProfile: options.behaviorProfile,
                antiDetectionFeatures: {
                    canvasSpoof: options.enableCanvasSpoofing,
                    webglSpoof: options.enableWebGLSpoofing,
                    audioSpoof: options.enableAudioSpoofing,
                    webrtcBlock: options.enableWebRTCBlocking,
                    advancedStealth: options.enableAdvancedStealth
                }
            };
            
            res.json(result);

        } catch (error) {
            logger.error(requestId, 'Enhanced rendering error', error);
            const { statusCode, errorResponse } = createErrorResponse(error, req.body?.url);
            res.status(statusCode).json(errorResponse);
        }
    }

    // HTML endpoint (returns raw HTML directly)
    static async renderHtml(req, res) {
        const requestId = req.requestId;
        
        try {
            // Validate URL
            const { url } = req.body;
            const validation = validateUrl(url);
            if (!validation.valid) {
                return res.status(400).send(validation.error);
            }

            logger.info(requestId, `Advanced HTML rendering for: ${url}`);

            // Disable partial content return by default - prioritize complete execution
            const options = { 
                ...req.body, 
                returnPartialOnTimeout: req.body.returnPartialOnTimeout === true 
            };
            
            const result = await RenderingService.renderPageAdvanced(options);
            
            logger.info(requestId, `Successfully rendered HTML: ${url} (${result.wasTimeout ? 'with timeouts' : 'complete'})`);
            
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
            logger.error(requestId, 'HTML rendering error', error);
            
            // Enhanced error response for HTML endpoint
            let statusCode = 500;
            let errorMessage = `Error: ${error.message}`;
            
            if (error.category) {
                const { statusCode: code, errorResponse } = createErrorResponse(error, req.body?.url);
                statusCode = code;
                errorMessage = `${errorResponse.errorType}: ${error.message}\nSuggestion: ${errorResponse.suggestion || 'Please try again.'}`;
            }
            
            res.status(statusCode).send(errorMessage);
        }
    }

    // Content endpoint (returns clean text only)
    static async renderContent(req, res) {
        const requestId = req.requestId;
        
        try {
            // Validate URL
            const { url } = req.body;
            const validation = validateUrl(url);
            if (!validation.valid) {
                return res.status(400).send(validation.error);
            }

            logger.info(requestId, `Advanced content extraction for: ${url}`);

            // Disable partial content return by default - prioritize complete execution
            const options = { 
                ...req.body, 
                returnPartialOnTimeout: req.body.returnPartialOnTimeout === true 
            };

            const result = await RenderingService.renderPageAdvanced(options);
            
            // Extract clean text content
            const textContent = await extractCleanText(result.html, browserService);
            
            logger.info(requestId, `Successfully extracted content: ${url} (${result.wasTimeout ? 'with timeouts' : 'complete'})`);
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
            logger.error(requestId, 'Content extraction error', error);
            const { statusCode, errorResponse } = createErrorResponse(error, req.body?.url);
            res.status(statusCode).send(`Error: ${error.message}`);
        }
    }

    // Enhanced screenshot endpoint with full CSS support
    static async renderScreenshot(req, res) {
        const requestId = req.requestId;
        
        try {
            // Get URL from query parameter
            const { url } = req.query;
            const validation = validateUrl(url);
            if (!validation.valid) {
                return res.status(400).send(validation.error);
            }

            logger.info(requestId, `Taking screenshot with full CSS for: ${url}`);

            // Build screenshot options from query parameters
            const screenshotOptions = {
                fullPage: req.query.fullPage === 'true',
                format: req.query.format === 'jpeg' ? 'jpeg' : 'png',
                quality: req.query.format === 'jpeg' ? (parseInt(req.query.quality) || 90) : undefined,
                viewport: {
                    width: parseInt(req.query.width) || 1920,
                    height: parseInt(req.query.height) || 1080
                }
            };

            // Use proper URL-based screenshot generation (not HTML content)
            const screenshotBuffer = await RenderingService.generateScreenshotFromUrl(url, screenshotOptions);
            
            logger.info(requestId, `Screenshot generated successfully: ${url} (${screenshotBuffer.length} bytes)`);
            
            // Return screenshot with proper headers
            const format = screenshotOptions.format;
            res.set({
                'Content-Type': `image/${format}`,
                'X-Rendered-URL': url,
                'X-Timestamp': new Date().toISOString(),
                'X-Screenshot-Size': screenshotBuffer.length.toString(),
                'Content-Disposition': `inline; filename="screenshot-${Date.now()}.${format}"`,
                'Content-Length': screenshotBuffer.length.toString()
            });
            res.send(screenshotBuffer);

        } catch (error) {
            logger.error(requestId, 'Screenshot generation error', error);
            const { statusCode } = createErrorResponse(error, req.query?.url);
            res.status(statusCode).send(`Screenshot Error: ${error.message}`);
        }
    }

    // Enhanced PDF endpoint with full CSS support
    static async renderPdf(req, res) {
        const requestId = req.requestId;
        
        try {
            // Get URL from query parameter
            const { url } = req.query;
            const validation = validateUrl(url);
            if (!validation.valid) {
                return res.status(400).send(validation.error);
            }

            logger.info(requestId, `Generating PDF with full CSS for: ${url}`);

            // Build PDF options from query parameters
            const pdfOptions = {
                format: req.query.format || 'A4',
                marginTop: req.query.marginTop || '20px',
                marginRight: req.query.marginRight || '20px',
                marginBottom: req.query.marginBottom || '20px',
                marginLeft: req.query.marginLeft || '20px'
            };

            // Generate PDF directly from URL (not HTML content)
            const pdfBuffer = await RenderingService.generatePDF(url, pdfOptions);
            
            logger.info(requestId, `PDF generated successfully: ${url} (${pdfBuffer.length} bytes)`);
            
            // Return PDF with proper headers
            res.set({
                'Content-Type': 'application/pdf',
                'X-Rendered-URL': url,
                'X-Timestamp': new Date().toISOString(),
                'X-PDF-Size': pdfBuffer.length.toString(),
                'Content-Disposition': `inline; filename="page-${Date.now()}.pdf"`,
                'Content-Length': pdfBuffer.length.toString()
            });
            res.send(pdfBuffer);

        } catch (error) {
            logger.error(requestId, 'PDF generation error', error);
            const { statusCode } = createErrorResponse(error, req.query?.url);
            res.status(statusCode).send(`PDF Error: ${error.message}`);
        }
    }
}

module.exports = RenderingController;