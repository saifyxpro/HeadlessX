#!/bin/bash

# HeadlessX Complete Setup Script v1.3.0
# Sets up HeadlessX with advanced anti-detection features
# Run with: bash scripts/setup.sh

set -e

echo "🚀 Setting up HeadlessX v1.3.0 - Advanced Anti-Detection Web Scraping API"
echo "============================================================================="
echo "🛡️ Features: Canvas/WebGL/Audio spoofing, Behavioral simulation, WAF bypass"
echo "============================================================================="

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

# Ubuntu VPS compatibility checks
echo "🔍 Checking Ubuntu VPS compatibility..."

# Check OS
if [[ -f /etc/os-release ]]; then
    source /etc/os-release
    if [[ "$ID" == "ubuntu" ]]; then
        print_status "Running on Ubuntu $VERSION_ID"
    elif [[ "$ID" == "debian" ]]; then
        print_status "Running on Debian $VERSION_ID"
    else
        print_warning "Not running on Ubuntu/Debian. Some features may not work correctly."
    fi
else
    print_warning "Unable to detect OS version"
fi

# Check available memory (important for VPS)
TOTAL_MEM=$(free -m | awk 'NR==2{print $2}')
if [[ $TOTAL_MEM -lt 1024 ]]; then
    print_warning "Low memory detected (${TOTAL_MEM}MB). Consider upgrading your VPS for better performance."
elif [[ $TOTAL_MEM -lt 2048 ]]; then
    print_info "Memory: ${TOTAL_MEM}MB (adequate for HeadlessX)"
else
    print_status "Memory: ${TOTAL_MEM}MB (excellent for HeadlessX)"
fi

# Check if .env exists, if not create from .env.example
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        print_info "Creating .env file from .env.example..."
        cp .env.example .env
        print_warning "Please edit .env file and set your AUTH_TOKEN and domain settings"
        print_warning "Generate a secure token with: openssl rand -hex 32"
    else
        print_warning ".env file not found. Creating basic .env file..."
        cat > .env << 'EOF'
# REQUIRED: Set a secure random token
AUTH_TOKEN=CHANGE_THIS_TO_SECURE_RANDOM_TOKEN

# Server configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# Domain configuration (replace with your actual domain)
DOMAIN=saify.me
SUBDOMAIN=headlessx
# Full domain will be: headlessx.saify.me

# Website domain configuration
NEXT_PUBLIC_DOMAIN=saify.me
NEXT_PUBLIC_SUBDOMAIN=headlessx
NEXT_PUBLIC_API_URL=https://headlessx.saify.me
NEXT_PUBLIC_SITE_URL=https://headlessx.saify.me

# Browser configuration (Enhanced v1.3.0)
BROWSER_TIMEOUT=60000
EXTRA_WAIT_TIME=3000
MAX_CONCURRENCY=3
BROWSER_POOL_SIZE=5
CONTEXT_REUSE=true

# API configuration
BODY_LIMIT=10mb
MAX_BATCH_URLS=10

# ==============================================
# 🚀 v1.3.0 ANTI-DETECTION CONFIGURATION 🚀
# ==============================================

# Fingerprint Profile Configuration
FINGERPRINT_PROFILE=desktop-chrome
STEALTH_MODE=advanced
BEHAVIORAL_SIMULATION=enabled

# Advanced Fingerprinting Control
WEBRTC_LEAK_PROTECTION=enabled
CANVAS_NOISE_LEVEL=medium
WEBGL_SPOOFING=enabled
AUDIO_FINGERPRINT_NOISE=enabled
HARDWARE_SPOOFING=enabled

# WAF Bypass Configuration
CLOUDFLARE_BYPASS=enabled
DATADOME_EVASION=enabled
TLS_FINGERPRINT_MASKING=enabled

# Monitoring and Testing
PERFORMANCE_MONITORING=enabled
AUDIT_TRAILS=enabled
LOG_LEVEL=info
MAX_BATCH_URLS=5

# Website configuration
WEBSITE_ENABLED=true

# Logging configuration
DEBUG=false
LOG_LEVEL=error
EOF
        print_warning "Created basic .env file. Please edit it and set your values!"
    fi
fi

# Load environment variables
if [ -f .env ]; then
    print_info "Loading configuration from .env file..."
    export $(grep -v '^#' .env | grep -v '^$' | xargs)
fi

# Set default domain values if not set
DOMAIN=${DOMAIN:-"saify.me"}
SUBDOMAIN=${SUBDOMAIN:-"headlessx"}
FULL_DOMAIN="$SUBDOMAIN.$DOMAIN"

echo -e "${GREEN}✅ Configuration loaded:${NC}"
echo -e "   Domain: ${YELLOW}$FULL_DOMAIN${NC}"
echo ""

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_warning "Running as root. For production, consider using a regular user with sudo."
   SUDO_CMD=""
else
   SUDO_CMD="sudo"
