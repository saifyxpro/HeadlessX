import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface StoredCredentials {
  apiKey?: string;
  apiUrl?: string;
}

function getPrimaryConfigDir(): string {
  const homeDir = os.homedir();
  switch (os.platform()) {
    case 'darwin':
      return path.join(homeDir, 'Library', 'Application Support', 'hx-cli');
    case 'win32':
      return path.join(homeDir, 'AppData', 'Roaming', 'hx-cli');
    default:
      return path.join(homeDir, '.config', 'hx-cli');
  }
}

function getLegacyConfigDir(): string {
  const homeDir = os.homedir();
  switch (os.platform()) {
    case 'darwin':
      return path.join(
        homeDir,
        'Library',
        'Application Support',
        'firecrawl-cli'
      );
    case 'win32':
      return path.join(homeDir, 'AppData', 'Roaming', 'firecrawl-cli');
    default:
      return path.join(homeDir, '.config', 'firecrawl-cli');
  }
}

function getCredentialsPath(configDir: string): string {
  return path.join(configDir, 'credentials.json');
}

function ensureConfigDir(configDir: string): void {
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
  }
}

function setSecurePermissions(filePath: string): void {
  try {
    fs.chmodSync(filePath, 0o600);
  } catch {
    // Ignore permission errors on platforms that do not support chmod semantics.
  }
}

function readCredentialsFrom(configDir: string): StoredCredentials | null {
  try {
    const credentialsPath = getCredentialsPath(configDir);
    if (!fs.existsSync(credentialsPath)) {
      return null;
    }

    const data = fs.readFileSync(credentialsPath, 'utf-8');
    return JSON.parse(data) as StoredCredentials;
  } catch {
    return null;
  }
}

export function loadCredentials(): StoredCredentials | null {
  return readCredentialsFrom(getPrimaryConfigDir()) ?? readCredentialsFrom(getLegacyConfigDir());
}

export function saveCredentials(credentials: StoredCredentials): void {
  const configDir = getPrimaryConfigDir();
  ensureConfigDir(configDir);

  const merged: StoredCredentials = {
    ...(loadCredentials() ?? {}),
    ...credentials,
  };

  const credentialsPath = getCredentialsPath(configDir);
  fs.writeFileSync(credentialsPath, JSON.stringify(merged, null, 2), 'utf-8');
  setSecurePermissions(credentialsPath);
}

export function deleteCredentials(): void {
  const credentialsPath = getCredentialsPath(getPrimaryConfigDir());
  if (fs.existsSync(credentialsPath)) {
    fs.unlinkSync(credentialsPath);
  }
}

export function getConfigDirectoryPath(): string {
  return getPrimaryConfigDir();
}
