# HeadlessX v1.1.0 - Open Source Browserless Web Scraping API

A powerful, production-ready browserless web scraping API that renders JavaScript-heavy websites with human-like behavior simulation. Built with Node.js and Playwright, HeadlessX provides multiple output formats and advanced anti-detection techniques.

## ✨ Key Features

- 🌐 **Advanced JavaScript Rendering** - Handles complex SPAs with dynamic content
- 🎭 **Human-like Behavior** - Natural mouse movements, realistic scrolling, stealth techniques
- ⚡ **Smart Timeout Handling** - Partial content recovery on timeouts
- 🆘 **Emergency Extraction** - Fallback mechanisms for difficult sites
- 📸 **Screenshot Capture** - PNG/JPEG format support
- 📄 **PDF Generation** - Full page PDF export
- 🔄 **Batch Processing** - Process multiple URLs with controlled concurrency
- 🧹 **Clean Text Extraction** - Intelligent content parsing
- 🔐 **Token Authentication** - Secure API access
- 🐳 **Docker Ready** - Complete containerization support
- 📊 **Comprehensive Monitoring** - Health checks and detailed status
- 🛡️ **Anti-Detection** - 40+ stealth techniques, realistic user agents
- 🌟 **Beautiful Landing Page** - Professional Next.js website included

## 🚀 Quick Start

### 🔒 **IMPORTANT SECURITY SETUP**

**⚠️ CRITICAL:** Before deploying, you MUST set a secure authentication token:

```bash
# Generate a secure random token (choose one method):
openssl rand -hex 32
# OR
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Set it as environment variable:
export TOKEN="your_generated_secure_token_here"
```

**Never use the example tokens from documentation in production!**

### Prerequisites
- Ubuntu 20.04+ LTS VPS or Docker
- Node.js 18+ (if not using Docker)
- 4GB+ RAM recommended
- Domain name (optional, for custom domains)

### Method 1: Docker Deployment (Recommended)

```bash
# 1. Clone the HeadlessX project
git clone https://github.com/saifyxpro/headlessx.git
cd headlessx

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your domain and secure token
nano .env

# 3. Generate a secure token
export TOKEN=$(openssl rand -hex 32)
echo "Your secure token: $TOKEN"
# SAVE THIS TOKEN! You'll need it for API calls

# 4. Start with docker-compose (serves both website and API)
docker-compose -f docker/docker-compose.yml up -d

# 5. Check status
docker-compose -f docker/docker-compose.yml logs -f

# 6. Test your deployment:
# Website: http://your-server-ip/
# API Health: http://your-server-ip/api/health
# API Test: http://your-server-ip/api/status?token=YOUR_TOKEN
```

### Method 2: Manual Installation

```bash
# 1. Clone the HeadlessX project
git clone https://github.com/saifyxpro/headlessx.git
cd headlessx

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your domain and secure token
nano .env

# 3. Run the automated setup script
chmod +x scripts/setup.sh
./scripts/setup.sh

# 4. Start with PM2
pm2 start config/ecosystem.config.js
pm2 save
pm2 startup
```

## 📡 API Endpoints

HeadlessX provides comprehensive REST API endpoints for all your browserless needs:

### Core Endpoints

#### 1. Health Check
```bash
GET /api/health
```
**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-09-12T12:00:00.000Z",
  "browserConnected": true,
  "uptime": "2h 30m 45s",
  "memory": {
    "rss": "245MB",
    "heapTotal": "180MB",
    "heapUsed": "120MB",
    "external": "50MB"
  },
  "version": "1.1.0",
  "features": [
    "Advanced timeout handling",
    "Partial content recovery",
    "Emergency extraction",
    "Screenshot capture",
    "PDF generation",
    "Batch processing",
    "Clean text extraction",
    "Human-like behavior simulation",
    "Advanced stealth techniques"
  ]
}
```

#### 2. Server Status
```bash
GET /api/status
```
**Response:** Detailed HeadlessX server information including endpoints, memory usage, and browser status.

#### 3. Full Page Rendering (JSON)
```bash
POST /api/render?token=YOUR_TOKEN
Content-Type: application/json

