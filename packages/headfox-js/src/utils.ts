// from browserforge.fingerprints import Fingerprint, Screen
// from screeninfo import get_monitors
// from ua_parser import user_agent_parser

import { type PathLike, readFileSync } from "node:fs";
import path from "node:path";
import type {
	Fingerprint,
	FingerprintGeneratorOptions,
} from "fingerprint-generator";
import type { LaunchOptions as PlaywrightLaunchOptions } from "playwright-core";
import { UAParser } from "ua-parser-js";
import {
	addDefaultAddons,
	confirmPaths,
	type DefaultAddons,
} from "./addons.js";
import {
	InvalidOS,
	InvalidPropertyType,
	NonFirefoxFingerprint,
	UnknownProperty,
	WebGLFingerprintUnavailable,
} from "./exceptions.js";
import {
	fromBrowserforge,
	generateFingerprint,
	SUPPORTED_OS,
} from "./fingerprints.js";
import { publicIP, validIPv4, validIPv6 } from "./ip.js";
import { geoipAllowed, getGeolocation, handleLocales } from "./locale.js";
import FONTS from "./mappings/fonts.config.js";
import {
	ensureBrowserInstalled,
	getPath,
	installedVerStr,
	launchPath,
	OS_NAME,
} from "./pkgman.js";
import type { VirtualDisplay } from "./virtdisplay.js";
import { LeakWarning } from "./warnings.js";
import { sampleWebGL } from "./webgl/sample.js";

type Screen = FingerprintGeneratorOptions["screen"];

// Headfox preferences to cache previous pages and requests
const CACHE_PREFS = {
	"browser.sessionhistory.max_entries": 10,
	"browser.sessionhistory.max_total_viewers": -1,
	"browser.cache.memory.enable": true,
	"browser.cache.disk_cache_ssl": true,
	"browser.cache.disk.smart_size.enabled": true,
};

function getEnvVars(configMap: ConfigMap, userAgentOS: string): EnvVars {
	const envVars: EnvVars = {};
	let updatedConfigData: Uint8Array;

	try {
		updatedConfigData = new TextEncoder().encode(JSON.stringify(configMap));
	} catch (e) {
		console.error(`Error updating config: ${e}`);
		process.exit(1);
	}

	const chunkSize = OS_NAME === "win" ? 2047 : 32767;
	const configStr = new TextDecoder().decode(updatedConfigData);

	for (let i = 0; i < configStr.length; i += chunkSize) {
		const chunk = configStr.slice(i, i + chunkSize);
		// The Python engine still reads the legacy CAMOU_CONFIG_* names.
		const envName = `CAMOU_CONFIG_${Math.floor(i / chunkSize) + 1}`;
		try {
			envVars[envName] = chunk;
		} catch (e) {
			console.error(`Error setting ${envName}: ${e}`);
			process.exit(1);
		}
	}

	if (OS_NAME === "lin") {
		const fontconfigPath = getPath(path.join("fontconfig", userAgentOS));
		envVars.FONTCONFIG_PATH = fontconfigPath;
	}

	return envVars;
}

export function getAsBooleanFromENV(
	name: string,
	defaultValue?: boolean | undefined,
): boolean {
	const value = process.env[name];
	if (value === "false" || value === "0") return false;
	if (value) return true;
	return !!defaultValue;
}

interface Property {
	property: string;
	type: string;
}

function loadProperties(filePath?: PathLike): Record<string, string> {
	let propFile: string;
	filePath = filePath?.toString();
	if (filePath) {
		propFile = path.join(path.dirname(filePath), "properties.json");
	} else {
		propFile = getPath("properties.json");
	}

	const propData = readFileSync(propFile).toString();
	const propDict: Property[] = JSON.parse(propData);

	return propDict.reduce(
		(acc, prop) => {
			acc[prop.property] = prop.type;
			return acc;
		},
		{} as Record<string, string>,
	);
}

interface ConfigMap {
	[key: string]: string;
}

interface EnvVars {
	[key: string]: string | number | boolean;
}

