/**
 * WebRTC Controller
 * Advanced WebRTC leak prevention and media device control
 * HeadlessX v1.3.0 - Enhanced Anti-Detection
 */

const crypto = require('crypto');

class WebRTCController {
    constructor() {
        this.leakPreventionModes = {
            disabled: 'Disable WebRTC completely',
            proxy: 'Route through proxy only', 
            local: 'Local IP only',
            minimal: 'Minimal functionality'
        };

        this.mediaDeviceProfiles = {
            desktop: {
                cameras: [
                    { deviceId: 'default', kind: 'videoinput', label: 'Integrated Camera', groupId: 'group1' }
                ],
                microphones: [
                    { deviceId: 'default', kind: 'audioinput', label: 'Default - Microphone Array', groupId: 'group2' },
                    { deviceId: 'communications', kind: 'audioinput', label: 'Communications - Microphone Array', groupId: 'group2' }
                ],
                speakers: [
                    { deviceId: 'default', kind: 'audiooutput', label: 'Default - Speakers', groupId: 'group3' },
                    { deviceId: 'communications', kind: 'audiooutput', label: 'Communications - Speakers', groupId: 'group3' }
                ]
            },
            laptop: {
                cameras: [
                    { deviceId: 'integrated', kind: 'videoinput', label: 'Integrated Camera', groupId: 'group1' }
                ],
                microphones: [
                    { deviceId: 'integrated', kind: 'audioinput', label: 'Internal Microphone', groupId: 'group2' }
                ],
                speakers: [
                    { deviceId: 'default', kind: 'audiooutput', label: 'Internal Speakers', groupId: 'group3' }
                ]
            }
        };
    }

