const request = require('supertest');

// Mock environment variables before importing app
process.env.NODE_ENV = 'test';
process.env.AUTH_TOKEN = 'test_token_123';
process.env.PORT = '3001';

describe('HeadlessX Application', () => {
    let app;
    let server;

    beforeAll(async () => {
        try {
            // Import the app after setting environment variables
            app = require('../src/app');
            
            // Start server for testing
            server = app.listen(3001, () => {
                console.log('Test server started on port 3001');
            });
            
            // Wait for server to be ready
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error('Failed to start test server:', error);
            throw error;
        }
    });

    afterAll(async () => {
        if (server) {
            await new Promise((resolve) => {
                server.close(resolve);
            });
        }
    });

    describe('Health Check', () => {
        test('GET /api/health should return 200', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);
            
            expect(response.body).toHaveProperty('status', 'OK');
            expect(response.body).toHaveProperty('timestamp');
        }, 10000);
    });

    describe('Authentication', () => {
        test('GET /api/status without token should return 401', async () => {
            await request(app)
                .get('/api/status')
                .expect(401);
        });

        test('GET /api/status with valid token should return 200', async () => {
            const response = await request(app)
                .get('/api/status')
                .query({ token: 'test_token_123' })
                .expect(200);
            
            expect(response.body).toHaveProperty('status');
        });

        test('GET /api/status with invalid token should return 401', async () => {
            await request(app)
                .get('/api/status')
                .query({ token: 'invalid_token' })
                .expect(401);
        });
    });

    describe('API Endpoints', () => {
        test('POST /api/html with valid token should work', async () => {
            const response = await request(app)
                .post('/api/html')
                .query({ token: 'test_token_123' })
                .send({ url: 'https://example.com' })
                .expect(200);
            
            expect(response.body).toHaveProperty('html');
        }, 15000);

        test('POST /api/html without URL should return 400', async () => {
            await request(app)
                .post('/api/html')
                .query({ token: 'test_token_123' })
                .send({})
                .expect(400);
        });
    });
});