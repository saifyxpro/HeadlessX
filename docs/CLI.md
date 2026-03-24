# CLI

This document describes the `@headlessx-cli/core` package and its `headlessx` command for HeadlessX.

`headlessx` is both:

- a lifecycle bootstrap CLI for local HeadlessX installs
- an API/operator terminal client for a running HeadlessX backend

The operator side covers:

- website scraping
- site mapping
- queue-backed crawling
- Google AI Search
- Tavily
- Exa
- YouTube
- job inspection
- operator status

It does not handle MCP setup or editor skill installation.

## Current Version

- package: `@headlessx-cli/core`
- version: `0.1.22`
- primary command: `headlessx`

## Installation

### Install

With npm:

```bash
npm install -g @headlessx-cli/core
headlessx --help
```

With pnpm:

```bash
pnpm add -g @headlessx-cli/core
headlessx --help
```

### CLI Requirements

- macOS, Linux, or Windows 11 with WSL2
- Node.js 18+ for the published CLI itself
- Git for `headlessx init`
- Docker for `self-host` and `production` modes
- Node.js 22+ and pnpm 10.32.1+ if you use `developer` mode, because the cloned HeadlessX repo uses those versions

If you need the repo-pinned pnpm release:

```bash
corepack enable
corepack use pnpm@10.32.1
```

## Lifecycle Bootstrap

The primary onboarding flow is:

```bash
headlessx init
```

Default behavior:

- installs into `~/.headlessx`
- prefers branch `main`
- uses `.env` files only
- keeps the existing operator/API commands intact
- uses guided modern prompts for setup and login when the terminal is interactive

Useful examples:

```bash
headlessx init
headlessx init --mode self-host
headlessx init --mode production --api-domain api.example.com --web-domain dashboard.example.com --caddy-email ops@example.com
headlessx init update
headlessx init update --branch develop
headlessx init --branch develop
headlessx start
headlessx logs
headlessx status
headlessx stop
headlessx restart
headlessx doctor
```

## Workspace Layout

By default, the bootstrap flow uses:

- workspace root: `~/.headlessx`
- cloned repo: `~/.headlessx/repo`
- runtime metadata directory: `~/.headlessx/runtime/`
- last start state: `~/.headlessx/runtime/last-start.json`
- self-host env: `~/.headlessx/repo/infra/docker/.env`
- production env: `~/.headlessx/repo/infra/domain-setup/.env`
- production Caddy config: `~/.headlessx/repo/infra/domain-setup/Caddyfile`

Recommended verification after `headlessx init` or `headlessx start`:

```bash
headlessx status
headlessx doctor
```

Use `headlessx stop` to tear down the Docker stack started by the lifecycle commands.

## Updating An Existing Workspace

Use:

```bash
headlessx init update
```

Default behavior:

- reuses the saved setup mode
- updates the repo under `~/.headlessx/repo`
- pulls `main` by default
- uses `--branch <name>` only when you explicitly want another branch
- keeps the existing env files and generated domain config in place

Recommended update flow:

```bash
headlessx init update
headlessx restart
headlessx logs --tail 200 --no-follow
headlessx status
headlessx doctor
```

For `self-host` and `production`, `headlessx restart` rebuilds Docker images before bringing the stack back up.

## Authentication

The `headlessx` command uses HeadlessX API keys only.

Supported config sources, highest priority first:

1. command flags
2. environment variables
3. stored local credentials
4. default API URL

Environment variables:

```bash
export HX_API_KEY=your_headlessx_api_key
export HX_API_URL=http://localhost:38473
```

Alternative variable names also work:

```bash
export HEADLESSX_API_KEY=your_headlessx_api_key
export HEADLESSX_API_URL=http://localhost:38473
```

Store credentials locally:

```bash
headlessx login --api-key your_headlessx_api_key --api-url http://localhost:38473
```

Prompt only for the missing field:

```bash
headlessx login --api-key your_headlessx_api_key
headlessx login --api-url http://localhost:38473
```

Interactive login:

```bash
headlessx login
```

`headlessx login` now uses a guided prompt flow with masked API key entry.

Show current config:

```bash
headlessx config
headlessx config view
```

Update stored config:

```bash
headlessx config set --api-url http://localhost:38473
headlessx config set --api-key your_headlessx_api_key
```

Clear local credentials:

```bash
headlessx logout
```

## Global Flags

| Option | Description |
| --- | --- |
| `-k, --api-key <key>` | Override the HeadlessX API key |
| `--api-url <url>` | Override the HeadlessX API URL |
| `-V, --version` | Print the CLI version |
| `-h, --help` | Show help |

## Core Commands

For local development, `--api-url` overrides the stored or environment URL:

```bash
headlessx --api-url http://localhost:38473 status
headlessx --api-url http://127.0.0.1:38473 google "latest ai news"
```

### Status

```bash
headlessx status
headlessx status --json --pretty
headlessx -o status.json --json --pretty status
```

`status` now includes:

- CLI package version
- auth state and runtime targets
- backend health, reachability, and operator integrations
- local `~/.headlessx` runtime state when the bootstrap workspace exists

