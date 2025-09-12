# 🚀 HeadlessX v1.1.0

**Advanced Browserless Web Scraping API with Human-like Behavior**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![Playwright](https://img.shields.io/badge/Playwright-Latest-blue.svg)](https://playwright.dev/)

> 🎯 **Unified Solution**: Website + API on a single domain  
> 🧠 **Human-like Behavior**: 40+ anti-detection techniques  
> � **Deploy Anywhere**: Docker, Node.js+PM2, or Development

---

## ✨ Key Features

- **🌐 Unified Architecture**: Website and API on one domain
- **🧠 Human-like Intelligence**: Natural mouse movements, smart scrolling, behavioral randomization
- **� Multiple Formats**: HTML, text, screenshots, PDFs
- **⚡ Batch Processing**: Handle multiple URLs efficiently
- **🔒 Production Ready**: Docker, PM2, Nginx, SSL support
- **🛡️ Anti-Detection**: 40+ stealth techniques for reliable scraping

---

## 🎯 Quick Start

```bash
# 1. Clone and configure
git clone https://github.com/SaifyXPRO/HeadlessX.git
cd HeadlessX

# Quick setup (makes scripts executable + creates .env)
chmod +x scripts/quick-setup.sh && ./scripts/quick-setup.sh
# Then edit: nano .env  # Update DOMAIN, SUBDOMAIN, and TOKEN
```

**Choose your deployment:**

| Method | Command | Best For |
|--------|---------|----------|
| 🐳 **Docker** | `docker-compose up -d` | Production, easy deployment |
| 🔧 **Auto Setup** | `chmod +x scripts/setup.sh && sudo ./scripts/setup.sh` | VPS/Server with full control |
| 💻 **Development** | `npm install && npm start` | Local development, testing |

**Access your HeadlessX:**
```
🌐 Website:  https://your-subdomain.yourdomain.com
🔧 Health:   https://your-subdomain.yourdomain.com/api/health
📊 Status:   https://your-subdomain.yourdomain.com/api/status?token=YOUR_TOKEN
```

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
nano .env  # Configure DOMAIN, SUBDOMAIN, TOKEN

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

# Manual setup
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
nano .env  # Set TOKEN, DOMAIN=localhost, SUBDOMAIN=headlessx

# Make scripts executable
chmod +x scripts/*.sh

# Install dependencies
npm install
cd website && npm install && npm run build && cd ..

# Start development server
npm start  # Access at http://localhost:3000
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

## � Monitoring & Troubleshooting

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