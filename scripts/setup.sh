#!/bin/bash

# Enhanced HeadlessX Setup Script v1.1.0
# Run with: bash setup.sh

set -e

echo "🚀 Setting up HeadlessX v1.1.0 - Open Source Browserless Web Scraping API"
echo "=========================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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
    libatk1.0-0 libatk-bridge2.0-0 libcups2 libatspi2.0-0 \
    libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 \
    libcairo2 libpango-1.0-0 libasound2 fonts-liberation \
    libnss3 xdg-utils wget ca-certificates curl
print_status "System dependencies installed"

# Install project dependencies
echo "📦 Installing project dependencies..."
npm install
print_status "NPM dependencies installed"

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

npm install
npm run build
cd ..
print_status "Website built successfully"

# Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
npx playwright install
npx playwright install-deps
print_status "Playwright browsers installed"

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
    print_warning "Created .env file - please update the TOKEN value!"
else
    print_status ".env file already exists"
fi

# Test the server
echo "🧪 Testing server startup..."
timeout 10s node src/server.js &
SERVER_PID=$!
sleep 5

if kill -0 $SERVER_PID 2>/dev/null; then
    print_status "Server test successful"
    kill $SERVER_PID
else
    print_error "Server test failed - but continuing..."
fi

echo ""
echo "🎉 HeadlessX v1.1.0 Setup completed successfully!"
echo "==============================================="
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
echo "3. Update the TOKEN in .env file:"
echo "   nano .env"
echo ""
echo "4. Start the HeadlessX API server:"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "5. Test your setup:"
echo "   🌐 Website: http://$FULL_DOMAIN"
echo "   🔧 API Health: http://$FULL_DOMAIN/api/health"
echo "   📊 API Status: http://$FULL_DOMAIN/api/status"
echo ""
echo "📚 Visit https://github.com/SaifyXPRO/HeadlessX for documentation"
echo ""
