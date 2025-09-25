/**
 * Speech Synthesis Fingerprinting Control
 * Advanced speech synthesis voices and capabilities spoofing
 * HeadlessX v1.3.0 - Enhanced Anti-Detection
 */

const crypto = require('crypto');
const { logger } = require('../../utils/logger');

class SpeechSynthesisSpoofing {
    constructor() {
        this.voiceProfiles = this.initializeVoiceProfiles();
        this.logger = logger;
    }

    /**
     * Initialize voice profiles for different platforms
     */
    initializeVoiceProfiles() {
        return {
            windows: [
                { name: 'Microsoft David Desktop - English (United States)', lang: 'en-US', localService: true, default: true },
                { name: 'Microsoft Zira Desktop - English (United States)', lang: 'en-US', localService: true, default: false },
                { name: 'Microsoft Mark - English (United States)', lang: 'en-US', localService: false, default: false },
                { name: 'Microsoft Hazel Desktop - English (Great Britain)', lang: 'en-GB', localService: true, default: false },
                { name: 'Microsoft Susan Desktop - English (Great Britain)', lang: 'en-GB', localService: true, default: false },
                { name: 'Microsoft Hortense - French (France)', lang: 'fr-FR', localService: false, default: false },
                { name: 'Microsoft Hedda Desktop - German (Germany)', lang: 'de-DE', localService: true, default: false },
                { name: 'Microsoft Helena Desktop - Spanish (Spain)', lang: 'es-ES', localService: true, default: false },
                { name: 'Microsoft Haruka Desktop - Japanese (Japan)', lang: 'ja-JP', localService: true, default: false },
                { name: 'Microsoft Huihui Desktop - Chinese (Simplified, PRC)', lang: 'zh-CN', localService: true, default: false }
            ],
            macos: [
                { name: 'Alex', lang: 'en-US', localService: true, default: true },
                { name: 'Samantha', lang: 'en-US', localService: true, default: false },
                { name: 'Victoria', lang: 'en-US', localService: true, default: false },
                { name: 'Daniel', lang: 'en-GB', localService: true, default: false },
                { name: 'Kate', lang: 'en-GB', localService: true, default: false },
                { name: 'Thomas', lang: 'fr-FR', localService: true, default: false },
                { name: 'Anna', lang: 'de-DE', localService: true, default: false },
                { name: 'Monica', lang: 'es-ES', localService: true, default: false },
                { name: 'Kyoko', lang: 'ja-JP', localService: true, default: false },
                { name: 'Ting-Ting', lang: 'zh-CN', localService: true, default: false }
            ],
            linux: [
                { name: 'English (US)', lang: 'en-US', localService: true, default: true },
                { name: 'English (UK)', lang: 'en-GB', localService: true, default: false },
                { name: 'French (France)', lang: 'fr-FR', localService: true, default: false },
                { name: 'German (Germany)', lang: 'de-DE', localService: true, default: false },
                { name: 'Spanish (Spain)', lang: 'es-ES', localService: true, default: false },
                { name: 'Italian (Italy)', lang: 'it-IT', localService: true, default: false }
            ]
        };
    }

    /**
     * Generate speech synthesis voices for profile
     */
    generateSpeechVoices(profile) {
        const seed = this.createSeed(profile.userAgent + profile.platform);
        const random = this.seededRandom(seed);
        
        const platform = this.detectPlatform(profile.platform);
        const availableVoices = this.voiceProfiles[platform] || this.voiceProfiles.windows;
        
        // Select voices based on language preferences and randomness
        const selectedVoices = availableVoices.filter(voice => {
            // Always include default voice
            if (voice.default) return true;
            
            // Include English voices with high probability
            if (voice.lang.startsWith('en')) {
                return random() > 0.2;
            }
            
            // Include other voices with lower probability
            return random() > 0.7;
        });
        
        return selectedVoices.map((voice, index) => ({
            ...voice,
            voiceURI: `${voice.name}_${platform}_${index}`,
            // Add slight variations in properties
            default: voice.default && random() > 0.1
        }));
    }

