import { getConfigDirectoryPath, loadCredentials, saveCredentials } from '../utils/credentials';
import { getApiUrl, getConfig, updateConfig } from '../utils/config';
import { printKeyValue } from '../utils/output';

export interface ConfigSetOptions {
  apiKey?: string;
  apiUrl?: string;
}

function maskKey(value?: string): string {
  if (!value) {
    return 'not set';
  }

  if (value.length <= 8) {
    return `${value.slice(0, 2)}***`;
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export async function handleViewConfigCommand(): Promise<void> {
  const stored = loadCredentials();
  const config = getConfig();
  printKeyValue('HeadlessX CLI Configuration', [
    ['Status', stored?.apiKey ? 'authenticated' : 'not authenticated'],
    ['API URL', config.apiUrl || getApiUrl()],
    ['API Key', maskKey(stored?.apiKey ?? config.apiKey)],
    ['Config Dir', getConfigDirectoryPath()],
  ]);
}

export async function handleSetConfigCommand(
  options: ConfigSetOptions
): Promise<void> {
  const nextApiUrl = getApiUrl(options.apiUrl);
  const existing = loadCredentials() ?? {};
  const nextApiKey = options.apiKey ?? existing.apiKey;

  saveCredentials({
    apiKey: nextApiKey,
    apiUrl: nextApiUrl,
  });

  updateConfig({
    apiKey: nextApiKey,
    apiUrl: nextApiUrl,
  });

  console.log('✓ Configuration updated.');
}
