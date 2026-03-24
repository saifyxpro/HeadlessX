#!/usr/bin/env node

import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const distEntrypoint = path.resolve(currentDir, "../dist/__main__.js");

if (!existsSync(distEntrypoint)) {
	console.error(
		"headfox-js is not built yet. Run `pnpm --filter headfox-js build` before using the CLI inside the workspace.",
	);
	process.exit(1);
}

await import(pathToFileURL(distEntrypoint).href);
