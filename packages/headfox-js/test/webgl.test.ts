import { afterEach, describe, expect, test, vi } from "vitest";
import { WebGLFingerprintUnavailable } from "../src/exceptions";

afterEach(() => {
	vi.clearAllMocks();
	vi.resetModules();
	vi.restoreAllMocks();
});

describe("resolveWebGlLaunchConfig", () => {
	test("disables WebGL when sampling data is unavailable", async () => {
		vi.doMock("../src/webgl/sample.js", () => ({
			sampleWebGL: vi
				.fn()
				.mockRejectedValue(
					new WebGLFingerprintUnavailable("missing native sqlite binding"),
				),
		}));

		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		const { resolveWebGlLaunchConfig } = await import("../src/utils");

		const result = await resolveWebGlLaunchConfig({
			targetOS: "win",
		});

		expect(result.config).toEqual({});
		expect(result.firefoxUserPrefs).toMatchObject({
			"webgl.disabled": true,
		});
		expect(warnSpy).toHaveBeenCalledWith(
			"headfox-js(warn): WebGL fingerprint sampling is unavailable. Continuing with WebGL disabled for this launch.",
		);
	});
});
