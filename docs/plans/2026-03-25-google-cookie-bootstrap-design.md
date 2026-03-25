# Google Cookie Bootstrap Design

## Summary

Google AI Search needs an explicit cookie bootstrap flow on top of the existing shared persistent browser profile. Without cookies and a one-time manual human session, Google is more likely to treat the session as automated traffic and trigger blocking or reCAPTCHA more often.

The product change is:

- Google AI Search adds a `Build Cookies` action in the header
- this action launches the existing shared persistent browser profile
- if no real display is available, the API starts a virtual display
- the operator manually completes Google browsing and any one-time reCAPTCHA challenge
- when the operator stops the browser or the browser exits cleanly, the full shared profile is retained
- Google AI Search stays disabled until the shared profile has been bootstrapped at least once

This design keeps one shared browser profile for HeadlessX, avoids a separate Google-only profile, and makes cookie preparation an explicit operator action instead of hidden background behavior.

## Product Goals

- reduce Google bot detection by allowing a trusted human session to seed cookies and storage
- keep the browser profile shared across operators, as requested
- make the cookie bootstrap flow obvious and controllable from the Google AI Search header
- support VPS and Docker environments that do not have a real desktop session
- persist the built browser state so manual reCAPTCHA is not required repeatedly
- make first-run Google behavior clear by disabling the config and results panels until cookies exist

## Non-Goals

- create a separate Google-only browser profile
- fully automate every future Google challenge
- introduce a new setup wizard outside the existing Google playground
- store runtime browser data in git

## Current Constraints

- Google AI Search already exists at `/playground/operators/google/ai-search`
- the API already uses one shared persistent Headfox JS profile via [BrowserService.ts](/home/saifyxpro/CODE/Crawl/HeadlessX/apps/api/src/services/scrape/BrowserService.ts)
- Docker already persists the shared profile through the `browser_profile` volume in [docker-compose.yml](/home/saifyxpro/CODE/Crawl/HeadlessX/infra/docker/docker-compose.yml)
- local runtime profile data path is currently under `apps/api/data/browser-profile/default`
- [/.gitignore](/home/saifyxpro/CODE/Crawl/HeadlessX/.gitignore) already ignores [apps/api/data/](/home/saifyxpro/CODE/Crawl/HeadlessX/apps/api/data)

## Recommended Approach

### 1. Shared-profile cookie bootstrap

Keep using the existing shared persistent browser profile.

The cookie bootstrap flow should launch that same profile and let the operator interact with Google manually. This means the Google session, cookies, storage, and any challenge resolution become part of the same long-lived browser context already used by the product.

This is the simplest and most honest model:

- one HeadlessX shared browser profile
- one bootstrap action
- one saved state

### 2. Header-driven UX

Google AI Search header gains a new primary utility action:

- default state: `Build Cookies`
- running state: `Stop Browser`

Tooltip copy:

- `Open a real browser session and build trusted Google cookies so requests look more like a normal user session.`

Additional header status chip:

- `Cookies Required`
- `Cookie Session Active`
- `Cookies Ready`
- `Cookie Bootstrap Failed`

### 3. First-run lock state

On first use, Google AI Search should not allow search execution until cookies are built.

Behavior:

- config panel is visually disabled
- results panel is replaced with a setup state
- disabled state explains why Google bootstrap is required
- the only active control is `Build Cookies`

Once cookies are ready, the normal Google form and result panels unlock.

## UX Flow

### First-time operator flow

1. operator opens Google AI Search
2. header shows `Build Cookies`
3. config panel and results panel are disabled
4. setup panel explains that Google needs a human-primed browser profile
5. operator clicks `Build Cookies`
6. API launches the shared browser profile
7. if a real display exists, use it
8. if no real display exists, start a virtual display and expose that browser session in the supported runtime path
9. operator browses Google manually and solves any challenge once
10. operator clicks `Stop Browser` or closes the browser
11. profile remains saved
12. UI changes to `Cookies Ready`
13. Google config/results unlock

### Later operator flow

1. operator opens Google AI Search
2. header shows `Build Cookies` as an optional maintenance action or `Cookies Ready` status
3. searches can run immediately
4. operator can rebuild cookies at any time

### Running bootstrap flow

During cookie build:

- `Build Cookies` changes to `Stop Browser`
- config/results stay disabled
- status text explains the browser is running on the shared profile
- if the session is stopped normally, save state and mark cookies ready
- if the session crashes, show an error state and keep the feature locked

## UI Changes

### Header

Update [GoogleSerpHeader.tsx](/home/saifyxpro/CODE/Crawl/HeadlessX/apps/web/src/components/playground/google/GoogleSerpHeader.tsx):

- add `Build Cookies` / `Stop Browser` button
- add status chip with cookie state
- add tooltip/help text
- keep existing elapsed-time control for search runs

### Configuration panel

Update [ConfigurationPanel.tsx](/home/saifyxpro/CODE/Crawl/HeadlessX/apps/web/src/components/playground/google/ConfigurationPanel.tsx):

- accept `disabledBecauseCookiesMissing`
- hard-disable input controls and search action when cookies are required
- keep stop-search button behavior separate from stop-browser-bootstrap behavior

### Results panel

Update [ResultsPanel.tsx](/home/saifyxpro/CODE/Crawl/HeadlessX/apps/web/src/components/playground/google/ResultsPanel.tsx):

