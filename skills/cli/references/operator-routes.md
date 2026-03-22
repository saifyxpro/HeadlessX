# Operator Routes

## Status

- `/api/operators/status`

## Website

- `/api/operators/website/scrape/html`
- `/api/operators/website/scrape/html-js`
- `/api/operators/website/scrape/content`
- `/api/operators/website/scrape/screenshot`
- `/api/operators/website/map`
- `/api/operators/website/crawl`

Important:

- website crawl is the only website operator that requires Redis and the worker
- other website operator routes do not require Redis

## Google AI Search

- `/api/operators/google/ai-search/search`
- `/api/operators/google/ai-search/stream`
- `/api/operators/google/ai-search/status`

## Tavily

- `/api/operators/tavily/*`

## Exa

- `/api/operators/exa/*`

## YouTube

- `/api/operators/youtube/*`

## Jobs

- `/api/jobs/*`

## MCP

Remote MCP stays on:

- `/mcp`
