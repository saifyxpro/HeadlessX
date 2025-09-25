/**
 * WAF Bypass Techniques
 * Advanced Web Application Firewall bypass methods
 * HeadlessX v1.3.0 - Enhanced Anti-Detection
 */

const crypto = require('crypto');
const { logger } = require('../../utils/logger');

class WAFBypass {
    constructor() {
        this.wafSignatures = this.initializeWAFSignatures();
        this.bypassTechniques = this.initializeBypassTechniques();
        this.logger = logger;
    }

    /**
     * Initialize known WAF signatures and detection patterns
     */
    initializeWAFSignatures() {
        return {
            cloudflare: {
                headers: ['cf-ray', 'cf-cache-status', 'cf-request-id'],
                responses: ['cloudflare', 'cf-browser-verification'],
                challenges: ['cf_challenge_response', 'cf_clearance'],
                rateLimit: 'cf-ratelimit',
                botFight: 'cf-bot-verification'
            },
            datadome: {
                headers: ['x-datadome-cid', 'x-datadome-session'],
                cookies: ['datadome'],
                responses: ['datadome', 'geo.captcha-delivery.com'],
                challenges: ['dd_challenge', 'dd_captcha']
            },
            akamai: {
                headers: ['akamai-ghost-ip', 'akamai-origin-hop'],
                cookies: ['_abck', 'ak_bmsc'],
                responses: ['akamai', 'edgekey.net'],
                challenges: ['akamai_challenge', 'sensor_data']
            },
            incapsula: {
                headers: ['x-iinfo', 'x-cdn'],
                cookies: ['incap_ses', 'nlbi', 'visid_incap'],
                responses: ['incapsula', 'imperva'],
                challenges: ['incap_challenge']
            },
            aws: {
                headers: ['x-amzn-trace-id', 'x-amzn-requestid'],
                responses: ['aws', 'cloudfront'],
                challenges: ['aws_waf_captcha']
            },
            generic: {
                patterns: [
                    'blocked', 'forbidden', 'suspicious',
                    'rate limit', 'too many requests',
                    'bot detected', 'automation detected'
                ]
            }
        };
    }

    /**
     * Initialize WAF bypass techniques
     */
    initializeBypassTechniques() {
        return {
            headerRotation: {
                userAgents: [
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
                ],
                acceptHeaders: [
                    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                ],
                acceptLanguage: [
                    'en-US,en;q=0.9',
                    'en-US,en;q=0.5',
                    'en-GB,en-US;q=0.9,en;q=0.8'
                ],
                acceptEncoding: [
                    'gzip, deflate, br',
                    'gzip, deflate',
                    'br, gzip, deflate'
                ]
            },
            requestTiming: {
                minDelay: 1000,
                maxDelay: 5000,
                burstLimit: 3,
                burstCooldown: 30000
            },
            ipRotation: {
                enabled: false, // Would require proxy support
                proxySources: []
            },
            cookieManagement: {
                preserveSession: true,
                rotateFingerprint: false,
                clearOnBlock: true
            }
        };
    }

