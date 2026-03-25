import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import tags from "language-tags";
import maxmind, { type CityResponse } from "maxmind";
import xml2js from "xml2js";
import {
	InvalidLocale,
	MissingRelease,
	NotInstalledGeoIPExtra,
	UnknownIPLocation,
	UnknownLanguage,
	UnknownTerritory,
} from "./exceptions.js";
import { validateIP } from "./ip.js";
import { GitHubDownloader, INSTALL_DIR, webdl } from "./pkgman.js";
import { getAsBooleanFromENV } from "./utils.js";
import { LeakWarning } from "./warnings.js";

const currentDir =
	import.meta.dirname ?? path.dirname(fileURLToPath(import.meta.url));

export const ALLOW_GEOIP = true;

class Locale {
	constructor(
		public language: string,
		public region?: string,
		public script?: string,
	) {}

	asString(): string {
		if (this.region) {
			return `${this.language}-${this.region}`;
		}
		return this.language;
	}

	asConfig(): Record<string, string> {
		if (!this.region) {
			throw new Error("Region is required for config");
		}
		const data: Record<string, string> = {
			"locale:region": this.region,
			"locale:language": this.language,
		};
		if (this.script) {
			data["locale:script"] = this.script;
		}
		return data;
	}
}

class Geolocation {
	constructor(
		public locale: Locale,
		public longitude: number,
		public latitude: number,
		public timezone: string,
		public accuracy?: number,
	) {}

	public asConfig(): Record<string, any> {
		const data: Record<string, any> = {
			"geolocation:longitude": this.longitude,
			"geolocation:latitude": this.latitude,
			timezone: this.timezone,
			...this.locale.asConfig(),
		};
		if (this.accuracy !== undefined) {
			data["geolocation:accuracy"] = this.accuracy;
		}
		return data;
	}
}

function verifyLocale(loc: string): void {
	if (tags.check(loc)) {
		return;
	}
	throw InvalidLocale.invalidInput(loc);
}

export function normalizeLocale(locale: string): Locale {
	verifyLocale(locale);

	const parser = tags(locale);
	if (!parser.region) {
		throw InvalidLocale.invalidInput(locale);
	}

	return new Locale(
		parser.language()?.format() ?? "en",
		parser.region()?.format(),
		parser.language()?.script()?.format(),
	);
}

export function handleLocale(
	locale: string,
	ignoreRegion: boolean = false,
): Locale {
	if (locale.length > 3) {
		return normalizeLocale(locale);
	}

	try {
		return SELECTOR.fromRegion(locale);
	} catch (e) {
		if (e instanceof UnknownTerritory) {
		} else {
			throw e;
		}
	}

	if (ignoreRegion) {
		verifyLocale(locale);
		return new Locale(locale);
	}

	try {
		const language = SELECTOR.fromLanguage(locale);
		LeakWarning.warn("no_region");
		return language;
	} catch (e) {
		if (e instanceof UnknownLanguage) {
		} else {
			throw e;
		}
	}

	throw InvalidLocale.invalidInput(locale);
}

export function handleLocales(
	locales: string | string[],
	config: Record<string, any>,
): void {
	if (typeof locales === "string") {
		locales = locales.split(",").map((loc) => loc.trim());
	}

	const intlLocale = handleLocale(locales[0]).asConfig();
	for (const key in intlLocale) {
		config[key] = intlLocale[key];
	}

	if (locales.length < 2) {
		return;
	}

	config["locale:all"] = joinUnique(
		locales.map((locale) => handleLocale(locale, true).asString()),
	);
}

function joinUnique(seq: string[]): string {
	const seen = new Set<string>();
	return seq.filter((x) => !seen.has(x) && seen.add(x)).join(", ");
}

const MMDB_FILE = path.join(INSTALL_DIR.toString(), "GeoLite2-City.mmdb");
const MMDB_REPO = "P3TERX/GeoLite.mmdb";

class MaxMindDownloader extends GitHubDownloader {
	checkAsset(asset: Record<string, any>): string | null {
		if (asset.name.endsWith("-City.mmdb")) {
			return asset.browser_download_url;
		}
		return null;
	}

	missingAssetError(): void {
		throw new MissingRelease("Failed to find GeoIP database release asset");
	}
}

export function geoipAllowed(): void {
	if (!ALLOW_GEOIP) {
		throw new NotInstalledGeoIPExtra(
			"GeoIP support is unavailable in this build. Install the required MaxMind dependencies or disable the geoip option.",
		);
	}
}

export async function downloadMMDB(): Promise<void> {
	geoipAllowed();

	if (getAsBooleanFromENV("PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD", false)) {
		console.log(
			"Skipping GeoIP database download due to PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD set!",
		);
		return;
	}

	const assetUrl = await new MaxMindDownloader(MMDB_REPO).getAsset();

	const fileStream = fs.createWriteStream(MMDB_FILE);
	await webdl(assetUrl, "Downloading GeoIP database", true, fileStream);
}

