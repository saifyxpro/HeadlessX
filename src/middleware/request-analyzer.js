/**
 * Request Analyzer Middleware
 * Advanced request pattern analysis and threat detection
 * HeadlessX v1.3.0 - Enhanced Anti-Detection
 */

const crypto = require('crypto');
const { logger } = require('../utils/logger');
const { HeadlessXError, ERROR_CATEGORIES } = require('../utils/errors');

class RequestAnalyzer {
    constructor() {
        this.requestPatterns = new Map();
        this.threatSignatures = this.initializeThreatSignatures();
        this.behaviorProfiles = new Map();
        this.logger = logger;
        
        // Analysis configuration
        this.config = {
            enableThreatDetection: true,
            enableBehaviorAnalysis: true,
            enableFingerprinting: true,
            alertThreshold: 0.7, // Threat score threshold
            blockThreshold: 0.9, // Auto-block threshold
            analysisWindow: 60 * 60 * 1000, // 1 hour analysis window
            maxStoredRequests: 1000
        };
    }

    /**
     * Initialize threat detection signatures
     */
    initializeThreatSignatures() {
        return {
            // SQL Injection patterns
            sqlInjection: {
                patterns: [
                    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
                    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
                    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
                    /((\%27)|(\'))union/i,
                    /(select|insert|delete|update|drop|create|alter|exec|execute)/i
                ],
                severity: 'high',
                category: 'injection'
            },
            
            // XSS patterns
            xss: {
                patterns: [
                    /<script[^>]*>.*?<\/script>/i,
                    /javascript:/i,
                    /on\w+\s*=/i,
                    /<iframe[^>]*>.*?<\/iframe>/i,
                    /eval\s*\(/i,
                    /expression\s*\(/i
                ],
                severity: 'high',
                category: 'xss'
            },
            
            // Command injection patterns
            commandInjection: {
                patterns: [
                    /[;&|`]|(\$\()|(\|\|)|(\&\&)/,
                    /(cat|ls|pwd|id|whoami|uname|grep|find|wget|curl)/i,
                    /\.\.\//,
                    /\/etc\/passwd/i,
                    /\/bin\/(sh|bash|zsh|csh)/i
                ],
                severity: 'critical',
                category: 'injection'
            },
            
            // Bot/Automation signatures
            automation: {
                patterns: [
                    /(bot|crawler|spider|scraper)/i,
                    /(selenium|puppeteer|playwright|headless)/i,
                    /(python|curl|wget|postman)/i,
                    /automated/i
                ],
                severity: 'medium',
                category: 'automation',
                checkHeaders: ['user-agent', 'x-automation', 'x-test']
            },
            
            // Suspicious scanning patterns
            scanning: {
                patterns: [
                    /\.(php|asp|jsp|cgi)$/i,
                    /admin|login|wp-admin|phpmyadmin/i,
                    /\.(git|svn|env|backup|bak)$/i,
                    /config\.(php|ini|json|xml|yml)/i
                ],
                severity: 'medium',
                category: 'reconnaissance'
            }
        };
    }

    /**
     * Main request analysis middleware
     */
    analyzeRequest() {
        return async (req, res, next) => {
            try {
                const startTime = Date.now();
                const clientIP = this.getClientIP(req);
                
                // Create request signature
                const requestSignature = this.createRequestSignature(req);
                
                // Perform threat analysis
                const threatAnalysis = this.performThreatAnalysis(req);
                
                // Perform behavior analysis
                const behaviorAnalysis = this.performBehaviorAnalysis(req, clientIP);
                
                // Create fingerprint
                const fingerprint = this.createRequestFingerprint(req);
                
                // Calculate overall risk score
                const riskScore = this.calculateRiskScore(threatAnalysis, behaviorAnalysis);
                
                // Store analysis results
                const analysisResult = {
                    timestamp: startTime,
                    ip: clientIP,
                    signature: requestSignature,
                    threats: threatAnalysis,
                    behavior: behaviorAnalysis,
                    fingerprint,
                    riskScore,
                    processingTime: Date.now() - startTime
                };
                
                // Add to request object for downstream use
                req.analysis = analysisResult;
                
                // Log analysis if risk score is elevated
                if (riskScore > this.config.alertThreshold) {
                    this.logger.warn('Elevated risk request detected', {
                        ip: clientIP,
                        riskScore,
                        threats: threatAnalysis.detected,
                        path: req.path,
                        userAgent: req.get('User-Agent')
                    });
                }
                
                // Block request if risk score is too high
                if (riskScore > this.config.blockThreshold) {
                    return this.blockSuspiciousRequest(req, res, analysisResult);
                }
                
                // Store request pattern for learning
                this.storeRequestPattern(clientIP, analysisResult);
                
                next();
                
            } catch (error) {
                this.logger.error('Request analysis failed:', error);
                // Continue processing on analysis failure
                next();
            }
        };
    }

    /**
     * Perform threat detection analysis
     */
    performThreatAnalysis(req) {
        const threats = {
            detected: [],
            score: 0,
            categories: new Set()
        };
        
        // Analyze URL, query parameters, and body
        const analysisTargets = [
            { name: 'url', content: req.url },
            { name: 'query', content: JSON.stringify(req.query) },
            { name: 'body', content: JSON.stringify(req.body) }
        ];
        
        // Check headers for automation signatures
        const headers = req.headers;
        analysisTargets.push({ 
            name: 'headers', 
            content: JSON.stringify(headers) 
        });
        
        // Run threat detection
        for (const [threatType, signature] of Object.entries(this.threatSignatures)) {
            for (const target of analysisTargets) {
                if (!target.content) continue;
                
                // Check patterns
                for (const pattern of signature.patterns) {
                    if (pattern.test(target.content)) {
                        threats.detected.push({
                            type: threatType,
                            severity: signature.severity,
                            category: signature.category,
                            location: target.name,
                            pattern: pattern.toString()
                        });
                        
                        threats.categories.add(signature.category);
                        threats.score += this.getSeverityScore(signature.severity);
                        break;
                    }
                }
                
                // Check specific headers for automation signatures
                if (signature.checkHeaders && target.name === 'headers') {
                    for (const headerName of signature.checkHeaders) {
                        const headerValue = headers[headerName];
                        if (headerValue) {
                            for (const pattern of signature.patterns) {
                                if (pattern.test(headerValue)) {
                                    threats.detected.push({
                                        type: threatType,
                                        severity: signature.severity,
                                        category: signature.category,
                                        location: `header:${headerName}`,
                                        pattern: pattern.toString()
                                    });
                                    
                                    threats.categories.add(signature.category);
                                    threats.score += this.getSeverityScore(signature.severity);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Normalize score (0-1 range)
        threats.score = Math.min(threats.score / 10, 1);
        threats.categories = Array.from(threats.categories);
        
        return threats;
    }

    /**
     * Perform behavioral analysis
     */
    performBehaviorAnalysis(req, ip) {
        const now = Date.now();
        
        // Get or create behavior profile
        if (!this.behaviorProfiles.has(ip)) {
            this.behaviorProfiles.set(ip, {
                firstSeen: now,
                requests: [],
                patterns: {
                    userAgents: new Set(),
                    paths: new Set(),
                    methods: new Set()
                }
            });
        }
        
        const profile = this.behaviorProfiles.get(ip);
        
        // Add current request
        const requestData = {
            timestamp: now,
            method: req.method,
            path: req.path,
            userAgent: req.get('User-Agent'),
            referer: req.get('Referer'),
            acceptLanguage: req.get('Accept-Language')
        };
        
        profile.requests.push(requestData);
        profile.patterns.userAgents.add(requestData.userAgent);
        profile.patterns.paths.add(requestData.path);
        profile.patterns.methods.add(requestData.method);
        
        // Keep only recent requests
        const windowStart = now - this.config.analysisWindow;
        profile.requests = profile.requests.filter(r => r.timestamp > windowStart);
        
        // Analyze behavior patterns
        const analysis = {
            requestFrequency: this.calculateRequestFrequency(profile.requests),
            userAgentConsistency: profile.patterns.userAgents.size === 1,
            pathDiversity: profile.patterns.paths.size / profile.requests.length,
            temporalPattern: this.analyzeTemporalPattern(profile.requests),
            suspiciousSequences: this.detectSuspiciousSequences(profile.requests),
            humanLikeScore: this.calculateHumanLikeScore(profile)
        };
        
        return analysis;
    }

    /**
     * Calculate request frequency
     */
    calculateRequestFrequency(requests) {
        if (requests.length < 2) return 0;
        
        const timeSpan = requests[requests.length - 1].timestamp - requests[0].timestamp;
        return requests.length / (timeSpan / 1000); // requests per second
    }

    /**
     * Analyze temporal patterns
     */
    analyzeTemporalPattern(requests) {
        if (requests.length < 3) return { regular: false, intervals: [] };
        
        const intervals = [];
        for (let i = 1; i < requests.length; i++) {
            intervals.push(requests[i].timestamp - requests[i - 1].timestamp);
        }
        
        // Check for regular intervals (bot-like behavior)
        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
        const standardDeviation = Math.sqrt(variance);
        
        const isRegular = standardDeviation < avgInterval * 0.1; // Less than 10% variation
        
        return {
            regular: isRegular,
            intervals,
            avgInterval,
            standardDeviation
        };
    }

    /**
     * Detect suspicious request sequences
     */
    detectSuspiciousSequences(requests) {
        const sequences = [];
        
        // Look for rapid sequential requests to same path
        const pathGroups = {};
        requests.forEach(req => {
            if (!pathGroups[req.path]) pathGroups[req.path] = [];
            pathGroups[req.path].push(req);
        });
        
        for (const [path, pathRequests] of Object.entries(pathGroups)) {
            if (pathRequests.length > 5) {
                const rapidRequests = pathRequests.filter((req, index) => {
                    if (index === 0) return false;
                    return req.timestamp - pathRequests[index - 1].timestamp < 1000; // Less than 1 second apart
                });
                
                if (rapidRequests.length > 3) {
                    sequences.push({
                        type: 'rapid_sequential',
                        path,
                        count: rapidRequests.length
                    });
                }
            }
        }
        
        return sequences;
    }

    /**
     * Calculate human-like behavior score
     */
    calculateHumanLikeScore(profile) {
        let score = 1.0;
        
        // Penalize for too consistent user agent
        if (profile.patterns.userAgents.size === 1 && profile.requests.length > 10) {
            score -= 0.2;
        }
        
        // Penalize for too regular timing
        if (profile.requests.length > 5) {
            const temporal = this.analyzeTemporalPattern(profile.requests);
            if (temporal.regular) {
                score -= 0.3;
            }
        }
        
        // Penalize for too high frequency
        const frequency = this.calculateRequestFrequency(profile.requests);
        if (frequency > 5) { // More than 5 requests per second
            score -= 0.4;
        }
        
        // Penalize for lack of referrer headers
        const hasReferrers = profile.requests.some(req => req.referer);
        if (!hasReferrers && profile.requests.length > 5) {
            score -= 0.1;
        }
        
        return Math.max(0, score);
    }

    /**
     * Create request signature for duplicate detection
     */
    createRequestSignature(req) {
        const signatureData = {
            method: req.method,
            path: req.path,
            query: req.query,
            userAgent: req.get('User-Agent'),
            contentType: req.get('Content-Type')
        };
        
        return crypto.createHash('sha256')
            .update(JSON.stringify(signatureData))
            .digest('hex')
            .substring(0, 16);
    }

    /**
     * Create request fingerprint
     */
    createRequestFingerprint(req) {
        const headers = req.headers;
        
        return {
            userAgent: headers['user-agent'],
            acceptLanguage: headers['accept-language'],
            acceptEncoding: headers['accept-encoding'],
            connection: headers['connection'],
            cacheControl: headers['cache-control'],
            dnt: headers['dnt'],
            upgradeInsecureRequests: headers['upgrade-insecure-requests'],
            secFetch: {
                dest: headers['sec-fetch-dest'],
                mode: headers['sec-fetch-mode'],
                site: headers['sec-fetch-site'],
                user: headers['sec-fetch-user']
            }
        };
    }

    /**
     * Calculate overall risk score
     */
    calculateRiskScore(threatAnalysis, behaviorAnalysis) {
        let score = 0;
        
        // Threat score contributes 60%
        score += threatAnalysis.score * 0.6;
        
        // Behavior score contributes 40%
        const behaviorRisk = 1 - behaviorAnalysis.humanLikeScore;
        score += behaviorRisk * 0.4;
        
        // Additional penalties
        if (threatAnalysis.categories.includes('injection')) {
            score += 0.3; // High penalty for injection attempts
        }
        
        if (behaviorAnalysis.suspiciousSequences.length > 0) {
            score += 0.2; // Penalty for suspicious sequences
        }
        
        if (behaviorAnalysis.requestFrequency > 10) {
            score += 0.25; // High frequency penalty
        }
        
        return Math.min(score, 1);
    }

    /**
     * Get severity score for normalization
     */
    getSeverityScore(severity) {
        const scores = {
            low: 1,
            medium: 3,
            high: 6,
            critical: 10
        };
        
        return scores[severity] || 1;
    }

    /**
     * Block suspicious request
     */
    blockSuspiciousRequest(req, res, analysis) {
        const error = new HeadlessXError(
            'Request blocked due to security analysis',
            403,
            ERROR_CATEGORIES.SECURITY,
            {
                riskScore: analysis.riskScore,
                threats: analysis.threats.detected,
                requestId: analysis.signature
            }
        );
        
        this.logger.error('Request blocked', {
            ip: analysis.ip,
            riskScore: analysis.riskScore,
            threats: analysis.threats.detected,
            path: req.path
        });
        
        res.status(403).json({
            error: 'Access Denied',
            message: 'Request blocked by security analysis',
            code: error.code,
            requestId: analysis.signature,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Store request pattern for learning
     */
    storeRequestPattern(ip, analysis) {
        if (!this.requestPatterns.has(ip)) {
            this.requestPatterns.set(ip, []);
        }
        
        const patterns = this.requestPatterns.get(ip);
        patterns.push(analysis);
        
        // Keep only recent patterns
        const maxAge = Date.now() - this.config.analysisWindow;
        const recentPatterns = patterns.filter(p => p.timestamp > maxAge);
        
        // Limit storage
        if (recentPatterns.length > this.config.maxStoredRequests) {
            recentPatterns.splice(0, recentPatterns.length - this.config.maxStoredRequests);
        }
        
        this.requestPatterns.set(ip, recentPatterns);
    }

    /**
     * Get client IP address
     */
    getClientIP(req) {
        return req.ip ||
               req.connection.remoteAddress ||
               req.socket.remoteAddress ||
               req.headers['x-forwarded-for']?.split(',')[0] ||
               req.headers['x-real-ip'] ||
               'unknown';
    }

    /**
     * Get analysis statistics
     */
    getStatistics() {
        const now = Date.now();
        const recentWindow = now - (15 * 60 * 1000); // Last 15 minutes
        
        let totalRequests = 0;
        let threatsDetected = 0;
        let highRiskRequests = 0;
        
        for (const patterns of this.requestPatterns.values()) {
            const recentPatterns = patterns.filter(p => p.timestamp > recentWindow);
            totalRequests += recentPatterns.length;
            
            recentPatterns.forEach(pattern => {
                if (pattern.threats.detected.length > 0) threatsDetected++;
                if (pattern.riskScore > this.config.alertThreshold) highRiskRequests++;
            });
        }
        
        return {
            totalRequests,
            threatsDetected,
            highRiskRequests,
            trackedIPs: this.requestPatterns.size,
            behaviorProfiles: this.behaviorProfiles.size,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Clean up old data
     */
    cleanup() {
        const now = Date.now();
        const maxAge = now - this.config.analysisWindow;
        
        // Clean request patterns
        for (const [ip, patterns] of this.requestPatterns.entries()) {
            const recentPatterns = patterns.filter(p => p.timestamp > maxAge);
            if (recentPatterns.length === 0) {
                this.requestPatterns.delete(ip);
            } else {
                this.requestPatterns.set(ip, recentPatterns);
            }
        }
        
        // Clean behavior profiles
        for (const [ip, profile] of this.behaviorProfiles.entries()) {
            profile.requests = profile.requests.filter(r => r.timestamp > maxAge);
            if (profile.requests.length === 0) {
                this.behaviorProfiles.delete(ip);
            }
        }
        
        this.logger.debug('Request analyzer cleanup completed');
    }

    /**
     * Start periodic cleanup
     */
    startCleanupSchedule() {
        setInterval(() => {
            this.cleanup();
        }, 30 * 60 * 1000); // Clean every 30 minutes
    }
}

// Create singleton instance
const requestAnalyzer = new RequestAnalyzer();

// Start cleanup schedule
requestAnalyzer.startCleanupSchedule();

module.exports = {
    RequestAnalyzer,
    requestAnalyzer,
    analyzeRequest: requestAnalyzer.analyzeRequest()
};