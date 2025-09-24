# POST Endpoints Documentation - v1.3.0 Enhanced Anti-Detection

This document provides detailed information about all POST endpoints available in HeadlessX v1.3.0 with advanced anti-detection features.

## 🚀 New in v1.3.0: Advanced Anti-Detection Examples

### Enhanced Google Scraping (Anti-Bot Evasion)
```bash
curl -X POST http://localhost:3000/api/render \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "url": "https://google.com",
    "timeout": 120000,
    "returnPartialOnTimeout": true,
    "deviceProfile": "high-end-desktop",
    "geoProfile": "us-east", 
    "behaviorProfile": "natural",
    "humanDelays": true,
    "simulateScrolling": true,
    "simulateMouseMovement": true,
    "enableAdvancedStealth": true,
    "enableCanvasSpoofing": true,
    "enableWebGLSpoofing": true,
    "enableWebRTCBlocking": true,
    "randomizeTimings": true
  }'
```

### Maximum Stealth Configuration
```json
{
  "url": "https://protected-site.com",
  "timeout": 90000,
  "deviceProfile": "business-laptop",
  "geoProfile": "us-central",
  "behaviorProfile": "cautious",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "enableAdvancedStealth": true,
  "enableCanvasSpoofing": true,
  "enableWebGLSpoofing": true,
  "enableAudioSpoofing": true,
  "enableWebRTCBlocking": true,
  "simulateMouseMovement": true,
  "simulateScrolling": true,
  "simulateTyping": false,
  "humanDelays": true,
  "randomizeTimings": true,
  "returnPartialOnTimeout": true,
  "headers": {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "max-age=0",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1"
  }
}
```

### High-Performance Gaming Profile
```json
{
  "url": "https://target-site.com",
  "deviceProfile": "gaming-laptop",
  "geoProfile": "us-west",
  "behaviorProfile": "confident",
  "viewport": { "width": 1920, "height": 1080 },
  "timeout": 75000,
  "enableAdvancedStealth": true,
  "simulateMouseMovement": true,
  "humanDelays": true,
  "scrollToBottom": true,
  "waitForSelectors": [".content", "#main"],
  "removeElements": [".ads", ".popup"]
}
```

### E-commerce Site Scraping
```json
{
  "url": "https://ecommerce-site.com/products",
  "deviceProfile": "mid-range-desktop", 
  "geoProfile": "us-east",
  "behaviorProfile": "natural",
  "timeout": 60000,
  "enableAdvancedStealth": true,
  "enableCanvasSpoofing": true,
  "simulateScrolling": true,
  "humanDelays": true,
  "cookies": [
    {
      "name": "currency",
      "value": "USD",
      "domain": ".ecommerce-site.com"
    },
    {
      "name": "location",
      "value": "US",
      "domain": ".ecommerce-site.com"
    }
  ],
  "headers": {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9"
  }
}
```

## 🌍 Available Device Profiles (v1.3.0)

- **`high-end-desktop`**: 1920x1080, 8 cores, 16GB RAM, NVIDIA RTX, confident behavior
- **`mid-range-desktop`**: 1920x1080, 4 cores, 8GB RAM, Intel UHD, natural behavior  
- **`business-laptop`**: 1366x768, 4 cores, 8GB RAM, Intel HD, cautious behavior
- **`gaming-laptop`**: 1920x1080, 6 cores, 16GB RAM, NVIDIA GTX, confident behavior

## 🌍 Available Geolocation Profiles (v1.3.0)

- **`us-east`**: New York (EST timezone)
- **`us-west`**: Los Angeles (PST timezone)
- **`us-central`**: Chicago (CST timezone)
- **`uk`**: London (GMT timezone)
- **`germany`**: Berlin (CET timezone)
- **`france`**: Paris (CET timezone)
- **`canada`**: Montreal (EST timezone)
- **`australia`**: Sydney (AEDT timezone)

## 🎭 Behavioral Profiles (v1.3.0)

- **`confident`**: Fast mouse movements, quick scrolling, fast typing
- **`natural`**: Moderate speeds, realistic patterns, balanced timing
- **`cautious`**: Slower movements, careful scrolling, deliberate actions

