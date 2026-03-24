import path from "node:path";
import { fileURLToPath } from "node:url";
import type BetterSqlite3 from "better-sqlite3";
import { WebGLFingerprintUnavailable } from "../exceptions.js";
import { OS_ARCH_MATRIX } from "../pkgman.js";

// Declare Bun global for runtime detection (only exists when running in Bun)
declare const Bun: unknown;

// Cached Database constructor - loaded lazily on first use
let DatabaseConstructor: typeof BetterSqlite3 | null = null;

/**
 * Opens a SQLite database using the appropriate driver for the runtime.
 * Uses bun:sqlite in Bun, better-sqlite3 in Node.js.
 * The Database constructor is cached after first load.
 */
async function openDatabase(pathName: string): Promise<BetterSqlite3.Database> {
	try {
		if (!DatabaseConstructor) {
			if (typeof Bun !== "undefined") {
				// @ts-expect-error - bun:sqlite only exists in Bun runtime
				const { Database: BunDatabase } = await import("bun:sqlite");
				DatabaseConstructor = BunDatabase;
			} else {
				const { default: NodeDatabase } = await import("better-sqlite3");
				DatabaseConstructor = NodeDatabase;
			}
		}
		if (!DatabaseConstructor) {
			throw new Error("No SQLite database constructor is available.");
		}
		return new DatabaseConstructor(pathName);
	} catch (error) {
		throw new WebGLFingerprintUnavailable(
			"WebGL fingerprint sampling data could not be loaded. Install optional SQLite support or continue with WebGL disabled.",
			{ cause: error },
		);
	}
}

// Get database path relative to this file
const currentDir =
	import.meta.dirname ?? path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(currentDir, "..", "data-files", "webgl_data.db");

interface WebGLData {
	vendor: string;
	renderer: string;
	data: string;
	win: number;
	mac: number;
	lin: number;
	webGl2Enabled: boolean;
}

export async function sampleWebGL(
	os: "win" | "mac" | "lin",
	vendor?: string,
	renderer?: string,
): Promise<WebGLData> {
	if (!OS_ARCH_MATRIX[os]) {
		throw new Error(`Invalid OS: ${os}. Must be one of: win, mac, lin`);
	}

	const db = await openDatabase(DB_PATH);
	let query = "";
	let params: any[] = [];

	if (vendor && renderer) {
		query = `SELECT vendor, renderer, data, ${os} FROM webgl_fingerprints WHERE vendor = ? AND renderer = ?`;
		params = [vendor, renderer];
	} else {
		query = `SELECT vendor, renderer, data, ${os} FROM webgl_fingerprints WHERE ${os} > 0`;
	}

	return new Promise<WebGLData>((resolve, reject) => {
		try {
			const rows: WebGLData[] = db.prepare(query).all(...params) as WebGLData[];

			if (rows.length === 0) {
				reject(new Error(`No WebGL data found for OS: ${os}`));
				return;
			}

			if (vendor && renderer) {
				const result = rows[0];
				if (!result) {
					reject(new Error(`No WebGL data found for OS: ${os}`));
					return;
				}

				const osWeight = result[os];
				if (osWeight === undefined || osWeight <= 0) {
					const pairs = db
						.prepare(
							`SELECT DISTINCT vendor, renderer FROM webgl_fingerprints WHERE ${os} > 0`,
						)
						.all();
					reject(
						new Error(
							`Vendor "${vendor}" and renderer "${renderer}" combination not valid for ${os}. Possible pairs: ${(pairs as Array<VendorRenderer>).map((pair) => `${pair.vendor}, ${pair.renderer}`).join(", ")}`,
						),
					);
					return;
				}
				resolve(JSON.parse(result.data));
			} else {
				const dataStrs = rows.map((row) => row.data);
				const probs = rows.map((row) => row[os]);
				const probsArray = probs.map(
					(p) => p / probs.reduce((a, b) => a + b, 0),
				);
				function weightedRandomChoice(weights: number[]): number {
					const sum = weights.reduce((acc, weight) => acc + weight, 0);
					const threshold = Math.random() * sum;
					let cumulativeSum = 0;

					for (let i = 0; i < weights.length; i++) {
						cumulativeSum += weights[i];
						if (cumulativeSum >= threshold) {
							return i;
						}
					}

					return weights.length - 1; // Fallback in case of rounding errors
				}

				const idx = weightedRandomChoice(probsArray);
				resolve(JSON.parse(dataStrs[idx]));
			}
		} catch (err) {
			reject(err);
		}
	}).finally(() => {
		db.close();
	});
}

interface VendorRenderer {
	vendor: string;
	renderer: string;
}

interface PossiblePairs {
	[key: string]: Array<VendorRenderer>;
}

export async function getPossiblePairs(): Promise<PossiblePairs> {
	const db = await openDatabase(DB_PATH);
	const result: PossiblePairs = {};

	return new Promise<PossiblePairs>((resolve, reject) => {
		try {
			const osTypes = Object.keys(OS_ARCH_MATRIX);

			osTypes.forEach((os_type) => {
				const rows = db
					.prepare(
						`SELECT DISTINCT vendor, renderer FROM webgl_fingerprints WHERE ${os_type} > 0 ORDER BY ${os_type} DESC`,
					)
					.all();

				result[os_type] = rows as Array<{ vendor: string; renderer: string }>;
			});

			resolve(result);
		} catch (err) {
			reject(err);
		}
	}).finally(() => {
		db.close();
	});
}