    /**
     * Generate WebRTC prevention script
     * @param {string} mode - Prevention mode (disabled, proxy, local, minimal)
     * @param {string} profileType - Device profile type
     * @returns {string} JavaScript code for WebRTC control
     */
    getWebRTCControlScript(mode = 'disabled', profileType = 'desktop') {
        const mediaProfile = this.mediaDeviceProfiles[profileType] || this.mediaDeviceProfiles.desktop;
        
        return `
        (function() {
            const mode = '${mode}';
            const mediaProfile = ${JSON.stringify(mediaProfile)};
            
            console.log('🛡️ WebRTC leak prevention active - Mode:', mode);

            // Complete WebRTC blocking for maximum privacy
            if (mode === 'disabled') {
                // Block RTCPeerConnection completely
                const blockRTC = function() {
                    throw new Error('WebRTC is disabled for privacy');
                };
                
                // Override all possible RTC constructors
                Object.defineProperty(window, 'RTCPeerConnection', { get: blockRTC, configurable: false });
                Object.defineProperty(window, 'webkitRTCPeerConnection', { get: blockRTC, configurable: false });
                Object.defineProperty(window, 'mozRTCPeerConnection', { get: blockRTC, configurable: false });
                Object.defineProperty(window, 'RTCDataChannel', { get: blockRTC, configurable: false });
                Object.defineProperty(window, 'RTCSessionDescription', { get: blockRTC, configurable: false });
                Object.defineProperty(window, 'RTCIceCandidate', { get: blockRTC, configurable: false });
                
                // Block getUserMedia and related APIs
                const blockMedia = function() {
                    return Promise.reject(new Error('Media access denied for privacy'));
                };
                
                if (navigator.mediaDevices) {
                    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { 
                        get: () => blockMedia, 
                        configurable: false 
                    });
                    Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', { 
                        get: () => blockMedia, 
                        configurable: false 
                    });
                }
                
                Object.defineProperty(navigator, 'getUserMedia', { get: blockMedia, configurable: false });
                Object.defineProperty(navigator, 'webkitGetUserMedia', { get: blockMedia, configurable: false });
                Object.defineProperty(navigator, 'mozGetUserMedia', { get: blockMedia, configurable: false });

                return;
            }

            // Minimal WebRTC with controlled media device enumeration
            if (mode === 'minimal') {
                // Override media device enumeration
                if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                    const originalEnumerateDevices = navigator.mediaDevices.enumerateDevices;
                    navigator.mediaDevices.enumerateDevices = function() {
                        return Promise.resolve([
                            ...mediaProfile.cameras,
                            ...mediaProfile.microphones,
                            ...mediaProfile.speakers
                        ].map(device => ({
                            deviceId: device.deviceId,
                            kind: device.kind,
                            label: device.label,
                            groupId: device.groupId
                        })));
                    };
                }

                // Override getUserMedia with controlled access
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
                    navigator.mediaDevices.getUserMedia = function(constraints) {
                        // Log the attempt but deny access
                        console.log('🎥 getUserMedia blocked - constraints:', constraints);
                        return Promise.reject(new DOMException('Requested device not found', 'NotFoundError'));
                    };
                }
            }

            // ICE candidate filtering for proxy mode
            if (mode === 'proxy' || mode === 'local') {
                const originalRTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
                
                if (originalRTCPeerConnection) {
                    window.RTCPeerConnection = function(configuration, ...args) {
                        const pc = new originalRTCPeerConnection(configuration, ...args);
                        
                        // Filter ICE candidates
                        const originalCreateOffer = pc.createOffer;
                        pc.createOffer = function(...args) {
                            console.log('🧊 ICE candidate filtering active');
                            return originalCreateOffer.apply(this, args);
                        };

                        // Override addIceCandidate to filter candidates
                        const originalAddIceCandidate = pc.addIceCandidate;
                        pc.addIceCandidate = function(candidate, ...args) {
                            if (candidate && candidate.candidate) {
                                // Filter out local IP candidates in proxy mode
                                if (mode === 'proxy' && (
                                    candidate.candidate.includes('192.168.') ||
                                    candidate.candidate.includes('10.') ||
                                    candidate.candidate.includes('172.16.') ||
                                    candidate.candidate.includes('172.17.') ||
                                    candidate.candidate.includes('172.18.') ||
                                    candidate.candidate.includes('172.19.') ||
                                    candidate.candidate.includes('172.20.') ||
                                    candidate.candidate.includes('172.21.') ||
                                    candidate.candidate.includes('172.22.') ||
                                    candidate.candidate.includes('172.23.') ||
                                    candidate.candidate.includes('172.24.') ||
                                    candidate.candidate.includes('172.25.') ||
                                    candidate.candidate.includes('172.26.') ||
                                    candidate.candidate.includes('172.27.') ||
                                    candidate.candidate.includes('172.28.') ||
                                    candidate.candidate.includes('172.29.') ||
                                    candidate.candidate.includes('172.30.') ||
                                    candidate.candidate.includes('172.31.') ||
                                    candidate.candidate.includes('127.0.0.1') ||
                                    candidate.candidate.includes('169.254.')
                                )) {
                                    console.log('🚫 Filtered local IP candidate:', candidate.candidate.slice(0, 50));
                                    return Promise.resolve();
                                }
                            }
                            return originalAddIceCandidate.call(this, candidate, ...args);
                        };

                        return pc;
                    };
                    
                    // Copy prototype methods
                    window.RTCPeerConnection.prototype = originalRTCPeerConnection.prototype;
                }
            }

            // Override STUN server configuration
            const originalRTCPeerConnection = window.RTCPeerConnection;
            if (originalRTCPeerConnection) {
                window.RTCPeerConnection = function(configuration = {}, ...args) {
                    // Filter or replace STUN servers
                    if (configuration.iceServers) {
                        configuration.iceServers = configuration.iceServers.filter(server => {
                            // Remove Google STUN servers that might leak IP
                            return !server.urls.some(url => 
                                typeof url === 'string' && url.includes('stun.l.google.com')
                            );
                        });
                    }
                    
                    console.log('🌐 RTCPeerConnection created with filtered configuration');
                    return new originalRTCPeerConnection(configuration, ...args);
                };
                
                window.RTCPeerConnection.prototype = originalRTCPeerConnection.prototype;
            }

            // Media device consistency enforcement
            if (navigator.mediaDevices) {
                // Override getSupportedConstraints
                const originalGetSupportedConstraints = navigator.mediaDevices.getSupportedConstraints;
                if (originalGetSupportedConstraints) {
                    navigator.mediaDevices.getSupportedConstraints = function() {
                        return {
                            width: true,
                            height: true,
                            aspectRatio: true,
                            frameRate: true,
                            facingMode: true,
                            resizeMode: false,
                            sampleRate: true,
                            sampleSize: true,
                            echoCancellation: true,
                            autoGainControl: true,
                            noiseSuppression: true,
                            latency: false,
                            channelCount: true,
                            deviceId: true,
                            groupId: true
                        };
                    };
                }
            }

            // Block screen sharing capabilities
            if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia = function() {
                    return Promise.reject(new DOMException('Screen sharing not supported', 'NotSupportedError'));
                };
            }

            // Remove media recorder if present
            if (window.MediaRecorder) {
                window.MediaRecorder = undefined;
            }

        })();
        `;
    }

