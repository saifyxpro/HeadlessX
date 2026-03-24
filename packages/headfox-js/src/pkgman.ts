import type { PathLike } from "node:fs";
import * as fs from "node:fs";
import { chmod, readdir } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import type { Writable } from "node:stream";
import { setTimeout } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import AdmZip from "adm-zip";
import cliProgress, { type Options } from "cli-progress";
import prettyBytes from "pretty-bytes";
import { CONSTRAINTS } from "./__version__.js";
import {
	FileNotFoundError,
	HeadfoxNotInstalled,
	MissingRelease,
	UnsupportedArchitecture,
	UnsupportedOS,
	UnsupportedVersion,
} from "./exceptions.js";

const ARCH_MAP: { [key: string]: string } = {
	x64: "x86_64",
	ia32: "i686",
	arm64: "arm64",
	arm: "arm64",
};

const OS_MAP: { [key: string]: "mac" | "win" | "lin" } = {
	darwin: "mac",
	linux: "lin",
	win32: "win",
};

if (!(process.platform in OS_MAP)) {
	throw new UnsupportedOS(`OS ${process.platform} is not supported`);
}

export const OS_NAME: "mac" | "win" | "lin" = OS_MAP[process.platform];
export const DEFAULT_RELEASE_REPO = "daijro/camoufox";

function readEnvValue(...names: string[]): string | undefined {
	for (const name of names) {
		const value = process.env[name]?.trim();
		if (value) {
			return value;
		}
	}
	return undefined;
}

export function resolveReleaseRepo(): string {
	return (
		readEnvValue("HEADFOX_JS_RELEASE_REPO", "CAMOUFOX_JS_RELEASE_REPO") ??
		DEFAULT_RELEASE_REPO
	);
}

export function resolveReleaseTag(): string | undefined {
	return readEnvValue("HEADFOX_JS_RELEASE_TAG", "CAMOUFOX_JS_RELEASE_TAG");
}

export function resolveAssetName(): string | undefined {
	return readEnvValue("HEADFOX_JS_ASSET_NAME", "CAMOUFOX_JS_ASSET_NAME");
}

export function resolveAssetPrefixes(): string[] {
	return Array.from(
		new Set(
			(
				readEnvValue(
					"HEADFOX_JS_ASSET_PREFIXES",
					"CAMOUFOX_JS_ASSET_PREFIXES",
				) ?? "camoufox,headfox"
			)
				.split(",")
				.map((value) => value.trim())
				.filter(Boolean),
		),
	);
}

const CACHE_DIR_NAME =
	readEnvValue("HEADFOX_JS_CACHE_DIR", "CAMOUFOX_JS_CACHE_DIR") ?? "headfox";
const APP_BUNDLE_CANDIDATES = ["Headfox.app", "Camoufox.app"] as const;

const currentDir =
	import.meta.dirname ?? path.dirname(fileURLToPath(import.meta.url));

export const INSTALL_DIR: string = userCacheDir(CACHE_DIR_NAME);

const formatBytes = (v: number, _: Options, type: string) =>
	type === "total" || type === "value" ? prettyBytes(v) : String(v);
export const LOCAL_DATA: PathLike = path.join(currentDir, "data-files");

export const OS_ARCH_MATRIX: { [key: string]: string[] } = {
	win: ["x86_64", "i686"],
	mac: ["x86_64", "arm64"],
	lin: ["x86_64", "arm64", "i686"],
};

const LAUNCH_FILE_CANDIDATES: Record<"mac" | "win" | "lin", string[]> = {
	win: ["headfox.exe", "camoufox.exe"],
	mac: ["../MacOS/headfox", "../MacOS/camoufox"],
	lin: ["headfox-bin", "camoufox-bin"],
};

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildAssetPattern(
	prefixes: string[],
	osName: "mac" | "win" | "lin",
	arch: string,
): RegExp {
	return new RegExp(
		`(?:${prefixes.map(escapeRegex).join("|")})-(.+)-(.+)-${escapeRegex(
			osName,
		)}\\.${escapeRegex(arch)}\\.zip$`,
		"i",
	);
}

