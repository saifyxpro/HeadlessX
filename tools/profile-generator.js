#!/usr/bin/env node

/**
 * Profile Generator Tool
 * Advanced browser profile generation utility
 * HeadlessX v1.3.0 - Enhanced Anti-Detection
 */

const { program } = require('commander');
const chalk = require('chalk');
const Table = require('cli-table3');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Import HeadlessX services
const FingerprintManager = require('../src/config/fingerprints');

class ProfileGenerator {
    constructor() {
        this.fingerprintManager = new FingerprintManager();
        this.predefinedProfiles = this.initializePredefinedProfiles();
    }

    /**
     * Initialize predefined profile templates
     */
    initializePredefinedProfiles() {
        return {
            'windows-chrome-high-end': {
                platform: 'Win32',
                browser: 'chrome',
                version: '119.0.0.0',
                architecture: 'x64',
                quality: 'high-end',
                specs: {
                    cpu: { cores: 8, threads: 16, brand: 'Intel' },
                    memory: 16,
                    gpu: 'NVIDIA RTX 4080',
                    screen: { width: 2560, height: 1440, depth: 24 }
                }
            },
            'windows-chrome-medium': {
                platform: 'Win32',
                browser: 'chrome',
                version: '119.0.0.0',
                architecture: 'x64',
                quality: 'medium',
                specs: {
                    cpu: { cores: 4, threads: 8, brand: 'AMD' },
                    memory: 8,
                    gpu: 'AMD Radeon RX 6600',
                    screen: { width: 1920, height: 1080, depth: 24 }
                }
            },
            'windows-chrome-low-end': {
                platform: 'Win32',
                browser: 'chrome',
                version: '119.0.0.0',
                architecture: 'x64',
                quality: 'low-end',
                specs: {
                    cpu: { cores: 2, threads: 4, brand: 'Intel' },
                    memory: 4,
                    gpu: 'Intel UHD Graphics',
                    screen: { width: 1366, height: 768, depth: 24 }
                }
            },
            'mac-safari-high-end': {
                platform: 'MacIntel',
                browser: 'safari',
                version: '17.1',
                architecture: 'arm64',
                quality: 'high-end',
                specs: {
                    cpu: { cores: 10, threads: 10, brand: 'Apple M3' },
                    memory: 32,
                    gpu: 'Apple M3 GPU',
                    screen: { width: 3024, height: 1964, depth: 24 }
                }
            },
            'mac-safari-medium': {
                platform: 'MacIntel',
                browser: 'safari',
                version: '17.1',
                architecture: 'x64',
                quality: 'medium',
                specs: {
                    cpu: { cores: 8, threads: 8, brand: 'Apple M2' },
                    memory: 16,
                    gpu: 'Apple M2 GPU',
                    screen: { width: 2560, height: 1600, depth: 24 }
                }
            },
            'linux-firefox-high-end': {
                platform: 'Linux x86_64',
                browser: 'firefox',
                version: '119.0',
                architecture: 'x64',
                quality: 'high-end',
                specs: {
                    cpu: { cores: 12, threads: 24, brand: 'AMD' },
                    memory: 32,
                    gpu: 'NVIDIA RTX 4090',
                    screen: { width: 3840, height: 2160, depth: 24 }
                }
            },
            'linux-firefox-medium': {
                platform: 'Linux x86_64',
                browser: 'firefox',
                version: '119.0',
                architecture: 'x64',
                quality: 'medium',
                specs: {
                    cpu: { cores: 6, threads: 12, brand: 'AMD' },
                    memory: 16,
                    gpu: 'AMD Radeon RX 6700 XT',
                    screen: { width: 1920, height: 1080, depth: 24 }
                }
            },
            'mobile-android-chrome': {
                platform: 'Linux armv7l',
                browser: 'chrome',
                version: '119.0.0.0',
                architecture: 'arm',
                quality: 'mobile',
                mobile: true,
                specs: {
                    cpu: { cores: 8, threads: 8, brand: 'Snapdragon' },
                    memory: 8,
                    gpu: 'Adreno 730',
                    screen: { width: 1080, height: 2400, depth: 24, mobile: true }
                }
            },
            'mobile-ios-safari': {
                platform: 'iPhone',
                browser: 'safari',
                version: '17.1',
                architecture: 'arm64',
                quality: 'mobile',
                mobile: true,
                specs: {
                    cpu: { cores: 6, threads: 6, brand: 'Apple A17 Pro' },
                    memory: 8,
                    gpu: 'Apple A17 Pro GPU',
                    screen: { width: 1179, height: 2556, depth: 24, mobile: true }
                }
            }
        };
    }

