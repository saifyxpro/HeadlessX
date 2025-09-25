/**
 * Detection Test Controller
 * Advanced bot detection testing and analysis endpoints
 * HeadlessX v1.3.0 - Enhanced Anti-Detection
 */

const FingerprintManager = require('../config/fingerprints');
const { BrowserService } = require('../services/browser');
const { StealthService } = require('../services/stealth');
const WAFBypass = require('../services/evasion/waf-bypass');
const TLSFingerprintMasking = require('../services/evasion/tls-fingerprint');
const { logger } = require('../utils/logger');
const { HeadlessXError, ERROR_CATEGORIES } = require('../utils/errors');

class DetectionTestController {
    constructor() {
        this.fingerprintManager = new FingerprintManager();
        this.browserService = new BrowserService();
        this.stealthService = new StealthService();
        this.wafBypass = new WAFBypass();
        this.tlsFingerprinting = new TLSFingerprintMasking();
        this.logger = logger;
        
        // Test suites configuration
        this.testSuites = this.initializeTestSuites();
    }

    /**
     * Initialize bot detection test suites
     */
    initializeTestSuites() {
        return {
            basic: {
                name: 'Basic Detection Tests',
                tests: [
                    {
                        name: 'User Agent Detection',
                        url: 'https://httpbin.org/user-agent',
                        checks: ['userAgent']
                    },
                    {
                        name: 'Headers Detection',
                        url: 'https://httpbin.org/headers',
                        checks: ['headers', 'automation']
                    },
                    {
                        name: 'JavaScript Support',
                        url: 'https://httpbin.org/html',
                        checks: ['javascript', 'webdriver']
                    }
                ]
            },
            
            fingerprinting: {
                name: 'Browser Fingerprinting Tests',
                tests: [
                    {
                        name: 'Canvas Fingerprint',
                        url: 'https://browserleaks.com/canvas',
                        checks: ['canvas', 'consistency']
                    },
                    {
                        name: 'WebGL Fingerprint',
                        url: 'https://browserleaks.com/webgl',
                        checks: ['webgl', 'gpu']
                    },
                    {
                        name: 'Audio Context',
                        url: 'https://browserleaks.com/audio',
                        checks: ['audio', 'fingerprint']
                    },
                    {
                        name: 'Font Detection',
                        url: 'https://browserleaks.com/fonts',
                        checks: ['fonts', 'enumeration']
                    }
                ]
            },
            
            waf: {
                name: 'WAF Detection Tests',
                tests: [
                    {
                        name: 'Cloudflare Detection',
                        url: 'https://httpbin.org/status/403',
                        checks: ['cloudflare', 'challenge']
                    },
                    {
                        name: 'DataDome Test',
                        url: 'https://httpbin.org/delay/2',
                        checks: ['datadome', 'behavioral']
                    },
                    {
                        name: 'Akamai Bot Manager',
                        url: 'https://httpbin.org/redirect/3',
                        checks: ['akamai', 'sensor']
                    }
                ]
            },
            
            behavioral: {
                name: 'Behavioral Analysis Tests',
                tests: [
                    {
                        name: 'Mouse Movement',
                        url: 'https://httpbin.org/html',
                        checks: ['mouse', 'movement', 'human']
                    },
                    {
                        name: 'Timing Patterns',
                        url: 'https://httpbin.org/delay/1',
                        checks: ['timing', 'intervals']
                    },
                    {
                        name: 'Scroll Behavior',
                        url: 'https://httpbin.org/html',
                        checks: ['scroll', 'patterns']
                    }
                ]
            }
        };
    }

