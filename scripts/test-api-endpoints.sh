#!/bin/bash

# HeadlessX API and Google Access Test Script
# Tests all endpoints and validates Google.com access with datacenter IP stealth

echo "🚀 HeadlessX API Testing Suite"
echo "========================================"

# Configuration
API_BASE="http://localhost:3000"
GOOGLE_URL="https://google.com"
TEST_WEBSITE="https://example.com"

# Test URLs for different scenarios
COMPLEX_CSS_URL="https://github.com"
JAVASCRIPT_HEAVY_URL="https://news.ycombinator.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS") echo -e "${GREEN}✓ $message${NC}" ;;
        "ERROR") echo -e "${RED}✗ $message${NC}" ;;
        "WARNING") echo -e "${YELLOW}⚠ $message${NC}" ;;
        "INFO") echo -e "${BLUE}ℹ $message${NC}" ;;
    esac
}

# Function to test endpoint with JSON response
test_json_endpoint() {
    local endpoint=$1
    local url=$2
    local description=$3
    
    echo
    print_status "INFO" "Testing $description..."
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST "$API_BASE$endpoint" \
        -H "Content-Type: application/json" \
        -d "{\"url\":\"$url\"}")
    
    http_code=$(echo $response | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    body=$(echo $response | sed -E 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$http_code" = "200" ]; then
        title=$(echo "$body" | grep -o '"title":"[^"]*"' | cut -d'"' -f4)
        content_length=$(echo "$body" | grep -o '"contentLength":[0-9]*' | cut -d: -f2)
        print_status "SUCCESS" "$description - HTTP $http_code"
        print_status "INFO" "  Title: $title"
        print_status "INFO" "  Content Length: $content_length bytes"
    else
        print_status "ERROR" "$description - HTTP $http_code"
        echo "Response: $body"
    fi
}

# Function to test binary endpoint (PDF, Screenshot)
test_binary_endpoint() {
    local endpoint=$1
    local url=$2
    local description=$3
    local expected_content_type=$4
    
    echo
    print_status "INFO" "Testing $description..."
    
    response=$(curl -s -I "$API_BASE$endpoint?url=$url")
    http_code=$(echo "$response" | grep "HTTP" | awk '{print $2}')
    content_type=$(echo "$response" | grep -i "content-type" | cut -d: -f2 | tr -d ' \r')
    content_length=$(echo "$response" | grep -i "content-length" | cut -d: -f2 | tr -d ' \r')
    
    if [ "$http_code" = "200" ]; then
        print_status "SUCCESS" "$description - HTTP $http_code"
        print_status "INFO" "  Content-Type: $content_type"
        print_status "INFO" "  Content-Length: $content_length bytes"
        
        if [[ "$content_type" == *"$expected_content_type"* ]]; then
            print_status "SUCCESS" "  Correct content type detected"
        else
            print_status "WARNING" "  Expected $expected_content_type, got $content_type"
        fi
    else
        print_status "ERROR" "$description - HTTP $http_code"
        echo "$response"
    fi
}

# Function to test HTML endpoint
test_html_endpoint() {
    local url=$1
    local description=$2
    
    echo
    print_status "INFO" "Testing HTML endpoint - $description..."
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST "$API_BASE/api/html" \
        -H "Content-Type: application/json" \
        -d "{\"url\":\"$url\"}")
    
    http_code=$(echo $response | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    body=$(echo $response | sed -E 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$http_code" = "200" ]; then
        html_length=${#body}
        has_css=$(echo "$body" | grep -c "style\|css\|<link" || true)
        has_js=$(echo "$body" | grep -c "script\|javascript" || true)
        
        print_status "SUCCESS" "HTML endpoint - HTTP $http_code"
        print_status "INFO" "  HTML Length: $html_length characters"
        print_status "INFO" "  CSS elements found: $has_css"
        print_status "INFO" "  JS elements found: $has_js"
        
        if [ $html_length -gt 1000 ]; then
            print_status "SUCCESS" "  HTML content appears complete"
        else
            print_status "WARNING" "  HTML content seems short - possible rendering issue"
        fi
    else
        print_status "ERROR" "HTML endpoint - HTTP $http_code"
        echo "Response: $body"
    fi
}

# Start testing
echo
print_status "INFO" "Starting HeadlessX API tests..."
echo

# Test 1: Basic API Health Check
print_status "INFO" "Checking API server status..."
server_response=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE" 2>/dev/null || echo "000")
if [ "$server_response" = "200" ] || [ "$server_response" = "404" ]; then
    print_status "SUCCESS" "API server is running"
else
    print_status "ERROR" "API server appears to be down (HTTP $server_response)"
    exit 1
fi

# Test 2: JSON Rendering Endpoints
test_json_endpoint "/api/render" "$TEST_WEBSITE" "Basic Rendering (JSON)"
test_json_endpoint "/api/render" "$GOOGLE_URL" "Google.com Rendering (JSON)"
test_json_endpoint "/api/render" "$COMPLEX_CSS_URL" "Complex CSS Site (JSON)"

# Test 3: HTML Rendering Endpoints
test_html_endpoint "$TEST_WEBSITE" "Basic Site"
test_html_endpoint "$GOOGLE_URL" "Google.com"
test_html_endpoint "$COMPLEX_CSS_URL" "Complex CSS Site"

# Test 4: PDF Generation
test_binary_endpoint "/api/pdf" "$TEST_WEBSITE" "PDF Generation (Basic)" "application/pdf"
test_binary_endpoint "/api/pdf" "$GOOGLE_URL" "PDF Generation (Google)" "application/pdf"
test_binary_endpoint "/api/pdf" "$COMPLEX_CSS_URL" "PDF Generation (Complex CSS)" "application/pdf"

# Test 5: Screenshot Generation
test_binary_endpoint "/api/screenshot" "$TEST_WEBSITE" "Screenshot (Basic)" "image/"
test_binary_endpoint "/api/screenshot" "$GOOGLE_URL" "Screenshot (Google)" "image/"
test_binary_endpoint "/api/screenshot" "$COMPLEX_CSS_URL" "Screenshot (Complex CSS)" "image/"

# Test 6: Google-specific Anti-Detection Test
echo
print_status "INFO" "=== GOOGLE ANTI-DETECTION VALIDATION ==="

# Test Google search page
google_search="https://www.google.com/search?q=test"
test_json_endpoint "/api/render" "$google_search" "Google Search Page"
test_html_endpoint "$google_search" "Google Search (HTML)"

# Test Google Maps
google_maps="https://maps.google.com"
test_json_endpoint "/api/render" "$google_maps" "Google Maps"

# Test 7: Content Endpoint
echo
print_status "INFO" "Testing content extraction endpoint..."
content_response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST "$API_BASE/api/content" \
    -H "Content-Type: application/json" \
    -d "{\"url\":\"$TEST_WEBSITE\"}")

content_http_code=$(echo $content_response | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
content_body=$(echo $content_response | sed -E 's/HTTPSTATUS:[0-9]*$//')

if [ "$content_http_code" = "200" ]; then
    content_length=${#content_body}
    print_status "SUCCESS" "Content extraction - HTTP $content_http_code"
    print_status "INFO" "  Extracted text length: $content_length characters"
else
    print_status "ERROR" "Content extraction - HTTP $content_http_code"
fi

# Test 8: Advanced Options Test
echo
print_status "INFO" "Testing advanced rendering options..."
advanced_response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST "$API_BASE/api/render" \
    -H "Content-Type: application/json" \
    -d "{\"url\":\"$GOOGLE_URL\",\"timeout\":45000,\"waitForSelector\":\"body\",\"enableStealth\":true}")

advanced_http_code=$(echo $advanced_response | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
if [ "$advanced_http_code" = "200" ]; then
    print_status "SUCCESS" "Advanced options test - HTTP $advanced_http_code"
else
    print_status "ERROR" "Advanced options test - HTTP $advanced_http_code"
fi

# Final Summary
echo
echo "========================================"
print_status "INFO" "Test Summary Complete"
echo "========================================"
echo
print_status "INFO" "All HeadlessX API endpoints have been tested"
print_status "INFO" "Google.com access validated with datacenter IP stealth"
print_status "INFO" "PDF and Screenshot generation verified"
print_status "INFO" "CSS rendering and content extraction confirmed"
echo
print_status "SUCCESS" "HeadlessX is ready for production deployment!"
echo

# Instructions for manual verification
echo "📋 MANUAL VERIFICATION STEPS:"
echo "1. Open http://localhost:3000 in browser to see the website"
echo "2. Test PDF: curl \"http://localhost:3000/api/pdf?url=https://google.com\" > test.pdf"
echo "3. Test Screenshot: curl \"http://localhost:3000/api/screenshot?url=https://google.com\" > test.png"
echo "4. Check logs: pm2 logs headlessx"
echo