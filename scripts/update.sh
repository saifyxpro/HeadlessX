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
echo "🚀 Starting HeadlessX with PM2..."
pm2 start ecosystem.config.js
pm2 save
print_status "HeadlessX restarted"

# Test server
echo "🧪 Testing server..."
sleep 5

if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_status "Server is responding"
else
    print_warning "Server may not be fully ready yet"
fi

echo ""
echo "🎉 HeadlessX v1.2.0 Update completed successfully!"
echo "================================================="
echo ""
echo -e "${GREEN}✅ Update Summary:${NC}"
echo "   - Code updated from GitHub"
echo "   - Dependencies updated"
echo "   - Website rebuilt"
echo "   - PM2 restarted"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Check server status:"
echo "   pm2 status"
echo "   pm2 logs headlessx"
echo ""
echo "2. Test your API:"
echo "   curl http://localhost:3000/api/health"
echo ""
echo "3. Monitor performance:"
echo "   pm2 monit"
echo ""
echo "📚 Visit https://github.com/SaifyXPRO/HeadlessX for documentation"
echo ""