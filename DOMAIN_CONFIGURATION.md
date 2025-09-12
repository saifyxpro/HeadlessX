# 🌐 HeadlessX Domain Configuration Guide

Complete guide for configuring custom domains with HeadlessX v1.1.0's integrated architecture.

## 🏗️ Architecture Overview

HeadlessX v1.1.0 uses a **unified server architecture**:

```
your-subdomain.yourdomain.com
├── / (Website) ────────┐
└── /api/* (API) ───────┼─── Nginx ─── Node.js Server (Port 3000)
                        │
DNS A Record ───────────┘
```

**Key Benefits:**
- ✅ Single domain for website and API
- ✅ Simplified SSL certificate management
- ✅ Better SEO and user experience
- ✅ Easier monitoring and maintenance

---

## 🎯 Domain Requirements

### What You Need
- **Root Domain**: `yourdomain.com` (that you own)
- **Subdomain**: `headlessx` (or any name you prefer)
- **Full Domain**: `headlessx.yourdomain.com`
- **DNS Control**: Ability to create A records

### Recommended Setup
```
Domain Structure:
├── yourdomain.com (your main site)
├── www.yourdomain.com (optional redirect)
└── headlessx.yourdomain.com (HeadlessX)
```

---

## ⚙️ Environment Configuration

### 1. Configure .env File
```bash
# Copy template
cp .env.example .env

# Edit configuration
nano .env
```

### 2. Set Domain Variables
```env
# Domain Configuration
DOMAIN=yourdomain.com           # Your root domain (without subdomain)
SUBDOMAIN=headlessx             # Your chosen subdomain

# Security
TOKEN=your_secure_random_token  # Generate with: openssl rand -hex 32

# Server Settings
PORT=3000                       # Internal port (don't change)
NODE_ENV=production            # Production mode
```

### 3. Generate Secure Token
```bash
# Generate a secure token
openssl rand -hex 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🌐 DNS Configuration

### Step 1: Create A Record

In your domain provider's DNS settings:

```
Type: A
Name: headlessx (or your chosen subdomain)
Value: YOUR_SERVER_IP_ADDRESS
TTL: 300 (5 minutes)
```

**Example for different providers:**

#### Cloudflare
1. Log in to Cloudflare dashboard
2. Select your domain
3. Go to DNS tab
4. Click "Add record"
5. Type: A, Name: headlessx, IPv4: YOUR_SERVER_IP
6. Click Save

#### Namecheap
1. Go to Domain List → Manage
2. Advanced DNS tab
3. Add New Record
4. Type: A Record, Host: headlessx, Value: YOUR_SERVER_IP

#### GoDaddy
1. My Products → DNS
2. Add New Record
3. Type: A, Name: headlessx, Value: YOUR_SERVER_IP

### Step 2: Verify DNS Propagation

```bash
# Check DNS resolution
dig headlessx.yourdomain.com

# Alternative check
nslookup headlessx.yourdomain.com

# Online verification
# Visit: https://dnschecker.org
# Enter: headlessx.yourdomain.com
```

**Wait Time**: DNS propagation can take 5 minutes to 24 hours.

---

## 🔧 Server Configuration

### Automatic Configuration (Recommended)

The setup script automatically configures everything:

```bash
# Run setup with environment variables
./scripts/setup.sh

# The script will:
# 1. Read DOMAIN and SUBDOMAIN from .env
# 2. Configure nginx with your domain
# 3. Build website with domain information
# 4. Set up SSL certificate
```

### Manual Configuration

#### 1. Update Nginx Configuration
```bash
# Edit nginx config
sudo nano /etc/nginx/sites-available/headlessx

# Replace placeholder with your domain
sudo sed -i 's/SUBDOMAIN.DOMAIN.COM/headlessx.yourdomain.com/g' /etc/nginx/sites-available/headlessx

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

#### 2. Configure Website Build
```bash
# Set environment variables for website build
cd website

# Create .env.local for build-time configuration
cat > .env.local << EOF
NEXT_PUBLIC_DOMAIN=yourdomain.com
NEXT_PUBLIC_SUBDOMAIN=headlessx
NEXT_PUBLIC_API_URL=https://headlessx.yourdomain.com
EOF

# Rebuild website with domain configuration
npm run build
cd ..

# Restart server to serve updated website
pm2 restart headlessx
```

---

## 🔒 SSL Certificate Setup

### Automatic SSL (Recommended)
```bash
# Install certbot if not already installed
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d headlessx.yourdomain.com

# Verify certificate
sudo certbot certificates
```

### Manual SSL Verification
```bash
# Test SSL connection
openssl s_client -connect headlessx.yourdomain.com:443

# Check certificate details
curl -I https://headlessx.yourdomain.com/api/health

# Online SSL check
# Visit: https://www.ssllabs.com/ssltest/
# Enter: headlessx.yourdomain.com
```

---

## 🧪 Testing Your Domain Setup

### 1. Basic Connectivity
```bash
# Test HTTP (should redirect to HTTPS)
curl -I http://headlessx.yourdomain.com/

# Test HTTPS
curl -I https://headlessx.yourdomain.com/
```

### 2. Website Functionality
```bash
# Test homepage
curl https://headlessx.yourdomain.com/

# Test special routes
curl https://headlessx.yourdomain.com/robots.txt
curl https://headlessx.yourdomain.com/favicon.ico
```

