# 🚀 HeadlessX Deployment Guide

Complete guide for deploying HeadlessX v1.1.0 with integrated website and API server.

## 🏗️ Architecture Overview

HeadlessX v1.1.0 uses a **unified architecture** where a single Node.js server handles both the website and API:

```
Internet → Nginx → Node.js Server (Port 3000)
                   ├── / → Website (Next.js)
                   └── /api/* → API Endpoints
```

**Benefits:**
- ✅ Single domain for everything
- ✅ Simplified deployment and maintenance  
- ✅ Better performance (no separate static file serving)
- ✅ Integrated monitoring and logging

---

## 🎯 Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04+ LTS (recommended)
- **Memory**: 2GB+ RAM
- **Storage**: 5GB+ free space
- **Network**: Public IP address

### Domain Requirements
- **Domain Name**: e.g., `yourdomain.com`
- **Subdomain**: e.g., `headlessx.yourdomain.com`
- **DNS Access**: Ability to create A records

---

## 🚀 Quick Deployment

### Method 1: Automated Setup (Recommended)

```bash
# 1. Clone repository
git clone https://github.com/SaifyXPRO/HeadlessX.git
cd HeadlessX

# 2. Configure environment
cp .env.example .env
nano .env  # Set DOMAIN, SUBDOMAIN, and TOKEN

# 3. Run automated setup
chmod +x scripts/setup.sh
sudo ./scripts/setup.sh

# 4. Configure SSL (included in setup)
sudo certbot --nginx -d your-subdomain.yourdomain.com
```

### Method 2: Docker Deployment

```bash
# 1. Clone and configure
git clone https://github.com/SaifyXPRO/HeadlessX.git
cd HeadlessX
cp .env.example .env
nano .env

# 2. Deploy with Docker
docker-compose up -d

# 3. Configure nginx on host
sudo cp nginx/headlessx.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/headlessx /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## ⚙️ Environment Configuration

### Required Variables
```env
# Domain Configuration
DOMAIN=yourdomain.com           # Your root domain
SUBDOMAIN=headlessx             # Your subdomain

# Security
TOKEN=your_secure_random_token  # Generate with: openssl rand -hex 32

# Server Configuration
PORT=3000                       # Internal port (nginx proxies to this)
NODE_ENV=production            # Production mode
```

### Generate Secure Token
```bash
# Method 1: OpenSSL
openssl rand -hex 32

# Method 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Method 3: Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## 🌐 DNS Configuration

### 1. Create A Record
```
Type: A
Name: your-subdomain (e.g., headlessx)
Value: YOUR_SERVER_IP
TTL: 300 (5 minutes)
```

### 2. Verify DNS Propagation
```bash
# Check DNS resolution
dig your-subdomain.yourdomain.com

# Test with nslookup
nslookup your-subdomain.yourdomain.com

# Online tools
# https://dnschecker.org
```

---

## 🔧 Manual Installation Steps

### 1. System Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx ufw
```

### 2. Node.js Installation
```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential
```

### 3. Project Setup
```bash
# Clone repository
git clone https://github.com/SaifyXPRO/HeadlessX.git
cd HeadlessX

# Install server dependencies
npm install

# Build website
cd website
npm install
npm run build
cd ..
```

### 4. Environment Configuration
```bash
# Configure environment
cp .env.example .env
nano .env

# Example configuration:
echo "DOMAIN=yourdomain.com" >> .env
echo "SUBDOMAIN=headlessx" >> .env
echo "TOKEN=$(openssl rand -hex 32)" >> .env
echo "PORT=3000" >> .env
echo "NODE_ENV=production" >> .env
```

### 5. Process Manager Setup
```bash
# Install PM2
sudo npm install -g pm2

# Start HeadlessX
pm2 start config/ecosystem.config.js

# Save PM2 configuration
pm2 save

# Enable PM2 startup
pm2 startup
# Run the command PM2 outputs
```

### 6. Nginx Configuration
```bash
# Copy nginx configuration
sudo cp nginx/headlessx.conf /etc/nginx/sites-available/headlessx

# Update domain in config (if needed)
sudo sed -i 's/SUBDOMAIN.DOMAIN.COM/your-subdomain.yourdomain.com/g' /etc/nginx/sites-available/headlessx

# Enable site
sudo ln -sf /etc/nginx/sites-available/headlessx /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### 7. SSL Certificate
```bash
# Install SSL certificate
sudo certbot --nginx -d your-subdomain.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

### 8. Firewall Setup
```bash
# Configure UFW firewall
sudo ufw allow 22     # SSH
sudo ufw allow 80     # HTTP
sudo ufw allow 443    # HTTPS
sudo ufw --force enable
```

---

## 🧪 Testing Deployment

### 1. Basic Health Check
```bash
# Test without SSL
curl http://your-subdomain.yourdomain.com/api/health