- when cookies are missing, show a dedicated setup state instead of generic empty state
- explain why Google requires cookie bootstrap
- offer a CTA that triggers the same `Build Cookies` action
- if bootstrap fails, show actionable failure text instead of raw stream errors

### Page logic

Update [page.tsx](/home/saifyxpro/CODE/Crawl/HeadlessX/apps/web/src/app/playground/operators/google/ai-search/page.tsx):

- fetch cookie bootstrap status on load
- maintain search state and bootstrap state independently
- prevent search stream start if cookies are not ready
- allow cookie bootstrap action to run outside the search SSE flow

## API Design

Add Google-specific control endpoints under the existing operator namespace:

- `GET /api/operators/google/ai-search/cookies/status`
- `POST /api/operators/google/ai-search/cookies/build`
- `POST /api/operators/google/ai-search/cookies/stop`

### `cookies/status`

Returns:

- whether bootstrap is required
- whether browser bootstrap is currently running
- whether a virtual display is active
- profile path in debug/admin-safe form if useful for diagnostics
- last known readiness/error state

### `cookies/build`

Responsibilities:

- launch the existing shared persistent profile in interactive mode
- attach a page suitable for Google session warming
- prefer real display if available
- otherwise start virtual display on Linux
- mark bootstrap session as running
- return status payload for the UI

### `cookies/stop`

Responsibilities:

- stop the interactive bootstrap browser flow
- close pages/context cleanly
- preserve profile data on disk
- tear down virtual display if it was created only for this flow
- return updated cookie status

## Browser Service Changes

Extend [BrowserService.ts](/home/saifyxpro/CODE/Crawl/HeadlessX/apps/api/src/services/scrape/BrowserService.ts) instead of creating a second service.

Needed additions:

- cookie bootstrap session state
- explicit interactive launch mode
- display detection and virtual-display management
- readiness inspection helper for Google bootstrap
- stop/save path that closes the live browser while preserving profile data

Proposed new capabilities:

- `startCookieBootstrap()`
- `stopCookieBootstrap()`
- `getCookieBootstrapStatus()`
- `isGoogleCookieBootstrapReady()`

The shared profile remains the source of truth.

## Virtual Display Strategy

Use the existing Headfox virtual display utility semantics as the reference behavior. On Linux systems without a real display:

- start a virtual display only for the bootstrap session
- record whether it was started by HeadlessX
- tear it down when bootstrap stops

If virtual display support is unavailable:

- return a precise API error
- tell the operator which dependency is missing

## Google Search Enforcement

Google AI Search request handlers should explicitly check cookie readiness before running search logic.

If readiness is missing:

- do not attempt normal search
- return a structured error such as `GOOGLE_COOKIE_BOOTSTRAP_REQUIRED`
- front-end uses that error to keep the UI in setup mode

This prevents weak UX where the product looks usable but fails mid-run with opaque Google errors.

## Manual reCAPTCHA Handling

The intended behavior is:

- operator may solve a Google or reCAPTCHA challenge manually during bootstrap
- that solution persists in the shared browser profile
- later searches reuse that trusted session state

This does not guarantee Google will never challenge again, but it should significantly reduce repeated prompts compared with starting from a cold profile.

## Profile Persistence and Migration

### New installs

New installs should not rely on a precreated browser profile under tracked repo content.

Implementation direction:

- remove the old seeded runtime profile contents from [apps/api/data/](/home/saifyxpro/CODE/Crawl/HeadlessX/apps/api/data)
- let the shared profile be created on first bootstrap or first browser launch

### Existing installs

Existing Docker or VPS users should keep their current persistent profile if one already exists.

That means:

- Docker volume `browser_profile` remains authoritative
- existing users are not forced to rebuild cookies unless they want to

### Git hygiene

[apps/api/data/](/home/saifyxpro/CODE/Crawl/HeadlessX/apps/api/data) must remain ignored by git.

This already exists in [/.gitignore](/home/saifyxpro/CODE/Crawl/HeadlessX/.gitignore), and the implementation should preserve it.

## Failure States

The UI should distinguish:

- cookies missing
- bootstrap browser running
- bootstrap stopped successfully
- bootstrap failed to launch
- virtual display unavailable
- browser closed unexpectedly

Avoid generic states like:

- `500`
- `fetch failed`
- `something went wrong`

## Implementation Phases

### Phase 1. Backend bootstrap controls

- extend BrowserService for interactive bootstrap lifecycle
- add Google cookie status/build/stop endpoints
- add virtual-display fallback handling

### Phase 2. Frontend gating and header action

- add cookie bootstrap status to Google page state
- add header button and tooltip
- disable config/results until ready
- add setup state in results area

### Phase 3. Enforcement and cleanup

- enforce readiness in Google search handlers
- remove repo-seeded runtime profile artifacts from `apps/api/data`
- keep existing user volumes intact

### Phase 4. Verification

- local dev with real display
- Docker self-host flow without real display
- first-time bootstrap
- rebuild cookies on demand
- stop and restart behavior
- existing user upgrade with already-persisted profile

## Success Criteria

- Google AI Search clearly indicates when cookie bootstrap is required
- user can start and stop cookie bootstrap from the header
- bootstrap uses the shared persistent profile
- manual Google/reCAPTCHA solve persists across later searches
- config/results stay locked until first successful bootstrap
- Docker/VPS environments can use virtual display when no real display exists
- `apps/api/data` remains ignored by git
