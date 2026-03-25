<div align="center">

![HeadlessX Logo](assets/logo-hr.svg)

### Self-hosted operators for website extraction, search, and agent workflows powered by Headfox JS and Camoufox

[![Version](https://img.shields.io/badge/Version-v2.1.1-blue?style=for-the-badge)](docs/setup-guide.md)
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

Current live operator surfaces:

- Website operator: scrape, crawl, map, content extraction, screenshots
- Google AI Search
- Tavily
- Exa
- YouTube
- Queue jobs, logs, API keys, proxy management, and config management
- Remote MCP over `/mcp`

Important operator setup notes:

- Google AI Search requires a one-time `Build Cookies` run in the dashboard before the first search
- the saved Google session is kept in the shared persistent browser profile and reused later
- the YouTube workspace is active only when `YT_ENGINE_URL` points at a healthy `yt-engine` service

## What Changed In v2.1.1

- Added the published HeadlessX CLI bootstrap flow with `headlessx init`, `start`, `logs`, `stop`, `restart`, `status`, and `doctor`
- Upgraded the CLI prompt UX with guided modern setup and login prompts
- Added Docker plus Caddy production domain scaffolding under `infra/domain-setup`
- Moved local and Docker host defaults to rarer ports to avoid conflicts with common `3000` and `8000` stacks
- Refreshed setup, CLI, and self-hosting docs around the current operator-first platform layout

## Sponsors

<details open>
<summary>View</summary>

<table>
  <tr>
    <td width="220" align="center" valign="middle">
      <a href="https://birdproxies.com/t/headlessx">
        <img src="assets/bird-proxy.png" alt="BirdProxies banner" width="200" />
      </a>
    </td>
    <td valign="top">
      Hey, we built <a href="https://birdproxies.com/t/headlessx">BirdProxies</a> because proxies shouldn't be complicated or overpriced. Fast residential and ISP proxies in 195+ locations, fair pricing, and real support. Try our FlappyBird game on the landing page for free data!
      <br />
      <a href="https://birdproxies.com/t/headlessx"><strong>Try BirdProxies now</strong></a> &nbsp;|&nbsp; <a href="https://discord.com/invite/birdproxies"><strong>Join the Discord</strong></a>
    </td>
  </tr>
</table>

</details>

## Operators

<div align="center">

![HeadlessX Live Operators](assets/live_scrapers.png)

</div>

### Coming Soon

| Operator | Description | Status |
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

## Agent Surfaces Coming Soon

| Surface | Description | Status |
| --- | --- | --- |
| Web AI Agent (`/web`) | Interactive AI agent workspace inside the dashboard that can use all HeadlessX operators and related workflow actions, including Website, Google AI Search, Tavily, Exa, and YouTube. | Planned |

## Agent Skills

You can add the HeadlessX CLI skill to AI coding agents such as Cursor, Claude Code, Warp, Windsurf, OpenCode, OpenClaw, Antigravity, and similar tools that support the `skills` installer flow.

```bash
npx skills add https://github.com/saifyxpro/HeadlessX --skill cli
```

This installs the HeadlessX CLI skill from this repository so the agent can use the published `headlessx` command and follow the packaged usage guidance.

## UI Screenshots

### Google AI Search (Recently Tested with Arabic Lang & Region)
![Google AI Search UI](assets/google-serp-results.png)

### Website
![Website UI](assets/web-scrape-results.png)

## Proof

### BrowserScan
![BrowserScan](assets/Browserscan_Bot_Detection_Passed.png)

<details>
<summary>Cloudflare Challenge</summary>

![Cloudflare Challenge](assets/cloudfare.png)

</details>

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

### System Requirements

| Item | Minimum | Recommended |
| --- | --- | --- |
| OS | macOS, Linux, or Windows 11 with WSL2 | Ubuntu 22.04+/24.04, Debian 12, or Windows 11 with WSL2 |
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8-16 GB |
| Disk | 10 GB free | 20+ GB SSD |
| Network | outbound internet for installs, browser downloads, and APIs | stable broadband |

### Runtime Dependencies

- Node.js 22+
- pnpm 10.32.1+
- Git
- Docker + Compose v2 for self-host or production mode
- PostgreSQL
- Redis
- Python/uv for `yt-engine`
- Go for the HTML-to-Markdown sidecar

If your machine does not already use the pinned pnpm release, align it with:

```bash
corepack enable
corepack use pnpm@10.32.1
```

### Practical Sizing Notes

- 4 GB RAM is enough for light local testing
- 8 GB RAM is the better baseline for the web, API, worker, Redis, and browser runtime together
- 16 GB RAM is safer for heavier crawl jobs, YouTube flows, or multiple concurrent browser tasks

### CLI Bootstrap

HeadlessX is now CLI-first for installation and local lifecycle management.

```bash
npm install -g @headlessx-cli/core
headlessx init
headlessx status
headlessx doctor
```

The CLI bootstraps HeadlessX into `~/.headlessx` by default and supports three setup modes:

- `developer`: clone the repo, keep app services local, and use Docker only where needed for infrastructure
- `self-host`: run the full HeadlessX stack on rare localhost ports with Docker
- `production`: run the Docker app stack plus the Caddy/domain layer for `dashboard.yourdomain.com` and `api.yourdomain.com`

Useful examples:

```bash
headlessx init --mode developer
headlessx init --mode self-host
headlessx init --mode production --api-domain api.example.com --web-domain dashboard.example.com --caddy-email ops@example.com
headlessx init update
headlessx init update --branch develop
headlessx start
headlessx logs
headlessx restart
headlessx stop
```

For existing VPS or Docker installs, use `headlessx init update` to pull the latest repo state into `~/.headlessx/repo`, reconcile missing env keys for the saved mode, then run `headlessx restart`.
For `self-host` and `production`, `headlessx restart` rebuilds Docker images before bringing the stack back up.

HeadlessX intentionally uses uncommon localhost defaults to avoid conflicts with other tools:
`web=34872`, `api=38473`, `postgres=35432`, `redis=36379`, `html-to-md=38081`, `yt-engine=38090`.

For deeper setup details, direct repo development, env files, Docker internals, and MCP/client notes, see [docs/setup-guide.md](docs/setup-guide.md).

### Google AI Search First Run

The first Google AI Search run now uses a shared persistent browser profile instead of a seeded browser profile committed into the repo.

1. Open `/playground/operators/google/ai-search`
2. Click `Build Cookies`
3. Let the shared browser open Google
4. Browse normally and solve any Google or reCAPTCHA prompt once
5. Click `Stop Browser` to save the profile

After that, the saved shared profile is reused for later Google searches.

- Docker and VPS installs persist it in the `browser_profile` volume
- local repo runs persist it under `apps/api/data/browser-profile/default`
- the old tracked `apps/api/default-data/browser-profile` bundle has been removed

### YouTube Workspace

The YouTube operator is live only when `YT_ENGINE_URL` is configured.

- CLI `self-host` and `production` init flows write it automatically
- custom local setups must point `YT_ENGINE_URL` at a reachable `yt-engine` instance

## API Summary

All non-health backend routes are protected with `x-api-key`.

Core backend surfaces:

- `GET /api/health`
- `GET/PATCH /api/config`
- `GET /api/dashboard/stats`
- `GET /api/logs`
- `GET/POST/PATCH/DELETE /api/keys`
- proxy CRUD under `/api/proxies`
- website operator routes under `/api/operators/website/*`
- Google AI Search routes under `/api/operators/google/ai-search/*`
- Tavily routes under `/api/operators/tavily/*`
- Exa routes under `/api/operators/exa/*`
- YouTube routes under `/api/operators/youtube/*`
- queue job routes under `/api/jobs/*`
- remote MCP endpoint at `/mcp`

See the full route reference in [docs/api-endpoints.md](docs/api-endpoints.md).

## MCP

HeadlessX exposes a remote MCP endpoint from the API:

```text
http://localhost:38473/mcp
```

Use a normal API key created from the dashboard API Keys page.

Do not use `DASHBOARD_INTERNAL_API_KEY` for MCP clients.

Example client config:

```json
{
  "mcpServers": {
    "headlessx": {
      "transport": "http",
      "url": "http://localhost:38473/mcp",
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

## Packages

| Package | Description | Status |
| --- | --- | --- |
| @headlessx-cli/core | Published CLI package for HeadlessX operators, jobs, and search workflows. Command: `headlessx` | Available |
| HeadlessX Agent Skills | Installable agent skill pack from this repository for Cursor, Claude Code, Warp, Windsurf, OpenCode, OpenClaw, Antigravity, and similar tools. | Available |

### Available

| Package | Description | Status |
| --- | --- | --- |
| headfox-js | Published TypeScript launcher and Playwright helper for Headfox, currently powered by Camoufox-compatible browser bundles. | Available |

### Coming Soon

| Package | Description | Status |
| --- | --- | --- |
| headfox | HeadlessX-maintained Firefox-based anti-detect browser engine that will power the platform's next-generation browser runtime. | Planned |

## Notes

- The dashboard uses the internal dashboard key for server-side internal requests
- MCP uses normal user-created API keys, not the dashboard internal key
- Queue-backed features return degraded/unavailable behavior when Redis is missing
- Docker support now covers the full runtime stack, including yt-engine

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the current contribution workflow, local setup expectations, pull request guidance, and commit message conventions.

## License

MIT
