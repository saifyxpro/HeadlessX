#!/bin/bash

# HeadlessX Setup Validation Script
# This script validates that HeadlessX is properly configured

set -e

echo "🔍 HeadlessX Setup Validation"
echo "============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
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
    print_error "Please run this script from the HeadlessX root directory"
    exit 1
fi

print_success "In correct directory"

# Check Node.js version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_success "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js not installed"
    exit 1
fi

# Check NPM version
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    print_success "NPM installed: $NPM_VERSION"
else
    print_error "NPM not installed"
    exit 1
fi

# Check if dependencies are installed
if [ -d "node_modules" ] && [ -f "node_modules/express/package.json" ]; then
    print_success "Dependencies installed"
else
    print_warning "Dependencies not installed"
    if [ -f "package-lock.json" ]; then
        print_warning "Run: npm ci --omit=dev"
    else
        print_warning "Run: npm install --production"
        print_warning "Note: package-lock.json missing - consider running 'npm install' first to generate it"
    fi
fi

# Check .env file
if [ -f ".env" ]; then
    print_success ".env file exists"
    
    # Check required environment variables
    if grep -q "TOKEN=" .env && grep -q "DOMAIN=" .env && grep -q "SUBDOMAIN=" .env; then
        print_success "Required environment variables present"
    else
        print_warning "Some required environment variables missing in .env"
        print_warning "Required: TOKEN, DOMAIN, SUBDOMAIN"
    fi
else
    print_warning ".env file missing - run: cp .env.example .env"
fi

# Check website build
if [ -d "website/out" ]; then
    print_success "Website built"
else
    print_warning "Website not built - run: cd website && npm run build"
fi

# Check PM2 installation
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 -v)
    print_success "PM2 installed: $PM2_VERSION"
else
    print_warning "PM2 not installed - run: sudo npm install -g pm2"
fi

# Check Docker installation
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker installed: $DOCKER_VERSION"
else
    print_warning "Docker not installed (optional)"
fi

# Check docker-compose installation
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    print_success "Docker Compose installed: $COMPOSE_VERSION"
else
    print_warning "Docker Compose not installed (optional)"
fi

# Test basic server startup
echo ""
echo "🧪 Testing server startup..."
if [ -f ".env" ]; then
    # Load environment variables
    export $(grep -v '^#' .env | xargs)
fi

# Test if server can start
timeout 10s node src/server.js &
SERVER_PID=$!
sleep 3

if kill -0 $SERVER_PID 2>/dev/null; then
    print_success "Server starts successfully"
    kill $SERVER_PID
else
    print_warning "Server startup test failed (check dependencies and .env)"
fi

echo ""
echo "📋 Validation Summary:"
echo "====================="

if [ -d "node_modules" ] && [ -f ".env" ] && [ -d "website/out" ]; then
    print_success "Setup appears to be complete!"
    echo ""
    echo "🚀 Next steps:"
    echo "   - Docker: docker-compose up -d"
    echo "   - PM2: npm run pm2:start"
    echo "   - Dev: npm start"
else
    print_warning "Setup incomplete. Follow these steps:"
    echo ""
    if [ ! -f ".env" ]; then
        echo "   1. cp .env.example .env && nano .env"
    fi
    if [ ! -d "node_modules" ]; then
        echo "   2. npm install"
    fi
    if [ ! -d "website/out" ]; then
        echo "   3. cd website && npm install && npm run build && cd .."
    fi
    echo "   4. npm start  # Test locally"
    echo "   5. npm run pm2:start  # Production with PM2"
fi

echo ""