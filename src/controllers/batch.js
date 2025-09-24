/**
 * Batch Controller
 * Handles batch processing requests for multiple URLs
 */

const RenderingService = require('../services/rendering');
const { validateUrls } = require('../utils/helpers');
const { logger } = require('../utils/logger');
const { createErrorResponse } = require('../utils/errors');
const config = require('../config');

class BatchController {
    // Batch processing endpoint
    static async processBatch(req, res) {
        const requestId = req.requestId;

        try {
            // Validate URLs
            const { urls, concurrency = 3, ...commonOptions } = req.body;
            const validation = validateUrls(urls, config.api.maxBatchUrls);
            if (!validation.valid) {
                return res.status(400).json({
                    error: validation.error,
                    timestamp: new Date().toISOString()
                });
            }

            // Validate concurrency
            const maxConcurrency = Math.min(concurrency, config.browser.maxConcurrency);
            if (concurrency > config.browser.maxConcurrency) {
                logger.warn(requestId, `Concurrency reduced from ${concurrency} to ${maxConcurrency}`);
            }

            logger.info(requestId, `Batch processing ${urls.length} URLs with concurrency ${maxConcurrency}`);

            const results = [];
            const errors = [];

            // Process URLs in batches with controlled concurrency
            for (let i = 0; i < urls.length; i += maxConcurrency) {
                const batch = urls.slice(i, i + maxConcurrency);

                logger.debug(requestId, `Processing batch ${Math.floor(i / maxConcurrency) + 1}/${Math.ceil(urls.length / maxConcurrency)}`, {
                    urls: batch
                });

                const batchPromises = batch.map(async(url, index) => {
                    const batchItemId = `${requestId}_batch_${i + index}`;

                    try {
                        logger.info(batchItemId, `Starting batch item: ${url}`);

                        const options = {
                            ...commonOptions,
                            url,
                            returnPartialOnTimeout: commonOptions.returnPartialOnTimeout === true
                        };

                        const result = await RenderingService.renderPageAdvanced(options);

                        logger.info(batchItemId, `Batch item completed: ${url}`, {
                            contentLength: result.contentLength,
                            wasTimeout: result.wasTimeout
                        });

                        return {
                            url,
                            success: true,
                            result: {
                                ...result,
                                // Don't include full HTML in batch response to reduce size
                                html: result.html ? `[${result.html.length} characters]` : null
                            }
                        };
                    } catch (error) {
                        logger.error(batchItemId, `Batch item failed: ${url}`, error);

                        return {
                            url,
                            success: false,
                            error: error.message,
                            errorType: error.category || 'unknown',
                            isRecoverable: error.isRecoverable || false
                        };
                    }
                });

                const batchResults = await Promise.all(batchPromises);

                batchResults.forEach(item => {
                    if (item.success) {
                        results.push(item);
                    } else {
                        errors.push(item);
                    }
                });

                // Brief pause between batches to prevent overwhelming the system
                if (i + maxConcurrency < urls.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            const responseData = {
                batchId: requestId,
                totalUrls: urls.length,
                successful: results.length,
                failed: errors.length,
                concurrency: maxConcurrency,
                results,
                errors,
                processingTime: new Date().toISOString(),
                timestamp: new Date().toISOString()
            };

            logger.info(requestId, 'Batch processing completed', {
                totalUrls: urls.length,
                successful: results.length,
                failed: errors.length,
                successRate: Math.round((results.length / urls.length) * 100)
            });

            res.json(responseData);
        } catch (error) {
            logger.error(requestId, 'Batch processing error', error);
            const { statusCode, errorResponse } = createErrorResponse(error);
            res.status(statusCode).json({
                ...errorResponse,
                batchId: requestId,
                message: 'Batch processing failed'
            });
        }
    }

    // Get batch processing status (if we implement async batch processing in the future)
    static async getBatchStatus(req, res) {
        const requestId = req.requestId;
        const { batchId } = req.params;

        // This could be implemented with a job queue system like Bull or Agenda
        // For now, return a simple response
        res.json({
            message: 'Batch status endpoint not implemented',
            note: 'All batch requests are processed synchronously',
            batchId,
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = BatchController;
