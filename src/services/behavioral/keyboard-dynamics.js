/**
 * Keyboard Dynamics Simulation
 * Human-like keyboard timing patterns and typing behavior
 * HeadlessX v1.3.0 - Enhanced Anti-Detection
 */

const crypto = require('crypto');

class KeyboardDynamics {
    constructor() {
        this.typingProfiles = {
            fast: {
                wpm: { min: 70, max: 90 },
                dwellTime: { min: 50, max: 100 },
                flightTime: { min: 80, max: 150 },
                errorRate: 0.02,
                pauseBetweenWords: { min: 100, max: 200 }
            },
            normal: {
                wpm: { min: 40, max: 60 },
                dwellTime: { min: 80, max: 150 },
                flightTime: { min: 120, max: 200 },
                errorRate: 0.05,
                pauseBetweenWords: { min: 200, max: 400 }
            },
            slow: {
                wpm: { min: 20, max: 35 },
                dwellTime: { min: 120, max: 250 },
                flightTime: { min: 200, max: 400 },
                errorRate: 0.08,
                pauseBetweenWords: { min: 400, max: 800 }
            },
            hunt_peck: {
                wpm: { min: 15, max: 25 },
                dwellTime: { min: 200, max: 500 },
                flightTime: { min: 300, max: 800 },
                errorRate: 0.12,
                pauseBetweenWords: { min: 500, max: 1200 }
            }
        };

        this.keyboardLayouts = {
            qwerty: {
                'q': { row: 1, finger: 'left_pinky', hand: 'left' },
                'w': { row: 1, finger: 'left_ring', hand: 'left' },
                'e': { row: 1, finger: 'left_middle', hand: 'left' },
                'r': { row: 1, finger: 'left_index', hand: 'left' },
                't': { row: 1, finger: 'left_index', hand: 'left' },
                'y': { row: 1, finger: 'right_index', hand: 'right' },
                'u': { row: 1, finger: 'right_index', hand: 'right' },
                'i': { row: 1, finger: 'right_middle', hand: 'right' },
                'o': { row: 1, finger: 'right_ring', hand: 'right' },
                'p': { row: 1, finger: 'right_pinky', hand: 'right' },
                'a': { row: 2, finger: 'left_pinky', hand: 'left' },
                's': { row: 2, finger: 'left_ring', hand: 'left' },
                'd': { row: 2, finger: 'left_middle', hand: 'left' },
                'f': { row: 2, finger: 'left_index', hand: 'left' },
                'g': { row: 2, finger: 'left_index', hand: 'left' },
                'h': { row: 2, finger: 'right_index', hand: 'right' },
                'j': { row: 2, finger: 'right_index', hand: 'right' },
                'k': { row: 2, finger: 'right_middle', hand: 'right' },
                'l': { row: 2, finger: 'right_ring', hand: 'right' },
                'z': { row: 3, finger: 'left_pinky', hand: 'left' },
                'x': { row: 3, finger: 'left_ring', hand: 'left' },
                'c': { row: 3, finger: 'left_middle', hand: 'left' },
                'v': { row: 3, finger: 'left_index', hand: 'left' },
                'b': { row: 3, finger: 'left_index', hand: 'left' },
                'n': { row: 3, finger: 'right_index', hand: 'right' },
                'm': { row: 3, finger: 'right_index', hand: 'right' },
                ' ': { row: 4, finger: 'thumb', hand: 'both' }
            }
        };

        this.commonBigrams = {
            'th': 1.52, 'he': 1.28, 'in': 0.94, 'er': 0.94, 're': 0.87,
            'an': 0.82, 'nd': 0.73, 'on': 0.73, 'en': 0.69, 'at': 0.69,
            'ou': 0.64, 'ed': 0.63, 'ha': 0.56, 'to': 0.52, 'or': 0.52,
            'it': 0.50, 'is': 0.50, 'hi': 0.49, 'es': 0.49, 'ng': 0.48
        };
    }

