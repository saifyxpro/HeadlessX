# Setup Guide

This document explains the three supported HeadlessX setup modes: `developer`, `self-host`, and `production`.

## Mode Summary

Use the CLI for all three modes:

1. `developer` for contributors who want the repo locally and only need Docker for infrastructure where it helps
2. `self-host` for a full local or VPS Docker stack on HeadlessX's rare default ports
3. `production` for the Docker app stack plus the Caddy/domain layer

HeadlessX intentionally defaults to uncommon localhost ports to avoid collisions with typical `3000` and `8000` stacks.

## System Requirements

### General host requirements

| Item | Minimum | Recommended |
| --- | --- | --- |
| OS | macOS, Linux, or Windows 11 with WSL2 | Ubuntu 22.04+/24.04, Debian 12, or Windows 11 with WSL2 |
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8-16 GB |
| Disk | 10 GB free | 20+ GB SSD |
| Network | outbound internet for installs and downloads | stable broadband |

### Tooling requirements by mode

| Mode | Required tools |
| --- | --- |
| Developer | Git, Docker, Node.js 22+, pnpm 10.32.1+, Python/uv, Go |
| Self-host | Git, Docker, Docker Compose v2 |
| Production | Linux server recommended, Git, Docker, Docker Compose v2, DNS control for your domains |

### Practical sizing guidance

- Developer mode is comfortable at 8 GB RAM
- Self-host Docker on a local machine or VPS is better at 8 GB minimum
- Production is safer at 8 GB minimum and 16 GB recommended if you expect crawl-heavy or browser-heavy workloads
- Open ports `80` and `443` for production domain setup with Caddy

If you need to align your local pnpm version with the repo:

```bash
corepack enable
corepack use pnpm@10.32.1
```

## CLI Setup

Install the published HeadlessX CLI if you want terminal access to the same API surface:

With npm:

```bash
npm install -g @headlessx-cli/core
```

With pnpm:

```bash
pnpm add -g @headlessx-cli/core
```

Then log in:

```bash
headlessx login
```

The published CLI now uses guided modern prompts for `headlessx init` and `headlessx login` when your terminal is interactive.

Or set credentials directly:

```bash
headlessx login --api-url http://localhost:38473 --api-key hx_your_dashboard_created_key
```

Important:

- command name is `headlessx`
- package name is `@headlessx-cli/core`
- the CLI talks to the same backend API used by the web app

Bootstrap the local workspace with the CLI:

```bash
headlessx init
```

Useful variants:

```bash
headlessx init --mode self-host
headlessx init --mode production --api-domain api.example.com --web-domain dashboard.example.com --caddy-email ops@example.com
headlessx init update
headlessx init update --branch develop
headlessx start
headlessx logs
headlessx status
headlessx stop
headlessx restart
headlessx doctor
```

The CLI uses `~/.headlessx` as the default workspace root.

- cloned repo: `~/.headlessx/repo`
- self-host env: `~/.headlessx/repo/infra/docker/.env`
- production env: `~/.headlessx/repo/infra/domain-setup/.env`
- production Caddy config: `~/.headlessx/repo/infra/domain-setup/Caddyfile`
- after `headlessx init` or `headlessx start`, run `headlessx status` and `headlessx doctor`
- use `headlessx stop` to tear down the Docker stack started by the CLI

To update an existing CLI-managed install:

```bash
headlessx init update
headlessx restart
headlessx logs --tail 200 --no-follow
headlessx logs caddy --tail 100 --no-follow
headlessx status
headlessx doctor
```

`headlessx init update` keeps the saved mode, reconciles missing env keys for that mode, updates `~/.headlessx/repo`, and pulls `main` by default unless you pass `--branch`.
For `self-host` and `production`, `headlessx restart` rebuilds Docker images before starting the stack again.

Important:

- update now resyncs missing env keys for the saved mode instead of leaving older workspaces partially configured
- that includes values such as `YT_ENGINE_URL`, `INTERNAL_API_URL`, and `DASHBOARD_INTERNAL_API_KEY`

