#!/usr/bin/env node

/**
 * HeadlessX v1.3.0 - Detection Checker Tool
 * Tests fingerprint profiles against major bot detection services
 */

const axios = require('axios');
const chalk = require('chalk');
const Table = require('cli-table3');
const { Command } = require('commander');

const program = new Command();

// Bot detection services to test against
const DETECTION_SERVICES = {
    'bot.sannysoft.com': {
        url: 'https://bot.sannysoft.com',
        checks: [
            'webdriver detection',
            'chrome detection',
            'navigator.permissions',
            'navigator.plugins',
            'navigator.languages',
            'navigator.webdriver',
            'window.chrome',
            'navigator.connectionRapi'
        ]
    },
    'abrahamjuliot.github.io': {
        url: 'https://abrahamjuliot.github.io/creepjs',
        checks: [
            'canvas fingerprint',
            'webgl fingerprint',
            'audio context',
            'client rects',
            'fonts enumeration',
            'timezone detection'
        ]
    },
    'fingerprintjs.com': {
        url: 'https://fingerprintjs.com/demo',
        checks: [
            'visitor id consistency',
            'browser fingerprint',
            'device fingerprint',
            'incognito detection',
            'bot detection'
        ]
    },
    'intoli.com': {
        url: 'https://intoli.com/blog/not-possible-to-block-chrome-headless/chrome-headless-test.html',
        checks: [
            'headless chrome detection',
            'webdriver detection',
            'navigator properties',
            'user agent consistency',
            'viewport detection'
        ]
    }
};

class DetectionChecker {
    constructor(options = {}) {
        this.headlessXUrl = options.url || 'http://localhost:3000';
        this.timeout = options.timeout || 30000;
        this.verbose = options.verbose || false;
        this.profile = options.profile || 'windows-chrome-high-end';
    }

    /**
     * Run comprehensive bot detection tests
     */
    async runTests() {
        console.log(chalk.blue.bold('🔍 HeadlessX Detection Checker v1.3.0\n'));
        
        const results = {};
        const table = new Table({
            head: ['Service', 'Status', 'Score', 'Issues Found', 'Details'],
            colWidths: [25, 10, 8, 15, 40]
        });

        for (const [serviceName, service] of Object.entries(DETECTION_SERVICES)) {
            try {
                console.log(chalk.yellow(`Testing ${serviceName}...`));
                
                const result = await this.testService(serviceName, service);
                results[serviceName] = result;
                
                const statusColor = result.passed ? chalk.green : chalk.red;
                const status = result.passed ? '✅ PASS' : '❌ FAIL';
                
                table.push([
                    serviceName,
                    statusColor(status),
                    `${result.score}/100`,
                    result.issues.length,
                    result.summary
                ]);

                if (this.verbose && result.issues.length > 0) {
                    console.log(chalk.red('  Issues found:'));
                    result.issues.forEach(issue => {
                        console.log(chalk.red(`    - ${issue}`));
                    });
                }
            } catch (error) {
                console.error(chalk.red(`❌ Error testing ${serviceName}: ${error.message}`));
                
                table.push([
                    serviceName,
                    chalk.red('❌ ERROR'),
                    'N/A',
                    'N/A',
                    error.message
                ]);
            }
        }

        console.log('\n' + table.toString());
        
        const overallScore = this.calculateOverallScore(results);
        console.log(chalk.blue.bold(`\n🎯 Overall Detection Score: ${overallScore}/100`));
        
        if (overallScore >= 90) {
            console.log(chalk.green.bold('🚀 Excellent! Very low detection risk.'));
        } else if (overallScore >= 75) {
            console.log(chalk.yellow.bold('⚠️  Good, but some improvements needed.'));
        } else {
            console.log(chalk.red.bold('🚨 High detection risk! Review configuration.'));
        }

        return results;
    }

    /**
     * Test a specific detection service
     */
    async testService(serviceName, service) {
        const startTime = Date.now();
        
        try {
            // Use HeadlessX to visit the detection service
            const response = await axios.post(`${this.headlessXUrl}/api/render`, {
                url: service.url,
                profile: this.profile,
                stealthMode: 'maximum',
                waitForSelector: 'body',
                timeout: this.timeout,
                extractContent: true
            }, {
                timeout: this.timeout,
                headers: {
                    Authorization: process.env.AUTH_TOKEN || '',
                    'Content-Type': 'application/json'
                }
            });

            const responseTime = Date.now() - startTime;
            
            if (!response.data.success) {
                throw new Error(response.data.error || 'Unknown error');
            }

            // Analyze the response for detection indicators
            const analysis = await this.analyzeResponse(serviceName, response.data.content, response.data.html);
            
            return {
                passed: analysis.score >= 75,
                score: analysis.score,
                issues: analysis.issues,
                summary: analysis.summary,
                responseTime,
                details: analysis.details
            };
        } catch (error) {
            throw new Error(`Service test failed: ${error.message}`);
        }
    }

    /**
     * Generate summary based on score and issues
     */
    generateSummary(score, issueCount) {
        if (score >= 95 && issueCount === 0) {
            return 'Perfect stealth';
        } else if (score >= 85) {
            return 'Very good stealth';
        } else if (score >= 70) {
            return 'Good stealth';
        } else if (score >= 50) {
            return 'Moderate detection risk';
        } else {
            return 'High detection risk';
        }
    }

    /**
     * Calculate overall score from all service results
     */
    calculateOverallScore(results) {
        const scores = Object.values(results)
            .filter(result => typeof result.score === 'number')
            .map(result => result.score);
        
        if (scores.length === 0) return 0;
        
        return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    }
}

// CLI Interface
program
    .name('detection-checker')
    .description('Test HeadlessX against bot detection services')
    .version('1.3.0')
    .option('-u, --url <url>', 'HeadlessX server URL', 'http://localhost:3000')
    .option('-p, --profile <profile>', 'Fingerprint profile to use', 'windows-chrome-high-end')
    .option('-t, --timeout <ms>', 'Request timeout in milliseconds', '30000')
    .option('-v, --verbose', 'Verbose output')
    .action(async(options) => {
        try {
            const checker = new DetectionChecker({
                url: options.url,
                profile: options.profile,
                timeout: parseInt(options.timeout),
                verbose: options.verbose
            });

            await checker.runTests();
        } catch (error) {
            console.error(chalk.red(`❌ Error: ${error.message}`));
            process.exit(1);
        }
    });

if (require.main === module) {
    program.parse();
}

module.exports = DetectionChecker; 
 