    /**
     * Detect WAF presence and type from response
     */
    async detectWAF(response, headers = {}) {
        const detectedWAFs = [];
        const responseText = response ? await response.text().catch(() => '') : '';
        const responseHeaders = response ? response.headers() : {};
        const allHeaders = { ...responseHeaders, ...headers };
        
        // Check each WAF signature
        for (const [wafName, signatures] of Object.entries(this.wafSignatures)) {
            let confidence = 0;
            const indicators = [];
            
            // Check headers
            if (signatures.headers) {
                for (const header of signatures.headers) {
                    if (Object.keys(allHeaders).some(h => h.toLowerCase().includes(header.toLowerCase()))) {
                        confidence += 30;
                        indicators.push(`header:${header}`);
                    }
                }
            }
            
            // Check cookies
            if (signatures.cookies) {
                const cookieHeader = allHeaders['set-cookie'] || allHeaders['cookie'] || '';
                for (const cookie of signatures.cookies) {
                    if (cookieHeader.toLowerCase().includes(cookie.toLowerCase())) {
                        confidence += 25;
                        indicators.push(`cookie:${cookie}`);
                    }
                }
            }
            
            // Check response content
            if (signatures.responses) {
                for (const pattern of signatures.responses) {
                    if (responseText.toLowerCase().includes(pattern.toLowerCase())) {
                        confidence += 40;
                        indicators.push(`content:${pattern}`);
                    }
                }
            }
            
            // Check challenge patterns
            if (signatures.challenges) {
                for (const challenge of signatures.challenges) {
                    if (responseText.toLowerCase().includes(challenge.toLowerCase())) {
                        confidence += 50;
                        indicators.push(`challenge:${challenge}`);
                    }
                }
            }
            
            // Check generic patterns
            if (signatures.patterns) {
                for (const pattern of signatures.patterns) {
                    if (responseText.toLowerCase().includes(pattern.toLowerCase())) {
                        confidence += 20;
                        indicators.push(`pattern:${pattern}`);
                    }
                }
            }
            
            if (confidence > 30) {
                detectedWAFs.push({
                    name: wafName,
                    confidence,
                    indicators
                });
            }
        }
        
        // Sort by confidence
        detectedWAFs.sort((a, b) => b.confidence - a.confidence);
        
        return detectedWAFs;
    }

    /**
     * Apply WAF bypass techniques to page
     */
    async applyWAFBypass(page, detectedWAFs = []) {
        try {
            const primaryWAF = detectedWAFs[0];
            const bypassConfig = this.generateBypassConfig(primaryWAF);
            
            // Apply header modifications
            await this.applyHeaderBypass(page, bypassConfig);
            
            // Apply timing controls
            await this.applyTimingBypass(page, bypassConfig);
            
            // Apply cookie management
            await this.applyCookieBypass(page, bypassConfig);
            
            // Apply request modifications
            await this.applyRequestBypass(page, bypassConfig);
            
            this.logger.debug(`WAF bypass applied for: ${primaryWAF ? primaryWAF.name : 'generic'}`);
            return true;
            
        } catch (error) {
            this.logger.error('WAF bypass application failed:', error);
            return false;
        }
    }

    /**
     * Generate bypass configuration based on detected WAF
     */
    generateBypassConfig(waf) {
        const seed = this.createSeed((waf ? waf.name : 'generic') + Date.now());
        const random = this.seededRandom(seed);
        
        const config = {
            wafType: waf ? waf.name : 'generic',
            confidence: waf ? waf.confidence : 0,
            techniques: {
                headerRotation: true,
                timingVariation: true,
                cookiePreservation: true,
                requestModification: true
            }
        };
        
        // WAF-specific configurations
        switch (config.wafType) {
            case 'cloudflare':
                config.techniques.jsChallengeBypass = true;
                config.techniques.captchaAvoidance = true;
                config.minDelay = 2000;
                config.maxDelay = 8000;
                break;
                
            case 'datadome':
                config.techniques.mouseBehavior = true;
                config.techniques.keystrokeTiming = true;
                config.minDelay = 1500;
                config.maxDelay = 6000;
                break;
                
            case 'akamai':
                config.techniques.sensorDataSpoofing = true;
                config.techniques.behaviorAnalysis = true;
                config.minDelay = 3000;
                config.maxDelay = 10000;
                break;
                
            case 'incapsula':
                config.techniques.sessionMaintenance = true;
                config.techniques.requestFingerprinting = true;
                config.minDelay = 2500;
                config.maxDelay = 7000;
                break;
                
            default:
                config.minDelay = 1000;
                config.maxDelay = 5000;
        }
        
        return config;
    }

