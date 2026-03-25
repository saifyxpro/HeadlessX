import { stdin as input, stdout as output } from 'node:process';
import picocolors from 'picocolors';

type ClackModule = typeof import('@clack/prompts');

let clackPromise: Promise<ClackModule> | undefined;
let introShown = false;

function isInteractiveSession(): boolean {
  return Boolean(input.isTTY && output.isTTY);
}

function brand(value = 'HeadlessX'): string {
  return picocolors.bold(picocolors.blue(value));
}

function detail(value: string): string {
  return picocolors.dim(value);
}

async function loadClack(): Promise<ClackModule> {
  if (!clackPromise) {
    // @clack/prompts is ESM-only, while the published CLI still ships CommonJS.
    const importer = new Function(
      'specifier',
      'return import(specifier);'
    ) as (specifier: string) => Promise<ClackModule>;
    clackPromise = importer('@clack/prompts');
  }

  return clackPromise;
}

async function unwrapPrompt<T>(result: T | symbol, cancelMessage: string): Promise<T> {
  const clack = await loadClack();
  if (clack.isCancel(result)) {
    clack.cancel(picocolors.yellow(cancelMessage));
    process.exit(0);
  }

  return result;
}

export function canUseModernPrompts(): boolean {
  return isInteractiveSession();
}

export async function showIntro(title: string, description?: string): Promise<void> {
  if (!canUseModernPrompts() || introShown) {
    return;
  }

  const clack = await loadClack();
  const lines = [`${brand()} ${detail(title)}`];
  if (description) {
    lines.push(detail(description));
  }
  clack.intro(lines.join('\n'));
  introShown = true;
}

export async function showOutro(message: string): Promise<void> {
  if (!canUseModernPrompts()) {
    return;
  }

  const clack = await loadClack();
  clack.outro(picocolors.blue(message));
}

export async function showNote(title: string, content: string | string[]): Promise<void> {
  if (!canUseModernPrompts()) {
    return;
  }

  const clack = await loadClack();
  const body = Array.isArray(content) ? content.join('\n') : content;
  clack.note(body, brand(title));
}

export async function showStep(message: string): Promise<void> {
  if (!canUseModernPrompts()) {
    return;
  }

  const clack = await loadClack();
  clack.log.step(message);
}

export async function showInfo(message: string): Promise<void> {
  if (!canUseModernPrompts()) {
    return;
  }

  const clack = await loadClack();
  clack.log.info(message);
}

export async function promptText(options: {
  message: string;
  defaultValue?: string;
  placeholder?: string;
  validate?: (value: string | undefined) => string | Error | undefined;
  cancelMessage?: string;
}): Promise<string> {
  if (!canUseModernPrompts()) {
    const fallback = options.defaultValue?.trim();
    if (fallback) {
      return fallback;
    }
    throw new Error('Interactive input is required for this command.');
  }

  const clack = await loadClack();
  const result = await clack.text({
    message: options.message,
    defaultValue: options.defaultValue,
    placeholder: options.placeholder,
    validate: options.validate,
  });

  return unwrapPrompt(result, options.cancelMessage ?? 'Setup cancelled.');
}

export async function promptPassword(options: {
  message: string;
  validate?: (value: string | undefined) => string | Error | undefined;
  cancelMessage?: string;
}): Promise<string> {
  if (!canUseModernPrompts()) {
    throw new Error('Interactive input is required for this command.');
  }

  const clack = await loadClack();
  const result = await clack.password({
    message: options.message,
    validate: options.validate,
  });

  return unwrapPrompt(result, options.cancelMessage ?? 'Login cancelled.');
}

export async function promptConfirm(options: {
  message: string;
  defaultValue?: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  cancelMessage?: string;
}): Promise<boolean> {
  if (!canUseModernPrompts()) {
    return options.defaultValue ?? true;
  }

  const clack = await loadClack();
  const result = await clack.confirm({
    message: options.message,
    initialValue: options.defaultValue ?? true,
    active: options.activeLabel ?? 'Yes',
    inactive: options.inactiveLabel ?? 'No',
  });

  return unwrapPrompt(result, options.cancelMessage ?? 'Setup cancelled.');
}

export async function promptSelect<Value extends string>(options: {
  message: string;
  initialValue?: Value;
  values: Array<{ value: Value; label: string; hint?: string }>;
  cancelMessage?: string;
}): Promise<Value> {
  if (!canUseModernPrompts()) {
    if (options.initialValue) {
      return options.initialValue;
    }
    throw new Error('Interactive input is required for this command.');
  }

  const clack = await loadClack();
  const result = await clack.select<Value>({
    message: options.message,
    initialValue: options.initialValue,
    options: options.values as any,
  });

  return unwrapPrompt(result, options.cancelMessage ?? 'Setup cancelled.');
}

export async function withSpinner<T>(
  message: string,
  task: () => Promise<T> | T,
  options: {
    successMessage?: string;
    errorMessage?: string;
  } = {}
): Promise<T> {
  if (!canUseModernPrompts()) {
    return Promise.resolve(task());
  }

  const clack = await loadClack();
  const spinner = clack.spinner();
  spinner.start(message);

  try {
    const result = await Promise.resolve(task());
    spinner.stop(options.successMessage ?? message);
    return result;
  } catch (error) {
    spinner.error(options.errorMessage ?? 'Command failed.');
    throw error;
  }
}