    /**
     * Generate consistent media device IDs based on profile
     * @param {string} profileId - Profile identifier
     * @param {string} deviceType - Device type (camera, microphone, speaker)
     * @returns {string} Consistent device ID
     */
    generateDeviceId(profileId, deviceType) {
        return crypto.createHash('sha256')
            .update(profileId + deviceType)
            .digest('hex')
            .slice(0, 32);
    }

    /**
     * Get IP leak test script
     * @returns {string} JavaScript code for testing IP leaks
     */
    getIPLeakTestScript() {
        return `
        (function() {
            const testRTCLeaks = () => {
                return new Promise((resolve) => {
                    const results = {
                        webRTCAvailable: false,
                        localIPs: [],
                        publicIPs: [],
                        leakDetected: false
                    };

                    try {
                        const pc = new (window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection)({
                            iceServers: [
                                { urls: 'stun:stun.l.google.com:19302' },
                                { urls: 'stun:global.stun.twilio.com:3478' }
                            ]
                        });

                        results.webRTCAvailable = true;

                        pc.onicecandidate = (event) => {
                            if (event.candidate) {
                                const candidate = event.candidate.candidate;
                                const ipRegex = /([0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3})/g;
                                const matches = candidate.match(ipRegex);
                                
                                if (matches) {
                                    matches.forEach(ip => {
                                        if (ip.startsWith('192.168.') || ip.startsWith('10.') || 
                                            ip.startsWith('172.') || ip.startsWith('169.254.')) {
                                            if (!results.localIPs.includes(ip)) {
                                                results.localIPs.push(ip);
                                                results.leakDetected = true;
                                            }
                                        } else if (ip !== '127.0.0.1') {
                                            if (!results.publicIPs.includes(ip)) {
                                                results.publicIPs.push(ip);
                                                results.leakDetected = true;
                                            }
                                        }
                                    });
                                }
                            }
                        };

                        pc.createDataChannel('test');
                        pc.createOffer()
                            .then(offer => pc.setLocalDescription(offer))
                            .catch(() => {});

                        setTimeout(() => {
                            pc.close();
                            resolve(results);
                        }, 2000);

                    } catch (e) {
                        results.error = e.message;
                        resolve(results);
                    }
                });
            };

            window.testWebRTCLeaks = testRTCLeaks;
            console.log('🧪 WebRTC leak test function installed: window.testWebRTCLeaks()');
        })();
        `;
    }

    /**
     * Get available prevention modes
     * @returns {Object} Available prevention modes
     */
    getPreventionModes() {
        return this.leakPreventionModes;
    }

    /**
     * Get media device profiles
     * @returns {Object} Available media device profiles
     */
    getMediaDeviceProfiles() {
        return this.mediaDeviceProfiles;
    }

    /**
     * Block WebRTC completely
     */
    blockWebRTC() {
        return this.setupWebRTCBlocking('disabled');
    }
}

module.exports = WebRTCController;