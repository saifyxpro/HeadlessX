const request = require('supertest');
const { spawn } = require('child_process');

describe('Integration Tests', () => {
    let server;
    let serverProcess;

    beforeAll(async () => {
        // Set test environment
        process.env.NODE_ENV = 'test';
        process.env.AUTH_TOKEN = 'test_integration_token';
        process.env.PORT = '3002';

        // Start server process
        serverProcess = spawn('node', ['src/app.js'], {
            env: { ...process.env },
            stdio: 'pipe'
        });

        // Wait for server to start
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Server failed to start within timeout'));
            }, 10000);

            serverProcess.stdout.on('data', (data) => {
                if (data.toString().includes('Server running on')) {
                    clearTimeout(timeout);
                    resolve();
                }
            });

            serverProcess.stderr.on('data', (data) => {
                console.error('Server error:', data.toString());
            });
        });

        // Create request instance
        server = request('http://localhost:3002');
    });

    afterAll(async () => {
        if (serverProcess) {
            serverProcess.kill('SIGTERM');
            
            // Wait for graceful shutdown
            await new Promise((resolve) => {
                serverProcess.on('close', resolve);
                setTimeout(() => {
                    serverProcess.kill('SIGKILL');
                    resolve();
                }, 5000);
            });
        }
    });

    describe('Health Endpoints', () => {
        test('GET /api/health should return server status', async () => {
            const response = await server
                .get('/api/health')
                .expect(200);

            expect(response.body).toMatchObject({
                status: 'ok',
                timestamp: expect.any(String)
            });
        });

        test('GET /api/status should require authentication', async () => {
            await server
                .get('/api/status')
                .expect(401);
        });

        test('GET /api/status with token should return server info', async () => {
            const response = await server
                .get('/api/status')
                .query({ token: 'test_integration_token' })
                .expect(200);

            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('uptime');
        });
    });

    describe('HTML Extraction', () => {
        test('POST /api/html should extract HTML from valid URL', async () => {
            const response = await server
                .post('/api/html')
                .query({ token: 'test_integration_token' })
                .send({ url: 'https://httpbin.org/html' })
                .timeout(30000)
                .expect(200);

            expect(response.body).toHaveProperty('html');
            expect(response.body.html).toContain('<!DOCTYPE html>');
        }, 35000);

        test('POST /api/html should handle invalid URLs', async () => {
            await server
                .post('/api/html')
                .query({ token: 'test_integration_token' })
                .send({ url: 'invalid-url' })
                .expect(400);
        });
    });

    describe('Screenshot Generation', () => {
        test('POST /api/screenshot should generate screenshot', async () => {
            const response = await server
                .post('/api/screenshot')
                .query({ token: 'test_integration_token' })
                .send({ url: 'https://httpbin.org/html' })
                .timeout(30000)
                .expect(200);

            expect(response.body).toHaveProperty('screenshot');
            expect(response.body.screenshot).toMatch(/^data:image\/png;base64,/);
        }, 35000);
    });

    describe('Error Handling', () => {
        test('should handle non-existent endpoints', async () => {
            await server
                .get('/api/nonexistent')
                .query({ token: 'test_integration_token' })
                .expect(404);
        });

        test('should handle malformed JSON', async () => {
            await server
                .post('/api/html')
                .query({ token: 'test_integration_token' })
                .set('Content-Type', 'application/json')
                .send('invalid json')
                .expect(400);
        });
    });
});