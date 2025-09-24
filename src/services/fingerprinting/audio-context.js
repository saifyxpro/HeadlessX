/**
 * Audio Context Fingerprinting Control
 * Advanced audio fingerprint manipulation and spoofing
 * HeadlessX v1.3.0 - Enhanced Anti-Detection
 */

const crypto = require('crypto');

class AudioContextController {
    constructor() {
        this.audioProfiles = {
            'windows-chrome': {
                sampleRate: 44100,
                channelCount: 2,
                channelInterpretation: 'speakers',
                channelCountMode: 'max',
                latencyHint: 'interactive',
                baseLatency: 0.01,
                outputLatency: 0.02
            },
            'windows-firefox': {
                sampleRate: 44100,
                channelCount: 2,
                channelInterpretation: 'speakers',
                channelCountMode: 'max',
                latencyHint: 'interactive',
                baseLatency: 0.008,
                outputLatency: 0.015
            },
            'macos-safari': {
                sampleRate: 44100,
                channelCount: 2,
                channelInterpretation: 'speakers',
                channelCountMode: 'max',
                latencyHint: 'interactive',
                baseLatency: 0.012,
                outputLatency: 0.025
            }
        };

        this.oscillatorProfiles = {
            sine: {
                frequency: 1000,
                gain: 0.1,
                duration: 0.1
            },
            square: {
                frequency: 1000,
                gain: 0.05,
                duration: 0.1
            },
            sawtooth: {
                frequency: 1000,
                gain: 0.03,
                duration: 0.1
            },
            triangle: {
                frequency: 1000,
                gain: 0.1,
                duration: 0.1
            }
        };
    }

