/**
 * Media Devices Fingerprinting Control
 * Advanced media device enumeration and spoofing
 * HeadlessX v1.3.0 - Enhanced Anti-Detection
 */

const crypto = require('crypto');
const { logger } = require('../../utils/logger');

class MediaDevicesSpoofing {
    constructor() {
        this.deviceProfiles = this.initializeDeviceProfiles();
        this.logger = logger;
    }

    /**
     * Initialize media device profiles for different platforms
     */
    initializeDeviceProfiles() {
        return {
            windows: {
                cameras: [
                    {
                        kind: 'videoinput',
                        label: 'HD Pro Webcam C920',
                        deviceId: 'default',
                        groupId: 'default'
                    },
                    {
                        kind: 'videoinput', 
                        label: 'Integrated Camera',
                        deviceId: 'communications',
                        groupId: 'default'
                    }
                ],
                microphones: [
                    {
                        kind: 'audioinput',
                        label: 'Default - Microphone Array (Realtek(R) Audio)',
                        deviceId: 'default',
                        groupId: 'default'
                    },
                    {
                        kind: 'audioinput',
                        label: 'Communications - Microphone Array (Realtek(R) Audio)',
                        deviceId: 'communications', 
                        groupId: 'default'
                    }
                ],
                speakers: [
                    {
                        kind: 'audiooutput',
                        label: 'Default - Speakers (Realtek(R) Audio)',
                        deviceId: 'default',
                        groupId: 'default'
                    },
                    {
                        kind: 'audiooutput',
                        label: 'Communications - Speakers (Realtek(R) Audio)',
                        deviceId: 'communications',
                        groupId: 'default'
                    }
                ]
            },
            macos: {
                cameras: [
                    {
                        kind: 'videoinput',
                        label: 'FaceTime HD Camera',
                        deviceId: 'default',
                        groupId: 'default'
                    }
                ],
                microphones: [
                    {
                        kind: 'audioinput',
                        label: 'Default - MacBook Pro Microphone',
                        deviceId: 'default',
                        groupId: 'default'
                    }
                ],
                speakers: [
                    {
                        kind: 'audiooutput',
                        label: 'Default - MacBook Pro Speakers',
                        deviceId: 'default',
                        groupId: 'default'
                    }
                ]
            },
            linux: {
                cameras: [
                    {
                        kind: 'videoinput',
                        label: 'USB2.0 HD UVC WebCam: USB2.0 HD',
                        deviceId: 'default',
                        groupId: 'default'
                    }
                ],
                microphones: [
                    {
                        kind: 'audioinput',
                        label: 'Default - Built-in Audio Analog Stereo',
                        deviceId: 'default',
                        groupId: 'default'
                    }
                ],
                speakers: [
                    {
                        kind: 'audiooutput',
                        label: 'Default - Built-in Audio Analog Stereo',
                        deviceId: 'default',
                        groupId: 'default'
                    }
                ]
            }
        };
    }

    /**
     * Generate media devices list for profile
     */
    generateMediaDevices(profile) {
        const seed = this.createSeed(profile.userAgent + profile.platform);
        const random = this.seededRandom(seed);
        
        const platform = this.detectPlatform(profile.platform);
        const deviceProfile = this.deviceProfiles[platform];
        
        const devices = [];
        
        // Add cameras (80% chance of having camera)
        if (random() > 0.2) {
            const cameras = this.selectDevices(deviceProfile.cameras, random, 0.8);
            cameras.forEach(camera => {
                devices.push({
                    ...camera,
                    deviceId: this.generateDeviceId(camera.label + seed, 32)
                });
            });
        }
        
        // Add microphones (95% chance of having microphone)
        if (random() > 0.05) {
            const microphones = this.selectDevices(deviceProfile.microphones, random, 0.9);
            microphones.forEach(mic => {
                devices.push({
                    ...mic,
                    deviceId: this.generateDeviceId(mic.label + seed, 32)
                });
            });
        }
        
        // Add speakers (90% chance of having speakers)
        if (random() > 0.1) {
            const speakers = this.selectDevices(deviceProfile.speakers, random, 0.9);
            speakers.forEach(speaker => {
                devices.push({
                    ...speaker,
                    deviceId: this.generateDeviceId(speaker.label + seed, 32)
                });
            });
        }
        
        return devices;
    }

