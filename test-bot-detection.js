/**
 * Bot Detection Test Script
 * Tests the enhanced stealth capabilities against common detection methods
 */

const { chromium } = require('playwright');
const StealthService = require('./src/services/stealth');

async function testBotDetection() {
    console.log('🧪 Testing Enhanced HeadlessX Stealth Capabilities...\n');
    
    const browser = await chromium.launch({ 
        headless: true,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-features=VizDisplayCompositor',
            '--disable-extensions',
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-default-apps',
            '--disable-popup-blocking',
            '--disable-translate',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--disable-backgrounding-occluded-windows',
            '--disable-client-side-phishing-detection',
            '--disable-sync',
            '--disable-dev-shm-usage',
            '--no-sandbox'
        ]
    });

    const context = await browser.newContext(StealthService.generateStealthContextOptions());
    const page = await context.newPage();
    
    // Apply enhanced stealth
    await StealthService.enhancePageWithAdvancedStealth(page);
    
    try {
        // Test critical properties
        console.log('Testing critical bot detection vectors...\n');
        
        const results = await page.evaluate(() => {
            const tests = {
                webdriver: navigator.webdriver,
                platform: navigator.platform,
                userAgent: navigator.userAgent.includes('Chrome/131'),
                plugins: navigator.plugins.length,
                chrome: !!window.chrome,
                chromeRuntime: !!(window.chrome && window.chrome.runtime),
                mimeTypes: navigator.mimeTypes.length,
                languages: navigator.languages.join(','),
                hardwareConcurrency: navigator.hardwareConcurrency,
                deviceMemory: navigator.deviceMemory,
                cookieEnabled: navigator.cookieEnabled,
                doNotTrack: navigator.doNotTrack
            };
            
            // Test WebGL
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            tests.webglContext = !!gl;
            if (gl) {
                tests.webglVendor = gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_VENDOR_WEBGL);
                tests.webglRenderer = gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL);
            }
            
            // Test video codecs
            const video = document.createElement('video');
            tests.h264Support = video.canPlayType('video/mp4; codecs="avc1.42E01E"');
            tests.webmSupport = video.canPlayType('video/webm');
            
            // Test canvas transparency
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'rgba(0,0,0,0)';
            ctx.fillRect(0, 0, 1, 1);
            const imageData = ctx.getImageData(0, 0, 1, 1);
            tests.transparentPixel = Array.from(imageData.data).join(',');
            
            // Test iframe chrome access
            const iframe = document.createElement('iframe');
            document.body.appendChild(iframe);
            tests.iframeChromeAccess = !!(iframe.contentWindow && iframe.contentWindow.chrome);
            document.body.removeChild(iframe);
            
            return tests;
        });
        
        // Display results
        console.log('🔍 Detection Test Results:');
        console.log('========================');
        console.log(`✅ WebDriver Property: ${results.webdriver === undefined ? 'HIDDEN' : 'DETECTED'}`);
        console.log(`✅ Platform Consistency: ${results.platform === 'Win32' ? 'CONSISTENT' : 'INCONSISTENT'} (${results.platform})`);
        console.log(`✅ Chrome User Agent: ${results.userAgent ? 'VALID' : 'INVALID'}`);
        console.log(`✅ Plugins Count: ${results.plugins > 0 ? 'REALISTIC' : 'SUSPICIOUS'} (${results.plugins})`);
        console.log(`✅ Chrome Object: ${results.chrome ? 'PRESENT' : 'MISSING'}`);
        console.log(`✅ Chrome Runtime: ${results.chromeRuntime ? 'PRESENT' : 'MISSING'}`);
        console.log(`✅ MIME Types: ${results.mimeTypes > 0 ? 'REALISTIC' : 'SUSPICIOUS'} (${results.mimeTypes})`);
        console.log(`✅ WebGL Context: ${results.webglContext ? 'CREATED' : 'FAILED'}`);
        if (results.webglContext) {
            console.log(`   └── Vendor: ${results.webglVendor}`);
            console.log(`   └── Renderer: ${results.webglRenderer?.substring(0, 50)}...`);
        }
        console.log(`✅ H.264 Support: ${results.h264Support === 'probably' ? 'FULL' : 'PARTIAL'} (${results.h264Support})`);
        console.log(`✅ WebM Support: ${results.webmSupport === 'maybe' ? 'SUPPORTED' : 'UNSUPPORTED'} (${results.webmSupport})`);
        console.log(`✅ Transparent Pixel: ${results.transparentPixel === '0,0,0,0' ? 'CORRECT' : 'SUSPICIOUS'} [${results.transparentPixel}]`);
        console.log(`✅ Iframe Chrome: ${results.iframeChromeAccess ? 'ACCESSIBLE' : 'BLOCKED'}`);
        console.log(`✅ Hardware Concurrency: ${results.hardwareConcurrency} cores`);
        console.log(`✅ Device Memory: ${results.deviceMemory}GB`);
        console.log(`✅ Languages: ${results.languages}`);
        
        // Calculate stealth score
        let score = 0;
        const maxScore = 12;
        
        if (results.webdriver === undefined) score++;
        if (results.platform === 'Win32') score++;
        if (results.userAgent) score++;
        if (results.plugins > 0) score++;
        if (results.chrome) score++;
        if (results.chromeRuntime) score++;
        if (results.mimeTypes > 0) score++;
        if (results.webglContext) score++;
        if (results.h264Support === 'probably') score++;
        if (results.webmSupport) score++;
        if (results.transparentPixel === '0,0,0,0') score++;
        if (results.iframeChromeAccess) score++;
        
        console.log('\n🎯 Stealth Score:', `${score}/${maxScore}`, `(${Math.round(score/maxScore*100)}%)`);
        
        if (score >= 10) {
            console.log('🎉 EXCELLENT! Should bypass most bot detection systems.');
        } else if (score >= 8) {
            console.log('✅ GOOD! Should bypass basic bot detection.');
        } else {
            console.log('⚠️ NEEDS IMPROVEMENT! May still be detected as a bot.');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the test
if (require.main === module) {
    testBotDetection().catch(console.error);
}

module.exports = { testBotDetection };