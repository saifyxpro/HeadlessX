# HeadlessX v1.3.0 - Enhanced Anti-Detection Modular Architecture Guide

<!-- Updated with v1.3.0 architecture, replacing v1.2.0 -->

## 🏗️ Enhanced Project Structure

HeadlessX v1.3.0 builds upon the modular architecture from v1.2.0 with comprehensive anti-detection capabilities, advanced fingerprinting control, and behavioral simulation while maintaining production-ready standards.

### 📁 Enhanced Directory Structure v1.3.0

```
src/
├── config/                           # Enhanced configuration management
│   ├── index.js                     # Main config with anti-detection settings
│   ├── browser.js                   # Browser configs + fingerprint profiles
│   ├── fingerprints.js              # Hardware fingerprint database
│   └── profiles/                    # Device profile configurations
│       ├── chrome-profiles.json     # Chrome device profiles
│       ├── firefox-profiles.json    # Firefox device profiles
│       └── mobile-profiles.json     # Mobile device profiles
├── utils/                           # Enhanced utilities
│   ├── errors.js                    # Error handling (existing)
│   ├── logger.js                    # Structured logging (existing)
│   ├── helpers.js                   # Common utilities (existing)
│   ├── random-generators.js         # Advanced randomization utilities
│   ├── profile-validator.js         # Profile consistency validation
│   └── detection-analyzer.js        # Bot detection analysis tools
├── services/                        # Enhanced business logic
│   ├── browser.js                   # Enhanced browser management
│   ├── stealth.js                   # MASSIVELY ENHANCED stealth engine
│   ├── interaction.js               # Enhanced human behavior simulation
│   ├── rendering.js                 # Enhanced rendering with anti-detection
│   ├── antibot.js                   # Bot detection analysis service
│   ├── fingerprinting/              # NEW: Advanced fingerprinting control
│   │   ├── canvas-spoofing.js       # Canvas fingerprint manipulation
│   │   ├── webgl-spoofing.js        # WebGL fingerprint control
│   │   ├── audio-context.js         # Audio fingerprint spoofing
│   │   ├── webrtc-controller.js     # WebRTC leak prevention
│   │   ├── hardware-noise.js        # Hardware fingerprint noise
│   │   ├── timezone-manager.js      # Timezone/IP consistency
│   │   ├── font-spoofing.js         # Font fingerprint control
│   │   ├── media-devices.js         # Media device enumeration spoofing
│   │   ├── client-rects.js          # ClientRect fingerprint control
│   │   ├── speech-synthesis.js      # Speech voices fingerprint
│   │   └── navigator-props.js       # Navigator properties spoofing
│   ├── behavioral/                  # NEW: Advanced behavioral simulation
│   │   ├── mouse-movement.js        # Bezier curve mouse simulation
│   │   ├── keyboard-dynamics.js     # Keystroke timing patterns
│   │   ├── scroll-patterns.js       # Natural scroll behavior
│   │   ├── click-simulation.js      # Human-like clicking
│   │   └── attention-model.js       # User attention simulation
│   ├── evasion/                     # NEW: Advanced evasion techniques
│   │   ├── cloudflare-bypass.js     # Cloudflare challenge solver
│   │   ├── datadome-bypass.js       # DataDome detection bypass
│   │   ├── tls-fingerprint.js       # TLS fingerprint masking
│   │   └── waf-bypass.js            # Generic WAF bypass techniques
│   ├── profiles/                    # NEW: Device profile management
│   │   ├── chrome-profiles.json     # Chrome device profiles
│   │   ├── mobile-profiles.js       # Mobile device profiles manager
│   │   └── profile-manager.js       # Profile lifecycle management
│   ├── utils/                       # NEW: Service utilities
│   │   ├── profile-validator.js     # Profile validation utility
│   │   ├── detection-analyzer.js    # Detection analysis utility
│   │   └── random-generators.js     # Advanced random data generators
│   ├── testing/                     # NEW: Comprehensive testing framework
│   │   └── test-framework.js        # Anti-detection testing suite
│   └── development/                 # NEW: Development tools
│       └── dev-tools.js             # Interactive testing and debugging
├── middleware/                      # Enhanced middleware
│   ├── auth.js                      # Authentication (existing)
│   ├── error.js                     # Error handling (existing)
│   ├── rate-limiter.js              # Enhanced rate limiting
│   └── request-analyzer.js          # NEW: Request pattern analysis
├── controllers/                     # Enhanced controllers
│   ├── system.js                    # Enhanced system monitoring
│   ├── rendering.js                 # Enhanced rendering with profiles
│   ├── batch.js                     # Enhanced batch processing
│   ├── get.js                       # GET endpoints (existing)
│   ├── profiles.js                  # NEW: Profile management API
│   └── detection-test.js            # NEW: Detection testing endpoints
├── routes/                          # Enhanced routing
│   ├── api.js                       # Enhanced API routes with v1.3.0 endpoints
│   ├── static.js                    # Static files (existing)
│   └── admin.js                     # NEW: Admin panel routes
├── tests/                           # NEW: Comprehensive testing
│   ├── unit/                        # Unit tests for each module
│   ├── integration/                 # Integration tests
│   ├── detection/                   # Bot detection tests
│   └── performance/                 # Performance benchmarks
├── tools/                           # NEW: Development tools
│   ├── fingerprint-tester.js        # Test fingerprint consistency
│   ├── profile-generator.js         # Generate device profiles
│   └── detection-checker.js         # Check against bot detection services
├── app.js                           # Enhanced application setup
├── server.js                        # Entry point (existing)
└── verify-architecture.js          # NEW: Architecture verification script
```

