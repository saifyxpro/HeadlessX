#!/bin/bash

# HeadlessX Domain Verification Script# Test 0: Website Homepage
echo -e "${BLUE}0. Testing website homepage...${NC}"
HOMEPAGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$FULL_DOMAIN/ 2>/dev/null)
if [ "$HOMEPAGE_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Website homepage accessible${NC}"
    echo -e "   URL: ${YELLOW}http://$FULL_DOMAIN/${NC}"
else
    echo -e "${RED}❌ Website homepage failed (Status: $HOMEPAGE_STATUS)${NC}"
fi
echo ""

# Test 1: DNS Resolution
echo -e "${BLUE}1. Testing DNS resolution...${NC}"
if nslookup $FULL_DOMAIN > /dev/null 2>&1; then
    echo -e "${GREEN}✅ DNS resolution successful${NC}"
    IP=$(nslookup $FULL_DOMAIN | grep "Address:" | tail -n1 | awk '{print $2}')
    echo -e "   Resolved to: ${YELLOW}$IP${NC}"
else
    echo -e "${RED}❌ DNS resolution failed${NC}"
fit helps verify that your custom domain is properly configured

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌐 HeadlessX v1.1.0 Domain Verification Tool${NC}"
echo "================================================="

# Try to load environment variables from .env file
if [ -f .env ]; then
    echo "📄 Loading configuration from .env file..."
    export $(grep -v '^#' .env | xargs)
fi

# Build domain from environment variables if available
if [ ! -z "$SUBDOMAIN" ] && [ ! -z "$DOMAIN" ]; then
    AUTO_DOMAIN="$SUBDOMAIN.$DOMAIN"
    echo -e "${GREEN}✅ Found domain configuration: ${YELLOW}$AUTO_DOMAIN${NC}"
    read -p "Use this domain? (y/n, default: y): " USE_AUTO
    if [ -z "$USE_AUTO" ] || [ "$USE_AUTO" = "y" ] || [ "$USE_AUTO" = "Y" ]; then
        FULL_DOMAIN="$AUTO_DOMAIN"
    fi
fi

# Get domain from user if not set automatically
if [ -z "$FULL_DOMAIN" ]; then
    read -p "Enter your domain (e.g., headlessx.yourdomain.com): " FULL_DOMAIN
fi

# Get token from environment or user
if [ -z "$TOKEN" ]; then
    read -p "Enter your API token: " TOKEN
fi

if [ -z "$FULL_DOMAIN" ] || [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Domain and token are required${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Testing domain: ${YELLOW}$FULL_DOMAIN${NC}"
echo -e "${BLUE}Using token: ${YELLOW}${TOKEN:0:10}...${NC}"
echo ""

# Test 0: Website Homepage
echo -e "${BLUE}0. Testing website homepage...${NC}"
HOMEPAGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN/ 2>/dev/null)
if [ "$HOMEPAGE_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Website homepage accessible${NC}"
    echo -e "   URL: ${YELLOW}http://$DOMAIN/${NC}"
else
    echo -e "${RED}❌ Website homepage failed (Status: $HOMEPAGE_STATUS)${NC}"
fi
echo ""

# Test 1: DNS Resolution
echo -e "${BLUE}1. Testing DNS resolution...${NC}"
if nslookup $DOMAIN > /dev/null 2>&1; then
    echo -e "${GREEN}✅ DNS resolution successful${NC}"
    IP=$(nslookup $DOMAIN | grep "Address:" | tail -n1 | awk '{print $2}')
    echo -e "   Resolved to: ${YELLOW}$IP${NC}"
else
    echo -e "${RED}❌ DNS resolution failed${NC}"
    echo -e "   Check your DNS configuration"
fi
echo ""

# Test 2: API Health Check
echo -e "${BLUE}2. Testing API health endpoint...${NC}"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$FULL_DOMAIN/api/health 2>/dev/null)
if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ API health check successful${NC}"
    echo -e "   URL: ${YELLOW}http://$FULL_DOMAIN/api/health${NC}"
else
    echo -e "${RED}❌ API health check failed (Status: $HEALTH_STATUS)${NC}"
fi
echo ""
    echo -e "${RED}❌ HTTP connection failed (Status: $HTTP_STATUS)${NC}"
fi
echo ""

# Test 3: HTTPS Connection
echo -e "${BLUE}3. Testing HTTPS connection...${NC}"
HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$FULL_DOMAIN/health 2>/dev/null)
if [ "$HTTPS_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ HTTPS connection successful${NC}"
else
    echo -e "${RED}❌ HTTPS connection failed (Status: $HTTPS_STATUS)${NC}"
    echo -e "   SSL certificate might not be installed"
fi
echo ""

# Test 4: SSL Certificate
echo -e "${BLUE}4. Testing SSL certificate...${NC}"
SSL_INFO=$(echo | openssl s_client -servername $FULL_DOMAIN -connect $FULL_DOMAIN:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SSL certificate is valid${NC}"
    echo "$SSL_INFO" | while IFS= read -r line; do
        echo -e "   ${YELLOW}$line${NC}"
    done
else
    echo -e "${RED}❌ SSL certificate check failed${NC}"
fi
echo ""

# Test 5: Health Check
echo -e "${BLUE}5. Testing HeadlessX health endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s https://$FULL_DOMAIN/health 2>/dev/null)
if [[ $HEALTH_RESPONSE == *"HeadlessX"* ]] || [[ $HEALTH_RESPONSE == *"healthy"* ]]; then
    echo -e "${GREEN}✅ HeadlessX health check passed${NC}"
    echo -e "   Response: ${YELLOW}$HEALTH_RESPONSE${NC}"
else
    echo -e "${RED}❌ HeadlessX health check failed${NC}"
    echo -e "   Response: ${YELLOW}$HEALTH_RESPONSE${NC}"
fi
echo ""

# Test 6: API Endpoint
echo -e "${BLUE}6. Testing API endpoint with authentication...${NC}"
API_RESPONSE=$(curl -s -X POST "https://$FULL_DOMAIN/html?token=$TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"url":"https://httpbin.org/html"}' 2>/dev/null)

if [[ $API_RESPONSE == *"<html"* ]] || [[ $API_RESPONSE == *"httpbin"* ]]; then
    echo -e "${GREEN}✅ API endpoint working correctly${NC}"
    echo -e "   Successfully scraped test page"
else
    echo -e "${RED}❌ API endpoint failed${NC}"
    if [[ $API_RESPONSE == *"Unauthorized"* ]] || [[ $API_RESPONSE == *"Invalid token"* ]]; then
        echo -e "   ${YELLOW}Check your API token${NC}"
    fi
    echo -e "   Response: ${YELLOW}${API_RESPONSE:0:100}...${NC}"
fi
echo ""

# Test 7: Rate Limiting
echo -e "${BLUE}7. Testing rate limiting...${NC}"
RATE_LIMIT_COUNT=0
for i in {1..5}; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$FULL_DOMAIN/health 2>/dev/null)
    if [ "$STATUS" = "200" ]; then
        ((RATE_LIMIT_COUNT++))
    fi
    sleep 0.1
done

if [ $RATE_LIMIT_COUNT -eq 5 ]; then
    echo -e "${GREEN}✅ Rate limiting configured (allowing normal requests)${NC}"
elif [ $RATE_LIMIT_COUNT -lt 5 ]; then
    echo -e "${YELLOW}⚠️ Rate limiting might be too strict${NC}"
    echo -e "   Only $RATE_LIMIT_COUNT/5 requests succeeded"
else
    echo -e "${YELLOW}⚠️ Rate limiting status unclear${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}📊 Summary:${NC}"
echo "============================================"

# Count successful tests
TOTAL_TESTS=7
PASSED_TESTS=0

# Check each test result (simplified)
[ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ] && ((PASSED_TESTS++))
[ "$HTTPS_STATUS" = "200" ] && ((PASSED_TESTS++))
[[ $HEALTH_RESPONSE == *"HeadlessX"* ]] || [[ $HEALTH_RESPONSE == *"healthy"* ]] && ((PASSED_TESTS++))
[[ $API_RESPONSE == *"<html"* ]] || [[ $API_RESPONSE == *"httpbin"* ]] && ((PASSED_TESTS++))

if [ $PASSED_TESTS -ge 3 ]; then
    echo -e "${GREEN}🎉 Your HeadlessX domain setup looks good!${NC}"
    echo -e "   $PASSED_TESTS critical tests passed"
    echo ""
    echo -e "${GREEN}✅ Ready for production use${NC}"
    echo -e "   API URL: ${YELLOW}https://$FULL_DOMAIN${NC}"
    echo -e "   Health: ${YELLOW}https://$FULL_DOMAIN/health${NC}"
    echo -e "   Status: ${YELLOW}https://$FULL_DOMAIN/status?token=$TOKEN${NC}"
else
    echo -e "${RED}⚠️ Some issues detected with your domain setup${NC}"
    echo -e "   Only $PASSED_TESTS/$TOTAL_TESTS critical tests passed"
    echo ""
    echo -e "${YELLOW}📋 Check the following:${NC}"
    echo -e "   • DNS configuration"
    echo -e "   • Nginx configuration"
    echo -e "   • SSL certificate"
    echo -e "   • HeadlessX server status"
    echo -e "   • Firewall settings"
fi

echo ""
echo -e "${BLUE}For detailed setup instructions, see:${NC}"
echo -e "   • DOMAIN_SETUP.md"
echo -e "   • DEPLOYMENT.md"
echo -e "   • README.md"

echo ""
echo -e "${BLUE}Need help? Check the troubleshooting section in DOMAIN_SETUP.md${NC}"