fi

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
        print_warning "package-lock.json out of sync, regenerating..."
        rm -f package-lock.json
        npm install --production
        print_status "NPM dependencies installed (regenerated lock file)"
    fi
else
    npm install --production
    print_status "NPM dependencies installed"
fi

# Install Playwright browsers (fixed installation)
echo "🌐 Installing Playwright browsers..."
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0

# Make sure we're in project root
cd "$(dirname "$0")/.."

# Check if playwright is in node_modules and install if needed
if [ ! -d "./node_modules/playwright" ]; then
    echo "📦 Playwright not found in node_modules, installing..."
    npm install playwright
    print_status "Playwright package installed"
else
    print_status "Playwright package found"
fi

# Install browsers using Node.js directly (most reliable method)
echo "🌐 Installing Chromium browser..."
node -e "
const { execSync } = require('child_process');
const path = require('path');

try {
    // Method 1: Try npx
    execSync('npx playwright install chromium', { stdio: 'inherit' });
    console.log('✅ Chromium installed via npx');
} catch (e1) {
    try {
        // Method 2: Try direct path
        const playwrightBin = path.join(__dirname, 'node_modules', '.bin', 'playwright');
        execSync(\`\"\${playwrightBin}\" install chromium\`, { stdio: 'inherit' });
        console.log('✅ Chromium installed via direct path');
    } catch (e2) {
        try {
            // Method 3: Use playwright directly
            const playwright = require('playwright');
            console.log('🌐 Triggering browser download...');
            playwright.chromium.launch().then(browser => browser.close()).catch(() => {});
            console.log('✅ Chromium download triggered');
        } catch (e3) {
            console.log('⚠️ All installation methods failed');
        }
    }
}
" || print_warning "Chromium installation failed - server will download on first use"

# Install system dependencies for Linux
if [[ \"\$OSTYPE\" == \"linux-gnu\"* ]] && command -v apt-get &> /dev/null; then
    echo "🔧 Installing browser system dependencies..."
    apt-get update &>/dev/null || true
    apt-get install -y \
        libnss3 libnspr4 libatk-bridge2.0-0 libdrm2 libxkbcommon0 \
        libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxss1 libasound2 \
        libatspi2.0-0 libgtk-3-0 &>/dev/null && \
    print_status "Browser system dependencies installed" || \
    print_warning "Some system dependencies failed - browsers may still work"
fi
fi

print_status "Playwright browsers installation completed"

# v1.3.0: Validate anti-detection setup
echo "🛡️ Validating v1.3.0 anti-detection setup..."
if [ -f "verify-architecture.js" ]; then
    if node verify-architecture.js > /dev/null 2>&1; then
        print_status "v1.3.0 architecture validation passed"
    else
        print_warning "v1.3.0 architecture validation found issues (check logs for details)"
    fi
else
    print_info "Architecture validator not found, skipping validation"
fi

# Create necessary directories for v1.3.0
echo "📁 Creating v1.3.0 directory structure..."
mkdir -p logs/reports logs/profiles
mkdir -p src/config/profiles
mkdir -p src/services/fingerprinting
mkdir -p src/services/behavioral
mkdir -p src/services/evasion
print_status "v1.3.0 directories created"

# Build website
echo "🌐 Building website..."
cd website

# Configure website environment using main .env file
if [ ! -z "$DOMAIN" ] && [ ! -z "$SUBDOMAIN" ]; then
    print_info "Configuring website with domain: $FULL_DOMAIN"
    
    # Copy main .env to website directory for Next.js to read NEXT_PUBLIC_ variables
    if [ -f "../.env" ]; then
        cp ../.env .env.local
        print_status "Copied main .env to website/.env.local for Next.js build"
    else
        print_warning "Main .env file not found, website may not have proper configuration"
    fi
else
    print_warning "DOMAIN or SUBDOMAIN not set in .env file"
fi

# Install website dependencies (including devDependencies for build)
if [ -f "package-lock.json" ]; then
    if npm ci --dry-run > /dev/null 2>&1; then
        npm ci --include=dev
        print_status "Website dependencies installed (using ci with dev)"
    else
        print_warning "Website package-lock.json out of sync, regenerating..."
        rm -f package-lock.json
        npm install --include=dev
        print_status "Website dependencies installed (regenerated with dev)"
    fi
else
    npm install --include=dev
    print_status "Website dependencies installed (with dev)"
fi

# Build the website
npm run build
cd ..
print_status "Website built successfully"

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

# Copy and configure Nginx
print_info "Configuring Nginx for domain: $FULL_DOMAIN"

# Copy nginx config and replace placeholder with actual domain
cp nginx/headlessx.conf /tmp/headlessx.conf.tmp
sed "s/YOUR_DOMAIN_HERE/$FULL_DOMAIN/g" /tmp/headlessx.conf.tmp > /tmp/headlessx.conf.configured

$SUDO_CMD cp /tmp/headlessx.conf.configured /etc/nginx/sites-available/headlessx
$SUDO_CMD ln -sf /etc/nginx/sites-available/headlessx /etc/nginx/sites-enabled/
$SUDO_CMD rm -f /etc/nginx/sites-enabled/default

# Clean up temporary files
rm -f /tmp/headlessx.conf.tmp /tmp/headlessx.conf.configured

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
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Required file missing: $file"
        exit 1
    fi
done

# Check syntax by running a quick validation on main files
if node -c src/app.js && node -c src/server.js && node -c src/rate-limiter.js; then
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

# Stop any existing processes
pm2 stop headlessx 2>/dev/null || true
pm2 delete headlessx 2>/dev/null || true

# Kill any processes using port 3000 (better Ubuntu VPS compatibility)
if command -v fuser >/dev/null 2>&1; then
    fuser -k 3000/tcp 2>/dev/null || true
elif command -v lsof >/dev/null 2>&1; then
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
elif command -v ss >/dev/null 2>&1; then
    PID=$(ss -tlnp | grep :3000 | awk '{print $6}' | grep -o '[0-9]*' | head -1)
    if [[ ! -z "$PID" ]]; then
        kill -9 $PID 2>/dev/null || true
    fi
fi
sleep 2

# Start with PM2 (directly run server.js with basic Ubuntu VPS configuration)
pm2 start src/server.js --name headlessx --time --update-env --max-memory-restart 800M
sleep 5

# Validate server startup with improved checks
echo "🔍 Validating server startup..."
RETRY_COUNT=0
MAX_RETRIES=30
SERVER_HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    # Check if PM2 shows process as online
    if pm2 status headlessx | grep -q "online"; then
        # Check if port 3000 is listening
        if command -v ss >/dev/null 2>&1 && ss -tlnp | grep -q ":3000"; then
            # Try to curl health endpoint
            if command -v curl >/dev/null 2>&1; then
                HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/health || echo "000")
                if [ "$HTTP_CODE" = "200" ]; then
                    print_status "Server is healthy and responding to requests"
                    SERVER_HEALTHY=true
                    break
                fi
            else
                print_status "Server is listening on port 3000"
                SERVER_HEALTHY=true
                break
            fi
        fi
    fi
    
    echo "   Waiting for server startup... ($((RETRY_COUNT + 1))/$MAX_RETRIES)"
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ "$SERVER_HEALTHY" = "false" ]; then
    print_warning "Server startup validation timed out"
    echo "   PM2 Status:"
    pm2 status
    echo "   Latest logs:"
    pm2 logs headlessx --lines 10
    print_error "Server may not be fully operational - check logs with: pm2 logs headlessx"
else
    print_status "HeadlessX started successfully with PM2"
fi

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
echo "⚙️ Configuring PM2 startup..."
if [[ $EUID -eq 0 ]]; then
    pm2 startup systemd -u root --hp /root
else
    $SUDO_CMD env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
fi
pm2 save
print_status "PM2 startup configured"

echo ""
echo "🎉 HeadlessX v1.3.0 Setup Complete!"
echo "==================================="
echo ""
echo -e "${GREEN}✅ Installation Summary:${NC}"
echo "   - Server: HeadlessX v1.3.0 with advanced anti-detection"
echo "   - Website: Built and integrated"
echo "   - Process Manager: PM2"
echo "   - Web Server: Nginx"
echo "   - Domain: $FULL_DOMAIN"
echo "   - Anti-Detection: Canvas/WebGL/Audio spoofing, Behavioral simulation"
echo ""
echo -e "${GREEN}✅ Service Status:${NC}"
pm2 status headlessx || echo "   PM2 status unavailable"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. 🔐 Configure Authentication:"
echo "   nano .env"
echo "   # Set a secure AUTH_TOKEN value"
echo ""
echo "2. 🌐 Configure DNS:"
echo "   # Point $FULL_DOMAIN to your server IP"
echo ""
echo "3. 🔒 Setup SSL Certificate:"
echo "   $SUDO_CMD apt install certbot python3-certbot-nginx"
echo "   $SUDO_CMD certbot --nginx -d $FULL_DOMAIN"
echo ""
echo "4. 🧪 Test Your Installation:"
echo "   curl http://localhost:3000/api/health"
echo "   curl http://$FULL_DOMAIN/api/health"
echo ""
echo "📊 Management Commands:"
echo "   pm2 status       # Check server status"
echo "   pm2 logs         # View server logs"
echo "   pm2 restart all  # Restart server"
echo "   pm2 monit        # Monitor resources"
echo ""
echo -e "${YELLOW}⚠️ Important:${NC}"
echo "   - Update AUTH_TOKEN in .env file before production use"
echo "   - Configure your firewall and SSL certificate"
echo "   - Monitor logs regularly with: pm2 logs headlessx"
echo ""
print_status "Setup completed successfully!"
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
