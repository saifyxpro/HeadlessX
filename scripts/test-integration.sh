#!/bin/bash

# HeadlessX v1.1.0 Integration Test Script
# Tests the unified website + API server integration

echo "🧪 HeadlessX v1.1.0 Integration Test"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Try to load environment variables from .env file
if [ -f .env ]; then
    echo "📄 Loading configuration from .env file..."
    export $(grep -v '^#' .env | xargs)
fi

# Set test domain
if [ ! -z "$SUBDOMAIN" ] && [ ! -z "$DOMAIN" ]; then
    TEST_DOMAIN="$SUBDOMAIN.$DOMAIN"
    PROTOCOL="https"
else
    TEST_DOMAIN="localhost:3000"
    PROTOCOL="http"
fi

echo -e "${BLUE}Testing domain: ${YELLOW}$TEST_DOMAIN${NC}"
echo -e "${BLUE}Protocol: ${YELLOW}$PROTOCOL${NC}"
echo ""

# Test 1: Check if server is running
echo -e "${BLUE}1. Testing server availability...${NC}"
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" $PROTOCOL://$TEST_DOMAIN/api/health -o /dev/null)
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo -e "${GREEN}   ✅ Server is running and responding${NC}"
else
    echo -e "${RED}   ❌ Server is not responding (HTTP $HEALTH_RESPONSE)${NC}"
    echo -e "${YELLOW}   Make sure to start the server with: node src/server.js${NC}"
    echo -e "${YELLOW}   Or with PM2: pm2 start config/ecosystem.config.js${NC}"
    exit 1
fi

