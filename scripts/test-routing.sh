#!/bin/bash

# HeadlessX v1.1.0 Domain Routing Test Script
# This script tests that the domain routing is properly configured

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌐 HeadlessX v1.1.0 Domain Routing Test${NC}"
echo "============================================="

# Try to load environment variables from .env file
if [ -f .env ]; then
    echo "📄 Loading configuration from .env file..."
    export $(grep -v '^#' .env | xargs)
fi

# Check if running locally or on server
if [ -z "$1" ]; then
    # If no argument provided, try to use environment variables
    if [ ! -z "$SUBDOMAIN" ] && [ ! -z "$DOMAIN" ]; then
        FULL_DOMAIN="$SUBDOMAIN.$DOMAIN"
        echo -e "${GREEN}✅ Using domain from environment: ${YELLOW}$FULL_DOMAIN${NC}"
        DOMAIN="$FULL_DOMAIN"
    else
        echo "Usage: $0 [localhost|domain.com]"
        echo "Example: $0 localhost"
        echo "Example: $0 headlessx.yourdomain.com"
        echo ""
        echo "Or set DOMAIN and SUBDOMAIN in .env file:"
        echo "  DOMAIN=yourdomain.com"
        echo "  SUBDOMAIN=headlessx"
        exit 1
    fi
else
    DOMAIN=$1
fi

echo -e "${BLUE}Testing domain: ${YELLOW}$DOMAIN${NC}"
echo ""

# Test 1: Website Homepage
echo -e "${BLUE}1. Testing website homepage...${NC}"
if [[ "$DOMAIN" == "localhost" ]]; then
    HOMEPAGE_URL="http://localhost"
else
    HOMEPAGE_URL="http://$DOMAIN"
fi

HOMEPAGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HOMEPAGE_URL" 2>/dev/null || echo "000")
if [ "$HOMEPAGE_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Website homepage accessible${NC}"
    echo -e "   URL: ${YELLOW}$HOMEPAGE_URL${NC}"
else
    echo -e "${RED}❌ Website homepage failed (Status: $HOMEPAGE_STATUS)${NC}"
    echo -e "   Check Nginx configuration for root / location"
fi
echo ""

# Test 2: API Health Check  
echo -e "${BLUE}2. Testing API health endpoint...${NC}"
if [[ "$DOMAIN" == "localhost" ]]; then
    HEALTH_URL="http://localhost/api/health"
else
    HEALTH_URL="http://$DOMAIN/api/health"
fi

HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ API health endpoint accessible${NC}"
    echo -e "   URL: ${YELLOW}$HEALTH_URL${NC}"
else
    echo -e "${RED}❌ API health endpoint failed (Status: $HEALTH_STATUS)${NC}"
    echo -e "   Check Nginx configuration for /api/ location"
fi
echo ""

# Test 3: API Status Check
echo -e "${BLUE}3. Testing API status endpoint...${NC}"
if [[ "$DOMAIN" == "localhost" ]]; then
    STATUS_URL="http://localhost/api/status"
else
    STATUS_URL="http://$DOMAIN/api/status"
fi

STATUS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$STATUS_URL" 2>/dev/null || echo "000")
if [ "$STATUS_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ API status endpoint accessible${NC}"
    echo -e "   URL: ${YELLOW}$STATUS_URL${NC}"
else
    echo -e "${RED}❌ API status endpoint failed (Status: $STATUS_STATUS)${NC}"
fi
echo ""

# Test 4: Static Assets (if website is working)
if [ "$HOMEPAGE_STATUS" = "200" ]; then
    echo -e "${BLUE}4. Testing static assets...${NC}"
    if [[ "$DOMAIN" == "localhost" ]]; then
        CSS_URL="http://localhost/_next/static/css/"
    else
        CSS_URL="http://$DOMAIN/_next/static/css/"
    fi
    
    # Just check if we can reach the static directory (may 404 but should not 502/503)
    CSS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$CSS_URL" 2>/dev/null || echo "000")
    if [ "$CSS_STATUS" = "404" ] || [ "$CSS_STATUS" = "403" ] || [ "$CSS_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ Static assets routing working${NC}"
    else
        echo -e "${YELLOW}⚠️  Static assets may have issues (Status: $CSS_STATUS)${NC}"
    fi
    echo ""
fi

# Summary
echo -e "${BLUE}📊 Test Summary${NC}"
echo "==============="

if [ "$HOMEPAGE_STATUS" = "200" ] && [ "$HEALTH_STATUS" = "200" ] && [ "$STATUS_STATUS" = "200" ]; then
    echo -e "${GREEN}🎉 All tests passed! Domain routing is working correctly.${NC}"
    echo ""
    echo -e "${GREEN}✅ Website: $HOMEPAGE_URL${NC}"
    echo -e "${GREEN}✅ API Health: $HEALTH_URL${NC}" 
    echo -e "${GREEN}✅ API Status: $STATUS_URL${NC}"
    echo ""
    echo -e "${BLUE}🚀 Your HeadlessX v1.1.0 deployment is ready!${NC}"
else
    echo -e "${RED}❌ Some tests failed. Check your configuration:${NC}"
    echo ""
    echo -e "${YELLOW}1. Verify Nginx configuration is correct${NC}"
    echo -e "${YELLOW}2. Check that HeadlessX API server is running on port 3000${NC}"
    echo -e "${YELLOW}3. Ensure website files are in /var/www/headlessx${NC}"
    echo -e "${YELLOW}4. Check Nginx error logs: sudo tail -f /var/log/nginx/error.log${NC}"
fi
echo ""