    /**
     * Run comprehensive detection test
     */
    async runDetectionTest(req, res) {
        try {
            const {
                suite = 'basic',
                profile = 'windows-chrome-high-end',
                stealthMode = 'advanced',
                timeout = 30000,
                customTests = []
            } = req.body;

            const testSuite = this.testSuites[suite];
            if (!testSuite) {
                throw new HeadlessXError(
                    `Test suite '${suite}' not found`,
                    400,
                    ERROR_CATEGORIES.VALIDATION,
                    { availableSuites: Object.keys(this.testSuites) }
                );
            }

            // Generate fingerprint profile
            const fingerprintProfile = await this.fingerprintManager.generateProfile(profile);
            
            // Create browser context with stealth
            const context = await this.browserService.createContext({
                fingerprint: fingerprintProfile,
                stealth: stealthMode
            });

            const results = {
                testSuite: suite,
                profile,
                stealthMode,
                timestamp: new Date().toISOString(),
                tests: [],
                summary: {
                    total: 0,
                    passed: 0,
                    failed: 0,
                    warnings: 0
                }
            };

            // Run test suite
            const testsToRun = [...testSuite.tests, ...customTests];
            
            for (const test of testsToRun) {
                const testResult = await this.runSingleTest(context, test, fingerprintProfile, timeout);
                results.tests.push(testResult);
                results.summary.total++;
                
                if (testResult.status === 'passed') {
                    results.summary.passed++;
                } else if (testResult.status === 'failed') {
                    results.summary.failed++;
                } else {
                    results.summary.warnings++;
                }
            }

            // Calculate success rate
            results.summary.successRate = results.summary.total > 0 ? 
                (results.summary.passed / results.summary.total) * 100 : 0;

            // Close browser context
            await context.close();

            this.logger.info(`Detection test completed: ${suite}`, {
                profile,
                successRate: results.summary.successRate,
                total: results.summary.total
            });

            res.json({
                success: true,
                results
            });

        } catch (error) {
            this.logger.error('Detection test failed:', error);
            
            const errorResponse = {
                success: false,
                error: error.message,
                code: error.code || 'DETECTION_TEST_ERROR',
                timestamp: new Date().toISOString()
            };

            res.status(error.status || 500).json(errorResponse);
        }
    }

    /**
     * Run single detection test
     */
    async runSingleTest(context, test, profile, timeout) {
        const startTime = Date.now();
        const result = {
            name: test.name,
            url: test.url,
            checks: test.checks,
            status: 'unknown',
            details: {},
            duration: 0,
            timestamp: new Date().toISOString()
        };

        try {
            const page = await context.newPage();
            
            // Apply additional stealth measures
            await this.stealthService.applyStealth(page, profile);
            
            // Navigate to test URL
            const response = await page.goto(test.url, { 
                waitUntil: 'networkidle',
                timeout 
            });

            // Perform test-specific checks
            const checkResults = await this.performTestChecks(page, test.checks, profile);
            
            result.details = {
                response: {
                    status: response.status(),
                    headers: response.headers(),
                    url: response.url()
                },
                checks: checkResults,
                pageMetrics: await this.getPageMetrics(page)
            };

            // Determine test status
            result.status = this.evaluateTestResult(checkResults, test.checks);
            
            await page.close();

        } catch (error) {
            result.status = 'failed';
            result.details.error = {
                message: error.message,
                type: error.constructor.name,
                stack: error.stack
            };
            
            this.logger.debug(`Test failed: ${test.name}`, error);
        }

        result.duration = Date.now() - startTime;
        return result;
    }

    /**
     * Perform test-specific checks
     */
    async performTestChecks(page, checks, profile) {
        const results = {};

        for (const check of checks) {
            try {
                switch (check) {
                    case 'userAgent':
                        results[check] = await this.checkUserAgent(page, profile);
                        break;
                    case 'headers':
                        results[check] = await this.checkHeaders(page);
                        break;
                    case 'automation':
                        results[check] = await this.checkAutomationSignatures(page);
                        break;
                    case 'javascript':
                        results[check] = await this.checkJavaScriptExecution(page);
                        break;
                    case 'webdriver':
                        results[check] = await this.checkWebDriverSignatures(page);
                        break;
                    case 'canvas':
                        results[check] = await this.checkCanvasFingerprint(page);
                        break;
                    case 'webgl':
                        results[check] = await this.checkWebGLFingerprint(page);
                        break;
                    case 'audio':
                        results[check] = await this.checkAudioFingerprint(page);
                        break;
                    case 'fonts':
                        results[check] = await this.checkFontEnumeration(page);
                        break;
                    case 'mouse':
                        results[check] = await this.checkMouseBehavior(page);
                        break;
                    case 'timing':
                        results[check] = await this.checkTimingPatterns(page);
                        break;
                    default:
                        results[check] = { status: 'skipped', message: 'Unknown check type' };
                }
            } catch (error) {
                results[check] = { 
                    status: 'error', 
                    message: error.message,
                    error: error.constructor.name
                };
            }
        }

        return results;
    }

