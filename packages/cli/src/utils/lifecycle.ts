import { randomBytes } from 'node:crypto';
import { spawn, spawnSync, type SpawnSyncOptions, type SpawnSyncReturns } from 'node:child_process';
import * as fs from 'node:fs';
import * as net from 'node:net';
import * as path from 'node:path';
import { promptConfirm, promptSelect, promptText } from './ui';
import type { SetupMode } from './workspace';

export type EnvMap = Record<string, string>;

export interface CommandCheck {
  name: string;
  ok: boolean;
  detail: string;
}

export interface HealthCheckResult {
  ok: boolean;
  detail: string;
  url: string;
  tried: string[];
}

export interface HostPortConfig {
  api: number;
  web: number;
  postgres: number;
  redis: number;
  htmlToMarkdown: number;
  ytEngine: number;
}

export interface DeveloperPortConfig {
  api: number;
  web: number;
  htmlToMarkdown: number;
  ytEngine: number;
}

const HOST_PORT_DEFAULTS: HostPortConfig = {
  api: 38473,
  web: 34872,
  postgres: 35432,
  redis: 36379,
  htmlToMarkdown: 38081,
  ytEngine: 38090,
};

const DEVELOPER_PORT_DEFAULTS: DeveloperPortConfig = {
  api: 38473,
  web: 34872,
  htmlToMarkdown: 38081,
  ytEngine: 38090,
};

function quoteIfNeeded(value: string): string {
  return /\s/.test(value) ? JSON.stringify(value) : value;
}

export function readEnvFile(filePath: string): EnvMap {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const env: EnvMap = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) {
      continue;
    }
    const [, key, rawValue] = match;
    env[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }

  return env;
}

export function ensureFileFromExample(examplePath: string, targetPath: string): void {
  if (!fs.existsSync(examplePath)) {
    throw new Error(`Missing bootstrap template: ${examplePath}`);
  }

  if (fs.existsSync(targetPath)) {
    return;
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(examplePath, targetPath);
}

export function upsertEnvValues(filePath: string, values: EnvMap): void {
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
  const lines = existing ? existing.split(/\r?\n/) : [];
  const seen = new Set<string>();

  const nextLines = lines.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) {
      return line;
    }

    const key = match[1];
    if (!(key in values)) {
      return line;
    }

    seen.add(key);
    return `${key}=${quoteIfNeeded(values[key])}`;
  });

  for (const [key, value] of Object.entries(values)) {
    if (seen.has(key)) {
      continue;
    }
    nextLines.push(`${key}=${quoteIfNeeded(value)}`);
  }

  const normalized = nextLines.join('\n').replace(/\n{3,}/g, '\n\n');
  fs.writeFileSync(filePath, normalized.endsWith('\n') ? normalized : `${normalized}\n`, 'utf-8');
}

export function generateSecret(bytes = 24): string {
  return randomBytes(bytes).toString('hex');
}

export function resolveSecret(currentValue?: string): string {
  const normalized = currentValue?.trim();
  if (!normalized || normalized.startsWith('replace-with-')) {
    return generateSecret();
  }
  return normalized;
}

export function runCommand(
  command: string,
  args: string[],
  options: SpawnSyncOptions = {}
): { success: boolean; stdout: string; stderr: string; status: number | null } {
  const result = spawnSync(command, args, {
    encoding: 'utf-8',
    ...options,
  }) as SpawnSyncReturns<string>;

  return {
    success: result.status === 0,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    status: result.status,
  };
}

