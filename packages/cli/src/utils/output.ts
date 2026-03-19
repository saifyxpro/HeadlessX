import * as fs from 'fs';
import * as path from 'path';

function ensureOutputDir(outputPath: string): void {
  const dir = path.dirname(outputPath);
  if (dir && dir !== '.' && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function writeText(content: string, outputPath?: string): void {
  const normalized = content.endsWith('\n') ? content : `${content}\n`;
  if (outputPath) {
    ensureOutputDir(outputPath);
    fs.writeFileSync(outputPath, normalized, 'utf-8');
    console.error(`Output written to: ${outputPath}`);
    return;
  }

  process.stdout.write(normalized);
}

export function writeJson(
  data: unknown,
  options: { outputPath?: string; pretty?: boolean } = {}
): void {
  const content = JSON.stringify(data, null, options.pretty ? 2 : 0);
  writeText(content, options.outputPath);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatLabel(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatScalar(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'boolean') {
    return value ? 'yes' : 'no';
  }

  return String(value);
}

function renderMarkdown(value: unknown, depth = 1): string[] {
  if (value === null || value === undefined) {
    return ['null'];
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return [formatScalar(value)];
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return ['- none'];
    }

    const lines: string[] = [];
    for (const item of value) {
      if (
        typeof item === 'string' ||
        typeof item === 'number' ||
        typeof item === 'boolean' ||
        item === null
      ) {
        lines.push(`- ${formatScalar(item)}`);
        continue;
      }

      if (isPlainObject(item)) {
        const title =
          typeof item.name === 'string'
            ? item.name
            : typeof item.id === 'string'
              ? item.id
              : 'item';
        lines.push(`- ${title}`);
        for (const [key, nestedValue] of Object.entries(item)) {
          if (key === 'name' || key === 'id') {
            continue;
          }
          if (
            typeof nestedValue === 'string' ||
            typeof nestedValue === 'number' ||
            typeof nestedValue === 'boolean' ||
            nestedValue === null
          ) {
            lines.push(`  ${formatLabel(key)}: ${formatScalar(nestedValue)}`);
          } else {
            lines.push(`  ${formatLabel(key)}:`);
            for (const childLine of renderMarkdown(nestedValue, depth + 1)) {
              lines.push(`  ${childLine}`);
            }
          }
        }
        continue;
      }

      lines.push(`- ${JSON.stringify(item)}`);
    }

    return lines;
  }

  if (isPlainObject(value)) {
    const lines: string[] = [];
    for (const [key, nestedValue] of Object.entries(value)) {
      const headingPrefix = '#'.repeat(Math.min(depth + 1, 6));
      if (
        typeof nestedValue === 'string' ||
        typeof nestedValue === 'number' ||
        typeof nestedValue === 'boolean' ||
        nestedValue === null
      ) {
        lines.push(`- **${formatLabel(key)}:** ${formatScalar(nestedValue)}`);
        continue;
      }

      lines.push(`${headingPrefix} ${formatLabel(key)}`);
      lines.push(...renderMarkdown(nestedValue, depth + 1));
      lines.push('');
    }

    return lines.filter((line, index, array) => !(line === '' && array[index - 1] === ''));
  }

  return [String(value)];
}

function shouldUseJson(options: { json?: boolean; outputPath?: string }): boolean {
  return Boolean(options.json || options.outputPath?.toLowerCase().endsWith('.json'));
}

export function writeStructured(
  data: unknown,
  options: { outputPath?: string; pretty?: boolean; json?: boolean; title?: string } = {}
): void {
  if (shouldUseJson(options)) {
    writeJson(data, {
      outputPath: options.outputPath,
      pretty: options.pretty,
    });
    return;
  }

  const lines = options.title ? [`# ${options.title}`, ''] : [];
  lines.push(...renderMarkdown(data));
  writeText(lines.join('\n').replace(/\n{3,}/g, '\n\n'), options.outputPath);
}

export function writeBuffer(buffer: Buffer, outputPath: string): void {
  ensureOutputDir(outputPath);
  fs.writeFileSync(outputPath, buffer);
  console.error(`Binary output written to: ${outputPath}`);
}

export function printKeyValue(title: string, pairs: Array<[string, string]>): void {
  const lines = [`${title}`];
  for (const [key, value] of pairs) {
    lines.push(`${key}: ${value}`);
  }
  writeText(lines.join('\n'));
}
