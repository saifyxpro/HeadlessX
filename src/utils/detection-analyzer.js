/**
 * Detection Analyzer v1.3.0
 * Analyzes bot detection attempts and provides evasion strategies
 */

class DetectionAnalyzer {
    /**
     * Analyze page content for bot detection signatures
     */
    static analyzePageForDetection(html, url = '') {
        const detectionSignatures = {
            cloudflare: [
                /checking your browser/i,
                /cloudflare/i,
                /cf-ray/i,
                /ddos protection by cloudflare/i,
                /__cf_chl_jschl_tk__/i
            ],
            datadome: [
                /datadome/i,
                /blocked by datadome/i,
                /suspicious activity/i,
                /datadome\.co/i
            ],
            perimetex: [
                /perimeterx/i,
                /px-captcha/i,
                /human verification/i,
                /_px\d+/i
            ],
            incapsula: [
                /incapsula incident id/i,
                /incapsula/i,
                /access denied/i,
                /request blocked/i
            ],
            akamai: [
                /akamai/i,
                /reference #\d+\.\w+/i,
                /access denied/i,
                /bot manager/i
            ],
            general: [
                /captcha/i,
                /are you human/i,
                /prove you're not a robot/i,
                /automated traffic/i,
                /unusual traffic/i,
                /verification required/i,
                /access temporarily disabled/i
            ]
        };

        const detections = [];

        for (const [service, patterns] of Object.entries(detectionSignatures)) {
            for (const pattern of patterns) {
                if (pattern.test(html)) {
                    detections.push({
                        service,
                        pattern: pattern.toString(),
                        confidence: this.calculateDetectionConfidence(service, html)
                    });
                    break; // Only record one detection per service
                }
            }
        }

        return {
            detected: detections.length > 0,
            detections,
            riskLevel: this.calculateRiskLevel(detections),
            recommendations: this.generateRecommendations(detections, url)
        };
    }

    /**
     * Calculate detection confidence (0-100)
     */
    static calculateDetectionConfidence(service, html) {
        const serviceWeights = {
            cloudflare: 95,
            datadome: 90,
            perimetex: 85,
            incapsula: 80,
            akamai: 85,
            general: 70
        };

        let confidence = serviceWeights[service] || 70;

        // Increase confidence based on multiple indicators
        const keywords = html.toLowerCase();
        if (keywords.includes('javascript') && keywords.includes('challenge')) {
            confidence = Math.min(100, confidence + 10);
        }

        if (keywords.includes('captcha') || keywords.includes('recaptcha')) {
            confidence = Math.min(100, confidence + 15);
        }

        return confidence;
    }

    /**
     * Calculate overall risk level
     */
    static calculateRiskLevel(detections) {
        if (detections.length === 0) return 'low';

        const maxConfidence = Math.max(...detections.map(d => d.confidence));

        if (maxConfidence >= 90) return 'critical';
        if (maxConfidence >= 75) return 'high';
        if (maxConfidence >= 50) return 'medium';
        return 'low';
    }

    /**
     * Generate evasion recommendations
     */
    static generateRecommendations(detections, url) {
        const recommendations = [];

        if (detections.length === 0) {
            return ['No bot detection detected. Continue with current configuration.'];
        }

        const services = detections.map(d => d.service);

        if (services.includes('cloudflare')) {
            recommendations.push('Enable Cloudflare bypass with challenge solving');
            recommendations.push('Use residential proxy rotation');
            recommendations.push('Implement JA3/TLS fingerprint randomization');
            recommendations.push('Enable JavaScript challenge automation');
        }

        if (services.includes('datadome')) {
            recommendations.push('Enable DataDome evasion with advanced fingerprinting');
            recommendations.push('Use mouse movement simulation during page load');
            recommendations.push('Implement timing-based behavioral patterns');
            recommendations.push('Enable canvas/WebGL noise injection');
        }

        if (services.includes('perimetex')) {
            recommendations.push('Enable PerimeterX bypass with behavioral simulation');
            recommendations.push('Use consistent session fingerprinting');
            recommendations.push('Implement human-like interaction patterns');
        }

        if (services.includes('general') || services.some(s => ['incapsula', 'akamai'].includes(s))) {
            recommendations.push('Switch to higher-tier device profile (e.g., high-end-desktop)');
            recommendations.push('Enable comprehensive anti-detection mode');
            recommendations.push('Use different geolocation profile');
            recommendations.push('Increase human delay timings');
        }

        // Common recommendations for any detection
        recommendations.push('Consider using proxy rotation');
        recommendations.push('Reduce request frequency');
        recommendations.push('Enable maximum stealth mode');

        return [...new Set(recommendations)]; // Remove duplicates
    }

    /**
     * Analyze request patterns for suspicious behavior
     */
    static analyzeRequestPattern(requests) {
        const analysis = {
            suspiciousPatterns: [],
            riskScore: 0,
            recommendations: []
        };

        if (requests.length === 0) return analysis;

        // Check for rapid-fire requests
        const timestamps = requests.map(r => r.timestamp).sort();
        const intervals = [];
        for (let i = 1; i < timestamps.length; i++) {
            intervals.push(timestamps[i] - timestamps[i - 1]);
        }

        const avgInterval = intervals.reduce((sum, int) => sum + int, 0) / intervals.length;
        if (avgInterval < 1000) { // Less than 1 second between requests
            analysis.suspiciousPatterns.push('Rapid request frequency');
            analysis.riskScore += 30;
            analysis.recommendations.push('Increase delays between requests');
        }

        // Check for identical user agents
        const userAgents = [...new Set(requests.map(r => r.userAgent))];
        if (userAgents.length === 1 && requests.length > 10) {
            analysis.suspiciousPatterns.push('Static user agent across many requests');
            analysis.riskScore += 20;
            analysis.recommendations.push('Enable user agent rotation');
        }

        // Check for missing common headers
        const commonHeaders = ['accept', 'accept-language', 'accept-encoding'];
        const missingHeaders = requests.filter(r => {
            return commonHeaders.some(header => !r.headers[header]);
        });

        if (missingHeaders.length > 0) {
            analysis.suspiciousPatterns.push('Missing common browser headers');
            analysis.riskScore += 25;
            analysis.recommendations.push('Ensure all common headers are present');
        }

        return analysis;
    }
}

module.exports = DetectionAnalyzer;
