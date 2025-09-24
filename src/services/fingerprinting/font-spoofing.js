/**
 * Font Fingerprinting Control
 * Advanced font enumeration and rendering fingerprint manipulation
 * HeadlessX v1.3.0 - Enhanced Anti-Detection
 */

const crypto = require('crypto');
const { logger } = require('../../utils/logger');

class FontSpoofing {
    constructor() {
        this.fontProfiles = this.initializeFontProfiles();
        this.logger = logger;
    }

    /**
     * Initialize font profiles for different operating systems
     */
    initializeFontProfiles() {
        return {
            windows: {
                systemFonts: [
                    'Arial', 'Arial Black', 'Arial Narrow', 'Arial Unicode MS',
                    'Calibri', 'Cambria', 'Candara', 'Comic Sans MS',
                    'Consolas', 'Constantia', 'Corbel', 'Courier New',
                    'Franklin Gothic Medium', 'Gabriola', 'Garamond',
                    'Georgia', 'Impact', 'Lucida Console', 'Lucida Sans Unicode',
                    'Microsoft Sans Serif', 'Palatino Linotype', 'Segoe UI',
                    'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana',
                    'Webdings', 'Wingdings'
                ],
                commonFonts: [
                    'Arial', 'Calibri', 'Times New Roman', 'Verdana',
                    'Georgia', 'Tahoma', 'Consolas', 'Segoe UI'
                ],
                fontRendering: {
                    antialiasing: 'subpixel',
                    hinting: 'full',
                    clearType: true
                }
            },
            macos: {
                systemFonts: [
                    'American Typewriter', 'Andale Mono', 'Arial',
                    'Arial Black', 'Arial Narrow', 'Arial Rounded MT Bold',
                    'Arial Unicode MS', 'Avenir', 'Avenir Next',
                    'Baskerville', 'Big Caslon', 'Bodoni 72',
                    'Bradley Hand', 'Brush Script MT', 'Chalkboard',
                    'Chalkboard SE', 'Chalkduster', 'Charter',
                    'Cochin', 'Comic Sans MS', 'Copperplate',
                    'Courier', 'Courier New', 'Didot',
                    'Futura', 'Geneva', 'Georgia', 'Gill Sans',
                    'Helvetica', 'Helvetica Neue', 'Herculanum',
                    'Hoefler Text', 'Impact', 'Lucida Grande',
                    'Luminari', 'Marker Felt', 'Menlo',
                    'Monaco', 'Noteworthy', 'Optima',
                    'Palatino', 'Papyrus', 'Phosphate',
                    'Rockwell', 'Savoye LET', 'SignPainter',
                    'Skia', 'Snell Roundhand', 'Tahoma',
                    'Times', 'Times New Roman', 'Trattatello',
                    'Trebuchet MS', 'Verdana', 'Zapfino'
                ],
                commonFonts: [
                    'Helvetica Neue', 'SF Pro Text', 'SF Pro Display',
                    'Arial', 'Times', 'Courier', 'Geneva'
                ],
                fontRendering: {
                    antialiasing: 'subpixel',
                    hinting: 'slight',
                    clearType: false
                }
            },
            linux: {
                systemFonts: [
                    'DejaVu Sans', 'DejaVu Sans Mono', 'DejaVu Serif',
                    'Liberation Sans', 'Liberation Sans Narrow', 'Liberation Serif',
                    'Liberation Mono', 'Ubuntu', 'Ubuntu Condensed',
                    'Ubuntu Mono', 'Droid Sans', 'Droid Sans Mono',
                    'Droid Serif', 'Noto Sans', 'Noto Serif',
                    'FreeSans', 'FreeSerif', 'FreeMono',
                    'Bitstream Vera Sans', 'Bitstream Vera Sans Mono',
                    'Bitstream Vera Serif'
                ],
                commonFonts: [
                    'DejaVu Sans', 'Ubuntu', 'Liberation Sans',
                    'Noto Sans', 'FreeSans'
                ],
                fontRendering: {
                    antialiasing: 'grayscale',
                    hinting: 'slight',
                    clearType: false
                }
            }
        };
    }

    /**
     * Generate consistent font fingerprint for profile
     */
    generateFontFingerprint(profile) {
        const seed = this.createSeed(profile.userAgent + profile.platform);
        const random = this.seededRandom(seed);
        
        const platform = this.detectPlatform(profile.platform);
        const fontProfile = this.fontProfiles[platform];
        
        // Select available fonts based on platform
        const availableFonts = this.selectAvailableFonts(fontProfile, random);
        
        // Generate font measurement variations
        const fontMetrics = this.generateFontMetrics(availableFonts, random);
        
        return {
            availableFonts,
            fontMetrics,
            renderingSettings: fontProfile.fontRendering
        };
    }

