import * as fs from 'node:fs';
import * as path from 'node:path';
import packageJson from '../../package.json';
import { writeStructured, writeText } from '../utils/output';
import {
  checkCommand,
  checkHttpHealth,
  confirm,
  developerPortDefaults,
  ensureFileFromExample,
  generateSecret,
  hostPortDefaults,
  promptMode,
  promptRequired,
  readEnvFile,
  resolveDeveloperPorts,
  resolveHostPorts,
  resolveSecret,
  runCommand,
  runInteractiveCommand,
  spawnDetachedProcess,
  upsertEnvValues,
  killDetachedProcess,
} from '../utils/lifecycle';
import {
  canUseModernPrompts,
  showInfo,
  showIntro,
  showNote,
  showOutro,
  withSpinner,
} from '../utils/ui';
import {
  clearLastStart,
  DEFAULT_BRANCH,
  ensureWorkspaceLayout,
  getRepoUrl,
  getWorkspacePaths,
  readBranch,
  readLastStart,
  readMode,
  writeBranch,
  writeLastStart,
  writeMode,
  type RuntimeState,
  type SetupMode,
} from '../utils/workspace';

interface InitOptions {
  action?: string;
  mode?: SetupMode;
  branch?: string;
  yes?: boolean;
  start?: boolean;
  apiDomain?: string;
  webDomain?: string;
  caddyEmail?: string;
}

interface StartOptions {
  quiet?: boolean;
  build?: boolean;
}

interface StatusOptions {
  json?: boolean;
  pretty?: boolean;
  output?: string;
}

interface DoctorOptions {
  json?: boolean;
  pretty?: boolean;
  output?: string;
}

interface RuntimeSummary {
  configured: boolean;
  workspaceRoot: string;
  repoPath: string;
  mode?: SetupMode;
  branch?: string;
  envFiles: Record<string, boolean>;
  local: Record<string, unknown>;
}

type InitAction = 'bootstrap' | 'update';

function getRepoFile(relativePath: string): string {
  return path.join(getWorkspacePaths().repo, relativePath);
}

function getDockerEnvPath(): string {
  return getRepoFile('infra/docker/.env');
}

function getDockerEnvExamplePath(): string {
  return getRepoFile('infra/docker/.env.example');
}

function getRootEnvPath(): string {
  return getRepoFile('.env');
}

function getRootEnvExamplePath(): string {
  return getRepoFile('.env.example');
}

function getDomainEnvPath(): string {
  return getRepoFile('infra/domain-setup/.env');
}

function getDomainEnvExamplePath(): string {
  return getRepoFile('infra/domain-setup/.env.example');
}

function getDomainCaddyfilePath(): string {
  return getRepoFile('infra/domain-setup/Caddyfile');
}

function getDomainCaddyTemplatePath(): string {
  return getRepoFile('infra/domain-setup/Caddyfile.template');
}

function getDockerComposeDir(): string {
  return getRepoFile('infra/docker');
}

function getDomainComposeDir(): string {
  return getRepoFile('infra/domain-setup');
}

function parseInitAction(value?: string): InitAction {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return 'bootstrap';
  }
  if (normalized === 'update') {
    return 'update';
  }

  throw new Error(`Unsupported init action "${value}". Use "headlessx init" or "headlessx init update".`);
}

function printChecks(title: string, checks: Array<{ name: string; ok: boolean; detail: string }>): void {
  const lines = [title];
  for (const check of checks) {
    lines.push(`- ${check.ok ? 'OK' : 'FAIL'} ${check.name}: ${check.detail}`);
  }
  writeText(lines.join('\n'));
}

async function reportChecks(
  title: string,
  checks: Array<{ name: string; ok: boolean; detail: string }>
): Promise<void> {
  if (!canUseModernPrompts()) {
    printChecks(title, checks);
    return;
  }

  await showNote(
    title,
    checks.map((check) => `${check.ok ? 'OK' : 'FAIL'} ${check.name}: ${check.detail}`)
  );
}

function requireChecks(checks: Array<{ name: string; ok: boolean; detail: string }>): void {
  const failed = checks.filter((check) => !check.ok);
  if (failed.length === 0) {
    return;
  }

  const message = failed.map((check) => `${check.name}: ${check.detail}`).join('\n');
  throw new Error(message);
}

