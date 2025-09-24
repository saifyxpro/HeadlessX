/**
 * Advanced Mouse Movement Simulation
 * Human-like mouse movement with Bezier curves and natural patterns
 * HeadlessX v1.3.0 - Enhanced Anti-Detection
 */

const crypto = require('crypto');

class MouseMovement {
    constructor() {
        this.movementProfiles = {
            natural: {
                speed: { min: 100, max: 300 },
                acceleration: { min: 0.1, max: 0.8 },
                jitter: { frequency: 0.1, amplitude: 2 },
                pause: { frequency: 0.05, duration: { min: 50, max: 200 } }
            },
            cautious: {
                speed: { min: 50, max: 150 },
                acceleration: { min: 0.05, max: 0.4 },
                jitter: { frequency: 0.15, amplitude: 3 },
                pause: { frequency: 0.1, duration: { min: 100, max: 400 } }
            },
            confident: {
                speed: { min: 200, max: 500 },
                acceleration: { min: 0.3, max: 1.0 },
                jitter: { frequency: 0.05, amplitude: 1 },
                pause: { frequency: 0.02, duration: { min: 20, max: 100 } }
            },
            elderly: {
                speed: { min: 30, max: 100 },
                acceleration: { min: 0.02, max: 0.3 },
                jitter: { frequency: 0.25, amplitude: 5 },
                pause: { frequency: 0.2, duration: { min: 200, max: 800 } }
            }
        };

        this.deviceCharacteristics = {
            mouse: {
                precision: 1.0,
                smoothing: 0.8,
                polling_rate: 125
            },
            trackpad: {
                precision: 0.7,
                smoothing: 0.9,
                polling_rate: 90
            },
            touchscreen: {
                precision: 0.5,
                smoothing: 0.6,
                polling_rate: 60
            }
        };
    }

    /**
     * Generate Bezier curve points for natural mouse movement
     * @param {Object} start - Start coordinates {x, y}
     * @param {Object} end - End coordinates {x, y}
     * @param {string} profile - Movement profile
     * @param {string} device - Input device type
     * @returns {Array} Array of movement points
     */
    generateBezierPath(start, end, profile = 'natural', device = 'mouse') {
        const movementProfile = this.movementProfiles[profile] || this.movementProfiles.natural;
        const deviceChar = this.deviceCharacteristics[device] || this.deviceCharacteristics.mouse;
        
        const distance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
        const steps = Math.max(10, Math.floor(distance / 5) * deviceChar.precision);
        
        // Generate control points for natural curve
        const cp1 = {
            x: start.x + (end.x - start.x) * 0.25 + (Math.random() - 0.5) * distance * 0.2,
            y: start.y + (end.y - start.y) * 0.25 + (Math.random() - 0.5) * distance * 0.2
        };
        
        const cp2 = {
            x: start.x + (end.x - start.x) * 0.75 + (Math.random() - 0.5) * distance * 0.2,
            y: start.y + (end.y - start.y) * 0.75 + (Math.random() - 0.5) * distance * 0.2
        };

        const points = [];
        let totalTime = 0;
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            
            // Bezier curve calculation
            const x = Math.pow(1 - t, 3) * start.x +
                     3 * Math.pow(1 - t, 2) * t * cp1.x +
                     3 * (1 - t) * Math.pow(t, 2) * cp2.x +
                     Math.pow(t, 3) * end.x;
                     
            const y = Math.pow(1 - t, 3) * start.y +
                     3 * Math.pow(1 - t, 2) * t * cp1.y +
                     3 * (1 - t) * Math.pow(t, 2) * cp2.y +
                     Math.pow(t, 3) * end.y;

            // Add jitter based on profile
            const jitterX = (Math.random() - 0.5) * movementProfile.jitter.amplitude * 
                           (Math.random() < movementProfile.jitter.frequency ? 1 : 0);
            const jitterY = (Math.random() - 0.5) * movementProfile.jitter.amplitude * 
                           (Math.random() < movementProfile.jitter.frequency ? 1 : 0);

            // Calculate timing based on distance and speed
            const segmentDistance = i > 0 ? 
                Math.sqrt(Math.pow(x - points[i-1].x, 2) + Math.pow(y - points[i-1].y, 2)) : 0;
            
            const speed = movementProfile.speed.min + 
                         (movementProfile.speed.max - movementProfile.speed.min) * 
                         (0.5 + 0.5 * Math.sin(t * Math.PI)); // Speed varies in sine wave
            
            const timeIncrement = segmentDistance / speed * 1000; // Convert to milliseconds
            totalTime += timeIncrement;

            // Add pause if necessary
            if (Math.random() < movementProfile.pause.frequency && i > 0 && i < steps) {
                totalTime += movementProfile.pause.duration.min + 
                           Math.random() * (movementProfile.pause.duration.max - movementProfile.pause.duration.min);
            }

            points.push({
                x: Math.round(x + jitterX),
                y: Math.round(y + jitterY),
                timestamp: Math.round(totalTime),
                pressure: device === 'touchscreen' ? 0.3 + Math.random() * 0.4 : 0
            });
        }

