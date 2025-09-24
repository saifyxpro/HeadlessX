#!/bin/bash

# HeadlessX Playwright Setup Script
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

# Install Playwright package
echo "📦 Installing Playwright package..."
if npm install playwright; then
    print_status "Playwright package installed"
else
    print_error "Failed to install Playwright package"
    exit 1
fi

# Set environment variable to allow browser download
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0

# Install Chromium browser
echo "🌐 Installing Chromium browser..."
if npx playwright install chromium; then
    print_status "Chromium browser installed"
elif ./node_modules/.bin/playwright install chromium; then
    print_status "Chromium browser installed (fallback method)"
else
    print_error "Failed to install Chromium browser"
    exit 1
fi

# Install system dependencies for browsers (Linux/Ubuntu)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🔧 Installing system dependencies for browsers..."
    if npx playwright install-deps chromium; then
        print_status "System dependencies installed"
    elif ./node_modules/.bin/playwright install-deps chromium; then
        print_status "System dependencies installed (fallback method)"
    else
        print_warning "System dependencies installation failed - browsers may still work"
    fi
fi

# Verify installation
echo "🔍 Verifying Playwright installation..."
if node -e "const playwright = require('playwright'); console.log('Playwright version:', playwright.chromium.version())"; then
    print_status "Playwright is working correctly!"
else
    print_warning "Playwright installation verification failed"
fi

echo ""
print_status "Playwright setup completed!"
echo "🚀 You can now start HeadlessX with: node src/server.js"