    /**
     * Check user agent consistency
     */
    async checkUserAgent(page, profile) {
        const userAgent = await page.evaluate(() => navigator.userAgent);
        const expected = profile.userAgent;
        
        return {
            status: userAgent === expected ? 'passed' : 'failed',
            actual: userAgent,
            expected,
            consistent: userAgent === expected
        };
    }

    /**
     * Check for automation headers
     */
    async checkHeaders(page) {
        const suspiciousHeaders = ['x-automation', 'x-test', 'selenium', 'webdriver'];
        const headers = await page.evaluate(() => {
            const req = new XMLHttpRequest();
            req.open('GET', window.location.href, false);
            req.send();
            return req.getAllResponseHeaders();
        });
        
        const detected = suspiciousHeaders.filter(header => 
            headers.toLowerCase().includes(header)
        );
        
        return {
            status: detected.length === 0 ? 'passed' : 'failed',
            detectedHeaders: detected,
            clean: detected.length === 0
        };
    }

    /**
     * Check for automation signatures
     */
    async checkAutomationSignatures(page) {
        const signatures = await page.evaluate(() => {
            const results = {};
            
            // Check for webdriver properties
            results.webdriver = {
                navigator: !!navigator.webdriver,
                window: !!window.webdriver,
                document: !!document.webdriver
            };
            
            // Check for automation frameworks
            results.frameworks = {
                selenium: !!(window.selenium || window._selenium),
                puppeteer: !!(window.puppeteer || window._puppeteer),
                playwright: !!(window.playwright || window._playwright)
            };
            
            // Check for chrome automation extensions
            results.chrome = {
                runtime: !!(window.chrome && window.chrome.runtime && window.chrome.runtime.onConnect),
                automation: !!(window.chrome && window.chrome.automation)
            };
            
            return results;
        });
        
        const detected = [];
        if (Object.values(signatures.webdriver).some(Boolean)) detected.push('webdriver');
        if (Object.values(signatures.frameworks).some(Boolean)) detected.push('frameworks');
        if (Object.values(signatures.chrome).some(Boolean)) detected.push('chrome');
        
        return {
            status: detected.length === 0 ? 'passed' : 'failed',
            signatures,
            detected,
            clean: detected.length === 0
        };
    }

    /**
     * Check JavaScript execution capabilities
     */
    async checkJavaScriptExecution(page) {
        const jsTest = await page.evaluate(() => {
            try {
                const results = {};
                
                // Basic JavaScript features
                results.basicFeatures = {
                    eval: typeof eval === 'function',
                    setTimeout: typeof setTimeout === 'function',
                    console: typeof console === 'object',
                    JSON: typeof JSON === 'object'
                };
                
                // Modern JavaScript features
                results.modernFeatures = {
                    arrow: (() => true)(),
                    const: (() => { const x = 1; return x === 1; })(),
                    let: (() => { let y = 2; return y === 2; })(),
                    async: typeof (async () => {}) === 'function'
                };
                
                // Browser APIs
                results.apis = {
                    fetch: typeof fetch === 'function',
                    Promise: typeof Promise === 'function',
                    localStorage: typeof localStorage === 'object',
                    sessionStorage: typeof sessionStorage === 'object'
                };
                
                return results;
            } catch (error) {
                return { error: error.message };
            }
        });
        
        const allPassed = !jsTest.error && 
            Object.values(jsTest.basicFeatures || {}).every(Boolean) &&
            Object.values(jsTest.modernFeatures || {}).every(Boolean);
        
        return {
            status: allPassed ? 'passed' : 'failed',
            results: jsTest,
            functional: allPassed
        };
    }

