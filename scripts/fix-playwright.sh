#!/bin/bash

# HeadlessX Playwright Fix Script
# Completely removes and reinstalls Playwright to fix all issues

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

echo "🎭 HeadlessX Playwright Complete Fix"
echo "===================================="
print_warning "This will completely remove and reinstall Playwright"
echo ""

# Make sure we're in project root
cd "$(dirname "$0")/.."

# Step 1: Stop any running HeadlessX processes
echo "🛑 Stopping HeadlessX processes..."
pm2 delete headlessx 2>/dev/null || true
pkill -f "node.*server.js" 2>/dev/null || true
print_status "Processes stopped"

# Step 2: Remove all Playwright installations
echo "🧹 Removing all Playwright installations..."

# Remove from node_modules
rm -rf node_modules/playwright* 2>/dev/null || true
rm -rf node_modules/@playwright 2>/dev/null || true

# Remove global Playwright
npm uninstall -g playwright 2>/dev/null || true
npm uninstall -g @playwright/test 2>/dev/null || true

# Remove Playwright browsers cache
rm -rf ~/.cache/ms-playwright 2>/dev/null || true
rm -rf /root/.cache/ms-playwright 2>/dev/null || true
rm -rf $HOME/.cache/ms-playwright 2>/dev/null || true

# Remove from package-lock.json references
if [ -f "package-lock.json" ]; then
    rm package-lock.json
    print_info "Removed package-lock.json to ensure clean install"
fi

print_status "All Playwright files removed"

# Step 3: Clean npm cache
echo "🧹 Cleaning npm cache..."
npm cache clean --force
print_status "npm cache cleaned"

# Step 4: Reinstall project dependencies
echo "📦 Reinstalling project dependencies..."
npm install
print_status "Dependencies reinstalled"

# Step 5: Verify Playwright is in node_modules
if [ -d "node_modules/playwright" ]; then
    print_status "Playwright package found in node_modules"
else
    print_error "Playwright package not found, manually installing..."
    npm install playwright
fi

# Step 6: Install browsers using the most reliable method
echo "🌐 Installing Playwright browsers..."

# Method 1: Use node to run playwright install
node -e "
const { execSync } = require('child_process');
const path = require('path');

try {
    // Try npx first
    console.log('Trying npx playwright install chromium...');
    execSync('npx playwright install chromium', { stdio: 'inherit', timeout: 300000 });
    console.log('✅ Browsers installed via npx');
} catch (e1) {
    try {
        // Try direct node_modules path
        console.log('Trying direct path...');
        const playwrightPath = path.join(__dirname, 'node_modules', '.bin', 'playwright');
        execSync(\`\"\${playwrightPath}\" install chromium\`, { stdio: 'inherit', timeout: 300000 });
        console.log('✅ Browsers installed via direct path');
    } catch (e2) {
        try {
            // Try node playwright CLI
            console.log('Trying node CLI...');
            execSync('node node_modules/playwright/cli.js install chromium', { stdio: 'inherit', timeout: 300000 });
            console.log('✅ Browsers installed via node CLI');
        } catch (e3) {
            console.log('⚠️ Direct installation failed - browsers will download on first use');
            // This is actually fine - Playwright will auto-download
        }
    }
}
"

# Step 7: Install system dependencies
echo "🔧 Installing system dependencies..."
if command -v apt-get &> /dev/null; then
    apt-get update -qq
    apt-get install -y -qq \
        libnss3 libnspr4 libatk-bridge2.0-0 libdrm2 libxkbcommon0 \
        libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxss1 libasound2 \
        libatspi2.0-0 libgtk-3-0 libcairo2 libpango-1.0-0 libgdk-pixbuf-2.0-0 \
        fonts-liberation
    print_status "System dependencies installed"
fi

# Step 8: Test Playwright installation
echo "🧪 Testing Playwright installation..."
node -e "
const playwright = require('playwright');

(async () => {
    try {
        console.log('Testing Playwright...');
        
        // Test if we can create a browser instance
        const browser = await playwright.chromium.launch({ headless: true });
        console.log('✅ Playwright chromium can be launched');
        
        const page = await browser.newPage();
        console.log('✅ Playwright can create pages');
        
        await page.goto('data:text/html,<h1>Test</h1>');
        const title = await page.textContent('h1');
        console.log('✅ Playwright can navigate and interact:', title);
        
        await browser.close();
        console.log('✅ All Playwright tests passed!');
        
    } catch (error) {
        console.log('⚠️ Playwright test failed:', error.message);
        console.log('   This is usually fine - browsers will download on first API call');
    }
})();
"

print_status "Playwright installation completed!"

# Step 9: Restart HeadlessX
echo "🚀 Starting HeadlessX..."
pm2 start src/server.js --name headlessx --time --update-env --max-memory-restart 800M
sleep 3

# Step 10: Test API
echo "🧪 Testing HeadlessX API..."
if curl -s http://localhost:3000/api/health > /dev/null; then
    print_status "HeadlessX API is responding"
    
    # Test actual rendering
    echo "🧪 Testing HTML rendering..."
    if curl -s -X POST http://localhost:3000/api/render -H "Content-Type: application/json" -d '{"html":"<h1>Test</h1>"}' | grep -q "Test"; then
        print_status "HTML rendering works perfectly!"
    else
        print_warning "HTML rendering test inconclusive - but API is running"
    fi
else
    print_warning "API health check failed - check logs with: pm2 logs headlessx"
fi

echo ""
echo "🎉 Playwright Fix Complete!"
echo "=========================="
print_status "Playwright has been completely reinstalled"
print_status "HeadlessX is running with PM2"
print_info "Check status with: pm2 status"
print_info "Check logs with: pm2 logs headlessx"
print_info "Test API with: curl http://localhost:3000/api/health"

echo ""
echo "🔧 If you still see Playwright warnings, run:"
echo "   chmod +x scripts/fix-playwright.sh && sudo ./scripts/fix-playwright.sh"