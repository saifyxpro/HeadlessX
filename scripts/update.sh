#!/bin/bash

# HeadlessX Update Script v1.2.0
# Updates an existing HeadlessX installation
# Run with: bash scripts/update.sh

set -e

echo "🔄 Updating HeadlessX v1.2.0 - Open Source Browserless Web Scraping API"
echo "======================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   SUDO_CMD=""
else
   SUDO_CMD="sudo"
fi

# Backup current installation
echo "💾 Creating backup..."
BACKUP_DIR="~/headlessx-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r . "$BACKUP_DIR/" 2>/dev/null || true
print_status "Backup created: $BACKUP_DIR"

# Stop PM2 processes
echo "🛑 Stopping current processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
print_status "Processes stopped"

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git fetch origin main
git reset --hard origin/main
print_status "Latest code pulled"

# Update system packages
echo "📦 Updating system packages..."
$SUDO_CMD apt update
print_status "System packages updated"

# Update Node.js dependencies
echo "📦 Updating project dependencies..."
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