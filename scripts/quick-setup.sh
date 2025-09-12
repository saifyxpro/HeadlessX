#!/bin/bash

# HeadlessX Quick Setup Script
# This script sets up permissions and basic configuration

set -e

echo "🔧 HeadlessX Quick Setup"
echo "======================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    echo "❌ Error: Not in HeadlessX root directory"
    echo "Please run this script from the HeadlessX root directory"
    exit 1
fi

print_success "In HeadlessX directory"

# Make all scripts executable
echo "🔧 Making scripts executable..."
chmod +x scripts/*.sh
print_success "All scripts are now executable"

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    print_success ".env file created from .env.example"
    print_info "Remember to edit .env with your domain and token:"
    print_info "  nano .env"
else
    print_success ".env file already exists"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_info "Dependencies not installed yet"
    print_info "Run one of these commands next:"
    echo "  📦 For development: npm install"
    echo "  🐳 For Docker: docker-compose up -d"
    echo "  🔧 For production: sudo ./scripts/setup.sh"
else
    print_success "Dependencies already installed"
fi

echo ""
print_success "Quick setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Edit .env file: nano .env"
echo "   2. Choose deployment method:"
echo "      🐳 Docker: docker-compose up -d"
echo "      🔧 Production: sudo ./scripts/setup.sh"
echo "      💻 Development: npm install && npm start"
echo ""
echo "📖 For full documentation, see README.md"
echo ""