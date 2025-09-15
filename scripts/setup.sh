#!/bin/bash

# HeadlessX Complete Setup Script v1.2.0
# Sets up HeadlessX from scratch on Ubuntu/Debian servers
# Run with: bash setup.sh

set -e

echo "🚀 Setting up HeadlessX v1.2.0 - Open Source Browserless Web Scraping API"
echo "=========================================================================="

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

# Set default domain values if not in environment
DOMAIN=${DOMAIN:-"yourdomain.com"}
SUBDOMAIN=${SUBDOMAIN:-"headlessx"}
FULL_DOMAIN="$SUBDOMAIN.$DOMAIN"

echo -e "${GREEN}✅ Configuration loaded:${NC}"
echo -e "   Domain: ${YELLOW}$FULL_DOMAIN${NC}"
echo ""

# Check if running as root and warn (but allow)
if [[ $EUID -eq 0 ]]; then
   echo -e "${YELLOW}⚠️ Warning: Running as root user${NC}"
   echo -e "${YELLOW}   For production, consider running as a regular user with sudo privileges${NC}"
   echo -e "${YELLOW}   Continuing setup...${NC}"
   echo ""
   SUDO_CMD=""
else
   SUDO_CMD="sudo"
fi

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

# Update system
echo "📦 Updating system packages..."
$SUDO_CMD apt update && $SUDO_CMD apt upgrade -y
print_status "System updated"

# Install Node.js 20 LTS
echo "📥 Installing Node.js 20 LTS..."
if ! command -v node &> /dev/null; then
    if [[ $EUID -eq 0 ]]; then
        # Running as root
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt install -y nodejs build-essential
    else
        # Running as regular user
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt install -y nodejs build-essential
    fi
    print_status "Node.js installed: $(node -v)"
else
    print_status "Node.js already installed: $(node -v)"
fi

# Install system dependencies for Playwright
echo "🔧 Installing system dependencies..."
$SUDO_CMD apt install -y \
    libatk1.0-0t64 libatk-bridge2.0-0t64 libcups2t64 libatspi2.0-0t64 \
    libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 \
    libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libasound2t64 \
    fonts-liberation libnss3 xdg-utils wget ca-certificates curl \
    libgtk-3-0t64 libcairo-gobject2 libgdk-pixbuf-2.0-0 \
    libdrm2 libxss1 libicu-dev libjpeg-dev libopenjp2-7-dev \
    libpng-dev libtiff-dev libwebp-dev
print_status "System dependencies installed"

# Install project dependencies
echo "📦 Installing project dependencies..."
if [ -f "package-lock.json" ]; then
    # Check if package-lock.json is in sync with package.json
    if npm ci --dry-run --omit=dev > /dev/null 2>&1; then
        npm ci --omit=dev
        print_status "NPM dependencies installed (using ci)"
    else
        print_warning "package-lock.json out of sync with package.json, regenerating..."
        rm -f package-lock.json
        npm install --production
        print_status "NPM dependencies installed (regenerated lock file)"
    fi
else
    print_warning "package-lock.json not found, using npm install"
    npm install --production
    print_status "NPM dependencies installed (using install)"
fi

# Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
npx playwright install chromium
npx playwright install-deps chromium
print_status "Playwright browsers installed"

# Build website
echo "🌐 Building website..."
cd website

# Create .env.local with domain configuration for build
if [ ! -z "$DOMAIN" ] && [ ! -z "$SUBDOMAIN" ]; then
    echo "📝 Configuring website with domain: $FULL_DOMAIN"
    cat > .env.local << EOF
NEXT_PUBLIC_DOMAIN=$DOMAIN
NEXT_PUBLIC_SUBDOMAIN=$SUBDOMAIN
NEXT_PUBLIC_API_URL=https://$FULL_DOMAIN
NEXT_PUBLIC_SITE_URL=https://$FULL_DOMAIN
EOF
    print_status "Website environment configured"
fi

if [ -f "package-lock.json" ]; then
    # Check if package-lock.json is in sync with package.json
    if npm ci --dry-run > /dev/null 2>&1; then
        npm ci  # Install all dependencies including devDependencies for build
        print_status "Website dependencies installed (using ci)"
    else
        print_warning "Website package-lock.json out of sync, regenerating..."
        rm -f package-lock.json
        npm install  # Install all dependencies including devDependencies
        print_status "Website dependencies installed (regenerated lock file)"
    fi
else
    print_warning "package-lock.json not found, using npm install"
    npm install  # Install all dependencies including devDependencies
    print_status "Website dependencies installed (using install)"
