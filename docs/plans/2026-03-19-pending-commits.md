# Pending Git Commits

## 1. `chore(env): clean local and docker env examples and align operator activation`

Clean the root and Docker environment examples so they are smaller, less repetitive, and match the actual runtime surface used by HeadlessX.

### Included files
- `.env.example`
- `infra/docker/.env.example`
- `infra/docker/docker-compose.yml`
- `apps/api/src/services/playground/OperatorCatalogService.ts`

### What this commit does
- remove noisy duplicated localhost-style env examples where they are not needed
- remove the `DEFAULT RUNTIME SETTINGS` block from the root env example
- remove the `Optional queue tuning` block from the root env example
- simplify Docker env docs so they match the current container setup
- ensure Docker compose actually passes `TAVILY_API_KEY`, `EXA_API_KEY`, `YT_ENGINE_URL`, and `YT_ENGINE_TIMEOUT_MS` into the runtime containers
- ensure the web container uses env-driven `INTERNAL_API_URL` and `NEXT_PUBLIC_API_URL` instead of hardcoded compose values
- make operator status stay `active` for:
  - Tavily when `TAVILY_API_KEY` exists
  - Exa when `EXA_API_KEY` exists
  - YouTube when `YT_ENGINE_URL` exists

### Suggested commit message
`chore(env): clean examples and align operator activation`

### Suggested detailed commit body
Clean the local and Docker env examples so they reflect the real runtime surface instead of carrying duplicate localhost defaults and stale fallback sections.

Wire Tavily, Exa, and YouTube env variables through Docker compose so operator availability matches configured services, and simplify operator activation so configured providers appear active without an extra YouTube health gate.

## 2. `feat(browser): keep a persistent shared browser profile alive`

Add a persistent Camoufox browser profile for the backend so Website and Google SERP reuse one long-lived browser state instead of creating disposable stateless contexts for every request.

### Included files
- `.gitignore`
- `infra/docker/docker-compose.yml`
- `apps/api/src/server_entry.ts`
- `apps/api/src/services/scrape/BrowserService.ts`
- `apps/api/src/services/scrape/ScraperService.ts`
- `apps/api/src/services/scrape/StreamingScraperService.ts`
- `apps/api/src/services/scrape/GoogleSerpService.ts`
- `apps/api/src/controllers/scrape/ScrapeController.ts`

### What this commit does
- warm one persistent browser profile when the API starts
- keep cookies, storage, and browser session state on disk
- reuse the same persistent profile for Website and Google SERP requests
- open concurrent requests as separate pages on the shared persistent context
- change request cleanup from closing the whole context to closing only the page
- restart the persistent browser cleanly when config changes
- persist the profile in Docker through a named volume
- ignore local browser profile data in git

### Suggested commit message
`feat(browser): persist shared Camoufox profile`

### Suggested detailed commit body
Introduce a persistent shared Camoufox profile for the API runtime so website and Google SERP requests reuse one long-lived browser session with saved cookies and storage state.

Update browser lifecycle management to warm the profile at startup, release only per-request pages during cleanup, and persist Docker profile data through a dedicated volume so the browser state survives container restarts.

## 3. `fix(playground): normalize operator stop and cancel behavior`

Fix inconsistent operator stop behavior in the playground so aborting a run is treated as a normal user action instead of surfacing misleading runtime errors or silent no-op stops.

### Included files
- `apps/web/src/app/playground/google-serp/page.tsx`
- `apps/web/src/components/playground/exa/ExaWorkbench.tsx`
- `apps/web/src/components/playground/tavily/TavilyWorkbench.tsx`
- `apps/web/src/components/playground/youtube/YouTubeWorkbench.tsx`

### What this commit does
- move Google SERP abort cleanup to unmount-only behavior
- stop normal rerenders from cancelling Google SERP requests
- make Exa stop show a clear cancelled state
- make Tavily stop show a clear cancelled state for both search and research
- make YouTube stop show a clear cancelled state
- keep Website’s existing cancel flow unchanged because it already aborts local requests and cancels queued jobs correctly

