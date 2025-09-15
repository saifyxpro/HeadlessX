# HeadlessX v1.2.0 - Modular Architecture Guide

## 🏗️ Project Structure

HeadlessX has been completely refactored into a modular, production-ready Node.js application with proper separation of concerns.

### 📁 Directory Structure

```
src/
├── config/                    # Configuration management
│   ├── index.js              # Main configuration with environment loading
│   └── browser.js            # Browser-specific configuration
├── utils/                     # Utility functions
│   ├── errors.js             # Error handling and categorization
│   ├── logger.js             # Structured logging with request correlation
│   └── helpers.js            # Common utility functions
├── services/                  # Business logic services
│   ├── browser.js            # Browser lifecycle management
│   ├── stealth.js            # Anti-detection and stealth techniques
│   ├── interaction.js        # Human-like behavior simulation
│   └── rendering.js          # Core page rendering logic
├── middleware/                # Express middleware
│   ├── auth.js               # Authentication middleware
│   └── error.js              # Global error handling
├── controllers/               # Request handlers
│   ├── system.js             # Health checks and system info
│   ├── rendering.js          # Main rendering endpoints
│   ├── batch.js              # Batch processing
│   └── get.js                # GET endpoints and documentation
├── routes/                    # Route definitions
│   ├── api.js                # API route mappings
│   └── static.js             # Static file serving
├── app.js                     # Main application setup
└── server.js                 # Simple entry point for PM2
```

## 🚀 Quick Start

### Development Mode
```bash
# Start in development mode
npm run dev

# Or directly with Node.js
npm start
```

### Production with PM2
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2 (production)
npm run pm2:start:prod

# Start with PM2 (development)
npm run pm2:start:dev

# Monitor processes
npm run pm2:monit

# View logs
npm run pm2:logs

# Stop service
npm run pm2:stop

# Restart service
npm run pm2:restart
```

## 📦 Core Modules

### Configuration (`src/config/`)
- **`index.js`**: Central configuration management with environment variable loading and validation
- **`browser.js`**: Browser-specific settings, user agents, and launch arguments

### Services (`src/services/`)
- **`browser.js`**: Manages browser instances, contexts, and cleanup
- **`stealth.js`**: Advanced anti-detection techniques and bot avoidance
- **`interaction.js`**: Human-like scrolling, clicking, and behavior simulation
- **`rendering.js`**: Core rendering logic with timeout handling and fallbacks

### Controllers (`src/controllers/`)
- **`system.js`**: `/api/health`, `/api/status` - System monitoring endpoints
- **`rendering.js`**: `/api/render`, `/api/html`, `/api/content` - Main rendering
- **`batch.js`**: `/api/batch` - Batch URL processing with concurrency control
- **`get.js`**: GET endpoints and API documentation

### Middleware (`src/middleware/`)
- **`auth.js`**: Token-based authentication for protected endpoints
- **`error.js`**: Global error handling with proper HTTP status codes

## 🛠️ PM2 Configuration

The `ecosystem.config.js` file provides comprehensive PM2 configuration:

### Environment Variables
- **Production**: Optimized for production deployment
- **Development**: Debug mode enabled, lower timeouts
- **Staging**: Staging environment with debug capabilities

### Key Features
- Auto-restart on crashes
- Memory limit monitoring (2GB restart threshold)
- Graceful shutdown handling
- Log rotation and management
- Health check monitoring
- Deployment automation support

### PM2 Commands
```bash
# Start different environments
npm run pm2:start:prod     # Production mode
npm run pm2:start:dev      # Development mode
npm run pm2:start:staging  # Staging mode

# Process management
npm run pm2:restart        # Restart process
npm run pm2:reload         # Reload without downtime
npm run pm2:stop          # Stop process
npm run pm2:delete        # Delete process

# Monitoring
npm run pm2:status        # Process status
npm run pm2:logs          # View logs
npm run pm2:monit         # Real-time monitoring

# Scaling
npm run pm2:scale 4       # Scale to 4 instances
```

## 🔧 Configuration Options

### Environment Variables
```bash
# Server Configuration
PORT=3000
HOST=0.0.0.0
AUTH_TOKEN=your-secure-token

