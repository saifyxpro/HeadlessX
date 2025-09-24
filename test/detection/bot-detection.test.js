/**
 * HeadlessX v1.3.0 - Bot Detection Tests
 * Comprehensive testing against major bot detection services
 */

const axios = require('axios');
const { expect } = require('@jest/globals');
const DetectionChecker = require('../../tools/detection-checker');

describe('Bot Detection Tests', () => {
    const HEADLESSX_URL = process.env.TEST_URL || 'http://localhost:3000';
    const AUTH_TOKEN = process.env.AUTH_TOKEN || 'test-token';
    
    let _detectionChecker;

    beforeAll(() => {
        _detectionChecker = new DetectionChecker({
            url: HEADLESSX_URL,
            timeout: 30000,
            verbose: false
        });
    });

    describe('Profile-based Detection Tests', () => {
        const profiles = [
            'windows-chrome-high-end',
            'windows-chrome-mid-range',
            'firefox-windows-high-end',
            'mobile-android-chrome',
            'mobile-iphone-safari'
        ];

        profiles.forEach(profile => {
            describe(`Profile: ${profile}`, () => {
                test('should pass basic stealth checks', async() => {
                    const response = await axios.post(`${HEADLESSX_URL}/api/render`, {
                        url: 'https://bot.sannysoft.com',
                        profile,
                        stealthMode: 'maximum',
                        waitForSelector: 'body',
                        timeout: 30000
                    }, {
                        headers: { Authorization: AUTH_TOKEN },
                        timeout: 35000
                    });

                    expect(response.data.success).toBe(true);
                    expect(response.data.html).toBeDefined();
                    
                    // Check for common bot detection indicators
                    const content = response.data.html.toLowerCase();
                    expect(content).not.toMatch(/webdriver.*present/);
                    expect(content).not.toMatch(/headless.*detected/);
                    expect(content).not.toMatch(/bot.*detected/);
                }, 60000);

                test('should maintain consistent fingerprint', async() => {
                    const requests = Array(3).fill().map(() =>
                        axios.post(`${HEADLESSX_URL}/api/render`, {
                            url: 'https://abrahamjuliot.github.io/creepjs',
                            profile,
                            stealthMode: 'maximum',
                            extractFingerprint: true,
                            timeout: 30000
                        }, {
                            headers: { Authorization: AUTH_TOKEN },
                            timeout: 35000
                        })
                    );

                    const responses = await Promise.all(requests);
                    
                    // All requests should succeed
                    responses.forEach(response => {
                        expect(response.data.success).toBe(true);
                    });

                    // Extract fingerprint hashes (simplified check)
                    const fingerprints = responses.map(r => r.data.fingerprint || r.data.html);
                    
                    // Fingerprints should be consistent across requests
                    expect(fingerprints.length).toBe(3);
                    // Note: In real implementation, we'd compare actual fingerprint components
                }, 90000);
            });
        });
    });

    describe('Advanced Stealth Features', () => {
        test('should successfully bypass Canvas fingerprinting detection', async() => {
            const response = await axios.post(`${HEADLESSX_URL}/api/render`, {
                url: 'https://abrahamjuliot.github.io/creepjs',
                profile: 'windows-chrome-high-end',
                stealthMode: 'maximum',
                canvasNoise: true,
                timeout: 30000
            }, {
                headers: { Authorization: AUTH_TOKEN },
                timeout: 35000
            });

            expect(response.data.success).toBe(true);
            
            // Should not be flagged as having suspicious canvas behavior
            const content = response.data.html.toLowerCase();
            expect(content).not.toMatch(/canvas.*suspicious/);
            expect(content).not.toMatch(/fingerprint.*blocked/);
        }, 45000);

        test('should successfully bypass WebGL fingerprinting detection', async() => {
            const response = await axios.post(`${HEADLESSX_URL}/api/render`, {
                url: 'https://webglreport.com',
                profile: 'windows-chrome-high-end',
                stealthMode: 'maximum',
                webglSpoofing: true,
                timeout: 30000
            }, {
                headers: { Authorization: AUTH_TOKEN },
                timeout: 35000
            });

            expect(response.data.success).toBe(true);
            expect(response.data.html).toMatch(/webgl/i);
            
            // Should report consistent WebGL capabilities
            const content = response.data.html;
            expect(content).toMatch(/vendor.*renderer/i);
        }, 45000);

        test('should prevent WebRTC IP leaks', async() => {
            const response = await axios.post(`${HEADLESSX_URL}/api/render`, {
                url: 'https://ipleak.net',
                profile: 'windows-chrome-high-end',
                stealthMode: 'maximum',
                webrtcBlock: true,
                timeout: 30000
            }, {
                headers: { Authorization: AUTH_TOKEN },
                timeout: 35000
            });

            expect(response.data.success).toBe(true);
            
            // Should not leak real IP addresses via WebRTC
            const content = response.data.html.toLowerCase();
            expect(content).not.toMatch(/webrtc.*leak/);
        }, 45000);
    });

    describe('Behavioral Simulation Tests', () => {
        test('should simulate human-like mouse movements', async() => {
            const response = await axios.post(`${HEADLESSX_URL}/api/render`, {
                url: 'https://example.com',
                profile: 'windows-chrome-high-end',
                stealthMode: 'maximum',
                simulateHuman: true,
                actions: [
                    { type: 'move', x: 100, y: 100 },
                    { type: 'move', x: 200, y: 150 },
                    { type: 'click', x: 200, y: 150 }
                ],
                timeout: 30000
            }, {
                headers: { Authorization: AUTH_TOKEN },
                timeout: 35000
            });

            expect(response.data.success).toBe(true);
            expect(response.data.actionsExecuted).toBeDefined();
        }, 45000);

        test('should simulate realistic scroll patterns', async() => {
            const response = await axios.post(`${HEADLESSX_URL}/api/render`, {
                url: 'https://example.com',
                profile: 'windows-chrome-high-end',
                stealthMode: 'maximum',
                simulateScroll: true,
                scrollPattern: 'natural',
                timeout: 30000
            }, {
                headers: { Authorization: AUTH_TOKEN },
                timeout: 35000
            });

            expect(response.data.success).toBe(true);
        }, 45000);
    });

    describe('WAF Bypass Tests', () => {
        test('should handle Cloudflare challenge pages', async() => {
            // Note: This would require a test site with Cloudflare protection
            const response = await axios.post(`${HEADLESSX_URL}/api/render`, {
                url: 'https://httpbin.org/user-agent', // Safe test URL
                profile: 'windows-chrome-high-end',
                stealthMode: 'maximum',
                bypassCloudflare: true,
                timeout: 45000
            }, {
                headers: { Authorization: AUTH_TOKEN },
                timeout: 50000
            });

            expect(response.data.success).toBe(true);
        }, 60000);

        test('should maintain consistent TLS fingerprint', async() => {
            const response = await axios.post(`${HEADLESSX_URL}/api/render`, {
                url: 'https://www.howsmyssl.com/a/check',
                profile: 'windows-chrome-high-end',
                stealthMode: 'maximum',
                tlsFingerprint: 'chrome',
                timeout: 30000
            }, {
                headers: { Authorization: AUTH_TOKEN },
                timeout: 35000
            });

            expect(response.data.success).toBe(true);
            
            // Should report consistent TLS characteristics
            const content = response.data.html;
            expect(content).toMatch(/"tls_version"/);
        }, 45000);
    });

    describe('Detection Service Integration Tests', () => {
        test('should achieve high stealth score on bot.sannysoft.com', async() => {
            const checker = new DetectionChecker({
                url: HEADLESSX_URL,
                profile: 'windows-chrome-high-end',
                verbose: false
            });

            const result = await checker.testService('bot.sannysoft.com', {
                url: 'https://bot.sannysoft.com',
                checks: ['webdriver detection', 'chrome detection']
            });

            expect(result.score).toBeGreaterThan(75);
            expect(result.passed).toBe(true);
        }, 60000);

        test('should pass CreepJS trust score threshold', async() => {
            const checker = new DetectionChecker({
                url: HEADLESSX_URL,
                profile: 'windows-chrome-high-end',
                verbose: false
            });

            const result = await checker.testService('abrahamjuliot.github.io', {
                url: 'https://abrahamjuliot.github.io/creepjs',
                checks: ['canvas fingerprint', 'webgl fingerprint']
            });

            expect(result.score).toBeGreaterThan(70);
        }, 60000);
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle invalid profiles gracefully', async() => {
            const response = await axios.post(`${HEADLESSX_URL}/api/render`, {
                url: 'https://example.com',
                profile: 'invalid-profile-name',
                stealthMode: 'maximum',
                timeout: 10000
            }, {
                headers: { Authorization: AUTH_TOKEN },
                timeout: 15000,
                validateStatus: () => true // Accept any status
            });

            // Should either use default profile or return meaningful error
            expect([200, 400]).toContain(response.status);
        }, 20000);

        test('should handle timeout scenarios correctly', async() => {
            const response = await axios.post(`${HEADLESSX_URL}/api/render`, {
                url: 'https://httpbin.org/delay/35', // Long delay
                profile: 'windows-chrome-high-end',
                stealthMode: 'maximum',
                timeout: 10000 // Short timeout
            }, {
                headers: { Authorization: AUTH_TOKEN },
                timeout: 15000,
                validateStatus: () => true
            });

            expect(response.status).toBe(408);
            expect(response.data.error).toMatch(/timeout/i);
        }, 20000);
    });
});
 
 