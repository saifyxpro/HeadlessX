# headfox-js

`headfox-js` is the TypeScript launcher and Playwright helper for Headfox.

Today, it installs and launches Camoufox-compatible browser bundles while exposing a Headfox-first npm package and API. That lets you ship with the current Camoufox browser line now and switch to native Headfox bundles later without redesigning your app code.

## What it does

- installs a managed Firefox-compatible browser bundle
- generates launch options for `playwright-core`
- launches regular or persistent browser contexts
- exposes a local websocket server for remote Playwright connections
- keeps temporary `Camoufox` aliases for migration compatibility

## Install

```bash
npm install headfox-js playwright-core
```

Download the managed browser bundle:

```bash
npx headfox-js fetch
```

## Quick start

```ts
import { Headfox } from "headfox-js";

const browser = await Headfox({
	headless: true,
});

const page = await browser.newPage();
await page.goto("https://example.com");
console.log(await page.title());
await browser.close();
```

## Playwright launch options

```ts
import { firefox } from "playwright-core";
import { launchOptions } from "headfox-js";

const browser = await firefox.launch(
	await launchOptions({
		headless: true,
	}),
);
```

## Persistent context

```ts
import { Headfox } from "headfox-js";

const context = await Headfox({
	headless: true,
	user_data_dir: ".headfox-profile",
});
```

## Remote server

```ts
import { firefox } from "playwright-core";
import { launchHeadfoxServer } from "headfox-js";

const server = await launchHeadfoxServer({
	port: 8888,
	ws_path: "/headfox",
});

const browser = await firefox.connect(server.wsEndpoint());
```

## Browser source

By default, `headfox-js` downloads the currently maintained Camoufox-compatible browser bundles.

You can override the release source when you need to test a different fork or future Headfox-native releases:

```bash
HEADFOX_JS_RELEASE_REPO=owner/repo
HEADFOX_JS_ASSET_PREFIXES=headfox,camoufox
```

Useful env vars:

- `HEADFOX_JS_RELEASE_REPO`
- `HEADFOX_JS_ASSET_PREFIXES`
- `HEADFOX_JS_CACHE_DIR`

Legacy compatibility env vars are still accepted:

- `CAMOUFOX_JS_RELEASE_REPO`
- `CAMOUFOX_JS_ASSET_PREFIXES`
- `CAMOUFOX_JS_CACHE_DIR`

## Optional WebGL data support

For best fingerprint fidelity, `headfox-js` will use the bundled WebGL sampling database when the optional SQLite dependency is available.

If that native dependency is unavailable in a runtime such as a stripped Docker image, `headfox-js` now continues launching and disables WebGL for that launch instead of crashing the whole process.

## Compatibility aliases

During the migration window, these older names still work:

- `Camoufox`
- `CamoufoxFetcher`
- `camoufox-js`

New projects should use:

- package name: `headfox-js`
- launcher API: `Headfox`
- server API: `launchHeadfoxServer`