    /**
     * Calculate realistic typing timing for character sequence
     * @param {string} text - Text to type
     * @param {string} profileId - Profile identifier
     * @param {string} typingProfile - Typing profile
     * @returns {Array} Array of keystroke timing data
     */
    calculateTypingTiming(text, profileId, typingProfile = 'normal') {
        const profile = this.typingProfiles[typingProfile] || this.typingProfiles.normal;
        const keystrokes = [];
        
        let currentTime = 0;
        let previousChar = null;
        
        // Generate consistent randomness
        const generateRandom = (seed, index) => {
            let hash = 0;
            for (let i = 0; i < seed.length; i++) {
                hash = ((hash << 5) - hash + seed.charCodeAt(i)) & 0xffffffff;
            }
            const x = Math.sin(hash + index) * 10000;
            return x - Math.floor(x);
        };

        for (let i = 0; i < text.length; i++) {
            const char = text[i].toLowerCase();
            const randomSeed = profileId + i;
            
            // Calculate base timing from WPM
            const baseCharTime = (60000 / (profile.wpm.min + (profile.wpm.max - profile.wpm.min) * generateRandom(randomSeed, 1))) / 5;
            
            // Dwell time (how long key is held down)
            const dwellTime = profile.dwellTime.min + 
                             (profile.dwellTime.max - profile.dwellTime.min) * generateRandom(randomSeed, 2);
            
            // Flight time (time between key releases)
            let flightTime = profile.flightTime.min + 
                           (profile.flightTime.max - profile.flightTime.min) * generateRandom(randomSeed, 3);
            
            // Adjust timing based on key combinations
            if (previousChar && this.keyboardLayouts.qwerty[char] && this.keyboardLayouts.qwerty[previousChar]) {
                const prevKey = this.keyboardLayouts.qwerty[previousChar];
                const currKey = this.keyboardLayouts.qwerty[char];
                
                // Same finger penalty
                if (prevKey.finger === currKey.finger) {
                    flightTime *= 1.5;
                }
                
                // Different hand bonus
                if (prevKey.hand !== currKey.hand && currKey.hand !== 'both') {
                    flightTime *= 0.8;
                }
                
                // Row change penalty
                if (Math.abs(prevKey.row - currKey.row) > 1) {
                    flightTime *= 1.2;
                }
            }
            
            // Bigram adjustments for common letter combinations
            if (previousChar) {
                const bigram = previousChar + char;
                if (this.commonBigrams[bigram]) {
                    flightTime *= (1.0 - this.commonBigrams[bigram] * 0.1); // Common bigrams are faster
                }
            }
            
            // Add natural variation
            const variation = 0.8 + 0.4 * generateRandom(randomSeed, 4);
            flightTime *= variation;
            
            // Pause between words
            if (char === ' ') {
                flightTime += profile.pauseBetweenWords.min + 
                            (profile.pauseBetweenWords.max - profile.pauseBetweenWords.min) * generateRandom(randomSeed, 5);
            }
            
            // Simulate thinking pauses (random longer pauses)
            if (generateRandom(randomSeed, 6) < 0.05) {
                flightTime += 500 + generateRandom(randomSeed, 7) * 1500; // Thinking pause
            }
            
            currentTime += flightTime;
            
            keystrokes.push({
                char: text[i], // Keep original case
                keyDown: Math.round(currentTime),
                keyUp: Math.round(currentTime + dwellTime),
                dwellTime: Math.round(dwellTime),
                flightTime: Math.round(flightTime),
                finger: this.keyboardLayouts.qwerty[char]?.finger || 'unknown',
                hand: this.keyboardLayouts.qwerty[char]?.hand || 'unknown'
            });
            
            currentTime += dwellTime;
            previousChar = char;
        }
        
        return keystrokes;
    }

