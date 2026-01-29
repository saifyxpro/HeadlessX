import path from 'path';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get __dirname equivalent for this module
 */
export function getDirname(): string {
    return __dirname;
}

/**
 * Get project root directory (backend folder)
 */
export function getProjectRoot(): string {
    // This file is in src/utils/, so go up 2 levels to get to backend/
    return path.resolve(__dirname, '../..');
}
