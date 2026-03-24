import { type ChildProcess, execFileSync, spawn } from "node:child_process";
import { randomInt } from "node:crypto";
import { existsSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { globSync } from "glob";
import {
	CannotExecuteXvfb,
	CannotFindXvfb,
	VirtualDisplayNotSupported,
} from "./exceptions.js";
import { OS_NAME } from "./pkgman.js";

export class VirtualDisplay {
	private debug: boolean;
	private proc: ChildProcess | null = null;
	private _display: number | null = null;
	// private _lock = new Lock();

	constructor(debug: boolean = false) {
		this.debug = debug;
	}

	private get xvfb_args(): string[] {
		return [
			"-screen",
			"0",
			"1x1x24",
			"-ac",
			"-nolisten",
			"tcp",
			"-extension",
			"RENDER",
			"+extension",
			"GLX",
			"-extension",
			"COMPOSITE",
			"-extension",
			"XVideo",
			"-extension",
			"XVideo-MotionCompensation",
			"-extension",
			"XINERAMA",
			"-shmem",
			"-fp",
			"built-ins",
			"-nocursor",
			"-br",
		];
	}

	private get xvfb_path(): string {
		const path = execFileSync("which", ["Xvfb"]).toString().trim();
		if (!path) {
			throw new CannotFindXvfb("Please install Xvfb to use headless mode.");
		}
		if (!existsSync(path) || !execFileSync("test", ["-x", path])) {
			throw new CannotExecuteXvfb(
				`I do not have permission to execute Xvfb: ${path}`,
			);
		}
		return path;
	}

	private get xvfb_cmd(): string[] {
		return [this.xvfb_path, `:${this.display}`, ...this.xvfb_args];
	}

	private execute_xvfb(): void {
		if (this.debug) {
			console.log("Starting virtual display:", this.xvfb_cmd.join(" "));
		}
		this.proc = spawn(this.xvfb_cmd[0], this.xvfb_cmd.slice(1), {
			stdio: this.debug ? "inherit" : "ignore",
			detached: true,
		});
	}

	public get(): string {
		VirtualDisplay.assert_linux();

		// this._lock.runExclusive(() => {
		if (!this.proc) {
			this.execute_xvfb();
		} else if (this.debug) {
			console.log(`Using virtual display: ${this.display}`);
		}
		// });

		return `:${this.display}`;
	}

	public kill(): void {
		// this._lock.runExclusive(() => {
		if (this.proc && !this.proc.killed) {
			if (this.debug) {
				console.log("Terminating virtual display:", this.display);
			}
			this.proc.kill();
		}
		// });
	}

	/**
	 * Get list of lock files in /tmp
	 * @returns List of lock file paths
	 */
	public static _get_lock_files(): string[] {
		const tmpd = process.env.TMPDIR || tmpdir();
		try {
			return globSync(path.join(tmpd, ".X*-lock")).filter((p) => {
				try {
					return statSync(p).isFile();
				} catch {
					return false;
				}
			});
		} catch {
			return [];
		}
	}

	private static _free_display(): number {
		const ls = VirtualDisplay._get_lock_files().map((x) =>
			parseInt(x.split("X")[1].split("-")[0], 10),
		);
		return ls.length ? Math.max(99, Math.max(...ls) + randomInt(3, 20)) : 99;
	}

	private get display(): number {
		if (this._display === null) {
			this._display = VirtualDisplay._free_display();
		}
		return this._display;
	}

	private static assert_linux(): void {
		if (OS_NAME !== "lin") {
			throw new VirtualDisplayNotSupported(
				"Virtual display is only supported on Linux.",
			);
		}
	}
}
