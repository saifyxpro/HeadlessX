# 🚀 HeadlessX Quick Deployment Guide

## For Ubuntu VPS

### 1. One-Command Setup
```bash
# Download and run setup script
curl -fsSL https://raw.githubusercontent.com/SaifyXPRO/headlessx/main/setup.sh | bash
```

### 2. Manual Setup
```bash
# Clone repository
git clone https://github.com/SaifyXPRO/headlessx.git
cd headlessx

# Run setup script
chmod +x setup.sh
./setup.sh

# Update environment
nano .env  # Change TOKEN value

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3. Docker Deployment
```bash
# Clone and build
git clone https://github.com/SaifyXPRO/headlessx.git
cd headlessx

# Start with docker-compose
docker-compose up -d

# Check status
docker-compose logs -f
```

## Custom Domain Setup

### 1. Domain Prerequisites
Before setting up your custom domain, ensure you have:
- A registered domain name (e.g., `yourdomain.com`)
- Access to your domain's DNS management panel
- A VPS/server with a public IP address
- Root or sudo access to your server

### 2. DNS Configuration
Configure your domain's DNS records:

**For subdomain setup (recommended):**
```
Type: A Record
Name: headlessx (or api, scraper, etc.)
Value: YOUR_SERVER_IP_ADDRESS
TTL: 300 (5 minutes)
```

**For main domain setup:**
```
Type: A Record
Name: @ (or leave blank)
Value: YOUR_SERVER_IP_ADDRESS
TTL: 300 (5 minutes)
```

**Examples:**
- Subdomain: `your-subdomain.yourdomain.com` → Points to your server
- Main domain: `yourdomain.com` → Points to your server

### 3. Nginx Installation & Configuration
```bash
# Install Nginx
sudo apt update
sudo apt install nginx -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Create HeadlessX configuration
sudo nano /etc/nginx/sites-available/headlessx
```

**Nginx Configuration File:**
```nginx
server {
    listen 80;
    server_name your-subdomain.yourdomain.com;  # Replace with your domain
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
    location / {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings for large requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering off;
        proxy_buffer_size 128k;
        proxy_buffers 100 128k;
    }
    
    # Health check endpoint (no rate limit)
    location /health {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. Enable Site & Test Configuration
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/headlessx /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx

# Check Nginx status
sudo systemctl status nginx
```

### 5. SSL Certificate Installation
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-subdomain.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

### 6. Firewall Configuration
```bash
# Allow HTTP and HTTPS traffic
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw enable

# Check firewall status
sudo ufw status
```

### 7. Domain Verification
Test your domain setup:
```bash
# Test HTTP (should redirect to HTTPS after SSL)
curl -I http://your-subdomain.yourdomain.com/health

# Test HTTPS
curl -I https://your-subdomain.yourdomain.com/health

# Test API endpoint
curl -X POST "https://your-subdomain.yourdomain.com/html?token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

## Testing

```bash
# Health check
curl http://your-subdomain.yourdomain.com/health

# Test rendering
curl -X POST "http://headlessx.domain.com/render?token=SaifyXPRO@112255" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

## Make.com Integration

**URL**: `https://headlessx.domain.com/html?token=YOUR_TOKEN`
**Method**: POST
**Body**: `{"url": "{{dynamic_url}}"}`

Done! 🎉
