import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '..', '..', '..', '.env');
const hasEnvFile = fs.existsSync(envPath);

if (hasEnvFile) {
    const result = dotenv.config({ path: envPath });

    if (result.error) {
        console.warn(`⚠️ Could not load .env from ${envPath}`);
    } else {
        console.log(`✅ Loaded environment from ${envPath}`);
    }
} else {
    const hasInjectedEnv = Boolean(
        process.env.DATABASE_URL ||
        process.env.DASHBOARD_INTERNAL_API_KEY ||
        process.env.CREDENTIAL_ENCRYPTION_KEY
    );

    if (!hasInjectedEnv) {
        console.warn(`⚠️ Could not load .env from ${envPath}`);
    }
}
