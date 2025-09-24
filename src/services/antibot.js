/**
 * Anti-Bot Detection Service v1.3.0
 * Detects and analyzes various bot detection systems
 */

const { logger } = require('../utils/logger');

class AntiBotService {
    constructor() {
        this.detectionPatterns = {
            cloudflare: [
                'ray id',
                'cloudflare',
                'cf-ray',
                'checking your browser',
                'ddos protection'
            ],
            datadome: [
                'datadome',
                'dd_cookie',
                'blocked by datadome',
                'suspicious activity'
            ],
            incapsula: [
                'incapsula',
                'incap_ses',
                'visid_incap',
                'blocked by imperva'
            ],
            akamai: [
                'akamai',
                '_abck',
                'blocked by akamai',
                'reference id'
            ],
            recaptcha: [
                'recaptcha',
                'i\'m not a robot',
                'g-recaptcha',
                'captcha'
            ]
        };
    }

    /**
   * Analyze page for bot detection systems
   */
    async analyzePage(page) {
        try {
            const content = await page.content();
            const url = page.url();

            const detections = {
                url,
                timestamp: new Date().toISOString(),
                detected: [],
                confidence: 0,
                recommendations: []
            };

            // Check for each detection system
            for (const [system, patterns] of Object.entries(this.detectionPatterns)) {
                const matches = patterns.filter(pattern =>
                    content.toLowerCase().includes(pattern.toLowerCase())
                );

                if (matches.length > 0) {
                    detections.detected.push({
                        system,
                        matches,
                        confidence: Math.min(matches.length * 25, 100)
                    });
                }
            }

            // Calculate overall confidence
            if (detections.detected.length > 0) {
                detections.confidence = Math.min(
                    detections.detected.reduce((sum, d) => sum + d.confidence, 0) / detections.detected.length,
                    100
                );
            }

            // Generate recommendations
            detections.recommendations = this.generateRecommendations(detections.detected);

            logger.info('Bot detection analysis completed', {
                url,
                detectionsFound: detections.detected.length,
                confidence: detections.confidence
            });

            return detections;
        } catch (error) {
            logger.error('Bot detection analysis failed:', error);
            return {
                url: page.url(),
                error: error.message,
                detected: [],
                confidence: 0,
                recommendations: ['Enable stealth mode', 'Use different user agent']
            };
        }
    }

    /**
   * Generate evasion recommendations based on detected systems
   */
    generateRecommendations(detections) {
        const recommendations = [];

        detections.forEach(detection => {
            switch (detection.system) {
            case 'cloudflare':
                recommendations.push('Enable Cloudflare bypass');
                recommendations.push('Use residential proxy');
                recommendations.push('Implement TLS fingerprinting');
                break;
            case 'datadome':
                recommendations.push('Enable DataDome bypass');
                recommendations.push('Implement behavioral simulation');
                recommendations.push('Use mobile user agent');
                break;
            case 'incapsula':
                recommendations.push('Rotate user agents frequently');
                recommendations.push('Implement session management');
                recommendations.push('Use HTTP/2 fingerprinting');
                break;
            case 'akamai':
                recommendations.push('Enable advanced stealth mode');
                recommendations.push('Implement sensor data spoofing');
                recommendations.push('Use distributed requests');
                break;
            case 'recaptcha':
                recommendations.push('Implement CAPTCHA solving');
                recommendations.push('Use human-like interactions');
                recommendations.push('Enable mouse movement simulation');
                break;
            }
        });

        // Remove duplicates
        return [...new Set(recommendations)];
    }

    /**
   * Check for common bot detection JavaScript
   */
    async detectJavaScriptSignatures(page) {
        try {
            return await page.evaluate(() => {
                const signatures = {
                    automation: !!navigator.webdriver,
                    headless: navigator.userAgent.includes('HeadlessChrome'),
                    phantomjs: !!window.callPhantom,
                    selenium: !!window.__webdriver_evaluate,
                    webdriver: !!document.__webdriver_unwrapped,
                    chromeRuntime: !!window.chrome && !!window.chrome.runtime
                };

                return signatures;
            });
        } catch (error) {
            logger.error('JavaScript signature detection failed:', error);
            return {};
        }
    }