    /**
     * Generate comprehensive profile
     */
    async generateProfile(options = {}) {
        try {
            const {
                baseProfile = 'random',
                customization = {},
                seed = null,
                output = null,
                format = 'json'
            } = options;

            console.log(chalk.blue(`🎭 Generating profile based on: ${baseProfile}`));

            // Generate base fingerprint
            const profileSeed = seed || Math.floor(Math.random() * 1000000);
            const fingerprint = await this.fingerprintManager.generateProfile(baseProfile, { seed: profileSeed });

            // Apply customizations
            const customizedProfile = await this.applyCustomizations(fingerprint, customization);

            // Add metadata
            customizedProfile.metadata = {
                generated: new Date().toISOString(),
                generator: 'HeadlessX Profile Generator v1.3.0',
                baseProfile,
                seed: profileSeed,
                customizations: Object.keys(customization)
            };

            // Display profile summary
            this.displayProfileSummary(customizedProfile);

            // Save if requested
            if (output) {
                await this.saveProfile(customizedProfile, output, format);
            }

            return customizedProfile;

        } catch (error) {
            console.error(chalk.red(`❌ Error generating profile: ${error.message}`));
            throw error;
        }
    }

    /**
     * Apply customizations to profile
     */
    async applyCustomizations(baseProfile, customization) {
        const profile = { ...baseProfile };

        // Hardware customizations
        if (customization.hardware) {
            if (customization.hardware.cpu) {
                profile.navigator = profile.navigator || {};
                profile.navigator.hardwareConcurrency = customization.hardware.cpu.cores || profile.navigator.hardwareConcurrency;
            }

            if (customization.hardware.memory) {
                profile.navigator = profile.navigator || {};
                profile.navigator.deviceMemory = customization.hardware.memory || profile.navigator.deviceMemory;
            }

            if (customization.hardware.gpu) {
                profile.webgl = profile.webgl || {};
                profile.webgl.renderer = customization.hardware.gpu.renderer || profile.webgl.renderer;
                profile.webgl.vendor = customization.hardware.gpu.vendor || profile.webgl.vendor;
            }
        }

        // Screen customizations
        if (customization.screen) {
            profile.screen = profile.screen || {};
            profile.screen.width = customization.screen.width || profile.screen.width;
            profile.screen.height = customization.screen.height || profile.screen.height;
            profile.screen.colorDepth = customization.screen.colorDepth || profile.screen.colorDepth;
            
            // Update viewport accordingly
            profile.viewport = profile.viewport || {};
            profile.viewport.width = Math.min(profile.screen.width - 100, profile.viewport.width || 1920);
            profile.viewport.height = Math.min(profile.screen.height - 200, profile.viewport.height || 1080);
        }

        // Network customizations
        if (customization.network) {
            profile.network = profile.network || {};
            if (customization.network.timezone) {
                profile.timezone = customization.network.timezone;
            }
            if (customization.network.locale) {
                profile.locale = customization.network.locale;
            }
            if (customization.network.languages) {
                profile.languages = customization.network.languages;
            }
        }

        // Browser customizations
        if (customization.browser) {
            if (customization.browser.version) {
                profile.version = customization.browser.version;
            }
            if (customization.browser.userAgent) {
                profile.userAgent = customization.browser.userAgent;
            }
            if (customization.browser.vendor) {
                profile.navigator = profile.navigator || {};
                profile.navigator.vendor = customization.browser.vendor;
            }
        }

        // Privacy customizations
        if (customization.privacy) {
            profile.privacy = profile.privacy || {};
            profile.privacy.doNotTrack = customization.privacy.doNotTrack;
            profile.privacy.cookiesEnabled = customization.privacy.cookiesEnabled;
            profile.privacy.webdriver = customization.privacy.webdriver === false ? false : true;
        }

        // Canvas customizations
        if (customization.canvas) {
            profile.canvas = profile.canvas || {};
            profile.canvas.noiseLevel = customization.canvas.noiseLevel || profile.canvas.noiseLevel;
            profile.canvas.seed = customization.canvas.seed || profile.canvas.seed;
        }

        // Audio customizations
        if (customization.audio) {
            profile.audio = profile.audio || {};
            profile.audio.sampleRate = customization.audio.sampleRate || profile.audio.sampleRate;
            profile.audio.noiseAmount = customization.audio.noiseAmount || profile.audio.noiseAmount;
        }

        return profile;
    }