export function parseVersionParts(
	...sources: Array<string | undefined | null>
): { version: string; release: string } | null {
	const pattern = /(\d+(?:\.\d+){0,2})-((?:alpha|beta|rc)\.\d+)/i;
	for (const source of sources) {
		if (!source) {
			continue;
		}
		const match = source.match(pattern);
		if (match) {
			return {
				version: match[1],
				release: match[2].toLowerCase(),
			};
		}
	}
	return null;
}

function installMissingMessage(product = "Headfox"): string {
	return `${product} is not installed at ${INSTALL_DIR}. Please run \`headfox-js fetch\` to install.`;
}

function isInstallDirReady(): boolean {
	return fs.existsSync(INSTALL_DIR) && fs.readdirSync(INSTALL_DIR).length > 0;
}

async function chmodTree(targetPath: string, mode: number): Promise<void> {
	await chmod(targetPath, mode);
	const entries = await readdir(targetPath, { withFileTypes: true });
	for (const entry of entries) {
		const nextPath = path.join(targetPath, entry.name);
		if (entry.isDirectory()) {
			await chmodTree(nextPath, mode);
			continue;
		}
		await chmod(nextPath, mode);
	}
}

function resolveMacAppBundle(installDir: string): string {
	return (
		APP_BUNDLE_CANDIDATES.find((candidate) =>
			fs.existsSync(path.join(installDir, candidate)),
		) ?? APP_BUNDLE_CANDIDATES[0]
	);
}