    /**
   * Monitor network requests for bot detection patterns
   */
    async monitorNetworkRequests(page) {
        const suspiciousRequests = [];

        page.on('request', request => {
            const url = request.url();
            const headers = request.headers();

            // Check for bot detection related requests
            const suspicious = this.isSuspiciousRequest(url, headers);

            if (suspicious.detected) {
                suspiciousRequests.push({
                    url,
                    headers,
                    timestamp: Date.now(),
                    reason: suspicious.reason
                });
            }
        });

        return suspiciousRequests;
    }

    /**
   * Check if request is related to bot detection
   */
    isSuspiciousRequest(url, headers) {
        const suspiciousPatterns = [
            'datadome',
            'cloudflare',
            'incapsula',
            'akamai',
            'recaptcha',
            'hcaptcha',
            'funcaptcha',
            'bot-detection',
            'anti-bot',
            'challenge',
            'fingerprint'
        ];

        for (const pattern of suspiciousPatterns) {
            if (url.toLowerCase().includes(pattern)) {
                return {
                    detected: true,
                    reason: `URL contains suspicious pattern: ${pattern}`
                };
            }
        }

        // Check headers
        const suspiciousHeaders = ['x-requested-with', 'x-real-ip', 'cf-ray'];
        for (const header of suspiciousHeaders) {
            if (headers[header]) {
                return {
                    detected: true,
                    reason: `Contains suspicious header: ${header}`
                };
            }
        }

        return { detected: false };
    }

    /**
   * Generate comprehensive bot detection report
   */
    async generateReport(page) {
        try {
            const pageAnalysis = await this.analyzePage(page);
            const jsSignatures = await this.detectJavaScriptSignatures(page);
            const networkRequests = await this.monitorNetworkRequests(page);

            const report = {
                timestamp: new Date().toISOString(),
                url: page.url(),
                pageAnalysis,
                javascriptSignatures: jsSignatures,
                networkAnalysis: {
                    suspiciousRequests: networkRequests.length,
                    requests: networkRequests.slice(0, 10) // Limit to first 10
                },
                overallThreatLevel: this.calculateThreatLevel(pageAnalysis, jsSignatures, networkRequests),
                recommendations: this.consolidateRecommendations(pageAnalysis, jsSignatures)
            };

            logger.info('Bot detection report generated', {
                url: page.url(),
                threatLevel: report.overallThreatLevel,
                detectionsFound: pageAnalysis.detected.length
            });

            return report;
        } catch (error) {
            logger.error('Report generation failed:', error);
            return {
                timestamp: new Date().toISOString(),
                url: page.url(),
                error: error.message,
                overallThreatLevel: 'unknown'
            };
        }
    }

    /**
   * Calculate overall threat level
   */
    calculateThreatLevel(pageAnalysis, jsSignatures, networkRequests) {
        let threatScore = 0;

        // Page analysis contribution
        threatScore += pageAnalysis.confidence * 0.4;

        // JavaScript signatures contribution
        const jsThreats = Object.values(jsSignatures).filter(Boolean).length;
        threatScore += (jsThreats / Object.keys(jsSignatures).length) * 100 * 0.3;

        // Network requests contribution
        threatScore += Math.min(networkRequests.length * 10, 100) * 0.3;

        if (threatScore >= 80) return 'critical';
        if (threatScore >= 60) return 'high';
        if (threatScore >= 40) return 'medium';
        if (threatScore >= 20) return 'low';
        return 'minimal';
    }

    /**
   * Consolidate recommendations from all analyses
   */
    consolidateRecommendations(pageAnalysis, jsSignatures) {
        const recommendations = [...pageAnalysis.recommendations];

        // Add JS signature-based recommendations
        if (jsSignatures.automation) {
            recommendations.push('Disable webdriver flag');
        }
        if (jsSignatures.headless) {
            recommendations.push('Use full browser mode');
        }
        if (jsSignatures.phantomjs || jsSignatures.selenium) {
            recommendations.push('Switch to Playwright/Puppeteer');
        }

        return [...new Set(recommendations)];
    }
}

module.exports = { AntiBotService };
