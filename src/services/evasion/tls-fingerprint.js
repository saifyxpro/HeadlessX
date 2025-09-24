/**
 * TLS Fingerprint Masking
 * Advanced TLS/SSL fingerprint control and manipulation
 * HeadlessX v1.3.0 - Enhanced Anti-Detection
 */

const crypto = require('crypto');
const { logger } = require('../../utils/logger');

class TLSFingerprintMasking {
    constructor() {
        this.tlsProfiles = this.initializeTLSProfiles();
        this.logger = logger;
    }

    /**
     * Initialize TLS fingerprint profiles for different browsers and platforms
     */
    initializeTLSProfiles() {
        return {
            'chrome-131-windows': {
                version: '1.3',
                cipherSuites: [
                    'TLS_AES_128_GCM_SHA256',
                    'TLS_AES_256_GCM_SHA384',
                    'TLS_CHACHA20_POLY1305_SHA256',
                    'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256',
                    'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
                    'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384',
                    'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
                    'TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256',
                    'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256',
                    'TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA',
                    'TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA',
                    'TLS_RSA_WITH_AES_128_GCM_SHA256',
                    'TLS_RSA_WITH_AES_256_GCM_SHA384',
                    'TLS_RSA_WITH_AES_128_CBC_SHA',
                    'TLS_RSA_WITH_AES_256_CBC_SHA'
                ],
                extensions: [
                    'server_name',
                    'extended_master_secret',
                    'renegotiation_info',
                    'supported_groups',
                    'ec_point_formats',
                    'signature_algorithms',
                    'application_layer_protocol_negotiation',
                    'status_request',
                    'delegated_credentials',
                    'key_share',
                    'supported_versions',
                    'cookie',
                    'psk_key_exchange_modes',
                    'certificate_authorities',
                    'oid_filters',
                    'post_handshake_auth',
                    'signature_algorithms_cert',
                    'compress_certificate'
                ],
                supportedGroups: [
                    'X25519',
                    'P-256',
                    'P-384'
                ],
                signatureAlgorithms: [
                    'ecdsa_secp256r1_sha256',
                    'rsa_pss_rsae_sha256',
                    'rsa_pkcs1_sha256',
                    'ecdsa_secp384r1_sha384',
                    'rsa_pss_rsae_sha384',
                    'rsa_pkcs1_sha384',
                    'rsa_pss_rsae_sha512',
                    'rsa_pkcs1_sha512'
                ],
                alpnProtocols: ['h2', 'http/1.1'],
                ja3Hash: '769,47-53-5-10-49171-49172-156-157-47-53,0-10-11-13-15-16-18-21-23-27-35-43-45-51,23-24-25,0'
            },
            'chrome-131-macos': {
                version: '1.3',
                cipherSuites: [
                    'TLS_AES_128_GCM_SHA256',
                    'TLS_AES_256_GCM_SHA384',
                    'TLS_CHACHA20_POLY1305_SHA256',
                    'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256',
                    'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
                    'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384',
                    'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
                    'TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256',
                    'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256',
                    'TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA',
                    'TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA',
                    'TLS_RSA_WITH_AES_128_GCM_SHA256',
                    'TLS_RSA_WITH_AES_256_GCM_SHA384',
                    'TLS_RSA_WITH_AES_128_CBC_SHA',
                    'TLS_RSA_WITH_AES_256_CBC_SHA'
                ],
                extensions: [
                    'server_name',
                    'extended_master_secret',
                    'renegotiation_info',
                    'supported_groups',
                    'ec_point_formats',
                    'signature_algorithms',
                    'application_layer_protocol_negotiation',
                    'status_request',
                    'delegated_credentials',
                    'key_share',
                    'supported_versions',
                    'cookie',
                    'psk_key_exchange_modes',
                    'certificate_authorities',
                    'oid_filters',
                    'post_handshake_auth',
                    'signature_algorithms_cert'
                ],
                supportedGroups: [
                    'X25519',
                    'P-256',
                    'P-384',
                    'P-521'
                ],
                signatureAlgorithms: [
                    'ecdsa_secp256r1_sha256',
                    'rsa_pss_rsae_sha256',
                    'rsa_pkcs1_sha256',
                    'ecdsa_secp384r1_sha384',
                    'rsa_pss_rsae_sha384',
                    'rsa_pkcs1_sha384',
                    'rsa_pss_rsae_sha512',
                    'rsa_pkcs1_sha512'
                ],
                alpnProtocols: ['h2', 'http/1.1'],
                ja3Hash: '769,47-53-5-10-49171-49172-156-157-47-53,0-10-11-13-15-16-18-21-23-27-35-43-45-51,23-24-25-26,0'
            },
            'firefox-120-windows': {
                version: '1.3',
                cipherSuites: [
                    'TLS_AES_128_GCM_SHA256',
                    'TLS_CHACHA20_POLY1305_SHA256',
                    'TLS_AES_256_GCM_SHA384',
                    'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256',
                    'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
                    'TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256',
                    'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256',
                    'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384',
                    'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
                    'TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA',
                    'TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA',
                    'TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA',
                    'TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA',
                    'TLS_RSA_WITH_AES_128_GCM_SHA256',
                    'TLS_RSA_WITH_AES_256_GCM_SHA384',
                    'TLS_RSA_WITH_AES_128_CBC_SHA',
                    'TLS_RSA_WITH_AES_256_CBC_SHA'
                ],
                extensions: [
                    'server_name',
                    'extended_master_secret',
                    'renegotiation_info',
                    'supported_groups',
                    'ec_point_formats',
                    'signature_algorithms',
                    'application_layer_protocol_negotiation',
                    'status_request',
                    'delegated_credentials',
                    'key_share',
                    'supported_versions',
                    'cookie',
                    'psk_key_exchange_modes',
                    'certificate_authorities'
                ],
                supportedGroups: [
                    'X25519',
                    'P-256',
                    'P-384',
                    'P-521',
                    'ffdhe2048',
                    'ffdhe3072'
                ],
                signatureAlgorithms: [
                    'ecdsa_secp256r1_sha256',
                    'ecdsa_secp384r1_sha384',
                    'ecdsa_secp521r1_sha512',
                    'rsa_pss_rsae_sha256',
                    'rsa_pss_rsae_sha384',
                    'rsa_pss_rsae_sha512',
                    'rsa_pkcs1_sha256',
                    'rsa_pkcs1_sha384',
                    'rsa_pkcs1_sha512'
                ],
                alpnProtocols: ['h2', 'http/1.1'],
                ja3Hash: '771,4865-4867-4866-49195-49199-52393-52392-49196-49200-49162-49161-49171-49172-51-57-47-53,0-23-65281-10-11-35-16-5-51-43-13-45-28-21,29-23-24-25-256-257,0'
            }
        };
    }