function resolveLaunchBinary(installDir: string): string | null {
	const candidates = LAUNCH_FILE_CANDIDATES[OS_NAME].map((launchFile) => {
		if (OS_NAME === "mac") {
			return path.resolve(
				installDir,
				resolveMacAppBundle(installDir),
				"Contents",
				"Resources",
				launchFile,
			);
		}
		return path.join(installDir, launchFile);
	});

	return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

class Version {
	release: string;
	version?: string;
	sorted_rel: number[];

	constructor(release: string, version?: string) {
		this.release = release;
		this.version = version;
		this.sorted_rel = this.buildSortedRel();
	}

	private buildSortedRel(): number[] {
		const parts = this.release
			.split(".")
			.map((x) =>
				Number.isNaN(Number(x)) ? x.charCodeAt(0) - 1024 : Number(x),
			);
		while (parts.length < 5) {
			parts.push(0);
		}
		return parts;
	}

	get fullString(): string {
		return `${this.version}-${this.release}`;
	}

	equals(other: Version): boolean {
		return this.sorted_rel.join(".") === other.sorted_rel.join(".");
	}

	lessThan(other: Version): boolean {
		for (let i = 0; i < this.sorted_rel.length; i++) {
			if (this.sorted_rel[i] < other.sorted_rel[i]) return true;
			if (this.sorted_rel[i] > other.sorted_rel[i]) return false;
		}
		return false;
	}

	isSupported(): boolean {
		return VERSION_MIN.lessThan(this) && this.lessThan(VERSION_MAX);
	}

	static fromPath(filePath: PathLike = INSTALL_DIR): Version {
		const versionPath = path.join(filePath.toString(), "version.json");
		if (!fs.existsSync(versionPath)) {
			throw new FileNotFoundError(
				`Version information not found at ${versionPath}. Please run \`headfox-js fetch\` to install.`,
			);
		}
		const versionData = JSON.parse(fs.readFileSync(versionPath, "utf-8"));
		return new Version(versionData.release, versionData.version);
	}

	static isSupportedPath(path: PathLike): boolean {
		return Version.fromPath(path).isSupported();
	}

	static buildMinMax(): [Version, Version] {
		return [
			new Version(CONSTRAINTS.MIN_VERSION),
			new Version(CONSTRAINTS.MAX_VERSION),
		];
	}
}

const [VERSION_MIN, VERSION_MAX] = Version.buildMinMax();

type GitHubAsset = {
	name: string;
	browser_download_url: string;
};

type GitHubRelease = {
	name?: string;
	tag_name?: string;
	assets: GitHubAsset[];
};

export class GitHubDownloader {
	githubRepo: string;
	apiUrl: string;
	releaseTag?: string;

	constructor(githubRepo: string, releaseTag?: string) {
		this.githubRepo = githubRepo;
		this.releaseTag = releaseTag;
		this.apiUrl = releaseTag
			? `https://api.github.com/repos/${githubRepo}/releases/tags/${encodeURIComponent(
					releaseTag,
				)}`
			: `https://api.github.com/repos/${githubRepo}/releases`;
	}

	checkAsset(asset: GitHubAsset, _release: GitHubRelease): any {
		return asset.browser_download_url;
	}

	missingAssetError(): void {
		throw new MissingRelease(
			`Could not find a release asset in ${this.githubRepo}.`,
		);
	}

	async getAsset(
		{ retries }: { retries: number } = { retries: 5 },
	): Promise<any> {
		let attempts = 0;
		let response: Response | undefined;

		while (attempts < retries) {
			try {
				response = await fetch(this.apiUrl);
				if (response.ok) break;
			} catch (e) {
				console.error(e, `retrying (${attempts + 1}/${retries})...`);
				await setTimeout(5e3);
			}
			attempts++;
		}
		if (!response || !response.ok) {
			throw new Error(
				`Failed to fetch releases from ${this.apiUrl} after ${retries} attempts`,
			);
		}

		const releaseData = await response.json();
		const releases = Array.isArray(releaseData)
			? releaseData
			: [releaseData];

		for (const release of releases) {
			for (const asset of release.assets) {
				const data = this.checkAsset(asset, release);
				if (data) {
					return data;
				}
			}
		}

		this.missingAssetError();
	}
}

export class HeadfoxFetcher extends GitHubDownloader {
	arch: string;
	_version_obj?: Version;
	pattern: RegExp;
	_url?: string;
	assetNameOverride?: string;

	constructor() {
		super(resolveReleaseRepo(), resolveReleaseTag());
		this.arch = HeadfoxFetcher.getPlatformArch();
		this.assetNameOverride = resolveAssetName();
		this.pattern = buildAssetPattern(resolveAssetPrefixes(), OS_NAME, this.arch);
	}

	async init() {
		await this.fetchLatest();
	}

	checkAsset(asset: GitHubAsset, release: GitHubRelease): [Version, string] | null {
		if (this.assetNameOverride && asset.name !== this.assetNameOverride) {
			return null;
		}

		if (!this.assetNameOverride && !asset.name.match(this.pattern)) {
			return null;
		}

		const versionData = parseVersionParts(
			asset.name,
			release.name,
			release.tag_name,
		);
		if (!versionData) {
			if (this.assetNameOverride) {
				throw new MissingRelease(
					`Configured asset "${asset.name}" was found in ${this.githubRepo}, but headfox-js could not infer its browser version from the asset or release metadata.`,
				);
			}
			return null;
		}

		const version = new Version(versionData.release, versionData.version);
		if (!version.isSupported()) {
			if (this.assetNameOverride) {
				throw new UnsupportedVersion(
					`Configured asset "${asset.name}" resolved to unsupported browser release v${version.fullString}. Supported range: (${CONSTRAINTS.asRange()}).`,
				);
			}
			return null;
		}

		return [version, asset.browser_download_url];
	}

	missingAssetError(): void {
		const location = this.releaseTag
			? `${this.githubRepo} release tag "${this.releaseTag}"`
			: this.githubRepo;
		if (this.assetNameOverride) {
			throw new MissingRelease(
				`Could not find configured asset "${this.assetNameOverride}" in ${location}.`,
			);
		}
		throw new MissingRelease(
			`No matching release asset found in ${location} for ${OS_NAME} ${this.arch} in the supported range: (${CONSTRAINTS.asRange()}). Set HEADFOX_JS_RELEASE_TAG to pin a known working release when using custom forks.`,
		);
	}

	static getPlatformArch(): string {
		const platArch = os.arch().toLowerCase();
		if (!(platArch in ARCH_MAP)) {
			throw new UnsupportedArchitecture(
				`Architecture ${platArch} is not supported`,
			);
		}

		const arch = ARCH_MAP[platArch];
		if (!OS_ARCH_MATRIX[OS_NAME].includes(arch)) {
			throw new UnsupportedArchitecture(
				`Architecture ${arch} is not supported for ${OS_NAME}`,
			);
		}

		return arch;
	}

	async fetchLatest(): Promise<void> {
		if (this._version_obj) return;
		const releaseData = await this.getAsset();
		this._version_obj = releaseData[0];
		this._url = releaseData[1];
	}

	static async downloadFile(url: string): Promise<Buffer> {
		const response = await fetch(url);

		return Buffer.from(await response.arrayBuffer());
	}

	async extractZip(zipFile: string | Buffer): Promise<void> {
		const zip = new AdmZip(zipFile);
		zip.extractAllTo(INSTALL_DIR.toString(), true);
	}

	static cleanup(): boolean {
		if (fs.existsSync(INSTALL_DIR)) {
			fs.rmSync(INSTALL_DIR, { recursive: true });
			return true;
		}
		return false;
	}

	setVersion(): void {
		fs.writeFileSync(
			path.join(INSTALL_DIR.toString(), "version.json"),
			JSON.stringify({ version: this.version, release: this.release }),
		);
	}

	async install(): Promise<void> {
		await this.init();
		HeadfoxFetcher.cleanup();
		try {
			fs.mkdirSync(INSTALL_DIR, { recursive: true });

			const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "headfox-"));
			const tempFilePath = path.join(tempDir, "headfox.zip");
			const tempFileStream = fs.createWriteStream(tempFilePath);

			await webdl(this.url, "Downloading Headfox...", true, tempFileStream);
			await new Promise((r) => tempFileStream.close(r));

			await this.extractZip(tempFilePath);
			this.setVersion();

			if (OS_NAME !== "win") {
				await chmodTree(INSTALL_DIR, 0o755);
			}

			console.log("Headfox successfully installed.");
		} catch (e) {
			console.error(`Error installing Headfox: ${e}`);
			HeadfoxFetcher.cleanup();
			throw e;
		}
	}

	get url(): string {
		if (!this._url) {
			throw new Error(
				"Url is not available. Make sure to run fetchLatest first.",
			);
		}
		return this._url;
	}

	get version(): string {
		if (!this._version_obj || !this._version_obj.version) {
			throw new Error(
				"Version is not available. Make sure to run fetchLatest first.",
			);
		}
		return this._version_obj.version;
	}

	get release(): string {
		if (!this._version_obj) {
			throw new Error(
				"Release information is not available. Make sure to run the installation first.",
			);
		}
		return this._version_obj.release;
	}

	get verstr(): string {
		if (!this._version_obj) {
			throw new Error(
				"Version is not available. Make sure to run the installation first.",
			);
		}
		return this._version_obj.fullString;
	}
}