    /**
     * Select random subset of devices
     */
    selectDevices(deviceList, random, probability) {
        return deviceList.filter(() => random() < probability);
    }

    /**
     * Generate consistent device ID
     */
    generateDeviceId(input, length = 32) {
        const hash = crypto.createHash('sha256').update(input).digest('hex');
        return hash.substring(0, length);
    }

    /**
     * Inject media devices spoofing into page
     */
    async injectMediaDevicesSpoofing(page, profile) {
        try {
            const mediaDevices = this.generateMediaDevices(profile);
            
            await page.evaluateOnNewDocument((devices) => {
                // Override navigator.mediaDevices.enumerateDevices
                if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                    const originalEnumerateDevices = navigator.mediaDevices.enumerateDevices;
                    
                    navigator.mediaDevices.enumerateDevices = function() {
                        return Promise.resolve(devices.map(device => ({
                            deviceId: device.deviceId,
                            kind: device.kind,
                            label: device.label,
                            groupId: device.groupId || 'default'
                        })));
                    };
                }

                // Override getUserMedia to simulate device access
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
                    
                    navigator.mediaDevices.getUserMedia = function(constraints) {
                        // Simulate permission check delay
                        return new Promise((resolve, reject) => {
                            setTimeout(() => {
                                const hasVideo = constraints.video && devices.some(d => d.kind === 'videoinput');
                                const hasAudio = constraints.audio && devices.some(d => d.kind === 'audioinput');
                                
                                if ((constraints.video && !hasVideo) || (constraints.audio && !hasAudio)) {
                                    reject(new Error('Requested device not found'));
                                    return;
                                }
                                
                                // Create mock stream
                                const mockStream = {
                                    getTracks: () => [],
                                    getVideoTracks: () => hasVideo ? [{ kind: 'video', enabled: true }] : [],
                                    getAudioTracks: () => hasAudio ? [{ kind: 'audio', enabled: true }] : [],
                                    active: true
                                };
                                
                                resolve(mockStream);
                            }, 100 + Math.random() * 200);
                        });
                    };
                }

                // Override deprecated navigator.getUserMedia
                if (navigator.getUserMedia) {
                    navigator.getUserMedia = function(constraints, success, error) {
                        navigator.mediaDevices.getUserMedia(constraints)
                            .then(success)
                            .catch(error);
                    };
                }

                // Override webkitGetUserMedia (Chrome)
                if (navigator.webkitGetUserMedia) {
                    navigator.webkitGetUserMedia = navigator.getUserMedia;
                }

                // Override mozGetUserMedia (Firefox)
                if (navigator.mozGetUserMedia) {
                    navigator.mozGetUserMedia = navigator.getUserMedia;
                }
            }, mediaDevices);

            this.logger.debug(`Media devices spoofing injected: ${mediaDevices.length} devices`);
            return true;
        } catch (error) {
            this.logger.error('Media devices spoofing injection failed:', error);
            return false;
        }
    }

    /**
     * Detect platform from user agent
     */
    detectPlatform(platform) {
        const platformLower = platform.toLowerCase();
        if (platformLower.includes('win')) return 'windows';
        if (platformLower.includes('mac')) return 'macos';
        if (platformLower.includes('linux') || platformLower.includes('unix')) return 'linux';
        return 'windows'; // default
    }

    /**
     * Create deterministic seed from string
     */
    createSeed(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Seeded random number generator
     */
    seededRandom(seed) {
        return function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }

    /**
     * Test media devices consistency
     */
    async testMediaDevicesConsistency(profile, iterations = 5) {
        const results = [];
        
        for (let i = 0; i < iterations; i++) {
            const devices = this.generateMediaDevices(profile);
            results.push(devices);
        }
        
        // Check consistency
        const firstResult = JSON.stringify(results[0]);
        const consistent = results.every(result => 
            JSON.stringify(result) === firstResult
        );
        
        return {
            consistent,
            devices: results[0],
            iterations
        };
    }

    /**
     * Get media device capabilities simulation
     */
    getDeviceCapabilities(deviceId) {
        return {
            video: {
                width: { min: 320, max: 1920 },
                height: { min: 240, max: 1080 },
                frameRate: { min: 15, max: 30 }
            },
            audio: {
                sampleRate: { min: 8000, max: 48000 },
                channelCount: { min: 1, max: 2 }
            }
        };
    }
}

module.exports = MediaDevicesSpoofing;