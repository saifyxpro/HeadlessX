import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Get the directory of this file (src/)
// CommonJS environment provides __dirname directly
const envPath = path.resolve(__dirname, '..', '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.warn(`⚠️ Could not load .env from ${envPath}`);
} else {
    console.log(`✅ Loaded environment from ${envPath}`);
}
