#!/bin/bash

# HeadlessX API Endpoints Test Script
# Tests all API endpoints to ensure they're working correctly
# Run with: bash scripts/test-api-endpoints.sh

set -e

echo "🧪 HeadlessX API Endpoints Test"
echo "==============================="

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
print_info "Checking if server is running..."
if ! curl -s "$API_URL/health" > /dev/null; then
    print_error "Server is not running on $BASE_URL"
    print_info "Start the server with: npm run pm2:start or node src/server.js"
    exit 1
fi

print_status "Server is running"

# Test endpoints
FAILED_TESTS=0

# 1. Test health endpoint (no auth)
echo ""
print_info "Testing /api/health (no auth required)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
if [ "$HTTP_CODE" = "200" ]; then
    print_status "Health endpoint: HTTP $HTTP_CODE"
else
    print_error "Health endpoint failed: HTTP $HTTP_CODE"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# 2. Test status endpoint (auth required)
echo ""
print_info "Testing /api/status (auth required)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/status?token=$AUTH_TOKEN")
if [ "$HTTP_CODE" = "200" ]; then
    print_status "Status endpoint: HTTP $HTTP_CODE"
else
    print_error "Status endpoint failed: HTTP $HTTP_CODE"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# 3. Test docs endpoint (no auth)
echo ""
print_info "Testing /api/docs..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/docs")
if [ "$HTTP_CODE" = "200" ]; then
    print_status "Docs endpoint: HTTP $HTTP_CODE"
else
    print_error "Docs endpoint failed: HTTP $HTTP_CODE"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# 4. Test HTML endpoint (GET)
echo ""
print_info "Testing /api/html (GET)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/html?url=https://httpbin.org/html&token=$AUTH_TOKEN")
if [ "$HTTP_CODE" = "200" ]; then
    print_status "HTML endpoint (GET): HTTP $HTTP_CODE"
else
    print_error "HTML endpoint (GET) failed: HTTP $HTTP_CODE"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# 5. Test HTML endpoint (POST)
echo ""
print_info "Testing /api/html (POST)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{"url":"https://httpbin.org/html"}' "$API_URL/html?token=$AUTH_TOKEN")
if [ "$HTTP_CODE" = "200" ]; then
    print_status "HTML endpoint (POST): HTTP $HTTP_CODE"
else
    print_error "HTML endpoint (POST) failed: HTTP $HTTP_CODE"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# 6. Test content endpoint (GET)
echo ""
print_info "Testing /api/content (GET)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/content?url=https://httpbin.org/html&token=$AUTH_TOKEN")
if [ "$HTTP_CODE" = "200" ]; then
    print_status "Content endpoint (GET): HTTP $HTTP_CODE"
else
    print_error "Content endpoint (GET) failed: HTTP $HTTP_CODE"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# 7. Test render endpoint (POST)
echo ""
print_info "Testing /api/render (POST)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{"url":"https://httpbin.org/html"}' "$API_URL/render?token=$AUTH_TOKEN")
if [ "$HTTP_CODE" = "200" ]; then
    print_status "Render endpoint (POST): HTTP $HTTP_CODE"
else
    print_error "Render endpoint (POST) failed: HTTP $HTTP_CODE"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# 8. Test screenshot endpoint
echo ""
print_info "Testing /api/screenshot..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/screenshot?url=https://httpbin.org/html&token=$AUTH_TOKEN")
if [ "$HTTP_CODE" = "200" ]; then
    print_status "Screenshot endpoint: HTTP $HTTP_CODE"
else
    print_error "Screenshot endpoint failed: HTTP $HTTP_CODE"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# 9. Test PDF endpoint
echo ""
print_info "Testing /api/pdf..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/pdf?url=https://httpbin.org/html&token=$AUTH_TOKEN")
if [ "$HTTP_CODE" = "200" ]; then
    print_status "PDF endpoint: HTTP $HTTP_CODE"
else
    print_error "PDF endpoint failed: HTTP $HTTP_CODE"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# 10. Test batch endpoint
echo ""
print_info "Testing /api/batch..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{"urls":["https://httpbin.org/html"]}' "$API_URL/batch?token=$AUTH_TOKEN")
if [ "$HTTP_CODE" = "200" ]; then
    print_status "Batch endpoint: HTTP $HTTP_CODE"
else
    print_error "Batch endpoint failed: HTTP $HTTP_CODE"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# 11. Test authentication failure
echo ""
print_info "Testing authentication failure..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/status?token=invalid_token")
if [ "$HTTP_CODE" = "401" ]; then
    print_status "Authentication failure test: HTTP $HTTP_CODE (correct)"
else
    print_error "Authentication failure test failed: HTTP $HTTP_CODE (should be 401)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Final results
echo ""
echo "==============================="
if [ $FAILED_TESTS -eq 0 ]; then
    print_status "All API endpoints are working correctly! 🎉"
    echo ""
    print_info "Your HeadlessX API is ready to use:"
    print_info "- Base URL: $BASE_URL"
    print_info "- API Documentation: $API_URL/docs"
    print_info "- Health Check: $API_URL/health"
    if [ -n "$DOMAIN" ] && [ -n "$SUBDOMAIN" ]; then
        print_info "- Production URL: https://$SUBDOMAIN.$DOMAIN"
    fi
else
    print_error "$FAILED_TESTS endpoint(s) failed"
    print_info "Check the server logs for more details: pm2 logs headlessx"
    exit 1
fi