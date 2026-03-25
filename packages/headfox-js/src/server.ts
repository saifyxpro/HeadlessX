import { type BrowserServer, firefox } from "playwright-core";
import { InvalidDebugPort } from "./exceptions.js";
import { type LaunchOptions, launchOptions } from "./utils.js";

function assertValidServerOptions(port?: number, wsPath?: string): void {
	if (
		port !== undefined &&
		(!Number.isInteger(port) || port < 1 || port > 65535)
	) {
		throw new InvalidDebugPort(
			`Headfox server port must be an integer between 1 and 65535. Received: ${port}`,
		);
	}

	if (wsPath && !wsPath.startsWith("/")) {
		throw new Error(
			`Headfox server ws_path must start with "/". Received: ${wsPath}`,
		);
	}
}

export async function launchHeadfoxServer({
	port,
	ws_path,
	...options
}:
	| LaunchOptions
	| { port?: number; ws_path?: string }): Promise<BrowserServer> {
	// Extract and normalize headless (virtual is treated as true for server mode)
	const { headless, ...restOptions } = options as LaunchOptions;
	const normalizedHeadless: boolean | undefined =
		headless === "virtual" ? true : headless;

	assertValidServerOptions(port, ws_path);

	return firefox.launchServer({
		...(await launchOptions({ ...restOptions, headless: normalizedHeadless })),
		port,
		wsPath: ws_path,
	});
}

export const launchServer = launchHeadfoxServer;
