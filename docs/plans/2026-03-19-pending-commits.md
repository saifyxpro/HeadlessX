# Pending Changes

This file is a plain one-by-one record of the edits made in HeadlessX. It is not written as commit templates.

## 1. Env examples cleaned

- cleaned the root `.env.example`
- cleaned `infra/docker/.env.example`
- removed duplicated localhost-style defaults
- removed the old default runtime block
- removed the old optional queue tuning block from the public examples
- kept only the env values that match the real current runtime
- made Tavily, Exa, and YouTube operator status depend on their real env variables

## 2. Persistent browser profile

- added one persistent shared Camoufox profile in the API
- kept cookies, storage, and profile state on disk
- made Website and Google use the same long-lived browser profile
- kept local runtime profile data under `apps/api/data`
- kept repo baseline profile data under `apps/api/default-data`
- made the runtime prefer `data/` first and `default-data/` second

## 3. Operator stop behavior fixed

- fixed Google stop cleanup behavior
- fixed Exa stop behavior
- fixed Tavily stop behavior
- fixed YouTube stop behavior
- fixed the shared config shell so Stop buttons stay clickable during active runs

## 4. Browser viewport fixed

- removed the old forced `1920x1080` browser size
- made headed Linux runs try to use the real host display size
- kept a sane fallback for headless and Docker runs
- reused the same resolved viewport in shared browser flows

## 5. Google route and UI cleanup

- renamed old Google paths to the newer Google AI Search structure
- moved frontend Google pages to the newer route layout
- moved backend Google API paths to the newer layout
- aligned the Google workbench UI with Website UI
- changed `Trend` to `Trends`
- removed old JSON/markdown report output from Google results
- refreshed `assets/google-serp-results.png`

## 6. Google targeting controls

- added Google region dropdown support
- added Google language dropdown support
- added time filter support
- moved time filter into advanced settings
- added `googleRegions.json`
- added `googleLanguages.json`
- removed invalid entries like `AA`
- improved dropdown scrolling and first-letter selection

## 7. Google SSE and AI overview cleanup

- stabilized Google SSE handling
- cleaned buffered stream completion behavior
- cleaned AI overview rendering
- turned URLs into better links/chips
- made CAPTCHA progress text appear only when a real CAPTCHA is detected

## 8. Google defaults cleaned

- made Google default to plain `google.com`
- kept AI mode as the primary flow
- only apply `gl`, `hl`, and `tbs` when the user actually sets them
- added `Auto (Google default)` behavior in the UI

## 9. CLI package and output updates

- changed the CLI package flow to the real published package
- set the npm package to `@headlessx-cli/core`
- set the command to `headlessx`
- removed the older command naming from the public docs
- made CLI output markdown-first instead of JSON-first
- kept JSON as explicit opt-in
- updated CLI docs and README to the new package and command

## 10. `yt-dude` README refresh

- refreshed the `yt-dude` README
- clearly marked it as forked from `yt-dlp`
- clearly marked it as maintained by HeadlessX
- kept the rest of the package manual structure intact

## 11. Crawl and queue fixes

- fixed website crawl cancel behavior
- fixed the enqueue/cancel race
- fixed queue cancellation handling
- fixed worker-side cancellation checks
- fixed crawl page budgeting
- made website crawl use the advanced timeout value

## 12. Docker full stack

- added `yt-engine` into the Docker full stack
- updated Docker env/docs to match
- made full Docker closer to one-command setup
- documented that website crawl specifically needs Redis and worker support

## 13. Operator-first routes

- changed operator status to `/api/operators/status`
- changed public API layout to `/api/operators/...`
- changed frontend playground layout to `/playground/operators/...`
- kept `/mcp` as the MCP endpoint
- updated MCP tool naming to match the new Google operator naming
- updated docs and CLI paths to the operator-first layout

## 14. Website scrape route stability

- made `/playground/operators/website/scrape` the stable frontend page
- stopped changing the frontend route when the output format changes
- turned old output-specific pages into compatibility redirects
- kept format switching inside the UI instead of tying it to path changes

## 15. Proxy settings UI cleanup

- removed the old proxy popup editor flow
- removed `Launch Preview`
- removed `Traffic Pattern`
- reduced the proxy tab to:
  - enable or disable
  - protocol
  - proxy endpoint
  - test
  - save
- replaced browser-native alert popups with in-app dialog feedback
- removed the fake direct-connection “proxy test passed” result
- collapsed the proxy tab into one clean container
- added short title, short description, and divider
- aligned the other settings sections to the same style

## 16. Config save path cleanup

- removed the local config fallback path
- kept config save database-only
- moved config save through the shared config service
- added a small retry for transient database resolution issues like `EAI_AGAIN`
- kept proxy save on the same config save path instead of separate direct Prisma writes

## 17. Setup guide updates

- added model download setup to `docs/setup-guide.md`
- documented:
  - `pnpm run models:download`
  - `mise run models`
  - `python3 scripts/download_models.py`
- added CLI setup examples to the setup guide

## 18. README updates

- fixed the README env example so it matches the real current `.env.example`
- added the Agent Skills section
- added the `npx skills add https://github.com/saifyxpro/HeadlessX --skill cli` install command
- mentioned Cursor, Claude Code, Warp, Windsurf, OpenCode, OpenClaw, Antigravity, and similar agents
- changed the Google screenshot heading to mention the Arabic language and region test
- corrected the packages section:
  - `@headlessx-cli/core` is the real published CLI package
  - `headlessx` is the real command
  - `yt-dude` is not marked coming soon
  - Agent Skills are not marked coming soon
- moved the packages section to after Monorepo Layout