function detectPrerequisites(mode: SetupMode): Array<{ name: string; ok: boolean; detail: string }> {
  const checks = [checkCommand('git'), checkCommand('docker')];

  if (mode === 'developer') {
    checks.push(checkCommand('node', ['--version']));
    checks.push(checkCommand('pnpm', ['--version']));

    const mise = checkCommand('mise', ['--version']);
    if (mise.ok) {
      checks.push(mise);
    }
  }

  return checks;
}

function repoExists(): boolean {
  return fs.existsSync(path.join(getWorkspacePaths().repo, '.git'));
}

function ensureRepo(branch: string): void {
  const paths = ensureWorkspaceLayout();
  const repoUrl = getRepoUrl();

  if (!repoExists()) {
    runInteractiveCommand('git', ['clone', '--branch', branch, '--single-branch', repoUrl, paths.repo]);
    return;
  }

  runInteractiveCommand('git', ['-C', paths.repo, 'fetch', 'origin', '--prune']);
  runInteractiveCommand('git', ['-C', paths.repo, 'checkout', branch]);
  runInteractiveCommand('git', ['-C', paths.repo, 'pull', '--ff-only', 'origin', branch]);
}

function getRuntimeUrls(mode: SetupMode): { apiUrl?: string; webUrl?: string } {
  if (mode === 'developer') {
    const env = readEnvFile(getRootEnvPath());
    return {
      apiUrl: env.NEXT_PUBLIC_API_URL || (env.PORT ? `http://localhost:${env.PORT}` : undefined),
      webUrl: env.WEB_PORT ? `http://localhost:${env.WEB_PORT}` : undefined,
    };
  }

  const env = readEnvFile(getDockerEnvPath());
  const apiHostPort = env.API_HOST_PORT || env.PORT;
  const webHostPort = env.WEB_HOST_PORT || env.WEB_PORT;

  if (mode === 'production') {
    const domainEnv = readEnvFile(getDomainEnvPath());
    return {
      apiUrl: domainEnv.HEADLESSX_API_DOMAIN ? `https://${domainEnv.HEADLESSX_API_DOMAIN}` : undefined,
      webUrl: domainEnv.HEADLESSX_WEB_DOMAIN ? `https://${domainEnv.HEADLESSX_WEB_DOMAIN}` : undefined,
    };
  }

  return {
    apiUrl: apiHostPort ? `http://localhost:${apiHostPort}` : undefined,
    webUrl: webHostPort ? `http://localhost:${webHostPort}` : undefined,
  };
}

function writeRuntimeMetadata(mode: SetupMode, branch: string, extra: Partial<RuntimeState> = {}): void {
  writeMode(mode);
  writeBranch(branch);
  writeLastStart({
    mode,
    branch,
    startedAt: new Date().toISOString(),
    ...extra,
  });
}

function fallbackRuntimeUrls(mode: SetupMode): { apiUrl: string; webUrl: string } {
  const urls = getRuntimeUrls(mode);
  return {
    apiUrl: urls.apiUrl || (mode === 'production' ? '' : 'http://localhost:38473'),
    webUrl: urls.webUrl || (mode === 'production' ? '' : 'http://localhost:34872'),
  };
}

async function configureSelfHost(options: InitOptions): Promise<{ apiUrl: string; webUrl: string }> {
  const envPath = getDockerEnvPath();
  ensureFileFromExample(getDockerEnvExamplePath(), envPath);

  const ports = await resolveHostPorts(hostPortDefaults(), { yes: options.yes });
  const current = readEnvFile(envPath);

  upsertEnvValues(envPath, {
    POSTGRES_HOST_PORT: String(ports.postgres),
    REDIS_HOST_PORT: String(ports.redis),
    HTML_TO_MARKDOWN_HOST_PORT: String(ports.htmlToMarkdown),
    YT_ENGINE_HOST_PORT: String(ports.ytEngine),
    WEB_HOST_PORT: String(ports.web),
    API_HOST_PORT: String(ports.api),
    NEXT_PUBLIC_API_URL: `http://localhost:${ports.api}`,
    FRONTEND_URL: `http://localhost:${ports.web}`,
    DASHBOARD_INTERNAL_API_KEY: resolveSecret(current.DASHBOARD_INTERNAL_API_KEY),
    CREDENTIAL_ENCRYPTION_KEY: resolveSecret(current.CREDENTIAL_ENCRYPTION_KEY),
  });

  return {
    apiUrl: `http://localhost:${ports.api}`,
    webUrl: `http://localhost:${ports.web}`,
  };
}

