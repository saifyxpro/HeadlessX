c#!/usr/bin/env node

/**
 * Fingerprint Testing Tool
 * Advanced fingerprint generation and testing utility
 * HeadlessX v1.3.0 - Enhanced Anti-Detection
 */

const { program } = require('commander');
const chalk = require('chalk');
const Table = require('cli-table3');
const fs = require('fs').promises;
const path = require('path');

// Import HeadlessX services
const FingerprintManager = require('../src/config/fingerprints');
const BrowserService = require('../src/services/browser');
const CanvasFingerprint = require('../src/services/fingerprinting/canvas');
const WebGLFingerprint = require('../src/services/fingerprinting/webgl');
const AudioFingerprint = require('../src/services/fingerprinting/audio');
const FontSpoofing = require('../src/services/fingerprinting/font-spoofing');
const MediaDevices = require('../src/services/fingerprinting/media-devices');
const ClientRects = require('../src/services/fingerprinting/client-rects');
const SpeechSynthesis = require('../src/services/fingerprinting/speech-synthesis');
const NavigatorProps = require('../src/services/fingerprinting/navigator-props');

class FingerprintTester {
    constructor() {
        this.fingerprintManager = new FingerprintManager();
        this.browserService = BrowserService;
        this.services = {
            canvas: new CanvasFingerprint(),
            webgl: new WebGLFingerprint(),
            audio: new AudioFingerprint(),
            fonts: new FontSpoofing(),
            mediaDevices: new MediaDevices(),
            clientRects: new ClientRects(),
            speechSynthesis: new SpeechSynthesis(),
            navigatorProps: new NavigatorProps()
        };
    }

    /**
     * Initialize browser service
     */
    async initialize() {
        console.log(chalk.blue('🚀 Initializing browser service...'));
        await this.browserService.initialize();
        console.log(chalk.green('✅ Browser service ready'));
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        console.log(chalk.blue('🧹 Cleaning up...'));
        await this.browserService.cleanup();
        console.log(chalk.green('✅ Cleanup complete'));
    }

    /**
     * Generate and display fingerprint
     */
    async generateFingerprint(profile, options = {}) {
        try {
            console.log(chalk.blue(`🎭 Generating fingerprint for profile: ${profile}`));
            
            const fingerprint = await this.fingerprintManager.generateProfile(profile, options);
            
            const table = new Table({
                head: [chalk.cyan('Property'), chalk.cyan('Value')],
                style: { head: ['cyan'] }
            });

            // Display core fingerprint data
            table.push(
                ['Profile', fingerprint.profile || profile],
                ['Seed', fingerprint.seed || 'auto'],
                ['Platform', fingerprint.platform || 'unknown'],
                ['Browser', fingerprint.browser || 'unknown'],
                ['Version', fingerprint.version || 'unknown'],
                ['User Agent', this.truncateString(fingerprint.userAgent || 'unknown', 80)],
                ['Viewport', `${fingerprint.viewport?.width || 'auto'} x ${fingerprint.viewport?.height || 'auto'}`],
                ['Languages', Array.isArray(fingerprint.languages) ? fingerprint.languages.join(', ') : 'unknown'],
                ['Timezone', fingerprint.timezone || 'auto']
            );

            console.log('\n' + table.toString());

            // Display advanced fingerprinting details
            if (options.verbose) {
                await this.displayAdvancedFingerprint(fingerprint);
            }

            return fingerprint;

        } catch (error) {
            console.error(chalk.red(`❌ Error generating fingerprint: ${error.message}`));
            throw error;
        }
    }

