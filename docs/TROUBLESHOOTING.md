# 🔧 HeadlessX Troubleshooting Guide

**Version:** v1.3.0  
**Last Updated:** September 23, 2025  
**Applicable to:** All installation methods and environments

---

## 🚀 Quick Diagnostic Commands

Before diving into specific issues, run these commands to gather system information:

```bash
# Check HeadlessX status
pm2 status headlessx
curl -s http://localhost:3000/api/health | jq

# Check system resources  
free -h && df -h
docker stats --no-stream (if using Docker)

# Check logs
pm2 logs headlessx --lines 20
tail -f logs/error.log logs/output.log

# Verify installation
node --version && npm --version
npx playwright --version
```

---

## 🆘 Common Issues & Solutions

### 1. Installation & Setup Problems

#### Issue: `npm install` fails with permission errors
```
npm ERR! Error: EACCES: permission denied, mkdir '/usr/local/lib/node_modules'
```

**Solutions:**
```bash
# Solution A: Use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20 && nvm use 20

# Solution B: Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Solution C: Use npx instead
npx create-headlessx-app my-instance
```

#### Issue: Playwright browsers fail to install
```
Error: Failed to download Chromium
```

**Solutions:**
```bash
# Install system dependencies first
sudo apt update && sudo apt install -y \
    libatk1.0-0 libatk-bridge2.0-0 libcups2 \
    libatspi2.0-0 libxcomposite1 libxdamage1

# Force reinstall browsers
npx playwright install --force chromium
npx playwright install-deps chromium

# Check browser installation
npx playwright install --dry-run
```

#### Issue: `.env` file configuration errors
```
❌ SECURITY ERROR: AUTH_TOKEN environment variable is required!
```

**Solutions:**
```bash
# Generate secure token
openssl rand -hex 32

# Create .env from template
cp .env.example .env

# Edit configuration
nano .env
# Set AUTH_TOKEN=your_generated_token_here

# Validate configuration
npm run validate:config
```

### 2. Server Startup Issues

#### Issue: Port 3000 already in use
```
Error: listen EADDRINUSE :::3000
```

**Solutions:**
```bash
# Find process using port 3000
sudo lsof -i :3000
# or
sudo netstat -tlnp | grep :3000

# Kill the process
sudo kill -9 [PID]

# Or change port in .env
echo "PORT=3001" >> .env

# Restart HeadlessX
pm2 restart headlessx
```

#### Issue: Server starts but health check fails
```
curl: (7) Failed to connect to localhost:3000: Connection refused
```

**Diagnostic Steps:**
```bash
# Check if process is running
pm2 status headlessx

# Check logs for errors
pm2 logs headlessx --lines 50

# Check if port is listening
sudo netstat -tlnp | grep :3000

# Test direct Node.js startup
cd /path/to/headlessx
node src/app.js
```

**Common Fixes:**
```bash
# Fix 1: Restart PM2 ecosystem
pm2 delete headlessx
pm2 start src/server.js --name headlessx

# Fix 2: Clear PM2 cache
pm2 kill
pm2 resurrect

# Fix 3: Check firewall
sudo ufw status
sudo ufw allow 3000/tcp
```

#### Issue: Authentication failures
```
{"error":"Unauthorized: Invalid token","timestamp":"2025-09-23T..."}
```

**Solutions:**
```bash
# Verify token in .env
grep AUTH_TOKEN .env

# Test with correct token
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/health

# Check token in different formats
curl "http://localhost:3000/api/health?token=YOUR_TOKEN"
curl -H "X-Token: YOUR_TOKEN" \
     http://localhost:3000/api/health

# Regenerate token if needed
echo "AUTH_TOKEN=$(openssl rand -hex 32)" >> .env
pm2 restart headlessx
```

### 3. Browser & Rendering Issues

#### Issue: Browser launch failures
```
Error: Could not find browser executable at: /path/to/chrome
```

**Solutions:**
```bash
# Reinstall Playwright browsers
npm run setup-playwright
npx playwright install chromium --force

# Check browser installation path
npx playwright install chromium --dry-run

# For Docker installations
docker exec -it headlessx-container npx playwright install chromium

# Manual browser check
node -e "const { chromium } = require('playwright'); chromium.launch().then(b => b.close())"
```

#### Issue: Rendering timeouts
```
Error: Page timeout after 30000ms
```

**Solutions:**
```bash
# Increase timeout in .env
echo "BROWSER_TIMEOUT=60000" >> .env
echo "EXTRA_WAIT_TIME=5000" >> .env

# Check system resources
free -h
top -p $(pgrep -f "chrome")

# Reduce concurrent browsers
echo "MAX_CONCURRENCY=1" >> .env

# Test single render
curl -X POST http://localhost:3000/api/render \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "timeout": 10000}'
```

