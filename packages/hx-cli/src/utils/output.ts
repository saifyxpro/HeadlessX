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
