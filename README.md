<div align="center">

![HeadlessX Logo](assets/logo-hr.svg)

### Self-hosted scraping and search workflows powered by Camoufox

[![Version](https://img.shields.io/badge/Version-v2.1.0-blue?style=for-the-badge)](docs/setup-guide.md)
[![Runtime](https://img.shields.io/badge/Node.js-22+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-MIT-black?style=for-the-badge)](LICENSE)

[Setup Guide](https://headlessx.saify.me/docs/self-hosting/overview) • [API Reference](https://headlessx.saify.me/docs/api-reference/overview) • [MCP](https://headlessx.saify.me/docs/get-started/mcp-setup)

</div>

---

<div align="center">

![HeadlessX Demo](assets/demo.gif)

</div>

## Overview

HeadlessX is a self-hosted scraping platform with a web dashboard, protected API, queue-backed workflows, and a remote MCP endpoint.

Current live surfaces:

- Website scraping: scrape, crawl, map, content extraction, screenshots
- Google SERP
- Tavily
- Exa
- YouTube
- Queue jobs, logs, API keys, proxy management, and config management
- Remote MCP over `/mcp`

## What Changed In v2.1.0

- Simplified the dashboard around one global browser/runtime model
- Added Tavily, Exa, and YouTube workspaces
- Added queued crawl and job flows with Redis + worker support
- Added remote MCP secured with normal dashboard-created API keys
- Added setup and API guides aligned with the current route tree

## Scrapers

<div align="center">

![HeadlessX Live Scrapers](assets/live_scrapers.png)

</div>

### Live Now

| Scraper | Status |
| --- | --- |
| Website | Live |
| Google SERP | Live |
| Tavily | Live |
| Exa | Live |
| YouTube | Live |

### Coming Soon

| Scraper | Description | Status |
| --- | --- | --- |
| Google Maps | Extract business listings, reviews, categories, ratings, contact details, opening hours, and location metadata from Google Maps search results. | Planned |
| Twitter / X | Capture profiles, posts, engagement metrics, media, hashtags, and conversation threads from public X pages. | Planned |
| LinkedIn | Extract public company and profile data, role details, locations, website links, and business metadata from LinkedIn surfaces. | Planned |
| Instagram | Collect public profile data, captions, post metadata, media links, reels references, and engagement signals. | Planned |
| Amazon | Extract product listings, seller data, pricing, ratings, reviews, availability, and catalog metadata from Amazon pages. | Planned |
| Facebook | Capture public page data, posts, about fields, links, follower counts, and engagement metadata from Facebook pages. | Planned |
| Reddit | Extract subreddit, post, comment, author, score, flair, and discussion metadata from Reddit threads and listings. | Planned |
| ThomasNet Suppliers Real-Time Scraper | Extract 70+ ThomasNet supplier fields including emails, phone numbers, company data, products, locations, certifications, and more. | Planned |
| TLS Appointment Booker | Automate TLS appointment availability checks and booking workflows with support for high-frequency monitoring and retry-safe session handling. | Planned |
| GlobalSpec Suppliers Scraper | Extract 200,000+ industrial supplier profiles from GlobalSpec Engineering360 with contact data, business type, product catalogs, specs, and datasheets. | Planned |
| ImportYeti Scraper | Extract supplier profiles, shipment records, and trade data from ImportYeti with 60+ fields including HS codes, shipping lanes, carriers, bills of lading, trading partners, and contact info. | Planned |
| MakersRow Scraper | Extract 11,600+ US manufacturer profiles from MakersRow with email, phone, address, website, GPS coordinates, capabilities, ratings, gallery images, and business hours. | Planned |

## Packages Coming Soon

| Package | Description | Status |
| --- | --- | --- |
| yt-dude | Dedicated YouTube extraction package for metadata, subtitles, formats, transcripts, and workflow-oriented media tooling. | Planned |
| headfox | HeadlessX-maintained Firefox-based anti-detect browser engine that will power the platform's next-generation browser runtime. | Planned |
| headfox-js | TypeScript package for launching, managing, and integrating Headfox in Node.js automation and scraping flows. | Planned |
| hx-cli | OpenClaw-friendly command-line interface for running HeadlessX scrapers, jobs, workflows, and future automation tooling from the terminal. | Planned |

## Agent Surfaces Coming Soon

| Surface | Description | Status |
| --- | --- | --- |
| Skills.md (Agent Skills) | Versioned agent skill packs and workflow instructions that teach automation agents how to use HeadlessX scrapers, jobs, tools, and MCP capabilities. | Planned |
| Web AI Agent (`/web`) | Interactive AI agent workspace inside the dashboard that can use all HeadlessX playground tools and scrapers, including Website, Google SERP, Tavily, Exa, YouTube, and related workflow actions. | Planned |

## UI Screenshots

### Google SERP
![Google SERP UI](assets/google-serp-results.png)

### Website
![Website UI](assets/web-scrape-results.png)

## Proof

### BrowserScan
![BrowserScan](assets/Browserscan_Bot_Detection_Passed.png)

### Cloudflare Challenge
![Cloudflare Challenge](assets/cloudfare.png)

<table>
  <tr>
    <td valign="top" width="50%">

### Pixelscan
![Pixelscan](assets/Pixel_Human_Detection.png)

  </td>
    <td valign="top" width="50%">

### Proxy Validation
![Proxy Validation](assets/USA_PROXY_TESTED.png)

  </td>
  </tr>
</table>

## Quick Start

### Requirements

- Node.js 22+
- pnpm 9+
- PostgreSQL
- Redis
- Python/uv for `yt-engine`
- Go for the HTML-to-Markdown sidecar

### Recommended Development Setup

Recommended for most developers:

- PostgreSQL: Supabase or Docker
- Redis: Docker
- App runtime: `pnpm dev` or `mise run dev`

This keeps infrastructure simple while still running the app locally.

### Local Development

1. Clone and install:

```bash
git clone https://github.com/saifyxpro/HeadlessX.git
cd HeadlessX
pnpm install
```

2. Create root `.env` from the full example:

```bash
cp .env.example .env
```

Current root `.env.example`:

```env
# ==============================================
# HEADLESSX V2.1.0 - LOCAL DEVELOPMENT
# ==============================================

# ------------------------------
# 1. DATABASE
# ------------------------------
DATABASE_URL="postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres"

# ------------------------------
# 2. SERVER
# ------------------------------
PORT=8000
HOST=0.0.0.0
NODE_ENV=development

# ------------------------------
# 2A. SECURITY (REQUIRED)
# ------------------------------
# Used by the Next.js dashboard server to authenticate against the API.
DASHBOARD_INTERNAL_API_KEY=replace-with-a-long-random-string

# Used to encrypt stored credentials at rest.
CREDENTIAL_ENCRYPTION_KEY=replace-with-a-different-long-random-string

# ------------------------------
# 3. QUEUE / REDIS
# ------------------------------
# BullMQ uses Redis to persist async scrape, extract, and index jobs.
REDIS_URL=redis://localhost:6379

# Search providers and local engines
TAVILY_API_KEY=
EXA_API_KEY=
YT_ENGINE_URL=http://localhost:8090
YT_ENGINE_PORT=8090
YT_ENGINE_TIMEOUT_MS=45000
YT_ENGINE_TEMP_DIR=./tmp/yt-engine
YT_ENGINE_JOB_TTL_HOURS=12
HTML_TO_MARKDOWN_SERVICE_URL=http://localhost:8081
HTML_TO_MARKDOWN_PORT=8081
HTML_TO_MARKDOWN_TIMEOUT_MS=60000

# Optional queue tuning
BULLMQ_QUEUE_NAME=headlessx-jobs
QUEUE_WORKER_CONCURRENCY=2
QUEUE_JOB_ATTEMPTS=3
QUEUE_JOB_BACKOFF_MS=5000
QUEUE_STREAM_POLL_MS=1000
QUEUE_CONNECTION_RETRY_MS=10000

# Browser and anti-detection settings are managed from the dashboard

# ------------------------------
# 4. FRONTEND (Next.js)
# ------------------------------
WEB_PORT=3000

NEXT_PUBLIC_API_URL=http://localhost:8000
INTERNAL_API_URL=http://localhost:8000

# CORS: Add your frontend URL for custom deployments
FRONTEND_URL=http://localhost:3000

# ------------------------------
# 5. DEFAULT RUNTIME SETTINGS
# ------------------------------
BROWSER_TIMEOUT=60000
MAX_CONCURRENCY=5
STEALTH_MODE=advanced
```

If you are using Docker instead of local services, start from the complete Docker env too:

```bash
cp infra/docker/.env.example infra/docker/.env
```

3. Prepare services:

```bash
pnpm db:push
pnpm camoufox:fetch
```

4. Start the workspace:

```bash
pnpm dev
```

This starts:

- web
- api
- worker
- HTML-to-Markdown service
- yt-engine

Important:

- `pnpm dev` does not provision PostgreSQL or Redis
- Website Crawl requires both Redis and the worker

## Docker

For the current Docker path:

```bash
cp infra/docker/.env.example infra/docker/.env
cd infra/docker
docker compose --profile all up --build -d
```

Important notes:

- use `--profile all`
- partial profile runs are not currently reliable because of `depends_on` relationships
- the core Docker stack does not yet define a `yt-engine` container, so YouTube may still need to run locally

See [docs/setup-guide.md](docs/setup-guide.md) for the full matrix:

- no-Docker setup
- mixed local setup
- full Docker setup
- MCP client configuration

## API Summary

All non-health backend routes are protected with `x-api-key`.

Core backend surfaces:

- `GET /api/health`
- `GET/PATCH /api/config`
- `GET /api/dashboard/stats`
- `GET /api/logs`
- `GET/POST/PATCH/DELETE /api/keys`
- proxy CRUD under `/api/proxies`
- website routes under `/api/website/*`
- Google SERP routes under `/api/google-serp/*`
- Tavily routes under `/api/tavily/*`
- Exa routes under `/api/exa/*`
- YouTube routes under `/api/youtube/*`
- queue job routes under `/api/jobs/*`
- remote MCP endpoint at `/mcp`

See the full route reference in [docs/api-endpoints.md](docs/api-endpoints.md).

## MCP

HeadlessX exposes a remote MCP endpoint from the API:

```text
http://localhost:8000/mcp
```

Use a normal API key created from the dashboard API Keys page.

Do not use `DASHBOARD_INTERNAL_API_KEY` for MCP clients.

Example client config:

```json
{
  "mcpServers": {
    "headlessx": {
      "transport": "http",
      "url": "http://localhost:8000/mcp",
      "headers": {
        "x-api-key": "hx_your_dashboard_created_key"
      }
    }
  }
}
```

## Monorepo Layout

```text
apps/
  api/                    Express API + worker + MCP
  web/                    Next.js dashboard
  yt-engine/              Python YouTube engine
  go-html-to-md-service/  Go HTML-to-Markdown sidecar
docs/
  setup-guide.md
  api-endpoints.md
infra/docker/
```

## Notes

- The dashboard uses the internal dashboard key for server-side internal requests
- MCP uses normal user-created API keys, not the dashboard internal key
- Queue-backed features return degraded/unavailable behavior when Redis is missing
- Docker support is available for the core stack, but yt-engine still needs separate Docker wiring

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the current contribution workflow, local setup expectations, pull request guidance, and commit message conventions.

## License

MIT
