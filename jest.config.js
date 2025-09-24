module.exports = {
    testEnvironment: 'node',
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    testMatch: [
        '**/test/**/*.test.js',
        '**/test/**/*.spec.js'
    ],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/**/*.test.js',
        '!src/**/*.spec.js'
    ],
    setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
    testTimeout: 30000,
    verbose: true,
    forceExit: true,
    detectOpenHandles: true
};