## Google AI Search Cookie Bootstrap

Google AI Search now uses the shared persistent browser profile managed by the API.

The first time you use the Google operator:

1. Open `/playground/operators/google/ai-search`
2. Click `Build Cookies`
3. If a real display is available, Headfox JS opens there. Otherwise the API starts a virtual display.
4. Browse Google normally and solve any Google or reCAPTCHA prompt once.
5. Click `Stop Browser` to save the updated shared profile.

What gets persisted:

- Docker and VPS installs keep the shared profile inside the `browser_profile` volume
- local repo runs keep it under `apps/api/data/browser-profile/default`
- there is no longer a seeded browser profile under `apps/api/default-data/browser-profile`

Until the cookie bootstrap has been completed once:

- the Google config panel stays locked
- the Google results panel stays locked
- Google search endpoints return a setup error instead of a fake scrape failure

## AI Models Setup

The API CAPTCHA solver needs local model files under [apps/api/models](/home/saifyxpro/CODE/Crawl/HeadlessX/apps/api/models).

If you see errors like:

- `recaptcha_classification_57k.onnx` missing
- `yolo26x.onnx` or `yolo26x.pt` missing

download the models before starting the API.

With pnpm:

```bash
pnpm run models:download
```

With mise:

```bash
mise run models
```

Direct script:

```bash
python3 scripts/download_models.py
```

This downloads the required CAPTCHA models into:

```text
apps/api/models
```

Run this once after cloning, or again if the models directory is empty.

## No Docker Setup

You can run HeadlessX without Docker.

But you must install and run these infrastructure services yourself on your OS:

- PostgreSQL
- Redis

Install them first:

