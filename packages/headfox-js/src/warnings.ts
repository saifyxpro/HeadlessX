import path from "node:path";
import { fileURLToPath } from "node:url";
import WARNINGS_DATA from "./mappings/warnings.config.js";

const currentDir =
	import.meta.dirname ?? path.dirname(fileURLToPath(import.meta.url));

export class LeakWarning extends Error {
	constructor(message: string) {
		super(message);
		this.name = "LeakWarning";
	}

	static warn(warningKey: string, iKnowWhatImDoing?: boolean): void {
		let warning = (WARNINGS_DATA as Record<string, string>)[warningKey];
		if (iKnowWhatImDoing) {
			return;
		}
		if (iKnowWhatImDoing !== undefined) {
			warning += "\nIf this is intentional, pass `iKnowWhatImDoing=true`.";
		}

		const currentModule = currentDir;
		const originalStackTrace = Error.prepareStackTrace;
		Error.prepareStackTrace = (_, stack) => stack;
		const err = new Error();
		const stack = err.stack as unknown as NodeJS.CallSite[];
		Error.prepareStackTrace = originalStackTrace;

		for (const frame of stack) {
			const frameFileName = frame.getFileName();
			if (frameFileName && !frameFileName.startsWith(currentModule)) {
				console.warn(`${warning} at ${frameFileName}:${frame.getLineNumber()}`);
				return;
			}
		}

		console.warn(warning);
	}
}
