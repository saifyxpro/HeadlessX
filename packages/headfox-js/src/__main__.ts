#!/usr/bin/env node

import { existsSync, readFileSync, rmSync } from "node:fs";
import { Command } from "commander";
import { DefaultAddons, maybeDownloadAddons } from "./addons.js";
import { ALLOW_GEOIP, downloadMMDB, removeMMDB } from "./locale.js";
import { HeadfoxFetcher, INSTALL_DIR, installedVerStr } from "./pkgman.js";
import { launchHeadfoxServer } from "./server.js";
import { Headfox } from "./sync_api.js";
import { getAsBooleanFromENV } from "./utils.js";

function getPackageVersion(): string {
	const packageJson = JSON.parse(
		readFileSync(new URL("../package.json", import.meta.url), "utf8"),
	);
	return packageJson.version;
}

class HeadfoxUpdate extends HeadfoxFetcher {
	currentVerStr: string | null;

	private constructor() {
		super();
		this.currentVerStr = null;
		try {
			this.currentVerStr = installedVerStr();
		} catch (error) {
			if (
				error instanceof Error &&
				(error.name === "FileNotFoundError" ||
					error.name === "HeadfoxNotInstalled" ||
					error.name === "CamoufoxNotInstalled")
			) {
				this.currentVerStr = null;
			} else {
				throw error;
			}
		}
	}

	static async create(): Promise<HeadfoxUpdate> {
		const updater = new HeadfoxUpdate();
		await updater.init();
		return updater;
	}

	isUpdateNeeded(): boolean {
		if (getAsBooleanFromENV("PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD", false)) {
			console.log(
				"Skipping browser download / update check because PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD is set.",
			);
			return false;
		}

		return this.currentVerStr === null || this.currentVerStr !== this.verstr;
	}

	async update(): Promise<void> {
		if (!this.isUpdateNeeded()) {
			console.log("Headfox binaries are already up to date.");
			console.log(`Current version: v${this.currentVerStr}`);
			return;
		}

		if (this.currentVerStr !== null) {
			console.log(
				`Updating Headfox binaries from v${this.currentVerStr} -> v${this.verstr}`,
			);
		} else {
			console.log("Fetching Headfox binaries...");
		}

		await this.install();
	}

	async cleanup(): Promise<boolean> {
		if (!existsSync(INSTALL_DIR)) {
			return false;
		}

		rmSync(INSTALL_DIR, { recursive: true, force: true });
		console.log("Headfox binaries removed.");
		return true;
	}
}

const program = new Command();

program
	.name("headfox-js")
	.description("Headfox package manager and local browser tooling");

program.command("fetch").action(async () => {
	const updater = await HeadfoxUpdate.create();
	await updater.update();
	if (ALLOW_GEOIP) {
		await downloadMMDB();
	}
	await maybeDownloadAddons(DefaultAddons);
});

program.command("remove").action(async () => {
	const updater = await HeadfoxUpdate.create();
	if (!(await updater.cleanup())) {
		console.log("Headfox binaries were not found.");
	}
	removeMMDB();
});

program
	.command("test")
	.argument("[url]", "URL to open", null)
	.action(async (url) => {
		const browser = await Headfox({
			headless: false,
			env: process.env as Record<string, string>,
			config: { showcursor: true },
			humanize: 0.5,
			geoip: true,
		});
		const page = await browser.newPage();
		if (url) {
			await page.goto(url);
		}
		await page.pause();
	});

program.command("server").action(async () => {
	const server = await launchHeadfoxServer({});

	console.log(`Headfox server started at ${server.wsEndpoint()}`);
	console.log();
	console.log(
		"You can connect to it using Playwright's BrowserType.connect() method.",
	);
	console.log("To stop the server, press Ctrl+C or close this terminal.");
});

program.command("path").action(() => {
	console.log(INSTALL_DIR);
});

program.command("version").action(async () => {
	console.log(`headfox-js:\tv${getPackageVersion()}`);

	const updater = await HeadfoxUpdate.create();
	const binVer = updater.currentVerStr;

	if (!binVer) {
		console.log("Headfox:\tNot downloaded.");
		return;
	}

	console.log(`Headfox:\tv${binVer}`);

	if (updater.isUpdateNeeded()) {
		console.log(`Latest supported browser release: v${updater.verstr}`);
	} else {
		console.log("Browser binaries are up to date.");
	}
});

program.parse(process.argv);
