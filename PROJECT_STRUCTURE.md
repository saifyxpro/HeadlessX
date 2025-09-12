# 📁 HeadlessX v1.1.0 Project Structure

This document outlines the complete file structure of HeadlessX v1.1.0 with its integrated website and API architecture.

## 🏗️ Architecture Overview

HeadlessX v1.1.0 features a **unified architecture** where a single Node.js server handles both the website and API endpoints:

```
HeadlessX Server (Node.js)
├── Website Serving (/) ── Next.js Built Files
└── API Endpoints (/api/*) ── REST API
```

---

## 📂 Root Directory Structure

```
HeadlessX/
├── 📁 src/                     # Server source code
│   └── server.js               # Main unified server (website + API)
├── 📁 website/                 # Next.js website application
│   ├── 📁 app/                 # Next.js 13+ app directory
│   ├── 📁 components/          # React components
│   ├── 📁 out/                 # Built static files (generated)
│   ├── .env.example           # Website environment template
│   ├── next.config.js         # Next.js configuration
│   ├── package.json           # Website dependencies
│   └── tailwind.config.ts     # Tailwind CSS config
├── 📁 scripts/                 # Deployment and utility scripts
│   ├── setup.sh              # Automated installation script
│   ├── verify-domain.sh       # Domain verification utility
│   ├── test-routing.sh        # Routing test script
│   └── test-integration.sh    # Integration test script
├── 📁 nginx/                   # Web server configuration
│   └── headlessx.conf         # Nginx proxy configuration
├── 📁 docker/                  # Containerization files
│   ├── Dockerfile             # Container definition
│   └── docker-compose.yml     # Docker Compose setup
├── 📁 config/                  # Application configuration
│   └── ecosystem.config.js    # PM2 process manager config
├── 📁 docs/                    # API and setup documentation
│   ├── GET_ENDPOINTS.md       # GET API reference
│   ├── POST_ENDPOINTS.md      # POST API reference
│   ├── DOMAIN_SETUP.md        # Domain configuration guide
│   └── HUMAN_BEHAVIOR_UPDATE.md # Behavior simulation docs
├── 📁 logs/                    # Log files directory (created at runtime)
├── .env.example               # Environment configuration template
├── .gitignore                 # Git ignore rules
├── package.json               # Server dependencies and scripts
├── README.md                  # Main project documentation
├── DEPLOYMENT.md              # Deployment guide
├── DOMAIN_CONFIGURATION.md    # Domain setup guide
├── PROJECT_STRUCTURE.md       # This file
├── CONTRIBUTING.md            # Contribution guidelines
├── LICENSE                    # MIT license
└── CHANGELOG.md               # Version history
```

---

## 🖥️ Server Code (`src/`)

### `src/server.js`
**Main unified server handling both website and API**

**Key Features:**
- **Website Serving**: Serves Next.js built files from `website/out/`
- **API Endpoints**: All `/api/*` routes with authentication
- **Special Routes**: `/favicon.ico`, `/robots.txt`
- **Environment Integration**: Automatic `.env` file loading
- **Error Handling**: Comprehensive error responses
- **Security**: Token-based authentication

**Route Structure:**
```javascript
/ (GET)              → Website (index.html from Next.js build)
/favicon.ico (GET)   → Favicon (from website build or 204)
/robots.txt (GET)    → SEO robots file
/api/health (GET)    → Health check (no auth)
/api/status (GET)    → Server status (requires token)
/api/render (POST)   → Full page rendering
/api/html (GET/POST) → HTML extraction
/api/content (GET/POST) → Text extraction
/api/screenshot (GET) → Screenshot generation
/api/pdf (GET)       → PDF generation
/api/batch (POST)    → Batch processing
/* (GET)             → SPA routing (fallback to index.html)
```

---

## 🌐 Website Code (`website/`)

### Next.js Application Structure