#### Issue: Anti-detection not working
```
Website still detecting automation/bot
```

**Diagnostic Steps:**
```bash
# Test fingerprinting effectiveness
curl -X POST http://localhost:3000/api/test-fingerprint \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"profile": "desktop-chrome"}'

# Check stealth configuration
grep -E "STEALTH_|FINGERPRINT_|BEHAVIORAL_" .env

# Test with maximum stealth
curl -X POST http://localhost:3000/api/render/stealth \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://bot-detection-test.com", "profile": "desktop-chrome"}'
```

**Configuration Fixes:**
```bash
# Enable all anti-detection features
cat >> .env << EOF
STEALTH_MODE=maximum
FINGERPRINT_PROFILE=desktop-chrome
BEHAVIORAL_SIMULATION=enabled
WEBRTC_LEAK_PROTECTION=enabled
CANVAS_NOISE_LEVEL=medium
WEBGL_SPOOFING=enabled
EOF

pm2 restart headlessx
```

### 4. Memory & Performance Issues

#### Issue: High memory usage
```
Process exceeded memory limit: 512MB
```

**Solutions:**
```bash
# Monitor memory usage
pm2 monit

# Increase memory limit
pm2 delete headlessx
pm2 start src/server.js --name headlessx --max-memory-restart 1G

# Enable memory optimization
echo "MEMORY_OPTIMIZATION=aggressive" >> .env

# Check for memory leaks
node --inspect src/app.js
# Then use Chrome DevTools to profile memory
```

#### Issue: Slow response times
```
API responses taking > 30 seconds
```

**Performance Tuning:**
```bash
# Enable browser pooling
echo "BROWSER_INSTANCE_POOLING=true" >> .env

# Increase browser pool size
echo "BROWSER_POOL_SIZE=10" >> .env

# Enable context reuse
echo "CONTEXT_REUSE=true" >> .env

# Optimize system settings
echo "UV_THREADPOOL_SIZE=128" >> .env
echo "NODE_OPTIONS=--max-old-space-size=4096" >> .env

# Monitor performance
curl -w "@curl-format.txt" -o /dev/null -s \
  "http://localhost:3000/api/health?token=YOUR_TOKEN"
```

Create `curl-format.txt`:
```
     time_namelookup:  %{time_namelookup}s\n
        time_connect:  %{time_connect}s\n
     time_appconnect:  %{time_appconnect}s\n
    time_pretransfer:  %{time_pretransfer}s\n
       time_redirect:  %{time_redirect}s\n
  time_starttransfer:  %{time_starttransfer}s\n
                     ----------\n
          time_total:  %{time_total}s\n
```

### 5. Network & Connectivity Issues

#### Issue: Docker networking problems
```
curl: (7) Failed to connect to localhost:3000
```

**Solutions:**
```bash
# Check Docker container status
docker ps -a
docker logs headlessx-container

# Verify port mapping
docker port headlessx-container

# Test internal connectivity
docker exec headlessx-container curl localhost:3000/api/health

# Fix networking
docker-compose down
docker-compose up -d

# Alternative: Use host networking
docker run --network host headlessx:latest
```

#### Issue: Nginx proxy errors
```
502 Bad Gateway
```

**Solutions:**
```bash
# Check nginx status
sudo systemctl status nginx
sudo nginx -t

# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Verify upstream is running
curl http://127.0.0.1:3000/api/health

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Check nginx config file
cat /etc/nginx/sites-available/headlessx
```

#### Issue: SSL/HTTPS problems
```
SSL_ERROR_BAD_CERT_DOMAIN
```

**Solutions:**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew --dry-run
sudo certbot renew

# Check certificate expiry
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/cert.pem -text -noout | grep "Not After"

# Force certificate renewal
sudo certbot --force-renewal -d yourdomain.com

# Test HTTPS
curl -I https://yourdomain.com/api/health
```

---

## 🔍 Advanced Debugging

### Enable Debug Mode
```bash
# Enable comprehensive debugging
echo "DEBUG=true" >> .env
echo "LOG_LEVEL=debug" >> .env
echo "FINGERPRINT_DEBUG=true" >> .env
echo "BEHAVIOR_DEBUG=true" >> .env

pm2 restart headlessx

# Watch debug logs
pm2 logs headlessx --lines 0
```

### Browser Debugging
```bash
# Launch browser with debugging
echo "BROWSER_DEBUG=true" >> .env