async function configureDeveloper(options: InitOptions): Promise<{ apiUrl: string; webUrl: string }> {
  const envPath = getRootEnvPath();
  ensureFileFromExample(getRootEnvExamplePath(), envPath);

  const ports = await resolveDeveloperPorts(developerPortDefaults(), { yes: options.yes });
  const current = readEnvFile(envPath);

  upsertEnvValues(envPath, {
    PORT: String(ports.api),
    WEB_PORT: String(ports.web),
    HTML_TO_MARKDOWN_PORT: String(ports.htmlToMarkdown),
    YT_ENGINE_PORT: String(ports.ytEngine),
    YT_ENGINE_URL: `http://localhost:${ports.ytEngine}`,
    HTML_TO_MARKDOWN_SERVICE_URL: `http://localhost:${ports.htmlToMarkdown}`,
    NEXT_PUBLIC_API_URL: `http://localhost:${ports.api}`,
    DASHBOARD_INTERNAL_API_KEY: resolveSecret(current.DASHBOARD_INTERNAL_API_KEY),
    CREDENTIAL_ENCRYPTION_KEY: resolveSecret(current.CREDENTIAL_ENCRYPTION_KEY),
  });

  return {
    apiUrl: `http://localhost:${ports.api}`,
    webUrl: `http://localhost:${ports.web}`,
  };
}

async function configureProduction(options: InitOptions): Promise<{ apiUrl: string; webUrl: string }> {
  const urls = await configureSelfHost(options);

  const envPath = getDomainEnvPath();
  const caddyfilePath = getDomainCaddyfilePath();
  ensureFileFromExample(getDomainEnvExamplePath(), envPath);
  ensureFileFromExample(getDomainCaddyTemplatePath(), caddyfilePath);

  const webDomain = await promptRequired('What is the dashboard domain?', options.webDomain);
  const apiDomain = await promptRequired('What is the API domain?', options.apiDomain);
  const caddyEmail = await promptRequired(
    'What email should Caddy use for certificate management?',
    options.caddyEmail
  );

  upsertEnvValues(envPath, {
    HEADLESSX_WEB_DOMAIN: webDomain,
    HEADLESSX_API_DOMAIN: apiDomain,
    CADDY_EMAIL: caddyEmail,
  });

  return {
    apiUrl: `https://${apiDomain}`,
    webUrl: `https://${webDomain}`,
  };
}

async function maybeRunDeveloperSetup(options: InitOptions): Promise<void> {
  await showInfo('Installing HeadlessX workspace dependencies with pnpm...');
  runInteractiveCommand('pnpm', ['install'], getWorkspacePaths().repo);

  if (options.yes || !process.stdin.isTTY || !process.stdout.isTTY) {
    return;
  }

  // Prompts are intentionally one at a time.
}

async function maybeRunDeveloperOptionalTasks(): Promise<void> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return;
  }

  if (await confirm('Download CAPTCHA models now?', false)) {
    runInteractiveCommand('pnpm', ['run', 'models:download'], getWorkspacePaths().repo);
  }

  if (await confirm('Run database setup now?', false)) {
    runInteractiveCommand('pnpm', ['db:push'], getWorkspacePaths().repo);
  }
}

function startDeveloper(branch: string): { pid: number; logPath: string; apiUrl: string; webUrl: string } {
  const paths = getWorkspacePaths();
  const { apiUrl, webUrl } = getRuntimeUrls('developer');
  const logPath = path.join(paths.logs, 'developer.log');
  const pid = spawnDetachedProcess('pnpm', ['dev'], {
    cwd: paths.repo,
    logPath,
  });

  writeRuntimeMetadata('developer', branch, {
    apiUrl,
    webUrl,
    pid,
    logPath,
  });

  return {
    pid,
    logPath,
    apiUrl: apiUrl || 'http://localhost:38473',
    webUrl: webUrl || 'http://localhost:34872',
  };
}

