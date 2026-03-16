# API Endpoints

This document describes the backend HTTP surface for `apps/api` in HeadlessX.

It is based on the current route tree mounted in `apps/api/src/app.ts`.

## Backend System Summary

- Runtime: Express 5 API with TypeScript
- Persistence: PostgreSQL via Prisma
- Auth: `x-api-key` guard on all non-health routes
- Async jobs: BullMQ with Redis and a separate worker process
- Browser scraping: Camoufox and Playwright services
- External integrations: Tavily, Exa, yt-engine, HTML-to-Markdown service

## Auth And Transport

- Public route: `GET /api/health`
- Protected routes: every other `/api/*` endpoint requires `x-api-key`
- Internal dashboard traffic can use `DASHBOARD_INTERNAL_API_KEY`
- SSE endpoints use `text/event-stream`

Common SSE event names in this backend:

- `start`
- `progress`
- `result`
- `error`
- `done`

Google SERP currently ends its stream with `end` instead of `done`.

## Dependency Notes

| Area | Requirement |
| --- | --- |
| `/api/jobs/*` | Redis plus the queue worker |
| `/api/website/crawl` | Redis plus the queue worker |
| `/api/website/content` | Uses `HTML_TO_MARKDOWN_SERVICE_URL` when available, then falls back locally |
| `/api/tavily/*` | `TAVILY_API_KEY` |
| `/api/exa/*` | `EXA_API_KEY` |
| `/api/youtube/*` | `YT_ENGINE_URL` |
| most protected routes | PostgreSQL for API keys, logs, settings, proxies, and persisted data |

## Core Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Public health check and route summary |
| `GET` | `/api/config` | Read current system settings |
| `PATCH` | `/api/config` | Update system settings and restart browser runtime |
| `GET` | `/api/dashboard/stats` | Read dashboard summary metrics |
| `GET` | `/api/logs` | List paginated request logs |
| `GET` | `/api/logs/stats` | Read aggregated request log stats |
| `GET` | `/api/keys` | List API keys |
| `POST` | `/api/keys` | Create API key |
| `PATCH` | `/api/keys/:id/revoke` | Revoke API key |
| `DELETE` | `/api/keys/:id` | Delete API key |

## Proxy Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/proxies` | List all proxies |
| `GET` | `/api/proxies/active` | List active proxies only |
| `GET` | `/api/proxies/:id` | Read one proxy |
| `POST` | `/api/proxies` | Create proxy |
| `PATCH` | `/api/proxies/:id` | Update proxy |
| `DELETE` | `/api/proxies/:id` | Delete proxy |
| `POST` | `/api/proxies/:id/toggle` | Toggle active state |
| `POST` | `/api/proxies/:id/test` | Test proxy connectivity |

## Website Scraper Endpoints

| Method | Path | Purpose | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/website/scrape` | SSE website scrape | Primary streaming scrape route |
| `POST` | `/api/website/stream` | SSE website scrape | Legacy alias of `/scrape` |
| `POST` | `/api/website/map` | Discover links quickly | Non-streaming |
| `POST` | `/api/website/map/stream` | Stream site discovery progress | SSE |
| `POST` | `/api/website/crawl` | Queue-backed crawl job | Requires Redis and worker |
| `POST` | `/api/website/html` | Fast HTML scrape | No JS rendering |
| `POST` | `/api/website/html-js` | JS-rendered HTML scrape | Browser-rendered |
| `POST` | `/api/website/content` | Markdown content extraction | Uses markdown service when configured |
| `POST` | `/api/website/screenshot` | Full-page screenshot | Binary image result |

## Google SERP Endpoints

| Method | Path | Purpose | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/google-serp/search` | Standard Google result scrape | JSON response |
| `GET` | `/api/google-serp/stream` | Stream Google search progress | SSE, expects query params like `query` and optional `timeout` |
| `GET` | `/api/google-serp/status` | Service status | Lightweight availability check |