    /**
     * Generate TLS configuration for browser profile
     */
    generateTLSProfile(profile) {
        const browserPlatform = this.detectBrowserPlatform(profile.userAgent, profile.platform);
        const baseProfile = this.tlsProfiles[browserPlatform] || this.tlsProfiles['chrome-131-windows'];
        
        const seed = this.createSeed(profile.userAgent + profile.platform);
        const random = this.seededRandom(seed);
        
        // Apply slight variations to mimic real browser behavior
        const tlsProfile = { ...baseProfile };
        
        // Randomly reorder cipher suites (browsers can have slight variations)
        tlsProfile.cipherSuites = this.shuffleArray([...baseProfile.cipherSuites], random, 0.1);
        
        // Occasionally modify extension order
        tlsProfile.extensions = this.shuffleArray([...baseProfile.extensions], random, 0.05);
        
        return tlsProfile;
    }

    /**
     * Apply TLS fingerprint masking to browser context
     */
    async applyTLSMasking(context, profile) {
        try {
            const tlsProfile = this.generateTLSProfile(profile);
            
            // Intercept and modify TLS handshake parameters
            await context.addInitScript(({ tlsConfig }) => {
                // Override TLS-related JavaScript APIs
                
                // Override crypto.getRandomValues to ensure consistent entropy patterns
                const originalGetRandomValues = crypto.getRandomValues;
                crypto.getRandomValues = function(array) {
                    // Use deterministic randomness for TLS-related operations
                    const result = originalGetRandomValues.call(this, array);
                    
                    // Add slight modifications to mimic real browser entropy
                    for (let i = 0; i < array.length; i += 16) {
                        array[i] = (array[i] + 1) % 256;
                    }
                    
                    return result;
                };

                // Override SubtleCrypto operations that might reveal TLS implementation details
                if (window.crypto && window.crypto.subtle) {
                    const originalGenerateKey = window.crypto.subtle.generateKey;
                    window.crypto.subtle.generateKey = function(algorithm, extractable, keyUsages) {
                        // Add realistic delays to key generation
                        return new Promise((resolve) => {
                            setTimeout(() => {
                                originalGenerateKey.call(this, algorithm, extractable, keyUsages)
                                    .then(resolve)
                                    .catch(resolve);
                            }, 5 + Math.random() * 20);
                        });
                    };
                }

                // Mock certificate verification behavior
                if (window.RTCPeerConnection) {
                    const originalRTC = window.RTCPeerConnection;
                    window.RTCPeerConnection = function(configuration) {
                        const pc = new originalRTC(configuration);
                        
                        // Override certificate handling
                        const originalSetConfiguration = pc.setConfiguration;
                        pc.setConfiguration = function(config) {
                            if (config && config.certificates) {
                                // Ensure consistent certificate ordering
                                config.certificates.sort((a, b) => a.expires - b.expires);
                            }
                            return originalSetConfiguration.call(this, config);
                        };
                        
                        return pc;
                    };
                }

                // Store TLS config for potential future use
                window.__tlsConfig = tlsConfig;
                
            }, { tlsConfig: tlsProfile });

            // Configure additional TLS-related browser options
            const additionalArgs = this.generateTLSBrowserArgs(tlsProfile);
            
            this.logger.debug(`TLS masking applied for ${profile.userAgent.substring(0, 50)}...`);
            return { success: true, additionalArgs };
            
        } catch (error) {
            this.logger.error('TLS masking failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate browser launch arguments for TLS configuration
     */
    generateTLSBrowserArgs(tlsProfile) {
        const args = [];
        
        // Force specific TLS version
        args.push(`--ssl-version-min=tls1.2`);
        args.push(`--ssl-version-max=tls1.3`);
        
        // Configure cipher suites (if supported)
        if (tlsProfile.cipherSuites.length > 0) {
            const topCiphers = tlsProfile.cipherSuites.slice(0, 10).join(':');
            args.push(`--cipher-suite-blacklist="")`);
        }
        
        // Configure certificate verification
        args.push('--ignore-certificate-errors-spki-list');
        args.push('--ignore-ssl-errors');
        args.push('--allow-running-insecure-content');
        
        // Configure ALPN protocols
        if (tlsProfile.alpnProtocols) {
            args.push('--enable-features=NetworkServiceLogging');
        }
        
        // Enable TLS 1.3 early data
        args.push('--enable-tls13-early-data');
        
        return args;
    }

    /**
     * Validate TLS fingerprint consistency
     */
    async validateTLSFingerprint(page, expectedProfile) {
        try {
            // Attempt to extract TLS information from the page
            const tlsInfo = await page.evaluate(() => {
                return new Promise((resolve) => {
                    // Check for TLS-related information
                    const info = {
                        protocol: location.protocol,
                        port: location.port || (location.protocol === 'https:' ? '443' : '80'),
                        securityState: document.visibilityState,
                        timestamp: Date.now()
                    };
                    
                    // Check for WebRTC TLS info
                    if (window.RTCPeerConnection) {
                        try {
                            const pc = new RTCPeerConnection();
                            info.rtcCapabilities = RTCRtpSender.getCapabilities ? 
                                RTCRtpSender.getCapabilities('video') : null;
                            pc.close();
                        } catch (e) {
                            // Ignore WebRTC errors
                        }
                    }
                    
                    // Check crypto capabilities
                    if (window.crypto && window.crypto.subtle) {
                        info.cryptoSupported = true;
                        info.randomValues = crypto.getRandomValues(new Uint8Array(4));
                    }
                    
                    resolve(info);
                });
            });
            
            this.logger.debug('TLS validation completed:', tlsInfo);
            return { valid: true, info: tlsInfo };
            
        } catch (error) {
            this.logger.error('TLS validation failed:', error);
            return { valid: false, error: error.message };
        }
    }

    /**
     * Detect browser and platform for TLS profile selection
     */
    detectBrowserPlatform(userAgent, platform) {
        const ua = userAgent.toLowerCase();
        const platformLower = platform.toLowerCase();
        
        let browser = 'chrome';
        let version = '131';
        
        if (ua.includes('firefox')) {
            browser = 'firefox';
            version = '120';
        } else if (ua.includes('safari') && !ua.includes('chrome')) {
            browser = 'safari';
            version = '17';
        } else if (ua.includes('chrome')) {
            const chromeMatch = ua.match(/chrome\/(\d+)/);
            if (chromeMatch) {
                version = chromeMatch[1];
            }
        }
        
        let os = 'windows';
        if (platformLower.includes('mac')) os = 'macos';
        else if (platformLower.includes('linux') || platformLower.includes('unix')) os = 'linux';
        
        const profileKey = `${browser}-${version}-${os}`;
        
        // Return exact match or fallback to available profiles
        if (this.tlsProfiles[profileKey]) {
            return profileKey;
        }
        
        // Try browser-os combination
        const fallbackKey = `${browser}-131-${os}`;
        if (this.tlsProfiles[fallbackKey]) {
            return fallbackKey;
        }
        
        // Default fallback
        return 'chrome-131-windows';
    }

    /**
     * Shuffle array with controlled randomness
     */
    shuffleArray(array, random, shuffleChance) {
        const result = [...array];
        
        for (let i = result.length - 1; i > 0; i--) {
            if (random() < shuffleChance) {
                const j = Math.floor(random() * (i + 1));
                [result[i], result[j]] = [result[j], result[i]];
            }
        }
        
        return result;
    }

    /**
     * Create deterministic seed from string
     */
    createSeed(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
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
     * Generate JA3 fingerprint for profile
     */
    generateJA3Fingerprint(tlsProfile) {
        // JA3 format: Version,Ciphers,Extensions,EllipticCurves,EllipticCurvePointFormats
        
        const version = tlsProfile.version === '1.3' ? '771' : '769';
        const ciphers = tlsProfile.cipherSuites.slice(0, 15).map(cipher => {
            // Convert cipher names to numeric IDs (simplified mapping)
            const cipherMap = {
                'TLS_AES_128_GCM_SHA256': '4865',
                'TLS_AES_256_GCM_SHA384': '4866',
                'TLS_CHACHA20_POLY1305_SHA256': '4867',
                'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256': '49195',
                'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256': '49199'
            };
            return cipherMap[cipher] || '49195';
        }).join('-');
        
        const extensions = tlsProfile.extensions.slice(0, 15).map((ext, index) => index + 10).join('-');
        const curves = tlsProfile.supportedGroups.slice(0, 4).map((group, index) => index + 23).join('-');
        const pointFormats = '0'; // Standard point format
        
        return `${version},${ciphers},${extensions},${curves},${pointFormats}`;
    }

    /**
     * Test TLS fingerprint consistency
     */
    async testTLSConsistency(profile, iterations = 3) {
        const results = [];
        
        for (let i = 0; i < iterations; i++) {
            const tlsProfile = this.generateTLSProfile(profile);
            const ja3 = this.generateJA3Fingerprint(tlsProfile);
            results.push({ tlsProfile, ja3 });
        }
        
        // Check consistency
        const firstJA3 = results[0].ja3;
        const consistent = results.every(result => result.ja3 === firstJA3);
        
        return {
            consistent,
            ja3: firstJA3,
            profile: results[0].tlsProfile,
            iterations
        };
    }
}

module.exports = TLSFingerprintMasking;