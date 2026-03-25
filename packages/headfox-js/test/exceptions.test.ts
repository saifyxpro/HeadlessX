import { describe, expect, test } from "vitest";
import {
	CamoufoxNotInstalled,
	CannotExecuteXvfb,
	CannotFindXvfb,
	HeadfoxNotInstalled,
	InvalidAddonPath,
	InvalidDebugPort,
	InvalidLocale,
	InvalidOS,
	InvalidPropertyType,
	LocaleError,
	MissingDebugPort,
	MissingRelease,
	NonFirefoxFingerprint,
	UnknownIPLocation,
	UnknownLanguage,
	UnknownProperty,
	UnknownTerritory,
	UnsupportedArchitecture,
	UnsupportedOS,
	UnsupportedVersion,
	VirtualDisplayError,
	VirtualDisplayNotSupported,
	WebGLFingerprintUnavailable,
} from "../src/exceptions";

describe("Exception hierarchy", () => {
	test("all exceptions are Error instances", () => {
		const exceptions = [
			new UnsupportedVersion(),
			new MissingRelease(),
			new UnsupportedArchitecture(),
			new UnsupportedOS(),
			new UnknownProperty(),
			new InvalidPropertyType(),
			new InvalidAddonPath(),
			new InvalidDebugPort(),
			new MissingDebugPort(),
			new LocaleError("test"),
			new InvalidLocale(),
			new UnknownTerritory(),
			new UnknownLanguage(),
			new NonFirefoxFingerprint(),
			new InvalidOS(),
			new VirtualDisplayError(),
			new CannotFindXvfb(),
			new CannotExecuteXvfb(),
			new VirtualDisplayNotSupported(),
			new HeadfoxNotInstalled(),
			new CamoufoxNotInstalled(),
			new WebGLFingerprintUnavailable(),
		];

		for (const exc of exceptions) {
			expect(exc).toBeInstanceOf(Error);
		}
	});

	test("InvalidLocale extends LocaleError", () => {
		const exc = new InvalidLocale("test");
		expect(exc).toBeInstanceOf(LocaleError);
		expect(exc).toBeInstanceOf(Error);
	});

	test("UnknownTerritory extends InvalidLocale", () => {
		const exc = new UnknownTerritory("test");
		expect(exc).toBeInstanceOf(InvalidLocale);
		expect(exc).toBeInstanceOf(LocaleError);
	});

	test("UnknownLanguage extends InvalidLocale", () => {
		const exc = new UnknownLanguage("test");
		expect(exc).toBeInstanceOf(InvalidLocale);
		expect(exc).toBeInstanceOf(LocaleError);
	});

	test("UnknownIPLocation extends LocaleError", () => {
		const exc = new UnknownIPLocation("test");
		expect(exc).toBeInstanceOf(LocaleError);
	});

	test("VirtualDisplay errors extend VirtualDisplayError", () => {
		expect(new CannotFindXvfb()).toBeInstanceOf(VirtualDisplayError);
		expect(new CannotExecuteXvfb()).toBeInstanceOf(VirtualDisplayError);
		expect(new VirtualDisplayNotSupported()).toBeInstanceOf(
			VirtualDisplayError,
		);
	});

	test("Camoufox compatibility alias extends HeadfoxNotInstalled", () => {
		expect(new CamoufoxNotInstalled()).toBeInstanceOf(HeadfoxNotInstalled);
	});

	test("InvalidLocale.invalidInput creates proper message", () => {
		const exc = InvalidLocale.invalidInput("xyz");
		expect(exc).toBeInstanceOf(InvalidLocale);
		expect(exc.message).toContain("xyz");
		expect(exc.message).toContain("Invalid locale");
	});

	test("exceptions have correct names", () => {
		expect(new UnsupportedVersion().name).toBe("UnsupportedVersion");
		expect(new InvalidLocale().name).toBe("InvalidLocale");
		expect(new UnknownTerritory().name).toBe("UnknownTerritory");
		expect(new VirtualDisplayError().name).toBe("VirtualDisplayError");
		expect(new HeadfoxNotInstalled().name).toBe("HeadfoxNotInstalled");
		expect(new CamoufoxNotInstalled().name).toBe("CamoufoxNotInstalled");
		expect(new WebGLFingerprintUnavailable().name).toBe(
			"WebGLFingerprintUnavailable",
		);
	});

	test("exceptions use default messages when none provided", () => {
		expect(new UnsupportedVersion().message).toBeTruthy();
		expect(new MissingRelease().message).toBeTruthy();
		expect(new UnsupportedOS().message).toBeTruthy();
		expect(new InvalidOS().message).toBeTruthy();
		expect(new HeadfoxNotInstalled().message).toBeTruthy();
		expect(new CamoufoxNotInstalled().message).toBeTruthy();
		expect(new WebGLFingerprintUnavailable().message).toBeTruthy();
	});

	test("exceptions use custom messages when provided", () => {
		const msg = "custom error message";
		expect(new UnsupportedVersion(msg).message).toBe(msg);
		expect(new MissingRelease(msg).message).toBe(msg);
		expect(new InvalidOS(msg).message).toBe(msg);
	});
});
