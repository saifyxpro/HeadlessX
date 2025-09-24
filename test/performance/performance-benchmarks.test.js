/**
 * HeadlessX v1.3.0 - Performance Benchmarks
 * Comprehensive performance testing for all enhanced features
 */

const axios = require('axios');
const { expect } = require('@jest/globals');
const fs = require('fs').promises;
const path = require('path');

describe('Performance Benchmarks', () => {
    const HEADLESSX_URL = process.env.TEST_URL || 'http://localhost:3000';
    const AUTH_TOKEN = process.env.AUTH_TOKEN || 'test-token';
    const RESULTS_FILE = path.join(__dirname, '../../test-results/performance-results.json');
    
    const performanceResults = {
        timestamp: new Date().toISOString(),
        version: '1.3.0',
        tests: {}
    };

    beforeAll(async() => {
        // Ensure results directory exists
        await fs.mkdir(path.dirname(RESULTS_FILE), { recursive: true });
    });

    afterAll(async() => {
        // Save performance results
        await fs.writeFile(RESULTS_FILE, JSON.stringify(performanceResults, null, 2));
        console.log(`Performance results saved to ${RESULTS_FILE}`);
    });

    describe('Basic Rendering Performance', () => {
        test('should render simple page within acceptable time', async() => {
            const startTime = Date.now();
            
            const response = await axios.post(`${HEADLESSX_URL}/api/render`, {
                url: 'https://example.com',
                profile: 'windows-chrome-high-end',
                timeout: 30000
            }, {
                headers: { Authorization: AUTH_TOKEN },
                timeout: 35000
            });

            const endTime = Date.now();
            const renderTime = endTime - startTime;

            expect(response.data.success).toBe(true);
            expect(renderTime).toBeLessThan(10000); // Should complete within 10 seconds

            performanceResults.tests.basicRender = {
                renderTime,
                success: true,
                threshold: 10000
            };
        }, 40000);

        test('should handle concurrent requests efficiently', async() => {
            const concurrentRequests = 5;
            const startTime = Date.now();
            
            const requests = Array(concurrentRequests).fill().map(() =>
                axios.post(`${HEADLESSX_URL}/api/render`, {
                    url: 'https://httpbin.org/delay/1',
                    profile: 'windows-chrome-high-end',
                    timeout: 30000
                }, {
                    headers: { Authorization: AUTH_TOKEN },
                    timeout: 35000
                })
            );

            const responses = await Promise.all(requests);
            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const averageTime = totalTime / concurrentRequests;

            responses.forEach(response => {
                expect(response.data.success).toBe(true);
            });

            expect(averageTime).toBeLessThan(8000); // Average should be reasonable

            performanceResults.tests.concurrentRequests = {
                concurrentRequests,
                totalTime,
                averageTime,
                allSuccessful: responses.every(r => r.data.success),
                threshold: 8000
            };
        }, 60000);
    });

    describe('Stealth Mode Performance Impact', () => {
        const stealthModes = ['basic', 'advanced', 'maximum'];

        stealthModes.forEach(stealthMode => {
            test(`should maintain performance with ${stealthMode} stealth mode`, async() => {
                const startTime = Date.now();
                
                const response = await axios.post(`${HEADLESSX_URL}/api/render`, {
                    url: 'https://httpbin.org/user-agent',
                    profile: 'windows-chrome-high-end',
                    stealthMode,
                    timeout: 30000
                }, {
                    headers: { Authorization: AUTH_TOKEN },
                    timeout: 35000
                });

                const endTime = Date.now();
                const renderTime = endTime - startTime;

                expect(response.data.success).toBe(true);
                
                // Maximum stealth should add minimal overhead
                const maxAcceptableTime = stealthMode === 'maximum' ? 15000 : 12000;
                expect(renderTime).toBeLessThan(maxAcceptableTime);

                performanceResults.tests[`stealth_${stealthMode}`] = {
                    stealthMode,
                    renderTime,
                    success: true,
                    threshold: maxAcceptableTime
                };
            }, 40000);
        });
    });

    describe('Profile Loading Performance', () => {
        const profiles = [
            'windows-chrome-high-end',
            'windows-chrome-mid-range',
            'firefox-windows-high-end',
            'mobile-android-chrome',
            'mobile-iphone-safari'
        ];

        profiles.forEach(profile => {
            test(`should load ${profile} profile efficiently`, async() => {
                const startTime = Date.now();
                
                const response = await axios.post(`${HEADLESSX_URL}/api/render`, {
                    url: 'https://httpbin.org/user-agent',
                    profile,
                    stealthMode: 'advanced',
                    timeout: 30000
                }, {
                    headers: { Authorization: AUTH_TOKEN },
                    timeout: 35000
                });

                const endTime = Date.now();
                const renderTime = endTime - startTime;

                expect(response.data.success).toBe(true);
                expect(renderTime).toBeLessThan(12000); // Profile loading shouldn't add much overhead

                performanceResults.tests[`profile_${profile.replace(/-/g, '_')}`] = {
                    profile,
                    renderTime,
                    success: true,
                    threshold: 12000
                };
            }, 40000);
        });
    });

    describe('Memory Usage Tests', () => {
        test('should handle multiple sequential requests without memory leaks', async() => {
            const sequentialRequests = 10;
            const results = [];
            
            for (let i = 0; i < sequentialRequests; i++) {
                const startTime = Date.now();
                
                const response = await axios.post(`${HEADLESSX_URL}/api/render`, {
                    url: 'https://httpbin.org/html',
                    profile: 'windows-chrome-high-end',
                    stealthMode: 'advanced',
                    timeout: 30000
                }, {
                    headers: { Authorization: AUTH_TOKEN },
                    timeout: 35000
                });

                const endTime = Date.now();
                const renderTime = endTime - startTime;

                expect(response.data.success).toBe(true);
                results.push({ index: i, renderTime, success: response.data.success });

                // Brief pause between requests
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Performance should remain consistent (no significant degradation)
            const firstFive = results.slice(0, 5).map(r => r.renderTime);
            const lastFive = results.slice(-5).map(r => r.renderTime);
            
            const firstAvg = firstFive.reduce((a, b) => a + b, 0) / firstFive.length;
            const lastAvg = lastFive.reduce((a, b) => a + b, 0) / lastFive.length;
            
            // Last five shouldn't be more than 50% slower than first five
            expect(lastAvg).toBeLessThan(firstAvg * 1.5);

            performanceResults.tests.memoryUsage = {
                sequentialRequests,
                results,
                firstAvg,
                lastAvg,
                degradationRatio: lastAvg / firstAvg,
                threshold: 1.5
            };
        }, 300000); // 5 minutes timeout
    });

    describe('Advanced Features Performance', () => {
        test('should handle Canvas fingerprinting with minimal impact', async() => {
            const withoutCanvas = await measureRenderTime({
                url: 'https://abrahamjuliot.github.io/creepjs',
                profile: 'windows-chrome-high-end',
                stealthMode: 'advanced',
                canvasNoise: false
            });

            const withCanvas = await measureRenderTime({
                url: 'https://abrahamjuliot.github.io/creepjs',
                profile: 'windows-chrome-high-end',
                stealthMode: 'advanced',
                canvasNoise: true
            });

            expect(withoutCanvas.success).toBe(true);
            expect(withCanvas.success).toBe(true);
            
            // Canvas fingerprinting shouldn't add more than 2 seconds
            expect(withCanvas.time - withoutCanvas.time).toBeLessThan(2000);

            performanceResults.tests.canvasFingerprinting = {
                withoutCanvas: withoutCanvas.time,
                withCanvas: withCanvas.time,
                overhead: withCanvas.time - withoutCanvas.time,
                threshold: 2000
            };
        }, 80000);

        test('should handle WebGL spoofing efficiently', async() => {
            const response = await measureRenderTime({
                url: 'https://webglreport.com',
                profile: 'windows-chrome-high-end',
                stealthMode: 'maximum',
                webglSpoofing: true
            });

            expect(response.success).toBe(true);
            expect(response.time).toBeLessThan(20000); // WebGL testing page might be slower

            performanceResults.tests.webglSpoofing = {
                renderTime: response.time,
                success: true,
                threshold: 20000
            };
        }, 40000);

        test('should handle behavioral simulation with acceptable overhead', async() => {
            const withoutBehavior = await measureRenderTime({
                url: 'https://example.com',
                profile: 'windows-chrome-high-end',
                stealthMode: 'advanced',
                simulateHuman: false
            });

            const withBehavior = await measureRenderTime({
                url: 'https://example.com',
                profile: 'windows-chrome-high-end',
                stealthMode: 'advanced',
                simulateHuman: true,
                actions: [
                    { type: 'move', x: 100, y: 100 },
                    { type: 'scroll', y: 300 },
                    { type: 'move', x: 200, y: 200 }
                ]
            });

            expect(withoutBehavior.success).toBe(true);
            expect(withBehavior.success).toBe(true);
            
            // Behavioral simulation shouldn't add more than 3 seconds
            expect(withBehavior.time - withoutBehavior.time).toBeLessThan(3000);

            performanceResults.tests.behavioralSimulation = {
                withoutBehavior: withoutBehavior.time,
                withBehavior: withBehavior.time,
                overhead: withBehavior.time - withoutBehavior.time,
                threshold: 3000
            };
        }, 60000);
    });

    describe('Batch Processing Performance', () => {
        test('should handle batch requests efficiently', async() => {
            const urls = [
                'https://example.com',
                'https://httpbin.org/user-agent',
                'https://httpbin.org/ip',
                'https://httpbin.org/headers',
                'https://httpbin.org/html'
            ];

            const startTime = Date.now();
            
            const response = await axios.post(`${HEADLESSX_URL}/api/batch`, {
                requests: urls.map(url => ({
                    url,
                    profile: 'windows-chrome-high-end',
                    stealthMode: 'advanced'
                })),
                timeout: 60000
            }, {
                headers: { Authorization: AUTH_TOKEN },
                timeout: 70000
            });

            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const averageTime = totalTime / urls.length;

            expect(response.data.success).toBe(true);
            expect(response.data.results).toHaveLength(urls.length);
            expect(averageTime).toBeLessThan(10000); // Average per URL should be reasonable

            performanceResults.tests.batchProcessing = {
                urlCount: urls.length,
                totalTime,
                averageTime,
                success: true,
                threshold: 10000
            };
        }, 80000);
    });

    // Helper function to measure render time
    async function measureRenderTime(options) {
        const startTime = Date.now();
        
        try {
            const response = await axios.post(`${HEADLESSX_URL}/api/render`, {
                timeout: 30000,
                ...options
            }, {
                headers: { Authorization: AUTH_TOKEN },
                timeout: 35000
            });

            const endTime = Date.now();
            return {
                time: endTime - startTime,
                success: response.data.success,
                data: response.data
            };
        } catch (error) {
            const endTime = Date.now();
            return {
                time: endTime - startTime,
                success: false,
                error: error.message
            };
        }
    }
});
 
 