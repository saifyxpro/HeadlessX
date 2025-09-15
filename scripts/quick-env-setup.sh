#!/bin/bash

# HeadlessX Quick Environment Setup
# Creates .env file with secure token and proper domain configuration
# Run with: bash scripts/quick-env-setup.sh

set -e

echo "🔧 HeadlessX Environment Setup"
echo "=============================="

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

# Generate secure token
print_info "Generating secure authentication token..."
SECURE_TOKEN=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null || openssl rand -hex 32 2>/dev/null || echo "headless-x-$(date +%s)-$(shuf -i 1000-9999 -n 1)")

# Get domain from user or use default
echo ""
read -p "Enter your domain (default: saify.me): " USER_DOMAIN
DOMAIN=${USER_DOMAIN:-"saify.me"}

read -p "Enter your subdomain (default: headlessx): " USER_SUBDOMAIN
SUBDOMAIN=${USER_SUBDOMAIN:-"headlessx"}

FULL_DOMAIN="$SUBDOMAIN.$DOMAIN"

# Create .env file
print_info "Creating .env file..."

cat > .env << EOF
# REQUIRED: Security token for API authentication
# Generated on $(date)
AUTH_TOKEN=$SECURE_TOKEN

# Server configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# Domain configuration
DOMAIN=$DOMAIN
SUBDOMAIN=$SUBDOMAIN
# Full domain will be: $FULL_DOMAIN

# Website domain configuration (for Next.js build)
NEXT_PUBLIC_DOMAIN=$DOMAIN
NEXT_PUBLIC_SUBDOMAIN=$SUBDOMAIN
NEXT_PUBLIC_API_URL=https://$FULL_DOMAIN
NEXT_PUBLIC_SITE_URL=https://$FULL_DOMAIN

# Browser configuration
BROWSER_TIMEOUT=60000
EXTRA_WAIT_TIME=3000
MAX_CONCURRENCY=3

# API configuration
BODY_LIMIT=10mb
MAX_BATCH_URLS=10
API_BODY_LIMIT=10mb
API_MAX_BATCH_URLS=10
API_DEFAULT_PARTIAL_TIMEOUT=false

# Security settings
CORS_ENABLED=true
ALLOWED_ORIGINS=*
HELMET_ENABLED=true

# Website configuration
WEBSITE_ENABLED=true
WEBSITE_PATH=./website/out

# Logging configuration
DEBUG=false
LOG_LEVEL=info

# Optional: Performance tuning
UV_THREADPOOL_SIZE=128
NODE_OPTIONS=--max-old-space-size=4096
EOF

print_status ".env file created successfully!"

echo ""
print_info "Configuration Summary:"
print_info "- Domain: $FULL_DOMAIN"
print_info "- Auth Token: $SECURE_TOKEN"
print_info "- Port: 3000"

echo ""
print_warning "IMPORTANT SECURITY NOTES:"
print_warning "1. Keep your AUTH_TOKEN secret!"
print_warning "2. Never commit .env file to version control"
print_warning "3. Use this token for all API requests"

echo ""
print_info "Next steps:"
print_info "1. Run: bash scripts/setup.sh"
print_info "2. Test APIs: bash scripts/test-api-endpoints.sh"
print_info "3. View API docs: http://localhost:3000/api/docs"

echo ""
print_status "Environment setup completed! 🎉"