import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { saveCredentials, getConfigDirectoryPath } from '../utils/credentials';
import { getApiUrl, updateConfig } from '../utils/config';

export interface LoginOptions {
  apiKey?: string;
  apiUrl?: string;
}

async function promptForApiKey(): Promise<string> {
  const rl = createInterface({ input, output });
  try {
    const apiKey = (await rl.question('HeadlessX API key: ')).trim();
    if (!apiKey) {
      throw new Error('API key cannot be empty.');
    }
    return apiKey;
  } finally {
    rl.close();
  }
}

export async function handleLoginCommand(
  options: LoginOptions = {}
): Promise<void> {
  const apiKey = options.apiKey?.trim() || (await promptForApiKey());
  const apiUrl = getApiUrl(options.apiUrl);

  saveCredentials({ apiKey, apiUrl });
  updateConfig({ apiKey, apiUrl });

  console.log('✓ Login successful.');
  console.log(`Config stored at: ${getConfigDirectoryPath()}`);
  console.log(`API URL: ${apiUrl}`);
}
