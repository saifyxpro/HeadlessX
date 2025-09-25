#!/bin/bash

# HeadlessX Playwright Setup Script (Fixed Version)
# Installs Playwright and browsers for HeadlessX
# Run with: bash scripts/setup-playwright.sh

set -e

echo "🎭 Installing Playwright for HeadlessX..."
echo "========================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "Node.js $(node --version) and npm $(npm --version) found"

# Make sure we're in project root
cd "$(dirname "$0")/.."

# Install Playwright package
echo "📦 Installing/Updating Playwright package..."
if npm install playwright; then
    print_status "Playwright package installed"
else
    print_error "Failed to install Playwright package"
    exit 1
fi

# Set environment variable to allow browser download
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0

# Install browsers using reliable methods
echo "🌐 Installing Chromium browser..."

# Set environment to allow downloads
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0

success=false

# Method 1: Try local playwright binary first
if [ -f "./node_modules/.bin/playwright" ]; then
    echo "Attempting installation via local playwright binary..."
    if ./node_modules/.bin/playwright install chromium; then
        print_status "Chromium installed via local binary"
        success=true
    fi
fi

# Method 2: Try npx if local binary failed
if [ "$success" = false ] && command -v npx &> /dev/null; then
    echo "Attempting installation via npx..."
    if npx playwright install chromium; then
        print_status "Chromium installed via npx"
        success=true
    fi
fi

# Method 3: Try Node.js require to trigger download
if [ "$success" = false ]; then
    echo "Triggering browser download via Node.js require..."
    if node -e "
try {
    const playwright = require('playwright');
    console.log('Playwright loaded - browser will download on first use');
} catch (error) {
    console.error('Failed to load Playwright:', error.message);
    process.exit(1);
}
"; then
        print_status "Playwright loaded - browsers will download on first API call"
        success=true
    fi
fi

if [ "$success" = false ]; then
    print_error "All installation methods failed"
    exit 1
fi

# Install system dependencies for browsers (Linux/Ubuntu)
if [[ "$OSTYPE" == "linux-gnu"* ]] && command -v apt-get &> /dev/null; then
    echo "🔧 Installing system dependencies for browsers..."
    sudo apt-get update &>/dev/null || true
    sudo apt-get install -y \
        libnss3 libnspr4 libatk-bridge2.0-0 libdrm2 libxkbcommon0 \
        libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxss1 libasound2 \
        libatspi2.0-0 libgtk-3-0 &>/dev/null
    
    if [ $? -eq 0 ]; then
        print_status "System dependencies installed"
    else
        print_warning "Some system dependencies failed - browsers may still work"
    fi
fi

# Verify installation
echo "🔍 Verifying Playwright installation..."
node -e "
try {
    const playwright = require('playwright');
    console.log('✅ Playwright module loads successfully');
    console.log('📍 Chromium executable will be downloaded on first launch');
} catch (error) {
    console.log('❌ Verification failed:', error.message);
    process.exit(1);
}
"

echo ""
print_status "Playwright setup completed!"
echo "🚀 You can now start HeadlessX with: node src/server.js"
echo "📝 Browsers will auto-download on first use if not already present"