```
website/
├── 📁 app/                     # Next.js 13+ App Router
│   ├── layout.tsx             # Root layout component
│   ├── page.tsx               # Homepage component
│   └── globals.css            # Global styles
├── 📁 components/              # Reusable React components
│   └── CodeBlock.tsx          # Syntax highlighted code blocks
├── 📁 out/                     # Built static files (auto-generated)
│   ├── index.html             # Homepage
│   ├── _next/                 # Next.js assets
│   └── favicon.ico            # Site favicon
├── .env.example               # Website environment template
├── .env.local                 # Local environment (auto-generated)
├── config.js                  # Environment configuration helper
├── next.config.js             # Next.js build configuration
├── next-env.d.ts              # TypeScript definitions
├── package.json               # Website dependencies
├── postcss.config.js          # PostCSS configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── README.md                  # Website documentation
```

### Website Environment Variables
```env
NEXT_PUBLIC_DOMAIN=yourdomain.com         # Build-time domain
NEXT_PUBLIC_SUBDOMAIN=headlessx           # Build-time subdomain
NEXT_PUBLIC_API_URL=https://...           # API base URL
NEXT_PUBLIC_SITE_URL=https://...          # Site URL
```

---

## 🔧 Scripts (`scripts/`)

### `setup.sh`
**Automated installation and configuration script**
- Installs system dependencies (Node.js, Nginx, PM2)
- Builds website with environment configuration
- Configures Nginx proxy to Node.js server
- Sets up PM2 process management
- Configures firewall and SSL

### `verify-domain.sh` 
**Domain verification and testing utility**
- Auto-loads environment variables from `.env`
- Tests DNS resolution and SSL certificates
- Validates website and API endpoints
- Checks server health and functionality

### `test-routing.sh`
**Routing verification script**
- Tests website routes (/, /favicon.ico, /robots.txt)
- Validates API endpoints (/api/health, /api/status)
- Checks nginx proxy configuration
- Supports both localhost and domain testing

### `test-integration.sh`
**Comprehensive integration testing**
- Tests unified server architecture
- Validates website + API integration
- Checks authentication and security
- Provides detailed status reporting

---

## 🌐 Nginx Configuration (`nginx/`)

### `headlessx.conf`
**Nginx reverse proxy configuration**

**Key Features:**
- **Single Location Block**: Proxies all requests to Node.js
- **Rate Limiting**: Different limits for website vs API
- **Security Headers**: XSS, CSRF, clickjacking protection
- **SSL Support**: Ready for Let's Encrypt certificates
- **Buffer Management**: Optimized for large API responses

**Configuration Pattern:**
```nginx
server {
    listen 80;
    server_name SUBDOMAIN.DOMAIN.COM;
    
    location / {
        # Rate limiting based on path
        # Proxy to Node.js server on port 3000
        proxy_pass http://127.0.0.1:3000;
        # ... proxy headers and settings
    }
}
```

---

## 🐳 Docker Configuration (`docker/`)

### `Dockerfile`
**Multi-stage container build**
- **Stage 1**: Website build environment
- **Stage 2**: Production runtime with Node.js server
- **Features**: Playwright browser installation, security optimizations

### `docker-compose.yml`
**Complete deployment stack**
- **HeadlessX Service**: Main application container
- **Volume Mounts**: Environment and logs
- **Network Configuration**: Internal container networking
- **Health Checks**: Automatic service monitoring

---

## ⚙️ Configuration (`config/`)

### `ecosystem.config.js`
**PM2 process manager configuration**

```javascript
module.exports = {
  apps: [{
    name: 'headlessx',
    script: './src/server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      TOKEN: process.env.TOKEN  // Required from environment
    },
    max_memory_restart: '1G',
    instances: 1,
    exec_mode: 'fork'
  }]
};
```

---

## 📖 Documentation (`docs/`)

### API Documentation
- **`GET_ENDPOINTS.md`**: Complete GET API reference
- **`POST_ENDPOINTS.md`**: Complete POST API reference  
- **`DOMAIN_SETUP.md`**: Domain configuration guide
- **`HUMAN_BEHAVIOR_UPDATE.md`**: Behavior simulation docs

