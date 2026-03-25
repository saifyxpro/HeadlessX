import {
	type Browser,
	type BrowserContext,
	type BrowserType,
	firefox,
} from "playwright-core";

import { type LaunchOptions, launchOptions, syncAttachVD } from "./utils.js";
import { VirtualDisplay } from "./virtdisplay.js";

export async function Camoufox<
	UserDataDir extends string | undefined = undefined,
	ReturnType = UserDataDir extends string ? BrowserContext : Browser,
>(
	launch_options: LaunchOptions & { user_data_dir?: UserDataDir } = {},
): Promise<ReturnType> {
	return Headfox(launch_options);
}

export async function Headfox<
	UserDataDir extends string | undefined = undefined,
	ReturnType = UserDataDir extends string ? BrowserContext : Browser,
>(
	launch_options: LaunchOptions & { user_data_dir?: UserDataDir } = {},
): Promise<ReturnType> {
	const { headless, user_data_dir, ...launchOptions } = launch_options;
	return launchWithHeadfox(
		firefox,
		headless,
		{},
		user_data_dir ?? false,
		false,
		launchOptions,
	);
}

export async function NewBrowser<
	UserDataDir extends string | false = false,
	ReturnType = UserDataDir extends string ? BrowserContext : Browser,
>(
	playwright: BrowserType<Browser>,
	headless: boolean | "virtual" = false,
	fromOptions: Record<string, any> = {},
	userDataDir: UserDataDir = false as UserDataDir,
	debug: boolean = false,
	launch_options: LaunchOptions = {},
): Promise<ReturnType> {
	return launchWithHeadfox(
		playwright,
		headless,
		fromOptions,
		userDataDir,
		debug,
		launch_options,
	);
}

export async function launchWithHeadfox<
	UserDataDir extends string | false = false,
	ReturnType = UserDataDir extends string ? BrowserContext : Browser,
>(
	playwright: BrowserType<Browser>,
	headless: boolean | "virtual" = false,
	fromOptions: Record<string, any> = {},
	userDataDir: UserDataDir = false as UserDataDir,
	debug: boolean = false,
	launch_options: LaunchOptions = {},
): Promise<ReturnType> {
	let virtualDisplay: VirtualDisplay | null = null;

	// Normalize headless to boolean and prepare options for launchOptions function
	const normalizedHeadless: boolean =
		headless === "virtual" ? false : headless || false;

	if (headless === "virtual") {
		virtualDisplay = new VirtualDisplay(debug);
		launch_options.virtual_display = virtualDisplay.get();
	}

	if (!fromOptions || Object.keys(fromOptions).length === 0) {
		fromOptions = await launchOptions({
			debug,
			...launch_options,
			headless: normalizedHeadless,
		});
	}

	if (typeof userDataDir === "string") {
		const context = await playwright.launchPersistentContext(
			userDataDir,
			fromOptions,
		);
		return syncAttachVD(context, virtualDisplay);
	}

	const browser = await playwright.launch(fromOptions);
	return syncAttachVD(browser, virtualDisplay);
}