    /**
     * Display advanced fingerprinting details
     */
    async displayAdvancedFingerprint(fingerprint) {
        console.log(chalk.yellow('\n📊 Advanced Fingerprinting Details:'));

        // Canvas fingerprinting
        if (fingerprint.canvas) {
            const canvasTable = new Table({
                head: [chalk.cyan('Canvas Property'), chalk.cyan('Value')],
                style: { head: ['cyan'] }
            });
            
            canvasTable.push(
                ['Noise Level', fingerprint.canvas.noiseLevel || 'default'],
                ['Seed', fingerprint.canvas.seed || 'auto'],
                ['Font Rendering', fingerprint.canvas.fontRendering || 'default']
            );
            
            console.log('\n🎨 Canvas Fingerprinting:');
            console.log(canvasTable.toString());
        }

        // WebGL fingerprinting
        if (fingerprint.webgl) {
            const webglTable = new Table({
                head: [chalk.cyan('WebGL Property'), chalk.cyan('Value')],
                style: { head: ['cyan'] }
            });
            
            webglTable.push(
                ['Vendor', fingerprint.webgl.vendor || 'auto'],
                ['Renderer', fingerprint.webgl.renderer || 'auto'],
                ['Version', fingerprint.webgl.version || 'auto'],
                ['Extensions Count', Array.isArray(fingerprint.webgl.extensions) ? fingerprint.webgl.extensions.length : 'auto']
            );
            
            console.log('\n🌐 WebGL Fingerprinting:');
            console.log(webglTable.toString());
        }

        // Audio fingerprinting
        if (fingerprint.audio) {
            const audioTable = new Table({
                head: [chalk.cyan('Audio Property'), chalk.cyan('Value')],
                style: { head: ['cyan'] }
            });
            
            audioTable.push(
                ['Sample Rate', fingerprint.audio.sampleRate || 'auto'],
                ['Max Channel Count', fingerprint.audio.maxChannelCount || 'auto'],
                ['Noise Amount', fingerprint.audio.noiseAmount || 'default']
            );
            
            console.log('\n🎵 Audio Fingerprinting:');
            console.log(audioTable.toString());
        }

        // Navigator properties
        if (fingerprint.navigator) {
            const navTable = new Table({
                head: [chalk.cyan('Navigator Property'), chalk.cyan('Value')],
                style: { head: ['cyan'] }
            });
            
            navTable.push(
                ['Hardware Concurrency', fingerprint.navigator.hardwareConcurrency || 'auto'],
                ['Device Memory', fingerprint.navigator.deviceMemory || 'auto'],
                ['Max Touch Points', fingerprint.navigator.maxTouchPoints || 'auto'],
                ['Vendor', fingerprint.navigator.vendor || 'auto']
            );
            
            console.log('\n🧭 Navigator Properties:');
            console.log(navTable.toString());
        }
    }

    /**
     * Test fingerprint consistency
     */
    async testConsistency(profile, iterations = 3) {
        try {
            console.log(chalk.blue(`🔄 Testing fingerprint consistency for ${profile} (${iterations} iterations)...`));
            
            const fingerprints = [];
            const seed = Math.floor(Math.random() * 1000000);
            
            for (let i = 0; i < iterations; i++) {
                const fingerprint = await this.fingerprintManager.generateProfile(profile, { seed });
                fingerprints.push(fingerprint);
                console.log(chalk.gray(`  Generated fingerprint ${i + 1}/${iterations}`));
            }

            // Check consistency
            const consistent = this.checkFingerprintConsistency(fingerprints);
            
            if (consistent) {
                console.log(chalk.green(`✅ Fingerprint consistency test PASSED`));
            } else {
                console.log(chalk.red(`❌ Fingerprint consistency test FAILED`));
            }

            return consistent;

        } catch (error) {
            console.error(chalk.red(`❌ Error testing consistency: ${error.message}`));
            return false;
        }
    }

    /**
     * Check fingerprint consistency
     */
    checkFingerprintConsistency(fingerprints) {
        if (fingerprints.length < 2) return true;
        
        const first = fingerprints[0];
        
        for (let i = 1; i < fingerprints.length; i++) {
            const current = fingerprints[i];
            
            // Check critical consistency fields
            if (first.userAgent !== current.userAgent) {
                console.log(chalk.red(`  ❌ User Agent mismatch: "${first.userAgent}" vs "${current.userAgent}"`));
                return false;
            }
            
            if (first.platform !== current.platform) {
                console.log(chalk.red(`  ❌ Platform mismatch: "${first.platform}" vs "${current.platform}"`));
                return false;
            }
            
            if (JSON.stringify(first.viewport) !== JSON.stringify(current.viewport)) {
                console.log(chalk.red(`  ❌ Viewport mismatch`));
                return false;
            }
        }
        
        console.log(chalk.green(`  ✅ All ${fingerprints.length} fingerprints are consistent`));
        return true;
    }