- PostgreSQL: [Official PostgreSQL downloads and installers](https://www.postgresql.org/download/)
- Redis: [Official Redis install guide](https://redis.io/docs/latest/operate/oss_and_stack/install/install-stack/)

Then configure your root `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:35432/headlessx?schema=public
REDIS_URL=redis://localhost:36379
HTML_TO_MARKDOWN_SERVICE_URL=http://localhost:38081
YT_ENGINE_URL=http://localhost:38090
```

`YT_ENGINE_URL` is required to activate the YouTube workspace.

Then start the workspace:

```bash
pnpm dev
```

Or:

```bash
mise run dev
```

Important:

- `pnpm dev` starts the API, worker, web, HTML-to-Markdown service, and yt-engine
- `pnpm` does not install or start PostgreSQL or Redis for you
- Website Crawl still requires Redis because it is queue-backed
- YouTube stays disabled until `YT_ENGINE_URL` points at a healthy `yt-engine` service
- if you do not want Docker, local PostgreSQL and local Redis must already be installed and running

## Mixed Local Setup

This is the best development setup for most users.

Use:

- PostgreSQL: Supabase or Docker
- Redis: Docker
- App runtime: `pnpm dev` or `mise run dev`

This avoids local Redis installation while still keeping the app runtime fast and simple.

## MCP Access

HeadlessX now exposes a remote MCP endpoint from the backend:

```text
http://localhost:38473/mcp
```

Use a normal API key created from the dashboard `API Keys` page.

Do not use `DASHBOARD_INTERNAL_API_KEY` for MCP clients.

Example JSON client config:

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

Example TOML client config:

```toml
[mcp_servers.headlessx]
transport = "http"
url = "http://localhost:38473/mcp"

[mcp_servers.headlessx.headers]
x-api-key = "hx_your_dashboard_created_key"
```

## What Redis Is Used For

Redis is required for async queue jobs through BullMQ.

That means Website Crawl needs Redis.

Website Crawl also needs the queue worker, not just the API.

If Redis is down or `REDIS_URL` is missing:

- `/api/operators/website/crawl` will not work
- queue-backed jobs will fail

## Runtime Modes

### 1. Supabase PostgreSQL + Redis in Docker + App Locally

This is the recommended local development setup.

Use this when:

- you want Supabase for Postgres
- you do not want to install Redis locally
- you want to run the app with `pnpm`, `nx`, or `mise`

Required:

- root `.env` configured with your Supabase `DATABASE_URL`
- `REDIS_URL=redis://localhost:36379`

Start Redis with Docker:

```bash
docker run -d \
  --name headlessx-redis \
  -p 36379:6379 \
  redis:7-alpine
```

Then run the workspace:

```bash
pnpm install
pnpm dev
```

Or:

```bash
mise run dev
```

This starts:

- API
- queue worker
- web
- HTML-to-Markdown service
- yt-engine

This mode is the cleanest dev setup right now.

### 2. PostgreSQL + Redis in Docker + App Locally

Use this when:

- you want local containers for infrastructure
- you still want `pnpm` or `mise` for the app itself

Start PostgreSQL:

```bash
docker run -d \
  --name headlessx-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=headlessx \
  -p 35432:5432 \
  postgres:15-alpine
```

Start Redis:

```bash
docker run -d \
  --name headlessx-redis \
  -p 36379:6379 \
  redis:7-alpine
```

Then set your root `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:35432/headlessx?schema=public
REDIS_URL=redis://localhost:36379
HTML_TO_MARKDOWN_SERVICE_URL=http://localhost:38081
YT_ENGINE_URL=http://localhost:38090
```

Run the workspace:

```bash
pnpm dev
```

Or:

```bash
mise run dev
```

Important:

- if you only run API and web manually, crawl still will not work unless the worker is also running
- the simplest local command is still `pnpm dev` because it starts everything needed

If you want to start services manually instead of `pnpm dev`, you need all of these:

```bash
pnpm --filter headlessx-api dev
pnpm --filter headlessx-api worker:dev
pnpm --filter headlessx-web dev
pnpm markdown:dev
pnpm yt-engine:dev
```

### 3. Docker for the Core Stack

This is the recommended operational direction for the workspace because it keeps infrastructure and runtime consistent.

Current compose file covers:

- postgres
- redis
- html-to-md
- yt-engine
- api
- worker
- web

Use the Docker env file:

```bash
cp infra/docker/.env.example infra/docker/.env
```

Fill in at least:

- `DASHBOARD_INTERNAL_API_KEY`
- `CREDENTIAL_ENCRYPTION_KEY`

Then run:

```bash
cd infra/docker
docker compose --profile all up --build -d
```

Important note:

- use `--profile all`
- the current compose file is profile-gated in a way that makes partial profile runs like `--profile api` or `--profile queue` invalid because of `depends_on` relationships

The Docker stack now includes `yt-engine`, so `docker compose --profile all up --build -d` starts the full app runtime, including YouTube support.

## Ports

Default ports in this repo:

| Service | Default |
| --- | --- |
| Web | `34872` |
| API | `38473` |
| PostgreSQL | `35432` |
| Redis | `36379` |
| HTML-to-Markdown host port | `38081` |
| HTML-to-Markdown container port | `8080` |
| yt-engine | `38090` |

## Environment Files

Use the files this way:

- root `.env`: main local runtime settings for `pnpm`, `nx`, and `mise`
- `infra/docker/.env`: Docker Compose settings
- `apps/web/.env.local`: web-only local overrides if needed
- `apps/api/.env.local`: api-only local overrides if needed

If you are doing normal local development, keep the main source of truth in root `.env`.

## Website Crawl Checklist

If Website Crawl is not working, verify these in order:

1. `REDIS_URL` is set correctly
2. Redis is actually reachable
3. the queue worker is running
4. the API is running
5. the database is running

Local check:

```bash
docker ps
```

Expected for crawl support:

- Postgres available
- Redis available
- API running
- worker running

If you are using `pnpm dev` or `mise run dev`, the worker is started automatically. If you start processes manually, you must start the worker yourself.

## Short Recommendation Matrix

Use this if you want the quick answer:

- Supabase + local app: run Redis in Docker
- Docker Postgres + Docker Redis + local app: valid and clean
- Full local with no Docker: install PostgreSQL and Redis locally on your OS first
- Full Docker: fully supported for the app runtime, including yt-engine