### Suggested commit message
`fix(playground): stabilize operator stop actions`

### Suggested detailed commit body
Fix the Google SERP workbench so request cleanup only aborts on unmount instead of during normal loading and result state transitions.

Normalize stop behavior across Exa, Tavily, and YouTube so pressing Stop leaves each operator in a clear cancelled state instead of silently aborting or surfacing misleading runtime noise.

## 4. `feat(browser): align persistent viewport with host display`

Replace the old fixed 1920x1080 browser sizing with a hybrid viewport strategy that matches local Linux displays when possible and keeps Docker/headless runs deterministic.

### Included files
- `.env.example`
- `infra/docker/.env.example`
- `infra/docker/docker-compose.yml`
- `apps/api/src/services/scrape/BrowserService.ts`
- `apps/api/src/services/scrape/GoogleSerpService.ts`
- `apps/api/src/services/scrape/StreamingScraperService.ts`

### What this commit does
- remove the hardcoded `1920x1080` browser window from the persistent Camoufox launch
- detect the real Linux display size through `xrandr` or `xdpyinfo` when running locally in headed mode
- keep env-based viewport overrides supported internally without exposing them in public env examples
- use one shared resolved viewport for the persistent browser, Google search, and screenshot runs
- replace Google and screenshot-specific viewport forcing with the shared browser viewport helper

### Suggested commit message
`feat(browser): align persistent viewport with host display`

### Suggested detailed commit body
Replace the old fixed browser dimensions with a shared viewport resolver so the persistent Camoufox profile matches the local Linux display during headed development and keeps a sane fallback size in headless environments.

Reuse that resolved viewport across Google search and screenshot flows so the backend no longer mixes one persistent browser profile with separate hardcoded page dimensions.

## 5. `feat(google): rename routes and normalize Google workbench UI`

Rename the Google playground and API surfaces to the new canonical paths and bring the Google UI into the same design system as the Website workbench.

### Included files
- `apps/web/src/app/playground/google/page.tsx`
- `apps/web/src/app/playground/google/loading.tsx`
- `apps/web/src/components/playground/google/*`
- `apps/web/src/components/playground/PlaygroundClient.tsx`
- `assets/google-serp-results.png`
- `apps/api/src/app.ts`
- `apps/api/src/routes/scrape/googleSerpRoutes.ts`
- `apps/api/src/controllers/scrape/GoogleSerpController.ts`
- `apps/api/src/mcp/tools/googleSerpTools.ts`
- `apps/api/src/services/playground/OperatorCatalogService.ts`
- `packages/cli/src/index.ts`
- `packages/cli/src/commands/google.ts`
- `packages/cli/src/commands/status.ts`
- `docs/api-endpoints.md`
- `docs/CLI.md`
- `packages/cli/README.md`

### What this commit does
- move the playground route from `/playground/google-serp` to `/playground/google`
- move the Google UI component folder to `components/playground/google`
- rename the canonical API base path from `/api/google-serp/*` to `/api/google/ai-search/*`
- update the operator catalog so Google now links to the new playground and API paths
- update headlessx Google commands and status checks to use the new API endpoints
- update docs to show the new Google route surface
- change `Trend` to `Trends` in the Google header mode row
- align the Google configuration panel, mode pills, stop button, and results panel to the Website UI language
- refresh the Google results screenshot asset so repo visuals match the updated workbench UI
- simplify Google results to `Visual` and `Raw` only
- remove the old JSON view and markdown report section from the Google results panel

### Suggested commit message
`feat(google): rename routes and align workbench UI`

### Suggested detailed commit body
Rename the Google playground and backend surfaces to the new canonical paths under `/playground/google` and `/api/google/ai-search`, then update the operator catalog, CLI, and docs to match.

