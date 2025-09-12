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

### 1️⃣ Clone & Configure
```bash
git clone https://github.com/SaifyXPRO/HeadlessX.git
cd HeadlessX

# Configure your domain and token
cp .env.example .env
nano .env  # Update DOMAIN, SUBDOMAIN, and TOKEN
```

### 2️⃣ Environment Setup
```env
# Required Configuration
DOMAIN=yourdomain.com
SUBDOMAIN=headlessx
TOKEN=your_secure_random_token_here

# Optional
PORT=3000
NODE_ENV=production
```

### 3️⃣ Choose Deployment Method

**🐳 Docker (Recommended)**
```bash
docker-compose up -d
```

**🔧 Automated Setup**
```bash
chmod +x scripts/setup.sh
sudo ./scripts/setup.sh
```

**💻 Manual Development**
```bash
# Install dependencies
npm install
cd website && npm install && npm run build && cd ..

# Start server
node src/server.js
```

### 4️⃣ Access Your HeadlessX
```
🌐 Website:    https://your-subdomain.yourdomain.com
🔧 API Health: https://your-subdomain.yourdomain.com/api/health  
📊 API Status: https://your-subdomain.yourdomain.com/api/status?token=YOUR_TOKEN
📖 API Docs:   Visit your website for full documentation
```

---

## 🏗️ Architecture Overview

HeadlessX runs as a **unified Node.js application**:

```
your-subdomain.yourdomain.com/
├── /                    → Website (Landing page + docs)
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

### Health Monitoring
```bash
# Check server status
curl https://your-subdomain.yourdomain.com/api/health

# Detailed status (requires token)
curl "https://your-subdomain.yourdomain.com/api/status?token=YOUR_TOKEN"

# PM2 process monitoring
pm2 status
pm2 logs headlessx
```

### Log Management
```bash
# View server logs
pm2 logs headlessx --lines 100

# View nginx logs  
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Updates
```bash
# Pull latest updates
git pull origin main

# Rebuild website
cd website && npm run build && cd ..

# Restart server
pm2 restart headlessx
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