fi
npm run build
cd ..
print_status "Website built successfully"

# Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
if [ -f "scripts/setup-playwright.sh" ]; then
    chmod +x scripts/setup-playwright.sh
    bash scripts/setup-playwright.sh
    print_status "Playwright setup completed"
else
    # Fallback method
    export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0
    npx playwright install chromium
    print_status "Playwright Chromium browser installed"
fi

# Create logs directory
mkdir -p logs
print_status "Logs directory created"

# Install PM2 globally
echo "⚙️ Installing PM2 process manager..."
if ! command -v pm2 &> /dev/null; then
    $SUDO_CMD npm install -g pm2
    print_status "PM2 installed"
else
    print_status "PM2 already installed"
fi

# Install Nginx
echo "🌐 Installing and configuring Nginx..."
if ! command -v nginx &> /dev/null; then
    $SUDO_CMD apt install -y nginx
    print_status "Nginx installed"
else
    print_status "Nginx already installed"
fi

# Copy Nginx configuration
$SUDO_CMD cp nginx/headlessx.conf /etc/nginx/sites-available/headlessx
$SUDO_CMD ln -sf /etc/nginx/sites-available/headlessx /etc/nginx/sites-enabled/
$SUDO_CMD rm -f /etc/nginx/sites-enabled/default

# Add rate limiting zones to main nginx config if not already present
if ! grep -q "limit_req_zone.*zone=api" /etc/nginx/nginx.conf; then
    echo "📝 Adding rate limiting zones to nginx.conf..."
    $SUDO_CMD sed -i '/http {/a\\n    # HeadlessX Rate Limiting Zones\n    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;\n    limit_req_zone $binary_remote_addr zone=burst:10m rate=50r/s;\n    limit_req_zone $binary_remote_addr zone=health:10m rate=100r/s;\n    limit_req_zone $binary_remote_addr zone=website:10m rate=30r/s;' /etc/nginx/nginx.conf
    print_status "Rate limiting zones added to nginx.conf"
else
    print_status "Rate limiting zones already configured"
fi

$SUDO_CMD nginx -t
$SUDO_CMD systemctl reload nginx
print_status "Nginx configured for $FULL_DOMAIN"

# Note: Website files are served directly by Node.js server
# No need to copy to /var/www since nginx proxies everything to Node.js
print_status "Website integrated with Node.js server"

# Configure firewall
echo "🔥 Configuring firewall..."
$SUDO_CMD ufw allow 22    # SSH
$SUDO_CMD ufw allow 80    # HTTP
$SUDO_CMD ufw allow 443   # HTTPS
$SUDO_CMD ufw --force enable
print_status "Firewall configured"

# Create environment file
echo "⚙️ Creating environment configuration..."
if [ ! -f .env ]; then
    cp .env.example .env
    print_warning "Created .env file - please update the AUTH_TOKEN value!"
else
    print_status ".env file already exists"
fi

# Validate dependencies before starting server
echo "🔍 Validating installation..."

# Check Node.js modules
if [ ! -d "node_modules" ] || [ ! -f "node_modules/express/package.json" ]; then
    print_error "Dependencies not properly installed. Installing again..."
    npm install --production
fi

# Check website build
if [ ! -d "website/out" ]; then
    print_error "Website not built. Building again..."
    cd website && npm run build && cd ..
fi

# Check Playwright installation
if [ ! -d "node_modules/playwright-core" ]; then
    print_error "Playwright not installed. Installing..."
    npm install playwright-core
fi

# Ensure Playwright browsers are installed
echo "🌐 Verifying Playwright browsers..."
if ! npx playwright install chromium --dry-run 2>/dev/null; then
    print_warning "Installing Playwright Chromium browser..."
    npx playwright install chromium
fi

# Validate .env file
if [ ! -f ".env" ]; then
    print_warning "Creating .env file from template..."
    cp .env.example .env
    print_warning "Please update the AUTH_TOKEN value in .env file!"
fi

# Check if AUTH_TOKEN is set
if ! grep -q "AUTH_TOKEN=" .env || grep -q "AUTH_TOKEN=your_secure_token_here" .env; then
    print_warning "AUTH_TOKEN not configured - please update .env file"
fi

