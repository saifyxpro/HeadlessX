#!/bin/bash

# Complete Playwright Uninstaller for HeadlessX
# Use this to completely remove Playwright before running setup.sh

echo "🧹 Complete Playwright Uninstaller"
echo "=================================="

# Stop HeadlessX
echo "Stopping HeadlessX..."
pm2 delete headlessx 2>/dev/null || true
pkill -f "node.*server.js" 2>/dev/null || true

# Remove Playwright from node_modules
echo "Removing Playwright from node_modules..."
rm -rf node_modules/playwright* 2>/dev/null || true
rm -rf node_modules/@playwright 2>/dev/null || true

# Remove global installations
echo "Removing global Playwright installations..."
npm uninstall -g playwright 2>/dev/null || true
npm uninstall -g @playwright/test 2>/dev/null || true

# Remove browser cache directories
echo "Removing Playwright browser caches..."
rm -rf ~/.cache/ms-playwright 2>/dev/null || true
rm -rf /root/.cache/ms-playwright 2>/dev/null || true
rm -rf $HOME/.cache/ms-playwright 2>/dev/null || true

# Remove package-lock.json to ensure clean install
echo "Removing package-lock.json..."
rm -f package-lock.json

# Clean npm cache
echo "Cleaning npm cache..."
npm cache clean --force

echo "✅ Playwright completely uninstalled!"
echo "Now you can run: chmod +x scripts/setup.sh && sudo ./scripts/setup.sh"