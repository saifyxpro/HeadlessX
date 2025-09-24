const config = require('../src/config');

describe('Configuration', () => {
    test('should load configuration without errors', () => {
        expect(config).toBeDefined();
        expect(config.server).toBeDefined();
        expect(config.browser).toBeDefined();
        expect(config.security).toBeDefined();
    });

    test('should have required server configuration', () => {
        expect(config.server.port).toBeDefined();
        expect(config.server.host).toBeDefined();
        expect(config.server.authToken).toBeDefined();
    });

    test('should have browser configuration', () => {
        expect(config.browser.headless).toBeDefined();
        expect(config.browser.timeout).toBeGreaterThan(0);
        expect(config.browser.maxConcurrency).toBeGreaterThan(0);
    });

    test('should validate environment variables', () => {
        // This test ensures the config validation doesn't crash
        expect(() => {
            require('../src/config');
        }).not.toThrow();
    });
});
