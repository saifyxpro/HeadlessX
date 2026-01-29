import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '..', '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.warn(`⚠️ Could not load .env from ${envPath}`);
} else {
    console.log(`✅ Loaded environment from ${envPath}`);
}
