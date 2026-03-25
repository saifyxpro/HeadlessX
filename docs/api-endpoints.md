# API Endpoints

This document describes the backend HTTP surface for `apps/api` in HeadlessX.

It is based on the operator-first route tree mounted in `apps/api/src/app.ts`.

## Backend System Summary

- Runtime: Express 5 API with TypeScript
- Persistence: PostgreSQL via Prisma
- Auth: `x-api-key` guard on all non-health routes
- Async jobs: BullMQ with Redis and a separate worker process
- Browser scraping: Headfox JS with Camoufox-compatible browser bundles plus Playwright services
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

Google AI Search currently ends its stream with `end` instead of `done`.

## Dependency Notes

| Area | Requirement |
| --- | --- |
| `/api/jobs/*` | Redis plus the queue worker |
| `/api/operators/website/crawl` | Redis plus the queue worker |
| `/api/operators/website/scrape/content` | Uses `HTML_TO_MARKDOWN_SERVICE_URL` when available, then falls back locally |
| `/api/operators/google/ai-search/*` | Shared browser profile must be cookie-bootstrapped once before search |
| `/api/operators/tavily/*` | `TAVILY_API_KEY` |
| `/api/operators/exa/*` | `EXA_API_KEY` |
| `/api/operators/youtube/*` | `YT_ENGINE_URL` to activate the yt-engine-backed workspace |
| most protected routes | PostgreSQL for API keys, logs, settings, proxies, and persisted data |

Only the queue-backed website crawl flow requires Redis. The other website operator endpoints such as `/api/operators/website/scrape/html`, `/api/operators/website/scrape/html-js`, `/api/operators/website/scrape/content`, `/api/operators/website/scrape/screenshot`, and `/api/operators/website/map` do not depend on Redis.

## Core Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Public health check and route summary |
| `ALL` | `/mcp` | Remote MCP endpoint over Streamable HTTP |
| `GET` | `/api/config` | Read current system settings |
| `PATCH` | `/api/config` | Update system settings and restart browser runtime |
| `GET` | `/api/dashboard/stats` | Read dashboard summary metrics |
| `GET` | `/api/logs` | List paginated request logs |
| `GET` | `/api/logs/stats` | Read aggregated request log stats |
| `GET` | `/api/keys` | List API keys |
| `POST` | `/api/keys` | Create API key |
| `PATCH` | `/api/keys/:id/revoke` | Revoke API key |
| `DELETE` | `/api/keys/:id` | Delete API key |

## Operator Catalog Endpoints

| Method | Path | Purpose | Notes |
| --- | --- | --- | --- |
| `GET` | `/api/operators/status` | List all playground operators with current availability | Returns active, config-required, offline, and coming-soon operators |

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

## Website Operator Endpoints

| Method | Path | Purpose | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/operators/website/scrape/stream` | SSE website scrape | Primary streaming scrape route |
| `POST` | `/api/operators/website/map` | Discover links quickly | Non-streaming |
| `POST` | `/api/operators/website/map/stream` | Stream site discovery progress | SSE |
| `POST` | `/api/operators/website/crawl` | Queue-backed crawl job | Requires Redis and worker |
| `POST` | `/api/operators/website/scrape/html` | Fast HTML scrape | No JS rendering |
| `POST` | `/api/operators/website/scrape/html-js` | JS-rendered HTML scrape | Browser-rendered |
| `POST` | `/api/operators/website/scrape/content` | Markdown content extraction | Uses markdown service when configured |
| `POST` | `/api/operators/website/scrape/screenshot` | Full-page screenshot | Binary image result |

## Google AI Search Endpoints

| Method | Path | Purpose | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/operators/google/ai-search/search` | Standard Google AI Search scrape | JSON response, accepts `query` plus optional `gl`, `hl`, `tbs`, and `stealth` |
| `GET` | `/api/operators/google/ai-search/stream` | Stream Google AI Search progress | SSE, expects `query` and optional `timeout`, `gl`, `hl`, `tbs`, and `stealth` |
| `GET` | `/api/operators/google/ai-search/status` | Service status | Lightweight availability check |
| `GET` | `/api/operators/google/ai-search/cookies/status` | Read shared-profile cookie bootstrap state | Returns `required`, `running`, or `ready` |
| `POST` | `/api/operators/google/ai-search/cookies/build` | Start the shared browser for manual Google cookie setup | Opens Google in the shared profile, uses a virtual display when needed |
| `POST` | `/api/operators/google/ai-search/cookies/stop` | Stop the shared cookie bootstrap browser and persist the profile | Saves the shared session for later searches |

Google AI Search request fields:

| Field | Type | Meaning |
| --- | --- | --- |
| `query` | `string` | Search query text |
| `gl` | `string` | Two-letter Google region code such as `pk`, `us`, or `in` |
| `hl` | `string` | Two-letter Google language code such as `en` or `ur` |
| `tbs` | `qdr:h \\| qdr:d \\| qdr:w` | Optional time filter for past hour, day, or week |
| `stealth` | `boolean` | Optional stealth toggle, where `false` uses a faster less-humanized input path |

Google bootstrap behavior:

- before the shared profile is ready, search endpoints return `412` with code `GOOGLE_COOKIE_BOOTSTRAP_REQUIRED`
- while the cookie browser is still open, search endpoints return `409` with code `GOOGLE_COOKIE_BOOTSTRAP_ACTIVE`
- the shared profile is persisted under `apps/api/data/browser-profile/default` for local repo runs and in the Docker `browser_profile` volume for self-hosted stacks

## Tavily Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/operators/tavily/search` | Tavily search |
| `POST` | `/api/operators/tavily/research` | Start Tavily research workflow |
| `GET` | `/api/operators/tavily/research/:requestId` | Poll Tavily research result |
| `GET` | `/api/operators/tavily/status` | Tavily configuration and status |

## Exa Endpoints

| Method | Path | Purpose | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/operators/exa/search` | Standard Exa search | JSON response |
| `POST` | `/api/operators/exa/search/stream` | Stream Exa search progress | SSE |
| `GET` | `/api/operators/exa/status` | Exa configuration and status | Lightweight availability check |

## YouTube Endpoints

| Method | Path | Purpose | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/operators/youtube/info/stream` | Stream YouTube extract flow | SSE |
| `POST` | `/api/operators/youtube/info` | Extract YouTube metadata | JSON response |
| `POST` | `/api/operators/youtube/formats` | Extract available format inventory | JSON response |
| `POST` | `/api/operators/youtube/subtitles` | Extract subtitles and captions | JSON response |
| `POST` | `/api/operators/youtube/save/stream` | Stream temporary download packaging | SSE |
| `POST` | `/api/operators/youtube/save` | Create temporary downloadable archive | JSON response |
| `GET` | `/api/operators/youtube/download/:jobId` | Download generated zip | Proxies yt-engine artifact |
| `DELETE` | `/api/operators/youtube/download/:jobId` | Delete temporary saved artifact | Cleanup endpoint |
| `GET` | `/api/operators/youtube/status` | yt-engine status | Fails if `YT_ENGINE_URL` is missing or unavailable |

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

## Operational Notes

- The API and worker are separate processes. Queue-backed endpoints may return `503` when Redis is unavailable.
- Configuration changes invalidate cached settings and restart the browser service.
- Website Crawl is not an inline scrape. It is the only website operator workflow here that is queue-backed.
- The web dashboard talks to this API using the internal dashboard key on server-side requests.
- The MCP endpoint uses normal API keys created from the dashboard and does not accept `DASHBOARD_INTERNAL_API_KEY`.