{
  "url": "https://example.com",
  "waitUntil": "networkidle",
  "timeout": 60000,
  "extraWaitTime": 10000,
  "scrollToBottom": true,
  "waitForSelectors": [".content", ".main"],
  "clickSelectors": [".load-more", ".accept-cookies"],
  "removeElements": [".ads", ".popup"],
  "captureConsole": true,
  "returnPartialOnTimeout": true
}
```

#### 4. Raw HTML Extraction
```bash
# POST method
POST /api/html?token=YOUR_TOKEN
Content-Type: application/json
{
  "url": "https://example.com",
  "timeout": 60000
}

# GET method (easier for testing)
GET /api/html?token=YOUR_TOKEN&url=https://example.com&timeout=60000
```

#### 5. Clean Text Extraction
```bash
# POST method
POST /api/content?token=YOUR_TOKEN
Content-Type: application/json
{
  "url": "https://example.com"
}

# GET method
GET /api/content?token=YOUR_TOKEN&url=https://example.com
```

#### 6. Screenshot Capture
```bash
GET /api/screenshot?token=YOUR_TOKEN&url=https://example.com&fullPage=true&format=png&width=1920&height=1080
```

#### 7. PDF Generation
```bash
GET /api/pdf?token=YOUR_TOKEN&url=https://example.com&format=A4&background=true
```

#### 8. Batch Processing
```bash
POST /api/batch?token=YOUR_TOKEN
Content-Type: application/json

{
  "urls": [
    "https://example1.com",
    "https://example2.com",
    "https://example3.com"
  ],
  "concurrency": 3,
  "timeout": 60000,
  "scrollToBottom": true
}
```

📚 **Complete Documentation:**
- 📤 [GET Endpoints Documentation](docs/GET_ENDPOINTS.md) - Detailed GET API reference
- 📤 [POST Endpoints Documentation](docs/POST_ENDPOINTS.md) - Detailed POST API reference
- 🌐 [Custom Domain Setup Guide](docs/DOMAIN_SETUP.md) - Complete domain configuration with SSL
- 🎭 [Human Behavior Simulation](docs/HUMAN_BEHAVIOR_UPDATE.md) - Advanced anti-detection techniques
- 🚀 [Quick Deployment Guide](DEPLOYMENT.md) - Fast deployment instructions

## 🔧 Make.com Integration

HeadlessX is perfect for Make.com (formerly Integromat) automation workflows:

### Option 1: Raw HTML (Recommended)
```
Method: POST
URL: https://your-subdomain.yourdomain.com/api/html?token=YOUR_TOKEN
Headers: Content-Type: application/json
Body: {
  "url": "{{dynamic_url}}",
  "timeout": 60000,
  "scrollToBottom": true
}
```
**Returns:** Raw HTML content (not JSON)

### Option 2: Clean Text Content
```
Method: GET
URL: https://your-subdomain.yourdomain.com/api/content?token=YOUR_TOKEN&url={{encoded_url}}
```
**Returns:** Clean text content only

### Option 3: Screenshot
```
Method: GET
URL: https://your-subdomain.yourdomain.com/api/screenshot?token=YOUR_TOKEN&url={{encoded_url}}&fullPage=true
```
**Returns:** PNG/JPEG image data

### Option 4: JSON Response
```
Method: POST
URL: https://your-subdomain.yourdomain.com/api/render?token=YOUR_TOKEN
Body: {"url": "{{dynamic_url}}"}
```
**Returns:** JSON with html, title, timestamp, etc.

## 📁 Project Structure

This HeadlessX project includes all necessary files:

```
📁 HeadlessX/
├── 📄 server.js                    # Main HeadlessX server with human-like behavior
├── 📄 package.json                 # Project dependencies and scripts
├── 📄 Dockerfile                   # Docker container configuration  
├── 📄 docker-compose.yml           # Docker Compose setup
├── 📄 ecosystem.config.js          # PM2 process manager configuration
├── 📄 .env.example                 # Environment variables template
├── 📄 .gitignore                   # Git ignore patterns
├── 📄 setup.sh                     # Automated setup script
├── � verify-domain.sh             # Domain verification tool
├── �📚 README.md                    # This comprehensive guide
├── 📖 GET_ENDPOINTS.md             # Complete GET API documentation
├── 📖 POST_ENDPOINTS.md            # Complete POST API documentation
├── 📖 DEPLOYMENT.md                # Quick deployment guide
├── 📖 DOMAIN_SETUP.md              # Complete domain setup with SSL
└── 📖 HUMAN_BEHAVIOR_UPDATE.md     # v1.1.0 enhancement details
```

All files are included - no manual file creation needed!

## 🌐 Domain & SSL Setup

### DNS Configuration
Add A record:
- **Name**: `headlessx` (or subdomain of choice)
- **Type**: `A`
- **Value**: `YOUR_VPS_IP`

### Nginx Reverse Proxy

The project includes a pre-configured Nginx setup. Create `/etc/nginx/sites-available/headlessx`:

```nginx
# Rate limiting configuration
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;

