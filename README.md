# 🚀 HeadlessX v1.3.0

**Advanced Anti-Detection Web Scraping API with Comprehensive Fingerprinting Control**

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-v1.3.0-blue.svg?style=for-the-badge)](https://github.com/saifyxpro/HeadlessX/releases)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-success.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Playwright](https://img.shields.io/badge/Playwright-Latest-orange.svg?style=for-the-badge&logo=playwright)](https://playwright.dev/)

[![GitHub Stars](https://img.shields.io/github/stars/saifyxpro/HeadlessX?style=for-the-badge&logo=github)](https://github.com/saifyxpro/HeadlessX/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/saifyxpro/HeadlessX?style=for-the-badge&logo=github)](https://github.com/saifyxpro/HeadlessX/network/members)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg?style=for-the-badge&logo=docker)](#-docker-deployment)
[![CI/CD](https://img.shields.io/github/actions/workflow/status/saifyxpro/HeadlessX/ci.yml?style=for-the-badge&logo=github-actions&label=CI%2FCD)](https://github.com/saifyxpro/HeadlessX/actions)

[![Open Source](https://img.shields.io/badge/Open%20Source-100%25-brightgreen.svg?style=for-the-badge&logo=open-source-initiative)](https://github.com/saifyxpro/HeadlessX)
[![Contributors](https://img.shields.io/github/contributors/saifyxpro/HeadlessX?style=for-the-badge&logo=github)](https://github.com/saifyxpro/HeadlessX/graphs/contributors)
[![Issues](https://img.shields.io/github/issues/saifyxpro/HeadlessX?style=for-the-badge&logo=github)](https://github.com/saifyxpro/HeadlessX/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=for-the-badge&logo=github)](http://makeapullrequest.com)

</div>

<div align="center">

![HeadlessX Demo](assets/main.gif)

</div>

> 🎯 **Unified Solution**: Website + API on a single domain  
> 🛡️ **Advanced Anti-Detection**: Canvas/WebGL/Audio spoofing, behavioral simulation  
> 🧠 **Human-like Behavior**: Bezier mouse movements, keyboard dynamics, natural scrolling  
> 🚀 **Deploy Anywhere**: Docker, Node.js+PM2, or Development

---

## ✨ v1.3.0 Key Features

### 🛡️ **Advanced Anti-Detection Engine**
- **Canvas Fingerprinting Control** - Dynamic noise injection with consistent seeds
- **WebGL Spoofing** - GPU vendor/model spoofing with realistic profiles
- **Audio Context Manipulation** - Hardware audio fingerprint database
- **WebRTC Leak Prevention** - Complete IP leak protection
- **Hardware Fingerprint Spoofing** - CPU, memory, and performance masking

### 🧠 **Human-like Behavioral Simulation**
- **Bezier Mouse Movement** - Natural acceleration and deceleration patterns
- **Keyboard Dynamics** - Realistic dwell time and flight time variations
- **Natural Scroll Patterns** - Reader, scanner, browser behavioral profiles
- **Attention Model Simulation** - Human-like focus and interaction patterns
- **Micro-movement Injection** - Sub-pixel accuracy for maximum realism

### 🌐 **WAF Bypass Capabilities**
- **Cloudflare Bypass** - Advanced challenge solving and TLS fingerprinting
- **DataDome Evasion** - Resource blocking and behavioral pattern matching
- **Incapsula/Akamai** - Generic WAF bypass with adaptive techniques
- **HTTP/2 Fingerprinting** - Stream prioritization and header ordering

### 📊 **Comprehensive Device Profiles**
- **50+ Chrome Profiles** - Desktop, mobile, and tablet configurations
- **Hardware Consistency** - CPU, GPU, memory, and sensor correlation
- **Geolocation Intelligence** - Timezone, language, and locale matching
- **Profile Validation** - Real-time consistency checking and scoring

---


**Choose your deployment:**

| Method | Command | Best For |
|--------|---------|----------|
| 🐳 **Docker** | `docker-compose up -d` | Production, easy deployment |
| 🔧 **Auto Setup** | `chmod +x scripts/setup.sh && sudo ./scripts/setup.sh` | VPS/Server with full control |
| 💻 **Development** | `npm install && npm start` | Local development, testing |

**Access your HeadlessX v1.3.0:**
```
🌐 Website:  https://your-subdomain.yourdomain.com
🔗 API:      https://your-subdomain.yourdomain.com/api
🛡️ Stealth:  https://your-subdomain.yourdomain.com/api/render/stealth
🧪 Testing:  https://your-subdomain.yourdomain.com/api/test-fingerprint
📱 Profiles: https://your-subdomain.yourdomain.com/api/profiles
🔧 Health:   https://your-subdomain.yourdomain.com/api/health
📊 Status:   https://your-subdomain.yourdomain.com/api/status?token=YOUR_AUTH_TOKEN
```

---

## 🏗️ Enhanced Anti-Detection Architecture v1.3.0

HeadlessX v1.3.0 introduces advanced anti-detection capabilities with comprehensive fingerprinting control, behavioral simulation, and WAF bypass techniques while maintaining the modular architecture from v1.2.0.

### v1.3.0 Key Enhancements:
- **🛡️ Advanced Anti-Detection**: Canvas, WebGL, Audio, WebRTC fingerprinting control
- **🎭 Behavioral Simulation**: Human-like mouse movement with Bezier curves and keyboard dynamics
- **🌐 WAF Bypass**: Cloudflare, DataDome, and advanced evasion techniques
- **📱 Device Profiling**: Comprehensive desktop and mobile device profiles with hardware spoofing
- **🧪 Testing Framework**: Comprehensive anti-detection testing and validation
- **🔧 Separation of Concerns**: Enhanced modules for fingerprinting, behavioral, and evasion services
- **🚀 Better Performance**: Optimized browser management with intelligent profile-based pooling
- **🛠️ Developer Experience**: Development tools, profile generators, and interactive testing
- **📦 Production Ready**: Enhanced error handling, detection analytics, and profile validation
- **🔒 Security**: Advanced authentication, profile management, and secure fingerprint storage
- **📊 Monitoring**: Real-time detection monitoring, success rate analytics, and performance benchmarking

### v1.3.0 Architecture Overview:
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Routes        │───▶│   Controllers   │───▶│   Services      │
│   (api.js)      │    │   (rendering.js)│    │   (browser.js)  │
│   (admin.js)    │    │   (profiles.js) │    │   (stealth.js)  │
└─────────────────┘    │   (detection.js)│    │   (interaction.js)
         │              └─────────────────┘    └─────────────────┘
         ▼                       │                       │
┌─────────────────┐              ▼                       ▼
│   Middleware    │    ┌─────────────────┐    ┌─────────────────┐
│   (auth.js)     │    │   Utils         │    │   Config        │
│   (error.js)    │    │   (logger.js)   │    │   (index.js)    │
│   (analyzer.js) │    │   (helpers.js)  │    │   (browser.js)  │
└─────────────────┘    │   (validator.js)│    │   (profiles/)   │
         │              └─────────────────┘    └─────────────────┘
         ▼                       │                       │
┌─────────────────┐              ▼                       ▼
│ Fingerprinting  │    ┌─────────────────┐    ┌─────────────────┐
│ (canvas-spoof)  │    │   Behavioral    │    │    Evasion      │
│ (webgl-spoof)   │    │ (mouse-movement)│    │ (cloudflare)    │
│ (audio-context) │    │ (keyboard-dyn)  │    │ (datadome)      │
│ (webrtc-ctrl)   │    │ (scroll-pattern)│    │ (waf-bypass)    │
│ (hardware-noise)│    │ (attention-mod) │    │ (tls-fingerpr)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Testing      │    │  Development    │    │    Profiles     │
│ (test-framework)│    │   (dev-tools)   │    │ (chrome-prof)   │
│ (detection-test)│    │ (profile-gen)   │    │ (mobile-prof)   │
│ (performance)   │    │ (fingerpr-test) │    │ (firefox-prof)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Migration from v1.2.0:**
- All v1.2.0 functionality preserved with enhanced anti-detection capabilities
- New environment variables for fingerprint control and stealth configuration
- Enhanced API endpoints for profile management and detection testing
- Backward compatible with all existing configurations and scripts

📖 **Detailed Documentation**: [MODULAR_ARCHITECTURE.md](docs/MODULAR_ARCHITECTURE.md)

---

## 🚀 Deployment Guide

### 🐳 **Docker Deployment (Recommended)**

```bash
# Install Docker (if needed)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Deploy HeadlessX
git clone https://github.com/SaifyXPRO/HeadlessX.git
cd HeadlessX
cp .env.example .env
nano .env  # Configure DOMAIN, SUBDOMAIN, AUTH_TOKEN

# Start services
docker-compose up -d

# Optional: Setup SSL
sudo apt install certbot
sudo certbot --standalone -d your-subdomain.yourdomain.com
```

**Docker Management:**
```bash
docker-compose ps              # Check status
docker-compose logs headlessx  # View logs
docker-compose restart         # Restart services
docker-compose down            # Stop services
```

### 🔧 **Node.js + PM2 Deployment**

```bash
# Automated setup (recommended)
git clone https://github.com/SaifyXPRO/HeadlessX.git
cd HeadlessX
cp .env.example .env
nano .env  # Configure environment
chmod +x scripts/setup.sh
sudo ./scripts/setup.sh  # Installs dependencies, builds website, starts PM2
```

**🌐 Nginx Configuration (Auto-handled by setup script):**

The setup script automatically configures nginx, but if you need to manually configure:

```bash
# Copy and configure nginx site
sudo cp nginx/headlessx.conf /etc/nginx/sites-available/headlessx

# Replace placeholders with your actual domain
sudo sed -i 's/SUBDOMAIN.DOMAIN.COM/your-subdomain.yourdomain.com/g' /etc/nginx/sites-available/headlessx

# Enable the site
sudo ln -sf /etc/nginx/sites-available/headlessx /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
sudo nginx -t && sudo systemctl reload nginx
```

**Manual setup (if not using setup script):**
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential
npm install && npm run build
sudo npm install -g pm2
npm run pm2:start
```

**PM2 Management:**
```bash
npm run pm2:status     # Check status
npm run pm2:logs       # View logs
npm run pm2:restart    # Restart server
npm run pm2:stop       # Stop server
```

### 💻 **Development Setup**

```bash
git clone https://github.com/SaifyXPRO/HeadlessX.git
cd HeadlessX
cp .env.example .env
nano .env  # Set AUTH_TOKEN, DOMAIN=localhost, SUBDOMAIN=headlessx

# Make scripts executable
chmod +x scripts/*.sh

# Install dependencies
npm install
cd website && npm install && npm run build && cd ..

# Start development server
npm start  # Access at http://localhost:3000
```

---

## 🌐 API Routes & Structure

```
HeadlessX Routes:
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

## 🚀 API Examples & HTTP Integrations

### Quick Health Check (No Auth)
```bash
curl https://your-subdomain.yourdomain.com/api/health
```

### 🔧 cURL Examples

#### 🛡️ v1.3.0 Anti-Detection Rendering (Maximum Stealth)
```bash
curl -X POST "https://your-subdomain.yourdomain.com/api/render/stealth?token=YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "profile": "desktop-chrome",
    "stealthMode": "maximum",
    "behaviorSimulation": true,
    "timeout": 30000
  }'
```

#### 📱 Mobile Device Simulation
```bash
curl -X POST "https://your-subdomain.yourdomain.com/api/render?token=YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "profile": "iphone-14-pro",
    "geolocation": {"latitude": 40.7128, "longitude": -74.0060},
    "behaviorSimulation": true
  }'
```

#### 🧪 Test Anti-Detection Capabilities
```bash
curl -X POST "https://your-subdomain.yourdomain.com/api/test-fingerprint?token=YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profile": "desktop-chrome",
    "testCanvas": true,
    "testWebGL": true,
    "testAudio": true
  }'
```

#### 📊 Get Available Device Profiles
```bash
curl "https://your-subdomain.yourdomain.com/api/profiles?token=YOUR_AUTH_TOKEN"
```

#### 🎭 Behavioral Simulation with WAF Bypass
```bash
curl -X POST "https://your-subdomain.yourdomain.com/api/render?token=YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "profile": "desktop-firefox",
    "cloudflareBypass": true,
    "datadomeBypass": true,
    "mouseMovement": "natural",
    "keyboardDynamics": "human",
    "timeout": 45000
  }'
```

#### Extract HTML Content
```bash
curl -X POST "https://your-subdomain.yourdomain.com/api/html?token=YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "timeout": 30000}'
```

#### Generate Screenshot
```bash
curl "https://your-subdomain.yourdomain.com/api/screenshot?token=YOUR_AUTH_TOKEN&url=https://example.com&fullPage=true" \
  -o screenshot.png
```

#### Extract Text Only
```bash
curl -X POST "https://your-subdomain.yourdomain.com/api/text?token=YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "waitForSelector": "main"}'
```

#### Generate PDF
```bash
curl -X POST "https://your-subdomain.yourdomain.com/api/pdf?token=YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "format": "A4"}' \
  -o document.pdf
```

### 🤖 Make.com (Integromat) Integration

**HTTP Request Module Configuration:**
```json
{
  "url": "https://your-subdomain.yourdomain.com/api/html",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "qs": {
    "token": "YOUR_AUTH_TOKEN"
  },
  "body": {
    "url": "{{url_to_scrape}}",
    "timeout": 30000,
    "waitForSelector": "{{optional_selector}}"
  }
}
```

### ⚡ Zapier Integration

**Webhooks by Zapier Setup:**
- **URL:** `https://your-subdomain.yourdomain.com/api/html?token=YOUR_AUTH_TOKEN`
- **Method:** POST
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "url": "{{url_from_trigger}}",
  "timeout": 30000,
  "humanBehavior": true
}
```

### 🔗 n8n Integration

**HTTP Request Node:**
```json
{
  "url": "https://your-subdomain.yourdomain.com/api/html",
  "method": "POST",
  "authentication": "queryAuth",
  "query": {
    "token": "YOUR_AUTH_TOKEN"
  },
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "url": "={{$json.url}}",
    "timeout": 30000,
    "humanBehavior": true
  }
}
```

**Available via n8n Community Node:**
- Install: `npm install n8n-nodes-headlessx`
- [GitHub Repository](https://github.com/SaifyXPRO/n8n-nodes-headlessx)

### 🐍 Python Example
```python
import requests

def scrape_with_headlessx(url, token):
    response = requests.post(
        "https://your-subdomain.yourdomain.com/api/html",
        params={"token": token},
        json={
            "url": url,
            "timeout": 30000,
            "humanBehavior": True
        }
    )
    return response.json()

# Usage
result = scrape_with_headlessx("https://example.com", "YOUR_TOKEN")
print(result['html'])
```

### 🟨 JavaScript/Node.js Example
```javascript
const axios = require('axios');

async function scrapeWithHeadlessX(url, token) {
  try {
    const response = await axios.post(
      `https://your-subdomain.yourdomain.com/api/html?token=${token}`,
      {
        url: url,
        timeout: 30000,
        humanBehavior: true
      }
    );
    return response.data;
  } catch (error) {
    console.error('Scraping failed:', error.message);
    throw error;
  }
}

// Usage
scrapeWithHeadlessX('https://example.com', 'YOUR_TOKEN')
  .then(result => console.log(result.html))
  .catch(error => console.error(error));
```

### 🔄 Batch Processing Example
```bash
curl -X POST "https://your-subdomain.yourdomain.com/api/batch?token=YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://example1.com",
      "https://example2.com",
      "https://example3.com"
    ],
    "timeout": 30000,
    "humanBehavior": true
  }'
```

### Batch Processing
```bash
curl -X POST "https://your-subdomain.yourdomain.com/api/batch?token=YOUR_AUTH_TOKEN" \
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
HeadlessX v1.3.0 - Enhanced Anti-Detection Architecture/
├── 📂 src/                         # Modular application source
│   ├── 📂 config/                  # Configuration management
│   │   ├── index.js               # Main configuration loader
│   │   └── browser.js             # Browser-specific settings
│   ├── 📂 utils/                   # Utility functions
│   │   ├── errors.js              # Error handling & categorization
│   │   ├── logger.js              # Structured logging
│   │   └── helpers.js             # Common utilities
│   ├── 📂 services/                # Business logic services
│   │   ├── browser.js             # Browser lifecycle management
│   │   ├── stealth.js             # Anti-detection techniques
│   │   ├── interaction.js         # Human-like behavior
│   │   └── rendering.js           # Core rendering logic
│   ├── 📂 middleware/              # Express middleware
│   │   ├── auth.js                # Authentication
│   │   └── error.js               # Error handling
│   ├── 📂 controllers/             # Request handlers
│   │   ├── system.js              # Health & status endpoints
│   │   ├── rendering.js           # Main rendering endpoints
│   │   ├── batch.js               # Batch processing
│   │   └── get.js                 # GET endpoints & docs
│   ├── 📂 routes/                  # Route definitions
│   │   ├── api.js                 # API route mappings
│   │   └── static.js              # Static file serving
│   ├── app.js                     # Main application setup
│   ├── server.js                  # Entry point for PM2
│   └── rate-limiter.js            # Rate limiting implementation
├── 📂 website/                     # Next.js website (unchanged)
│   ├── app/                        # Next.js 13+ app directory
│   ├── components/                 # React components
│   ├── .env.example               # Website environment template
│   ├── next.config.js             # Next.js configuration
│   └── package.json               # Website dependencies
├── 📂 scripts/                     # Deployment & management scripts
│   ├── setup.sh                   # Automated installation (updated)
│   ├── update_server.sh           # Server update script (updated)
│   ├── verify-domain.sh           # Domain verification
│   └── test-routing.sh            # Integration testing
├── 📂 nginx/                       # Nginx configuration
│   └── headlessx.conf             # Nginx proxy config
├── 📂 docker/                      # Docker deployment (updated)
│   ├── Dockerfile                 # Container definition
│   └── docker-compose.yml         # Docker Compose setup
├── ecosystem.config.js            # PM2 configuration (moved to root)
├── .env.example                   # Environment template (updated)
├── package.json                   # Server dependencies (updated)
├── docs/
│   └── MODULAR_ARCHITECTURE.md   # Architecture documentation
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
export AUTH_TOKEN="development_token_123"
export DOMAIN="localhost"
export SUBDOMAIN="headlessx"

# 4. Start server
npm start  # Uses src/app.js

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

## ⚙️ Configuration

### 🌐 **Environment Variables (.env)**

Create your `.env` file from the template:
```bash
cp .env.example .env
nano .env
```

**Required configuration:**
```bash
# Security Token (Generate a secure random string)
AUTH_TOKEN=your_secure_token_here

# Domain Configuration  
DOMAIN=yourdomain.com
SUBDOMAIN=headlessx

# Optional: Browser Settings
BROWSER_TIMEOUT=60000
MAX_CONCURRENT_BROWSERS=5

# Optional: Server Settings
PORT=3000
NODE_ENV=production
```

### 🌐 **Nginx Domain Setup**

**Option 1: Automatic (Recommended)**
```bash
# The setup script automatically replaces domain placeholders
sudo ./scripts/setup.sh
```

**Option 2: Manual Configuration**
```bash
# Copy nginx configuration
sudo cp nginx/headlessx.conf /etc/nginx/sites-available/headlessx

# Replace domain placeholders (replace with your actual domain)
sudo sed -i 's/SUBDOMAIN.DOMAIN.COM/headlessx.yourdomain.com/g' /etc/nginx/sites-available/headlessx

# Example: If your domain is "api.example.com"
sudo sed -i 's/SUBDOMAIN.DOMAIN.COM/api.example.com/g' /etc/nginx/sites-available/headlessx

# Enable site and reload nginx
sudo ln -sf /etc/nginx/sites-available/headlessx /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

**Your final URLs will be:**
- Website: `https://your-subdomain.yourdomain.com`
- API Health: `https://your-subdomain.yourdomain.com/api/health`
- API Endpoints: `https://your-subdomain.yourdomain.com/api/*`

---

## 📊 API Reference

### 🔧 **Core Endpoints**

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/health` | GET | Health check | ❌ |
| `/api/status` | GET | Server status | ✅ |
| `/api/render` | POST | Full page rendering (JSON) | ✅ |
| `/api/html` | GET/POST | Raw HTML extraction | ✅ |
| `/api/content` | GET/POST | Clean text extraction | ✅ |
| `/api/screenshot` | GET | Screenshot generation | ✅ |
| `/api/pdf` | GET | PDF generation | ✅ |
| `/api/batch` | POST | Batch URL processing | ✅ |

### 🔑 **Authentication**
All endpoints (except `/api/health`) require a token via:
- Query parameter: `?token=YOUR_TOKEN`
- Header: `X-Token: YOUR_TOKEN`
- Header: `Authorization: Bearer YOUR_TOKEN`

### 📖 **Complete Documentation**
Visit your HeadlessX website for full API documentation with examples, or check:
- [GET Endpoints](docs/GET_ENDPOINTS.md)
- [POST Endpoints](docs/POST_ENDPOINTS.md)

---

## 📊 Monitoring & Troubleshooting

### 🔍 **Health Checks**
```bash
curl https://your-subdomain.yourdomain.com/api/health
curl "https://your-subdomain.yourdomain.com/api/status?token=YOUR_TOKEN"
```

### 📋 **Log Management**
```bash
# PM2 logs
npm run pm2:logs
pm2 logs headlessx --lines 100

# Docker logs
docker-compose logs -f headlessx

# Nginx logs
sudo tail -f /var/log/nginx/access.log
```

### 🔄 **Updates**
```bash
git pull origin main
npm run build          # Rebuild website
npm run pm2:restart     # PM2
# OR
docker-compose restart  # Docker
```

### 🔧 **Common Issues**

**"npm ci" Error (missing package-lock.json):**
```bash
chmod +x scripts/generate-lockfiles.sh
./scripts/generate-lockfiles.sh  # Generate lock files
# OR
npm install --production  # Use install instead
```

**"Cannot find module 'express'":**
```bash
npm install  # Install dependencies
```

**System dependency errors (Ubuntu):**
```bash
sudo apt update && sudo apt install -y \
  libatk1.0-0t64 libatk-bridge2.0-0t64 libcups2t64 \
  libatspi2.0-0t64 libasound2t64 libxcomposite1
```

**PM2 not starting:**
```bash
sudo npm install -g pm2
chmod +x scripts/setup.sh  # Make script executable
pm2 start config/ecosystem.config.js
pm2 logs headlessx  # Check errors
```

**Script permission errors:**
```bash
# Make all scripts executable
chmod +x scripts/*.sh

# Or use the quick setup
chmod +x scripts/quick-setup.sh && ./scripts/quick-setup.sh
```

**Playwright browser installation errors:**
```bash
# Use dedicated Playwright setup script
chmod +x scripts/setup-playwright.sh
./scripts/setup-playwright.sh

# Or install manually:
sudo apt update && sudo apt install -y \
  libgtk-3-0t64 libpangocairo-1.0-0 libcairo-gobject2 \
  libgdk-pixbuf-2.0-0 libdrm2 libxss1 libxrandr2 \
  libasound2t64 libatk1.0-0t64 libnss3

# Install only Chromium (most stable)
npx playwright install chromium

# Alternative: Use Docker (avoids dependency issues)
docker-compose up -d
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
- **💬 Community**: [GitHub Discussions](https://github.com/SaifyXPRO/HeadlessX/discussions) (Coming Soon)

---

## 🎯 Built by SaifyXPRO

**HeadlessX v1.1.0** - The most advanced open-source browserless web scraping solution.

Made with ❤️ for the developer community.