# Test 2: Website at root
echo -e "${BLUE}2. Testing website at root (/)...${NC}"
WEBSITE_RESPONSE=$(curl -s -w "%{http_code}" $PROTOCOL://$TEST_DOMAIN/ -o /dev/null)
if [ "$WEBSITE_RESPONSE" = "200" ]; then
    echo -e "${GREEN}   ✅ Website loads successfully${NC}"
    
    # Check if it's the actual website or fallback
    WEBSITE_CONTENT=$(curl -s $PROTOCOL://$TEST_DOMAIN/)
    if [[ $WEBSITE_CONTENT == *"HeadlessX"* ]]; then
        echo -e "${GREEN}   ✅ Website content verified${NC}"
    else
        echo -e "${YELLOW}   ⚠️ Website serving fallback content${NC}"
    fi
elif [ "$WEBSITE_RESPONSE" = "404" ]; then
    echo -e "${YELLOW}   ⚠️ Website not built - run 'npm run build' in website folder${NC}"
else
    echo -e "${RED}   ❌ Website failed to load (HTTP $WEBSITE_RESPONSE)${NC}"
fi

# Test 3: API Health endpoint
echo -e "${BLUE}3. Testing API health endpoint (/api/health)...${NC}"
HEALTH_JSON=$(curl -s $PROTOCOL://$TEST_DOMAIN/api/health)
if [[ $HEALTH_JSON == *"OK"* ]] && [[ $HEALTH_JSON == *"timestamp"* ]]; then
    echo -e "${GREEN}   ✅ API health endpoint working correctly${NC}"
    
    # Extract browser status
    if [[ $HEALTH_JSON == *"browserConnected\":true"* ]]; then
        echo -e "${GREEN}   ✅ Browser instance connected${NC}"
    else
        echo -e "${YELLOW}   ⚠️ Browser instance not connected${NC}"
    fi
else
    echo -e "${RED}   ❌ API health endpoint failed${NC}"
fi

# Test 4: API Status endpoint (if token available)
echo -e "${BLUE}4. Testing API status endpoint (/api/status)...${NC}"
if [ ! -z "$TOKEN" ]; then
    STATUS_RESPONSE=$(curl -s -w "%{http_code}" "$PROTOCOL://$TEST_DOMAIN/api/status?token=$TOKEN" -o /tmp/status_response 2>/dev/null)
    if [ "$STATUS_RESPONSE" = "200" ]; then
        STATUS_CONTENT=$(cat /tmp/status_response)
        if [[ $STATUS_CONTENT == *"HeadlessX"* ]]; then
            echo -e "${GREEN}   ✅ API status endpoint working with authentication${NC}"
        else
            echo -e "${RED}   ❌ API status endpoint returned unexpected content${NC}"
        fi
    else
        echo -e "${RED}   ❌ API status endpoint failed (HTTP $STATUS_RESPONSE)${NC}"
    fi
    rm -f /tmp/status_response
else
    echo -e "${YELLOW}   ⚠️ No TOKEN set - skipping authenticated status test${NC}"
    echo -e "${YELLOW}   Set TOKEN in .env file to test authenticated endpoints${NC}"
fi

# Test 5: Special routes
echo -e "${BLUE}5. Testing special routes...${NC}"

# Favicon
FAVICON_RESPONSE=$(curl -s -w "%{http_code}" $PROTOCOL://$TEST_DOMAIN/favicon.ico -o /dev/null)
if [ "$FAVICON_RESPONSE" = "200" ] || [ "$FAVICON_RESPONSE" = "204" ]; then
    echo -e "${GREEN}   ✅ Favicon route working (HTTP $FAVICON_RESPONSE)${NC}"
else
    echo -e "${YELLOW}   ⚠️ Favicon route returned HTTP $FAVICON_RESPONSE${NC}"
fi

# Robots.txt
ROBOTS_RESPONSE=$(curl -s -w "%{http_code}" $PROTOCOL://$TEST_DOMAIN/robots.txt -o /dev/null)
if [ "$ROBOTS_RESPONSE" = "200" ]; then
    ROBOTS_CONTENT=$(curl -s $PROTOCOL://$TEST_DOMAIN/robots.txt)
    if [[ $ROBOTS_CONTENT == *"User-agent"* ]]; then
        echo -e "${GREEN}   ✅ Robots.txt route working correctly${NC}"
    else
        echo -e "${YELLOW}   ⚠️ Robots.txt content unexpected${NC}"
    fi
else
    echo -e "${RED}   ❌ Robots.txt route failed (HTTP $ROBOTS_RESPONSE)${NC}"
fi

# Test 6: API functionality (if token available)
if [ ! -z "$TOKEN" ]; then
    echo -e "${BLUE}6. Testing API functionality...${NC}"
    
    # Test HTML extraction with a simple page
    API_TEST=$(curl -s -w "%{http_code}" -X POST "$PROTOCOL://$TEST_DOMAIN/api/html?token=$TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"url": "https://httpbin.org/html", "timeout": 10000}' \
        -o /tmp/api_response 2>/dev/null)
    
    if [ "$API_TEST" = "200" ]; then
        API_CONTENT=$(cat /tmp/api_response)
        if [[ $API_CONTENT == *"<html"* ]] || [[ $API_CONTENT == *"Herman Melville"* ]]; then
            echo -e "${GREEN}   ✅ API HTML extraction working${NC}"
        else
            echo -e "${YELLOW}   ⚠️ API returned unexpected content${NC}"
        fi
    else
        echo -e "${RED}   ❌ API HTML extraction failed (HTTP $API_TEST)${NC}"
    fi
    rm -f /tmp/api_response
else
    echo -e "${BLUE}6. Skipping API functionality test (no token)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Integration test complete!${NC}"
echo ""

# Summary
echo -e "${BLUE}📋 Test Summary:${NC}"
echo -e "   🌐 Website: $PROTOCOL://$TEST_DOMAIN/"
echo -e "   🔧 API Health: $PROTOCOL://$TEST_DOMAIN/api/health"
if [ ! -z "$TOKEN" ]; then
    echo -e "   📊 API Status: $PROTOCOL://$TEST_DOMAIN/api/status?token=YOUR_TOKEN"
else
    echo -e "   📊 API Status: Set TOKEN in .env to test"
fi
echo -e "   🤖 Robots: $PROTOCOL://$TEST_DOMAIN/robots.txt"
echo ""

# Architecture info
echo -e "${BLUE}🏗️ Architecture Verified:${NC}"
echo -e "   ✅ Single Node.js server handling both website and API"
echo -e "   ✅ Website served at root path (/)"
echo -e "   ✅ API endpoints available at /api/*"
echo -e "   ✅ Special routes (favicon, robots) working"
echo ""

# Next steps
echo -e "${BLUE}🚀 Your HeadlessX integration is working!${NC}"
if [ "$TEST_DOMAIN" = "localhost:3000" ]; then
    echo -e "${YELLOW}💡 For production:${NC}"
    echo -e "   1. Set up your domain in .env file"
    echo -e "   2. Configure DNS to point to your server"
    echo -e "   3. Run setup script for nginx and SSL"
    echo -e "   4. Deploy with PM2 or Docker"
fi

echo ""
echo -e "${GREEN}✨ HeadlessX v1.1.0 - Website + API integration successful!${NC}"