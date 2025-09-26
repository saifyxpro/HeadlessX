/**
 * Development Tools v1.3.0
 * Comprehensive development utilities for HeadlessX testing and debugging
 */

const { logger } = require('../../utils/logger');
const BrowserService = require('../browser');
const { TestingFramework } = require('../testing/test-framework');
const { ProfileValidator } = require('../utils/profile-validator');
const fs = require('fs').promises;
const path = require('path');

class DevTools {
    constructor() {
        this.browserService = BrowserService;
        this.testingFramework = new TestingFramework();
        this.profileValidator = new ProfileValidator();
    }

    /**
   * Interactive fingerprint testing
   */
    async interactiveFingerprintTest(options = {}) {
        console.log('\n🔍 Interactive Fingerprint Testing');
        console.log('====================================');

        const deviceProfile = options.deviceProfile || 'desktop-chrome';
        console.log(`Using device profile: ${deviceProfile}`);

        try {
            const context = await this.browserService.createIsolatedContext({
                stealth: true,
                deviceProfile
            });

            const page = await context.newPage();

            // Test popular fingerprinting sites
            const testSites = [
                {
                    name: 'AmIUnique',
                    url: 'https://amiunique.org/fp',
                    check: () => page.waitForSelector('.fingerprint', { timeout: 10000 })
                },
                {
                    name: 'BrowserLeaks',
                    url: 'https://browserleaks.com/javascript',
                    check: () => page.waitForSelector('#javascript-test', { timeout: 10000 })
                },
                {
                    name: 'FingerprintJS Demo',
                    url: 'https://fingerprintjs.com/demo/',
                    check: () => page.waitForSelector('[data-testid="visitor-id"]', { timeout: 10000 })
                }
            ];

            const results = [];

            for (const site of testSites) {
                console.log(`\n📊 Testing ${site.name}...`);

                try {
                    await page.goto(site.url, { waitUntil: 'networkidle' });
                    await site.check();

                    // Capture screenshot
                    const screenshot = await page.screenshot({
                        fullPage: true,
                        type: 'png'
                    });

                    // Analyze page content
                    const analysis = await page.evaluate(() => {
                        const text = document.body.innerText;
                        return {
                            hasFingerprint: /fingerprint|unique|identifier/i.test(text),
                            hasBot: /bot|automation|headless|webdriver/i.test(text),
                            contentLength: text.length,
                            title: document.title
                        };
                    });

                    results.push({
                        site: site.name,
                        url: site.url,
                        success: true,
                        analysis,
                        screenshot: screenshot.toString('base64')
                    });

                    console.log(`✅ ${site.name}: ${analysis.hasBot ? '❌ Bot detected' : '✅ Passed'}`);
                } catch (error) {
                    console.log(`❌ ${site.name}: Error - ${error.message}`);
                    results.push({
                        site: site.name,
                        url: site.url,
                        success: false,
                        error: error.message
                    });
                }

                await page.waitForTimeout(2000);
            }

            await context.close();

            // Save results
            const reportPath = await this.saveTestReport(results, 'fingerprint-test');
            console.log(`\n📄 Test report saved: ${reportPath}`);

            return results;
        } catch (error) {
            logger.error('Interactive fingerprint test failed:', error);
            throw error;
        }
    }

