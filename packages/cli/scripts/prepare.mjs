import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const packageRoot = path.resolve(import.meta.dirname, '..');
const huskyEntry = path.join(packageRoot, 'node_modules', 'husky', 'index.js');

if (!existsSync(huskyEntry)) {
  process.exit(0);
}

try {
  const huskyModule = await import(pathToFileURL(huskyEntry).href);
  const install = huskyModule.default;

  if (typeof install === 'function') {
    await install();
  }
} catch {
  process.exit(0);
}
