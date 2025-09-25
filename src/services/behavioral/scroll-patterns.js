/**
 * Scroll Patterns Service v1.3.0
 * Generates natural scrolling behaviors based on user profiles
 */

const BEHAVIORAL_PATTERNS = {
    reader: {
        name: 'Careful Reader',
        scrollSpeed: { min: 100, max: 300 },
        pauseProbability: 0.6,
        pauseDuration: { min: 1000, max: 3000 },
        backtrackProbability: 0.2,
        jumpProbability: 0.1
    },
    scanner: {
        name: 'Quick Scanner',
        scrollSpeed: { min: 300, max: 800 },
        pauseProbability: 0.3,
        pauseDuration: { min: 200, max: 800 },
        backtrackProbability: 0.1,
        jumpProbability: 0.3
    },
    browser: {
        name: 'Casual Browser',
        scrollSpeed: { min: 200, max: 500 },
        pauseProbability: 0.4,
        pauseDuration: { min: 500, max: 2000 },
        backtrackProbability: 0.15,
        jumpProbability: 0.2
    },
    researcher: {
        name: 'Focused Researcher',
        scrollSpeed: { min: 80, max: 200 },
        pauseProbability: 0.8,
        pauseDuration: { min: 2000, max: 5000 },
        backtrackProbability: 0.4,
        jumpProbability: 0.05
    }
};

class ScrollPatterns {
    /**
     * Behavioral scroll profiles
     */
    static getScrollProfiles() {
        return {
            reader: {
                name: 'Content Reader',
                scrollSpeed: 'slow',
                pauseFrequency: 'high',
                backtrackChance: 0.15,
                pauseDuration: { min: 800, max: 2500 },
                scrollDistance: { min: 40, max: 120 },
                characteristics: 'Reads content thoroughly with frequent pauses'
            },
            scanner: {
                name: 'Quick Scanner',
                scrollSpeed: 'fast',
                pauseFrequency: 'low',
                backtrackChance: 0.05,
                pauseDuration: { min: 200, max: 800 },
                scrollDistance: { min: 100, max: 300 },
                characteristics: 'Scrolls quickly looking for specific information'
            },
            browser: {
                name: 'Casual Browser',
                scrollSpeed: 'medium',
                pauseFrequency: 'medium',
                backtrackChance: 0.08,
                pauseDuration: { min: 400, max: 1500 },
                scrollDistance: { min: 60, max: 180 },
                characteristics: 'Natural browsing with variable attention'
            },
            researcher: {
                name: 'Detailed Researcher',
                scrollSpeed: 'variable',
                pauseFrequency: 'very-high',
                backtrackChance: 0.25,
                pauseDuration: { min: 1000, max: 4000 },
                scrollDistance: { min: 30, max: 100 },
                characteristics: 'Careful examination with frequent backtracking'
            }
        };
    }

    /**
     * Generate scroll pattern for a specific behavior type
     */
    static generateScrollPattern(profileType = 'browser', contentLength = 1000) {
        const profile = this.getScrollProfiles()[profileType] || this.getScrollProfiles().browser;
        const pattern = [];

        let currentPosition = 0;
        const targetPosition = contentLength * 0.8; // Don't always scroll to the very bottom

        while (currentPosition < targetPosition) {
            const action = this.generateScrollAction(profile, currentPosition, targetPosition);
            pattern.push(action);

            if (action.type === 'scroll') {
                currentPosition += action.distance;
            } else if (action.type === 'backtrack') {
                currentPosition = Math.max(0, currentPosition - action.distance);
            }

            // Prevent infinite loops
            if (pattern.length > 100) break;
        }

        return {
            profile: profileType,
            totalActions: pattern.length,
            estimatedDuration: pattern.reduce((sum, action) => sum + action.duration + action.pause, 0),
            actions: pattern
        };
    }

    /**
     * Generate individual scroll action
     */
    static generateScrollAction(profile, currentPos, targetPos) {
        const remainingDistance = targetPos - currentPos;

        // Determine action type
        let actionType = 'scroll';
        if (Math.random() < profile.backtrackChance && currentPos > 100) {
            actionType = 'backtrack';
        } else if (Math.random() < 0.1) {
            actionType = 'pause';
        }

        const action = {
            type: actionType,
            timestamp: Date.now(),
            position: currentPos
        };

        switch (actionType) {
        case 'scroll':
            action.distance = Math.min(
                this.randomBetween(profile.scrollDistance.min, profile.scrollDistance.max),
                remainingDistance
            );
            action.duration = this.calculateScrollDuration(action.distance, profile.scrollSpeed);
            action.easing = this.selectEasing(profile.scrollSpeed);
            break;

        case 'backtrack':
            action.distance = this.randomBetween(20, Math.min(100, currentPos));
            action.duration = this.calculateScrollDuration(action.distance, 'slow');
            action.reason = 'reread';
            break;

        case 'pause':
            action.duration = this.randomBetween(profile.pauseDuration.min, profile.pauseDuration.max);
            action.reason = Math.random() < 0.7 ? 'reading' : 'thinking';
            break;
        }

        // Add natural pause after action
        action.pause = this.calculatePause(profile, actionType);

        return action;
    }

