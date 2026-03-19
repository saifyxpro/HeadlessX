import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { saveCredentials, getConfigDirectoryPath } from '../utils/credentials';
import { getApiUrl, updateConfig } from '../utils/config';

export interface LoginOptions {
  apiKey?: string;
  apiUrl?: string;
}

async function promptForCredentials(options: {
  apiKey?: string;
  apiUrl?: string;
} = {}): Promise<{ apiKey: string; apiUrl: string }> {
  const rl = createInterface({ input, output });
  try {
    const suggestedApiUrl = getApiUrl();
    const apiUrlInput = options.apiUrl
      ? options.apiUrl
      : (
        await rl.question(`HeadlessX API URL (${suggestedApiUrl}): `)
      ).trim();
    const apiKey = options.apiKey
      ? options.apiKey
      : (await rl.question('HeadlessX API key: ')).trim();

    if (!apiKey) {
      throw new Error('API key cannot be empty.');
    }

    return {
      apiKey,
      apiUrl: getApiUrl(apiUrlInput || suggestedApiUrl),
    };
  } finally {
    rl.close();
  }
}

export async function handleLoginCommand(
  options: LoginOptions = {}
): Promise<void> {
  let apiKey = options.apiKey?.trim();
  let apiUrl = options.apiUrl?.trim() ? getApiUrl(options.apiUrl) : undefined;

  if (!apiKey || !apiUrl) {
    const prompted = await promptForCredentials({ apiKey, apiUrl });
    apiKey = apiKey || prompted.apiKey;
    apiUrl = apiUrl || prompted.apiUrl;
  }

  if (!apiKey || !apiUrl) {
    throw new Error('API key and API URL are required.');
  }

  saveCredentials({ apiKey, apiUrl });
  updateConfig({ apiKey, apiUrl });

  console.log('✓ Login successful.');
  console.log(`Config stored at: ${getConfigDirectoryPath()}`);
  console.log(`API URL: ${apiUrl}`);
}