At the same time, normalize the Google workbench UI so its header, controls, stop action, and result panels follow the same design patterns as the Website workbench instead of using a separate visual language.

## 6. `feat(google): add targeting controls and stabilize AI search flow`

Add Google targeting controls to the AI Search workbench so language, region, and time filters are driven from the UI and forwarded through the backend without leaving the AI mode flow.

### Included files
- `apps/web/src/app/playground/google/page.tsx`
- `apps/web/src/app/playground/google/loading.tsx`
- `apps/web/src/app/playground/google/ai-search/page.tsx`
- `apps/web/src/components/playground/google/ConfigurationPanel.tsx`
- `apps/web/src/components/playground/google/AdvancedSettings.tsx`
- `apps/web/src/components/playground/google/GoogleSerpHeader.tsx`
- `apps/web/src/components/playground/google/ResultsPanel.tsx`
- `apps/web/src/components/ui/CustomDropdown.tsx`
- `apps/web/src/data/googleRegions.json`
- `apps/web/src/data/googleLanguages.json`
- `apps/api/src/controllers/scrape/GoogleSerpController.ts`
- `apps/api/src/services/scrape/GoogleSerpService.ts`

### What this commit does
- add region and language dropdowns to the Google AI Search workbench
- move time filtering into the advanced settings dialog alongside timeout
- add generated Google regions and languages datasets for the new dropdowns
- remove invalid placeholder region entries like `AA`
- make `/playground/google` redirect cleanly to `/playground/google/ai-search`
- keep the backend on the AI mode flow while still respecting `gl`, `hl`, and `tbs`
- change the Google start URL based on selected targeting params instead of staying fixed at the plain home URL
- avoid typing the same query twice when the Google URL already prefilled the input
- add icons to the Google mode pills and keep `AI Search` as the active surface
- improve shared dropdown behavior with proper scrolling and first-letter typeahead selection

### Suggested commit message
`feat(google): add targeting controls to AI search`

### Suggested detailed commit body
Add region, language, and time filter controls to the Google AI Search workbench and wire them through the backend so user-selected targeting parameters shape the Google start URL without abandoning the AI mode flow.

Improve the Google workbench UX at the same time by redirecting the root Google playground route to the canonical AI Search page, cleaning the region dataset, and upgrading the shared dropdown component with scrollable menus and keyboard typeahead.

## 7. `fix(google): stabilize SSE progress and clean AI overview output`

Tighten the Google AI Search streaming flow so result delivery is more reliable and the AI overview panel renders cleaner output by default.

### Included files
- `apps/web/src/app/playground/google/ai-search/page.tsx`
- `apps/web/src/components/playground/google/ResultsPanel.tsx`
- `apps/api/src/services/scrape/GoogleSerpService.ts`

### What this commit does
- process trailing buffered SSE events before the stream reader closes
- track terminal stream events explicitly so result and error completion is more reliable
- keep abort cleanup from leaving the Google stream in a bad local state
- make step 4 progress messaging neutral by default so CAPTCHA text only appears when a real CAPTCHA is detected
- convert AI overview URLs into clickable links instead of rendering one raw unbroken block
- normalize AI overview spacing so extracted text reads more cleanly in the visual panel

### Suggested commit message
`fix(google): stabilize SSE and clean overview output`

### Suggested detailed commit body
Tighten the Google AI Search stream reader so it handles trailing SSE payloads and terminal events more reliably, then update the backend progress messaging so the UI only shows CAPTCHA solving when a real challenge was detected.

Clean the Google overview renderer at the same time by auto-linking extracted URLs and normalizing raw extracted text so the AI overview reads like formatted content instead of a noisy text dump.

## 8. `refactor(google): default to Google auto-targeting and cleaner overview cards`

Make Google AI Search default to Google's own locale behavior unless the user explicitly selects targeting, and clean up the AI overview panel so source links and text blocks render with clearer structure.