        return points;
    }

    /**
     * Generate mouse movement script for page injection
     * @param {string} profileId - Profile identifier for consistency
     * @param {string} movementProfile - Movement profile
     * @param {string} device - Device type
     * @returns {string} JavaScript code for mouse movement simulation
     */
    getMouseMovementScript(profileId, movementProfile = 'natural', device = 'mouse') {
        const profile = this.movementProfiles[movementProfile] || this.movementProfiles.natural;
        const deviceChar = this.deviceCharacteristics[device] || this.deviceCharacteristics.mouse;

        return `
        (function() {
            const profileId = '${profileId}';
            const movementProfile = ${JSON.stringify(profile)};
            const deviceCharacteristics = ${JSON.stringify(deviceChar)};
            
            console.log('🖱️ Advanced mouse movement simulation active - Profile:', '${movementProfile}', 'Device:', '${device}');

            // Generate consistent randomness based on profile
            const generateProfileRandom = (seed, index) => {
                let hash = 0;
                for (let i = 0; i < seed.length; i++) {
                    hash = ((hash << 5) - hash + seed.charCodeAt(i)) & 0xffffffff;
                }
                const x = Math.sin(hash + index) * 10000;
                return x - Math.floor(x);
            };

            // Mouse movement history for behavioral analysis
            window._mouseHistory = window._mouseHistory || [];
            window._mouseMovementActive = true;
            
            let lastMouseMove = Date.now();
            let movementIndex = 0;

            // Generate Bezier curve path
            const generateBezierPath = (start, end) => {
                const distance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
                const steps = Math.max(5, Math.floor(distance / 8) * deviceCharacteristics.precision);
                
                // Control points for natural curve
                const cp1 = {
                    x: start.x + (end.x - start.x) * 0.25 + (generateProfileRandom(profileId, movementIndex++) - 0.5) * distance * 0.15,
                    y: start.y + (end.y - start.y) * 0.25 + (generateProfileRandom(profileId, movementIndex++) - 0.5) * distance * 0.15
                };
                
                const cp2 = {
                    x: start.x + (end.x - start.x) * 0.75 + (generateProfileRandom(profileId, movementIndex++) - 0.5) * distance * 0.15,
                    y: start.y + (end.y - start.y) * 0.75 + (generateProfileRandom(profileId, movementIndex++) - 0.5) * distance * 0.15
                };

                const points = [];
                for (let i = 0; i <= steps; i++) {
                    const t = i / steps;
                    
                    // Bezier curve calculation
                    const x = Math.pow(1 - t, 3) * start.x +
                             3 * Math.pow(1 - t, 2) * t * cp1.x +
                             3 * (1 - t) * Math.pow(t, 2) * cp2.x +
                             Math.pow(t, 3) * end.x;
                             
                    const y = Math.pow(1 - t, 3) * start.y +
                             3 * Math.pow(1 - t, 2) * t * cp1.y +
                             3 * (1 - t) * Math.pow(t, 2) * cp2.y +
                             Math.pow(t, 3) * end.y;

                    // Add jitter
                    const jitterX = (generateProfileRandom(profileId, movementIndex++) - 0.5) * movementProfile.jitter.amplitude;
                    const jitterY = (generateProfileRandom(profileId, movementIndex++) - 0.5) * movementProfile.jitter.amplitude;

                    points.push({
                        x: Math.round(x + jitterX),
                        y: Math.round(y + jitterY)
                    });
                }
                
                return points;
            };

            // Simulate natural mouse movement to element
            const moveMouseToElement = async (element) => {
                if (!element) return;
                
                const rect = element.getBoundingClientRect();
                const targetX = rect.left + rect.width / 2 + (generateProfileRandom(profileId, movementIndex++) - 0.5) * rect.width * 0.3;
                const targetY = rect.top + rect.height / 2 + (generateProfileRandom(profileId, movementIndex++) - 0.5) * rect.height * 0.3;
                
                const start = window._lastMousePosition || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
                const end = { x: targetX, y: targetY };
                
                const path = generateBezierPath(start, end);
                
                for (let i = 0; i < path.length; i++) {
                    const point = path[i];
                    const speed = movementProfile.speed.min + 
                                 (movementProfile.speed.max - movementProfile.speed.min) * 
                                 generateProfileRandom(profileId, movementIndex++);
                    
                    const delay = 1000 / speed * deviceCharacteristics.polling_rate / 125; // Adjust for polling rate
                    
                    setTimeout(() => {
                        const mouseEvent = new MouseEvent('mousemove', {
                            bubbles: true,
                            cancelable: true,
                            clientX: point.x,
                            clientY: point.y,
                            movementX: point.x - (window._lastMousePosition?.x || point.x),
                            movementY: point.y - (window._lastMousePosition?.y || point.y),
                            buttons: 0,
                            isTrusted: true
                        });
                        
                        element.dispatchEvent(mouseEvent);
                        document.dispatchEvent(mouseEvent);
                        
                        window._lastMousePosition = { x: point.x, y: point.y };
                        window._mouseHistory.push({
                            x: point.x,
                            y: point.y,
                            timestamp: Date.now(),
                            type: 'move',
                            target: element.tagName,
                            isTrusted: true
                        });
                        
                        // Keep history manageable
                        if (window._mouseHistory.length > 200) {
                            window._mouseHistory.shift();
                        }
                        
                    }, delay * i);
                }
                
                // Add pause at target
                if (generateProfileRandom(profileId, movementIndex++) < movementProfile.pause.frequency) {
                    const pauseDuration = movementProfile.pause.duration.min + 
                                         generateProfileRandom(profileId, movementIndex++) * 
                                         (movementProfile.pause.duration.max - movementProfile.pause.duration.min);
                    await new Promise(resolve => setTimeout(resolve, pauseDuration));
                }
            };

            // Add micro-movements when hovering
            const addMicroMovements = (element) => {
                if (!element || !window._mouseMovementActive) return;
                
                const addMicroMovement = () => {
                    if (!document.contains(element)) return;
                    
                    const rect = element.getBoundingClientRect();
                    const currentPos = window._lastMousePosition || { x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
                    
                    const microX = currentPos.x + (generateProfileRandom(profileId, movementIndex++) - 0.5) * 2;
                    const microY = currentPos.y + (generateProfileRandom(profileId, movementIndex++) - 0.5) * 2;
                    
                    const microEvent = new MouseEvent('mousemove', {
                        bubbles: true,
                        cancelable: true,
                        clientX: microX,
                        clientY: microY,
                        movementX: microX - currentPos.x,
                        movementY: microY - currentPos.y,
                        buttons: 0,
                        isTrusted: true
                    });
                    
                    element.dispatchEvent(microEvent);
                    window._lastMousePosition = { x: microX, y: microY };
                    
                    // Schedule next micro-movement
                    const nextDelay = 200 + generateProfileRandom(profileId, movementIndex++) * 300;
                    setTimeout(addMicroMovement, nextDelay);
                };
                
                // Start micro-movements after short delay
                setTimeout(addMicroMovement, 100 + generateProfileRandom(profileId, movementIndex++) * 200);
            };

            // Override click events to add natural mouse movement
            const originalAddEventListener = EventTarget.prototype.addEventListener;
            EventTarget.prototype.addEventListener = function(type, listener, options) {
                if (type === 'click' && this instanceof HTMLElement) {
                    const wrappedListener = async function(event) {
                        if (window._mouseMovementActive) {
                            // Move mouse to clicked element naturally
                            await moveMouseToElement(this);
                            
                            // Add slight delay before click
                            const clickDelay = 50 + generateProfileRandom(profileId, movementIndex++) * 100;
                            await new Promise(resolve => setTimeout(resolve, clickDelay));
                        }
                        
                        return listener.call(this, event);
                    };
                    
                    return originalAddEventListener.call(this, type, wrappedListener, options);
                }
                
                return originalAddEventListener.call(this, type, listener, options);
            };

            // Simulate natural mouse entry and exit
            document.addEventListener('mouseenter', (e) => {
                if (e.target instanceof HTMLElement) {
                    addMicroMovements(e.target);
                }
            }, { passive: true, capture: true });

            // Initialize with random position
            window._lastMousePosition = {
                x: window.innerWidth * (0.3 + generateProfileRandom(profileId, movementIndex++) * 0.4),
                y: window.innerHeight * (0.3 + generateProfileRandom(profileId, movementIndex++) * 0.4)
            };

            // Add global mouse movement simulation
            const simulateBackgroundMovement = () => {
                if (!window._mouseMovementActive) return;
                
                // Occasionally move mouse even without interaction
                if (generateProfileRandom(profileId, movementIndex++) < 0.1) {
                    const randomElement = document.elementFromPoint(
                        window.innerWidth * generateProfileRandom(profileId, movementIndex++),
                        window.innerHeight * generateProfileRandom(profileId, movementIndex++)
                    );
                    
                    if (randomElement) {
                        moveMouseToElement(randomElement);
                    }
                }
                
                // Schedule next background movement
                const nextInterval = 5000 + generateProfileRandom(profileId, movementIndex++) * 10000;
                setTimeout(simulateBackgroundMovement, nextInterval);
            };
            
            // Start background movement simulation
            setTimeout(simulateBackgroundMovement, 1000);

            // Expose utility function for manual movement
            window.simulateMouseMoveTo = moveMouseToElement;
            
        })();
        `;
    }

    /**
     * Get movement profiles
     * @returns {Object} Available movement profiles
     */
    getMovementProfiles() {
        return this.movementProfiles;
    }

    /**
     * Get device characteristics
     * @returns {Object} Available device characteristics
     */
    getDeviceCharacteristics() {
        return this.deviceCharacteristics;
    }

    /**
     * Generate test movement data
     * @param {string} profileId - Profile identifier
     * @param {string} profile - Movement profile
     * @returns {Object} Test movement data
     */
    generateTestMovement(profileId, profile = 'natural') {
        const start = { x: 100, y: 100 };
        const end = { x: 400, y: 300 };
        const path = this.generateBezierPath(start, end, profile);
        
        return {
            profileId,
            profile,
            path,
            duration: path[path.length - 1].timestamp,
            distance: Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)),
            points: path.length,
            timestamp: Date.now(),
            fingerprint: crypto.createHash('sha256')
                .update(profileId + profile + path.length.toString())
                .digest('hex').slice(0, 16)
        };
    }
}

module.exports = MouseMovement;