    /**
     * Display profile summary
     */
    displayProfileSummary(profile) {
        console.log(chalk.green('\n✅ Profile Generated Successfully'));
        
        const table = new Table({
            head: [chalk.cyan('Property'), chalk.cyan('Value')],
            style: { head: ['cyan'] }
        });

        // Core properties
        table.push(
            ['Platform', profile.platform || 'auto'],
            ['Browser', profile.browser || 'auto'],
            ['Version', profile.version || 'auto'],
            ['User Agent', this.truncateString(profile.userAgent || 'auto', 60)],
            ['Viewport', `${profile.viewport?.width || 'auto'} x ${profile.viewport?.height || 'auto'}`],
            ['Screen', `${profile.screen?.width || 'auto'} x ${profile.screen?.height || 'auto'}`],
            ['Languages', Array.isArray(profile.languages) ? profile.languages.slice(0, 3).join(', ') : 'auto'],
            ['Timezone', profile.timezone || 'auto'],
            ['Hardware Concurrency', profile.navigator?.hardwareConcurrency || 'auto'],
            ['Device Memory', profile.navigator?.deviceMemory || 'auto']
        );

        console.log(table.toString());

        // Fingerprinting details
        if (profile.canvas || profile.webgl || profile.audio) {
            console.log(chalk.yellow('\n🎨 Fingerprinting Configuration:'));
            
            const fpTable = new Table({
                head: [chalk.cyan('Component'), chalk.cyan('Status'), chalk.cyan('Details')],
                style: { head: ['cyan'] }
            });

            if (profile.canvas) {
                fpTable.push([
                    'Canvas',
                    chalk.green('Enabled'),
                    `Noise: ${profile.canvas.noiseLevel || 'default'}, Seed: ${profile.canvas.seed || 'auto'}`
                ]);
            }

            if (profile.webgl) {
                fpTable.push([
                    'WebGL',
                    chalk.green('Enabled'),
                    `Renderer: ${this.truncateString(profile.webgl.renderer || 'auto', 30)}`
                ]);
            }

            if (profile.audio) {
                fpTable.push([
                    'Audio',
                    chalk.green('Enabled'),
                    `Sample Rate: ${profile.audio.sampleRate || 'auto'}, Noise: ${profile.audio.noiseAmount || 'default'}`
                ]);
            }

            console.log(fpTable.toString());
        }
    }

    /**
     * Generate batch of profiles
     */
    async generateBatch(options = {}) {
        try {
            const {
                count = 10,
                baseProfiles = ['random'],
                outputDir = './profiles',
                namePrefix = 'profile',
                format = 'json'
            } = options;

            console.log(chalk.blue(`📦 Generating batch of ${count} profiles...`));

            // Ensure output directory exists
            await fs.mkdir(outputDir, { recursive: true });

            const profiles = [];
            const availableProfiles = Object.keys(this.predefinedProfiles);
            
            for (let i = 0; i < count; i++) {
                // Select base profile
                const baseProfile = baseProfiles.includes('random') 
                    ? availableProfiles[Math.floor(Math.random() * availableProfiles.length)]
                    : baseProfiles[i % baseProfiles.length];

                // Generate unique seed
                const seed = crypto.randomInt(1000000);
                
                console.log(chalk.gray(`  Generating profile ${i + 1}/${count} (${baseProfile})...`));

                const profile = await this.generateProfile({
                    baseProfile,
                    seed,
                    output: null // Don't save individually
                });

                // Add to batch
                profiles.push({
                    id: `${namePrefix}-${i + 1}`,
                    profile
                });

                // Save individual profile
                const filename = `${namePrefix}-${i + 1}.${format}`;
                const filepath = path.join(outputDir, filename);
                await this.saveProfile(profile, filepath, format);
            }

            // Create batch manifest
            const manifest = {
                generated: new Date().toISOString(),
                count: profiles.length,
                baseProfiles,
                profiles: profiles.map(p => ({
                    id: p.id,
                    baseProfile: p.profile.metadata.baseProfile,
                    seed: p.profile.metadata.seed,
                    platform: p.profile.platform,
                    browser: p.profile.browser
                }))
            };

            const manifestPath = path.join(outputDir, 'manifest.json');
            await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

            console.log(chalk.green(`\n✅ Batch generation complete!`));
            console.log(chalk.gray(`  Profiles: ${profiles.length}`));
            console.log(chalk.gray(`  Output: ${outputDir}`));
            console.log(chalk.gray(`  Manifest: ${manifestPath}`));

            return { profiles, manifest, outputDir };

        } catch (error) {
            console.error(chalk.red(`❌ Error generating batch: ${error.message}`));
            throw error;
        }
    }

