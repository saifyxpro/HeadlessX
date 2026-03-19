import { loadCredentials, type StoredCredentials } from './credentials';

export interface GlobalConfig {
  apiKey?: string;
  apiUrl: string;
}

export const DEFAULT_API_URL = 'http://localhost:8000';

let globalConfig: GlobalConfig = {
  apiUrl: DEFAULT_API_URL,
};

function loadEnvConfig(): StoredCredentials {
  return {
    apiKey:
      process.env.HX_API_KEY ||
      process.env.HEADLESSX_API_KEY ||
      process.env.X_API_KEY,
    apiUrl: process.env.HX_API_URL || process.env.HEADLESSX_API_URL,
  };
}

export function initializeConfig(config: Partial<GlobalConfig> = {}): void {
  const stored = loadCredentials() ?? {};
  const env = loadEnvConfig();

  globalConfig = {
    apiKey: config.apiKey ?? env.apiKey ?? stored.apiKey,
    apiUrl: config.apiUrl ?? env.apiUrl ?? stored.apiUrl ?? DEFAULT_API_URL,
  };
}

export function getConfig(): GlobalConfig {
  return { ...globalConfig };
}

export function updateConfig(config: Partial<GlobalConfig>): void {
  globalConfig = {
    ...globalConfig,
    ...config,
    apiUrl: config.apiUrl ?? globalConfig.apiUrl ?? DEFAULT_API_URL,
  };
}

export function getApiKey(providedKey?: string): string | undefined {
  return providedKey ?? globalConfig.apiKey ?? loadEnvConfig().apiKey ?? loadCredentials()?.apiKey;
}

export function getApiUrl(providedUrl?: string): string {
  return (
    providedUrl ??
    globalConfig.apiUrl ??
    loadEnvConfig().apiUrl ??
    loadCredentials()?.apiUrl ??
    DEFAULT_API_URL
  ).replace(/\/$/, '');
}

export function validateConfig(apiKey?: string): string {
  const resolvedKey = getApiKey(apiKey);
  if (!resolvedKey) {
    throw new Error(
      'API key is required. Set HX_API_KEY, pass --api-key, or run "headlessx login".'
    );
  }
  return resolvedKey;
}