### Included files
- `apps/web/src/app/playground/google/ai-search/page.tsx`
- `apps/web/src/components/playground/google/ConfigurationPanel.tsx`
- `apps/web/src/components/playground/google/ResultsPanel.tsx`

### What this commit does
- default region and language to empty values instead of forcing `us` and `en`
- send `gl` and `hl` only when the user explicitly selects them in the Google workbench
- add `Auto (Google default)` options to the region and language dropdowns
- update the Google config copy so auto-targeting is the default guidance
- convert standalone overview URLs into compact source chips
- suppress noisy bare-domain and `+4` style extraction fragments in the AI overview panel
- render the remaining overview text as cleaner paragraph blocks instead of one long loose dump

### Suggested commit message
`refactor(google): default to auto targeting and clean overview cards`

### Suggested detailed commit body
Stop forcing explicit Google locale targeting in the AI Search workbench by default so the frontend only sends `gl` and `hl` when the user actually selects a region or language.

Clean the AI overview panel at the same time by collapsing standalone links into compact source chips, filtering obvious extraction noise, and rendering the remaining text in clearer paragraph blocks.

## 9. `feat(cli): make output markdown-first and document distribution`

Shift the CLI to LLM-friendly markdown/text output by default, keep JSON as an explicit opt-in, and document the real install and publish workflows around the package.

### Included files
- `packages/cli/package.json`
- `packages/cli/src/index.ts`
- `packages/cli/src/utils/output.ts`
- `packages/cli/src/commands/*`
- `packages/cli/README.md`
- `docs/CLI.md`

### What this commit does
- expose `headlessx` as the real package bin and remove the old `hx` / `headlessx-cli` compatibility bins
- change the CLI help surface so the primary command name is `headlessx`
- make the default output serializer markdown/text oriented instead of JSON heavy
- keep JSON available through explicit `--json` flags or `.json` output paths
- add `--json` support across the main command groups that previously defaulted to JSON
- update the CLI README and docs to show `headlessx` commands consistently
- keep the npm package scoped as `@headlessx-cli/core`
- keep the package version at `0.1.0` for now while waiting out npm's 24-hour republish lock on the unscoped package name
- document local install, global install, npm publish, and the current apt/snap packaging status

### Suggested commit message
`feat(cli): default to markdown output and document distribution`

### Suggested detailed commit body
Make the `headlessx` command friendlier for LLM and terminal workflows by switching the default output to compact markdown/text instead of raw JSON, while preserving explicit JSON output for automation and `.json` files.

Expose `headlessx` as the primary command name, keep the npm package scoped as `@headlessx-cli/core`, and refresh the CLI documentation so local installation, global installation, npm publishing, and the current non-configured apt/snap packaging story are clear while leaving the version at `0.1.0` until the npm republish window expires.

## 10. `docs(yt-dude): refresh fork README for HeadlessX`

Clean up the `yt-dude` README so it reads like a maintained HeadlessX package instead of a raw upstream-style paste, while still preserving the long reference sections below.

### Included files
- `packages/yt-dude/README.md`

### What this commit does
- replace the old top-heavy badge wall with a cleaner package intro
- explicitly state that `yt-dude` is forked from `yt-dlp`
- explicitly state that the fork is maintained by HeadlessX
- add a practical quick-start section for local source installs
- explain why the fork exists in HeadlessX terms: workers, automation, and resilient extraction
- keep the detailed downstream reference sections intact instead of rewriting the full manual

### Suggested commit message
`docs(yt-dude): refresh HeadlessX fork README`

### Suggested detailed commit body
Rewrite the top of the `yt-dude` README so it clearly presents the package as a HeadlessX-maintained fork of `yt-dlp` with a focus on resilient automation and background-worker use cases.

Keep the long upstream-style reference content below, but replace the current introduction with a cleaner package summary, fork notice, practical quick start, and clearer positioning inside the HeadlessX package ecosystem.