    /**
     * Test fingerprint in browser
     */
    async testInBrowser(profile, url = 'https://httpbin.org/headers', options = {}) {
        try {
            console.log(chalk.blue(`🌐 Testing fingerprint in browser...`));
            console.log(chalk.gray(`  Profile: ${profile}`));
            console.log(chalk.gray(`  URL: ${url}`));

            // Generate fingerprint
            const fingerprint = await this.fingerprintManager.generateProfile(profile, options);
            
            // Create browser context with fingerprint
            const context = await this.browserService.createContext({
                fingerprint,
                stealth: options.stealth || 'advanced'
            });

            const page = await context.newPage();

            // Apply all fingerprinting services
            await this.applyAllFingerprinting(page, fingerprint);

            // Navigate and test
            const response = await page.goto(url, { 
                waitUntil: 'networkidle',
                timeout: 30000 
            });

            // Collect browser data
            const browserData = await page.evaluate(() => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                ctx.textBaseline = 'top';
                ctx.font = '14px Arial';
                ctx.fillText('Fingerprint test', 2, 2);

                return {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    languages: navigator.languages,
                    hardwareConcurrency: navigator.hardwareConcurrency,
                    deviceMemory: navigator.deviceMemory,
                    maxTouchPoints: navigator.maxTouchPoints,
                    canvasFingerprint: canvas.toDataURL().substring(0, 50) + '...',
                    webdriver: navigator.webdriver,
                    chrome: !!window.chrome,
                    permissions: !!navigator.permissions,
                    plugins: navigator.plugins.length,
                    cookieEnabled: navigator.cookieEnabled,
                    doNotTrack: navigator.doNotTrack,
                    windowSize: {
                        innerWidth: window.innerWidth,
                        innerHeight: window.innerHeight,
                        outerWidth: window.outerWidth,
                        outerHeight: window.outerHeight
                    }
                };
            });

            // Display results
            this.displayBrowserTestResults(browserData, response, fingerprint);

            await page.close();
            await context.close();

            return browserData;

        } catch (error) {
            console.error(chalk.red(`❌ Browser test failed: ${error.message}`));
            throw error;
        }
    }

    /**
     * Apply all fingerprinting services
     */
    async applyAllFingerprinting(page, fingerprint) {
        const services = Object.keys(this.services);
        
        for (const serviceName of services) {
            try {
                await this.services[serviceName].apply(page, fingerprint);
                console.log(chalk.gray(`  ✓ Applied ${serviceName} fingerprinting`));
            } catch (error) {
                console.warn(chalk.yellow(`  ⚠️  Warning: Failed to apply ${serviceName}: ${error.message}`));
            }
        }
    }

    /**
     * Display browser test results
     */
    displayBrowserTestResults(browserData, response, fingerprint) {
        console.log(chalk.green('\n✅ Browser Test Results:'));
        
        const table = new Table({
            head: [chalk.cyan('Property'), chalk.cyan('Expected'), chalk.cyan('Actual'), chalk.cyan('Match')],
            style: { head: ['cyan'] }
        });

        // Compare key properties
        const comparisons = [
            ['User Agent', fingerprint.userAgent, browserData.userAgent],
            ['Platform', fingerprint.platform, browserData.platform],
            ['Languages', JSON.stringify(fingerprint.languages), JSON.stringify(browserData.languages)],
            ['Hardware Concurrency', fingerprint.navigator?.hardwareConcurrency, browserData.hardwareConcurrency],
            ['Device Memory', fingerprint.navigator?.deviceMemory, browserData.deviceMemory],
            ['Max Touch Points', fingerprint.navigator?.maxTouchPoints, browserData.maxTouchPoints]
        ];

        comparisons.forEach(([prop, expected, actual]) => {
            const match = String(expected) === String(actual);
            const matchIcon = match ? chalk.green('✓') : chalk.red('✗');
            const expectedStr = this.truncateString(String(expected || 'auto'), 30);
            const actualStr = this.truncateString(String(actual || 'unknown'), 30);
            
            table.push([prop, expectedStr, actualStr, matchIcon]);
        });

        console.log(table.toString());

        // Display detection results
        console.log(chalk.yellow('\n🕵️  Detection Results:'));
        const detectionTable = new Table({
            head: [chalk.cyan('Check'), chalk.cyan('Result'), chalk.cyan('Status')],
            style: { head: ['cyan'] }
        });

        const detectionChecks = [
            ['WebDriver Property', browserData.webdriver, !browserData.webdriver],
            ['Chrome Object', browserData.chrome, browserData.chrome],
            ['Permissions API', browserData.permissions, browserData.permissions],
            ['Plugin Count', browserData.plugins, browserData.plugins > 0],
            ['Cookie Enabled', browserData.cookieEnabled, browserData.cookieEnabled]
        ];

        detectionChecks.forEach(([check, result, passed]) => {
            const status = passed ? chalk.green('PASS') : chalk.red('FAIL');
            detectionTable.push([check, String(result), status]);
        });

        console.log(detectionTable.toString());

        // Display response info
        console.log(chalk.blue('\n📡 Response Information:'));
        console.log(`  Status: ${response.status()}`);
        console.log(`  URL: ${response.url()}`);
        console.log(`  Headers: ${Object.keys(response.headers()).length} headers`);
    }

    /**
     * Compare multiple profiles
     */
    async compareProfiles(profiles, options = {}) {
        try {
            console.log(chalk.blue(`🔍 Comparing ${profiles.length} profiles...`));
            
            const results = [];
            
            for (const profile of profiles) {
                console.log(chalk.gray(`  Generating fingerprint for ${profile}...`));
                const fingerprint = await this.fingerprintManager.generateProfile(profile, options);
                results.push({ profile, fingerprint });
            }

            // Create comparison table
            const table = new Table({
                head: [chalk.cyan('Property'), ...profiles.map(p => chalk.cyan(p))],
                style: { head: ['cyan'] }
            });

            const properties = [
                'platform',
                'browser',
                'version',
                'userAgent'
            ];

            properties.forEach(prop => {
                const row = [prop];
                results.forEach(result => {
                    const value = result.fingerprint[prop] || 'unknown';
                    row.push(this.truncateString(String(value), 25));
                });
                table.push(row);
            });

            console.log('\n' + table.toString());

            // Check for uniqueness
            const userAgents = results.map(r => r.fingerprint.userAgent);
            const uniqueUserAgents = new Set(userAgents);
            
            if (uniqueUserAgents.size === profiles.length) {
                console.log(chalk.green(`✅ All ${profiles.length} profiles have unique user agents`));
            } else {
                console.log(chalk.red(`❌ Warning: Only ${uniqueUserAgents.size}/${profiles.length} unique user agents`));
            }

            return results;

        } catch (error) {
            console.error(chalk.red(`❌ Error comparing profiles: ${error.message}`));
            throw error;
        }
    }

    /**
     * Save fingerprint to file
     */
    async saveFingerprintToFile(fingerprint, filename) {
        try {
            const filepath = path.resolve(filename);
            await fs.writeFile(filepath, JSON.stringify(fingerprint, null, 2), 'utf8');
            console.log(chalk.green(`💾 Fingerprint saved to ${filepath}`));
        } catch (error) {
            console.error(chalk.red(`❌ Error saving fingerprint: ${error.message}`));
            throw error;
        }
    }

    /**
     * Load fingerprint from file
     */
    async loadFingerprintFromFile(filename) {
        try {
            const filepath = path.resolve(filename);
            const data = await fs.readFile(filepath, 'utf8');
            const fingerprint = JSON.parse(data);
            console.log(chalk.green(`📂 Fingerprint loaded from ${filepath}`));
            return fingerprint;
        } catch (error) {
            console.error(chalk.red(`❌ Error loading fingerprint: ${error.message}`));
            throw error;
        }
    }

    /**
     * Truncate string for display
     */
    truncateString(str, maxLength) {
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength - 3) + '...';
    }
}

