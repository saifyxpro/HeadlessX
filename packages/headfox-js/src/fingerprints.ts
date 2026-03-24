import {
	type Fingerprint,
	FingerprintGenerator,
	type FingerprintGeneratorOptions,
	type ScreenFingerprint,
} from "fingerprint-generator";
import BROWSERFORGE_DATA from "./mappings/browserforge.config.js";

export const SUPPORTED_OS = ["linux", "macos", "windows"] as const;

const FP_GENERATOR = new FingerprintGenerator({
	browsers: ["firefox"],
	operatingSystems: SUPPORTED_OS as any,
});

function randrange(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface ExtendedScreen extends ScreenFingerprint {
	screenY?: number;
}

function _castToProperties(
	camoufoxData: Record<string, any>,
	castEnum: Record<string, any>,
	bfDict: Record<string, any>,
	ffVersion?: string,
): void {
	for (let [key, data] of Object.entries(bfDict)) {
		if (!data) continue;
		const typeKey = castEnum[key];
		if (!typeKey) continue;
		if (typeof data === "object" && !Array.isArray(data)) {
			_castToProperties(camoufoxData, typeKey, data, ffVersion);
			continue;
		}
		if (typeKey.startsWith("screen.") && typeof data === "number" && data < 0) {
			data = 0;
		}
		if (ffVersion && typeof data === "string") {
			data = data.replaceAll(
				/(?<!\d)(1[0-9]{2})(\.0)(?!\d)/gi,
				`${ffVersion}$2`,
			);
		}
		camoufoxData[typeKey] = data;
	}
}

function handleScreenXY(
	camoufoxData: Record<string, any>,
	fpScreen: ScreenFingerprint,
): void {
	if ("window.screenY" in camoufoxData) return;
	const screenX = fpScreen.screenX;
	if (!screenX) {
		camoufoxData["window.screenX"] = 0;
		camoufoxData["window.screenY"] = 0;
		return;
	}
	if (screenX >= -50 && screenX <= 50) {
		camoufoxData["window.screenY"] = screenX;
		return;
	}
	const screenY = fpScreen.availHeight - fpScreen.outerHeight;
	if (screenY === 0) {
		camoufoxData["window.screenY"] = 0;
	} else if (screenY > 0) {
		camoufoxData["window.screenY"] = randrange(0, screenY);
	} else {
		camoufoxData["window.screenY"] = randrange(screenY, 0);
	}
}

export function fromBrowserforge(
	fingerprint: Fingerprint,
	ffVersion?: string,
): Record<string, any> {
	const camoufoxData: Record<string, any> = {};
	_castToProperties(
		camoufoxData,
		BROWSERFORGE_DATA,
		{ ...fingerprint },
		ffVersion,
	);
	handleScreenXY(camoufoxData, fingerprint.screen);
	return camoufoxData;
}

function handleWindowSize(
	fp: Fingerprint,
	outerWidth: number,
	outerHeight: number,
): void {
	const sc: ExtendedScreen = { ...fp.screen, screenY: undefined };
	sc.screenX += Math.floor((sc.width - outerWidth) / 2);
	sc.screenY = Math.floor((sc.height - outerHeight) / 2);
	if (sc.innerWidth) {
		sc.innerWidth = Math.max(outerWidth - sc.outerWidth + sc.innerWidth, 0);
	}
	if (sc.innerHeight) {
		sc.innerHeight = Math.max(outerHeight - sc.outerHeight + sc.innerHeight, 0);
	}
	sc.outerWidth = outerWidth;
	sc.outerHeight = outerHeight;
	fp.screen = sc;
}

export function generateFingerprint(
	window?: [number, number],
	config?: Partial<FingerprintGeneratorOptions>,
): Fingerprint {
	if (window) {
		const { fingerprint } = FP_GENERATOR.getFingerprint(config);
		handleWindowSize(fingerprint, window[0], window[1]);
		return fingerprint;
	}
	return FP_GENERATOR.getFingerprint(config).fingerprint;
}