## 11. `feat(api): prefer local browser data and fall back to default-data`

Make the API runtime prefer local browser profile state under `apps/api/data` while still working out of the box for GitHub users who only have the checked-in `default-data` baseline.

### Included files
- `apps/api/src/services/scrape/BrowserService.ts`

### What this commit does
- resolve the browser profile directory from `apps/api/data/browser-profile/default` first
- fall back to `apps/api/default-data/browser-profile/default` when no local `data` profile exists
- keep local developer browser state separate from the repo-shipped default profile baseline
- preserve the existing `.gitignore` behavior for `apps/api/data/`

### Suggested commit message
`feat(api): prefer local browser data over default profile`

### Suggested detailed commit body
Update the API browser profile resolver so HeadlessX uses the local `apps/api/data` profile when it exists, but clean clones can still boot against the checked-in `default-data` baseline.

This keeps developer cookies and runtime state local while allowing GitHub users to start from a bundled default browser profile without extra setup.

## 12. `fix(crawl): harden queue cancellation and website crawl flow`

Fix the website crawl flow across the web workbench, queue producer, and worker so cancelling a crawl is reliable, honest, and does not orphan jobs during the enqueue window.

### Included files
- `apps/api/src/services/queue/jobSchemas.ts`
- `apps/api/src/services/queue/QueueJobService.ts`
- `apps/api/src/services/queue/QueueWorker.ts`
- `apps/api/src/services/scrape/WebsiteCrawlService.ts`
- `apps/api/src/controllers/scrape/GoogleSerpController.ts`
- `apps/web/src/components/playground/website/WebsiteWorkbench.tsx`

### What this commit does
- add a caller-supplied crawl `jobId` so the web workbench can cancel before the enqueue round-trip finishes
- remember pre-enqueue cancellation requests and prevent those jobs from being added to BullMQ later
- stop marking queue jobs as fully cancelled when Redis is unavailable and only a cancellation request could be recorded
- make the worker honor `cancel_requested` before promoting a job into real execution
- fix crawl page budgeting so failed or merely queued pages do not consume the success limit through `visited.size`
- pass the advanced timeout setting from the website crawl UI to the backend queue payload
- fix the unrelated Google controller `tbs` typing issue surfaced during API type validation

### Suggested commit message
`fix(crawl): harden queue cancellation and website flow`

### Suggested detailed commit body
Harden the queue-backed website crawl path so the web workbench can cancel jobs even during the enqueue race window, BullMQ jobs do not get orphaned, and Redis outages no longer cause the API to falsely report live jobs as already cancelled.

Tighten the worker and crawl service at the same time by honoring pre-existing cancellation requests before execution starts, fixing crawl page budgeting, forwarding the UI timeout setting, and cleaning up the Google controller typing issue uncovered during targeted API validation.

## 13. `feat(docker): add yt-engine to the full compose stack`

Make full Docker actually include the YouTube runtime by adding `yt-engine` as a first-class Compose service and updating the setup docs to match the new one-command stack.

### Included files
- `infra/docker/yt-engine.Dockerfile`
- `infra/docker/docker-compose.yml`
- `infra/docker/.env.example`
- `docs/setup-guide.md`
- `docs/api-endpoints.md`
- `README.md`
- `CONTRIBUTING.md`

### What this commit does
- add a dedicated Docker image for `apps/yt-engine`
- install `yt-dude`, FastAPI, ffmpeg, and a JavaScript runtime inside the yt-engine container
- add `yt-engine` as a real Compose service with a healthcheck and temp-data volume
- make the API default to `YT_ENGINE_URL=http://yt-engine:8090` inside Docker
- keep `docker compose --profile all up --build -d` as the one-command full-stack path
- remove stale docs that claimed full Docker still required running yt-engine separately
- update API docs to clarify that only `/api/website/crawl` requires Redis plus the worker, not the other website routes