export function removeMMDB(): void {
	if (!fs.existsSync(MMDB_FILE)) {
		console.log("GeoIP database not found.");
		return;
	}

	fs.unlinkSync(MMDB_FILE);
	console.log("GeoIP database removed.");
}

export async function getGeolocation(ip: string): Promise<Geolocation> {
	if (!fs.existsSync(MMDB_FILE)) {
		await downloadMMDB();
	}

	validateIP(ip);

	const reader = await maxmind.open<CityResponse>(MMDB_FILE);

	const resp = reader.get(ip);
	if (!resp) {
		throw new UnknownIPLocation(`Unknown IP location: ${ip}`);
	}

	const isoCode = resp.country?.iso_code?.toUpperCase();
	const location = resp.location;

	if (
		!location?.longitude ||
		!location?.latitude ||
		!location?.time_zone ||
		!isoCode
	) {
		throw new UnknownIPLocation(`Unknown IP location: ${ip}`);
	}

	const locale = SELECTOR.fromRegion(isoCode);

	return new Geolocation(
		locale,
		location.longitude,
		location.latitude,
		location.time_zone,
	);
}

async function getUnicodeInfo(): Promise<any> {
	const data = await fs.promises.readFile(
		path.join(currentDir, "data-files", "territoryInfo.xml"),
	);
	const parser = new xml2js.Parser();
	return parser.parseStringPromise(data);
}

function asFloat(element: any, attr: string): number {
	return parseFloat(element[attr] || "0");
}

class StatisticalLocaleSelector {
	private root: any;

	constructor() {
		this.loadUnicodeInfo();
	}

	private async loadUnicodeInfo() {
		this.root = await getUnicodeInfo();
	}

	private loadTerritoryData(isoCode: string): [string[], number[]] {
		const territory = this.root.territoryInfo.territory.find(
			(t: any) => t.$.type === isoCode,
		);
		if (!territory) {
			throw new UnknownTerritory(`Unknown territory: ${isoCode}`);
		}

		const langPopulations = territory.languagePopulation;
		if (!langPopulations) {
			throw new Error(`No language data found for region: ${isoCode}`);
		}

		const languages = langPopulations.map((lang: any) => lang.$.type);
		const percentages = langPopulations.map((lang: any) =>
			asFloat(lang.$, "populationPercent"),
		);

		return this.normalizeProbabilities(languages, percentages);
	}

	private loadLanguageData(language: string): [string[], number[]] {
		const territories = this.root.territory.filter((t: any) =>
			t.languagePopulation.some((lp: any) => lp.$.type === language),
		);

		if (!territories.length) {
			throw new UnknownLanguage(
				`No region data found for language: ${language}`,
			);
		}

		const regions: string[] = [];
		const percentages: number[] = [];

		for (const terr of territories) {
			const region = terr.$.type;
			const langPop = terr.languagePopulation.find(
				(lp: any) => lp.$.type === language,
			);

			if (region && langPop) {
				regions.push(region);
				percentages.push(
					((asFloat(langPop.$, "populationPercent") *
						asFloat(terr.$, "literacyPercent")) /
						10000) *
						asFloat(terr.$, "population"),
				);
			}
		}

		if (!regions.length) {
			throw new Error(`No valid region data found for language: ${language}`);
		}

		return this.normalizeProbabilities(regions, percentages);
	}

	private normalizeProbabilities(
		languages: string[],
		freq: number[],
	): [string[], number[]] {
		const total = freq.reduce((a, b) => a + b, 0);
		return [languages, freq.map((f) => f / total)];
	}

	private weightedRandomChoice<T>(items: T[], weights: number[]): T {
		if (items.length === 0) {
			throw new Error("items must not be empty");
		}
		if (items.length !== weights.length) {
			throw new Error("items and weights must have the same length");
		}

		let total = 0;
		for (const w of weights) {
			if (w < 0) {
				throw new Error("weights must be non-negative");
			}
			total += w;
		}

		// Fallback to uniform choice if all weights are zero
		if (total === 0) {
			return items[Math.floor(Math.random() * items.length)];
		}

		const r = Math.random() * total;
		let acc = 0;

		for (let i = 0; i < items.length; i++) {
			acc += weights[i];
			if (r < acc) {
				return items[i];
			}
		}

		// Numerical edge case
		return items[items.length - 1];
	}

	fromRegion(region: string): Locale {
		const [languages, probabilities] = this.loadTerritoryData(region);
		const language = this.weightedRandomChoice(
			languages,
			probabilities,
		).replace("_", "-");
		return normalizeLocale(`${language}-${region}`);
	}

	fromLanguage(language: string): Locale {
		const [regions, probabilities] = this.loadLanguageData(language);
		const region = this.weightedRandomChoice(regions, probabilities);
		return normalizeLocale(`${language}-${region}`);
	}
}

const SELECTOR = new StatisticalLocaleSelector();