# Test with SSL
curl https://your-subdomain.yourdomain.com/api/health
```

### 2. Website Test
```bash
# Check website loads
curl -I https://your-subdomain.yourdomain.com/

# Check specific routes
curl https://your-subdomain.yourdomain.com/robots.txt
curl https://your-subdomain.yourdomain.com/favicon.ico
```

### 3. API Test
```bash
# Test authenticated endpoint
curl "https://your-subdomain.yourdomain.com/api/status?token=YOUR_TOKEN"

# Test HTML extraction
curl -X POST "https://your-subdomain.yourdomain.com/api/html?token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://httpbin.org/html"}'
```

### 4. Integration Test Script
```bash
# Run comprehensive test
bash scripts/verify-domain.sh
```

---

## 📊 Monitoring & Maintenance

### Process Monitoring
```bash
# Check PM2 status
pm2 status
pm2 logs headlessx
pm2 monit

# Restart if needed
pm2 restart headlessx
```

### Nginx Monitoring
```bash
# Check nginx status
sudo systemctl status nginx

# View logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Test configuration
sudo nginx -t
```

### System Resources
```bash
# Check memory usage
free -h

# Check disk usage
df -h

# Check processes
top
htop
```

---

## 🔄 Updates & Maintenance

### Updating HeadlessX
```bash
# Pull latest changes
git pull origin main

# Update server dependencies
npm install

# Rebuild website
cd website
npm install
npm run build
cd ..

# Restart application
pm2 restart headlessx
```

### SSL Certificate Renewal
```bash
# Certificates auto-renew, but to test:
sudo certbot renew --dry-run

# Force renewal if needed
sudo certbot renew --force-renewal -d your-subdomain.yourdomain.com
```

### Log Rotation
```bash
# PM2 logs are automatically rotated
pm2 install pm2-logrotate

# Configure nginx log rotation (usually pre-configured)
sudo logrotate /etc/logrotate.d/nginx
```

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Website Not Loading
```bash
# Check if server is running
pm2 status

# Check nginx is proxying correctly
sudo nginx -t
curl http://localhost:3000/api/health

# Check firewall
sudo ufw status
```

#### 2. API 401 Unauthorized
```bash
# Verify token in .env file
cat .env | grep TOKEN

# Test with correct token
curl "https://your-subdomain.yourdomain.com/api/status?token=YOUR_ACTUAL_TOKEN"
```

#### 3. SSL Issues
```bash
# Check certificate status
sudo certbot certificates

# Test SSL configuration
openssl s_client -connect your-subdomain.yourdomain.com:443
```

#### 4. High Memory Usage
```bash
# Check memory usage
pm2 monit

# Restart to clear memory
pm2 restart headlessx

# Adjust PM2 configuration in config/ecosystem.config.js
```

### Getting Help

1. **Check logs**: `pm2 logs headlessx`
2. **Test components**: Use the verification script
3. **GitHub Issues**: Report problems with full logs
4. **Documentation**: Visit your deployed website for API docs

---

## 🎯 Production Checklist

- [ ] Domain DNS configured and propagated
- [ ] Environment variables set correctly
- [ ] Secure token generated and configured
- [ ] Server dependencies installed
- [ ] Website built successfully
- [ ] PM2 process running
- [ ] Nginx configured and running
- [ ] SSL certificate installed and working
- [ ] Firewall configured properly
- [ ] Health checks passing
- [ ] API endpoints responding
- [ ] Website loading correctly
- [ ] Monitoring and logs working

---

## 📈 Performance Optimization

### Server Optimization
```bash
# Enable nginx gzip compression
# Add to nginx config:
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# Increase file upload limits for large requests
client_max_body_size 10M;
```

### PM2 Optimization
```javascript
// In config/ecosystem.config.js
module.exports = {
  apps: [{
    name: 'headlessx',
    script: './src/server.js',
    instances: 'max',  // Use all CPU cores
    exec_mode: 'cluster',
    max_memory_restart: '1G',  // Restart if memory exceeds 1GB
    node_args: '--max-old-space-size=2048'  // Increase Node.js heap
  }]
};
```

### Monitoring Setup
```bash
# Install monitoring tools
sudo npm install -g pm2-web-dashboard

# Start monitoring dashboard
pm2-web-dashboard start
```

---

*HeadlessX v1.1.0 - Deploy once, scale everywhere.* 🚀