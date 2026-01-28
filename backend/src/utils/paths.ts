import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Get __dirname equivalent (No-op in CommonJS)
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