function validateConfig(
	configMap: Record<string, string>,
	path?: PathLike,
): void {
	const propertyTypes = loadProperties(path);

	for (const [key, value] of Object.entries(configMap)) {
		const expectedType = propertyTypes[key];
		if (!expectedType) {
			throw new UnknownProperty(`Unknown property ${key} in config`);
		}

		if (!validateType(value, expectedType)) {
			throw new InvalidPropertyType(
				`Invalid type for property ${key}. Expected ${expectedType}, got ${typeof value}`,
			);
		}
	}
}

function validateType(value: any, expectedType: string): boolean {
	switch (expectedType) {
		case "str":
			return typeof value === "string";
		case "int":
			return Number.isInteger(value);
		case "uint":
			return Number.isInteger(value) && value >= 0;
		case "double":
			return typeof value === "number";
		case "bool":
			return typeof value === "boolean";
		case "array":
			return Array.isArray(value);
		case "dict":
			return (
				typeof value === "object" && value !== null && !Array.isArray(value)
			);
		default:
			return false;
	}
}

function getTargetOS(config: Record<string, any>): "mac" | "win" | "lin" {
	if (config["navigator.userAgent"]) {
		return determineUAOS(config["navigator.userAgent"]);
	}
	return OS_NAME as "mac" | "win" | "lin";
}

function determineUAOS(userAgent: string): "mac" | "win" | "lin" {
	const parser = new UAParser(userAgent);
	const parsedUA = parser.getOS().name;
	if (!parsedUA) {
		throw new Error("Could not determine OS from user agent");
	}
	if (parsedUA.startsWith("macOS")) {
		return "mac";
	}
	if (parsedUA.startsWith("Windows")) {
		return "win";
	}
	return "lin";
}

function getScreenCons(headless?: boolean): Screen | undefined {
	if (headless === false) {
		return undefined;
	}
	// TODO - Implement getMonitors
	// try {
	//     const monitors = getMonitors();
	//     if (!monitors.length) {
	//         return undefined;
	//     }
	//     const monitor = monitors.reduce((prev, curr) => (prev.width * prev.height > curr.width * curr.height ? prev : curr));
	//     return { maxWidth: monitor.width, maxHeight: monitor.height };
	// } catch {
	//     return undefined;
	// }

	return undefined;
}

interface WebGlLaunchConfig {
	config: Record<string, any>;
	firefoxUserPrefs: Record<string, any>;
}

export async function resolveWebGlLaunchConfig({
	targetOS,
	block_webgl,
	allow_webgl,
	webgl_config,
	i_know_what_im_doing,
}: {
	targetOS: "mac" | "win" | "lin";
	block_webgl?: boolean;
	allow_webgl?: boolean;
	webgl_config?: [string, string];
	i_know_what_im_doing?: boolean;
}): Promise<WebGlLaunchConfig> {
	const firefoxUserPrefs: Record<string, any> = {};

	if (block_webgl || allow_webgl === false) {
		firefoxUserPrefs["webgl.disabled"] = true;
		LeakWarning.warn("block_webgl", i_know_what_im_doing);
		return {
			config: {},
			firefoxUserPrefs,
		};
	}

	try {
		const webglFingerprint = webgl_config
			? await sampleWebGL(targetOS, ...webgl_config)
			: await sampleWebGL(targetOS);
		const { webGl2Enabled, ...webGlConfig } = webglFingerprint;

		return {
			config: webGlConfig,
			firefoxUserPrefs: {
				"webgl.enable-webgl2": webGl2Enabled,
				"webgl.force-enabled": true,
			},
		};
	} catch (error) {
		if (!(error instanceof WebGLFingerprintUnavailable)) {
			throw error;
		}

		firefoxUserPrefs["webgl.disabled"] = true;
		console.warn(
			"headfox-js(warn): WebGL fingerprint sampling is unavailable. Continuing with WebGL disabled for this launch.",
		);

		return {
			config: {},
			firefoxUserPrefs,
		};
	}
}

function updateFonts(
	config: Record<string, any>,
	targetOS: "mac" | "win" | "lin",
): void {
	const fonts = FONTS[targetOS];

	if (config.fonts) {
		config.fonts = Array.from(new Set([...fonts, ...config.fonts]));
	} else {
		config.fonts = fonts;
	}
}