    /**
     * Calculate scroll duration based on distance and speed
     */
    static calculateScrollDuration(distance, speed) {
        const baseDuration = {
            slow: 8, // 8ms per pixel
            medium: 5, // 5ms per pixel
            fast: 3, // 3ms per pixel
            variable: 5 // Base rate for variable
        };

        let rate = baseDuration[speed] || baseDuration.medium;

        // Add natural variation
        if (speed === 'variable') {
            rate = this.randomBetween(3, 12);
        }

        // Longer scrolls are relatively faster (momentum effect)
        if (distance > 200) {
            rate *= 0.8;
        }

        return Math.max(100, distance * rate + this.randomBetween(-50, 50));
    }

    /**
     * Select appropriate easing function
     */
    static selectEasing(speed) {
        const easings = {
            slow: 'ease-out',
            medium: 'ease-in-out',
            fast: 'ease-in',
            variable: Math.random() < 0.5 ? 'ease-out' : 'ease-in-out'
        };

        return easings[speed] || 'ease-in-out';
    }

    /**
     * Calculate pause duration after action
     */
    static calculatePause(profile, actionType) {
        const basePause = {
            scroll: profile.pauseDuration.min * 0.3,
            backtrack: profile.pauseDuration.min * 0.5,
            pause: 0 // Already includes pause in duration
        };

        let pause = basePause[actionType] || 200;

        // Add frequency-based variation
        const frequencyMultiplier = {
            'very-high': 2.0,
            high: 1.5,
            medium: 1.0,
            low: 0.6
        };

        pause *= frequencyMultiplier[profile.pauseFrequency] || 1.0;

        // Add natural variation (±30%)
        const variation = (Math.random() - 0.5) * 0.6;
        pause *= (1 + variation);

        return Math.max(50, Math.floor(pause));
    }

    /**
     * Execute scroll pattern on page
     */
    static async executeScrollPattern(page, pattern) {
        console.log(`🎭 Executing ${pattern.profile} scroll pattern (${pattern.totalActions} actions)`);

        for (const action of pattern.actions) {
            switch (action.type) {
            case 'scroll':
                await this.executeScroll(page, action);
                break;
            case 'backtrack':
                await this.executeBacktrack(page, action);
                break;
            case 'pause':
                await this.executePause(page, action);
                break;
            }

            // Wait for natural pause between actions
            if (action.pause > 0) {
                await page.waitForTimeout(action.pause);
            }
        }

        console.log(`✅ Scroll pattern completed in ${pattern.estimatedDuration}ms`);
    }

    /**
     * Execute scroll action
     */
    static async executeScroll(page, action) {
        await page.evaluate(async({ distance, duration, easing }) => {
            const startY = window.pageYOffset;
            const targetY = startY + distance;
            const startTime = performance.now();

            const scroll = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                let easedProgress;
                switch (easing) {
                case 'ease-in':
                    easedProgress = progress * progress;
                    break;
                case 'ease-out':
                    easedProgress = 1 - Math.pow(1 - progress, 2);
                    break;
                case 'ease-in-out':
                    easedProgress = progress < 0.5
                        ? 2 * progress * progress
                        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                    break;
                default:
                    easedProgress = progress;
                }

                const currentY = startY + (distance * easedProgress);
                window.scrollTo(0, currentY);

                if (progress < 1) {
                    requestAnimationFrame(scroll);
                }
            };

            requestAnimationFrame(scroll);

            // Wait for scroll completion
            return new Promise(resolve => setTimeout(resolve, duration));
        }, action);
    }

    /**
     * Execute backtrack action
     */
    static async executeBacktrack(page, action) {
        await page.evaluate(async({ distance, duration }) => {
            const startY = window.pageYOffset;
            const targetY = Math.max(0, startY - distance);
            const startTime = performance.now();

            const scroll = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = 1 - Math.pow(1 - progress, 2); // ease-out for backtrack

                const currentY = startY - (distance * easedProgress);
                window.scrollTo(0, Math.max(0, currentY));

                if (progress < 1) {
                    requestAnimationFrame(scroll);
                }
            };

            requestAnimationFrame(scroll);
            return new Promise(resolve => setTimeout(resolve, duration));
        }, action);
    }

    /**
     * Execute pause action
     */
    static async executePause(page, action) {
        await page.waitForTimeout(action.duration);
    }

    /**
     * Utility function for random number between min and max
     */
    static randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }
}

module.exports = ScrollPatterns;
