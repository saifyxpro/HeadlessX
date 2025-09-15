#!/bin/bash

# Google.com Access Test Script
# Tests if Google.com can be accessed successfully with the updated stealth configuration
# Run with: bash scripts/test-google-access.sh

set -e

echo "🔍 Google.com Access Test"
echo "========================="

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

# Load environment
if [ -f .env ]; then
    export $(grep -v '^#' .env | grep -v '^$' | xargs)
    print_status "Environment loaded from .env"
else
    print_error ".env file not found"
    exit 1
fi

# Check if required variables are set
if [ -z "$AUTH_TOKEN" ]; then
    print_error "AUTH_TOKEN not set in .env file"
    exit 1
fi

# Set base URL
BASE_URL="http://127.0.0.1:3000"
API_URL="$BASE_URL/api"

# Check if server is running
print_info "Checking if HeadlessX server is running..."
if ! curl -s "$API_URL/health" > /dev/null; then
    print_error "Server is not running on $BASE_URL"
    print_info "Start the server with: npm run pm2:start or node src/server.js"
    exit 1
fi

print_status "HeadlessX server is running"

# Test Google.com access
echo ""
print_info "Testing Google.com access..."

# Test different Google URLs
GOOGLE_URLS=(
    "https://google.com"
    "https://www.google.com"
    "https://google.com/search?q=test"
)

FAILED_TESTS=0

for url in "${GOOGLE_URLS[@]}"; do
    echo ""
    print_info "Testing: $url"
    
    # Test HTML endpoint
    print_info "  Fetching HTML content..."
    RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST -H "Content-Type: application/json" \
        -d "{\"url\":\"$url\", \"timeout\": 60000}" \
        "$API_URL/html?token=$AUTH_TOKEN")
    
    HTTP_CODE=$(echo $RESPONSE | grep -o 'HTTPSTATUS:[0-9]*' | cut -d: -f2)
    CONTENT=$(echo $RESPONSE | sed 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$HTTP_CODE" = "200" ]; then
        # Check if content looks like Google
        if echo "$CONTENT" | grep -qi "google\|search"; then
            print_status "  ✅ Successfully accessed $url (HTTP $HTTP_CODE)"
            print_info "  Content length: $(echo "$CONTENT" | wc -c) characters"
            
            # Check for anti-bot detection signs
            if echo "$CONTENT" | grep -qi "unusual traffic\|automated queries\|are you a robot\|captcha"; then
                print_warning "  ⚠️  Anti-bot detection detected in content"
                FAILED_TESTS=$((FAILED_TESTS + 1))
            else
                print_status "  ✅ No anti-bot detection detected"
            fi
        else
            print_error "  ❌ Content doesn't look like Google page"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        print_error "  ❌ Failed to access $url (HTTP $HTTP_CODE)"
        if [ ! -z "$CONTENT" ]; then
            echo "     Error: $(echo "$CONTENT" | head -c 200)..."
        fi
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
done

# Test screenshot endpoint with Google
echo ""
print_info "Testing Google.com screenshot..."
HTTP_CODE=$(curl -s -o /tmp/google_screenshot.png -w "%{http_code}" \
    "$API_URL/screenshot?url=https://google.com&token=$AUTH_TOKEN&timeout=60000")

if [ "$HTTP_CODE" = "200" ]; then
    if [ -f /tmp/google_screenshot.png ] && [ -s /tmp/google_screenshot.png ]; then
        FILE_SIZE=$(stat -c%s /tmp/google_screenshot.png 2>/dev/null || stat -f%z /tmp/google_screenshot.png)
        print_status "Screenshot successful (HTTP $HTTP_CODE, ${FILE_SIZE} bytes)"
        print_info "Screenshot saved to: /tmp/google_screenshot.png"
    else
        print_error "Screenshot file is empty or invalid"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
else
    print_error "Screenshot failed (HTTP $HTTP_CODE)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test other challenging sites
echo ""
print_info "Testing other protected sites..."

PROTECTED_SITES=(
    "https://httpbin.org/html"
    "https://example.com"
    "https://httpbin.org/user-agent"
)

for url in "${PROTECTED_SITES[@]}"; do
    print_info "  Testing: $url"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" \
        -d "{\"url\":\"$url\"}" \
        "$API_URL/html?token=$AUTH_TOKEN")
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_status "  ✅ $url (HTTP $HTTP_CODE)"
    else
        print_error "  ❌ $url (HTTP $HTTP_CODE)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
done

# Final results
echo ""
echo "========================="
if [ $FAILED_TESTS -eq 0 ]; then
    print_status "🎉 All Google.com tests passed! Anti-bot bypass is working correctly."
    echo ""
    print_info "Your HeadlessX can now successfully access:"
    print_info "✅ Google.com and Google search"
    print_info "✅ Screenshots of Google pages"
    print_info "✅ Other protected websites"
    echo ""
    print_info "Tips for best results:"
    print_info "- Use reasonable timeouts (60+ seconds for Google)"
    print_info "- Don't make too many rapid requests to Google"
    print_info "- The stealth system will handle consent automatically"
else
    print_error "$FAILED_TESTS test(s) failed"
    echo ""
    print_warning "Troubleshooting tips:"
    print_warning "1. Increase timeout values for Google (60-120 seconds)"
    print_warning "2. Check server logs: pm2 logs headlessx"
    print_warning "3. Try different Google domains (google.com vs www.google.com)"
    print_warning "4. Wait between requests to avoid rate limiting"
    exit 1
fi