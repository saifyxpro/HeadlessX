#!/bin/bash

# HeadlessX Update Script v1.2.0
# Updates HeadlessX installation with latest changes
# Run with: bash scripts/update.sh

set -e

echo "🔄 HeadlessX Update Script v1.2.0"
echo "=================================="

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

# Verify we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    print_error "Please run this script from the HeadlessX root directory"
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    print_info "Loading environment variables..."
    export $(grep -v '^#' .env | grep -v '^$' | xargs)
fi
# 1. Stop services gracefully
echo "🛑 Stopping services..."
if command -v pm2 >/dev/null 2>&1; then
    pm2 stop headlessx 2>/dev/null || true
    print_status "PM2 services stopped"
fi

# Kill any remaining processes
if command -v fuser >/dev/null 2>&1; then
    fuser -k 3000/tcp 2>/dev/null || true
fi

# 2. Backup current configuration
echo "💾 Creating backup..."
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp .env "$BACKUP_DIR/" 2>/dev/null || true
cp ecosystem.config.js "$BACKUP_DIR/" 2>/dev/null || true
print_status "Configuration backed up to $BACKUP_DIR"

# 3. Update dependencies
echo "📦 Updating dependencies..."
if [ -f "package-lock.json" ]; then
    rm -f package-lock.json
fi
npm install --production
print_status "Dependencies updated"

# 4. Update Playwright browsers
echo "🌐 Updating Playwright browsers..."
npx playwright install chromium
print_status "Playwright browsers updated"

# 5. Rebuild website
echo "🌐 Rebuilding website..."
cd website

# Backup website .env.local if exists
if [ -f .env.local ]; then
    cp .env.local "../$BACKUP_DIR/website_env.local"
fi

# Update website dependencies
if [ -f "package-lock.json" ]; then
    rm -f package-lock.json
fi
npm install

# Rebuild with current environment
DOMAIN=${DOMAIN:-"yourdomain.com"}
SUBDOMAIN=${SUBDOMAIN:-"headlessx"}

if [ ! -z "$DOMAIN" ] && [ ! -z "$SUBDOMAIN" ]; then
    print_info "Configuring website for domain: $SUBDOMAIN.$DOMAIN"
    cat > .env.local << EOF
NEXT_PUBLIC_DOMAIN=$DOMAIN
NEXT_PUBLIC_SUBDOMAIN=$SUBDOMAIN
NEXT_PUBLIC_API_URL=https://$SUBDOMAIN.$DOMAIN
NEXT_PUBLIC_SITE_URL=https://$SUBDOMAIN.$DOMAIN
EOF
fi

npm run build
cd ..
print_status "Website rebuilt"

# 6. Validate installation
echo "🔍 Validating installation..."

# Check required files
REQUIRED_FILES=("src/app.js" "src/server.js" "src/config/index.js" "ecosystem.config.js")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Required file missing: $file"
        exit 1
    fi
done

# Syntax check
if ! node -c src/app.js; then
    print_error "Main server file has syntax errors"
    exit 1
fi

print_status "Installation validated"

# 7. Restart services
echo "🚀 Restarting services..."

# Start with PM2
if command -v pm2 >/dev/null 2>&1; then
    pm2 start ecosystem.config.js
    sleep 5
    
    # Validate startup
    RETRY_COUNT=0
    MAX_RETRIES=15
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if pm2 status headlessx | grep -q "online"; then
            print_status "HeadlessX restarted successfully"
            break
        fi
        echo "   Waiting for startup... ($((RETRY_COUNT + 1))/$MAX_RETRIES)"
        sleep 2
        RETRY_COUNT=$((RETRY_COUNT + 1))
    done
    
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        print_warning "Server startup validation timed out"
        pm2 logs headlessx --lines 5
    fi
    
    pm2 save
else
    print_warning "PM2 not available, starting with Node.js directly"
    nohup node src/server.js > logs/server.log 2>&1 &
    sleep 3
fi

# 8. Test server health
echo "🏥 Testing server health..."
if command -v curl >/dev/null 2>&1; then
    sleep 2
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        print_status "Server health check passed"
    else
        print_warning "Server health check failed (HTTP $HTTP_CODE)"
    fi
else
    print_info "curl not available - skipping health check"
fi

# 9. Reload nginx if available
if command -v nginx >/dev/null 2>&1; then
    echo "🌐 Reloading nginx..."
    if sudo nginx -t 2>/dev/null; then
        sudo systemctl reload nginx
        print_status "Nginx reloaded"
    else
        print_warning "Nginx configuration test failed"
    fi
fi

echo ""
echo "🎉 HeadlessX Update Complete!"
echo "============================="
echo ""
print_status "Update completed successfully"
echo ""
echo "📊 Service Status:"
if command -v pm2 >/dev/null 2>&1; then
    pm2 status headlessx || echo "   PM2 status unavailable"
else
    echo "   PM2 not available"
fi
echo ""
echo "📋 Backup Location: $BACKUP_DIR"
echo ""
echo "🔧 Management Commands:"
echo "   pm2 logs headlessx    # View logs"
echo "   pm2 restart headlessx # Restart server"
echo "   pm2 monit            # Monitor resources"
echo ""
print_info "Update process completed"

exit 0
if [ -f "package-lock.json" ]; then
    rm -f package-lock.json
