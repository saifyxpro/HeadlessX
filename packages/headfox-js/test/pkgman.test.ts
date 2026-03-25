import { afterEach, describe, expect, test } from "vitest";
import {
	DEFAULT_RELEASE_REPO,
	buildAssetPattern,
	parseVersionParts,
	resolveAssetName,
	resolveReleaseRepo,
	resolveReleaseTag,
} from "../src/pkgman";

describe("pkgman configuration", () => {
	afterEach(() => {
		delete process.env.HEADFOX_JS_RELEASE_REPO;
		delete process.env.CAMOUFOX_JS_RELEASE_REPO;
		delete process.env.HEADFOX_JS_RELEASE_TAG;
		delete process.env.CAMOUFOX_JS_RELEASE_TAG;
		delete process.env.HEADFOX_JS_ASSET_NAME;
		delete process.env.CAMOUFOX_JS_ASSET_NAME;
	});

	test("defaults to the official Camoufox release repo", () => {
		expect(resolveReleaseRepo()).toBe(DEFAULT_RELEASE_REPO);
	});

	test("prefers headfox env overrides over compatibility aliases", () => {
		process.env.CAMOUFOX_JS_RELEASE_REPO = "legacy/repo";
		process.env.HEADFOX_JS_RELEASE_REPO = "custom/repo";
		process.env.CAMOUFOX_JS_RELEASE_TAG = "legacy-tag";
		process.env.HEADFOX_JS_RELEASE_TAG = "custom-tag";
		process.env.CAMOUFOX_JS_ASSET_NAME = "legacy.zip";
		process.env.HEADFOX_JS_ASSET_NAME = "custom.zip";

		expect(resolveReleaseRepo()).toBe("custom/repo");
		expect(resolveReleaseTag()).toBe("custom-tag");
		expect(resolveAssetName()).toBe("custom.zip");
	});
});

describe("pkgman asset parsing", () => {
	test("matches official platform-specific asset names", () => {
		const pattern = buildAssetPattern(["camoufox", "headfox"], "lin", "x86_64");
		expect(pattern.test("camoufox-135.0.1-beta.24-lin.x86_64.zip")).toBe(true);
		expect(pattern.test("headfox-135.0.1-beta.24-lin.x86_64.zip")).toBe(true);
		expect(pattern.test("camoufox-146-beta.25.zip")).toBe(false);
	});

	test("parses version metadata from official asset names", () => {
		expect(
			parseVersionParts("camoufox-135.0.1-beta.24-lin.x86_64.zip"),
		).toEqual({
			version: "135.0.1",
			release: "beta.24",
		});
	});

	test("parses version metadata from release names for irregular assets", () => {
		expect(
			parseVersionParts("roverfox-webrtc-fix.zip", "v135.0.1-beta.24"),
		).toEqual({
			version: "135.0.1",
			release: "beta.24",
		});
	});
});
