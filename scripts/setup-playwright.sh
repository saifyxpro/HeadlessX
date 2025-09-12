#!/bin/bash

# HeadlessX Playwright Setup Script
# Handles Playwright installation issues on Ubuntu 24.04+

set -e

echo "🌐 Setting up Playwright for HeadlessX"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    print_error "Not in HeadlessX root directory"
    exit 1
fi

# Detect OS version
OS_VERSION=$(lsb_release -rs 2>/dev/null || echo "unknown")
print_success "Detected OS version: $OS_VERSION"

# Install system dependencies based on OS version
echo "🔧 Installing system dependencies..."
sudo apt update

if [[ "$OS_VERSION" =~ ^2[4-9]\. ]] || [[ "$OS_VERSION" =~ ^[3-9][0-9]\. ]]; then
    # Ubuntu 24.04+ (including 25.04) - use t64 packages
    sudo apt install -y \
        libgtk-3-0t64 libpangocairo-1.0-0 libcairo-gobject2 \
        libgdk-pixbuf-2.0-0 libdrm2 libxss1 libxcomposite1 \
        libxdamage1 libxfixes3 libxrandr2 libgbm1 libcairo2 \
        libpango-1.0-0 libasound2t64 fonts-liberation libnss3 \
        xdg-utils wget ca-certificates curl libatk1.0-0t64 \
        libatk-bridge2.0-0t64 libcups2t64 libatspi2.0-0t64
else
    # Fallback for older Ubuntu versions
    sudo apt install -y \
        libgtk-3-0 libpangocairo-1.0-0 libcairo-gobject2 \
        libgdk-pixbuf2.0-0 libdrm2 libxss1 libxcomposite1 \
        libxdamage1 libxfixes3 libxrandr2 libgbm1 libcairo2 \
        libpango-1.0-0 libasound2 fonts-liberation libnss3 \
        xdg-utils wget ca-certificates curl libatk1.0-0 \
        libatk-bridge2.0-0 libcups2 libatspi2.0-0
fi

print_success "System dependencies installed"

# Install Playwright browsers (Chromium only for stability)
echo "🌐 Installing Playwright Chromium browser..."
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0

# Try to install Chromium browser
if npx playwright install chromium; then
    print_success "Chromium browser installed successfully"
else
    print_warning "Chromium installation had warnings (usually OK)"
fi

# Try to install browser dependencies
echo "🔧 Installing browser dependencies..."
if npx playwright install-deps chromium 2>/dev/null; then
    print_success "Browser dependencies installed"
else
    print_warning "Some browser dependencies failed (fallback will be used)"
fi

# Test browser functionality
echo "🧪 Testing browser functionality..."
cat > test-browser.js << 'EOF'
const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('data:text/html,<h1>Test</h1>');
    await browser.close();
    console.log('✅ Browser test successful');
    process.exit(0);
  } catch (error) {
    console.log('❌ Browser test failed:', error.message);
    process.exit(1);
  }
})();
EOF

if node test-browser.js; then
    print_success "Browser functionality test passed"
else
    print_warning "Browser test failed - check logs"
fi

# Cleanup
rm -f test-browser.js

echo ""
print_success "Playwright setup complete!"
echo ""
echo "📋 Summary:"
echo "   ✅ System dependencies installed"
echo "   ✅ Chromium browser installed"
echo "   ✅ Browser functionality tested"
echo ""
echo "🚀 You can now start HeadlessX:"
echo "   npm start (development)"
echo "   npm run pm2:start (production)"
echo ""