    /**
     * Generate audio context spoofing script
     * @param {string} profileId - Profile identifier for consistency
     * @param {string} audioProfile - Audio profile key
     * @returns {string} JavaScript code for audio context spoofing
     */
    getAudioContextSpoofingScript(profileId, audioProfile = 'windows-chrome') {
        const profile = this.audioProfiles[audioProfile] || this.audioProfiles['windows-chrome'];
        
        return `
        (function() {
            const profileId = '${profileId}';
            const audioProfile = ${JSON.stringify(profile)};
            const oscillatorProfiles = ${JSON.stringify(this.oscillatorProfiles)};
            
            console.log('🎵 Audio context spoofing active - Profile:', '${audioProfile}');

            // Generate consistent noise function based on profile ID
            const generateAudioNoise = (seed, index) => {
                let hash = 0;
                for (let i = 0; i < seed.length; i++) {
                    hash = ((hash << 5) - hash + seed.charCodeAt(i)) & 0xffffffff;
                }
                const noise = Math.sin(hash + index * 0.1) * 0.000001;
                return noise;
            };

            // Override AudioContext constructor
            const originalAudioContext = window.AudioContext || window.webkitAudioContext;
            if (originalAudioContext) {
                const AudioContextProxy = function(options = {}) {
                    // Create context with spoofed options
                    const spoofedOptions = {
                        ...options,
                        sampleRate: audioProfile.sampleRate,
                        latencyHint: audioProfile.latencyHint
                    };
                    
                    const context = new originalAudioContext(spoofedOptions);
                    
                    // Override properties
                    Object.defineProperty(context, 'sampleRate', {
                        get: () => audioProfile.sampleRate,
                        configurable: true
                    });
                    
                    Object.defineProperty(context, 'baseLatency', {
                        get: () => audioProfile.baseLatency + generateAudioNoise(profileId, 1),
                        configurable: true
                    });
                    
                    Object.defineProperty(context, 'outputLatency', {
                        get: () => audioProfile.outputLatency + generateAudioNoise(profileId, 2),
                        configurable: true
                    });

                    // Override createOscillator for consistent fingerprinting
                    const originalCreateOscillator = context.createOscillator;
                    context.createOscillator = function() {
                        const oscillator = originalCreateOscillator.call(this);
                        
                        // Override frequency property with consistent noise
                        const originalFrequencyValue = oscillator.frequency.value;
                        Object.defineProperty(oscillator.frequency, 'value', {
                            get: function() {
                                return originalFrequencyValue + generateAudioNoise(profileId, 10);
                            },
                            set: function(value) {
                                // Allow setting but add consistent noise
                                Object.defineProperty(this, 'value', {
                                    value: value + generateAudioNoise(profileId, 11),
                                    writable: true,
                                    configurable: true
                                });
                            },
                            configurable: true
                        });

                        return oscillator;
                    };

                    // Override createAnalyser for consistent fingerprinting
                    const originalCreateAnalyser = context.createAnalyser;
                    context.createAnalyser = function() {
                        const analyser = originalCreateAnalyser.call(this);
                        
                        // Override getFrequencyData methods
                        const originalGetByteFrequencyData = analyser.getByteFrequencyData;
                        analyser.getByteFrequencyData = function(array) {
                            originalGetByteFrequencyData.call(this, array);
                            
                            // Add consistent noise to frequency data
                            for (let i = 0; i < array.length; i++) {
                                const noise = generateAudioNoise(profileId, i + 100) * 255;
                                array[i] = Math.max(0, Math.min(255, array[i] + noise));
                            }
                        };

                        const originalGetFloatFrequencyData = analyser.getFloatFrequencyData;
                        analyser.getFloatFrequencyData = function(array) {
                            originalGetFloatFrequencyData.call(this, array);
                            
                            // Add consistent noise to float frequency data
                            for (let i = 0; i < array.length; i++) {
                                const noise = generateAudioNoise(profileId, i + 200);
                                array[i] = array[i] + noise;
                            }
                        };

                        return analyser;
                    };

                    // Override createDynamicsCompressor for fingerprinting
                    const originalCreateDynamicsCompressor = context.createDynamicsCompressor;
                    context.createDynamicsCompressor = function() {
                        const compressor = originalCreateDynamicsCompressor.call(this);
                        
                        // Add noise to compressor parameters
                        const originalThresholdValue = compressor.threshold.value;
                        Object.defineProperty(compressor.threshold, 'value', {
                            get: () => originalThresholdValue + generateAudioNoise(profileId, 20),
                            configurable: true
                        });
                        
                        const originalKneeValue = compressor.knee.value;
                        Object.defineProperty(compressor.knee, 'value', {
                            get: () => originalKneeValue + generateAudioNoise(profileId, 21),
                            configurable: true
                        });
                        
                        const originalRatioValue = compressor.ratio.value;
                        Object.defineProperty(compressor.ratio, 'value', {
                            get: () => originalRatioValue + generateAudioNoise(profileId, 22),
                            configurable: true
                        });

                        return compressor;
                    };

                    // Override createBufferSource for consistent timing
                    const originalCreateBufferSource = context.createBufferSource;
                    context.createBufferSource = function() {
                        const source = originalCreateBufferSource.call(this);
                        
                        // Override start method to add timing noise
                        const originalStart = source.start;
                        source.start = function(when = 0, offset = 0, duration) {
                            const noisyWhen = when + generateAudioNoise(profileId, 30) * 0.001;
                            const noisyOffset = offset + generateAudioNoise(profileId, 31) * 0.001;
                            
                            if (duration !== undefined) {
                                const noisyDuration = duration + generateAudioNoise(profileId, 32) * 0.001;
                                return originalStart.call(this, noisyWhen, noisyOffset, noisyDuration);
                            }
                            return originalStart.call(this, noisyWhen, noisyOffset);
                        };

                        return source;
                    };

                    return context;
                };

                // Replace original constructors
                window.AudioContext = AudioContextProxy;
                if (window.webkitAudioContext) {
                    window.webkitAudioContext = AudioContextProxy;
                }
                
                // Copy prototype
                AudioContextProxy.prototype = originalAudioContext.prototype;
            }

            // Override OfflineAudioContext for consistent offline processing
            const originalOfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
            if (originalOfflineAudioContext) {
                const OfflineAudioContextProxy = function(numberOfChannels, length, sampleRate) {
                    const context = new originalOfflineAudioContext(numberOfChannels, length, sampleRate);
                    
                    // Override startRendering for consistent results
                    const originalStartRendering = context.startRendering;
                    context.startRendering = function() {
                        return originalStartRendering.call(this).then(buffer => {
                            // Add consistent noise to rendered buffer
                            for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
                                const channelData = buffer.getChannelData(channel);
                                for (let i = 0; i < channelData.length; i++) {
                                    const noise = generateAudioNoise(profileId, i + channel * 1000) * 0.00001;
                                    channelData[i] += noise;
                                }
                            }
                            return buffer;
                        });
                    };
                    
                    return context;
                };

                window.OfflineAudioContext = OfflineAudioContextProxy;
                if (window.webkitOfflineAudioContext) {
                    window.webkitOfflineAudioContext = OfflineAudioContextProxy;
                }
                
                OfflineAudioContextProxy.prototype = originalOfflineAudioContext.prototype;
            }

            // Spoof MediaDevices audio capabilities
            if (navigator.mediaDevices) {
                const originalGetSupportedConstraints = navigator.mediaDevices.getSupportedConstraints;
                if (originalGetSupportedConstraints) {
                    navigator.mediaDevices.getSupportedConstraints = function() {
                        const constraints = originalGetSupportedConstraints.call(this);
                        return {
                            ...constraints,
                            sampleRate: true,
                            channelCount: true,
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true
                        };
                    };
                }
            }

            // Override Web Audio API timing functions
            if (window.AudioContext || window.webkitAudioContext) {
                const TimingProxy = {
                    now: function() {
                        const originalTime = performance.now();
                        return originalTime + generateAudioNoise(profileId, 1000) * 0.1;
                    }
                };
                
                // Apply timing noise to performance.now when used in audio context
                const originalPerformanceNow = performance.now;
                performance.now = function() {
                    const time = originalPerformanceNow.call(this);
                    // Add minimal timing noise for audio fingerprinting
                    if (window._audioContextActive) {
                        return time + generateAudioNoise(profileId, Math.floor(time)) * 0.01;
                    }
                    return time;
                };
            }

        })();
        `;
    }