export function runInteractiveCommand(command: string, args: string[], cwd?: string): void {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status ?? 'unknown'}.`);
  }
}

export function spawnDetachedProcess(
  command: string,
  args: string[],
  options: { cwd: string; logPath: string }
): number {
  fs.mkdirSync(path.dirname(options.logPath), { recursive: true });
  const out = fs.openSync(options.logPath, 'a');
  const child = spawn(command, args, {
    cwd: options.cwd,
    detached: true,
    shell: process.platform === 'win32',
    stdio: ['ignore', out, out],
  });

  child.unref();

  if (!child.pid) {
    throw new Error(`Failed to start ${command}.`);
  }

  return child.pid;
}

export function killDetachedProcess(pid: number): void {
  if (process.platform === 'win32') {
    const result = spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
      encoding: 'utf-8',
    });
    if (result.status !== 0) {
      throw new Error(result.stderr || `Failed to stop process ${pid}.`);
    }
    return;
  }

  try {
    process.kill(-pid, 'SIGTERM');
  } catch {
    process.kill(pid, 'SIGTERM');
  }
}

export async function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({
      port,
      host: '127.0.0.1',
    });

    socket.setTimeout(500);
    socket.on('connect', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', (error) => {
      const err = error as NodeJS.ErrnoException;
      if (
        err.code === 'ECONNREFUSED' ||
        err.code === 'EHOSTUNREACH' ||
        err.code === 'EPERM'
      ) {
        resolve(true);
        return;
      }
      resolve(false);
    });
  });
}

export async function nextFreePort(startingPort: number): Promise<number> {
  let port = startingPort;
  while (!(await isPortFree(port))) {
    port += 1;
  }
  return port;
}

export async function confirm(question: string, defaultValue = true): Promise<boolean> {
  return promptConfirm({
    message: question,
    defaultValue,
  });
}

export async function promptMode(): Promise<SetupMode> {
  return promptSelect<SetupMode>({
    message: 'Which mode do you want to set up?',
    initialValue: 'self-host',
    values: [
      {
        value: 'self-host',
        label: 'Self-Host',
        hint: 'Docker stack on local rare ports',
      },
      {
        value: 'developer',
        label: 'Developer',
        hint: 'Clone main and run the local workspace',
      },
      {
        value: 'production',
        label: 'Production',
        hint: 'Docker plus Caddy with API and dashboard domains',
      },
    ],
  });
}

export async function promptRequired(question: string, value?: string): Promise<string> {
  const trimmed = value?.trim();
  if (trimmed) {
    return trimmed;
  }
  return promptText({
    message: question,
    validate(inputValue) {
      if (!inputValue?.trim()) {
        return 'A value is required.';
      }
      return undefined;
    },
  });
}

export async function resolveHostPorts(
  preferred: HostPortConfig,
  options: { yes?: boolean }
): Promise<HostPortConfig> {
  const resolved = { ...preferred };
  const labels: Record<keyof HostPortConfig, string> = {
    api: 'API',
    web: 'Web',
    postgres: 'PostgreSQL',
    redis: 'Redis',
    htmlToMarkdown: 'HTML-to-Markdown',
    ytEngine: 'yt-engine',
  };

  for (const key of Object.keys(resolved) as Array<keyof HostPortConfig>) {
    const preferredPort = resolved[key];
    if (await isPortFree(preferredPort)) {
      continue;
    }

    const suggested = await nextFreePort(preferredPort + 1);
    if (!options.yes) {
      const accepted = await confirm(
        `Port ${preferredPort} is already in use for ${labels[key]}. Use ${suggested} instead?`,
        true
      );
      if (!accepted) {
        throw new Error(`Port ${preferredPort} is already in use. Resolve the conflict and run init again.`);
      }
    }

    resolved[key] = suggested;
  }

  return resolved;
}

export async function resolveDeveloperPorts(
  preferred: DeveloperPortConfig,
  options: { yes?: boolean }
): Promise<DeveloperPortConfig> {
  const resolved = { ...preferred };
  const labels: Record<keyof DeveloperPortConfig, string> = {
    api: 'API',
    web: 'Web',
    htmlToMarkdown: 'HTML-to-Markdown',
    ytEngine: 'yt-engine',
  };

  for (const key of Object.keys(resolved) as Array<keyof DeveloperPortConfig>) {
    const preferredPort = resolved[key];
    if (await isPortFree(preferredPort)) {
      continue;
    }

    const suggested = await nextFreePort(preferredPort + 1);
    if (!options.yes) {
      const accepted = await confirm(
        `Port ${preferredPort} is already in use for ${labels[key]}. Use ${suggested} instead?`,
        true
      );
      if (!accepted) {
        throw new Error(`Port ${preferredPort} is already in use. Resolve the conflict and run init again.`);
      }
    }

    resolved[key] = suggested;
  }

  return resolved;
}

export function hostPortDefaults(): HostPortConfig {
  return { ...HOST_PORT_DEFAULTS };
}

export function developerPortDefaults(): DeveloperPortConfig {
  return { ...DEVELOPER_PORT_DEFAULTS };
}

export function checkCommand(name: string, args = ['--version']): CommandCheck {
  const result = runCommand(name, args);
  return {
    name,
    ok: result.success,
    detail: result.success
      ? (result.stdout.trim().split('\n')[0] || 'available')
      : (result.stderr.trim().split('\n')[0] || 'not available'),
  };
}

export function buildHealthProbeCandidates(url: string): string[] {
  const parsed = new URL(url);
  const candidates = [parsed.toString()];

  if (parsed.hostname === 'localhost') {
    parsed.hostname = '127.0.0.1';
    candidates.push(parsed.toString());
  } else if (parsed.hostname === '0.0.0.0') {
    parsed.hostname = '127.0.0.1';
    candidates.push(parsed.toString());
  }

  return Array.from(new Set(candidates));
}

export async function checkHttpHealth(url: string): Promise<HealthCheckResult> {
  const candidates = buildHealthProbeCandidates(url);
  let lastFailure = 'request failed';

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        return {
          ok: true,
          detail: `${response.status} ${response.statusText}`,
          url: candidate,
          tried: candidates,
        };
      }

      lastFailure = `${response.status} ${response.statusText}`;
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : 'request failed';
    }
  }

  const nullDevice = process.platform === 'win32' ? 'NUL' : '/dev/null';
  for (const candidate of candidates) {
    const curlResult = runCommand('curl', [
      '--silent',
      '--show-error',
      '--location',
      '--max-time',
      '5',
      '--output',
      nullDevice,
      '--write-out',
      '%{http_code}',
      candidate,
    ]);

    const curlCode = Number(curlResult.stdout.trim());
    if (Number.isFinite(curlCode) && curlCode >= 200 && curlCode < 400) {
      return {
        ok: true,
        detail: `${curlCode} via curl`,
        url: candidate,
        tried: candidates,
      };
    }

    if (curlResult.stderr.trim()) {
      lastFailure = curlResult.stderr.trim().split('\n')[0] || lastFailure;
    } else if (Number.isFinite(curlCode) && curlCode > 0) {
      lastFailure = `${curlCode} via curl`;
    }
  }

  return {
    ok: false,
    detail: lastFailure,
    url: candidates[0] ?? url,
    tried: candidates,
  };
}
