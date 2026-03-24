# @headlessx-cli/core

`@headlessx-cli/core` provides the `headlessx` command-line client for HeadlessX.

It covers two layers:

- lifecycle bootstrap for local HeadlessX installs
- direct operator/API commands against a running HeadlessX backend
- runtime log inspection for initialized HeadlessX workspaces

The operator layer wraps the current HeadlessX backend routes for:

- website scraping
- site mapping
- queue-backed crawling
- Google AI Search
- Tavily
- Exa
- YouTube
- job inspection

This package does not implement MCP setup, editor skill installation, or Firecrawl cloud-browser flows.

## Version

Current package version:

- `0.1.22`

## Workspace Fit

`@headlessx-cli/core` is designed to live inside the HeadlessX pnpm workspace.

- package manager: `pnpm`
- binary name: `headlessx`
- package name: `@headlessx-cli/core`

## Install

Published package:

```bash
npm install -g @headlessx-cli/core
headlessx --help
```

Requirements:

- macOS, Linux, or Windows 11 with WSL2
- Node.js 18+ for the published CLI
- Git for `headlessx init`
- Docker for `self-host` and `production`
- Node.js 22+ and pnpm 10.32.1+ if you plan to use `developer` mode

To align your machine with the repo-pinned pnpm release:

```bash
corepack enable
corepack use pnpm@10.32.1
```

Inside the monorepo:

```bash
pnpm --dir /home/saifyxpro/CODE/Crawl/HeadlessX --filter @headlessx-cli/core build
node /home/saifyxpro/CODE/Crawl/HeadlessX/packages/cli/dist/index.js --help
```

## Lifecycle Bootstrap

The default install flow is:

```bash
headlessx init
```

Useful examples:

```bash
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

Default workspace layout:

- workspace root: `~/.headlessx`
- cloned repo: `~/.headlessx/repo`
- self-host env: `~/.headlessx/repo/infra/docker/.env`
- production env: `~/.headlessx/repo/infra/domain-setup/.env`
- production Caddy config: `~/.headlessx/repo/infra/domain-setup/Caddyfile`

After `headlessx init` or `headlessx start`, verify the install with:

```bash
headlessx status
headlessx doctor
```

Update an existing CLI-managed workspace with:

```bash
headlessx init update
headlessx restart
headlessx logs --tail 200 --no-follow
headlessx logs caddy --tail 100 --no-follow
```

`headlessx init update` reuses the saved mode, keeps the current env/config files, and pulls `main` by default unless `--branch` is provided.
For `self-host` and `production`, `headlessx restart` rebuilds Docker images before starting the stack again.

## Authentication

The `headlessx` command uses HeadlessX API keys only.

Supported config sources:

1. command flags
2. environment variables
3. stored local credentials
4. default API URL

Environment variables:

```bash
export HX_API_KEY=your-headlessx-key
export HX_API_URL=http://localhost:38473
```

Alternative variable names also work:

```bash
export HEADLESSX_API_KEY=your-headlessx-key
export HEADLESSX_API_URL=http://localhost:38473
```

Or store them locally:

```bash
headlessx login --api-key your-headlessx-key --api-url http://localhost:38473
```

If you already have the key and only need to set the local development URL:

```bash
headlessx login --api-key your-headlessx-key
```

If you already know the API URL and want the CLI to prompt only for the key:

```bash
headlessx login --api-url http://localhost:38473
```

Or let the CLI prompt for both values:

```bash
headlessx login
```

The published CLI now uses guided modern prompts for `headlessx init` and `headlessx login` when the terminal is interactive.

View current config:

```bash
headlessx config
headlessx config view
```

Clear local credentials:

```bash
headlessx logout
```

## Operator Commands

### Core

```bash
headlessx status
headlessx doctor
headlessx --version
headlessx config
headlessx init
headlessx start
headlessx logs
headlessx stop
headlessx restart
headlessx login
headlessx logout
```

### Website

```bash
headlessx scrape https://example.com
headlessx scrape https://example.com --type html
headlessx scrape https://example.com --type html-js
headlessx scrape https://example.com --type screenshot --output screenshot.jpg

headlessx map https://example.com --limit 100 --pretty
headlessx crawl https://example.com --limit 50
headlessx crawl https://example.com --wait --poll-interval 5
```

### Google AI Search

```bash
headlessx google "headless browser anti detect"
headlessx google "latest ai news" --gl pk --hl ur
headlessx google "ai funding" --gl us --hl en --tbs qdr:d
headlessx google "ai funding" --gl us --hl en --tbs qdr:d --stealth off
```

### Tavily

```bash
headlessx tavily search "headless browser research" --max-results 10
headlessx tavily research "compare exa and tavily" --model pro
headlessx tavily result req_123
headlessx tavily status
```

### Exa

```bash
headlessx exa search "firefox anti detect browser" --type deep --num-results 10
headlessx exa status
```

### YouTube

```bash
headlessx youtube info https://www.youtube.com/watch?v=VIDEO_ID
headlessx youtube formats https://www.youtube.com/watch?v=VIDEO_ID
headlessx youtube subtitles https://www.youtube.com/watch?v=VIDEO_ID
headlessx youtube save https://www.youtube.com/watch?v=VIDEO_ID --quality-preset 720p
headlessx youtube status
```

### Jobs

```bash
headlessx jobs list --type crawl --status active
headlessx jobs get JOB_ID
headlessx jobs active
headlessx jobs metrics
headlessx jobs cancel JOB_ID
headlessx jobs watch JOB_ID --interval 5
```

### Operators

```bash
headlessx operators list --pretty
headlessx operators check
headlessx operators check --json --pretty
```

## Output

The CLI is LLM-friendly by default.

- default output is compact markdown/text instead of JSON
- `--json` forces JSON output
- `--pretty` pretty-prints JSON when `--json` is used
- `-o, --output <path>` writes output to a file
- `-o result.json` writes JSON automatically based on the file extension
- `scrape --type screenshot` requires `--output`

Examples:

```bash
headlessx exa search "playwright firefox patches"
headlessx exa search "playwright firefox patches" --json --pretty
headlessx tavily search "distributed crawlers" -o tavily.json --pretty
headlessx scrape https://example.com --type content -o content.md
```

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

Google fields supported by `headlessx google`:

- `query`
- `gl`
- `hl`
- `tbs`
- `stealth`

## Notes

- non-health routes require `x-api-key`
- queue-backed routes depend on Redis and the worker
- screenshot responses are binary image output
- lifecycle commands are additive and do not replace operator/API commands
- this package intentionally excludes MCP-specific commands in `0.1.22`