### Setup Documentation
- **`README.md`**: Main project overview and quick start
- **`DEPLOYMENT.md`**: Detailed deployment guide
- **`DOMAIN_CONFIGURATION.md`**: Domain setup instructions
- **`PROJECT_STRUCTURE.md`**: This file

---

## 🔐 Environment Configuration

### Root `.env.example`
```env
# Domain Configuration
DOMAIN=yourdomain.com
SUBDOMAIN=headlessx

# Security
TOKEN=your_secure_random_token_here

# Server Configuration  
PORT=3000
NODE_ENV=production
```

### Website `.env.example`
```env
# Build-time domain configuration
NEXT_PUBLIC_DOMAIN=yourdomain.com
NEXT_PUBLIC_SUBDOMAIN=headlessx
NEXT_PUBLIC_API_URL=https://headlessx.yourdomain.com
```

---

## 🚀 Development Workflow

### 1. Setup Development Environment
```bash
# Clone and configure
git clone https://github.com/SaifyXPRO/HeadlessX.git
cd HeadlessX
cp .env.example .env

# Install dependencies
npm install
cd website && npm install && cd ..
```

### 2. Build Website
```bash
# Build with environment configuration
npm run build

# Or build manually
cd website
npm run build
cd ..
```

### 3. Start Development Server
```bash
# Start unified server
npm run start
# or
node src/server.js

# Access at http://localhost:3000
```

### 4. Test Integration
```bash
# Run integration tests
npm test

# Test specific components
npm run test:domain
npm run test:routing
```

---

## 📦 Production Deployment

### 1. Automated Deployment
```bash
# One-command deployment
npm run deploy
```

### 2. Manual Deployment
```bash
# Build everything
npm run build:full

# Setup infrastructure
npm run setup

# Start with PM2
pm2 start config/ecosystem.config.js
```

### 3. Docker Deployment
```bash
# Deploy with Docker
docker-compose up -d
```

---

## 🧪 Testing Structure

### Available Tests
- **Integration Test**: `npm test` → `scripts/test-integration.sh`
- **Domain Verification**: `npm run test:domain` → `scripts/verify-domain.sh`  
- **Routing Test**: `npm run test:routing` → `scripts/test-routing.sh`

### Test Coverage
- ✅ Server availability and health
- ✅ Website loading and content
- ✅ API endpoint functionality  
- ✅ Authentication and security
- ✅ Special routes (favicon, robots)
- ✅ Integration between website and API

---

## 🔄 File Flow

### Request Flow
```
1. User → Domain (headlessx.yourdomain.com)
2. DNS → Server IP
3. Nginx (Port 80/443) → Node.js (Port 3000)
4. Node.js Router:
   - /api/* → API Handler
   - /* → Static File or SPA Route
```

### Build Flow
```
1. Environment configured (.env)
2. Website built (npm run build)
   - Reads environment variables
   - Generates static files in website/out/
3. Server started (node src/server.js)
   - Serves website from website/out/
   - Handles API requests
4. Nginx proxies all requests to Node.js
```

---

## 🎯 Key Benefits of This Structure

### 🌐 **Unified Architecture**
- Single server handles everything
- Simplified deployment and maintenance
- Better performance and caching

### 🔧 **Environment Driven**
- Complete `.env` file support
- Build-time and runtime configuration
- Easy multi-environment deployment

### 📱 **Modern Stack**
- Next.js 13+ with App Router
- React 18+ with modern features
- Tailwind CSS for styling
- TypeScript support

### 🚀 **Production Ready**
- PM2 process management
- Nginx reverse proxy
- Docker containerization
- SSL/TLS support
- Comprehensive monitoring

### 🧪 **Developer Friendly**
- Comprehensive testing scripts
- Clear documentation structure
- Automated setup and deployment
- Consistent coding patterns

---

*HeadlessX v1.1.0 - Perfect structure for a unified web scraping solution* 🏗️