function checkCustomFingerprint(fingerprint: Fingerprint): void {
	const parser = new UAParser(fingerprint.navigator.userAgent);
	const browserName = parser.getBrowser().name || "Non-Firefox";
	if (browserName !== "Firefox") {
		throw new NonFirefoxFingerprint(
			`"${browserName}" fingerprints are not supported in Headfox. Using fingerprints from a browser other than Firefox will lead to detection. If this is intentional, pass i_know_what_im_doing=true.`,
		);
	}
	LeakWarning.warn("custom_fingerprint", false);
}

function validateOS(
	os?: (typeof SUPPORTED_OS)[number] | (typeof SUPPORTED_OS)[number][],
): (typeof SUPPORTED_OS)[number][] | undefined {
	if (!os) return undefined;

	if (Array.isArray(os)) {
		os.every(validateOS);
		return [...os];
	}

	if (!SUPPORTED_OS.includes(os)) {
		throw new InvalidOS(`Headfox does not support the OS: '${os}'`);
	}

	return [os];
}

function _cleanLocals(data: Record<string, any>): Record<string, any> {
	delete data.playwright;
	delete data.persistentContext;
	return data;
}

function mergeInto(
	target: Record<string, any>,
	source: Record<string, any>,
): void {
	Object.entries(source).forEach(([key, value]) => {
		if (!(key in target)) {
			target[key] = value;
		}
	});
}

function setInto(target: Record<string, any>, key: string, value: any): void {
	if (!(key in target)) {
		target[key] = value;
	}
}

function isDomainSet(
	config: Record<string, any>,
	...properties: string[]
): boolean {
	return properties.some((prop) => {
		if (prop.endsWith(".") || prop.endsWith(":")) {
			return Object.keys(config).some((key) => key.startsWith(prop));
		}
		return prop in config;
	});
}

function warnManualConfig(config: Record<string, any>): void {
	if (
		isDomainSet(
			config,
			"navigator.language",
			"navigator.languages",
			"headers.Accept-Language",
			"locale:",
		)
	) {
		LeakWarning.warn("locale", false);
	}
	if (isDomainSet(config, "geolocation:", "timezone")) {
		LeakWarning.warn("geolocation", false);
	}
	if (isDomainSet(config, "headers.User-Agent")) {
		LeakWarning.warn("header-ua", false);
	}
	if (isDomainSet(config, "navigator.")) {
		LeakWarning.warn("navigator", false);
	}
	if (isDomainSet(config, "screen.", "window.", "document.body.")) {
		LeakWarning.warn("viewport", false);
	}
}

async function _asyncAttachVD(
	browser: any,
	virtualDisplay?: VirtualDisplay,
): Promise<any> {
	if (!virtualDisplay) {
		return browser;
	}

	const originalClose = browser.close;

	browser.close = async (...args: any[]) => {
		await originalClose.apply(browser, ...args);
		if (virtualDisplay) {
			virtualDisplay.kill();
		}
	};

	browser._virtualDisplay = virtualDisplay;

	return browser;
}

export function syncAttachVD(
	browser: any,
	virtualDisplay?: VirtualDisplay | null,
): any {
	/**
	 * Attaches the virtual display to the sync browser cleanup
	 */
	if (!virtualDisplay) {
		// Skip if no virtual display is provided
		return browser;
	}

	const originalClose = browser.close;

	browser.close = (...args: any[]) => {
		originalClose.apply(browser, ...args);
		if (virtualDisplay) {
			virtualDisplay.kill();
		}
	};

	browser._virtualDisplay = virtualDisplay;

	return browser;
}

export interface LaunchOptions {
	/** Operating system to use for the fingerprint generation.
	 * Can be "windows", "macos", "linux", or a list to randomly choose from.
	 * Default: ["windows", "macos", "linux"]
	 */
	os?: (typeof SUPPORTED_OS)[number] | (typeof SUPPORTED_OS)[number][];

	/** Whether to block all images. */
	block_images?: boolean;

	/** Whether to block WebRTC entirely. */
	block_webrtc?: boolean;