## Authentication

All API endpoints require authentication via one of these methods:
- Query parameter: `?token=YOUR_SECURE_AUTH_TOKEN`
- Header: `X-Token: YOUR_SECURE_AUTH_TOKEN`
- Header: `Authorization: Bearer YOUR_SECURE_AUTH_TOKEN`

> **Note**: Environment variable changed from `TOKEN` to `AUTH_TOKEN` in v1.2.0

## Modular Architecture Benefits

HeadlessX v1.2.0 features a completely refactored modular architecture:
- **Enhanced Performance**: Optimized browser management and resource usage
- **Better Error Handling**: Structured error responses with correlation IDs
- **Improved Logging**: Request tracing and structured logging
- **Rate Limiting**: Built-in protection against abuse

## Core POST Endpoints

### 1. Full Page Rendering (JSON Response)
```http
POST /api/render?token=YOUR_TOKEN
Content-Type: application/json
```

**Description:** Advanced page rendering with comprehensive options and JSON response

**Request Body:**
```json
{
  "url": "https://example.com",
  "waitUntil": "networkidle",
  "timeout": 60000,
  "extraWaitTime": 10000,
  "userAgent": "custom-user-agent",
  "cookies": [
    {
      "name": "session",
      "value": "abc123",
      "domain": ".example.com"
    }
  ],
  "headers": {
    "X-Custom-Header": "value"
  },
  "viewport": {
    "width": 1920,
    "height": 1080
  },
  "scrollToBottom": true,
  "waitForSelectors": [".content", ".main"],
  "clickSelectors": [".load-more", ".accept-cookies"],
  "removeElements": [".ads", ".popup"],
  "customScript": "document.querySelector('.button').click();",
  "waitForNetworkIdle": true,
  "captureConsole": true,
  "returnPartialOnTimeout": true,
  "fullPage": false,
  "screenshotPath": null,
  "screenshotFormat": "png",
  "pdfPath": null,
  "pdfFormat": "A4"
}
```

**Required Fields:**
- `url`: Target URL to render

**Optional Fields:**
- `waitUntil`: Wait condition ('load', 'domcontentloaded', 'networkidle', 'networkidle0') - default: 'networkidle'
- `timeout`: Main timeout in milliseconds - default: 60000
- `extraWaitTime`: Additional wait time for dynamic content - default: 10000
- `userAgent`: Custom user agent (uses realistic rotation if not provided)
- `cookies`: Array of cookie objects to set
- `headers`: Custom HTTP headers object
- `viewport`: Browser viewport dimensions
- `scrollToBottom`: Scroll to trigger lazy loading - default: true
- `waitForSelectors`: Array of CSS selectors to wait for
- `clickSelectors`: Array of CSS selectors to click
- `removeElements`: Array of CSS selectors to remove
- `customScript`: JavaScript code to execute on the page
- `waitForNetworkIdle`: Wait for network requests to finish - default: true
- `captureConsole`: Capture console logs - default: false
- `returnPartialOnTimeout`: Return partial content on timeout - default: true
- `fullPage`: Take full page screenshot if screenshotPath provided
- `screenshotPath`: Path to save screenshot (server-side)
- `screenshotFormat`: Screenshot format ('png'/'jpeg')
- `pdfPath`: Path to save PDF (server-side)
- `pdfFormat`: PDF paper format

**🆕 v1.3.0 Enhanced Anti-Detection Parameters:**
- `deviceProfile`: Device fingerprint profile ('high-end-desktop', 'mid-range-desktop', 'business-laptop', 'gaming-laptop') - default: 'mid-range-desktop'
- `geoProfile`: Geolocation profile ('us-east', 'us-west', 'us-central', 'uk', 'germany', 'france', 'canada', 'australia') - default: 'us-east'
- `behaviorProfile`: Behavioral simulation profile ('confident', 'natural', 'cautious') - default: 'natural'
- `enableCanvasSpoofing`: Enable canvas fingerprint spoofing - default: true
- `enableWebGLSpoofing`: Enable WebGL fingerprint spoofing - default: true
- `enableAudioSpoofing`: Enable audio context spoofing - default: true
- `enableWebRTCBlocking`: Block WebRTC to prevent IP leaks - default: true
- `enableAdvancedStealth`: Enable comprehensive stealth mode - default: true
- `simulateMouseMovement`: Simulate natural mouse movement - default: true
- `simulateScrolling`: Simulate human-like scrolling patterns - default: true
- `simulateTyping`: Simulate typing with natural delays - default: false
- `humanDelays`: Add random human-like delays - default: true
- `randomizeTimings`: Randomize interaction timings - default: true

