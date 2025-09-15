/**
 * User Agent Configuration
 * Realistic Windows Chrome user agents and locale settings
 */

// DESKTOP-ONLY Chrome User Agents Pool - No Mobile, No Other Browsers
const REALISTIC_USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
];

// Realistic Windows locales and languages
const REALISTIC_LOCALES = [
    { locale: 'en-US', timezone: 'America/New_York', languages: ['en-US', 'en'] },
    { locale: 'en-GB', timezone: 'Europe/London', languages: ['en-GB', 'en'] }
];

// Browser launch arguments for stealth and performance
const BROWSER_ARGS = [
    // Security & Sandboxing (required for servers)
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    
    // Stealth & Anti-Detection
    '--disable-blink-features=AutomationControlled',
    '--disable-features=VizDisplayCompositor',
    '--disable-component-extensions-with-background-pages',
    '--no-default-browser-check',
    '--no-first-run',
    '--disable-default-apps',
    '--disable-extensions',
    '--disable-plugins-discovery',
    '--disable-prompt-on-repost',
    '--disable-hang-monitor',
    '--disable-ipc-flooding-protection',
    '--disable-popup-blocking',
    '--disable-backgrounding-occluded-windows',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-field-trial-config',
    '--disable-back-forward-cache',
    
    // Performance & Memory
    '--memory-pressure-off',
    '--disable-client-side-phishing-detection',
    '--disable-sync',
    '--disable-translate',
    '--disable-background-networking',
    '--disable-domain-reliability',
    '--disable-component-update',
    '--disable-features=TranslateUI',
    '--disable-features=BlinkGenPropertyTrees',
    
    // Media & Hardware
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--disable-gpu-sandbox',
    '--disable-software-rasterizer',
    '--disable-gl-drawing-for-tests',
    '--no-zygote',
    
    // Realistic Windows Chrome flags
    '--enable-features=NetworkService,NetworkServiceInProcess',
    '--enable-automation=false',
    '--password-store=basic',
    '--use-mock-keychain',
    '--disable-web-security', // Only for scraping
    
    // Window & Display settings
    '--force-device-scale-factor=1',
    '--hide-scrollbars',
    '--mute-audio',
    '--disable-logging',
    '--disable-gpu-logging',
    '--silent',
    '--log-level=3',
    '--disable-dev-tools',
    
    // Network & Privacy
    '--disable-features=VizDisplayCompositor,VizHitTestSurfaceLayer',
    '--disable-breakpad',
    '--disable-crash-reporter',
    '--disable-metrics',
    '--disable-metrics-reporting',
    '--no-report-upload',
    
    // Additional stealth
    '--user-agent-override-header',
    '--disable-automation',
    '--exclude-switches=enable-automation',
    '--disable-blink-features=AutomationControlled'
];

// Default browser launch options
const BROWSER_LAUNCH_OPTIONS = {
    headless: true,
    args: BROWSER_ARGS,
    ignoreDefaultArgs: [
        '--enable-automation',
        '--enable-blink-features=IdleDetection'
    ],
    env: {
        ...process.env,
        'PLAYWRIGHT_DOWNLOAD_HOST': undefined,
        'PLAYWRIGHT_BROWSERS_PATH': undefined
    }
};

// Function to get random realistic user agent
function getRandomUserAgent() {
    return REALISTIC_USER_AGENTS[Math.floor(Math.random() * REALISTIC_USER_AGENTS.length)];
}

// Function to get random locale settings
function getRandomLocale() {
    return REALISTIC_LOCALES[Math.floor(Math.random() * REALISTIC_LOCALES.length)];
}

// Function to generate CHROME-ONLY realistic headers (no mobile detection)
function generateRealisticHeaders(userAgent, customHeaders = {}) {
    // Extract Chrome version from user agent
    const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
    const chromeVersion = chromeMatch ? chromeMatch[1] : '131';
    
    const baseHeaders = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Cache-Control': 'max-age=0',
        'Upgrade-Insecure-Requests': '1',
        'Connection': 'keep-alive',
        // FORCE CHROME DESKTOP HEADERS ONLY
        'sec-ch-ua': `"Google Chrome";v="${chromeVersion}", "Not=A?Brand";v="8", "Chromium";v="${chromeVersion}"`,
        'sec-ch-ua-mobile': '?0',  // CRITICAL: Force desktop
        'sec-ch-ua-platform': '"Windows"',
        'sec-ch-ua-platform-version': '"15.0.0"',
        'sec-ch-ua-arch': '"x86"',
        'sec-ch-ua-bitness': '"64"',
        'sec-ch-ua-full-version-list': `"Google Chrome";v="${chromeVersion}.0.6668.70", "Not=A?Brand";v="8.0.0.0", "Chromium";v="${chromeVersion}.0.6668.70"`,
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1'
    };

    // Merge with custom headers (custom headers take priority)
    return { ...baseHeaders, ...customHeaders };
}

module.exports = {
    REALISTIC_USER_AGENTS,
    REALISTIC_LOCALES,
    BROWSER_ARGS,
    BROWSER_LAUNCH_OPTIONS,
    getRandomUserAgent,
    getRandomLocale,
    generateRealisticHeaders
};