server {
    listen 80;
    server_name your-subdomain.yourdomain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-Robots-Tag "noindex, nofollow" always;
    
    # File upload limit
    client_max_body_size 50M;
    
    location / {
        # Rate limiting
        limit_req zone=api burst=50 nodelay;
        
        proxy_pass http://your-subdomain.yourdomain.com;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Extended timeouts for rendering
        proxy_connect_timeout 90s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
}
```

Enable site and SSL:
```bash
sudo ln -s /etc/nginx/sites-available/headlessx /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Install SSL certificate
sudo certbot --nginx -d your-subdomain.yourdomain.com
```

## 🔒 Security & Production Setup

### Environment Variables
The project includes `.env.example` - copy and customize:
```bash
cp .env.example .env
nano .env  # Update your secure token
```

### Process Management (PM2)
The project includes `ecosystem.config.js` for PM2:

```bash
# Install PM2 (included in setup.sh)
sudo npm install -g pm2

# Start HeadlessX with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Docker Deployment
The project includes `Dockerfile` and `docker-compose.yml`:

```bash
# Using docker-compose (recommended)
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

## 🐛 Troubleshooting

### Common Issues

**1. Browser Launch Failures**
```bash
# Install missing dependencies
npx playwright install-deps
sudo apt install -y libgbm1 libasound2 libxss1 libgconf-2-4
```

**2. Memory Issues**
```bash
# Check memory usage
free -h
docker stats  # For Docker deployments

# Increase swap if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

**3. Timeout Issues**
- Increase `timeout` and `extraWaitTime` parameters
- Use `returnPartialOnTimeout: true` for difficult sites
- Try different `waitUntil` conditions

**4. Authentication Issues**
```bash
# Test token
curl -H "X-Token: YOUR_TOKEN" https://your-subdomain.yourdomain.com/health
```

### Health Check Commands
```bash
# Local health check
curl http://your-subdomain.yourdomain.com/health

# Remote health check
curl https://playwright.yourdomain.com/health

# Test rendering
curl -X POST "https://playwright.yourdomain.com/render?token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","timeout":30000}'

# Test with difficult site
curl -X POST "https://playwright.yourdomain.com/html?token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://spa-example.com","waitUntil":"networkidle","timeout":90000,"scrollToBottom":true}'
```

## 📊 Monitoring & Logs

### Log Files
- **Node.js Direct**: `~/playwright-server/logs/`
- **Docker**: `docker logs enhanced-playwright-server`
- **PM2**: `pm2 logs playwright-server`
- **Nginx**: `/var/log/nginx/access.log`

### Performance Monitoring
```bash
# PM2 monitoring
pm2 monit

# Docker stats
docker stats enhanced-playwright-server

# System resources
htop
df -h
```

### Log Analysis
```bash
# Check for errors
tail -f logs/err.log

# Monitor requests
tail -f /var/log/nginx/access.log

# Check browser crashes
grep -i "browser" logs/combined.log
```

## 🔄 Updates & Maintenance

### Update Playwright
```bash
npm update playwright
npx playwright install  # Update browsers
pm2 restart playwright-server
```

### Docker Updates
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Backup Strategy
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /tmp/playwright-backup-$DATE.tar.gz \
  ~/playwright-server \
  /etc/nginx/sites-available/playwright \
  ~/.pm2
echo "Backup created: /tmp/playwright-backup-$DATE.tar.gz"
EOF

chmod +x backup.sh
./backup.sh
```

## 📈 Performance Optimization

### Server Tuning
```javascript
// Add to server.js for production
process.env.UV_THREADPOOL_SIZE = '128';

// Browser pool optimization
const BROWSER_POOL_SIZE = 3;
const browserPool = [];
```

### Nginx Optimization
```nginx
# Add to nginx.conf
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript;
}
```

## 📚 Advanced Usage Examples

### Complex Site Scraping
```javascript
// Example for SPA with authentication
{
  "url": "https://complex-spa.com/dashboard",
  "timeout": 120000,
  "extraWaitTime": 15000,
  "waitForSelectors": [".dashboard-content", ".data-table"],
  "clickSelectors": [".cookie-accept", ".load-more-data"],
  "removeElements": [".ads", ".chat-widget", ".overlay"],
  "customScript": "localStorage.setItem('auth', 'token123'); window.loadData();",
  "scrollToBottom": true,
  "captureConsole": true
}
```

### Batch Processing Example
```javascript
{
  "urls": [
    "https://site1.com/page1",
    "https://site1.com/page2", 
    "https://site2.com/data",
    "https://site3.com/content"
  ],
  "concurrency": 2,
  "timeout": 60000,
  "scrollToBottom": true,
  "removeElements": [".ads", ".social-share"],
  "returnPartialOnTimeout": true
}
```

## 🆘 Emergency Recovery

If the server becomes unresponsive:

```bash
# Force restart PM2
pm2 delete all && pm2 start ecosystem.config.js