function userCacheDir(appName: string): string {
	if (OS_NAME === "win") {
		return path.join(
			os.homedir(),
			"AppData",
			"Local",
			appName,
			appName,
			"Cache",
		);
	} else if (OS_NAME === "mac") {
		return path.join(os.homedir(), "Library", "Caches", appName);
	} else {
		return path.join(os.homedir(), ".cache", appName);
	}
}

export function installedVerStr(): string {
	return Version.fromPath(getInstalledBrowserDir()).fullString;
}

export function isBrowserInstalled(): boolean {
	if (!isInstallDirReady()) {
		return false;
	}

	try {
		return Version.isSupportedPath(INSTALL_DIR);
	} catch {
		return false;
	}
}

export async function ensureBrowserInstalled(): Promise<string> {
	if (isBrowserInstalled()) {
		return INSTALL_DIR;
	}

	const fetcher = new HeadfoxFetcher();
	await fetcher.install();
	return getInstalledBrowserDir();
}

export function getInstalledBrowserDir(): string {
	if (!isInstallDirReady()) {
		throw new HeadfoxNotInstalled(installMissingMessage());
	}

	if (!Version.isSupportedPath(INSTALL_DIR)) {
		throw new UnsupportedVersion("The installed Headfox binary is outdated.");
	}

	return INSTALL_DIR;
}

