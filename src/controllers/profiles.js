/**
 * Profiles Controller v1.3.0
 * Manages device profiles and fingerprint configurations
 */

const fs = require('fs').promises;
const path = require('path');
const ProfileValidator = require('../utils/profile-validator');
const StealthService = require('../services/stealth');
const { logger } = require('../utils/logger');

class ProfilesController {
    /**
     * Get all available device profiles
     */
    static async getProfiles(req, res) {
        const requestId = req.requestId;

        try {
            const profilesPath = path.join(__dirname, '..', 'config', 'profiles');

            const profiles = {
                chrome: await this.loadProfilesFromFile(path.join(profilesPath, 'chrome-profiles.json')),
                device: this.getDeviceProfiles(),
                geolocation: this.getGeolocationProfiles(),
                behavioral: this.getBehavioralProfiles()
            };

            logger.info(requestId, 'Retrieved device profiles', {
                chromeCount: profiles.chrome.length,
                deviceCount: Object.keys(profiles.device).length,
                geoCount: Object.keys(profiles.geolocation).length
            });

            res.json({
                timestamp: new Date().toISOString(),
                version: '1.3.0',
                profiles
            });
        } catch (error) {
            logger.error(requestId, 'Failed to retrieve profiles', error);
            res.status(500).json({
                error: 'Failed to retrieve profiles',
                details: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Validate a device profile
     */
    static async validateProfile(req, res) {
        const requestId = req.requestId;

        try {
            const { profile, checkConsistency = false } = req.body;

            if (!profile) {
                return res.status(400).json({
                    error: 'Profile data is required',
                    timestamp: new Date().toISOString()
                });
            }

            logger.info(requestId, 'Validating device profile', {
                profileId: profile.id || 'unknown',
                checkConsistency
            });

            // Basic profile validation
            const validation = ProfileValidator.validateDeviceProfile(profile);

            // Consistency check if multiple profiles provided
            let consistencyCheck = null;
            if (checkConsistency && Array.isArray(profile)) {
                consistencyCheck = ProfileValidator.validateProfileConsistency(profile);
            }

            // Generate test fingerprint to verify profile completeness
            let fingerprintTest = null;
            if (validation.valid) {
                try {
                    fingerprintTest = StealthService.generateAdvancedFingerprint(
                        undefined,
                        profile.behavioral?.profile || 'natural'
                    );
                } catch (fpError) {
                    validation.warnings.push(`Fingerprint generation warning: ${fpError.message}`);
                }
            }

            const response = {
                timestamp: new Date().toISOString(),
                requestId,
                validation,
                consistencyCheck,
                fingerprintTest: fingerprintTest
                    ? {
                        generated: true,
                        id: fingerprintTest.id,
                        components: Object.keys(fingerprintTest)
                    }
                    : null,
                recommendations: this.generateProfileRecommendations(validation, profile)
            };

            const statusCode = validation.valid ? 200 : 400;

            logger.info(requestId, 'Profile validation completed', {
                valid: validation.valid,
                score: validation.score,
                errors: validation.errors.length,
                warnings: validation.warnings.length
            });

            res.status(statusCode).json(response);
        } catch (error) {
            logger.error(requestId, 'Profile validation failed', error);
            res.status(500).json({
                error: 'Profile validation failed',
                details: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Generate new fingerprint profile
     */
    static async generateFingerprint(req, res) {
        const requestId = req.requestId;

        try {
            const {
                deviceProfile = 'mid-range-desktop',
                geoProfile = 'us-east',
                behaviorProfile = 'natural',
                consistency = 'high',
                customSeed
            } = req.body;

            logger.info(requestId, 'Generating fingerprint profile', {
                deviceProfile,
                geoProfile,
                behaviorProfile,
                consistency
            });

            // Generate base fingerprint
            const seed = customSeed || undefined;
            const fingerprint = StealthService.generateAdvancedFingerprint(seed, deviceProfile);

            // Add geolocation data
            const geoData = this.getGeolocationProfiles()[geoProfile];
            if (geoData) {
                fingerprint.geolocation = {
                    latitude: geoData.latitude,
                    longitude: geoData.longitude,
                    timezone: geoData.timezone,
                    accuracy: 20 + Math.random() * 30
                };
            }

            // Enhanced behavioral data
            const behaviorData = this.getBehavioralProfiles()[behaviorProfile];
            if (behaviorData) {
                fingerprint.behavioral = { ...fingerprint.behavioral, ...behaviorData };
            }

            // Consistency scoring
            const consistencyScore = this.calculateConsistencyScore(fingerprint, consistency);

            const response = {
                timestamp: new Date().toISOString(),
                requestId,
                profiles: {
                    device: deviceProfile,
                    geolocation: geoProfile,
                    behavior: behaviorProfile
                },
                fingerprint: {
                    id: fingerprint.id,
                    buid: fingerprint.BUID,
                    userAgent: fingerprint.userAgent,
                    screen: {
                        width: fingerprint.screenWidth,
                        height: fingerprint.screenHeight,
                        pixelRatio: fingerprint.devicePixelRatio
                    },
                    hardware: {
                        cores: fingerprint.hardwareConcurrency,
                        memory: fingerprint.deviceMemory,
                        platform: fingerprint.platform
                    },
                    webgl: fingerprint.webgl,
                    canvas: fingerprint.canvas,
                    audioContext: fingerprint.audioContext,
                    webrtc: fingerprint.webrtc,
                    geolocation: fingerprint.geolocation,
                    behavioral: fingerprint.behavioral
                },
                metadata: {
                    consistencyScore,
                    entropyLevel: fingerprint.entropy.length,
                    uniquenessHash: fingerprint.id.substring(0, 12),
                    generatedAt: new Date().toISOString()
                }
            };

            logger.info(requestId, 'Fingerprint profile generated successfully', {
                fingerprintId: fingerprint.id,
                consistencyScore
            });

            res.json(response);
        } catch (error) {
            logger.error(requestId, 'Fingerprint generation failed', error);
            res.status(500).json({
                error: 'Fingerprint generation failed',
                details: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get stealth configuration status
     */
    static getStealthStatus(req, res) {
        const requestId = req.requestId;

        try {
            const status = {
                timestamp: new Date().toISOString(),
                version: '1.3.0',
                features: {
                    canvasFingerprinting: 'enabled',
                    webglSpoofing: 'enabled',
                    audioContextSpoofing: 'enabled',
                    webrtcBlocking: 'enabled',
                    behaviorSimulation: 'enabled',
                    timezoneManagement: 'enabled',
                    hardwareNoise: 'enabled',
                    advancedStealth: 'enabled'
                },
                availableProfiles: {
                    device: Object.keys(this.getDeviceProfiles()),
                    geolocation: Object.keys(this.getGeolocationProfiles()),
                    behavioral: Object.keys(this.getBehavioralProfiles())
                },
                statistics: {
                    totalDeviceProfiles: Object.keys(this.getDeviceProfiles()).length,
                    totalGeoProfiles: Object.keys(this.getGeolocationProfiles()).length,
                    totalBehaviorProfiles: Object.keys(this.getBehavioralProfiles()).length,
                    activeSessions: 0 // Would be tracked in production
                },
                configuration: {
                    defaultDeviceProfile: 'mid-range-desktop',
                    defaultGeoProfile: 'us-east',
                    defaultBehaviorProfile: 'natural',
                    maxConcurrency: 3,
                    timeoutMs: 60000
                }
            };

            logger.info(requestId, 'Stealth status retrieved');
            res.json(status);
        } catch (error) {
            logger.error(requestId, 'Failed to get stealth status', error);
            res.status(500).json({
                error: 'Failed to get stealth status',
                details: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Helper methods

    /**
     * Load profiles from JSON file
     */
    static async loadProfilesFromFile(filePath) {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.warn(`Could not load profiles from ${filePath}:`, error.message);
            return [];
        }
    }

    /**
     * Get device profiles from browser service
     */
    static getDeviceProfiles() {
        return {
            'high-end-desktop': {
                name: 'High-End Desktop',
                viewport: { width: 1920, height: 1080 },
                hardware: { cores: 8, memory: 16, devicePixelRatio: 1 },
                behavioral: 'confident'
            },
            'mid-range-desktop': {
                name: 'Mid-Range Desktop',
                viewport: { width: 1366, height: 768 },
                hardware: { cores: 4, memory: 8, devicePixelRatio: 1 },
                behavioral: 'natural'
            },
            'business-laptop': {
                name: 'Business Laptop',
                viewport: { width: 1280, height: 720 },
                hardware: { cores: 4, memory: 8, devicePixelRatio: 1 },
                behavioral: 'cautious'
            }
        };
    }

    /**
     * Get geolocation profiles
     */
    static getGeolocationProfiles() {
        return {
            'us-east': { latitude: 40.7128, longitude: -74.0060, timezone: 'America/New_York' },
            'us-west': { latitude: 34.0522, longitude: -118.2437, timezone: 'America/Los_Angeles' },
            'us-central': { latitude: 41.8781, longitude: -87.6298, timezone: 'America/Chicago' },
            uk: { latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' },
            germany: { latitude: 52.5200, longitude: 13.4050, timezone: 'Europe/Berlin' },
            france: { latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris' },
            canada: { latitude: 45.5017, longitude: -73.5673, timezone: 'America/Toronto' },
            australia: { latitude: -33.8688, longitude: 151.2093, timezone: 'Australia/Sydney' }
        };
    }

    /**
     * Get behavioral profiles
     */
    static getBehavioralProfiles() {
        return {
            confident: { mouseSpeed: { min: 800, max: 1500 }, scrollPattern: 'aggressive' },
            natural: { mouseSpeed: { min: 600, max: 1000 }, scrollPattern: 'smooth' },
            cautious: { mouseSpeed: { min: 400, max: 700 }, scrollPattern: 'careful' }
        };
    }

    /**
     * Generate profile improvement recommendations
     */
    static generateProfileRecommendations(validation, profile) {
        const recommendations = [];

        if (validation.score < 70) {
            recommendations.push('Consider adding WebGL renderer information for better anti-detection');
            recommendations.push('Add comprehensive font list to improve fingerprint authenticity');
        }

        if (validation.score < 50) {
            recommendations.push('Profile needs significant improvement - consider using a pre-built profile');
        }

        if (validation.warnings.length > 0) {
            recommendations.push('Address profile warnings to improve effectiveness');
        }

        if (!profile.webgl || !profile.webgl.extensions) {
            recommendations.push('Add WebGL extensions list for more realistic GPU fingerprint');
        }

        return recommendations;
    }

    /**
     * Calculate consistency score for generated fingerprint
     */
    static calculateConsistencyScore(fingerprint, level) {
        let score = 80; // Base score

        // Check for consistency across fingerprint components
        if (fingerprint.webgl && fingerprint.webgl.renderer) score += 10;
        if (fingerprint.canvas && fingerprint.canvas.noise) score += 5;
        if (fingerprint.audioContext) score += 5;

        // Adjust based on requested consistency level
        const levelMultiplier = {
            low: 0.8,
            medium: 1.0,
            high: 1.2
        };

        score *= levelMultiplier[level] || 1.0;
        return Math.min(100, Math.max(0, score));
    }
}

module.exports = ProfilesController;
