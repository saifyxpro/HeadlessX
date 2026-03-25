import { afterEach, describe, expect, test } from "vitest";
import { getAsBooleanFromENV } from "../src/utils";

describe("getAsBooleanFromENV", () => {
	afterEach(() => {
		// Clean up env vars
		delete process.env.TEST_BOOL_VAR;
	});

	test("returns true for truthy env value", () => {
		process.env.TEST_BOOL_VAR = "1";
		expect(getAsBooleanFromENV("TEST_BOOL_VAR")).toBe(true);
	});

	test("returns true for non-empty string", () => {
		process.env.TEST_BOOL_VAR = "yes";
		expect(getAsBooleanFromENV("TEST_BOOL_VAR")).toBe(true);
	});

	test("returns false for '0'", () => {
		process.env.TEST_BOOL_VAR = "0";
		expect(getAsBooleanFromENV("TEST_BOOL_VAR")).toBe(false);
	});

	test("returns false for 'false'", () => {
		process.env.TEST_BOOL_VAR = "false";
		expect(getAsBooleanFromENV("TEST_BOOL_VAR")).toBe(false);
	});

	test("returns default value when env var not set", () => {
		expect(getAsBooleanFromENV("TEST_BOOL_VAR", true)).toBe(true);
		expect(getAsBooleanFromENV("TEST_BOOL_VAR", false)).toBe(false);
	});

	test("returns false when env var not set and no default", () => {
		expect(getAsBooleanFromENV("TEST_BOOL_VAR")).toBe(false);
	});
});
