# hx-cli

`hx-cli` is the HeadlessX command-line client.

It wraps the current HeadlessX backend routes for:

- website scraping
- site mapping
- queue-backed crawling
- Google SERP
- Tavily
- Exa
- YouTube
- job inspection

This package is intentionally API-first. It does not implement browser login, MCP setup, editor skill installation, or Firecrawl cloud-browser flows.

## Version

Current package version:

- `0.1.0`

## Workspace Fit

`hx-cli` is designed to live inside the HeadlessX pnpm workspace.

- package manager: `pnpm`
- binary name: `hx`
- package name: `hx-cli`

## Install

Inside the monorepo:

```bash
pnpm --dir /home/saifyxpro/CODE/Crawl/HeadlessX --filter hx-cli build
pnpm --dir /home/saifyxpro/CODE/Crawl/HeadlessX exec hx --help
```

## Authentication

`hx-cli` uses HeadlessX API keys only.

Supported config sources:

1. command flags
2. environment variables
3. stored local credentials
4. default API URL

Environment variables:

```bash
export HX_API_KEY=your-headlessx-key
export HX_API_URL=http://localhost:8000
```

Or store them locally:

```bash
hx login --api-key your-headlessx-key --api-url http://localhost:8000
```

View current config:

```bash
hx config
hx config view
```

Clear local credentials:

```bash
hx logout
```

## Commands

### Core

```bash
hx status
hx --version
hx config
hx login
hx logout
```

### Website

```bash
hx scrape https://example.com
hx scrape https://example.com --type html
hx scrape https://example.com --type html-js
hx scrape https://example.com --type screenshot --output screenshot.jpg

hx map https://example.com --limit 100 --pretty
hx crawl https://example.com --limit 50
hx crawl https://example.com --wait --poll-interval 5
```

### Google SERP

```bash
hx google "headless browser anti detect"
```

### Tavily

```bash
hx tavily search "headless browser research" --max-results 10
hx tavily research "compare exa and tavily" --model pro
hx tavily result req_123
hx tavily status
```

### Exa

```bash
hx exa search "firefox anti detect browser" --type deep --num-results 10
hx exa status
```

### YouTube

```bash
hx youtube info https://www.youtube.com/watch?v=VIDEO_ID
hx youtube formats https://www.youtube.com/watch?v=VIDEO_ID
hx youtube subtitles https://www.youtube.com/watch?v=VIDEO_ID
hx youtube save https://www.youtube.com/watch?v=VIDEO_ID --quality-preset 720p
hx youtube status
```

### Jobs

```bash
hx jobs list --type crawl --status active
hx jobs get JOB_ID
hx jobs active
hx jobs metrics
hx jobs cancel JOB_ID
hx jobs watch JOB_ID --interval 5
```

### Operators

```bash
hx operators list --pretty
hx operators check
hx operators check --json --pretty
```

## Output

The CLI is scriptable by default.

- `--pretty` pretty-prints JSON
- `-o, --output <path>` writes output to a file
- `scrape --type screenshot` requires `--output`

Examples:

```bash
hx exa search "playwright firefox patches" --pretty
hx tavily search "distributed crawlers" -o tavily.json --pretty
hx scrape https://example.com --type content -o content.md
```

## Backend Routes Covered

This package currently targets:

- `/api/health`
- `/api/playground/operators`
- `/api/website/*`
- `/api/google-serp/*`
- `/api/tavily/*`
- `/api/exa/*`
- `/api/youtube/*`
- `/api/jobs/*`

## Notes

- non-health routes require `x-api-key`
- queue-backed routes depend on Redis and the worker
- screenshot responses are binary image output
- this package intentionally excludes MCP-specific commands in `0.1.0`