    /**
     * Apply header-based bypass techniques
     */
    async applyHeaderBypass(page, config) {
        const techniques = this.bypassTechniques.headerRotation;
        const seed = this.createSeed(config.wafType + 'headers');
        const random = this.seededRandom(seed);
        
        // Set realistic headers
        const headers = {
            'User-Agent': techniques.userAgents[Math.floor(random() * techniques.userAgents.length)],
            'Accept': techniques.acceptHeaders[Math.floor(random() * techniques.acceptHeaders.length)],
            'Accept-Language': techniques.acceptLanguage[Math.floor(random() * techniques.acceptLanguage.length)],
            'Accept-Encoding': techniques.acceptEncoding[Math.floor(random() * techniques.acceptEncoding.length)],
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0'
        };
        
        // Remove automation-related headers
        const automationHeaders = [
            'x-automation',
            'x-test-automation',
            'x-selenium',
            'x-playwright',
            'x-puppeteer'
        ];
        
        // Apply headers via request interception
        await page.setExtraHTTPHeaders(headers);
    }

    /**
     * Apply timing-based bypass techniques
     */
    async applyTimingBypass(page, config) {
        const minDelay = config.minDelay || 1000;
        const maxDelay = config.maxDelay || 5000;
        
        // Intercept requests and add realistic delays
        await page.route('**/*', async (route) => {
            const request = route.request();
            
            // Add delay for navigation requests
            if (request.resourceType() === 'document') {
                const delay = minDelay + Math.random() * (maxDelay - minDelay);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            
            await route.continue();
        });
    }

    /**
     * Apply cookie-based bypass techniques
     */
    async applyCookieBypass(page, config) {
        // Preserve legitimate session cookies
        const currentCookies = await page.context().cookies();
        
        // Filter out automation-related cookies
        const legitimateCookies = currentCookies.filter(cookie => {
            const suspiciousNames = ['webdriver', 'selenium', 'automation', 'test'];
            return !suspiciousNames.some(name => cookie.name.toLowerCase().includes(name));
        });
        
        // Clear and reset cookies
        await page.context().clearCookies();
        if (legitimateCookies.length > 0) {
            await page.context().addCookies(legitimateCookies);
        }
        
        // Add realistic tracking cookies
        const trackingCookies = this.generateTrackingCookies(config.wafType);
        if (trackingCookies.length > 0) {
            await page.context().addCookies(trackingCookies);
        }
    }

    /**
     * Apply request modification bypass techniques
     */
    async applyRequestBypass(page, config) {
        await page.route('**/*', async (route) => {
            const request = route.request();
            const headers = request.headers();
            
            // Remove automation indicators
            const cleanHeaders = { ...headers };
            delete cleanHeaders['x-automation'];
            delete cleanHeaders['x-test'];
            delete cleanHeaders['selenium-test'];
            
            // Add entropy to requests
            if (Math.random() < 0.1) {
                cleanHeaders['x-requested-with'] = 'XMLHttpRequest';
            }
            
            // Modify requests based on WAF type
            if (config.wafType === 'cloudflare' && request.url().includes('cf_')) {
                // Handle Cloudflare-specific modifications
                cleanHeaders['cf-visitor'] = JSON.stringify({ scheme: 'https' });
            }
            
            await route.continue({ headers: cleanHeaders });
        });
    }

    /**
     * Generate realistic tracking cookies
     */
    generateTrackingCookies(wafType) {
        const domain = '.example.com'; // Would be set dynamically
        const cookies = [];
        
        // Google Analytics cookies
        cookies.push({
            name: '_ga',
            value: `GA1.2.${Math.floor(Math.random() * 1000000000)}.${Math.floor(Date.now() / 1000)}`,
            domain,
            path: '/'
        });
        
        cookies.push({
            name: '_gid',
            value: `GA1.2.${Math.floor(Math.random() * 1000000000)}`,
            domain,
            path: '/'
        });
        
        // Facebook Pixel
        if (Math.random() > 0.5) {
            cookies.push({
                name: '_fbp',
                value: `fb.1.${Date.now()}.${Math.floor(Math.random() * 1000000000)}`,
                domain,
                path: '/'
            });
        }
        
        return cookies;
    }

    /**
     * Handle specific WAF challenges
     */
    async handleWAFChallenge(page, wafType, challengeData) {
        try {
            switch (wafType) {
                case 'cloudflare':
                    return await this.handleCloudflareChallenge(page, challengeData);
                case 'datadome':
                    return await this.handleDatadomeChallenge(page, challengeData);
                case 'akamai':
                    return await this.handleAkamaiChallenge(page, challengeData);
                default:
                    return await this.handleGenericChallenge(page, challengeData);
            }
        } catch (error) {
            this.logger.error(`WAF challenge handling failed for ${wafType}:`, error);
            return false;
        }
    }

    /**
     * Handle Cloudflare challenges
     */
    async handleCloudflareChallenge(page, challengeData) {
        // Wait for challenge completion
        try {
            await page.waitForSelector('[name="cf_captcha_kind"]', { timeout: 5000 });
            
            // Wait for automatic challenge resolution
            await page.waitForNavigation({ timeout: 30000 });
            
            return true;
        } catch (error) {
            // Challenge might not be present or already resolved
            return true;
        }
    }

    /**
     * Handle DataDome challenges
     */
    async handleDatadomeChallenge(page, challengeData) {
        // Simulate human-like behavior during challenge
        await page.mouse.move(100, 100);
        await page.waitForTimeout(2000);
        
        // Look for DataDome challenge elements
        try {
            const challengeFrame = await page.waitForSelector('iframe[src*="datadome"]', { timeout: 5000 });
            if (challengeFrame) {
                // Wait for challenge to complete automatically
                await page.waitForTimeout(10000);
            }
            return true;
        } catch (error) {
            return true; // No challenge found
        }
    }

    /**
     * Handle Akamai challenges
     */
    async handleAkamaiChallenge(page, challengeData) {
        // Akamai typically uses behavioral analysis
        // Simulate realistic user behavior
        
        await page.mouse.move(200, 200);
        await page.waitForTimeout(1000);
        await page.mouse.move(300, 250);
        await page.waitForTimeout(500);
        
        // Look for sensor data collection
        try {
            await page.evaluate(() => {
                if (window.akamai && window.akamai.setConfig) {
                    // Akamai sensor might be present
                    return true;
                }
                return false;
            });
        } catch (error) {
            // Continue regardless
        }
        
        return true;
    }

    /**
     * Handle generic WAF challenges
     */
    async handleGenericChallenge(page, challengeData) {
        // Generic approach: wait and simulate user behavior
        await page.waitForTimeout(2000);
        
        // Check for common challenge patterns
        const challengeElements = await page.$$('input[type="text"], button[type="submit"], [class*="captcha"], [id*="challenge"]');
        
        if (challengeElements.length > 0) {
            // Wait for potential automatic resolution
            await page.waitForTimeout(5000);
        }
        
        return true;
    }

    /**
     * Create deterministic seed from string
     */
    createSeed(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    /**
     * Seeded random number generator
     */
    seededRandom(seed) {
        return function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }

    /**
     * Test WAF detection and bypass
     */
    async testWAFBypass(page, url) {
        try {
            // Initial request to detect WAF
            const response = await page.goto(url, { waitUntil: 'networkidle' });
            
            // Detect WAF presence
            const detectedWAFs = await this.detectWAF(response);
            
            // Apply bypass if WAF detected
            if (detectedWAFs.length > 0) {
                await this.applyWAFBypass(page, detectedWAFs);
                
                // Retry request
                const bypassResponse = await page.goto(url, { waitUntil: 'networkidle' });
                
                return {
                    wafDetected: true,
                    detectedWAFs,
                    bypassApplied: true,
                    originalStatus: response.status(),
                    bypassStatus: bypassResponse.status(),
                    success: bypassResponse.status() < 400
                };
            }
            
            return {
                wafDetected: false,
                detectedWAFs: [],
                bypassApplied: false,
                status: response.status(),
                success: response.status() < 400
            };
            
        } catch (error) {
            this.logger.error('WAF bypass test failed:', error);
            return {
                wafDetected: false,
                detectedWAFs: [],
                bypassApplied: false,
                error: error.message,
                success: false
            };
        }
    }
}

module.exports = WAFBypass;