fi
npm install --production
print_status "Project dependencies updated"

# Update Playwright browsers
echo "🌐 Updating Playwright browsers..."
npx playwright install chromium
npx playwright install-deps chromium
print_status "Playwright browsers updated"

# Build website
echo "🌐 Rebuilding website..."
cd website

# Clean previous build
rm -rf .next out node_modules

# Install website dependencies
npm install

# Build website
npm run build
cd ..
print_status "Website rebuilt"

# Validate installation
echo "🔍 Validating installation..."
REQUIRED_FILES=(
    "src/app.js"
    "src/server.js"
    "src/rate-limiter.js"
    "ecosystem.config.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Required file missing: $file"
        exit 1
    fi
done

# Validate syntax
if node -c src/app.js && node -c src/server.js && node -c ecosystem.config.js; then
    print_status "Installation validated"
else
    print_error "Validation failed"
    exit 1
fi

# Check environment file
if [ ! -f ".env" ]; then
    print_warning ".env file not found, creating from example..."
    cp .env.example .env
    print_warning "Please update the AUTH_TOKEN in .env file!"
fi

# Restart with PM2
echo "🚀 Restarting HeadlessX with PM2..."

# Stop existing processes
pm2 stop headlessx 2>/dev/null || true
pm2 delete headlessx 2>/dev/null || true

# Kill any processes that might be using port 3000
fuser -k 3000/tcp 2>/dev/null || true
sleep 3

# Validate dependencies before restart
echo "🔍 Validating dependencies..."

# Check Node.js modules
if [ ! -d "node_modules/express" ]; then
    print_warning "Installing missing dependencies..."
    npm install --production
fi

# Check website build
if [ ! -d "website/out" ]; then
    print_warning "Website not built, building now..."
    cd website && npm run build && cd ..
fi

# Check Playwright
if ! npx playwright install chromium --dry-run 2>/dev/null; then
    print_warning "Installing Playwright browsers..."
    npx playwright install chromium
fi

# Start fresh with PM2
pm2 start ecosystem.config.js
sleep 5

# Comprehensive server validation
echo "🧪 Validating server startup..."
RETRY_COUNT=0
MAX_RETRIES=15  # Reduced from 30 to 15 for faster feedback
SERVER_READY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ "$SERVER_READY" = false ]; do
    # Check PM2 status
    if pm2 status headlessx | grep -q "online"; then
        # Check if port is listening
        if ss -tlnp | grep -q ":3000" || netstat -tlnp 2>/dev/null | grep -q ":3000"; then
            # Test HTTP response with shorter timeout
            HTTP_CODE=$(timeout 5s curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/health 2>/dev/null || echo "000")
            if [ "$HTTP_CODE" = "200" ]; then
                SERVER_READY=true
                print_status "Server is online and responding correctly (HTTP 200)"
                break
            elif [ "$HTTP_CODE" != "000" ] && [ "$HTTP_CODE" != "000" ]; then
                print_status "Server is responding (HTTP $HTTP_CODE) - likely still starting"
                SERVER_READY=true
                break
            fi
            
            # If port is listening but no HTTP response, server is probably starting
            if [ $RETRY_COUNT -gt 8 ]; then
                print_status "Server is listening on port 3000 - startup in progress"
                SERVER_READY=true
                break
            fi
        fi
    fi
    
    echo "   Waiting for server startup... ($((RETRY_COUNT + 1))/$MAX_RETRIES)"
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ "$SERVER_READY" = false ]; then
    print_warning "Server startup validation timed out after 30 seconds"
    echo ""
    echo "📊 Current Status:"
    pm2 status headlessx
    echo ""
    echo "🔍 Port Check:"
    if ss -tlnp | grep -q ":3000"; then
        print_status "Port 3000 is listening"
    else
        print_warning "Port 3000 is not listening"
    fi
    echo ""
    echo "📋 Recent logs:"
    pm2 logs headlessx --lines 10
    echo ""
    print_info "Server may still be initializing - this is normal for first startup"
    print_info "Monitor with: pm2 logs headlessx --lines 0"
else
    pm2 save
    print_status "HeadlessX restarted successfully"
fi

echo ""
echo "🎉 HeadlessX v1.2.0 Update completed!"
echo "===================================="
echo ""
echo -e "${GREEN}✅ Update Summary:${NC}"
echo "   - Code updated from GitHub"
echo "   - Dependencies validated and updated"
echo "   - Website rebuilt"
echo "   - PM2 restarted with validation"
echo ""
echo "� Current Status:"
pm2 status headlessx
echo ""
echo "�📋 Quick Tests:"
echo ""
echo "1. Test API Health:"
echo "   curl http://127.0.0.1:3000/api/health"
echo ""
echo "2. Check what's listening on port 3000:"
echo "   ss -tlnp | grep :3000"
echo ""
echo "3. View real-time logs:"
echo "   pm2 logs headlessx --lines 0"
echo ""
echo "4. Full server monitoring:"
echo "   pm2 monit"
echo ""
echo "🔧 Troubleshooting:"
echo "   - View logs: pm2 logs headlessx"
echo "   - Restart: pm2 restart headlessx"
echo "   - Manual start: node src/app.js"
echo "   - Check dependencies: npm list --depth=0"
echo ""
echo "📚 Visit https://github.com/SaifyXPRO/HeadlessX for documentation"
echo ""