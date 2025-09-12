# 🚀 HeadlessX v1.1.0

**Advanced Browserless Web Scraping API with Human-like Behavior**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![Playwright](https://img.shields.io/badge/Playwright-Latest-blue.svg)](https://playwright.dev/)

> 🎯 **All-in-One Solution**: Website + API Server in a single Node.js application  
> 🌐 **Single Domain**: Everything runs on `your-subdomain.yourdomain.com`  
> 🔥 **Zero Configuration**: Automatic environment variable detection

---

## ✨ What Makes HeadlessX Special

### 🌐 **Unified Architecture**
- **Website + API**: Everything on one domain
- **Professional Landing Page**: Beautiful Next.js website with documentation
- **Real-time Monitoring**: Live server status and health metrics
- **Integrated Documentation**: API examples right on your website

### 🧠 **Human-like Intelligence** 
- **Natural Mouse Movements**: Realistic curves, acceleration, and pauses
- **Smart Scrolling**: Organic scroll patterns with momentum
- **Behavioral Randomization**: Unique patterns for each session
- **Anti-Detection**: 40+ stealth techniques

### 🚀 **Production Ready**
- **Multiple Formats**: HTML, text, screenshots, PDFs
- **Batch Processing**: Handle multiple URLs efficiently
- **Timeout Recovery**: Partial content extraction
- **Docker Support**: One-command deployment

---

## 🎯 Quick Start

### 1️⃣ **Configure Environment**
```bash
git clone https://github.com/SaifyXPRO/HeadlessX.git
cd HeadlessX

# Configure your domain and token
cp .env.example .env
nano .env  # Update DOMAIN, SUBDOMAIN, and TOKEN
```

### 2️⃣ **Choose Your Deployment**

**🐳 Docker (Easiest)**
```bash
docker-compose up -d
```

**🔧 Automated Node.js Setup**
```bash
sudo ./scripts/setup.sh
```

**💻 Development**
```bash
npm install && npm run build && npm start
```

### 3️⃣ **Access Your HeadlessX**
```
🌐 Website:    https://your-subdomain.yourdomain.com
🔧 API Health: https://your-subdomain.yourdomain.com/api/health  
📊 API Status: https://your-subdomain.yourdomain.com/api/status?token=YOUR_TOKEN
```

---

## 🏗️ Architecture Overview

HeadlessX runs as a **unified Node.js application**:

```
your-subdomain.yourdomain.com/
├── /                    → Website (Landing page + docs)
├── /api/health         → Health check endpoint
├── /api/render         → Web scraping API
├── /api/screenshot     → Screenshot generation
└── /api/*              → All API endpoints
```

**Key Components:**
- **Express.js Server**: Unified backend serving both website and API
- **Next.js Website**: Professional frontend with documentation
- **Playwright Engine**: Browser automation for web scraping
- **Nginx Proxy**: Production-ready reverse proxy
- **PM2/Docker**: Process management and containerization

---

## 🚀 Deployment Options

HeadlessX supports **multiple deployment methods** to fit your infrastructure needs:

### 🐳 **Option 1: Docker Deployment (Recommended)**

**Quick Docker Setup:**
```bash
# Clone and configure
git clone https://github.com/SaifyXPRO/HeadlessX.git
cd HeadlessX

# Configure environment
cp .env.example .env
nano .env  # Update DOMAIN, SUBDOMAIN, and TOKEN

# Deploy with Docker
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs headlessx
```

**Docker Features:**
- ✅ **Zero Dependencies**: Everything included in container
- ✅ **Automatic Scaling**: Easy horizontal scaling
- ✅ **Isolated Environment**: No conflicts with host system
- ✅ **Production Ready**: Optimized for production workloads

### 🔧 **Option 2: Node.js + PM2 (Traditional)**

**Automated Setup:**
```bash
# Clone and configure
git clone https://github.com/SaifyXPRO/HeadlessX.git
cd HeadlessX

# Configure environment
cp .env.example .env
nano .env  # Update DOMAIN, SUBDOMAIN, and TOKEN

# One-command setup
chmod +x scripts/setup.sh
sudo ./scripts/setup.sh
# Server automatically starts with PM2!
```

**Manual Setup:**
```bash
# Install dependencies
npm install

# Build website
cd website && npm install && npm run build && cd ..

# Install PM2 globally
sudo npm install -g pm2

# Start with PM2
npm run pm2:start

# Save PM2 configuration
npm run pm2:save

# Enable startup script
npm run pm2:startup
```

### 💻 **Option 3: Development Mode**
```bash
# Quick development start
npm install
cd website && npm install && npm run build && cd ..
npm start
```

---

## 🌐 Production Deployment Guide

### 1️⃣ **Server Requirements**
```
Minimum Requirements:
- VPS/Server: 2GB RAM, 2 CPU cores, 20GB storage
- OS: Ubuntu 20.04+ LTS, Debian 11+, CentOS 8+
- Domain: Subdomain pointing to server IP
- Ports: 80 (HTTP), 443 (HTTPS), 22 (SSH)

Recommended:
- VPS/Server: 4GB RAM, 4 CPU cores, 50GB storage
- Docker: 20.10+ or Node.js 18+ with PM2
```

### 2️⃣ **DNS Configuration**
```bash
# Add DNS A record:
Type: A
Name: your-subdomain        # e.g., headlessx
Value: YOUR_SERVER_IP       # e.g., 192.168.1.100
TTL: 300                   # 5 minutes

# Verify DNS propagation:
nslookup your-subdomain.yourdomain.com
```

### 3️⃣ **Docker Production Deployment**

**Complete Docker Setup:**
```bash
# 1. Install Docker & Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 2. Deploy HeadlessX
git clone https://github.com/SaifyXPRO/HeadlessX.git
cd HeadlessX

# 3. Configure environment
cp .env.example .env
nano .env  # Update all values

# 4. Start services
docker-compose up -d

# 5. Setup SSL (optional but recommended)
sudo apt install certbot
sudo certbot --standalone -d your-subdomain.yourdomain.com
```

**Docker Management:**
```bash
# View status
docker-compose ps

# View logs
docker-compose logs -f headlessx

# Restart services
docker-compose restart

# Update to latest version
git pull origin main
docker-compose down
docker-compose up -d --build

# Stop services
docker-compose down
```

### 4️⃣ **Node.js + PM2 Production Deployment**

**Complete Manual Setup:**
```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential

# 3. Deploy HeadlessX
git clone https://github.com/SaifyXPRO/HeadlessX.git
cd HeadlessX

# 4. Configure environment
cp .env.example .env
nano .env  # Update all values

# 5. Install and start
sudo ./scripts/setup.sh
# This automatically:
# - Installs all dependencies
# - Builds the website
# - Configures Nginx
# - Starts with PM2
# - Sets up firewall

# 6. Setup SSL
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-subdomain.yourdomain.com
```

---
├── /favicon.ico         → Favicon
├── /robots.txt          → SEO robots file
├── /api/health         → Health check (no auth required)
├── /api/status         → Server status (requires token)
├── /api/render         → Full page rendering
├── /api/html           → HTML extraction  
├── /api/content        → Clean text extraction
├── /api/screenshot     → Screenshot generation
├── /api/pdf            → PDF generation
└── /api/batch          → Batch URL processing
```

**🔄 Request Flow:**
1. Nginx receives request on port 80/443
2. Proxies to Node.js server on port 3000
3. Server routes based on path:
   - `/api/*` → API endpoints
   - `/*` → Website files (built Next.js app)

---

## 🚀 API Examples

### Health Check (No Auth)
```bash
curl https://your-subdomain.yourdomain.com/api/health
```

### Extract HTML
```bash
curl -X POST "https://your-subdomain.yourdomain.com/api/html?token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "timeout": 30000}'
```

### Generate Screenshot
```bash
curl "https://your-subdomain.yourdomain.com/api/screenshot?token=YOUR_TOKEN&url=https://example.com&fullPage=true" \
  -o screenshot.png
```

### Batch Processing
```bash
curl -X POST "https://your-subdomain.yourdomain.com/api/batch?token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://example.com", "https://httpbin.org"],
    "format": "text",
    "options": {"timeout": 30000}
  }'
```

---

## 📁 Project Structure

```
HeadlessX/
├── 📂 src/
│   └── server.js                   # Main server (API + Website serving)
├── 📂 website/                     # Next.js website
│   ├── app/                        # Next.js 13+ app directory
│   ├── components/                 # React components
│   ├── .env.example               # Website environment template
│   ├── next.config.js             # Next.js configuration
│   └── package.json               # Website dependencies
├── 📂 scripts/
│   ├── setup.sh                   # Automated installation
│   ├── verify-domain.sh           # Domain verification
│   └── test-routing.sh            # Integration testing
├── 📂 nginx/
│   └── headlessx.conf             # Nginx configuration
├── 📂 docker/
│   ├── Dockerfile                 # Container definition
│   └── docker-compose.yml         # Docker Compose setup
├── 📂 config/
│   └── ecosystem.config.js        # PM2 configuration
├── 📂 docs/                       # API Documentation
│   ├── GET_ENDPOINTS.md           # GET API reference
│   ├── POST_ENDPOINTS.md          # POST API reference
│   ├── DOMAIN_SETUP.md            # Domain configuration
│   └── HUMAN_BEHAVIOR_UPDATE.md   # Behavior simulation docs
├── .env.example                   # Environment template
├── package.json                   # Server dependencies
└── README.md                      # This file
```

---

## 🛠️ Development

### Local Development
```bash
# 1. Install dependencies
npm install

# 2. Build website
cd website
npm install
npm run build
cd ..

# 3. Set environment variables
export TOKEN="development_token_123"
export DOMAIN="localhost"
export SUBDOMAIN="headlessx"

# 4. Start server
node src/server.js

# 5. Access locally
# Website: http://localhost:3000
# API: http://localhost:3000/api/health
```

### Testing Integration
```bash
# Test server and website integration
bash scripts/test-routing.sh localhost

# Test with environment variables
bash scripts/verify-domain.sh
```

---

## 🌐 Production Deployment

### 1. Server Setup
- **VPS Requirements**: 2GB+ RAM, Ubuntu 20.04+ LTS
- **Domain**: Point `your-subdomain.yourdomain.com` to your server IP
- **SSL**: Automatic via Let's Encrypt (handled by setup script)

### 2. DNS Configuration
```
Type: A
Name: your-subdomain
Value: YOUR_SERVER_IP
TTL: 300
```

### 3. Deployment
```bash
# One-command setup
git clone https://github.com/SaifyXPRO/HeadlessX.git
cd HeadlessX
sudo ./scripts/setup.sh
```

### 4. SSL Setup (Automatic)
```bash
# Included in setup.sh, or manual:
sudo certbot --nginx -d your-subdomain.yourdomain.com
```

---

## 📊 Monitoring & Maintenance

### ⚙️ PM2 Process Management
```bash
# Using NPM scripts (recommended)
npm run pm2:start       # Start with PM2
npm run pm2:status      # Check status  
npm run pm2:logs        # View logs
npm run pm2:monit       # Real-time monitoring
npm run pm2:restart     # Restart server
npm run pm2:stop        # Stop server
npm run pm2:save        # Save PM2 config

# Or use PM2 commands directly
pm2 start config/ecosystem.config.js
pm2 status
pm2 logs headlessx
pm2 monit
pm2 restart headlessx
pm2 stop headlessx
pm2 delete headlessx
```

### 🔍 Health Monitoring
```bash
# Check server status
curl https://your-subdomain.yourdomain.com/api/health

# Detailed status (requires token)
curl "https://your-subdomain.yourdomain.com/api/status?token=YOUR_TOKEN"
```

### 📋 Log Management
```bash
# View PM2 logs
pm2 logs headlessx --lines 100

# View only error logs
pm2 logs headlessx --err

# View nginx logs  
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 🔄 Updates & Maintenance
```bash
# Pull latest updates
git pull origin main

# Rebuild website
npm run build

# Restart server with PM2
pm2 restart headlessx

# Or restart all PM2 processes
pm2 restart all
```

---

## 🔧 Troubleshooting Common Issues

### ❌ **"Cannot find module 'express'" Error**
```bash
# This happens when dependencies aren't installed
# Solution:
cd /path/to/HeadlessX
npm install

# Or for production:
npm ci --production
```

### ❌ **System Dependency Errors (Ubuntu/Debian)**
```bash
# If you see libasound2 or libatk errors during setup:
sudo apt update
sudo apt install -y \
  libatk1.0-0t64 libatk-bridge2.0-0t64 libcups2t64 \
  libatspi2.0-0t64 libasound2t64 libxcomposite1 \
  libxdamage1 libxfixes3 libxrandr2 libgbm1 \
  libcairo2 libpango-1.0-0 fonts-liberation \
  libnss3 xdg-utils wget ca-certificates curl
```

### ❌ **Website Not Building**
```bash
# Ensure you're in the correct directory:
cd HeadlessX
ls -la  # Should show src/, website/, package.json

# Build website manually:
cd website
npm install
npm run build
cd ..
```

### ❌ **PM2 Not Starting**
```bash
# Check if PM2 is installed:
pm2 --version

# Install PM2 globally:
sudo npm install -g pm2

# Start with proper config:
pm2 start config/ecosystem.config.js

# Check logs for errors:
pm2 logs headlessx
```

### ❌ **Docker Issues**
```bash
# Ensure Docker is running:
sudo systemctl status docker
sudo systemctl start docker

# Check docker-compose:
docker-compose --version

# Rebuild containers:
docker-compose down
docker-compose up -d --build

# View container logs:
docker-compose logs -f headlessx
```

### 🔍 **Environment Variable Issues**
```bash
# Check if .env file exists and has correct values:
cat .env

# Required variables:
TOKEN=your_secure_token_here
DOMAIN=yourdomain.com
SUBDOMAIN=headlessx

# Restart after changing .env:
pm2 restart headlessx
# OR
docker-compose restart
```

---

## 🔐 Security Features

- **Token Authentication**: Secure API access with custom tokens
- **Rate Limiting**: Nginx-level request throttling
- **Security Headers**: XSS, CSRF, and clickjacking protection
- **Bot Protection**: Common attack vector blocking
- **SSL/TLS**: Automatic HTTPS with Let's Encrypt

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- **📖 Documentation**: Visit your deployed website for full API docs
- **🐛 Issues**: [GitHub Issues](https://github.com/SaifyXPRO/HeadlessX/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/SaifyXPRO/HeadlessX/discussions)

---

## 🎯 Built by SaifyXPRO

**HeadlessX v1.1.0** - The most advanced open-source browserless web scraping solution.

Made with ❤️ for the developer community.