    /**
     * Generate keyboard dynamics script for page injection
     * @param {string} profileId - Profile identifier
     * @param {string} typingProfile - Typing profile
     * @returns {string} JavaScript code for keyboard dynamics
     */
    getKeyboardDynamicsScript(profileId, typingProfile = 'normal') {
        const profile = this.typingProfiles[typingProfile] || this.typingProfiles.normal;
        
        return `
        (function() {
            const profileId = '${profileId}';
            const typingProfile = ${JSON.stringify(profile)};
            const keyboardLayout = ${JSON.stringify(this.keyboardLayouts.qwerty)};
            const commonBigrams = ${JSON.stringify(this.commonBigrams)};
            
            console.log('⌨️ Keyboard dynamics simulation active - Profile:', '${typingProfile}');

            // Generate consistent randomness
            const generateRandom = (seed, index) => {
                let hash = 0;
                for (let i = 0; i < seed.length; i++) {
                    hash = ((hash << 5) - hash + seed.charCodeAt(i)) & 0xffffffff;
                }
                const x = Math.sin(hash + index) * 10000;
                return x - Math.floor(x);
            };

            // Keyboard history tracking
            window._keyboardHistory = window._keyboardHistory || [];
            window._typingActive = false;
            let keystrokeIndex = 0;

            // Calculate timing for text input
            const calculateTypingTiming = (text) => {
                const keystrokes = [];
                let currentTime = 0;
                let previousChar = null;
                
                for (let i = 0; i < text.length; i++) {
                    const char = text[i].toLowerCase();
                    const randomSeed = profileId + i + keystrokeIndex;
                    
                    // Base timing from WPM
                    const baseCharTime = (60000 / (typingProfile.wpm.min + 
                        (typingProfile.wpm.max - typingProfile.wpm.min) * generateRandom(randomSeed, 1))) / 5;
                    
                    // Dwell time
                    const dwellTime = typingProfile.dwellTime.min + 
                        (typingProfile.dwellTime.max - typingProfile.dwellTime.min) * generateRandom(randomSeed, 2);
                    
                    // Flight time
                    let flightTime = typingProfile.flightTime.min + 
                        (typingProfile.flightTime.max - typingProfile.flightTime.min) * generateRandom(randomSeed, 3);
                    
                    // Key combination adjustments
                    if (previousChar && keyboardLayout[char] && keyboardLayout[previousChar]) {
                        const prevKey = keyboardLayout[previousChar];
                        const currKey = keyboardLayout[char];
                        
                        if (prevKey.finger === currKey.finger) flightTime *= 1.5;
                        if (prevKey.hand !== currKey.hand && currKey.hand !== 'both') flightTime *= 0.8;
                        if (Math.abs(prevKey.row - currKey.row) > 1) flightTime *= 1.2;
                    }
                    
                    // Bigram adjustments
                    if (previousChar && commonBigrams[previousChar + char]) {
                        flightTime *= (1.0 - commonBigrams[previousChar + char] * 0.1);
                    }
                    
                    // Natural variation
                    flightTime *= (0.8 + 0.4 * generateRandom(randomSeed, 4));
                    
                    // Word boundaries
                    if (char === ' ') {
                        flightTime += typingProfile.pauseBetweenWords.min + 
                            (typingProfile.pauseBetweenWords.max - typingProfile.pauseBetweenWords.min) * 
                            generateRandom(randomSeed, 5);
                    }
                    
                    // Thinking pauses
                    if (generateRandom(randomSeed, 6) < 0.05) {
                        flightTime += 500 + generateRandom(randomSeed, 7) * 1500;
                    }
                    
                    currentTime += flightTime;
                    
                    keystrokes.push({
                        char: text[i],
                        keyDown: currentTime,
                        keyUp: currentTime + dwellTime,
                        dwellTime: dwellTime,
                        flightTime: flightTime
                    });
                    
                    currentTime += dwellTime;
                    previousChar = char;
                }
                
                return keystrokes;
            };

            // Simulate realistic typing for input fields
            const simulateTyping = async (element, text) => {
                if (!element || !text) return;
                
                window._typingActive = true;
                const keystrokes = calculateTypingTiming(text);
                
                // Clear field first
                element.value = '';
                element.dispatchEvent(new Event('input', { bubbles: true }));
                
                let currentText = '';
                
                for (let i = 0; i < keystrokes.length; i++) {
                    const keystroke = keystrokes[i];
                    const delay = i > 0 ? keystrokes[i].keyDown - keystrokes[i-1].keyUp : 0;
                    
                    await new Promise(resolve => setTimeout(resolve, delay));
                    
                    // Key down event
                    const keyDownEvent = new KeyboardEvent('keydown', {
                        key: keystroke.char,
                        code: 'Key' + keystroke.char.toUpperCase(),
                        which: keystroke.char.charCodeAt(0),
                        keyCode: keystroke.char.charCodeAt(0),
                        charCode: keystroke.char.charCodeAt(0),
                        bubbles: true,
                        cancelable: true,
                        isTrusted: true
                    });
                    
                    element.dispatchEvent(keyDownEvent);
                    
                    // Key press event (for character input)
                    if (keystroke.char.match(/[a-zA-Z0-9 ]/)) {
                        const keyPressEvent = new KeyboardEvent('keypress', {
                            key: keystroke.char,
                            code: 'Key' + keystroke.char.toUpperCase(),
                            which: keystroke.char.charCodeAt(0),
                            keyCode: keystroke.char.charCodeAt(0),
                            charCode: keystroke.char.charCodeAt(0),
                            bubbles: true,
                            cancelable: true,
                            isTrusted: true
                        });
                        
                        element.dispatchEvent(keyPressEvent);
                        
                        // Update value with typed character
                        currentText += keystroke.char;
                        element.value = currentText;
                        
                        // Input event
                        const inputEvent = new Event('input', { bubbles: true });
                        element.dispatchEvent(inputEvent);
                    }
                    
                    // Wait for dwell time
                    await new Promise(resolve => setTimeout(resolve, keystroke.dwellTime));
                    
                    // Key up event
                    const keyUpEvent = new KeyboardEvent('keyup', {
                        key: keystroke.char,
                        code: 'Key' + keystroke.char.toUpperCase(),
                        which: keystroke.char.charCodeAt(0),
                        keyCode: keystroke.char.charCodeAt(0),
                        charCode: 0,
                        bubbles: true,
                        cancelable: true,
                        isTrusted: true
                    });
                    
                    element.dispatchEvent(keyUpEvent);
                    
                    // Track keystroke
                    window._keyboardHistory.push({
                        char: keystroke.char,
                        timestamp: Date.now(),
                        dwellTime: keystroke.dwellTime,
                        flightTime: keystroke.flightTime,
                        element: element.tagName,
                        isTrusted: true
                    });
                    
                    keystrokeIndex++;
                }
                
                // Final change event
                const changeEvent = new Event('change', { bubbles: true });
                element.dispatchEvent(changeEvent);
                
                window._typingActive = false;
                
                // Keep history manageable
                if (window._keyboardHistory.length > 500) {
                    window._keyboardHistory = window._keyboardHistory.slice(-300);
                }
            };

            // Override input handling to add realistic typing
            const originalSetValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
            Object.defineProperty(HTMLInputElement.prototype, 'value', {
                set: function(newValue) {
                    // Only simulate typing for visible, interactive inputs during automation
                    if (this.type === 'text' || this.type === 'email' || this.type === 'password') {
                        if (window._simulateTyping && newValue && newValue !== this.value) {
                            simulateTyping(this, newValue);
                            return;
                        }
                    }
                    return originalSetValue.call(this, newValue);
                },
                get: Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').get,
                configurable: true
            });

            // Add natural typing simulation to focus events
            document.addEventListener('focusin', (e) => {
                if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                    // Add random micro-delays on focus
                    setTimeout(() => {
                        if (document.activeElement === e.target) {
                            // Simulate natural cursor positioning delay
                        }
                    }, 50 + generateRandom(profileId, keystrokeIndex++) * 100);
                }
            });

            // Expose utility functions
            window.simulateTyping = simulateTyping;
            window.calculateTypingTiming = calculateTypingTiming;
            
            // Flag to enable typing simulation
            window._simulateTyping = false;

        })();
        `;
    }

