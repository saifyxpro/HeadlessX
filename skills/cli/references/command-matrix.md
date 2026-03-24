# Command Matrix

## Lifecycle

Bootstrap:

```bash
headlessx init
headlessx init --mode self-host
headlessx init --mode production --api-domain api.example.com --web-domain dashboard.example.com --caddy-email ops@example.com
headlessx init --branch develop
```

Runtime:

```bash
headlessx start
headlessx stop
headlessx restart
headlessx status
headlessx doctor
```

## Website

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

## Output Files

Markdown:

```bash
headlessx scrape https://example.com --type content -o page.md
headlessx google "latest ai news" -o google.md
```

JSON:

```bash
headlessx status --json --pretty -o status.json
headlessx operators check --json --pretty -o operators.json
```
