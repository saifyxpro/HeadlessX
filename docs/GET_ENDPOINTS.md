# GET Endpoints Documentation

This document provides detailed information about all GET endpoints available in HeadlessX v1.2.0 (Modular Architecture).

## Authentication

All API endpoints (except health check) require authentication via the `token` parameter:
```
?token=YOUR_SECURE_AUTH_TOKEN
```

> **Note**: Environment variable changed from `TOKEN` to `AUTH_TOKEN` in v1.2.0

## Core GET Endpoints

### 1. Health Check
```http
GET /api/health
```

**Description:** Check server health and status

**Authentication:** Not required

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

### 2. Server Status
```http
GET /api/status?token=YOUR_TOKEN
```

**Description:** Detailed server status and endpoint information

**Parameters:**
- `token` (required): Authentication token

**Response:**
```json
{
  "server": {
    "name": "HeadlessX - Advanced Browserless Web Scraping API",
    "version": "1.1.0",
    "uptime": 8947,
    "startTime": "2025-09-12T10:00:00.000Z"
  },
  "browser": {
    "connected": true,
    "type": "Chromium"
  },
  "endpoints": [...],
  "memory": {...},
  "timestamp": "2025-09-12T12:00:00.000Z"
}
```

### 3. HTML Extraction (GET)
```http
GET /api/html?token=YOUR_TOKEN&url=https://example.com
```

**Description:** Extract raw HTML from a webpage

**Parameters:**
- `token` (required): Authentication token
- `url` (required): Target URL to scrape
- `waitUntil` (optional): Wait condition ('load', 'domcontentloaded', 'networkidle') - default: 'networkidle'
- `timeout` (optional): Timeout in milliseconds - default: 60000
- `extraWait` (optional): Extra wait time in milliseconds - default: 10000
- `scroll` (optional): Scroll to bottom ('true'/'false') - default: 'true'
- `networkIdle` (optional): Wait for network idle ('true'/'false') - default: 'true'
- `console` (optional): Capture console logs ('true'/'false') - default: 'false'
- `returnPartial` (optional): Return partial content on timeout ('true'/'false') - default: 'true'
- `waitForSelectors` (optional): Comma-separated CSS selectors to wait for
- `clickSelectors` (optional): Comma-separated CSS selectors to click
- `removeElements` (optional): Comma-separated CSS selectors to remove

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
curl "https://your-subdomain.yourdomain.com/api/html?token=YOUR_TOKEN&url=https://example.com&timeout=30000&scroll=true"
```

### 4. Clean Text Extraction (GET)
```http
GET /api/content?token=YOUR_TOKEN&url=https://example.com
```

**Description:** Extract clean, readable text content from a webpage

**Parameters:** Same as HTML extraction endpoint

**Response Headers:**
- `Content-Type`: text/plain; charset=utf-8
- `X-Rendered-URL`: Final URL after redirects
- `X-Page-Title`: Page title
- `X-Content-Length`: Text content length
- `X-Timestamp`: Rendering timestamp
- `X-Was-Timeout`: Whether timeout occurred
- `X-Is-Emergency`: Whether emergency extraction was used

**Response:** Clean text content

**Example:**
```bash
curl "https://your-subdomain.yourdomain.com/api/content?token=YOUR_TOKEN&url=https://example.com"
```

### 5. Screenshot Capture
```http
GET /api/screenshot?token=YOUR_TOKEN&url=https://example.com
```

**Description:** Capture a screenshot of a webpage

**Parameters:**
- `token` (required): Authentication token
- `url` (required): Target URL to screenshot
- `fullPage` (optional): Full page screenshot ('true'/'false') - default: 'false'
- `format` (optional): Image format ('png'/'jpeg') - default: 'png'
- `width` (optional): Viewport width - default: 1920
- `height` (optional): Viewport height - default: 1080
- `quality` (optional): JPEG quality (1-100) - only for JPEG format
- `timeout` (optional): Timeout in milliseconds - default: 60000
- `waitUntil` (optional): Wait condition - default: 'networkidle'
- `extraWait` (optional): Extra wait time - default: 10000

**Response Headers:**
- `Content-Type`: image/png or image/jpeg
- `Content-Disposition`: attachment; filename="screenshot.[ext]"
- `X-Rendered-URL`: Final URL
- `X-Page-Title`: Page title
- `X-Screenshot-Width`: Image width
- `X-Screenshot-Height`: Image height

**Response:** Binary image data

**Example:**
```bash
curl "https://your-subdomain.yourdomain.com/api/screenshot?token=YOUR_TOKEN&url=https://example.com&fullPage=true&format=png" -o screenshot.png
```

### 6. PDF Generation
```http
GET /api/pdf?token=YOUR_TOKEN&url=https://example.com
```

**Description:** Generate a PDF from a webpage

**Parameters:**
- `token` (required): Authentication token
- `url` (required): Target URL to convert to PDF
- `format` (optional): Paper format ('A4', 'A3', 'Letter', etc.) - default: 'A4'
- `background` (optional): Print background graphics ('true'/'false') - default: 'true'
- `margin` (optional): Page margins - default: '20px'
- `landscape` (optional): Landscape orientation ('true'/'false') - default: 'false'
- `timeout` (optional): Timeout in milliseconds - default: 60000
- `waitUntil` (optional): Wait condition - default: 'networkidle'
- `extraWait` (optional): Extra wait time - default: 10000

**Response Headers:**
- `Content-Type`: application/pdf
- `Content-Disposition`: attachment; filename="page.pdf"
- `X-Rendered-URL`: Final URL
- `X-Page-Title`: Page title

**Response:** Binary PDF data

**Example:**
```bash
curl "https://your-subdomain.yourdomain.com/api/pdf?token=YOUR_TOKEN&url=https://example.com&format=A4&background=true" -o page.pdf
```

## Error Responses

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `400`: Bad Request (missing/invalid parameters)
- `401`: Unauthorized (invalid/missing token)
- `500`: Internal Server Error

**Error Format:**
```json
{
  "error": "Error description",
  "details": "Detailed error message",
  "timestamp": "2025-09-12T12:00:00.000Z"
}
```

## Rate Limiting

While HeadlessX doesn't enforce strict rate limiting, be mindful of:
- Server resources and concurrent requests
- Target website rate limiting policies
- Browser instance limitations

## Best Practices

1. **Always use HTTPS** in production
2. **Keep tokens secure** - never expose in client-side code
3. **Use appropriate timeouts** based on target website complexity
4. **Enable partial content return** for better reliability
5. **Test with simple sites first** before complex SPAs
6. **Monitor server resources** under load

## Support

For issues with GET endpoints:
1. Check the `/api/health` endpoint first
2. Verify token authentication
3. Test with simpler URLs
4. Check server logs for detailed errors
5. Create GitHub issues for bugs