### 3. API Endpoints
```bash
# Test health endpoint (no auth)
curl https://headlessx.yourdomain.com/api/health

# Test status endpoint (requires token)
curl "https://headlessx.yourdomain.com/api/status?token=YOUR_TOKEN"

# Test HTML extraction
curl -X POST "https://headlessx.yourdomain.com/api/html?token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### 4. Automated Testing
```bash
# Use the built-in verification script
bash scripts/verify-domain.sh

# Or run routing tests
bash scripts/test-routing.sh
```

---

## 🌍 Multiple Domain Setup

### Supporting Multiple Subdomains

If you want multiple HeadlessX instances:

```
api.yourdomain.com     → Production API
staging.yourdomain.com → Staging API
dev.yourdomain.com     → Development API
```

#### 1. Create Multiple Configs
```bash
# Copy base configuration
cp nginx/headlessx.conf nginx/headlessx-staging.conf

# Update domain in new config
sed -i 's/SUBDOMAIN.DOMAIN.COM/staging.yourdomain.com/g' nginx/headlessx-staging.conf

# Update port for different instance
sed -i 's/3000/3001/g' nginx/headlessx-staging.conf
```

#### 2. Run Multiple Instances
```bash
# Create staging environment
cp .env .env.staging
echo "PORT=3001" >> .env.staging
echo "SUBDOMAIN=staging" >> .env.staging

# Start staging instance
PORT=3001 pm2 start config/ecosystem.config.js --name headlessx-staging
```

---

## 🔧 Advanced Configuration

### Custom Subdomain Names

You can use any subdomain name:

```env
# Creative subdomain names
SUBDOMAIN=api          # api.yourdomain.com
SUBDOMAIN=scraper      # scraper.yourdomain.com
SUBDOMAIN=automation   # automation.yourdomain.com
SUBDOMAIN=browserless  # browserless.yourdomain.com
```

### Wildcard SSL (Optional)
```bash
# Get wildcard certificate for *.yourdomain.com
sudo certbot --nginx -d "*.yourdomain.com" -d yourdomain.com
```

### Custom Domain Without Subdomain
```env
# Use custom domain directly
DOMAIN=headlessx.com
SUBDOMAIN=www          # www.headlessx.com
# Or
SUBDOMAIN=             # headlessx.com (empty subdomain)
```

---

## 🚨 Troubleshooting

### DNS Issues

#### Problem: Domain not resolving
```bash
# Check if DNS is set correctly
dig headlessx.yourdomain.com

# Check from external DNS
dig @8.8.8.8 headlessx.yourdomain.com

# Check TTL and wait
dig headlessx.yourdomain.com | grep TTL
```

#### Solution: DNS Propagation
- Wait 24 hours for full propagation
- Use different DNS servers (8.8.8.8, 1.1.1.1)
- Clear local DNS cache: `sudo systemctl restart systemd-resolved`

### SSL Issues

#### Problem: Certificate not working
```bash
# Check certificate status
sudo certbot certificates

# Test SSL handshake
openssl s_client -connect headlessx.yourdomain.com:443
```

#### Solution: Renew Certificate
```bash
# Force certificate renewal
sudo certbot renew --force-renewal -d headlessx.yourdomain.com

# Restart nginx
sudo systemctl restart nginx
```

### Nginx Issues

#### Problem: 502 Bad Gateway
```bash
# Check if server is running
pm2 status

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test nginx configuration
sudo nginx -t
```

#### Solution: Fix Proxy Settings
```bash
# Ensure server is running on correct port
netstat -tlnp | grep 3000

# Restart services
pm2 restart headlessx
sudo systemctl restart nginx
```

---

## 📋 Domain Setup Checklist

### Pre-Setup
- [ ] Domain purchased and accessible
- [ ] DNS provider dashboard access
- [ ] Server with public IP running
- [ ] HeadlessX repository cloned

### DNS Configuration
- [ ] A record created (subdomain → server IP)
- [ ] DNS propagation verified (dig/nslookup)
- [ ] Domain resolves from multiple locations

### Environment Setup
- [ ] .env file configured with correct DOMAIN/SUBDOMAIN
- [ ] Secure TOKEN generated and set
- [ ] Environment variables loaded correctly

### Server Configuration
- [ ] Website built with domain configuration
- [ ] Nginx configured with correct domain
- [ ] PM2 process running
- [ ] Server accessible on port 3000 locally

### SSL Setup
- [ ] Certbot installed
- [ ] SSL certificate obtained and installed
- [ ] HTTPS working correctly
- [ ] HTTP redirects to HTTPS

### Testing
- [ ] Website loads at https://subdomain.domain.com
- [ ] API health check responds
- [ ] Authenticated API calls work
- [ ] All routing functioning correctly

### Production
- [ ] Monitoring setup (PM2, logs)
- [ ] Firewall configured
- [ ] Backups configured
- [ ] Documentation updated

---

## 🎯 Best Practices

### Security
- Use strong, unique tokens
- Keep SSL certificates updated
- Monitor access logs regularly
- Use rate limiting appropriately

### Performance
- Enable nginx gzip compression
- Use appropriate cache headers
- Monitor memory usage
- Optimize images and assets

### Maintenance
- Automate SSL renewal
- Set up log rotation
- Monitor disk space
- Keep dependencies updated

---

*Perfect domain configuration for HeadlessX v1.1.0* 🌐