**Response:**
```json
{
  "html": "<html>...</html>",
  "title": "Page Title",
  "url": "https://final-url.com",
  "originalUrl": "https://example.com",
  "consoleLogs": [
    {
      "type": "log",
      "text": "Console message",
      "location": {
        "url": "https://example.com",
        "lineNumber": 123
      }
    }
  ],
  "timestamp": "2025-09-12T12:00:00.000Z",
  "wasTimeout": false,
  "contentLength": 45678,
  "screenshotBuffer": null,
  "pdfBuffer": null,
  "isEmergencyContent": false
}
```

**Example:**
```bash
curl -X POST "https://your-subdomain.yourdomain.com/api/render?token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "timeout": 30000,
    "scrollToBottom": true,
    "captureConsole": true,
    "waitForSelectors": [".content"],
    "removeElements": [".ads"]
  }'
```

### 2. Raw HTML Extraction (POST)
```http
POST /api/html?token=YOUR_TOKEN
Content-Type: application/json
```

**Description:** Extract raw HTML with all rendering options, returns HTML directly

**Request Body:** Same as `/api/render` endpoint

**Response Headers:**
- `Content-Type`: text/html; charset=utf-8
- `X-Rendered-URL`: Final URL after redirects
- `X-Page-Title`: Page title
- `X-Timestamp`: Rendering timestamp
- `X-Was-Timeout`: Whether timeout occurred
- `X-Content-Length`: Content length
- `X-Is-Emergency`: Whether emergency extraction was used

**Response:** Raw HTML content

**Example:**
```bash
curl -X POST "https://your-subdomain.yourdomain.com/api/html?token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "timeout": 30000,
    "waitForSelectors": [".main-content"]
  }'
```

### 3. Clean Text Extraction (POST)
```http
POST /api/content?token=YOUR_TOKEN
Content-Type: application/json
```

**Description:** Extract clean, readable text content with all rendering options

**Request Body:** Same as `/api/render` endpoint

**Response Headers:**
- `Content-Type`: text/plain; charset=utf-8
- `X-Rendered-URL`: Final URL after redirects
- `X-Page-Title`: Page title
- `X-Content-Length`: Text content length
- `X-Timestamp`: Rendering timestamp
- `X-Was-Timeout`: Whether timeout occurred
- `X-Is-Emergency`: Whether emergency extraction was used

**Response:** Clean text content with intelligent formatting

**Example:**
```bash
curl -X POST "https://your-subdomain.yourdomain.com/api/content?token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "removeElements": [".sidebar", ".nav", ".ads"]
  }'
```

### 4. Batch Processing
```http
POST /api/batch?token=YOUR_TOKEN
Content-Type: application/json
```

**Description:** Process multiple URLs with controlled concurrency

**Request Body:**
```json
{
  "urls": [
    "https://example1.com",
    "https://example2.com",
    "https://example3.com"
  ],
  "concurrency": 3,
  "timeout": 60000,
  "waitUntil": "networkidle",
  "scrollToBottom": true,
  "extraWaitTime": 5000,
  "returnPartialOnTimeout": true,
  "outputFormat": "html"
}
```

**Required Fields:**
- `urls`: Array of URLs to process

**Optional Fields:**
- `concurrency`: Number of concurrent requests - default: 3, max: 5
- `timeout`: Timeout per URL - default: 60000
- `waitUntil`: Wait condition for all URLs
- `scrollToBottom`: Scroll for all URLs - default: true
- `extraWaitTime`: Extra wait time for all URLs
- `returnPartialOnTimeout`: Return partial content on timeout
- `outputFormat`: Response format ('html', 'text', 'json') - default: 'html'

