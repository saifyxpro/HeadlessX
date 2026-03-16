# Setup Guide

This document explains how to run HeadlessX with Docker, without Docker, or with a mixed setup.

## Recommendation

Recommended order:

1. Docker for infrastructure plus local app runtime for development
2. Full Docker for the core stack when you want repeatable services
3. Fully local only if you already manage PostgreSQL and Redis yourself

For most developers, the best path is:

- PostgreSQL: Supabase or Docker
- Redis: Docker
- App runtime: `pnpm dev` or `mise run dev`

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
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/headlessx?schema=public
REDIS_URL=redis://localhost:6379
HTML_TO_MARKDOWN_SERVICE_URL=http://localhost:8081
YT_ENGINE_URL=http://localhost:8090
```

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
- if you do not want Docker, local PostgreSQL and local Redis must already be installed and running

## Mixed Local Setup

This is the best development setup for most users.

Use:

- PostgreSQL: Supabase or Docker
- Redis: Docker
- App runtime: `pnpm dev` or `mise run dev`

This avoids local Redis installation while still keeping the app runtime fast and simple.

## What Redis Is Used For

Redis is required for async queue jobs through BullMQ.

That means Website Crawl needs Redis.

Website Crawl also needs the queue worker, not just the API.

If Redis is down or `REDIS_URL` is missing:

- `/api/website/crawl` will not work
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
- `REDIS_URL=redis://localhost:6379`

Start Redis with Docker:

```bash
docker run -d \
  --name headlessx-redis \
  -p 6379:6379 \
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
  -p 5432:5432 \
  postgres:15-alpine
```

Start Redis:

```bash
docker run -d \
  --name headlessx-redis \
  -p 6379:6379 \
  redis:7-alpine
```

Then set your root `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/headlessx?schema=public
REDIS_URL=redis://localhost:6379
HTML_TO_MARKDOWN_SERVICE_URL=http://localhost:8081
YT_ENGINE_URL=http://localhost:8090
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

## Current Docker Caveat

The Docker env example includes:

```env
YT_ENGINE_URL=http://yt-engine:8090
```

But the current `infra/docker/docker-compose.yml` does not define a `yt-engine` service yet.

So today:

- the core Docker stack is available
- YouTube engine containerization is not fully wired into compose yet

If you need YouTube features right now while using Docker for the rest of the stack, run yt-engine locally:

```bash
pnpm yt-engine:dev
```

And point the API to it:

```env
YT_ENGINE_URL=http://host.docker.internal:8090
```

Use that value in Docker contexts where the API container must reach a host-local yt-engine.

## Ports

Default ports in this repo:

| Service | Default |
| --- | --- |
| Web | `3000` |
| API | `8000` |
| PostgreSQL | `5432` |
| Redis | `6379` |
| HTML-to-Markdown host port | `8081` |
| HTML-to-Markdown container port | `8080` |
| yt-engine | `8090` |

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
- Full Docker: recommended direction for consistency, but yt-engine still needs separate Docker wiring today