function startSelfHost(branch: string, options: { build?: boolean } = {}): { apiUrl: string; webUrl: string } {
  const args = ['compose', '--profile', 'all', 'up'];
  if (options.build) {
    args.push('--build');
  }
  args.push('-d');
  runInteractiveCommand('docker', args, getDockerComposeDir());
  const { apiUrl, webUrl } = getRuntimeUrls('self-host');
  writeRuntimeMetadata('self-host', branch, { apiUrl, webUrl });
  return {
    apiUrl: apiUrl || 'http://localhost:38473',
    webUrl: webUrl || 'http://localhost:34872',
  };
}

function startProduction(branch: string, options: { build?: boolean } = {}): { apiUrl: string; webUrl: string } {
  const coreArgs = ['compose', '--profile', 'all', 'up'];
  if (options.build) {
    coreArgs.push('--build');
  }
  coreArgs.push('-d');
  runInteractiveCommand('docker', coreArgs, getDockerComposeDir());
  runInteractiveCommand('docker', ['compose', 'up', '-d'], getDomainComposeDir());
  const { apiUrl, webUrl } = getRuntimeUrls('production');
  writeRuntimeMetadata('production', branch, { apiUrl, webUrl });
  return {
    apiUrl: apiUrl || '',
    webUrl: webUrl || '',
  };
}

function stopDockerStack(mode: SetupMode): void {
  if (mode === 'production') {
    runInteractiveCommand('docker', ['compose', 'stop'], getDomainComposeDir());
  }
  runInteractiveCommand('docker', ['compose', '--profile', 'all', 'stop'], getDockerComposeDir());
}

