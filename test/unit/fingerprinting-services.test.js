/**
 * HeadlessX v1.3.0 - Fingerprinting Services Unit Tests
 * Focused on high level fingerprint orchestration rather than individual polyfills.
 */

const FingerprintManager = require('../../src/config/fingerprints');
const StealthService = require('../../src/services/stealth');

describe('Fingerprint orchestration', () => {
    let manager;

    beforeEach(() => {
        manager = new FingerprintManager();
    });

    test('generateProfile returns stable structure with entropy', () => {
        const profile = manager.generateProfile('windows-chrome-high-end', { seed: 'unit-test-seed' });

        expect(profile).toBeDefined();
        expect(profile).toHaveProperty('id');
        expect(profile.profileId).toBe('windows-chrome-high-end');
        expect(profile.entropy).toHaveLength(64);
        expect(profile.viewport).toMatchObject({ width: expect.any(Number), height: expect.any(Number) });
        expect(profile.headers['User-Agent']).toBeUndefined();
    });

    test('buildContextOptions merges overrides without losing fingerprint fidelity', () => {
        const fingerprint = manager.generateProfile('windows-chrome-mid-range', { seed: 'ctx-options' });
        const overrides = { locale: 'fr-FR', extraHTTPHeaders: { 'X-Test': 'yes' } };

        const contextOptions = manager.buildContextOptions(fingerprint, overrides);

        expect(contextOptions.locale).toBe('fr-FR');
        expect(contextOptions.viewport.width).toBe(fingerprint.viewport.width);
        expect(contextOptions.extraHTTPHeaders['User-Agent']).toBeUndefined();
        expect(contextOptions.extraHTTPHeaders['Accept-Language']).toBe(fingerprint.headers['Accept-Language']);
        expect(contextOptions.extraHTTPHeaders['X-Test']).toBe('yes');
    });
});

describe('StealthService helpers', () => {
    test('generateAdvancedFingerprint produces id and entropy', () => {
        const fingerprint = StealthService.generateAdvancedFingerprint('unit-test-buid', 'mid-range-desktop');

        expect(fingerprint.id).toBeDefined();
        expect(typeof fingerprint.id).toBe('string');
        expect(fingerprint.entropy).toHaveLength(64);
        expect(fingerprint.languages).toContain('en-US');
    });

    test('buildContextOptionsFromFingerprint derives sane defaults', () => {
        const fingerprint = StealthService.generateAdvancedFingerprint('context-seed', 'mid-range-desktop');
        const contextOptions = StealthService.buildContextOptionsFromFingerprint(fingerprint);

        expect(contextOptions.userAgent).toBe(fingerprint.userAgent);
        expect(contextOptions.viewport.width).toBe(fingerprint.viewportWidth);
        expect(contextOptions.locale).toBe(fingerprint.locale);
        expect(contextOptions.timezoneId).toBe(fingerprint.timezone);
    });
});