    /**
     * Check for webdriver signatures
     */
    async checkWebDriverSignatures(page) {
        const webdriverSigs = await page.evaluate(() => {
            const checks = {};
            
            // Navigator webdriver property
            checks.navigatorWebdriver = navigator.webdriver;
            
            // Window.chrome missing in headless
            checks.chromeObject = !!window.chrome;
            
            // Permissions API
            checks.permissions = navigator.permissions;
            
            // Plugin array length
            checks.plugins = navigator.plugins.length;
            
            // Languages array
            checks.languages = navigator.languages.length > 0;
            
            // WebGL vendor
            try {
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl');
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                checks.webglVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            } catch (e) {
                checks.webglVendor = 'unknown';
            }
            
            return checks;
        });
        
        const suspicious = [];
        if (webdriverSigs.navigatorWebdriver) suspicious.push('navigator.webdriver');
        if (!webdriverSigs.chromeObject) suspicious.push('missing chrome object');
        if (webdriverSigs.plugins === 0) suspicious.push('no plugins');
        if (!webdriverSigs.languages) suspicious.push('no languages');
        
        return {
            status: suspicious.length === 0 ? 'passed' : 'warning',
            signatures: webdriverSigs,
            suspicious,
            clean: suspicious.length === 0
        };
    }

    /**
     * Check canvas fingerprint
     */
    async checkCanvasFingerprint(page) {
        const canvasData = await page.evaluate(() => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Draw test pattern
                ctx.textBaseline = 'top';
                ctx.font = '14px Arial';
                ctx.fillText('Canvas fingerprint test 123', 2, 2);
                
                return {
                    dataURL: canvas.toDataURL(),
                    width: canvas.width,
                    height: canvas.height
                };
            } catch (error) {
                return { error: error.message };
            }
        });
        
        return {
            status: canvasData.dataURL ? 'passed' : 'failed',
            fingerprint: canvasData.dataURL ? canvasData.dataURL.substring(0, 50) + '...' : null,
            data: canvasData,
            functional: !!canvasData.dataURL
        };
    }

    /**
     * Check WebGL fingerprint
     */
    async checkWebGLFingerprint(page) {
        const webglData = await page.evaluate(() => {
            try {
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                
                if (!gl) return { error: 'WebGL not supported' };
                
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                
                return {
                    vendor: gl.getParameter(gl.VENDOR),
                    renderer: gl.getParameter(gl.RENDERER),
                    version: gl.getParameter(gl.VERSION),
                    unmaskedVendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : null,
                    unmaskedRenderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : null,
                    extensions: gl.getSupportedExtensions()
                };
            } catch (error) {
                return { error: error.message };
            }
        });
        
        return {
            status: webglData.vendor ? 'passed' : 'failed',
            data: webglData,
            functional: !!webglData.vendor
        };
    }

    /**
     * Check audio fingerprint
     */
    async checkAudioFingerprint(page) {
        const audioData = await page.evaluate(() => {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const analyser = audioContext.createAnalyser();
                
                oscillator.connect(analyser);
                oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
                
                return {
                    sampleRate: audioContext.sampleRate,
                    state: audioContext.state,
                    maxChannelCount: audioContext.destination.maxChannelCount,
                    numberOfInputs: analyser.numberOfInputs,
                    numberOfOutputs: analyser.numberOfOutputs
                };
            } catch (error) {
                return { error: error.message };
            }
        });
        
        return {
            status: audioData.sampleRate ? 'passed' : 'failed',
            data: audioData,
            functional: !!audioData.sampleRate
        };
    }

    /**
     * Check font enumeration
     */
    async checkFontEnumeration(page) {
        const fontData = await page.evaluate(() => {
            try {
                const testFonts = ['Arial', 'Times', 'Courier', 'Helvetica', 'Georgia'];
                const availableFonts = [];
                
                testFonts.forEach(font => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    ctx.font = `12px ${font}`;
                    const width = ctx.measureText('test').width;
                    
                    ctx.font = '12px serif';
                    const serifWidth = ctx.measureText('test').width;
                    
                    if (width !== serifWidth) {
                        availableFonts.push(font);
                    }
                });
                
                return {
                    tested: testFonts,
                    available: availableFonts,
                    count: availableFonts.length
                };
            } catch (error) {
                return { error: error.message };
            }
        });
        
        return {
            status: fontData.available ? 'passed' : 'failed',
            data: fontData,
            functional: !!fontData.available
        };
    }

    /**
     * Check mouse behavior simulation
     */
    async checkMouseBehavior(page) {
        try {
            // Simulate mouse movement
            await page.mouse.move(100, 100);
            await page.waitForTimeout(100);
            await page.mouse.move(200, 150);
            await page.waitForTimeout(100);
            await page.mouse.move(150, 200);
            
            const mouseData = await page.evaluate(() => {
                return {
                    events: window.mouseEvents || 0,
                    lastPosition: { x: window.mouseX || 0, y: window.mouseY || 0 }
                };
            });
            
            return {
                status: 'passed',
                data: mouseData,
                simulated: true
            };
        } catch (error) {
            return {
                status: 'failed',
                error: error.message,
                simulated: false
            };
        }
    }

    /**
     * Check timing patterns
     */
    async checkTimingPatterns(page) {
        const timings = [];
        const startTime = Date.now();
        
        for (let i = 0; i < 5; i++) {
            const requestStart = Date.now();
            await page.evaluate(() => Date.now());
            const requestEnd = Date.now();
            timings.push(requestEnd - requestStart);
            
            await page.waitForTimeout(100 + Math.random() * 200);
        }
        
        const totalTime = Date.now() - startTime;
        const avgTiming = timings.reduce((sum, t) => sum + t, 0) / timings.length;
        
        return {
            status: 'passed',
            data: {
                timings,
                average: avgTiming,
                total: totalTime,
                variance: this.calculateVariance(timings)
            },
            humanLike: this.calculateVariance(timings) > 1 // Some variance indicates human-like behavior
        };
    }

    /**
     * Get page performance metrics
     */
    async getPageMetrics(page) {
        try {
            const metrics = await page.evaluate(() => {
                const perf = performance.getEntriesByType('navigation')[0];
                return perf ? {
                    loadTime: perf.loadEventEnd - perf.loadEventStart,
                    domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
                    responseTime: perf.responseEnd - perf.responseStart,
                    connectTime: perf.connectEnd - perf.connectStart
                } : null;
            });
            
            return metrics || {};
        } catch (error) {
            return { error: error.message };
        }
    }

    /**
     * Evaluate test result based on checks
     */
    evaluateTestResult(checkResults, expectedChecks) {
        const passedChecks = Object.values(checkResults).filter(result => 
            result.status === 'passed'
        ).length;
        
        const failedChecks = Object.values(checkResults).filter(result => 
            result.status === 'failed'
        ).length;
        
        if (failedChecks > 0) return 'failed';
        if (passedChecks === expectedChecks.length) return 'passed';
        return 'warning';
    }

    /**
     * Calculate variance for timing analysis
     */
    calculateVariance(values) {
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squareDiffs = values.map(val => Math.pow(val - avg, 2));
        return squareDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
    }

    /**
     * Get available test suites
     */
    getTestSuites(req, res) {
        try {
            const suites = Object.keys(this.testSuites).map(key => ({
                id: key,
                name: this.testSuites[key].name,
                testCount: this.testSuites[key].tests.length,
                tests: this.testSuites[key].tests.map(test => ({
                    name: test.name,
                    url: test.url,
                    checks: test.checks
                }))
            }));

            res.json({
                success: true,
                suites
            });
        } catch (error) {
            this.logger.error('Failed to get test suites:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Get detection test status and statistics
     */
    getDetectionStatus(req, res) {
        try {
            const status = {
                available: true,
                testSuites: Object.keys(this.testSuites).length,
                totalTests: Object.values(this.testSuites).reduce((sum, suite) => sum + suite.tests.length, 0),
                capabilities: {
                    fingerprinting: true,
                    behavioral: true,
                    wafTesting: true,
                    tlsAnalysis: true
                },
                timestamp: new Date().toISOString()
            };

            res.json({
                success: true,
                status
            });
        } catch (error) {
            this.logger.error('Failed to get detection status:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = DetectionTestController;