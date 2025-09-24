const crypto = require('crypto');

/**
 * Security utilities for HeadlessX
 * Provides basic content validation and security headers
 */

/**
 * Validate and sanitize response content
 * @param {*} content - The content to validate
 * @param {string} type - The content type (html, text, binary)
 * @returns {*} The validated content
 */
function validateContent(content, type = 'html') {
    if (!content) {
        return content;
    }

    // For binary content (images, PDFs), just return as-is
    if (type === 'binary' || Buffer.isBuffer(content)) {
        return content;
    }

    // For text content, ensure it's a string
    if (typeof content !== 'string') {
        content = String(content);
    }

    // Basic length validation to prevent extremely large responses
    const maxLength = process.env.MAX_RESPONSE_SIZE || (10 * 1024 * 1024); // 10MB default
    if (content.length > maxLength) {
        throw new Error('Response content exceeds maximum allowed size');
    }

    return content;
}

/**
 * Generate security headers for responses
 * @param {string} contentType - The content type
 * @returns {Object} Security headers object
 */
function getSecurityHeaders(contentType = 'text/html') {
    const headers = {
        'X-Content-Type-Options': 'nosniff',
        'X-Request-ID': crypto.randomUUID(),
        'X-Timestamp': new Date().toISOString()
    };

    // Add appropriate security headers based on content type
    if (contentType.startsWith('text/html')) {
        headers['X-Frame-Options'] = 'SAMEORIGIN';
        headers['X-XSS-Protection'] = '1; mode=block';
    }

    return headers;
}

/**
 * Safe response sender that includes security validation
 * @param {Object} res - Express response object
 * @param {*} content - Content to send
 * @param {string} contentType - Content type
 * @param {Object} customHeaders - Additional headers
 */
function sendSecureResponse(res, content, contentType = 'text/html; charset=utf-8', customHeaders = {}) {
    try {
        // Validate content
        const validatedContent = validateContent(content, contentType.split('/')[1]);
        
        // Get security headers
        const securityHeaders = getSecurityHeaders(contentType);
        
        // Combine all headers
        const allHeaders = {
            'Content-Type': contentType,
            ...securityHeaders,
            ...customHeaders
        };
        
        // Set headers and send response
        res.set(allHeaders);
        res.send(validatedContent);
    } catch (error) {
        // If validation fails, send error response
        res.status(500).json({
            error: 'Content validation failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = {
    validateContent,
    getSecurityHeaders,
    sendSecureResponse
};