// CLI Configuration
program
    .name('fingerprint-tester')
    .description('HeadlessX Fingerprint Testing Tool')
    .version('1.3.0');

// Generate fingerprint command
program
    .command('generate')
    .description('Generate a fingerprint for a profile')
    .argument('<profile>', 'Profile name to generate fingerprint for')
    .option('-v, --verbose', 'Show detailed fingerprint information')
    .option('-s, --seed <seed>', 'Use specific seed for generation')
    .option('-o, --output <file>', 'Save fingerprint to file')
    .action(async (profile, options) => {
        const tester = new FingerprintTester();
        try {
            await tester.initialize();
            
            const generateOptions = {};
            if (options.seed) generateOptions.seed = parseInt(options.seed);
            if (options.verbose) generateOptions.verbose = true;
            
            const fingerprint = await tester.generateFingerprint(profile, generateOptions);
            
            if (options.output) {
                await tester.saveFingerprintToFile(fingerprint, options.output);
            }
            
        } catch (error) {
            console.error(chalk.red(`❌ Command failed: ${error.message}`));
            process.exit(1);
        } finally {
            await tester.cleanup();
        }
    });

// Test consistency command
program
    .command('test-consistency')
    .description('Test fingerprint consistency across multiple generations')
    .argument('<profile>', 'Profile name to test')
    .option('-i, --iterations <count>', 'Number of test iterations', '5')
    .action(async (profile, options) => {
        const tester = new FingerprintTester();
        try {
            await tester.initialize();
            const iterations = parseInt(options.iterations);
            const consistent = await tester.testConsistency(profile, iterations);
            process.exit(consistent ? 0 : 1);
        } catch (error) {
            console.error(chalk.red(`❌ Command failed: ${error.message}`));
            process.exit(1);
        } finally {
            await tester.cleanup();
        }
    });