**Response:**
```json
{
  "results": [
    {
      "url": "https://example1.com",
      "success": true,
      "html": "<html>...</html>",
      "title": "Page 1",
      "contentLength": 12345,
      "timestamp": "2025-09-12T12:00:00.000Z",
      "renderTime": 2345
    },
    {
      "url": "https://example2.com",
      "success": false,
      "error": "Timeout error",
      "timestamp": "2025-09-12T12:00:05.000Z",
      "renderTime": 60000
    }
  ],
  "summary": {
    "total": 3,
    "successful": 2,
    "failed": 1,
    "totalTime": 125000,
    "averageTime": 41667
  },
  "timestamp": "2025-09-12T12:00:00.000Z"
}
```

**Example:**
```bash
curl -X POST "https://your-subdomain.yourdomain.com/api/batch?token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://example1.com",
      "https://example2.com"
    ],
    "concurrency": 2,
    "timeout": 30000,
    "outputFormat": "text"
  }'
```

## Advanced Features

### Human-like Behavior Simulation
All POST endpoints automatically include:
- Realistic user agent rotation (Windows browsers)
- Natural mouse movements and interactions
- Human-like scrolling patterns with easing
- Random timing variations and pauses
- Browser-specific headers and properties

### Anti-Detection Techniques
- 40+ stealth techniques automatically applied
- Webdriver property removal
- Realistic browser fingerprinting
- Natural plugin and MIME type spoofing
- Comprehensive automation indicator removal

### Timeout Handling
- **Primary timeout**: Main operation timeout
- **Partial content recovery**: Returns content even on timeout
- **Emergency extraction**: Fallback method for difficult sites
- **Graceful degradation**: Multiple fallback strategies

### Error Recovery
- Automatic retry with simpler settings on failure
- Emergency content extraction for timeout scenarios
- Partial content return when possible
- Detailed error reporting with context

## Cookie Management

**Cookie Format:**
```json
{
  "name": "cookie_name",
  "value": "cookie_value",
  "domain": ".example.com",
  "path": "/",
  "expires": 1640995200,
  "httpOnly": true,
  "secure": true,
  "sameSite": "Lax"
}
```

**Required Fields:** `name`, `value`
**Optional Fields:** `domain`, `path`, `expires`, `httpOnly`, `secure`, `sameSite`

## Custom Scripts

Execute JavaScript on the page after loading:

```json
{
  "customScript": "window.scrollTo(0, document.body.scrollHeight); document.querySelector('.load-more').click();"
}
```

**Best Practices:**
- Keep scripts simple and focused
- Avoid long-running operations
- Handle errors gracefully
- Don't interfere with page functionality

## Error Handling

**Error Response Format:**
```json
{
  "error": "Error type",
  "details": "Detailed error message",
  "timestamp": "2025-09-12T12:00:00.000Z",
  "url": "https://failed-url.com"
}
```

**Common Errors:**
- `400`: Missing/invalid URL or parameters
- `401`: Invalid/missing authentication token
- `500`: Server error or page loading failure
- `503`: Service temporarily unavailable

## Performance Optimization

### Request Optimization
- Use appropriate timeouts for target sites
- Enable `returnPartialOnTimeout` for better reliability
- Set reasonable `extraWaitTime` values
- Use `waitForSelectors` for specific content

### Batch Processing Tips
- Keep concurrency between 2-5 for stability
- Group similar sites together
- Use shorter timeouts for batch requests
- Monitor server resources

### Resource Management
- HeadlessX automatically manages browser instances
- Requests are queued and processed efficiently
- Memory is cleaned up after each request
- Failed requests don't affect other operations

## Security Considerations

1. **Token Security**: Never expose tokens in client-side code
2. **Input Validation**: All URLs and parameters are validated
3. **Resource Limits**: Automatic limits prevent resource exhaustion
4. **Error Handling**: Sensitive information is not exposed in errors

## Best Practices

1. **Start Simple**: Test with basic options before adding complexity
2. **Use Timeouts Wisely**: Balance completeness vs speed
3. **Handle Errors**: Always check response status and handle failures
4. **Monitor Performance**: Track response times and success rates
5. **Respect Targets**: Follow robots.txt and rate limiting guidelines

