/**
 * Enhanced Profile Validator v1.3.0
 * Validates device profiles for consistency and anti-detection effectiveness
 */

class ProfileValidator {
    /**
     * Validate device profile consistency
     */
    static validateDeviceProfile(profile) {
        const errors = [];
        const warnings = [];

        // Required fields validation
        const requiredFields = ['id', 'name', 'userAgent', 'screen', 'hardware', 'behavioral'];
        for (const field of requiredFields) {
            if (!profile[field]) {
                errors.push(`Missing required field: ${field}`);
            }
        }

        if (errors.length > 0) {
            return { valid: false, errors, warnings };
        }

        // Screen resolution validation
        if (profile.screen) {
            if (profile.screen.width < 800 || profile.screen.width > 4000) {
                warnings.push(`Unusual screen width: ${profile.screen.width}`);
            }
            if (profile.screen.height < 600 || profile.screen.height > 3000) {
                warnings.push(`Unusual screen height: ${profile.screen.height}`);
            }
            if (profile.screen.availWidth > profile.screen.width) {
                errors.push('availWidth cannot be greater than width');
            }
            if (profile.screen.availHeight > profile.screen.height) {
                errors.push('availHeight cannot be greater than height');
            }
        }

        // Hardware validation
        if (profile.hardware) {
            if (profile.hardware.cores < 1 || profile.hardware.cores > 32) {
                warnings.push(`Unusual core count: ${profile.hardware.cores}`);
            }
            if (profile.hardware.memory < 1024 || profile.hardware.memory > 65536) {
                warnings.push(`Unusual memory amount: ${profile.hardware.memory}MB`);
            }
        }

        // User Agent validation
        if (profile.userAgent) {
            const uaLower = profile.userAgent.toLowerCase();
            if (uaLower.includes('headless') || uaLower.includes('phantom') || uaLower.includes('selenium')) {
                errors.push('User agent contains bot-detection keywords');
            }
        }

        // WebGL validation
        if (profile.webgl) {
            if (!profile.webgl.vendor || !profile.webgl.renderer) {
                warnings.push('WebGL vendor/renderer not specified');
            }
        }

        // Behavioral profile validation
        if (profile.behavioral) {
            const validProfiles = ['confident', 'natural', 'cautious'];
            if (!validProfiles.includes(profile.behavioral.profile)) {
                warnings.push(`Unknown behavioral profile: ${profile.behavioral.profile}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            score: this.calculateProfileScore(profile)
        };
    }

    /**
     * Calculate profile effectiveness score (0-100)
     */
    static calculateProfileScore(profile) {
        let score = 100;

        // Deduct points for missing optional fields
        const optionalFields = ['webgl', 'audio', 'geolocation', 'fonts'];
        for (const field of optionalFields) {
            if (!profile[field]) score -= 5;
        }

        // Deduct points for suspicious values
        if (profile.hardware && profile.hardware.cores > 16) score -= 10;
        if (profile.screen && (profile.screen.width % 10 !== 0 || profile.screen.height % 10 !== 0)) {
            score += 5; // Odd resolutions are actually better for anti-detection
        }

        // Bonus points for comprehensive fingerprint data
        if (profile.webgl && profile.webgl.extensions && profile.webgl.extensions.length > 20) {
            score += 10;
        }

        if (profile.fonts && profile.fonts.length > 20) {
            score += 10;
        }

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Validate profile consistency across multiple sessions
     */
    static validateProfileConsistency(profiles) {
        if (!Array.isArray(profiles) || profiles.length < 2) {
            return { consistent: true, message: 'Need at least 2 profiles to check consistency' };
        }

        const baseProfile = profiles[0];
        const inconsistencies = [];

        for (let i = 1; i < profiles.length; i++) {
            const profile = profiles[i];

            // Check critical fingerprint consistency
            if (profile.screen.width !== baseProfile.screen.width) {
                inconsistencies.push(`Profile ${i}: Screen width mismatch`);
            }

            if (profile.hardware.cores !== baseProfile.hardware.cores) {
                inconsistencies.push(`Profile ${i}: CPU cores mismatch`);
            }

            if (profile.userAgent !== baseProfile.userAgent) {
                inconsistencies.push(`Profile ${i}: User agent mismatch`);
            }
        }

        return {
            consistent: inconsistencies.length === 0,
            inconsistencies,
            score: inconsistencies.length === 0 ? 100 : Math.max(0, 100 - (inconsistencies.length * 10))
        };
    }
}

module.exports = ProfileValidator;
