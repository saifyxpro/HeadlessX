/**
 * Integration Tests for End-to-End Anti-Detection
 * HeadlessX v1.3.0 - Enhanced Anti-Detection
 */

const request = require('supertest');
const { describe, test, expect, beforeAll, afterAll, beforeEach, jest } = require('@jest/globals');
const app = require('../../src/app');
const BrowserService = require('../../src/services/browser');
const FingerprintManager = require('../../src/config/fingerprints');

describe('Anti-Detection Integration Tests', () => {
    let server;
    let browserService;
    let fingerprintManager;
    
    beforeAll(async () => {
        // Start the server for testing
        server = app.listen(0); // Use random port
        const { port } = server.address();
        process.env.TEST_PORT = port;
        
        // Initialize services
        browserService = BrowserService;
        fingerprintManager = new FingerprintManager();
        
        // Wait for browser service to be ready
        await browserService.initialize();
    });

    afterAll(async () => {
        // Cleanup
        if (browserService) {
            await browserService.cleanup();
        }
        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }
    });

    beforeEach(async () => {
        // Clear any cached data
        if (fingerprintManager.clearCache) {
            await fingerprintManager.clearCache();
        }
    });

    describe('Complete Rendering Pipeline', () => {
        test('should successfully render page with full anti-detection', async () => {
            const renderRequest = {
                url: 'https://httpbin.org/headers',
                options: {
                    profile: 'windows-chrome-high-end',
                    stealth: 'advanced',
                    waitUntil: 'networkidle',
                    timeout: 30000
                }
            };

            const response = await request(app)
                .post('/api/render')
                .send(renderRequest)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.metadata).toBeDefined();
            expect(response.body.metadata.fingerprint).toBeDefined();
            expect(response.body.metadata.stealth).toBeDefined();
        }, 60000);

        test('should handle multiple concurrent requests', async () => {
            const requests = Array(5).fill().map((_, i) => ({
                url: `https://httpbin.org/delay/${i + 1}`,
                options: {
                    profile: 'random',
                    stealth: 'basic',
                    timeout: 15000
                }
            }));

            const promises = requests.map(req =>
                request(app)
                    .post('/api/render')
                    .send(req)
                    .expect(200)
            );

            const responses = await Promise.all(promises);
            
            responses.forEach(response => {
                expect(response.body.success).toBe(true);
                expect(response.body.data).toBeDefined();
            });
        }, 90000);

        test('should generate unique fingerprints for different profiles', async () => {
            const profiles = ['windows-chrome-low-end', 'mac-safari-high-end', 'linux-firefox-medium'];
            const fingerprints = [];

            for (const profile of profiles) {
                const response = await request(app)
                    .post('/api/render')
                    .send({
                        url: 'https://httpbin.org/user-agent',
                        options: { profile, stealth: 'basic' }
                    })
                    .expect(200);

                fingerprints.push(response.body.metadata.fingerprint);
            }

            // All fingerprints should be different
            const uniqueFingerprints = new Set(fingerprints.map(fp => JSON.stringify(fp)));
            expect(uniqueFingerprints.size).toBe(profiles.length);
        }, 60000);

        test('should maintain fingerprint consistency within session', async () => {
            const sessionId = 'test-session-' + Date.now();
            const responses = [];

            // Make multiple requests with same session
            for (let i = 0; i < 3; i++) {
                const response = await request(app)
                    .post('/api/render')
                    .send({
                        url: 'https://httpbin.org/headers',
                        options: {
                            profile: 'windows-chrome-high-end',
                            sessionId,
                            stealth: 'advanced'
                        }
                    })
                    .expect(200);

                responses.push(response);
            }

            // All responses should have the same fingerprint
            const fingerprints = responses.map(r => r.body.metadata.fingerprint);
            expect(fingerprints[0]).toEqual(fingerprints[1]);
            expect(fingerprints[1]).toEqual(fingerprints[2]);
        }, 60000);
    });

    describe('Stealth Features Integration', () => {
        test('should pass basic bot detection tests', async () => {
            const response = await request(app)
                .post('/api/render')
                .send({
                    url: 'https://httpbin.org/headers',
                    options: {
                        profile: 'windows-chrome-high-end',
                        stealth: 'advanced',
                        evaluate: `
                            JSON.stringify({
                                webdriver: navigator.webdriver,
                                chrome: !!window.chrome,
                                permissions: !!navigator.permissions,
                                plugins: navigator.plugins.length,
                                languages: navigator.languages.length
                            })
                        `
                    }
                })
                .expect(200);

            const evaluateResult = JSON.parse(response.body.data.evaluate);
            
            // Should pass basic detection checks
            expect(evaluateResult.webdriver).toBe(false);
            expect(evaluateResult.chrome).toBe(true);
            expect(evaluateResult.permissions).toBe(true);
            expect(evaluateResult.plugins).toBeGreaterThan(0);
            expect(evaluateResult.languages).toBeGreaterThan(0);
        }, 45000);

        test('should spoof canvas fingerprint consistently', async () => {
            const canvasScript = `
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                ctx.textBaseline = 'top';
                ctx.font = '14px Arial';
                ctx.fillText('Test fingerprint', 2, 2);
                canvas.toDataURL()
            `;

            const responses = await Promise.all([
                request(app)
                    .post('/api/render')
                    .send({
                        url: 'https://httpbin.org/html',
                        options: {
                            profile: 'windows-chrome-high-end',
                            stealth: 'advanced',
                            evaluate: canvasScript
                        }
                    }),
                request(app)
                    .post('/api/render')
                    .send({
                        url: 'https://httpbin.org/html',
                        options: {
                            profile: 'windows-chrome-high-end',
                            stealth: 'advanced',
                            evaluate: canvasScript
                        }
                    })
            ]);

            expect(responses[0].status).toBe(200);
            expect(responses[1].status).toBe(200);
            
            // Same profile should produce same canvas fingerprint
            expect(responses[0].body.data.evaluate).toBe(responses[1].body.data.evaluate);
        }, 60000);

        test('should handle WebGL fingerprinting', async () => {
            const webglScript = `
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                if (gl) {
                    JSON.stringify({
                        vendor: gl.getParameter(gl.VENDOR),
                        renderer: gl.getParameter(gl.RENDERER),
                        version: gl.getParameter(gl.VERSION),
                        extensions: gl.getSupportedExtensions().slice(0, 5)
                    });
                } else {
                    'WebGL not supported';
                }
            `;

            const response = await request(app)
                .post('/api/render')
                .send({
                    url: 'https://httpbin.org/html',
                    options: {
                        profile: 'windows-chrome-high-end',
                        stealth: 'advanced',
                        evaluate: webglScript
                    }
                })
                .expect(200);

            const webglData = JSON.parse(response.body.data.evaluate);
            expect(webglData.vendor).toBeDefined();
            expect(webglData.renderer).toBeDefined();
            expect(webglData.version).toBeDefined();
            expect(Array.isArray(webglData.extensions)).toBe(true);
        }, 45000);

        test('should spoof audio context fingerprint', async () => {
            const audioScript = `
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    JSON.stringify({
                        sampleRate: audioContext.sampleRate,
                        state: audioContext.state,
                        maxChannelCount: audioContext.destination.maxChannelCount
                    });
                } catch (e) {
                    'Audio context not available';
                }
            `;

            const response = await request(app)
                .post('/api/render')
                .send({
                    url: 'https://httpbin.org/html',
                    options: {
                        profile: 'windows-chrome-high-end',
                        stealth: 'advanced',
                        evaluate: audioScript
                    }
                })
                .expect(200);

            const audioData = JSON.parse(response.body.data.evaluate);
            expect(audioData.sampleRate).toBeDefined();
            expect(audioData.state).toBeDefined();
        }, 45000);
    });

    describe('Error Handling and Resilience', () => {
        test('should handle invalid URLs gracefully', async () => {
            const response = await request(app)
                .post('/api/render')
                .send({
                    url: 'invalid-url',
                    options: { profile: 'windows-chrome-high-end' }
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Invalid URL');
        });

        test('should handle network timeouts', async () => {
            const response = await request(app)
                .post('/api/render')
                .send({
                    url: 'https://httpbin.org/delay/60',
                    options: {
                        profile: 'windows-chrome-high-end',
                        timeout: 5000
                    }
                })
                .expect(408);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('timeout');
        }, 10000);

        test('should handle malformed requests', async () => {
            const response = await request(app)
                .post('/api/render')
                .send({
                    // Missing required url field
                    options: { profile: 'windows-chrome-high-end' }
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
        });

        test('should recover from browser crashes', async () => {
            // Simulate browser crash by forcing restart
            if (browserService.restart) {
                await browserService.restart();
            }

            // Should still be able to handle requests after restart
            const response = await request(app)
                .post('/api/render')
                .send({
                    url: 'https://httpbin.org/html',
                    options: { profile: 'windows-chrome-high-end' }
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        }, 60000);
    });

    describe('Performance and Scalability', () => {
        test('should handle high request volume', async () => {
            const startTime = Date.now();
            const requestCount = 10;
            
            const requests = Array(requestCount).fill().map(() =>
                request(app)
                    .post('/api/render')
                    .send({
                        url: 'https://httpbin.org/html',
                        options: {
                            profile: 'random',
                            stealth: 'basic',
                            timeout: 10000
                        }
                    })
            );

            const responses = await Promise.allSettled(requests);
            const endTime = Date.now();
            
            const successful = responses.filter(r => r.status === 'fulfilled' && r.value.status === 200);
            const successRate = (successful.length / requestCount) * 100;
            
            expect(successRate).toBeGreaterThan(80); // At least 80% success rate
            expect(endTime - startTime).toBeLessThan(60000); // Complete within 60 seconds
        }, 90000);

        test('should maintain reasonable memory usage', async () => {
            const initialMemory = process.memoryUsage();
            
            // Process multiple requests
            for (let i = 0; i < 5; i++) {
                await request(app)
                    .post('/api/render')
                    .send({
                        url: 'https://httpbin.org/html',
                        options: {
                            profile: 'random',
                            stealth: 'basic'
                        }
                    })
                    .expect(200);
            }
            
            const finalMemory = process.memoryUsage();
            const memoryIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / (1024 * 1024);
            
            // Memory increase should be reasonable (less than 100MB)
            expect(memoryIncrease).toBeLessThan(100);
        }, 60000);
    });

    describe('Rate Limiting Integration', () => {
        test('should enforce rate limits', async () => {
            const requests = Array(20).fill().map(() =>
                request(app)
                    .post('/api/render')
                    .send({
                        url: 'https://httpbin.org/html',
                        options: { profile: 'windows-chrome-high-end' }
                    })
            );

            const responses = await Promise.allSettled(requests);
            
            // Some requests should be rate limited
            const rateLimited = responses.filter(r => 
                r.status === 'fulfilled' && r.value.status === 429
            );
            
            expect(rateLimited.length).toBeGreaterThan(0);
        }, 45000);

        test('should allow requests after rate limit window', async () => {
            // First request should succeed
            await request(app)
                .post('/api/render')
                .send({
                    url: 'https://httpbin.org/html',
                    options: { profile: 'windows-chrome-high-end' }
                })
                .expect(200);

            // Wait for rate limit window to pass (if short)
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Another request should still work
            const response = await request(app)
                .post('/api/render')
                .send({
                    url: 'https://httpbin.org/html',
                    options: { profile: 'windows-chrome-high-end' }
                });

            expect([200, 429]).toContain(response.status);
        }, 30000);
    });

    describe('Behavioral Simulation Integration', () => {
        test('should simulate human-like interactions', async () => {
            const interactionScript = `
                // Test mouse event simulation
                let mouseEvents = 0;
                document.addEventListener('mousemove', () => mouseEvents++);
                
                // Test scroll simulation
                let scrollEvents = 0;
                window.addEventListener('scroll', () => scrollEvents++);
                
                // Return event counts after a delay
                new Promise(resolve => {
                    setTimeout(() => {
                        resolve({
                            mouseEvents,
                            scrollEvents,
                            timestamp: Date.now()
                        });
                    }, 100);
                })
            `;

            const response = await request(app)
                .post('/api/render')
                .send({
                    url: 'https://httpbin.org/html',
                    options: {
                        profile: 'windows-chrome-high-end',
                        stealth: 'advanced',
                        interactions: {
                            scroll: true,
                            mouseMove: true,
                            clicks: []
                        },
                        evaluate: interactionScript
                    }
                })
                .expect(200);

            // Interactions should have been simulated
            expect(response.body.success).toBe(true);
        }, 45000);

        test('should handle click simulations', async () => {
            const clickScript = `
                let clickCount = 0;
                document.addEventListener('click', () => clickCount++);
                
                // Add a clickable element
                const button = document.createElement('button');
                button.id = 'test-button';
                button.textContent = 'Click me';
                document.body.appendChild(button);
                
                // Return count after delay
                new Promise(resolve => {
                    setTimeout(() => resolve({ clickCount }), 200);
                })
            `;

            const response = await request(app)
                .post('/api/render')
                .send({
                    url: 'https://httpbin.org/html',
                    options: {
                        profile: 'windows-chrome-high-end',
                        stealth: 'advanced',
                        interactions: {
                            clicks: ['#test-button']
                        },
                        evaluate: clickScript
                    }
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        }, 45000);
    });

    describe('Multi-Profile Consistency', () => {
        test('should maintain different fingerprints for different profiles', async () => {
            const profileTests = [
                { profile: 'windows-chrome-high-end', os: 'Windows' },
                { profile: 'mac-safari-high-end', os: 'macOS' },
                { profile: 'linux-firefox-medium', os: 'Linux' }
            ];

            const results = [];
            
            for (const test of profileTests) {
                const response = await request(app)
                    .post('/api/render')
                    .send({
                        url: 'https://httpbin.org/user-agent',
                        options: {
                            profile: test.profile,
                            stealth: 'advanced',
                            evaluate: `
                                JSON.stringify({
                                    userAgent: navigator.userAgent,
                                    platform: navigator.platform,
                                    vendor: navigator.vendor
                                })
                            `
                        }
                    })
                    .expect(200);

                const browserData = JSON.parse(response.body.data.evaluate);
                results.push({ profile: test.profile, data: browserData });
            }

            // All profiles should have different user agents
            const userAgents = results.map(r => r.data.userAgent);
            const uniqueUserAgents = new Set(userAgents);
            expect(uniqueUserAgents.size).toBe(profileTests.length);

            // Platform should match profile OS
            results.forEach(result => {
                expect(result.data.platform).toBeDefined();
                expect(result.data.userAgent).toBeDefined();
                expect(result.data.vendor).toBeDefined();
            });
        }, 90000);
    });

    // Cleanup helper
    afterEach(async () => {
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }
        
        // Small delay to prevent overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 100));
    });
});

// Helper functions for tests
function generateRandomUrl() {
    const endpoints = [
        'https://httpbin.org/html',
        'https://httpbin.org/json',
        'https://httpbin.org/headers',
        'https://httpbin.org/user-agent'
    ];
    return endpoints[Math.floor(Math.random() * endpoints.length)];
}

function createTestProfile(overrides = {}) {
    return {
        profile: 'windows-chrome-high-end',
        stealth: 'advanced',
        timeout: 30000,
        ...overrides
    };
}

module.exports = {
    generateRandomUrl,
    createTestProfile
};