    /**
     * Select available fonts with realistic variations
     */
    selectAvailableFonts(fontProfile, random) {
        const { systemFonts, commonFonts } = fontProfile;
        
        // Always include common fonts
        let available = [...commonFonts];
        
        // Add random selection of system fonts (80-95% availability)
        systemFonts.forEach(font => {
            if (!available.includes(font) && random() > 0.05 && random() < 0.95) {
                available.push(font);
            }
        });
        
        // Sort to ensure consistency
        return available.sort();
    }

    /**
     * Generate font measurement fingerprints
     */
    generateFontMetrics(fonts, random) {
        const metrics = {};
        
        fonts.forEach(font => {
            metrics[font] = {
                // Simulate font measurement variations
                ascent: this.addNoise(20, random, 1),
                descent: this.addNoise(5, random, 0.5),
                height: this.addNoise(25, random, 1),
                width: this.addNoise(12, random, 0.8),
                // Character width measurements for common chars
                charWidths: {
                    'a': this.addNoise(8, random, 0.2),
                    'i': this.addNoise(3, random, 0.1),
                    'm': this.addNoise(14, random, 0.3),
                    'w': this.addNoise(12, random, 0.2)
                }
            };
        });
        
        return metrics;
    }

    /**
     * Inject font fingerprint control into page
     */
    async injectFontSpoofing(page, profile) {
        try {
            const fontFingerprint = this.generateFontFingerprint(profile);
            
            await page.evaluateOnNewDocument((fingerprint) => {
                // Override font enumeration
                const originalCheckFont = () => {
                    // Mock font availability check
                    return function(fontName) {
                        return fingerprint.availableFonts.includes(fontName);
                    };
                };

                // Override canvas text measurements
                const originalFillText = CanvasRenderingContext2D.prototype.fillText;
                const originalMeasureText = CanvasRenderingContext2D.prototype.measureText;
                
                CanvasRenderingContext2D.prototype.measureText = function(text) {
                    const result = originalMeasureText.call(this, text);
                    
                    // Add consistent noise to measurements
                    const font = this.font || 'Arial';
                    const fontName = font.split(' ').pop().replace(/["']/g, '');
                    const metrics = fingerprint.fontMetrics[fontName];
                    
                    if (metrics) {
                        result.width += (result.width * 0.01 * Math.sin(text.length));
                        result.actualBoundingBoxAscent = metrics.ascent;
                        result.actualBoundingBoxDescent = metrics.descent;
                    }
                    
                    return result;
                };

                // Override document.fonts if available
                if (typeof document.fonts !== 'undefined') {
                    const originalCheck = document.fonts.check;
                    document.fonts.check = function(font, text) {
                        const fontFamily = font.match(/['"]?([^'"]+)['"]?$/);
                        if (fontFamily && fingerprint.availableFonts.includes(fontFamily[1])) {
                            return true;
                        }
                        return originalCheck.call(this, font, text);
                    };
                }

                // Mock font loading API
                if (typeof FontFace !== 'undefined') {
                    const originalConstructor = FontFace;
                    window.FontFace = function(family, source, descriptors) {
                        const instance = new originalConstructor(family, source, descriptors);
                        
                        // Add realistic loading delays
                        const originalLoad = instance.load;
                        instance.load = function() {
                            return new Promise((resolve) => {
                                setTimeout(() => {
                                    resolve(originalLoad.call(this));
                                }, 10 + Math.random() * 50);
                            });
                        };
                        
                        return instance;
                    };
                }
            }, fontFingerprint);

            this.logger.debug(`Font spoofing injected for ${profile.userAgent.substring(0, 50)}...`);
            return true;
        } catch (error) {
            this.logger.error('Font spoofing injection failed:', error);
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
     * Add noise to measurements
     */
    addNoise(base, random, variance) {
        const noise = (random() - 0.5) * variance;
        return Math.round((base + noise) * 100) / 100;
    }

    /**
     * Test font fingerprint consistency
     */
    async testFontConsistency(profile, iterations = 5) {
        const results = [];
        
        for (let i = 0; i < iterations; i++) {
            const fingerprint = this.generateFontFingerprint(profile);
            results.push(fingerprint);
        }
        
        // Check consistency
        const firstResult = JSON.stringify(results[0]);
        const consistent = results.every(result => 
            JSON.stringify(result) === firstResult
        );
        
        return {
            consistent,
            profile: results[0],
            iterations
        };
    }
}

module.exports = FontSpoofing;