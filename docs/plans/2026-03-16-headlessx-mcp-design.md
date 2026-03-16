# HeadlessX MCP Design

## Goal

Add a remote MCP endpoint to `apps/api` at `/mcp` so self-hosted HeadlessX instances can be used directly by MCP clients.

## Phase 1 Scope

Expose read-first tools only:

- `headlessx_website_get_html`
- `headlessx_website_get_markdown`
- `headlessx_website_map_links`
- `headlessx_google_serp_search`
- `headlessx_tavily_search`
- `headlessx_exa_search`
- `headlessx_youtube_extract_info`
- `headlessx_youtube_list_formats`
- `headlessx_youtube_list_subtitles`
- `headlessx_job_get_status`

Do not expose admin or destructive tools in phase 1.

## Transport

Use remote MCP over Streamable HTTP at `/mcp`.

Implementation choice:

- mount MCP in the existing Express backend
- use stateless transport
- create a fresh MCP server and transport per request

This keeps deployment simple for self-hosted users and avoids a second service.

## Auth

MCP uses the existing API keys created from the dashboard `/api/keys` page.

It does not use `DASHBOARD_INTERNAL_API_KEY`.

Implementation choice:

- extract shared API-key validation into a reusable auth service
- keep the existing dashboard internal key path for the Next.js proxy
- use normal API-key validation for MCP requests

## Tool Design

Each tool should:

- use clear `headlessx_*` naming
- be read-only in annotations
- return both text content and structured content
- support `response_format` with `markdown` or `json`

Long-running phase-1 behavior:

- do not expose queue creation yet
- expose only `headlessx_job_get_status`

## Integration Points

The MCP layer should call existing backend services directly instead of calling the REST API over HTTP.

Primary services:

- `scraperService`
- `websiteDiscoveryService`
- `googleSerpService`
- `tavilyService`
- `exaService`
- `youtubeEngineService`
- `jobManager`
- `queueJobService`

## Verification

Verify with:

- TypeScript build for `apps/api`
- route-level sanity check that `/mcp` is mounted
- source-level validation that MCP auth reuses existing API keys
