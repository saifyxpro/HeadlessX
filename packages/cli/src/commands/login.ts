import { saveCredentials, getConfigDirectoryPath } from '../utils/credentials';
import { getApiUrl, updateConfig } from '../utils/config';
import {
  canUseModernPrompts,
  promptPassword,
  promptText,
  showIntro,
  showNote,
  showOutro,
} from '../utils/ui';

export interface LoginOptions {
  apiKey?: string;
  apiUrl?: string;
}

async function promptForCredentials(options: {
  apiKey?: string;
  apiUrl?: string;
} = {}): Promise<{ apiKey: string; apiUrl: string }> {
  if (!canUseModernPrompts()) {
    throw new Error('API key and API URL are required when interactive prompts are unavailable.');
  }

  const suggestedApiUrl = getApiUrl();
  const apiUrlInput = options.apiUrl
    ? options.apiUrl
    : await promptText({
        message: 'HeadlessX API URL',
        defaultValue: suggestedApiUrl,
        validate(value) {
          if (!value?.trim()) {
            return 'API URL is required.';
          }
          return undefined;
        },
        cancelMessage: 'Login cancelled.',
      });
  const apiKey = options.apiKey
    ? options.apiKey
    : await promptPassword({
        message: 'HeadlessX API key',
        validate(value) {
          if (!value?.trim()) {
            return 'API key cannot be empty.';
          }
          return undefined;
        },
        cancelMessage: 'Login cancelled.',
      });

  return {
    apiKey,
    apiUrl: getApiUrl(apiUrlInput || suggestedApiUrl),
  };
}

export async function handleLoginCommand(
  options: LoginOptions = {}
): Promise<void> {
  let apiKey = options.apiKey?.trim();
  let apiUrl = options.apiUrl?.trim() ? getApiUrl(options.apiUrl) : undefined;

  if (!apiKey || !apiUrl) {
    await showIntro('Login', 'Store your HeadlessX API credentials with a guided prompt.');
    const prompted = await promptForCredentials({ apiKey, apiUrl });
    apiKey = apiKey || prompted.apiKey;
    apiUrl = apiUrl || prompted.apiUrl;
  }

  if (!apiKey || !apiUrl) {
    throw new Error('API key and API URL are required.');
  }

  saveCredentials({ apiKey, apiUrl });
  updateConfig({ apiKey, apiUrl });

  if (canUseModernPrompts()) {
    await showNote('Saved', [
      `Config path: ${getConfigDirectoryPath()}`,
      `API URL: ${apiUrl}`,
    ]);
    await showOutro('HeadlessX login complete.');
    return;
  }

  console.log('✓ Login successful.');
  console.log(`Config stored at: ${getConfigDirectoryPath()}`);
  console.log(`API URL: ${apiUrl}`);
}