## Support

For issues with POST endpoints:
1. Verify authentication token
2. Check request body format (valid JSON)
3. Test with simpler parameters first
4. Check server logs for detailed errors
5. Use `/api/health` to verify server status
6. Create GitHub issues for bugs or feature requests

---

## 🌟 Real-World Use Case Examples (v1.3.0)

### 1. Scraping Google Search Results (Anti-Bot Evasion)
```bash
curl -X POST "https://your-domain.com/api/render" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "url": "https://www.google.com/search?q=nodejs+web+scraping",
    "timeout": 120000,
    "returnPartialOnTimeout": true,
    "deviceProfile": "high-end-desktop",
    "geoProfile": "us-east",
    "behaviorProfile": "natural",
    "enableAdvancedStealth": true,
    "enableCanvasSpoofing": true,
    "enableWebGLSpoofing": true,
    "enableWebRTCBlocking": true,
    "simulateMouseMovement": true,
    "simulateScrolling": true,
    "humanDelays": true,
    "randomizeTimings": true,
    "waitForSelectors": ["#search", ".g"],
    "removeElements": [".ads", "[data-ad-slot]"]
  }'
```

### 2. E-commerce Product Data
```bash
curl -X POST "https://your-domain.com/api/render" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "url": "https://store.example.com/products/laptop",
    "timeout": 75000,
    "deviceProfile": "business-laptop",
    "geoProfile": "us-central",
    "behaviorProfile": "natural",
    "enableAdvancedStealth": true,
    "simulateScrolling": true,
    "humanDelays": true,
    "scrollToBottom": true,
    "waitForSelectors": [".price", ".product-title", ".reviews"],
    "waitForNetworkIdle": true,
    "extraWaitTime": 5000,
    "removeElements": [".cookie-banner", ".newsletter-popup"],
    "headers": {
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9"
    }
  }'
```

### 3. Social Media Content (Advanced Stealth)
```bash
curl -X POST "https://your-domain.com/api/render" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "url": "https://social-platform.com/user/profile",
    "timeout": 90000,
    "deviceProfile": "gaming-laptop", 
    "geoProfile": "us-west",
    "behaviorProfile": "confident",
    "enableAdvancedStealth": true,
    "enableCanvasSpoofing": true,
    "enableWebGLSpoofing": true,
    "enableAudioSpoofing": true,
    "enableWebRTCBlocking": true,
    "simulateMouseMovement": true,
    "simulateScrolling": true,
    "humanDelays": true,
    "randomizeTimings": true,
    "waitForSelectors": [".posts", ".profile-info"],
    "scrollToBottom": true,
    "customScript": "window.scrollTo(0, document.body.scrollHeight/2); await new Promise(r => setTimeout(r, 2000));"
  }'
```

### 4. News Article Extraction
```bash
curl -X POST "https://your-domain.com/api/content" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "url": "https://news.example.com/article/123",
    "timeout": 45000,
    "deviceProfile": "mid-range-desktop",
    "geoProfile": "us-east", 
    "behaviorProfile": "natural",
    "enableAdvancedStealth": true,
    "simulateScrolling": true,
    "humanDelays": true,
    "waitForSelectors": ["article", ".article-body", "h1"],
    "removeElements": [".ads", ".sidebar", ".comments", ".related-articles", ".newsletter-signup"],
    "extraWaitTime": 3000
  }'
```

### 5. JavaScript-Heavy SPA (Single Page Application)
```bash
curl -X POST "https://your-domain.com/api/render" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "url": "https://spa-app.com/dashboard",
    "timeout": 60000,
    "deviceProfile": "high-end-desktop",
    "geoProfile": "us-central",
    "behaviorProfile": "confident",
    "enableAdvancedStealth": true,
    "simulateMouseMovement": true,
    "simulateScrolling": true,
    "humanDelays": true,
    "waitUntil": "networkidle0",
    "waitForNetworkIdle": true,
    "waitForSelectors": [".dashboard-loaded", "[data-testid=\"content\"]"],
    "extraWaitTime": 8000,
    "customScript": "document.querySelectorAll(\".loading\").forEach(el => el.style.display = \"none\");"
  }'
```

