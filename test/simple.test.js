const request = require('supertest');
const { spawn } = require('child_process');

describe('Basic Integration Test', () => {
    let server;
    let serverProcess;

    beforeAll(async () => {
        process.env.NODE_ENV = 'test';
        process.env.PORT = '3001';

        serverProcess = spawn('node', ['src/server.js'], {
            env: { ...process.env, PORT: '3001' },
            stdio: 'pipe'
        });

        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Server timeout'));
            }, 20000);

            let output = '';
            serverProcess.stdout.on('data', (data) => {
                output += data.toString();
                if (output.includes('✅ v1.3.0 Server ready')) {
                    clearTimeout(timeout);
                    resolve();
                }
            });
        });

        server = request('http://localhost:3001');
    });

    afterAll(async () => {
        if (serverProcess) {
            serverProcess.kill('SIGTERM');
        }
    });

    test('health endpoint works', async () => {
        const response = await server.get('/api/health').expect(200);
        expect(response.body).toHaveProperty('status');
    });
});