## Tavily Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/tavily/search` | Tavily search |
| `POST` | `/api/tavily/research` | Start Tavily research workflow |
| `GET` | `/api/tavily/research/:requestId` | Poll Tavily research result |
| `GET` | `/api/tavily/status` | Tavily configuration and status |

## Exa Endpoints

| Method | Path | Purpose | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/exa/search` | Standard Exa search | JSON response |
| `POST` | `/api/exa/search/stream` | Stream Exa search progress | SSE |
| `GET` | `/api/exa/status` | Exa configuration and status | Lightweight availability check |

## YouTube Endpoints

| Method | Path | Purpose | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/youtube/info/stream` | Stream YouTube extract flow | SSE |
| `POST` | `/api/youtube/info` | Extract YouTube metadata | JSON response |
| `POST` | `/api/youtube/formats` | Extract available format inventory | JSON response |
| `POST` | `/api/youtube/subtitles` | Extract subtitles and captions | JSON response |
| `POST` | `/api/youtube/save/stream` | Stream temporary download packaging | SSE |
| `POST` | `/api/youtube/save` | Create temporary downloadable archive | JSON response |
| `GET` | `/api/youtube/download/:jobId` | Download generated zip | Proxies yt-engine artifact |
| `DELETE` | `/api/youtube/download/:jobId` | Delete temporary saved artifact | Cleanup endpoint |
| `GET` | `/api/youtube/status` | yt-engine status | Fails if `YT_ENGINE_URL` is missing or unavailable |

## Queue Job Endpoints

| Method | Path | Purpose | Notes |
| --- | --- | --- | --- |
| `GET` | `/api/jobs` | List queue jobs | Filtered via query params |
| `GET` | `/api/jobs/metrics` | Read queue metrics | BullMQ-backed |
| `POST` | `/api/jobs` | Create generic queue job | Supports multiple job types |
| `POST` | `/api/jobs/scrape` | Enqueue scrape job | Async |
| `POST` | `/api/jobs/crawl` | Enqueue crawl job | Async |
| `POST` | `/api/jobs/extract` | Enqueue extract job | Async |
| `POST` | `/api/jobs/index` | Enqueue index job | Async |
| `GET` | `/api/jobs/active` | Read currently active job | Checks stream jobs first, then queue |
| `GET` | `/api/jobs/:id` | Read job status/result | Works for stream and queue jobs |
| `GET` | `/api/jobs/:id/stream` | Reconnect to job progress stream | SSE |
| `POST` | `/api/jobs/:id/cancel` | Cancel running or queued job | Uses active job manager / queue cancellation |

## Legacy Compatibility Routes

These routes are still mounted for backward compatibility.

### `/api/v1`

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/html` | Legacy HTML scrape |
| `POST` | `/api/v1/html-js` | Legacy JS HTML scrape |
| `POST` | `/api/v1/content` | Legacy content extraction |
| `POST` | `/api/v1/screenshot` | Legacy screenshot |
| `GET` | `/api/v1/config` | Legacy config read |
| `PATCH` | `/api/v1/config` | Legacy config update |
| `GET` | `/api/v1/logs` | Legacy request logs |
| `GET` | `/api/v1/api-keys` | Legacy API key list |
| `POST` | `/api/v1/api-keys` | Legacy API key create |

### `/api/v2`

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/v2/html` | V2 HTML scrape |
| `POST` | `/api/v2/html-js` | V2 JS HTML scrape |
| `POST` | `/api/v2/content` | V2 content extraction |
| `POST` | `/api/v2/screenshot` | V2 screenshot |
| `GET` | `/api/v2/config` | V2 config read |
| `PATCH` | `/api/v2/config` | V2 config update |

## Operational Notes

- The API and worker are separate processes. Queue-backed endpoints may return `503` when Redis is unavailable.
- Configuration changes invalidate cached settings and restart the browser service.
- Website Crawl is not an inline scrape. It is a queued workflow.
- The web dashboard talks to this API using the internal dashboard key on server-side requests.
