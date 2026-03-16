## Website Workflows Design

### Goal

Bring the website playground closer to Firecrawl's product shape without turning HeadlessX into a generic clone. The dashboard should expose three clear tools:

- `Scrape` for one-page extraction
- `Crawl` for queued multi-page markdown jobs
- `Map` for fast link discovery

### Backend

- Keep existing scrape endpoints and streaming behavior for single-page work.
- Add a synchronous `POST /api/website/map` route that discovers links from the current page and optional sitemap data.
- Add a queued `POST /api/website/crawl` route backed by BullMQ and Redis.
- Extend queue job types with `CRAWL` and persist crawl result payloads in the existing `QueueJob` table.
- Reuse the global proxy and browser settings by routing discovery and crawl page loads through the current browser/config stack.

### Markdown

- Replace the markdown conversion path with a Firecrawl-style adapter.
- Prefer an external Go sidecar through `HTML_TO_MARKDOWN_SERVICE_URL`.
- Fall back to the local Node converter when the service is unavailable so local development remains usable.
- Apply lightweight markdown cleanup after conversion to normalize inline links and remove "skip to content" noise.

### Web UI

- Split the website playground into dedicated routes:
  - `/playground/website`
  - `/playground/website/crawl`
  - `/playground/website/map`
- Use a shared workbench component so the visual shell stays consistent while controls and results change per mode.
- Keep scrape output formats focused:
  - `HTML`
  - `Rendered HTML`
  - `Markdown`
  - `Screenshot`
- Make crawl markdown-first in v1 and keep map as a link list, not a format selector.

### Result Panels

- Scrape results stay preview-first with a raw toggle.
- Crawl results become a split workspace with summary metrics, a page list, and a markdown preview for the selected page.
- Map results become a responsive card/list view with link counts, source badges, and quick-open actions.

### Verification

- Validate Prisma schema and TypeScript builds after the backend changes.
- Build the Go service directly to verify module wiring.
- Render-check the web app with TypeScript build validation and Docker Compose config validation.