    /**
   * Profile benchmarking tool
   */
    async benchmarkProfiles(profileIds = []) {
        console.log('\n⚡ Profile Benchmarking');
        console.log('======================');

        if (profileIds.length === 0) {
            profileIds = ['desktop-chrome', 'desktop-firefox', 'desktop-safari', 'mobile-ios', 'mobile-android'];
        }

        const results = {};

        for (const profileId of profileIds) {
            console.log(`\n🧪 Testing profile: ${profileId}`);

            const startTime = Date.now();

            try {
                // Validate profile
                const validation = await this.profileValidator.validateProfile(profileId);
                console.log(`  Validation score: ${validation.score}/100`);

                // Run performance test
                const context = await this.browserService.createIsolatedContext({
                    stealth: true,
                    deviceProfile: profileId
                });

                const page = await context.newPage();

                // Test page load speed
                const loadStart = Date.now();
                await page.goto('https://httpbin.org/html');
                const loadTime = Date.now() - loadStart;

                // Test JavaScript execution
                const jsStart = Date.now();
                await page.evaluate(() => {
                    // Simulate complex operations
                    for (let i = 0; i < 10000; i++) {
                        Math.random() * Math.PI;
                    }
                });
                const jsTime = Date.now() - jsStart;

                // Test memory usage
                const memUsage = process.memoryUsage();

                await context.close();

                const totalTime = Date.now() - startTime;

                results[profileId] = {
                    validation,
                    performance: {
                        loadTime,
                        jsTime,
                        totalTime,
                        memoryMB: Math.round(memUsage.heapUsed / 1024 / 1024)
                    },
                    status: 'success'
                };

                console.log(`  Load time: ${loadTime}ms`);
                console.log(`  JS execution: ${jsTime}ms`);
                console.log(`  Memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
                console.log(`  Total time: ${totalTime}ms`);
            } catch (error) {
                results[profileId] = {
                    status: 'error',
                    error: error.message
                };
                console.log(`  ❌ Error: ${error.message}`);
            }
        }

        // Generate benchmark report
        const reportPath = await this.saveBenchmarkReport(results);
        console.log(`\n📊 Benchmark report saved: ${reportPath}`);

        return results;
    }

    /**
   * Anti-detection testing suite
   */
    async runAntiDetectionSuite(options = {}) {
        console.log('\n🛡️ Anti-Detection Test Suite');
        console.log('=============================');

        const deviceProfile = options.deviceProfile || 'desktop-chrome';
        console.log(`Testing with profile: ${deviceProfile}`);

        try {
            const results = await this.testingFramework.runFullTestSuite({
                deviceProfile
            });

            console.log('\n📊 Test Results Summary:');
            console.log(`Overall Score: ${results.summary.overallScore}/100`);
            console.log(`Categories Passed: ${results.summary.passedCategories}/${results.summary.totalCategories}`);

            Object.entries(results.summary.details).forEach(([category, details]) => {
                const status = details.status === 'passed' ? '✅' : '❌';
                console.log(`  ${status} ${category}: ${details.score}/100 (${details.testsPassed}/${details.testsTotal} tests)`);
            });

            // Save detailed results
            const reportPath = await this.saveTestReport(results, 'anti-detection-suite');
            console.log(`\n📄 Detailed report saved: ${reportPath}`);

            return results;
        } catch (error) {
            logger.error('Anti-detection test suite failed:', error);
            throw error;
        }
    }

    /**
   * Network interception analyzer
   */
    async analyzeNetworkTraffic(url, options = {}) {
        console.log(`\n🌐 Network Traffic Analysis: ${url}`);
        console.log('=====================================');

        const requests = [];
        const responses = [];

        try {
            const context = await this.browserService.createIsolatedContext({
                stealth: true,
                deviceProfile: options.deviceProfile || 'desktop-chrome'
            });

            const page = await context.newPage();

            // Monitor requests
            page.on('request', request => {
                requests.push({
                    url: request.url(),
                    method: request.method(),
                    headers: request.headers(),
                    resourceType: request.resourceType(),
                    timestamp: Date.now()
                });
            });

            // Monitor responses
            page.on('response', response => {
                responses.push({
                    url: response.url(),
                    status: response.status(),
                    headers: response.headers(),
                    size: response.headers()['content-length'] || 0,
                    timestamp: Date.now()
                });
            });

            const startTime = Date.now();
            await page.goto(url, { waitUntil: 'networkidle' });
            const loadTime = Date.now() - startTime;

            await context.close();

            // Analyze traffic
            const analysis = {
                summary: {
                    totalRequests: requests.length,
                    totalResponses: responses.length,
                    loadTime,
                    resourceTypes: this.analyzeResourceTypes(requests),
                    statusCodes: this.analyzeStatusCodes(responses)
                },
                security: {
                    httpsRequests: requests.filter(r => r.url.startsWith('https')).length,
                    httpRequests: requests.filter(r => r.url.startsWith('http:')).length,
                    thirdPartyRequests: requests.filter(r => !r.url.includes(new URL(url).hostname)).length
                },
                suspicious: {
                    botDetectionScripts: requests.filter(r =>
                        /bot|captcha|challenge|datadome|cloudflare|incapsula/i.test(r.url)
                    ).length,
                    fingerprintingScripts: requests.filter(r =>
                        /fingerprint|track|analytics|pixel/i.test(r.url)
                    ).length
                },
                requests: requests.slice(0, 50), // Limit to first 50 requests
                responses: responses.slice(0, 50)
            };

            console.log(`Total Requests: ${analysis.summary.totalRequests}`);
            console.log(`Load Time: ${analysis.summary.loadTime}ms`);
            console.log(`HTTPS Requests: ${analysis.security.httpsRequests}`);
            console.log(`Third-party Requests: ${analysis.security.thirdPartyRequests}`);
            console.log(`Suspicious Scripts: ${analysis.suspicious.botDetectionScripts + analysis.suspicious.fingerprintingScripts}`);

            // Save analysis report
            const reportPath = await this.saveTestReport(analysis, 'network-analysis');
            console.log(`\n📄 Network analysis saved: ${reportPath}`);

            return analysis;
        } catch (error) {
            logger.error('Network traffic analysis failed:', error);
            throw error;
        }
    }

    /**
   * Generate comprehensive system report
   */
    async generateSystemReport() {
        console.log('\n📋 System Report Generation');
        console.log('===========================');

        const report = {
            timestamp: new Date().toISOString(),
            system: {
                platform: process.platform,
                arch: process.arch,
                nodeVersion: process.version,
                memory: process.memoryUsage(),
                uptime: process.uptime()
            },
            profiles: {},
            tests: {},
            configuration: {}
        };

        try {
            // Test available profiles
            const profileIds = ['desktop-chrome', 'desktop-firefox', 'mobile-ios', 'mobile-android'];

            for (const profileId of profileIds) {
                try {
                    const validation = await this.profileValidator.validateProfile(profileId);
                    report.profiles[profileId] = validation;
                    console.log(`✅ Profile ${profileId}: ${validation.score}/100`);
                } catch (error) {
                    report.profiles[profileId] = { error: error.message };
                    console.log(`❌ Profile ${profileId}: Error`);
                }
            }

            // Run basic functionality tests
            console.log('\n🧪 Running basic tests...');

            const basicTests = await this.testingFramework.testFingerprinting();
            report.tests.fingerprinting = basicTests;

            const stealthTests = await this.testingFramework.testStealthCapabilities();
            report.tests.stealth = stealthTests;

            // Save system report
            const reportPath = await this.saveTestReport(report, 'system-report');
            console.log(`\n📄 System report saved: ${reportPath}`);

            return report;
        } catch (error) {
            logger.error('System report generation failed:', error);
            throw error;
        }
    }

    /**
   * Profile creation wizard
   */
    async createCustomProfile(name, baseProfile = 'desktop-chrome') {
        console.log(`\n🎨 Creating Custom Profile: ${name}`);
        console.log('====================================');

        try {
            // Load base profile
            const validator = new ProfileValidator();
            const baseValidation = await validator.validateProfile(baseProfile);

            if (baseValidation.score < 70) {
                console.log(`⚠️ Warning: Base profile ${baseProfile} has low score (${baseValidation.score}/100)`);
            }

            // Interactive profile creation would go here
            // For now, we'll create a template

            const customProfile = {
                id: name,
                name: name.charAt(0).toUpperCase() + name.slice(1),
                basedOn: baseProfile,
                created: new Date().toISOString(),
                customizations: {
                    userAgent: 'Custom User Agent String',
                    viewport: { width: 1920, height: 1080 },
                    geolocation: { latitude: 40.7128, longitude: -74.0060 },
                    timezone: 'America/New_York'
                },
                hardware: {
                    cores: 8,
                    memory: 16,
                    gpu: 'NVIDIA GeForce RTX 3070'
                }
            };

            // Save custom profile
            const profilesDir = path.join(process.cwd(), 'src', 'services', 'profiles');
            await fs.mkdir(profilesDir, { recursive: true });

            const profilePath = path.join(profilesDir, `${name}.json`);
            await fs.writeFile(profilePath, JSON.stringify(customProfile, null, 2));

            console.log(`✅ Custom profile created: ${profilePath}`);
            console.log('📝 Edit the profile file to customize settings');

            return customProfile;
        } catch (error) {
            logger.error('Custom profile creation failed:', error);
            throw error;
        }
    }

    /**
   * Analyze resource types
   */
    analyzeResourceTypes(requests) {
        const types = {};
        requests.forEach(req => {
            types[req.resourceType] = (types[req.resourceType] || 0) + 1;
        });
        return types;
    }

    /**
   * Analyze status codes
   */
    analyzeStatusCodes(responses) {
        const codes = {};
        responses.forEach(res => {
            codes[res.status] = (codes[res.status] || 0) + 1;
        });
        return codes;
    }

    /**
   * Save test report
   */
    async saveTestReport(data, type) {
        const reportsDir = path.join(process.cwd(), 'logs', 'reports');
        await fs.mkdir(reportsDir, { recursive: true });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${type}-${timestamp}.json`;
        const filepath = path.join(reportsDir, filename);

        await fs.writeFile(filepath, JSON.stringify(data, null, 2));

        return filepath;
    }

    /**
   * Save benchmark report
   */
    async saveBenchmarkReport(results) {
        const reportsDir = path.join(process.cwd(), 'logs', 'reports');
        await fs.mkdir(reportsDir, { recursive: true });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `benchmark-${timestamp}.json`;
        const filepath = path.join(reportsDir, filename);

        // Create human-readable report
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalProfiles: Object.keys(results).length,
                successfulProfiles: Object.values(results).filter(r => r.status === 'success').length
            },
            profiles: results,
            recommendations: this.generateBenchmarkRecommendations(results)
        };

        await fs.writeFile(filepath, JSON.stringify(report, null, 2));

        return filepath;
    }

    /**
   * Generate benchmark recommendations
   */
    generateBenchmarkRecommendations(results) {
        const recommendations = [];

        Object.entries(results).forEach(([profileId, result]) => {
            if (result.status === 'success') {
                if (result.validation.score < 70) {
                    recommendations.push({
                        profile: profileId,
                        type: 'validation',
                        message: `Profile validation score is low (${result.validation.score}/100). Consider updating profile data.`
                    });
                }

                if (result.performance.loadTime > 5000) {
                    recommendations.push({
                        profile: profileId,
                        type: 'performance',
                        message: `Load time is high (${result.performance.loadTime}ms). Check network configuration.`
                    });
                }

                if (result.performance.memoryMB > 100) {
                    recommendations.push({
                        profile: profileId,
                        type: 'memory',
                        message: `Memory usage is high (${result.performance.memoryMB}MB). Consider optimizing profile.`
                    });
                }
            }
        });

        return recommendations;
    }
}

module.exports = { DevTools };
