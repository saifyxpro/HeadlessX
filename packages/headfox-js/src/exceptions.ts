export class UnsupportedVersion extends Error {
	constructor(message?: string) {
		super(message ?? "The Headfox executable is outdated.");
		this.name = "UnsupportedVersion";
	}
}

export class MissingRelease extends Error {
	constructor(message?: string) {
		super(message ?? "A required GitHub release asset is missing.");
		this.name = "MissingRelease";
	}
}

export class UnsupportedArchitecture extends Error {
	constructor(message?: string) {
		super(message ?? "The architecture is not supported.");
		this.name = "UnsupportedArchitecture";
	}
}

export class UnsupportedOS extends Error {
	constructor(message?: string) {
		super(message ?? "The OS is not supported.");
		this.name = "UnsupportedOS";
	}
}

export class UnknownProperty extends Error {
	constructor(message?: string) {
		super(message ?? "The property is unknown.");
		this.name = "UnknownProperty";
	}
}

export class InvalidPropertyType extends Error {
	constructor(message?: string) {
		super(message ?? "The property type is invalid.");
		this.name = "InvalidPropertyType";
	}
}

export class InvalidAddonPath extends Error {
	constructor(message?: string) {
		super(message ?? "The addon path is invalid.");
		this.name = "InvalidAddonPath";
	}
}

export class InvalidDebugPort extends Error {
	constructor(message?: string) {
		super(message ?? "The debug port is invalid.");
		this.name = "InvalidDebugPort";
	}
}

export class MissingDebugPort extends Error {
	constructor(message?: string) {
		super(message ?? "The debug port is missing.");
		this.name = "MissingDebugPort";
	}
}

export class LocaleError extends Error {
	constructor(message: string) {
		super(message ?? "The locale is invalid.");
		this.name = "LocaleError";
	}
}

export class InvalidIP extends Error {
	constructor(message?: string) {
		super(message ?? "An IP address is invalid.");
		this.name = "InvalidIP";
	}
}

export class InvalidProxy extends Error {
	constructor(message?: string) {
		super(message ?? "A proxy is invalid.");
		this.name = "InvalidProxy";
	}
}

export class UnknownIPLocation extends LocaleError {
	constructor(message?: string) {
		super(message ?? "The location of an IP is unknown.");
		this.name = "UnknownIPLocation";
	}
}

export class InvalidLocale extends LocaleError {
	constructor(message?: string) {
		super(message ?? "The locale input is invalid.");
		this.name = "InvalidLocale";
	}

	static invalidInput(locale: string): InvalidLocale {
		return new InvalidLocale(
			`Invalid locale: '${locale}'. Must be either a region, language, language-region, or language-script-region.`,
		);
	}
}

export class UnknownTerritory extends InvalidLocale {
	constructor(message?: string) {
		super(message ?? "The territory is unknown.");
		this.name = "UnknownTerritory";
	}
}

export class UnknownLanguage extends InvalidLocale {
	constructor(message?: string) {
		super(message ?? "The language is unknown.");
		this.name = "UnknownLanguage";
	}
}

export class NotInstalledGeoIPExtra extends Error {
	constructor(message?: string) {
		super(message ?? "The geoip2 module is not installed.");
		this.name = "NotInstalledGeoIPExtra";
	}
}

export class NonFirefoxFingerprint extends Error {
	constructor(message?: string) {
		super(message ?? "A passed Browserforge fingerprint is invalid.");
		this.name = "NonFirefoxFingerprint";
	}
}

export class InvalidOS extends Error {
	constructor(message?: string) {
		super(message ?? "The target OS is invalid.");
		this.name = "InvalidOS";
	}
}

export class VirtualDisplayError extends Error {
	constructor(message?: string) {
		super(message ?? "There is an error with the virtual display.");
		this.name = "VirtualDisplayError";
	}
}

export class CannotFindXvfb extends VirtualDisplayError {
	constructor(message?: string) {
		super(message ?? "Xvfb cannot be found.");
		this.name = "CannotFindXvfb";
	}
}

export class CannotExecuteXvfb extends VirtualDisplayError {
	constructor(message?: string) {
		super(message ?? "Xvfb cannot be executed.");
		this.name = "CannotExecuteXvfb";
	}
}

export class VirtualDisplayNotSupported extends VirtualDisplayError {
	constructor(message?: string) {
		super(
			message ?? "The user tried to use a virtual display on a non-Linux OS.",
		);
		this.name = "VirtualDisplayNotSupported";
	}
}

export class HeadfoxNotInstalled extends Error {
	constructor(message?: string) {
		super(message ?? "Headfox is not installed.");
		this.name = "HeadfoxNotInstalled";
	}
}

export class WebGLFingerprintUnavailable extends Error {
	constructor(message?: string, options?: ErrorOptions) {
		super(
			message ?? "WebGL fingerprint sampling is unavailable in this runtime.",
			options,
		);
		this.name = "WebGLFingerprintUnavailable";
	}
}

export class CamoufoxNotInstalled extends HeadfoxNotInstalled {
	constructor(message?: string) {
		super(message ?? "Camoufox is not installed.");
		this.name = "CamoufoxNotInstalled";
	}
}

export class FileNotFoundError extends Error {
	constructor(message?: string) {
		super(message ?? "File couldn't be found.");
		this.name = "FileNotFoundError";
	}
}
