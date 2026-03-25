import { Impit } from "impit";

export class InvalidIP extends Error {}
export class InvalidProxy extends Error {}

export interface Proxy {
	server: string;
	username?: string;
	password?: string;
	bypass?: string;
}

export const ProxyHelper = {
	parseServer(server: string): {
		schema: string;
		url: string;
		port?: string;
	} {
		const proxyMatch = server.match(/^(?:(\w+):\/\/)?(.*?)(?::(\d+))?$/);
		if (!proxyMatch) {
			throw new InvalidProxy(`Invalid proxy server: ${server}`);
		}
		return {
			schema: proxyMatch[1] || "http",
			url: proxyMatch[2],
			port: proxyMatch[3],
		};
	},

	asString(proxy: Proxy): string {
		const { schema, url, port } = ProxyHelper.parseServer(proxy.server);
		let result = `${schema}://`;
		if (proxy.username) {
			result += proxy.username;
			if (proxy.password) {
				result += `:${proxy.password}`;
			}
			result += "@";
		}
		result += url;
		if (port) {
			result += `:${port}`;
		}
		return result;
	},

	asAxiosProxy(proxyString: string): { [key: string]: string } {
		return {
			http: proxyString,
			https: proxyString,
		};
	},
} as const;

export function validIPv4(ip: string | false): boolean {
	if (!ip) {
		return false;
	}
	return /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip);
}

export function validIPv6(ip: string | false): boolean {
	if (!ip) {
		return false;
	}
	return /^(([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4})$/.test(ip);
}

export function validateIP(ip: string): void {
	if (!validIPv4(ip) && !validIPv6(ip)) {
		throw new InvalidIP(`Invalid IP address: ${ip}`);
	}
}

export async function publicIP(proxy?: string): Promise<string> {
	const URLS = [
		"https://api.ipify.org",
		"https://checkip.amazonaws.com",
		"https://ipinfo.io/ip",
		"https://icanhazip.com",
		"https://ifconfig.co/ip",
		"https://ipecho.net/plain",
	];

	const errors = [];

	for (const url of URLS) {
		try {
			const impit = new Impit({
				proxyUrl: proxy,
				timeout: 5000,
			});
			const response = await impit.fetch(url);

			if (!response.ok) {
				continue;
			}

			const ip = (await response.text()).trim();
			validateIP(ip);
			return ip;
		} catch (error) {
			errors.push(error);
			if (process.env.HEADFOX_DEBUG || process.env.CAMOUFOX_DEBUG) {
				console.warn(
					new InvalidProxy(
						`headfox-js(warn): Failed to fetch public proxy IP from ${url}, retrying with another URL...`,
						{ cause: error },
					),
				);
			}
		}
	}

	throw new InvalidIP(
		"Failed to get a public proxy IP address from any API endpoint.",
		{ cause: errors },
	);
}