# Validate new modular server files
echo "🔍 Validating modular server files..."
REQUIRED_FILES=(
    "src/app.js"
    "src/server.js"
    "src/rate-limiter.js"
    "src/config/index.js"
    "src/config/browser.js"
    "src/utils/errors.js"
    "src/utils/logger.js"
    "src/utils/helpers.js"
    "src/services/browser.js"
    "src/services/stealth.js"
    "src/services/interaction.js"
    "src/services/rendering.js"
    "src/middleware/auth.js"
    "src/middleware/error.js"
    "src/controllers/system.js"
    "src/controllers/rendering.js"
    "src/controllers/batch.js"
    "src/controllers/get.js"
    "src/routes/api.js"
    "src/routes/static.js"
    "ecosystem.config.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Required file missing: $file"
        exit 1
    fi
done

# Check syntax by running a quick validation on main files
if node -c src/app.js && node -c src/server.js && node -c src/rate-limiter.js && node -c ecosystem.config.js; then
    print_status "All main server files syntax validated"
else
    print_error "Syntax validation failed"
    exit 1
fi

print_status "Installation validated"

# Test the modular server
echo "🧪 Testing modular server startup..."

# Quick syntax check first
if ! node -c src/app.js; then
    print_error "Server syntax check failed"
    exit 1
fi

# Test server startup (don't fail if this doesn't work)
timeout 10s node src/app.js > /dev/null 2>&1 &
SERVER_PID=$!
sleep 3

if kill -0 $SERVER_PID 2>/dev/null; then
    print_status "Server test successful"
    kill $SERVER_PID 2>/dev/null || true
else
    print_warning "Server test failed - will try with PM2"
fi

# Kill any remaining processes
pkill -f "node.*src/app.js" 2>/dev/null || true

# Start with PM2
echo "🚀 Starting HeadlessX with PM2..."

# Stop any existing processes first
pm2 stop headlessx 2>/dev/null || true
pm2 delete headlessx 2>/dev/null || true

# Kill any processes that might be using port 3000
fuser -k 3000/tcp 2>/dev/null || true
sleep 2

# Start fresh with PM2
pm2 start ecosystem.config.js
sleep 5

# Validate server startup
echo "🔍 Validating server startup..."
RETRY_COUNT=0
MAX_RETRIES=30

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if pm2 status headlessx | grep -q "online"; then
        # Check if server is responding
        if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/health | grep -q "200"; then
            print_status "Server is online and responding"
            break
        elif ss -tlnp | grep -q ":3000"; then
            print_status "Server is listening on port 3000"
            break
        fi
    fi
    
    echo "   Waiting for server startup... ($((RETRY_COUNT + 1))/$MAX_RETRIES)"
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    print_warning "Server startup validation timed out"
    echo "   PM2 Status:"
    pm2 status
    echo "   Latest logs:"
    pm2 logs headlessx --lines 10
    
    # Try restarting once more
    print_info "Attempting to restart server..."
    pm2 restart headlessx
    sleep 5
    
    if ss -tlnp | grep -q ":3000"; then
        print_status "Server restarted successfully"
    else
        print_error "Server startup failed - check logs with: pm2 logs headlessx"
    fi
else
    print_status "HeadlessX started successfully with PM2"
fi

pm2 save

# Setup PM2 startup script
echo "⚙️ Configuring PM2 startup..."
if [[ $EUID -eq 0 ]]; then
    # Running as root
    pm2 startup systemd
    pm2 save
else
    # Running as regular user
    sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
    pm2 save
fi
print_status "PM2 startup configured"

echo ""
echo "🎉 HeadlessX v1.2.0 Setup completed successfully!"
echo "==============================================="
echo ""
echo -e "${GREEN}✅ Server Status:${NC}"
echo "   $(pm2 status headlessx)"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Update your domain DNS:"
echo "   - Point $FULL_DOMAIN to your server IP"
echo "   - Wait for DNS propagation (1-24 hours)"
echo ""
echo "2. Configure SSL certificate:"
echo "   ${SUDO_CMD} apt install certbot python3-certbot-nginx"
echo "   ${SUDO_CMD} certbot --nginx -d $FULL_DOMAIN"
echo ""
echo "3. Update the AUTH_TOKEN in .env file:"
echo "   nano .env"
echo "   pm2 restart headlessx  # Restart after updating .env"
echo ""
echo "4. Test your setup:"
echo "   🌐 Website: https://$FULL_DOMAIN"
echo "   🔧 API Health: https://$FULL_DOMAIN/api/health"
echo "   📊 API Status: https://$FULL_DOMAIN/api/status?token=YOUR_AUTH_TOKEN"
echo ""
echo "5. Monitor your server:"
echo "   pm2 status           # Check process status"
echo "   pm2 logs headlessx   # View logs"
echo "   pm2 monit           # Real-time monitoring"
echo ""
echo "📚 Visit https://github.com/SaifyXPRO/HeadlessX for documentation"
echo ""
