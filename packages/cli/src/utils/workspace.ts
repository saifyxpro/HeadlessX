import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

export type SetupMode = 'developer' | 'self-host' | 'production';

export interface RuntimeState {
  mode: SetupMode;
  branch: string;
  startedAt: string;
  apiUrl?: string;
  webUrl?: string;
  pid?: number;
  logPath?: string;
}

export interface WorkspacePaths {
  root: string;
  repo: string;
  runtime: string;
  logs: string;
  backups: string;
  modeFile: string;
  branchFile: string;
  lastStartFile: string;
}

export const DEFAULT_BRANCH = 'main';
export const DEFAULT_REPO_URL = 'https://github.com/saifyxpro/HeadlessX.git';

export function getWorkspaceRoot(): string {
  return process.env.HEADLESSX_WORKSPACE_DIR?.trim() || path.join(os.homedir(), '.headlessx');
}

export function getRepoUrl(): string {
  return process.env.HEADLESSX_REPO_URL?.trim() || DEFAULT_REPO_URL;
}

export function getWorkspacePaths(): WorkspacePaths {
  const root = getWorkspaceRoot();
  const runtime = path.join(root, 'runtime');

  return {
    root,
    repo: path.join(root, 'repo'),
    runtime,
    logs: path.join(root, 'logs'),
    backups: path.join(root, 'backups'),
    modeFile: path.join(runtime, 'mode'),
    branchFile: path.join(runtime, 'branch'),
    lastStartFile: path.join(runtime, 'last-start.json'),
  };
}

export function ensureWorkspaceLayout(): WorkspacePaths {
  const paths = getWorkspacePaths();
  for (const dir of [paths.root, paths.runtime, paths.logs, paths.backups]) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return paths;
}

function readTextFile(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return fs.readFileSync(filePath, 'utf-8').trim();
  } catch {
    return null;
  }
}

export function readMode(): SetupMode | null {
  const mode = readTextFile(getWorkspacePaths().modeFile);
  if (mode === 'developer' || mode === 'self-host' || mode === 'production') {
    return mode;
  }
  return null;
}

export function writeMode(mode: SetupMode): void {
  const paths = ensureWorkspaceLayout();
  fs.writeFileSync(paths.modeFile, `${mode}\n`, 'utf-8');
}

export function readBranch(): string | null {
  return readTextFile(getWorkspacePaths().branchFile);
}

export function writeBranch(branch: string): void {
  const paths = ensureWorkspaceLayout();
  fs.writeFileSync(paths.branchFile, `${branch}\n`, 'utf-8');
}

export function readLastStart(): RuntimeState | null {
  try {
    const filePath = getWorkspacePaths().lastStartFile;
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as RuntimeState;
  } catch {
    return null;
  }
}

export function writeLastStart(state: RuntimeState): void {
  const paths = ensureWorkspaceLayout();
  fs.writeFileSync(paths.lastStartFile, JSON.stringify(state, null, 2), 'utf-8');
}

export function clearLastStart(): void {
  const filePath = getWorkspacePaths().lastStartFile;
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