	/** Whether to block WebGL. To prevent leaks, only use this for special cases. */
	block_webgl?: boolean;

	/** Disables the Cross-Origin-Opener-Policy, allowing elements in cross-origin iframes to be clicked. */
	disable_coop?: boolean;

	/** Calculate longitude, latitude, timezone, country, & locale based on the IP address.
	 * Pass the target IP address to use, or `true` to find the IP address automatically.
	 */
	geoip?: string | boolean;

	/** Humanize the cursor movement.
	 * Takes either `true`, or the MAX duration in seconds of the cursor movement.
	 * The cursor typically takes up to 1.5 seconds to move across the window.
	 */
	humanize?: boolean | number;

	/** Locale(s) to use. The first listed locale will be used for the Intl API. */
	locale?: string | string[];

	/** List of Firefox addons to use. */
	addons?: string[];

	/** Fonts to load into the browser (in addition to the default fonts for the target `os`).
	 * Takes a list of font family names that are installed on the system.
	 */
	fonts?: string[];

	/** If enabled, OS-specific system fonts will not be passed to the browser. */
	custom_fonts_only?: boolean;

	/** Default addons to exclude. Passed as a list of `DefaultAddons` enums. */
	exclude_addons?: (keyof typeof DefaultAddons)[];

	/** Constrains the screen dimensions of the generated fingerprint. */
	screen?: Screen;

	/** Set a fixed window size instead of generating a random one. */
	window?: [number, number];

	/** Use a custom BrowserForge fingerprint. If not provided, a random fingerprint will be generated
	 * based on the provided `os` & `screen` constraints.
	 */
	fingerprint?: Fingerprint;

	/** Firefox version to use. Defaults to the current Headfox version.
	 * To prevent leaks, only use this for special cases.
	 */
	ff_version?: number;

	/** Whether to run the browser in headless mode. Defaults to `false`.
	 * Can be `true`, `false`, or `"virtual"` to use a virtual display.
	 */
	headless?: boolean | "virtual";

	/** Whether to enable running scripts in the main world.
	 * To use this, prepend "mw:" to the script: `page.evaluate("mw:" + script)`.
	 */
	main_world_eval?: boolean;

	/** Custom browser executable path. */
	executable_path?: string | PathLike;

	/** Firefox user preferences to set. */
	firefox_user_prefs?: Record<string, any>;

	/** Proxy to use for the browser.
	 * Note: If `geoip` is `true`, a request will be sent through this proxy to find the target IP.
	 */
	proxy?: string | PlaywrightLaunchOptions["proxy"];

	/** Cache previous pages, requests, etc. (uses more memory). */
	enable_cache?: boolean;

	/** Arguments to pass to the browser. */
	args?: string[];

	/** Environment variables to set. */
	env?: Record<string, string | number | boolean>;

	/** Prints the config being sent to Headfox. */
	debug?: boolean;

	/** Virtual display number. Example: `":99"`. This is handled by Headfox and the legacy AsyncCamoufox flow. */
	virtual_display?: string;

	/** Use a specific WebGL vendor/renderer pair. Passed as a tuple of `[vendor, renderer]`. */
	webgl_config?: [string, string];

	/** Additional Firefox launch options. */
	[key: string]: any;
}

/**
 * Convert a Playwright proxy string to a URL object.
 *
 * Implementation from https://github.com/microsoft/playwright/blob/3873b72ac1441ca691f7594f0ed705bd84518f93/packages/playwright-core/src/server/browserContext.ts#L737-L747
 */
function getProxyUrl(
	proxy: PlaywrightLaunchOptions["proxy"] | string,
): URL | null {
	if (!proxy) return null;

	if (typeof proxy === "string") {
		return new URL(proxy);
	}

	const { server, username, password } = proxy;
	let url;
	try {
		// new URL('127.0.0.1:8080') throws
		// new URL('localhost:8080') fails to parse host or protocol
		// In both of these cases, we need to try re-parse URL with `http://` prefix.
		url = new URL(server);
		if (!url.host || !url.protocol) url = new URL(`http://${server}`);
	} catch (_e) {
		url = new URL(`http://${server}`);
	}

	if (username) url.username = username;
	if (password) url.password = password;

	return url;
}

