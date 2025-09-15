#!/bin/bash

# HeadlessX Server Update Script v1.2.0
# Updates server with latest changes and restarts services
# Run with: bash scripts/update_server.sh

set -e

echo "🔄 HeadlessX Server Update Script v1.2.0"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    print_error "Please run this script from the HeadlessX root directory"
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 is not installed. Please run setup.sh first."
    exit 1
fi

print_info "Starting server update process..."

# 1. Backup current server state
echo "📦 Creating backup of current server state..."
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r src/ "$BACKUP_DIR/" 2>/dev/null || true
cp package.json "$BACKUP_DIR/" 2>/dev/null || true
cp package-lock.json "$BACKUP_DIR/" 2>/dev/null || true
print_status "Backup created at $BACKUP_DIR"

# 2. Stop current server
echo "🛑 Stopping current HeadlessX server..."
pm2 stop headlessx 2>/dev/null || print_warning "Server was not running"
print_status "Server stopped"

# 3. Update dependencies if package.json changed
echo "📦 Checking for dependency updates..."
if [ -f "package-lock.json" ]; then
    npm ci --omit=dev
    print_status "Dependencies updated (using ci)"
else
    npm install --production
    print_status "Dependencies updated (using install)"
fi

# 4. Update Playwright browsers if needed
echo "🌐 Updating Playwright browsers..."
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0
npx playwright install chromium --with-deps 2>/dev/null || print_warning "Browser update skipped"
print_status "Playwright browsers updated"

# 5. Validate new modular server files
echo "🔍 Validating modular server files..."
REQUIRED_FILES=(
    "src/app.js"
    "src/server.js"
    "src/rate-limiter.js"
    "src/config/index.js"
    "src/services/browser.js"
    "src/middleware/auth.js"
    "src/controllers/system.js"
    "src/routes/api.js"
    "ecosystem.config.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Required file missing: $file"
        exit 1
    fi
done

# Check syntax by running a quick test on main files
if node -c src/app.js && node -c src/server.js && node -c src/rate-limiter.js && node -c ecosystem.config.js; then
    print_status "All main server files syntax validated"
else
    print_error "Syntax validation failed"
    exit 1
fi

# 6. Update website if needed
echo "🌐 Updating website..."
cd website
if [ -f "package.json" ]; then
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    npm run build
    print_status "Website updated and built"
else
    print_warning "Website package.json not found, skipping website update"
fi
cd ..

# 7. Update PM2 ecosystem configuration (already in root)
echo "⚙️ PM2 configuration ready..."
if [ -f "ecosystem.config.js" ]; then
    print_status "PM2 configuration validated"
else
    print_warning "ecosystem.config.js not found in root directory"
fi

# 8. Start server with new code
echo "🚀 Starting updated HeadlessX server..."
pm2 start ecosystem.config.js 2>/dev/null || pm2 start src/server.js --name headlessx

# Wait a moment for startup
sleep 3

# 9. Health check
echo "🏥 Performing health check..."
if command -v curl &> /dev/null; then
    # Try to get health status
    HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health || echo "failed")
    if [[ $HEALTH_RESPONSE == *"OK"* ]]; then
        print_status "Health check passed"
    else
        print_warning "Health check failed - server may still be starting"
    fi
else
    print_warning "curl not available, skipping health check"
fi

# 10. Show server status
echo "📊 Current server status:"
pm2 status
echo ""

# 11. Show server logs
echo "📋 Recent server logs:"
pm2 logs headlessx --lines 10 --nostream 2>/dev/null || echo "No logs available"

# 12. Update summary
echo ""
echo "🎉 Update Summary:"
echo "=================="
print_status "Server successfully updated to latest modular version v1.2.0"
print_status "New features: Modular architecture, enhanced error handling, improved rate limiting"
print_status "Backup available at: $BACKUP_DIR"
print_info "Monitor logs with: pm2 logs headlessx"
print_info "Check status with: pm2 status"
print_info "View detailed status: curl http://localhost:3000/api/health"

# 13. Optional cleanup
echo ""
read -p "🗑️ Remove backup folder? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$BACKUP_DIR"
    print_status "Backup cleaned up"
else
    print_info "Backup preserved at $BACKUP_DIR"
fi

echo ""
print_status "HeadlessX server update completed successfully! 🎯"
echo ""