# Enable browser console logs
echo "BROWSER_CONSOLE_LOG=true" >> .env

# Capture browser screenshots on error
echo "CAPTURE_ON_ERROR=true" >> .env

# Enable browser network logs
echo "NETWORK_DEBUG=true" >> .env
```

### System Monitoring
```bash
# Install system monitoring tools
sudo apt install htop iotop nethogs

# Monitor in real-time
htop
iotop -o
nethogs eth0

# Check disk usage
du -sh logs/
df -h /var/log

# Monitor network connections
ss -tuln | grep :3000
netstat -an | grep :3000
```

---

## 🐛 Error Code Reference

### HTTP Error Codes
- **400 Bad Request:** Invalid parameters or missing required fields
- **401 Unauthorized:** Invalid or missing authentication token
- **403 Forbidden:** Valid token but insufficient permissions
- **429 Too Many Requests:** Rate limit exceeded
- **500 Internal Server Error:** Server-side error occurred
- **502 Bad Gateway:** Nginx proxy error (check upstream)
- **503 Service Unavailable:** Server overloaded or maintenance
- **504 Gateway Timeout:** Request timeout (increase timeout values)

### Application Error Codes
```javascript
// HeadlessX specific error codes
{
  "error": "BROWSER_LAUNCH_FAILED",
  "message": "Could not launch browser instance",
  "code": "HX_001",
  "timestamp": "2025-09-23T10:30:00.000Z",
  "requestId": "req_abc123"
}
```

Common Error Codes:
- **HX_001:** Browser launch failure
- **HX_002:** Page load timeout
- **HX_003:** Authentication failure
- **HX_004:** Rate limit exceeded
- **HX_005:** Invalid URL provided
- **HX_006:** Profile validation failed
- **HX_007:** Anti-detection bypass failed

---

## 📊 Performance Monitoring

### Key Metrics to Monitor
```bash
# Request rate
curl -s http://localhost:3000/api/analytics/request-rate | jq

# Success rate
curl -s http://localhost:3000/api/analytics/success-rate | jq

# Average response time
curl -s http://localhost:3000/api/analytics/response-time | jq

# Browser pool status
curl -s http://localhost:3000/api/analytics/browser-pool | jq

# Detection rate
curl -s http://localhost:3000/api/analytics/detection-rate | jq
```

### Setting Up Monitoring
```bash
# Install monitoring tools
npm install --save-dev clinic autocannon

# Profile performance
clinic doctor -- node src/app.js
clinic bubbleprof -- node src/app.js

# Load testing
autocannon -c 10 -d 30 http://localhost:3000/api/health

# Memory profiling
node --inspect src/app.js
# Open chrome://inspect in Chrome
```

---

## 🔄 Recovery Procedures

### Complete Reset
```bash
# Stop all services
pm2 delete all
sudo systemctl stop nginx

# Clear logs
rm -rf logs/*
pm2 flush

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Reinstall browsers
npx playwright install chromium --force

# Restart services
pm2 start src/server.js --name headlessx
sudo systemctl start nginx
```

### Database Reset (if applicable)
```bash
# Clear profile database
rm -rf data/profiles.db

# Reset configuration
cp .env.example .env
# Edit .env with your settings

# Regenerate authentication tokens
echo "AUTH_TOKEN=$(openssl rand -hex 32)" >> .env
```

### Docker Reset
```bash
# Complete Docker reset
docker-compose down -v
docker system prune -f
docker volume prune -f

# Rebuild images
docker-compose build --no-cache
docker-compose up -d
```

---

## 🆘 Getting Help

### Self-Service Resources
1. **Documentation:** Check `/docs/` directory for comprehensive guides
2. **FAQ:** Review frequently asked questions in README.md
3. **GitHub Issues:** Search existing issues for similar problems
4. **Community Forum:** Check discussions in GitHub repository

### Contacting Support
- **GitHub Issues:** https://github.com/saifyxpro/headlessx/issues
- **Security Issues:** security@headlessx.dev
- **General Support:** support@headlessx.dev

### When Reporting Issues
Include this information:
```
- HeadlessX version: v1.3.0
- Operating System: Ubuntu 22.04
- Node.js version: v20.5.0
- Installation method: npm/docker/manual
- Error message/logs: [paste relevant logs]
- Steps to reproduce: [detailed steps]
- Expected behavior: [what should happen]
- Actual behavior: [what actually happens]
```

---

**Need immediate help?** Check the [GitHub Issues](https://github.com/SaifyXPRO/HeadlessX/issues) for community support!

*This troubleshooting guide is continuously updated based on community feedback and common issues. Contributions and improvements are welcome!*