/**
 * Prepare launch options for Playwright's Firefox browser.
 *
 * Note: This function only accepts `boolean` for the `headless` parameter.
 * Callers must normalize `"virtual"` to `boolean` before calling this function.
 * The virtual display setup is handled separately in the calling function.
 */
export async function launchOptions({
	config,
	os,
	block_images,
	block_webrtc,
	block_webgl,
	disable_coop,
	webgl_config,
	geoip,
	humanize,
	locale,
	addons,
	fonts,
	custom_fonts_only,
	exclude_addons,
	screen,
	window,
	fingerprint,
	ff_version,
	headless,
	main_world_eval,
	executable_path,
	firefox_user_prefs,
	proxy,
	enable_cache,
	args,
	env,
	i_know_what_im_doing,
	debug,
	virtual_display,
	...launch_options
}: Omit<LaunchOptions, "headless"> & {
	headless?: boolean;
}): Promise<Record<string, any>> {
	// Build the config
	if (!config) {
		config = {};
	}

	// Set default values for optional arguments
	const headlessBoolean = headless ?? false;
	if (!addons) {
		addons = [];
	}
	if (!args) {
		args = [];
	}
	if (!firefox_user_prefs) {
		firefox_user_prefs = {};
	}
	if (custom_fonts_only === undefined) {
		custom_fonts_only = false;
	}
	if (i_know_what_im_doing === undefined) {
		i_know_what_im_doing = false;
	}
	if (!env) {
		env = process.env as Record<string, string | number | boolean>;
	}
	if (typeof executable_path === "string") {
		// Convert executable path to a Path object
		executable_path = path.resolve(executable_path);
	} else {
		await ensureBrowserInstalled();
	}

	// Handle virtual display
	if (virtual_display) {
		env.DISPLAY = virtual_display;
	}

	// Warn the user for manual config settings
	if (!i_know_what_im_doing) {
		warnManualConfig(config);
	}

	const operatingSystems = validateOS(os);

	// webgl_config requires OS to be set
	if (!operatingSystems && webgl_config) {
		throw new Error("OS must be set when using webgl_config");
	}

	// Add the default addons
	await addDefaultAddons(addons, exclude_addons);

	// Confirm all addon paths are valid
	if (addons.length > 0) {
		confirmPaths(addons);
		config.addons = addons;
	}

	// Get the Firefox version
	let ff_version_str: string;
	if (ff_version) {
		ff_version_str = ff_version.toString();
		LeakWarning.warn("ff_version", i_know_what_im_doing);
	} else {
		try {
			ff_version_str = installedVerStr().split(".", 1)[0];
		} catch (error) {
			if (executable_path) {
				throw new Error(
					"Unable to infer the Firefox version for a custom executable path. Pass `ff_version` explicitly or install the managed browser with `headfox-js fetch`.",
					{ cause: error },
				);
			}
			await ensureBrowserInstalled();
			ff_version_str = installedVerStr().split(".", 1)[0];
		}
	}

	// Generate a fingerprint
	if (!fingerprint) {
		fingerprint = generateFingerprint(window, {
			screen: screen || getScreenCons(headlessBoolean || "DISPLAY" in env),
			operatingSystems,
		});
	} else {
		// Or use the one passed by the user
		if (!i_know_what_im_doing) {
			checkCustomFingerprint(fingerprint);
		}
	}

	// Inject the fingerprint into the config
	mergeInto(config, fromBrowserforge(fingerprint, ff_version_str));

	const targetOS = getTargetOS(config);

	// Set a random window.history.length
	setInto(config, "window.history.length", Math.floor(Math.random() * 5) + 1);

	// Update fonts list
	if (fonts) {
		config.fonts = fonts;
	}

	if (custom_fonts_only) {
		firefox_user_prefs["gfx.bundled-fonts.activate"] = 0;
		if (fonts) {
			// The user has passed their own fonts, and OS fonts are disabled.
			LeakWarning.warn("custom_fonts_only");
		} else {
			// OS fonts are disabled, and the user has not passed their own fonts either.
			throw new Error(
				"No custom fonts were passed, but `custom_fonts_only` is enabled.",
			);
		}
	} else {
		updateFonts(config, targetOS);
	}

	// Set a fixed font spacing seed
	setInto(
		config,
		"fonts:spacing_seed",
		Math.floor(Math.random() * 1_073_741_824),
	);

	// Handle proxy
	const proxyUrl = getProxyUrl(proxy);

	// Set geolocation
	if (geoip) {
		geoipAllowed();

		// Find the user's IP address
		geoip = await publicIP(proxyUrl?.href);

		// Spoof WebRTC if not blocked
		if (!block_webrtc) {
			if (validIPv4(geoip)) {
				setInto(config, "webrtc:ipv4", geoip);
				firefox_user_prefs["network.dns.disableIPv6"] = true;
			} else if (validIPv6(geoip)) {
				setInto(config, "webrtc:ipv6", geoip);
			}
		}

		const geolocation = await getGeolocation(geoip);
		config = { ...config, ...geolocation.asConfig() };
	}

	// Raise a warning when a proxy is being used without spoofing geolocation.
	// This is a very bad idea; the warning cannot be ignored with i_know_what_im_doing.
	if (
		proxyUrl &&
		!proxyUrl.hostname.includes("localhost") &&
		!isDomainSet(config, "geolocation:")
	) {
		LeakWarning.warn("proxy_without_geoip");
	}

	// Set locale
	if (locale) {
		handleLocales(locale, config);
	}

	// Pass the humanize option
	if (humanize) {
		setInto(config, "humanize", true);
		if (typeof humanize === "number") {
			setInto(config, "humanize:maxTime", humanize);
		}
	}

	// Enable the main world context creation
	if (main_world_eval) {
		setInto(config, "allowMainWorld", true);
	}

	// Set Firefox user preferences
	if (block_images) {
		LeakWarning.warn("block_images", i_know_what_im_doing);
		firefox_user_prefs["permissions.default.image"] = 2;
	}
	if (block_webrtc) {
		firefox_user_prefs["media.peerconnection.enabled"] = false;
	}
	if (disable_coop) {
		LeakWarning.warn("disable_coop", i_know_what_im_doing);
		firefox_user_prefs["browser.tabs.remote.useCrossOriginOpenerPolicy"] =
			false;
	}

	const webglLaunchConfig = await resolveWebGlLaunchConfig({
		targetOS,
		block_webgl,
		allow_webgl: launch_options.allow_webgl,
		webgl_config,
		i_know_what_im_doing,
	});
	mergeInto(config, webglLaunchConfig.config);
	mergeInto(firefox_user_prefs, webglLaunchConfig.firefoxUserPrefs);

	// Canvas anti-fingerprinting
	mergeInto(config, {
		"canvas:aaOffset": Math.floor(Math.random() * 101) - 50, // nosec
		"canvas:aaCapOffset": true,
	});

	// Cache previous pages, requests, etc (uses more memory)
	if (enable_cache) {
		mergeInto(firefox_user_prefs, CACHE_PREFS);
	}

	// Print the config if debug is enabled
	if (debug) {
		console.debug("[DEBUG] Config:");
		console.debug(config);
	}

	// Validate the config
	validateConfig(config, executable_path);

	// Prepare environment variables to pass to Headfox.
	const env_vars = {
		...getEnvVars(config, targetOS),
		...process.env,
		...env,
	};

	// Prepare the executable path
	if (executable_path) {
		executable_path = executable_path.toString();
	} else {
		executable_path = launchPath();
	}

	const out: PlaywrightLaunchOptions = {
		executablePath: executable_path,
		args: args,
		env: env_vars as any,
		firefoxUserPrefs: firefox_user_prefs,
		proxy: proxyUrl
			? {
					server: proxyUrl.origin,
					username: proxyUrl.username,
					password: proxyUrl.password,
					bypass: typeof proxy === "string" ? undefined : proxy?.bypass,
				}
			: undefined,
		headless: headlessBoolean,
		...launch_options,
	};

	return out;
}
