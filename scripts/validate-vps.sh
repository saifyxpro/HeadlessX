#!/bin/bash

# HeadlessX VPS Validation Script
# Validates that HeadlessX is running correctly on Ubuntu VPS
# Run with: bash scripts/validate-vps.sh

set -e

echo "🔍 HeadlessX VPS Validation"
echo "============================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️ $1${NC}"; }

VALIDATION_FAILED=false

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    print_error "Please run this script from the HeadlessX root directory"
    exit 1
fi

# Load environment
if [ -f .env ]; then
    export $(grep -v '^#' .env | grep -v '^$' | xargs)
    print_status "Environment loaded from .env"
else
    print_error ".env file not found"
    VALIDATION_FAILED=true
fi

# Check Node.js version
NODE_VERSION=$(node --version 2>/dev/null || echo "not found")
if [[ "$NODE_VERSION" == "not found" ]]; then
    print_error "Node.js not installed"
    VALIDATION_FAILED=true
else
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [[ $MAJOR_VERSION -ge 18 ]]; then
        print_status "Node.js version: $NODE_VERSION"
    else
        print_error "Node.js version $NODE_VERSION is too old. Requires 18+"
        VALIDATION_FAILED=true
    fi
fi

# Check PM2
if command -v pm2 >/dev/null 2>&1; then
    PM2_VERSION=$(pm2 --version)
    print_status "PM2 version: $PM2_VERSION"
    
    # Check PM2 process
    if pm2 describe headlessx >/dev/null 2>&1; then
        PM2_STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="headlessx") | .pm2_env.status' 2>/dev/null || echo "unknown")
        if [[ "$PM2_STATUS" == "online" ]]; then
            print_status "PM2 process is online"
        else
            print_error "PM2 process status: $PM2_STATUS"
            VALIDATION_FAILED=true
        fi
    else
        print_error "PM2 process 'headlessx' not found"
        VALIDATION_FAILED=true
    fi
else
    print_error "PM2 not installed"
    VALIDATION_FAILED=true
fi

# Check port 3000
PORT_CHECK=$(ss -tlnp 2>/dev/null | grep :3000 || echo "not found")
if [[ "$PORT_CHECK" != "not found" ]]; then
    print_status "Port 3000 is listening"
else
    print_error "Port 3000 is not listening"
    VALIDATION_FAILED=true
fi

# Check server health
if command -v curl >/dev/null 2>&1; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/health 2>/dev/null || echo "000")
    if [[ "$HTTP_CODE" == "200" ]]; then
        print_status "Health endpoint responding (HTTP $HTTP_CODE)"
    else
        print_error "Health endpoint failed (HTTP $HTTP_CODE)"
        VALIDATION_FAILED=true
    fi
else
    print_warning "curl not available - cannot test health endpoint"
fi

# Check required files
REQUIRED_FILES=(
    "src/app.js"
    "src/server.js" 
    "src/config/index.js"
    "package.json"
    ".env"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        print_status "Required file exists: $file"
    else
        print_error "Required file missing: $file"
        VALIDATION_FAILED=true
    fi
done

# Check syntax
if node -c src/app.js >/dev/null 2>&1; then
    print_status "Main app syntax is valid"
else
    print_error "Main app has syntax errors"
    VALIDATION_FAILED=true
fi

# Check auth token
if [[ -n "$AUTH_TOKEN" && "$AUTH_TOKEN" != "your_secure_token_here" ]]; then
    print_status "AUTH_TOKEN is configured"
else
    print_warning "AUTH_TOKEN not properly configured in .env"
fi

# Final result
echo ""
if [[ "$VALIDATION_FAILED" == "true" ]]; then
    print_error "Validation FAILED - Please fix the above issues"
    exit 1
else
    print_status "Validation PASSED - HeadlessX is running correctly on your VPS"
    echo ""
    print_info "Your HeadlessX instance is ready to accept requests!"
    if [[ -n "$DOMAIN" && -n "$SUBDOMAIN" ]]; then
        print_info "API URL: https://$SUBDOMAIN.$DOMAIN"
    fi
    print_info "Local health check: http://127.0.0.1:3000/api/health"
fi