    /**
     * Get typing profiles
     * @returns {Object} Available typing profiles
     */
    getTypingProfiles() {
        return this.typingProfiles;
    }

    /**
     * Get keyboard layouts
     * @returns {Object} Available keyboard layouts
     */
    getKeyboardLayouts() {
        return this.keyboardLayouts;
    }

    /**
     * Generate test typing data
     * @param {string} profileId - Profile identifier
     * @param {string} typingProfile - Typing profile
     * @param {string} text - Test text
     * @returns {Object} Test typing data
     */
    generateTestTyping(profileId, typingProfile = 'normal', text = 'Hello World') {
        const keystrokes = this.calculateTypingTiming(text, profileId, typingProfile);
        const totalTime = keystrokes[keystrokes.length - 1]?.keyUp || 0;
        const avgDwellTime = keystrokes.reduce((sum, k) => sum + k.dwellTime, 0) / keystrokes.length;
        const avgFlightTime = keystrokes.reduce((sum, k) => sum + k.flightTime, 0) / keystrokes.length;
        
        return {
            profileId,
            typingProfile,
            text,
            keystrokes,
            statistics: {
                totalTime,
                characterCount: text.length,
                wpm: (text.length / 5) / (totalTime / 60000),
                avgDwellTime: Math.round(avgDwellTime),
                avgFlightTime: Math.round(avgFlightTime)
            },
            timestamp: Date.now(),
            fingerprint: crypto.createHash('sha256')
                .update(profileId + typingProfile + totalTime.toString())
                .digest('hex').slice(0, 16)
        };
    }

    /**
     * Calculate timing for a single keystroke
     */
    calculateTiming(char, profile = 'normal') {
        const typingProfile = this.typingProfiles[profile] || this.typingProfiles.normal;
        
        return {
            dwellTime: this.randomBetween(typingProfile.dwellTime.min, typingProfile.dwellTime.max),
            flightTime: this.randomBetween(typingProfile.flightTime.min, typingProfile.flightTime.max)
        };
    }
}

module.exports = KeyboardDynamics;