# Docker force restart
docker-compose down --timeout 10
docker-compose up -d

# System cleanup
sudo systemctl restart nginx
sudo reboot  # If necessary
```

## 📄 License

MIT License - Feel free to use in commercial projects.

---

## 🎯 HeadlessX vs Other Solutions

| Feature | HeadlessX | Puppeteer | Selenium | Browserless |
|---------|-----------|-----------|----------|-------------|
| **Human-like Behavior** | ✅ Advanced | ❌ Basic | ❌ Basic | ⚠️ Limited |
| **Anti-Detection** | ✅ 40+ techniques | ⚠️ Some | ❌ Minimal | ⚠️ Basic |
| **User Agent Rotation** | ✅ 9 realistic | ❌ Static | ❌ Manual | ⚠️ Limited |
| **Timeout Recovery** | ✅ Emergency extraction | ❌ Fail | ❌ Fail | ⚠️ Basic |
| **Docker Ready** | ✅ Complete setup | ⚠️ Manual | ⚠️ Manual | ✅ Yes |
| **REST API** | ✅ 8 endpoints | ❌ DIY | ❌ DIY | ✅ Basic |
| **Batch Processing** | ✅ Built-in | ❌ Manual | ❌ Manual | ⚠️ Limited |
| **Setup Complexity** | 🟢 Simple | 🟡 Medium | 🔴 Complex | 🟡 Medium |

## 📈 Performance Optimization

The project includes optimized configurations:

### Server Tuning
- Process pooling with PM2
- Memory management settings
- Advanced browser launch arguments
- Connection pooling

### Docker Optimization
- Multi-stage builds in Dockerfile
- Resource limits in docker-compose.yml
- Health checks included
- Volume optimization

## 🎉 Key Improvements in HeadlessX v1.1.0

- ✅ **Human-like Behavior** - Mouse movements, natural scrolling
- ✅ **Advanced Stealth** - 40+ anti-detection techniques  
- ✅ **User Agent Rotation** - 9 realistic Windows browsers
- ✅ **Emergency Recovery** - Never lose data due to timeouts
- ✅ **Complete Project** - All files included, no setup needed
- ✅ **Production Ready** - Docker, PM2, Nginx configurations
- ✅ **Comprehensive Docs** - GET/POST endpoints fully documented

## 📄 License

MIT License - Feel free to use in commercial projects.

---

## 🚀 Get Started with HeadlessX

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SaifyXPRO/HeadlessX.git
   cd HeadlessX
   ```

2. **Choose your deployment method:**
   - 🐳 **Docker:** `docker-compose up -d`
   - 🔧 **Node.js:** `./scripts/setup.sh && pm2 start config/ecosystem.config.js`

3. **Test your HeadlessX instance:**
   ```bash
   curl http://your-subdomain.yourdomain.com/health
   ```

4. **Start scraping with human-like behavior:**
   ```bash
   curl -X POST "http://your-subdomain.yourdomain.com/html?token=YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://example.com"}'
   ```

**🎯 HeadlessX - The most advanced browserless solution with human-like behavior!**

For questions or support, check the documentation files or monitor the logs for detailed information.