    /**
     * Save profile to file
     */
    async saveProfile(profile, filepath, format = 'json') {
        try {
            let content;
            
            switch (format.toLowerCase()) {
                case 'json':
                    content = JSON.stringify(profile, null, 2);
                    break;
                case 'yaml':
                case 'yml':
                    // Would need yaml dependency
                    content = JSON.stringify(profile, null, 2);
                    console.warn(chalk.yellow('⚠️  YAML format not implemented, using JSON'));
                    break;
                case 'csv':
                    content = this.profileToCSV(profile);
                    break;
                default:
                    throw new Error(`Unsupported format: ${format}`);
            }

            await fs.writeFile(filepath, content, 'utf8');
            console.log(chalk.green(`💾 Profile saved: ${filepath}`));

        } catch (error) {
            console.error(chalk.red(`❌ Error saving profile: ${error.message}`));
            throw error;
        }
    }

    /**
     * Convert profile to CSV format
     */
    profileToCSV(profile) {
        const headers = [
            'platform', 'browser', 'version', 'userAgent', 'viewport_width', 'viewport_height',
            'screen_width', 'screen_height', 'languages', 'timezone', 'hardwareConcurrency',
            'deviceMemory', 'canvas_noise', 'webgl_renderer', 'audio_sampleRate', 'seed'
        ];

        const values = [
            profile.platform || '',
            profile.browser || '',
            profile.version || '',
            `"${(profile.userAgent || '').replace(/"/g, '""')}"`,
            profile.viewport?.width || '',
            profile.viewport?.height || '',
            profile.screen?.width || '',
            profile.screen?.height || '',
            `"${Array.isArray(profile.languages) ? profile.languages.join(';') : ''}"`,
            profile.timezone || '',
            profile.navigator?.hardwareConcurrency || '',
            profile.navigator?.deviceMemory || '',
            profile.canvas?.noiseLevel || '',
            `"${(profile.webgl?.renderer || '').replace(/"/g, '""')}"`,
            profile.audio?.sampleRate || '',
            profile.metadata?.seed || ''
        ];

        return headers.join(',') + '\n' + values.join(',');
    }

    /**
     * List available predefined profiles
     */
    listPredefinedProfiles() {
        console.log(chalk.blue('📋 Available Predefined Profiles:'));
        
        const table = new Table({
            head: [chalk.cyan('Profile'), chalk.cyan('Platform'), chalk.cyan('Browser'), chalk.cyan('Quality'), chalk.cyan('Mobile')],
            style: { head: ['cyan'] }
        });

        Object.entries(this.predefinedProfiles).forEach(([key, profile]) => {
            table.push([
                key,
                profile.platform,
                `${profile.browser} ${profile.version}`,
                profile.quality,
                profile.mobile ? chalk.green('Yes') : chalk.gray('No')
            ]);
        });

        console.log(table.toString());
        console.log(chalk.gray(`\nTotal: ${Object.keys(this.predefinedProfiles).length} profiles`));
    }

