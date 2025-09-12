#!/bin/bash

# HeadlessX Package Lock Generator
# This script generates package-lock.json files for both root and website

set -e

echo "🔒 Generating package-lock.json files for HeadlessX"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    echo "❌ Not in HeadlessX root directory"
    echo "Please run this script from the HeadlessX root directory"
    exit 1
fi

print_status "In correct directory"

# Generate main package-lock.json
echo "📦 Generating main package-lock.json..."
if [ -f "package-lock.json" ]; then
    print_info "package-lock.json already exists, backing up..."
    mv package-lock.json package-lock.json.backup
fi

# Install dependencies to generate lock file
npm install
print_status "Main package-lock.json generated"

# Generate website package-lock.json
echo "🌐 Generating website package-lock.json..."
cd website

if [ -f "package-lock.json" ]; then
    print_info "website/package-lock.json already exists, backing up..."
    mv package-lock.json package-lock.json.backup
fi

# Install website dependencies to generate lock file
npm install
print_status "Website package-lock.json generated"

cd ..

echo ""
print_status "Package lock files generated successfully!"
echo ""
echo "📋 Generated files:"
echo "   ✅ package-lock.json"
echo "   ✅ website/package-lock.json"
echo ""
echo "🚀 Now you can use:"
echo "   - npm ci --omit=dev (for production)"
echo "   - docker-compose up -d (for Docker deployment)"
echo "   - ./scripts/setup.sh (for automated setup)"
echo ""