### Doctor

```bash
headlessx doctor
headlessx doctor --json --pretty
headlessx doctor -o doctor.json --json --pretty
```

`doctor` checks:

- Git, Docker, Node.js, and pnpm, with pnpm treated as optional outside `developer` mode
- bootstrap env files
- model file presence
- local API and web reachability with loopback fallback for `localhost`

### Logs

```bash
headlessx logs
headlessx logs api
headlessx logs web --tail 100 --no-follow
headlessx logs caddy --tail 100 --no-follow
```

`logs` tails the saved runtime:

- `developer`: the detached `pnpm dev` log file under `~/.headlessx/logs`
- `self-host`: Docker Compose logs from `~/.headlessx/repo/infra/docker`
- `production`: the active Docker Compose logs from the initialized workspace, including `headlessx logs caddy` for the domain proxy

### Config

```bash
headlessx config
headlessx config view
headlessx config set --api-url http://localhost:38473
headlessx config set --api-key your_headlessx_api_key
```

## Website Commands

### Scrape

```bash
headlessx scrape https://example.com
headlessx scrape https://example.com --type html
headlessx scrape https://example.com --type html-js
headlessx scrape https://example.com --type content -o page.md
headlessx scrape https://example.com --type screenshot --output screenshot.jpg
headlessx scrape https://example.com --type html-js --stealth on
```

Supported scrape types:

- `content`
- `html`
- `html-js`
- `screenshot`

### Map

```bash
headlessx map https://example.com --limit 100
headlessx map https://example.com --include-subdomains
headlessx map https://example.com --include-paths /docs,/blog
headlessx map https://example.com --exclude-paths /login,/admin
```

### Crawl

```bash
headlessx crawl https://example.com --limit 50
headlessx crawl https://example.com --wait --poll-interval 5
headlessx crawl https://example.com --max-depth 2 --include-subdomains
```

Note:

- `/api/operators/website/crawl` is the only website route that requires Redis and the worker
- other website routes do not require Redis

## Google AI Search

```bash
headlessx google "headless browser anti detect"
headlessx google "latest ai news" --gl pk --hl ur
headlessx google "ai funding" --gl us --hl en --tbs qdr:d
headlessx google "ai funding" --gl us --hl en --tbs qdr:d --stealth off
```

Supported fields:

- `query`
- `gl`
- `hl`
- `tbs`
- `stealth`

## Tavily

```bash
headlessx tavily search "headless browser research" --max-results 10
headlessx tavily search "anti bot trends" --topic news --search-depth advanced
headlessx tavily research "compare exa and tavily" --model pro
headlessx tavily result req_123
headlessx tavily status
```

## Exa

```bash
headlessx exa search "firefox anti detect browser" --type deep --num-results 10
headlessx exa search "browser fingerprinting" --content-mode text
headlessx exa status
```

## YouTube

```bash
headlessx youtube info https://www.youtube.com/watch?v=VIDEO_ID
headlessx youtube formats https://www.youtube.com/watch?v=VIDEO_ID
headlessx youtube subtitles https://www.youtube.com/watch?v=VIDEO_ID
headlessx youtube save https://www.youtube.com/watch?v=VIDEO_ID --quality-preset 720p
headlessx youtube status
```

## Jobs

```bash
headlessx jobs list --type crawl --status active
headlessx jobs get JOB_ID
headlessx jobs active
headlessx jobs metrics
headlessx jobs cancel JOB_ID
headlessx jobs watch JOB_ID --interval 5
```

## Operators

```bash
headlessx operators list
headlessx operators check
headlessx operators check --json --pretty
```

## Output

`headlessx` is LLM-friendly by default.

- default output is compact markdown/text instead of JSON
- `--json` forces JSON output
- `--pretty` pretty-prints JSON when `--json` is used
- `-o, --output <path>` writes output to a file
- `-o result.json` writes JSON automatically based on the file extension
- `scrape --type screenshot` requires `--output`

Examples:

```bash
headlessx google "latest ai news"
headlessx google "latest ai news" --json --pretty
headlessx exa search "playwright firefox patches" -o exa.json --pretty
headlessx tavily search "distributed crawlers" -o tavily.json --pretty
headlessx scrape https://example.com --type content -o content.md
```

## Publishing

From the package directory:

```bash
cd /home/saifyxpro/CODE/Crawl/HeadlessX/packages/cli
npm login
pnpm type-check
pnpm build
npm publish --access public
```

## Apt And Snap

`apt` and `snap` are separate packaging systems from npm.

To publish through `apt`, you need:

1. a `.deb` package build
2. an APT repository
3. install docs such as `sudo apt install headlessx`

To publish through `snap`, you need:

1. a `snapcraft.yaml`
2. a Snap Store release flow
3. install docs such as `sudo snap install headlessx`

## Backend Routes Covered

This package currently targets:

- `/api/health`
- `/api/operators/status`
- `/api/operators/website/*`
- `/api/operators/google/ai-search/*`
- `/api/operators/tavily/*`
- `/api/operators/exa/*`
- `/api/operators/youtube/*`
- `/api/jobs/*`
