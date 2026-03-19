---
name: cli
description: Use when an agent needs to operate HeadlessX through the CLI instead of calling files or APIs directly. Covers installing the published HeadlessX CLI package, logging in with an API URL and API key, and running `headlessx` commands for website scraping, map, crawl, Google AI Search, Tavily, Exa, YouTube, jobs, and operators. Trigger for requests like "use the CLI", "test the CLI", "show the command", "log in with the CLI", or "run HeadlessX from terminal".
---

# HeadlessX CLI

Use `headlessx` as the canonical command.

## Quick Start

Install and verify:

```bash
npm install -g @headlessx-cli/core
headlessx --help
```

## Authentication Workflow

Use HeadlessX API credentials only.

Config precedence:

1. command flags
2. environment variables
3. stored local credentials
4. default API URL

Environment variables:

```bash
export HX_API_KEY=your_headlessx_api_key
export HX_API_URL=http://localhost:8000
```

Alternative env names also work:

```bash
export HEADLESSX_API_KEY=your_headlessx_api_key
export HEADLESSX_API_URL=http://localhost:8000
```

Interactive login:

```bash
headlessx login
```

Prompt only for the missing field:

```bash
headlessx login --api-key your_headlessx_api_key
headlessx login --api-url http://localhost:8000
```

Direct login:

```bash
headlessx login --api-key your_headlessx_api_key --api-url http://localhost:8000
```

Inspect stored config:

```bash
headlessx config view
```

Clear stored credentials:

```bash
headlessx logout
```

## Output Rules

Prefer the default markdown/text output for LLM-facing use.

Use `--json` only when structured machine-readable output is specifically needed.

Common patterns:

```bash
headlessx google "latest ai news"
headlessx google "latest ai news" --json --pretty
headlessx scrape https://example.com --type content -o page.md
```

## Command Patterns

### Website

Scrape:

```bash
headlessx scrape https://example.com
headlessx scrape https://example.com --type html
headlessx scrape https://example.com --type html-js
headlessx scrape https://example.com --type content -o page.md
headlessx scrape https://example.com --type screenshot --output screenshot.jpg
headlessx scrape https://example.com --type html-js --stealth on
```

Map:

```bash
headlessx map https://example.com --limit 100
headlessx map https://example.com --include-subdomains
headlessx map https://example.com --include-paths /docs,/blog
headlessx map https://example.com --exclude-paths /login,/admin
```

Crawl:

```bash
headlessx crawl https://example.com --limit 50
headlessx crawl https://example.com --wait --poll-interval 5
headlessx crawl https://example.com --max-depth 2 --include-subdomains
```

Important:

- `/api/operators/website/crawl` is the only website route that requires Redis and the worker
- other website commands do not require Redis

### Google AI Search

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

### Tavily

```bash
headlessx tavily search "headless browser research" --max-results 10
headlessx tavily search "anti bot trends" --topic news --search-depth advanced
headlessx tavily research "compare exa and tavily" --model pro
headlessx tavily result req_123
headlessx tavily status
```

### Exa

```bash
headlessx exa search "firefox anti detect browser" --type deep --num-results 10
headlessx exa search "browser fingerprinting" --content-mode text
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
headlessx operators list
headlessx operators check
headlessx operators check --json --pretty
```

## Publishing And Install

Current package:

- `@headlessx-cli/core`

Global install:

```bash
npm install -g @headlessx-cli/core
```

Publish flow from this repo:

```bash
cd /home/saifyxpro/CODE/Crawl/HeadlessX/packages/cli
npm login
pnpm type-check
pnpm build
npm publish --access public
```

## Agent Notes

The CLI talks to the HeadlessX API. It does not launch its own separate browser stack.

If the backend uses the persistent browser profile under `apps/api/data`, CLI requests share that backend state because they go through the same API instance.