    /**
     * Generate audio fingerprint test
     * @param {string} profileId - Profile identifier
     * @returns {string} JavaScript test code
     */
    getAudioFingerprintTest() {
        return `
        (function() {
            const testAudioFingerprint = async () => {
                try {
                    const context = new (window.AudioContext || window.webkitAudioContext)();
                    window._audioContextActive = true;
                    
                    const oscillator = context.createOscillator();
                    const analyser = context.createAnalyser();
                    const compressor = context.createDynamicsCompressor();
                    const buffer = context.createBufferSource();
                    
                    oscillator.type = 'triangle';
                    oscillator.frequency.setValueAtTime(1000, context.currentTime);
                    
                    compressor.threshold.setValueAtTime(-50, context.currentTime);
                    compressor.knee.setValueAtTime(40, context.currentTime);
                    compressor.ratio.setValueAtTime(12, context.currentTime);
                    compressor.attack.setValueAtTime(0, context.currentTime);
                    compressor.release.setValueAtTime(0.25, context.currentTime);
                    
                    oscillator.connect(compressor);
                    compressor.connect(context.destination);
                    oscillator.start(0);
                    oscillator.stop(context.currentTime + 0.1);
                    
                    const fingerprint = [
                        context.sampleRate,
                        context.baseLatency || 0,
                        context.outputLatency || 0,
                        compressor.threshold.value,
                        compressor.knee.value,
                        compressor.ratio.value
                    ].join(',');
                    
                    await context.close();
                    window._audioContextActive = false;
                    
                    return {
                        fingerprint,
                        timestamp: Date.now(),
                        contextState: 'closed'
                    };
                    
                } catch (e) {
                    return {
                        error: e.message,
                        timestamp: Date.now()
                    };
                }
            };
            
            window.testAudioFingerprint = testAudioFingerprint;
            console.log('🧪 Audio fingerprint test installed: window.testAudioFingerprint()');
        })();
        `;
    }

    /**
     * Get audio profiles
     * @returns {Object} Available audio profiles
     */
    getAudioProfiles() {
        return this.audioProfiles;
    }

    /**
     * Generate test fingerprint data
     * @param {string} profileId - Profile identifier
     * @param {string} audioProfile - Audio profile key
     * @returns {Object} Test fingerprint data
     */
    generateTestFingerprint(profileId, audioProfile = 'windows-chrome') {
        const profile = this.audioProfiles[audioProfile];
        
        return {
            profileId,
            audioProfile,
            sampleRate: profile.sampleRate,
            channelCount: profile.channelCount,
            baseLatency: profile.baseLatency,
            outputLatency: profile.outputLatency,
            oscillatorData: this.oscillatorProfiles,
            timestamp: Date.now(),
            fingerprint: crypto.createHash('sha256')
                .update(profileId + audioProfile + profile.sampleRate.toString())
                .digest('hex').slice(0, 16)
        };
    }

    /**
     * Add noise to audio fingerprint
     */
    addNoise(audioData, intensity = 0.001) {
        if (!audioData || !audioData.length) return audioData;
        
        for (let i = 0; i < audioData.length; i++) {
            audioData[i] += (Math.random() - 0.5) * intensity;
        }
        
        return audioData;
    }
}

module.exports = AudioContextController;