    /**
     * Validate profile
     */
    validateProfile(profile) {
        const errors = [];
        const warnings = [];

        // Required fields
        if (!profile.userAgent) errors.push('Missing userAgent');
        if (!profile.platform) errors.push('Missing platform');
        if (!profile.viewport) warnings.push('Missing viewport configuration');

        // Consistency checks
        if (profile.platform && profile.userAgent) {
            if (profile.platform.includes('Win') && !profile.userAgent.includes('Windows')) {
                warnings.push('Platform/UserAgent mismatch: Windows platform but no Windows in userAgent');
            }
            if (profile.platform.includes('Mac') && !profile.userAgent.includes('Mac')) {
                warnings.push('Platform/UserAgent mismatch: Mac platform but no Mac in userAgent');
            }
            if (profile.platform.includes('Linux') && !profile.userAgent.includes('Linux')) {
                warnings.push('Platform/UserAgent mismatch: Linux platform but no Linux in userAgent');
            }
        }

        // Hardware consistency
        if (profile.navigator?.hardwareConcurrency && profile.navigator.hardwareConcurrency > 32) {
            warnings.push('Unusually high hardware concurrency (>32 cores)');
        }

        if (profile.navigator?.deviceMemory && profile.navigator.deviceMemory > 64) {
            warnings.push('Unusually high device memory (>64GB)');
        }

        // Screen resolution consistency
        if (profile.screen && profile.viewport) {
            if (profile.viewport.width > profile.screen.width) {
                errors.push('Viewport width cannot be larger than screen width');
            }
            if (profile.viewport.height > profile.screen.height) {
                errors.push('Viewport height cannot be larger than screen height');
            }
        }

        return { errors, warnings, valid: errors.length === 0 };
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
    .name('profile-generator')
    .description('HeadlessX Profile Generator Tool')
    .version('1.3.0');

// Generate single profile command
program
    .command('generate')
    .description('Generate a single browser profile')
    .option('-p, --profile <profile>', 'Base profile to use', 'random')
    .option('-s, --seed <seed>', 'Seed for generation')
    .option('-o, --output <file>', 'Output file path')
    .option('-f, --format <format>', 'Output format (json, csv)', 'json')
    .option('-c, --config <file>', 'Customization config file')
    .action(async (options) => {
        const generator = new ProfileGenerator();
        try {
            let customization = {};
            
            if (options.config) {
                const configData = await fs.readFile(options.config, 'utf8');
                customization = JSON.parse(configData);
            }

            await generator.generateProfile({
                baseProfile: options.profile,
                seed: options.seed ? parseInt(options.seed) : null,
                output: options.output,
                format: options.format,
                customization
            });
            
        } catch (error) {
            console.error(chalk.red(`❌ Command failed: ${error.message}`));
            process.exit(1);
        }
    });

// Generate batch command
program
    .command('batch')
    .description('Generate multiple profiles at once')
    .option('-c, --count <count>', 'Number of profiles to generate', '10')
    .option('-p, --profiles <profiles>', 'Comma-separated base profiles', 'random')
    .option('-o, --output <dir>', 'Output directory', './profiles')
    .option('-n, --name <prefix>', 'Name prefix for profiles', 'profile')
    .option('-f, --format <format>', 'Output format (json, csv)', 'json')
    .action(async (options) => {
        const generator = new ProfileGenerator();
        try {
            const baseProfiles = options.profiles.split(',').map(p => p.trim());
            
            await generator.generateBatch({
                count: parseInt(options.count),
                baseProfiles,
                outputDir: options.output,
                namePrefix: options.name,
                format: options.format
            });
            
        } catch (error) {
            console.error(chalk.red(`❌ Command failed: ${error.message}`));
            process.exit(1);
        }
    });

// List profiles command
program
    .command('list')
    .description('List all available predefined profiles')
    .action(() => {
        const generator = new ProfileGenerator();
        generator.listPredefinedProfiles();
    });

// Validate profile command
program
    .command('validate')
    .description('Validate a profile file')
    .argument('<file>', 'Profile file to validate')
    .action(async (file) => {
        const generator = new ProfileGenerator();
        try {
            const data = await fs.readFile(file, 'utf8');
            const profile = JSON.parse(data);
            
            const validation = generator.validateProfile(profile);
            
            console.log(chalk.blue(`🔍 Validating profile: ${file}`));
            
            if (validation.valid) {
                console.log(chalk.green('✅ Profile is valid'));
            } else {
                console.log(chalk.red(`❌ Profile has ${validation.errors.length} errors`));
                validation.errors.forEach(error => {
                    console.log(chalk.red(`  • ${error}`));
                });
            }
            
            if (validation.warnings.length > 0) {
                console.log(chalk.yellow(`⚠️  ${validation.warnings.length} warnings:`));
                validation.warnings.forEach(warning => {
                    console.log(chalk.yellow(`  • ${warning}`));
                });
            }
            
            process.exit(validation.valid ? 0 : 1);
            
        } catch (error) {
            console.error(chalk.red(`❌ Command failed: ${error.message}`));
            process.exit(1);
        }
    });

// Parse CLI arguments
if (require.main === module) {
    program.parse();
}

module.exports = ProfileGenerator;