### Suggested commit message
`feat(docker): add yt-engine to full compose stack`

### Suggested detailed commit body
Add a dedicated Docker image and Compose service for the YouTube engine so the full Docker profile finally brings up the entire HeadlessX runtime, including YouTube extraction, instead of relying on a host-local sidecar.

Update the Docker env example, setup guide, README, contributing guide, and API reference so they match the new Compose reality and explicitly clarify that Redis is only required for queue-backed website crawl and job flows.

## 14. `refactor(routes): move public surfaces to operator-first paths`

Reorganize the public API, playground pages, operator registry, MCP naming, and CLI route usage around a single operator-first path model so Website, Google AI Search, Tavily, Exa, and YouTube all follow the same structure.

### Included files
- `apps/api/src/app.ts`
- `apps/api/src/routes/playground/playgroundRoutes.ts`
- `apps/api/src/routes/scrape/websiteRoutes.ts`
- `apps/api/src/routes/scrape/googleSerpRoutes.ts`
- `apps/api/src/services/playground/OperatorCatalogService.ts`
- `apps/api/src/services/scrape/GoogleSerpService.ts`
- `apps/api/src/mcp/tools/googleSerpTools.ts`
- `apps/web/src/lib/playgroundAvailability.ts`
- `apps/web/src/app/playground/page.tsx`
- `apps/web/src/app/playground/operators/**`
- `apps/web/src/components/playground/PlaygroundClient.tsx`
- `apps/web/src/components/playground/website/ScraperHeader.tsx`
- `apps/web/src/components/playground/website/WebsiteWorkbench.tsx`
- `apps/web/src/components/playground/exa/ExaWorkbench.tsx`
- `apps/web/src/components/playground/tavily/TavilyWorkbench.tsx`
- `apps/web/src/components/playground/youtube/YouTubeWorkbench.tsx`
- `apps/web/src/components/playground/youtube/results/ResultsPanel.tsx`
- `packages/cli/src/**`
- `docs/api-endpoints.md`
- `docs/CLI.md`
- `packages/cli/README.md`
- `docs/setup-guide.md`
- `README.md`

### What this commit does
- move operator status from `/api/status/operators` to `/api/operators/status`
- move public operator APIs under `/api/operators/{operator}/...`
- make website scrape endpoints nested under `/api/operators/website/scrape/*`
- move the playground landing page to `/playground/operators`
- make Website default to `/playground/operators/website/scrape`
- move Google AI Search to `/playground/operators/google/ai-search`
- remove the old public website, google, exa, tavily, and youtube page routes instead of leaving two parallel route trees
- align operator catalog links and API base paths with the new structure
- update MCP Google tool names from `google_serp` to `google_ai_search`
- keep the MCP transport endpoint at `/mcp` unchanged while aligning tool naming with the new operator model
- update `headlessx` to call the operator-first backend routes
- refresh the API, CLI, setup, and root README route references to the new public model

### Suggested commit message
`refactor(routes): adopt operator-first api and playground paths`

### Suggested detailed commit body
Adopt a single operator-first public route model across the backend, dashboard, MCP naming, and CLI so the platform exposes one consistent structure instead of mixing `/api/website`, `/api/google`, and `/api/status` with separate playground trees.

Move Website under `/api/operators/website/*`, Google AI Search under `/api/operators/google/ai-search/*`, make `/playground/operators` the canonical playground root, default Website to `/playground/operators/website/scrape`, and update the operator catalog, CLI commands, and markdown docs to match the new route hierarchy.

## 15. `fix(website): keep scrape format switching on one stable frontend route`

Decouple the Website scrape output selector from the Next.js route tree so changing output format in the UI no longer remounts the page or snaps back to stale stored values.