## 🚀 Quick Start v1.3.0

### Development Mode with Anti-Detection
```bash
# Start in development mode with v1.3.0 features
npm run dev

# Or directly with Node.js
npm start

# Run architecture verification
node verify-architecture.js

# Test anti-detection capabilities
curl -X POST "http://localhost:3000/api/test-fingerprint" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{"profile": "desktop-chrome", "testAll": true}'
```

### Production with PM2 and Enhanced Monitoring
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

## 📊 Enhanced API Endpoints v1.3.0

### System Endpoints
- `GET /api/health` - Health check with anti-detection status
- `GET /api/status` - Detailed system status with fingerprint info
- `GET /api/docs` - Enhanced API documentation with v1.3.0 features

### 🛡️ NEW: Anti-Detection Endpoints
- `POST /api/render/stealth` - Maximum stealth rendering with advanced anti-detection
- `POST /api/test-fingerprint` - Test fingerprint consistency and detection bypass
- `GET /api/profiles` - List available device profiles (desktop/mobile)
- `POST /api/profiles/validate` - Validate device profile consistency
- `POST /api/profiles/generate-fingerprint` - Generate new fingerprint profile
- `GET /api/stealth/status` - Current stealth configuration and capabilities

### Enhanced Rendering Endpoints
- `POST /api/render` - Enhanced rendering with device profiles and behavioral simulation
- `POST /api/html` - HTML extraction with anti-detection capabilities
- `POST /api/content` - Clean text content with stealth mode
- `POST /api/screenshot` - Screenshots with fingerprint masking
- `POST /api/pdf` - PDF generation with device profile simulation
- `POST /api/batch` - Batch processing with profile rotation

### GET Endpoints (Enhanced)
- `GET /api/html?url=...&profile=...` - HTML extraction with device profile
- `GET /api/content?url=...&stealth=true` - Content extraction with stealth mode
- `GET /api/screenshot?url=...&profile=mobile-ios` - Mobile device screenshot

### 🧪 NEW: Testing & Development Endpoints
- `GET /api/detection/test` - Test against popular bot detection services
- `POST /api/fingerprint/analyze` - Analyze fingerprint for detection patterns
- `GET /api/profiles/mobile` - List mobile device profiles
- `GET /api/profiles/desktop` - List desktop device profiles

## 🛡️ Enhanced Security Features v1.3.0

### Authentication & Authorization
- Token-based authentication for all API endpoints
- Multi-level access control for profile management
- Secure profile storage with encryption
- Admin panel access control for advanced features

### Anti-Detection Security
- Fingerprint consistency validation across sessions
- Secure random number generation for behavioral patterns
- Memory cleanup of sensitive fingerprint data
- Audit trail for all profile modifications

### Rate Limiting & Monitoring
- Enhanced rate limiting with profile-based quotas
- Request pattern analysis for anomaly detection
- Real-time monitoring of detection attempts
- Automatic IP reputation scoring

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

