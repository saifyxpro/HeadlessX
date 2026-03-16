import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appEnvLocalPath = path.resolve(__dirname, '..', '.env.local');
const rootEnvPath = path.resolve(__dirname, '..', '..', '..', '.env');
const loadedPaths: string[] = [];

for (const envPath of [appEnvLocalPath, rootEnvPath]) {
    if (!fs.existsSync(envPath)) {
        continue;
    }

    const result = dotenv.config({ path: envPath });

    if (result.error) {
        console.warn(`⚠️ Could not load .env from ${envPath}`);
        continue;
    }

    loadedPaths.push(envPath);
}

if (loadedPaths.length > 0) {
    for (const loadedPath of loadedPaths) {
        console.log(`✅ Loaded environment from ${loadedPath}`);
    }
} else {
    const hasInjectedEnv = Boolean(
        process.env.DATABASE_URL ||
        process.env.DASHBOARD_INTERNAL_API_KEY ||
        process.env.CREDENTIAL_ENCRYPTION_KEY
    );

    if (!hasInjectedEnv) {
        console.warn(`⚠️ Could not load .env from ${appEnvLocalPath} or ${rootEnvPath}`);
    }
}