# Browser Settings
BROWSER_TIMEOUT=60000
EXTRA_WAIT_TIME=3000
MAX_CONCURRENCY=3

# API Settings
BODY_LIMIT=10mb
MAX_BATCH_URLS=10

# Website Integration
WEBSITE_ENABLED=true
WEBSITE_PATH=./website/out

# Logging
DEBUG=false
LOG_LEVEL=info
```

## 📊 API Endpoints

### System Endpoints
- `GET /api/health` - Health check
- `GET /api/status` - Detailed system status
- `GET /api/docs` - API documentation

### Rendering Endpoints
- `POST /api/render` - Full page rendering with options
- `POST /api/html` - HTML content extraction
- `POST /api/content` - Clean text content
- `POST /api/screenshot` - Page screenshots
- `POST /api/pdf` - PDF generation
- `POST /api/batch` - Batch URL processing

### GET Endpoints
- `GET /api/html?url=...` - Simple HTML extraction
- `GET /api/content?url=...` - Simple content extraction

## 🛡️ Security Features

### Authentication
- Token-based authentication for all API endpoints
- Configurable via `AUTH_TOKEN` environment variable
- Support for both JSON and text responses

### Rate Limiting
- Built-in rate limiting to prevent abuse
- Configurable limits per IP address
- Gradual backoff for repeated violations

### Anti-Detection
- Realistic Windows user agent rotation
- Browser-specific headers and properties
- Human-like mouse movements and scrolling
- Natural timing variations and pauses

## 🔍 Monitoring & Logging

### Structured Logging
- Request correlation IDs for tracing
- Structured JSON logging format
- Configurable log levels (debug, info, warn, error)
- Separate error and output log files

### Health Monitoring
- Real-time health checks
- System resource monitoring
- Browser instance tracking
- Performance metrics collection

## 🚀 Production Deployment

### Prerequisites
```bash
# Install dependencies
npm install

# Install PM2 globally
npm install -g pm2

# Install Playwright browsers
npx playwright install chromium
```

### Deployment Steps
1. **Configure Environment Variables** in `ecosystem.config.js`
2. **Build Website** (if enabled): `npm run build`
3. **Start with PM2**: `npm run pm2:start:prod`
4. **Save PM2 Configuration**: `npm run pm2:save`
5. **Setup Auto-startup**: `npm run pm2:startup`

### Health Checks
- **Health Endpoint**: `GET /api/health`
- **Status Endpoint**: `GET /api/status`
- **PM2 Monitoring**: `npm run pm2:monit`

## 🔧 Development

### Adding New Features
1. Create new service in `src/services/`
2. Add controller in `src/controllers/`
3. Update routes in `src/routes/api.js`
4. Add middleware if needed in `src/middleware/`

### Error Handling
- Use `HeadlessXError` class for consistent error categorization
- All errors are logged with correlation IDs
- Proper HTTP status codes returned
- Graceful fallbacks for recoverable errors

## 📈 Performance Optimization

### Browser Management
- Singleton browser instance with context isolation
- Automatic cleanup of stale contexts
- Resource monitoring and limits
- Graceful browser restart on errors

### Concurrency Control
- Configurable maximum concurrent operations
- Queue management for batch processing
- Memory usage monitoring
- Automatic scaling with PM2

### Caching
- Static file caching with proper headers
- Browser context reuse when possible
- Configuration caching for performance

## 🆘 Troubleshooting

### Common Issues
1. **Port Already in Use**: Change `PORT` environment variable
2. **Browser Launch Failures**: Ensure Playwright browsers are installed
3. **Memory Issues**: Adjust `max_memory_restart` in PM2 config
4. **Authentication Errors**: Verify `AUTH_TOKEN` configuration

### Debug Mode
```bash
# Enable debug logging
DEBUG=true npm start

# Or with PM2
npm run pm2:start:dev
```

### Log Analysis
```bash
# View all logs
npm run pm2:logs

# View only errors
npm run pm2:logs:error

# View output logs
npm run pm2:logs:out
```

## 📝 License

MIT License - See LICENSE file for details.

## 👨‍💻 Author

**SaifyXPRO** - Advanced web scraping and automation specialist