### 6. Multi-URL Batch Processing
```bash
curl -X POST "https://your-domain.com/api/batch" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "urls": [
      "https://example1.com/page1",
      "https://example2.com/page2", 
      "https://example3.com/page3"
    ],
    "concurrency": 2,
    "timeout": 45000,
    "outputFormat": "json",
    "deviceProfile": "business-laptop",
    "geoProfile": "us-east",
    "behaviorProfile": "natural",
    "enableAdvancedStealth": true,
    "humanDelays": true,
    "simulateScrolling": true,
    "returnPartialOnTimeout": true,
    "waitForSelectors": [".content"],
    "removeElements": [".ads", ".popup"]
  }'
```

### 7. API Testing with Maximum Stealth
```javascript
// Node.js example
const fetch = require('node-fetch');

const scrapeWithMaxStealth = async (url) => {
  const response = await fetch('https://your-domain.com/api/render', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_AUTH_TOKEN'
    },
    body: JSON.stringify({
      url: url,
      timeout: 90000,
      deviceProfile: 'high-end-desktop',
      geoProfile: 'us-east',
      behaviorProfile: 'natural',
      enableAdvancedStealth: true,
      enableCanvasSpoofing: true,
      enableWebGLSpoofing: true,
      enableAudioSpoofing: true,
      enableWebRTCBlocking: true,
      simulateMouseMovement: true,
      simulateScrolling: true,
      simulateTyping: false,
      humanDelays: true,
      randomizeTimings: true,
      returnPartialOnTimeout: true,
      waitForNetworkIdle: true,
      scrollToBottom: true,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'max-age=0'
      }
    })
  });
  
  return await response.json();
};

// Usage
scrapeWithMaxStealth('https://protected-site.com')
  .then(result => console.log(result.html))
  .catch(error => console.error(error));
```

### 8. Python Example with Requests
```python
import requests
import json

def scrape_with_headlessx(url, auth_token):
    endpoint = "https://your-domain.com/api/render"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    }
    
    payload = {
        "url": url,
        "timeout": 75000,
        "deviceProfile": "mid-range-desktop",
        "geoProfile": "us-east", 
        "behaviorProfile": "natural",
        "enableAdvancedStealth": True,
        "enableCanvasSpoofing": True,
        "enableWebGLSpoofing": True,
        "enableWebRTCBlocking": True,
        "simulateMouseMovement": True,
        "simulateScrolling": True,
        "humanDelays": True,
        "randomizeTimings": True,
        "returnPartialOnTimeout": True,
        "waitForNetworkIdle": True,
        "scrollToBottom": True
    }
    
    response = requests.post(endpoint, headers=headers, json=payload)
    return response.json()

# Usage
result = scrape_with_headlessx("https://example.com", "YOUR_AUTH_TOKEN")
print(f"Title: {result['title']}")
print(f"Content length: {result['contentLength']}")
```

## 📊 Performance Tips for v1.3.0

### Optimal Settings by Site Type:
- **Google/Search Engines**: `timeout: 120000`, `deviceProfile: "high-end-desktop"`, full stealth enabled
- **E-commerce Sites**: `timeout: 75000`, `deviceProfile: "business-laptop"`, moderate stealth
- **News Sites**: `timeout: 45000`, `deviceProfile: "mid-range-desktop"`, basic stealth
- **Social Media**: `timeout: 90000`, `deviceProfile: "gaming-laptop"`, full stealth + behavioral simulation
- **SPAs/Heavy JS**: `timeout: 60000`, `waitUntil: "networkidle0"`, longer `extraWaitTime`

### Best Practices for Anti-Detection:
1. Always use realistic device profiles matching your target audience
2. Match geolocation profiles with your server location when possible
3. Enable `returnPartialOnTimeout` for better reliability
4. Use `humanDelays` and `randomizeTimings` for better stealth
5. Customize user agents to match your device profile
6. Remove unnecessary elements early with `removeElements`
7. Use appropriate behavioral profiles for your use case