## 🔧 v1.3.0 Enhanced Modules

### 🛡️ Fingerprinting Services
- **Canvas Spoofing**: Dynamic noise injection with consistent seeds for canvas fingerprint control
- **WebGL Spoofing**: GPU vendor/renderer spoofing with hardware-specific profiles
- **Audio Context**: Hardware audio fingerprint database with realistic device simulation
- **WebRTC Controller**: ICE candidate filtering and media device enumeration control
- **Hardware Noise**: CPU timing, memory allocation, and performance API manipulation
- **Timezone Manager**: Automatic timezone alignment with IP geolocation intelligence

### 🎭 Behavioral Simulation Services  
- **Mouse Movement**: Bezier curve path generation with acceleration modeling and micro-movements
- **Keyboard Dynamics**: Dwell time randomization, flight time patterns, and typing rhythm simulation
- **Scroll Patterns**: Natural scroll behavior with reader/scanner/browser behavioral profiles
- **Attention Model**: User attention simulation with realistic interaction patterns

### 🌐 Evasion & Bypass Services
- **Cloudflare Bypass**: Challenge solver with TLS fingerprint masking and HTTP/2 optimization
- **DataDome Evasion**: Resource blocking, detection overrides, and behavioral pattern bypasses
- **WAF Bypass**: Generic WAF bypass techniques with signature detection and response analysis

### 📱 Profile Management System
- **Device Profiles**: Comprehensive desktop and mobile profiles with hardware specifications
- **Profile Validator**: Consistency checking, scoring system, and cross-validation
- **Profile Generator**: Dynamic profile creation with realistic hardware combinations
- **Mobile Manager**: iOS/Android device simulation with sensor data and network characteristics

### 🧪 Testing & Development Framework
- **Test Framework**: Comprehensive anti-detection testing against major bot detection services
- **Dev Tools**: Interactive fingerprint testing, profile benchmarking, and network analysis
- **Detection Analyzer**: Bot detection signature analysis and evasion strategy recommendations
- **Performance Monitor**: Real-time success rate analytics and resource usage optimization

### 📊 Enhanced Monitoring & Analytics
- **Request Analyzer**: Pattern analysis for anomaly detection and request fingerprinting  
- **Detection Monitor**: Real-time tracking of bot detection encounters and bypass success rates
- **Profile Analytics**: Usage statistics, effectiveness scoring, and optimization recommendations
- **Performance Metrics**: Response time analysis, resource utilization, and scalability monitoring

## 🆘 Enhanced Troubleshooting v1.3.0

### Common Issues
1. **Port Already in Use**: Change `PORT` environment variable
2. **Browser Launch Failures**: Ensure Playwright browsers are installed
3. **Memory Issues**: Adjust `max_memory_restart` in PM2 config
4. **Authentication Errors**: Verify `AUTH_TOKEN` configuration

### v1.3.0 Specific Issues
1. **Fingerprint Spoofing Failures**: Check canvas noise injection configuration
2. **Profile Validation Errors**: Ensure device profile consistency
3. **WebGL Context Issues**: Verify GPU spoofing capabilities
4. **Cloudflare Bypass Failures**: Update TLS fingerprint database
5. **Detection Algorithm Changes**: Monitor detection rate and adjust profiles
6. **Behavioral Simulation Issues**: Calibrate mouse movement and timing patterns

### Advanced Debugging
```bash
# Enable fingerprint debugging
FINGERPRINT_DEBUG=true npm start

# Enable behavioral simulation debugging
BEHAVIOR_DEBUG=true npm start

# Enable anti-detection full debug
ANTI_DETECTION_DEBUG=true npm start

# Profile validation mode
PROFILE_VALIDATION=true npm start
```

### Anti-Detection Monitoring
```bash
# Check fingerprint consistency
curl -X POST http://localhost:3000/api/test-fingerprint \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"profile": "desktop_chrome"}'

# Monitor detection rates
curl -X GET http://localhost:3000/api/analytics/detection-rate \
  -H "Authorization: Bearer YOUR_TOKEN"

# Profile performance analysis
curl -X GET http://localhost:3000/api/analytics/profile-performance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

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