function readDockerServices(cwd: string, args: string[]): string[] {
  const result = runCommand('docker', ['compose', ...args], { cwd });
  if (!result.success) {
    return [];
  }

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

async function buildRuntimeSummary(): Promise<RuntimeSummary> {
  const paths = getWorkspacePaths();
  const mode = readMode();
  const branch = readBranch() ?? undefined;
  const lastStart = readLastStart();
  const rootEnvPath = getRootEnvPath();
  const dockerEnvPath = getDockerEnvPath();
  const domainEnvPath = getDomainEnvPath();

  const summary: RuntimeSummary = {
    configured: Boolean(mode && repoExists()),
    workspaceRoot: paths.root,
    repoPath: paths.repo,
    mode: mode ?? undefined,
    branch,
    envFiles: {
      root: fs.existsSync(rootEnvPath),
      docker: fs.existsSync(dockerEnvPath),
      domain: fs.existsSync(domainEnvPath),
    },
    local: {},
  };

  if (!mode) {
    return summary;
  }

  if (mode === 'developer') {
    const urls = getRuntimeUrls(mode);
    let processRunning = false;
    if (lastStart?.pid) {
      try {
        process.kill(lastStart.pid, 0);
        processRunning = true;
      } catch {
        processRunning = false;
      }
    }

    summary.local = {
      apiUrl: urls.apiUrl,
      webUrl: urls.webUrl,
      pid: lastStart?.pid ?? null,
      processRunning,
      logPath: lastStart?.logPath ?? null,
    };
    return summary;
  }

  const running = readDockerServices(getDockerComposeDir(), [
    '--profile',
    'all',
    'ps',
    '--services',
    '--status',
    'running',
  ]);

  if (mode === 'production') {
    const domains = readEnvFile(getDomainEnvPath());
    const proxy = readDockerServices(getDomainComposeDir(), ['ps', '--services', '--status', 'running']);
    summary.local = {
      apiDomain: domains.HEADLESSX_API_DOMAIN || null,
      webDomain: domains.HEADLESSX_WEB_DOMAIN || null,
      coreServices: running,
      domainServices: proxy,
    };
    return summary;
  }

  const env = readEnvFile(getDockerEnvPath());
  summary.local = {
    apiUrl: env.API_HOST_PORT ? `http://localhost:${env.API_HOST_PORT}` : null,
    webUrl: env.WEB_HOST_PORT ? `http://localhost:${env.WEB_HOST_PORT}` : null,
    services: running,
  };

  return summary;
}

export async function handleInitCommand(options: InitOptions): Promise<void> {
  const action = parseInitAction(options.action);
  await showIntro(
    action === 'update' ? 'Update' : 'Setup',
    action === 'update'
      ? 'Update the existing HeadlessX workspace under ~/.headlessx and keep the saved setup mode.'
      : 'Bootstrap HeadlessX into ~/.headlessx with a guided install flow.'
  );

  const savedMode = readMode();
  const mode =
    action === 'update'
      ? options.mode ?? savedMode ?? null
      : options.mode ?? (await promptMode());
  const branch = options.branch?.trim() || DEFAULT_BRANCH;

  if (!mode) {
    throw new Error('HeadlessX is not initialized yet. Run "headlessx init" first.');
  }

  if (action === 'update' && !repoExists()) {
    throw new Error('HeadlessX is not initialized yet. Run "headlessx init" first.');
  }

  await showNote('Setup Plan', [
    `Workspace: ${getWorkspacePaths().root}`,
    `Mode: ${mode}`,
    `Branch: ${branch}`,
    `Action: ${action}`,
  ]);

  const checks = await withSpinner(
    'Checking Git, Docker, and required runtime tools...',
    () => {
      const detected = detectPrerequisites(mode);
      requireChecks(detected);
      return detected;
    },
    {
      successMessage: 'Runtime prerequisites look good.',
      errorMessage: 'Runtime prerequisites check failed.',
    }
  );
  await reportChecks('Runtime Checks', checks);

  await showInfo('Preparing ~/.headlessx workspace and syncing the repository...');
  ensureWorkspaceLayout();
  ensureRepo(branch);

  if (action === 'update') {
    if (mode === 'developer') {
      await maybeRunDeveloperSetup(options);
    }

    const urls = fallbackRuntimeUrls(mode);
    writeMode(mode);
    writeBranch(branch);

    const nextSteps = ['headlessx restart', 'headlessx status', 'headlessx doctor'];
    const summary = {
      workspaceRoot: getWorkspacePaths().root,
      repoPath: getWorkspacePaths().repo,
      mode,
      branch,
      updated: true,
      apiUrl: urls.apiUrl,
      webUrl: urls.webUrl,
      nextSteps,
    };

    if (canUseModernPrompts()) {
      await showNote('Update Ready', [
        `Mode: ${mode}`,
        `API: ${urls.apiUrl || 'configured in domain setup'}`,
        `Dashboard: ${urls.webUrl || 'configured in domain setup'}`,
        `Next steps: ${nextSteps.join('  |  ')}`,
      ]);
      await showOutro('HeadlessX is updated. Run headlessx restart to rebuild and load the latest version.');
      return;
    }

    writeStructured(summary, {
      title: 'headlessx update complete',
    });
    return;
  }

  let urls: { apiUrl: string; webUrl: string };
  if (mode === 'developer') {
    urls = await configureDeveloper(options);
    await maybeRunDeveloperSetup(options);
    if (!options.yes) {
      await maybeRunDeveloperOptionalTasks();
    }
  } else if (mode === 'production') {
    urls = await configureProduction(options);
  } else {
    urls = await configureSelfHost(options);
  }

  writeMode(mode);
  writeBranch(branch);
  clearLastStart();

  const skipStart = options.start === false;
  let started = false;
  if (!skipStart) {
    const shouldStart = options.yes
      ? true
      : await confirm(
          mode === 'developer'
            ? 'Start HeadlessX in developer mode now?'
            : mode === 'production'
              ? 'Start the production Docker stack now?'
              : 'Start HeadlessX with Docker now?',
          true
        );

    if (shouldStart) {
      if (mode === 'developer') {
        startDeveloper(branch);
      } else if (mode === 'production') {
        startProduction(branch);
      } else {
        startSelfHost(branch);
      }
      started = true;
    }
  }

  const nextSteps = started
    ? ['headlessx status', 'headlessx doctor']
    : ['headlessx start', 'headlessx status', 'headlessx doctor'];
  const summary = {
    workspaceRoot: getWorkspacePaths().root,
    repoPath: getWorkspacePaths().repo,
    mode,
    branch,
    started,
    apiUrl: urls.apiUrl,
    webUrl: urls.webUrl,
    nextSteps,
  };

  if (canUseModernPrompts()) {
    await showNote('Ready', [
      `Mode: ${mode}`,
      `API: ${urls.apiUrl}`,
      `Dashboard: ${urls.webUrl}`,
      `Started: ${started ? 'yes' : 'no'}`,
      `Next steps: ${nextSteps.join('  |  ')}`,
    ]);
    await showOutro(
      started
        ? 'HeadlessX is running. Use headlessx status to confirm services.'
        : 'HeadlessX is configured. Use headlessx start when you are ready.'
    );
    return;
  }

  writeStructured(summary, {
    title: `headlessx init complete`,
  });
}

export async function handleStartCommand(options: StartOptions = {}): Promise<void> {
  const mode = readMode();
  const branch = readBranch() ?? DEFAULT_BRANCH;
  if (!mode) {
    throw new Error('HeadlessX is not initialized yet. Run "headlessx init" first.');
  }

  const result =
    mode === 'developer'
      ? startDeveloper(branch)
      : mode === 'production'
        ? startProduction(branch, { build: options.build })
        : startSelfHost(branch, { build: options.build });

  writeStructured(
    {
      mode,
      branch,
      rebuilt: Boolean(options.build && mode !== 'developer'),
      ...result,
    },
    { title: 'headlessx start' }
  );
}

export async function handleStopCommand(): Promise<void> {
  const mode = readMode();
  if (!mode) {
    throw new Error('HeadlessX is not initialized yet. Run "headlessx init" first.');
  }

  if (mode === 'developer') {
    const lastStart = readLastStart();
    if (!lastStart?.pid) {
      clearLastStart();
      writeText('No running developer process was recorded.');
      return;
    }
    killDetachedProcess(lastStart.pid);
    clearLastStart();
    writeText('Stopped HeadlessX developer mode.');
    return;
  }

  stopDockerStack(mode);
  clearLastStart();
  writeText(mode === 'production' ? 'Stopped HeadlessX production stack.' : 'Stopped HeadlessX self-host stack.');
}

export async function handleRestartCommand(): Promise<void> {
  await handleStopCommand();
  await handleStartCommand({ build: true });
}

export async function handleBootstrapStatusCommand(options: StatusOptions): Promise<RuntimeSummary> {
  const runtime = await buildRuntimeSummary();
  writeStructured(runtime, {
    json: options.json,
    outputPath: options.output,
    pretty: options.pretty,
    title: `headlessx runtime`,
  });
  return runtime;
}

export async function collectBootstrapStatus(): Promise<RuntimeSummary> {
  return buildRuntimeSummary();
}

export async function handleDoctorCommand(options: DoctorOptions): Promise<void> {
  const mode = readMode();
  const repoPath = getWorkspacePaths().repo;
  const runtime = await buildRuntimeSummary();
  const checks = [
    checkCommand('git'),
    checkCommand('docker'),
    checkCommand('node', ['--version']),
    checkCommand('pnpm', ['--version']),
  ];

  const modelsDir = path.join(repoPath, 'apps/api/models');
  const modelChecks = {
    classificationModel: fs.existsSync(path.join(modelsDir, 'recaptcha_classification_57k.onnx')),
    detectionModel:
      fs.existsSync(path.join(modelsDir, 'yolo26x.onnx')) ||
      fs.existsSync(path.join(modelsDir, 'yolo26x.pt')),
  };

  const runtimeUrls = mode ? getRuntimeUrls(mode) : {};
  const apiHealth = runtimeUrls.apiUrl
    ? await checkHttpHealth(`${runtimeUrls.apiUrl.replace(/\/$/, '')}/api/health`)
    : { ok: false, detail: 'not configured' };
  const webHealth = runtimeUrls.webUrl
    ? await checkHttpHealth(runtimeUrls.webUrl)
    : { ok: false, detail: 'not configured' };

  const payload = {
    name: 'headlessx',
    version: packageJson.version,
    runtime,
    commands: checks,
    envFiles: runtime.envFiles,
    models: modelChecks,
    reachability: {
      api: apiHealth,
      web: webHealth,
    },
  };

  writeStructured(payload, {
    json: options.json,
    outputPath: options.output,
    pretty: options.pretty,
    title: 'headlessx doctor',
  });
}