    /**
     * Inject speech synthesis spoofing into page
     */
    async injectSpeechSynthesisSpoofing(page, profile) {
        try {
            const voices = this.generateSpeechVoices(profile);
            
            await page.evaluateOnNewDocument((voiceList) => {
                // Override speechSynthesis.getVoices
                if (typeof speechSynthesis !== 'undefined') {
                    const originalGetVoices = speechSynthesis.getVoices;
                    
                    speechSynthesis.getVoices = function() {
                        return voiceList.map(voice => ({
                            name: voice.name,
                            lang: voice.lang,
                            localService: voice.localService,
                            default: voice.default,
                            voiceURI: voice.voiceURI
                        }));
                    };

                    // Override the voices property directly
                    Object.defineProperty(speechSynthesis, 'voices', {
                        get: function() {
                            return speechSynthesis.getVoices();
                        }
                    });

                    // Handle onvoiceschanged event
                    const originalAddEventListener = speechSynthesis.addEventListener;
                    speechSynthesis.addEventListener = function(type, listener, options) {
                        if (type === 'voiceschanged') {
                            // Trigger the event after a short delay to simulate real behavior
                            setTimeout(() => {
                                if (typeof listener === 'function') {
                                    listener();
                                }
                            }, 10 + Math.random() * 50);
                        } else {
                            originalAddEventListener.call(this, type, listener, options);
                        }
                    };

                    // Override speak method to add realistic behavior
                    const originalSpeak = speechSynthesis.speak;
                    speechSynthesis.speak = function(utterance) {
                        // Add realistic delays and event firing
                        if (utterance && typeof utterance.onstart === 'function') {
                            setTimeout(() => utterance.onstart(), 10);
                        }
                        
                        if (utterance && typeof utterance.onend === 'function') {
                            const textLength = utterance.text ? utterance.text.length : 10;
                            const duration = Math.max(500, textLength * 50); // Realistic speaking duration
                            setTimeout(() => utterance.onend(), duration);
                        }
                        
                        return originalSpeak.call(this, utterance);
                    };

                    // Add realistic properties
                    Object.defineProperties(speechSynthesis, {
                        pending: {
                            get: function() {
                                return false; // Simulate not pending
                            }
                        },
                        speaking: {
                            get: function() {
                                return false; // Simulate not currently speaking
                            }
                        },
                        paused: {
                            get: function() {
                                return false; // Simulate not paused
                            }
                        }
                    });

                    // Trigger voiceschanged event to simulate real browser behavior
                    setTimeout(() => {
                        if (speechSynthesis.onvoiceschanged) {
                            speechSynthesis.onvoiceschanged();
                        }
                        
                        const event = new Event('voiceschanged');
                        speechSynthesis.dispatchEvent(event);
                    }, 100);
                }

                // Create SpeechSynthesisUtterance constructor if not available
                if (typeof SpeechSynthesisUtterance === 'undefined') {
                    window.SpeechSynthesisUtterance = function(text) {
                        this.text = text || '';
                        this.lang = 'en-US';
                        this.voice = null;
                        this.volume = 1;
                        this.rate = 1;
                        this.pitch = 1;
                        this.onstart = null;
                        this.onend = null;
                        this.onerror = null;
                        this.onpause = null;
                        this.onresume = null;
                        this.onmark = null;
                        this.onboundary = null;
                    };
                }
            }, voices);

            this.logger.debug(`Speech synthesis spoofing injected: ${voices.length} voices`);
            return true;
        } catch (error) {
            this.logger.error('Speech synthesis spoofing injection failed:', error);
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
     * Test speech synthesis consistency
     */
    async testSpeechSynthesisConsistency(profile, iterations = 5) {
        const results = [];
        
        for (let i = 0; i < iterations; i++) {
            const voices = this.generateSpeechVoices(profile);
            results.push(voices);
        }
        
        // Check consistency
        const firstResult = JSON.stringify(results[0]);
        const consistent = results.every(result => 
            JSON.stringify(result) === firstResult
        );
        
        return {
            consistent,
            voices: results[0],
            iterations
        };
    }

    /**
     * Get voice capabilities for testing
     */
    getVoiceCapabilities() {
        return {
            rates: [0.1, 0.5, 1.0, 1.5, 2.0],
            pitches: [0.0, 0.5, 1.0, 1.5, 2.0],
            volumes: [0.0, 0.5, 1.0]
        };
    }
}

module.exports = SpeechSynthesisSpoofing;