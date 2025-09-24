// Test setup file

// Mock console during tests to reduce noise
global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

// Mock logger for tests
jest.mock('../src/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    },
    generateRequestId: jest.fn(() => 'test_req_123'),
    logWithId: jest.fn()
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.AUTH_TOKEN = 'test_token_123';
process.env.PORT = '3001';

// Global test timeout
jest.setTimeout(30000);

// Cleanup after all tests
afterAll(async() => {
    // Clear any running timers/intervals
    const browserService = require('../src/services/browser');
    if (browserService._stopCleanup) {
        browserService._stopCleanup();
    }

    // Close any open browser instances
    if (browserService.browser) {
        await browserService.closeBrowser();
    }
});