export function headfoxPath(downloadIfMissing: boolean = false): string {
	if (downloadIfMissing) {
		throw new Error(
			"headfoxPath() no longer performs background installs. Await `ensureBrowserInstalled()` or call `launchOptions()` / `Headfox()` instead.",
		);
	}

	return getInstalledBrowserDir();
}

export const camoufoxPath = headfoxPath;
export const CamoufoxFetcher = HeadfoxFetcher;

export function getPath(file: string): string {
	const installDir = headfoxPath();
	if (OS_NAME === "mac") {
		return path.resolve(
			installDir,
			resolveMacAppBundle(installDir),
			"Contents",
			"Resources",
			file,
		);
	}
	return path.join(installDir, file);
}

export function launchPath(): string {
	const installDir = headfoxPath();
	const executablePath = resolveLaunchBinary(installDir);
	if (!executablePath) {
		throw new HeadfoxNotInstalled(installMissingMessage("Headfox"));
	}

	return executablePath;
}

export async function webdl(
	url: string,
	desc: string = "",
	bar: boolean = true,
	buffer: Writable | null = null,
	{ retries }: { retries: number } = { retries: 5 },
): Promise<Buffer> {
	let attempts = 0;
	let response: Response | undefined;

	while (attempts < retries) {
		try {
			response = await fetch(url);
			if (response.ok) break;
		} catch (e) {
			console.error(e, `retrying (${attempts + 1}/${retries})...`);
			await setTimeout(5e3);
		}
		attempts++;
	}

	if (!response || !response.ok) {
		throw new Error(`Failed to download from ${url} after ${retries} attempts`);
	}

	const totalSize = parseInt(response.headers.get("content-length") || "0", 10);
	let progressBar: cliProgress.SingleBar | null = null;
	if (bar && totalSize > 0) {
		progressBar = new cliProgress.SingleBar(
			{
				format: `${desc} [{bar}] {percentage}% | ETA: {eta_formatted} | {value}/{total}`,
				formatValue: formatBytes,
				noTTYOutput: true,
			},
			cliProgress.Presets.shades_classic,
		);
		progressBar.start(totalSize, 0);
	}

	const chunks: Uint8Array[] = [];
	try {
		if (!response.body) {
			throw new Error(`Response body was empty while downloading ${desc}`);
		}

		for await (const chunk of response.body) {
			if (buffer) {
				buffer.write(chunk);
			} else {
				chunks.push(chunk);
			}
			if (progressBar) {
				progressBar.increment(chunk.length);
			}
		}
	} finally {
		progressBar?.stop();
	}

	return Buffer.concat(chunks);
}

export async function unzip(
	zipFile: Buffer,
	extractPath: string,
	desc?: string,
	bar: boolean = true,
): Promise<void> {
	const zip = new AdmZip(zipFile);
	const zipEntries = zip.getEntries();

	if (bar) {
		console.log(desc || "Extracting files...");
	}

	for (const entry of zipEntries) {
		if (bar) {
			console.log(`Extracting ${entry.entryName}`);
		}
		zip.extractEntryTo(entry, extractPath, false, true);
	}

	if (bar) {
		console.log("Extraction complete.");
	}
}