### Included files
- `apps/web/src/app/playground/operators/website/page.tsx`
- `apps/web/src/app/playground/operators/website/scrape/page.tsx`
- `apps/web/src/app/playground/operators/website/scrape/html/page.tsx`
- `apps/web/src/app/playground/operators/website/scrape/html-js/page.tsx`
- `apps/web/src/app/playground/operators/website/scrape/content/page.tsx`
- `apps/web/src/app/playground/operators/website/scrape/screenshot/page.tsx`
- `apps/web/src/components/playground/PlaygroundClient.tsx`
- `apps/web/src/components/playground/website/ScraperHeader.tsx`
- `apps/web/src/components/playground/website/WebsiteWorkbench.tsx`
- `apps/web/src/components/playground/website/hooks/useWebsiteStorage.ts`
- `apps/api/src/services/playground/OperatorCatalogService.ts`

### What this commit does
- make `/playground/operators/website/scrape` the only real frontend scrape workbench page
- stop changing the frontend path when the output format dropdown changes
- remove the scrape-route sync effect that was causing remounts and stale local-storage rehydration
- update playground search and operator links to point at the stable `/scrape` page
- turn legacy output-specific frontend pages into compatibility redirects instead of separate workbenches
- preserve old deep links by forwarding their selected output as a `format` query param
- let the scrape page honor `format` from the query string while still persisting the last selected output locally

### Suggested commit message
`fix(website): keep scrape format changes on one route`

### Suggested detailed commit body
Fix the Website scrape workbench so the output format selector no longer drives the Next.js path and accidentally remounts the page with stale local state.

Make `/playground/operators/website/scrape` the canonical frontend route, redirect old output-specific pages into it with a compatibility `format` query, and keep the selected scrape output stable inside the UI instead of coupling it to the route tree.

## 16. `refactor(settings): simplify proxy UI and use in-app result dialogs`

Simplify the proxy settings experience so the Proxy tab is a direct inline configuration form instead of a popup editor, and keep test/save feedback inside the app with a proper dialog.

### Included files
- `apps/web/src/app/settings/page.tsx`
- `apps/web/src/components/settings/ProxySettingsDialog.tsx`

### What this commit does
- remove the proxy configuration popup flow from the settings page
- remove the `Launch Preview` panel from the proxy experience
- remove the `Traffic Pattern` proxy organization section
- replace the Proxy tab with a direct inline form for:
  - enable or disable
  - protocol
  - proxy endpoint
- keep `Test Proxy` and `Save Proxy` actions directly in the Proxy tab
- preserve the existing inline proxy status card for latest test results
- replace native browser `window.alert` feedback with an in-app dialog for proxy success and failure messages
- delete the now-unused `ProxySettingsDialog` component file

### Suggested commit message
`refactor(settings): simplify proxy tab and keep feedback in-app`

### Suggested detailed commit body
Simplify the proxy settings UX by replacing the popup editor with a direct inline configuration form in the Proxy tab and removing non-essential layers like Launch Preview and Traffic Pattern.

Keep proxy validation feedback inside the application by replacing native browser alert popups with an in-app dialog, while preserving quick test and save actions plus the inline latest-result status block.

## 17. `fix(playground): keep stop actions clickable while runs are active`

Fix the shared operator config shell so starting a run does not block pointer events for the whole configuration area and make Stop usable again across the playground.

### Included files
- `apps/web/src/components/playground/shared/ConfigPanelShell.tsx`

### What this commit does
- remove the panel-wide `pointer-events-none` lock from the shared config shell
- keep the visual pending dim state with reduced opacity only
- restore Stop button clickability for operators that live inside the shared shell
- preserve each operator's own button-level disabled logic as the real stop/run gate

### Suggested commit message
`fix(playground): keep stop buttons clickable during runs`

### Suggested detailed commit body
Remove the shared pointer-event lock from the operator configuration shell so active runs no longer make the entire control panel inert.

Keep the visual pending state, but let each operator's own run and stop buttons control interactivity so Stop remains usable during Website, Google, Exa, Tavily, and YouTube runs.