// Test in browser command
program
    .command('test-browser')
    .description('Test fingerprint in real browser environment')
    .argument('<profile>', 'Profile name to test')
    .option('-u, --url <url>', 'URL to test against', 'https://httpbin.org/headers')
    .option('-s, --stealth <mode>', 'Stealth mode (basic, advanced)', 'advanced')
    .action(async (profile, options) => {
        const tester = new FingerprintTester();
        try {
            await tester.initialize();
            await tester.testInBrowser(profile, options.url, {
                stealth: options.stealth
            });
        } catch (error) {
            console.error(chalk.red(`❌ Command failed: ${error.message}`));
            process.exit(1);
        } finally {
            await tester.cleanup();
        }
    });

// Compare profiles command
program
    .command('compare')
    .description('Compare multiple fingerprint profiles')
    .argument('<profiles...>', 'Profile names to compare')
    .option('-s, --seed <seed>', 'Use specific seed for all profiles')
    .action(async (profiles, options) => {
        const tester = new FingerprintTester();
        try {
            await tester.initialize();
            
            const compareOptions = {};
            if (options.seed) compareOptions.seed = parseInt(options.seed);
            
            await tester.compareProfiles(profiles, compareOptions);
        } catch (error) {
            console.error(chalk.red(`❌ Command failed: ${error.message}`));
            process.exit(1);
        } finally {
            await tester.cleanup();
        }
    });

// List profiles command
program
    .command('list-profiles')
    .description('List all available fingerprint profiles')
    .action(async () => {
        const tester = new FingerprintTester();
        try {
            const profiles = await tester.fingerprintManager.getAvailableProfiles();
            
            console.log(chalk.blue('📋 Available Fingerprint Profiles:'));
            
            const table = new Table({
                head: [chalk.cyan('Profile'), chalk.cyan('Platform'), chalk.cyan('Browser'), chalk.cyan('Quality')],
                style: { head: ['cyan'] }
            });

            Object.entries(profiles).forEach(([key, profile]) => {
                table.push([
                    key,
                    profile.platform || 'auto',
                    profile.browser || 'auto',
                    profile.quality || 'medium'
                ]);
            });

            console.log(table.toString());
            
        } catch (error) {
            console.error(chalk.red(`❌ Command failed: ${error.message}`));
            process.exit(1);
        } finally {
            await tester.cleanup();
        }
    });

// Parse CLI arguments
if (require.main === module) {
    program.parse();
}

module.exports = FingerprintTester;