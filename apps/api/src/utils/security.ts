import crypto from 'crypto';

const API_KEY_HASH_PREFIX = 'sha256:';
const ENCRYPTED_SECRET_PREFIX = 'enc-v1:';

function requireCredentialEncryptionKey(): Buffer {
    const rawKey = process.env.CREDENTIAL_ENCRYPTION_KEY?.trim();

    if (!rawKey) {
        throw new Error('CREDENTIAL_ENCRYPTION_KEY environment variable is required');
    }

    // Derive a stable 32-byte key from the configured secret.
    return crypto.createHash('sha256').update(rawKey, 'utf8').digest();
}

export function assertSecurityConfiguration(): void {
    const missing: string[] = [];

    if (!process.env.DASHBOARD_INTERNAL_API_KEY?.trim()) {
        missing.push('DASHBOARD_INTERNAL_API_KEY');
    }

    if (!process.env.CREDENTIAL_ENCRYPTION_KEY?.trim()) {
        missing.push('CREDENTIAL_ENCRYPTION_KEY');
    }

    if (missing.length > 0) {
        throw new Error(`Missing required security environment variables: ${missing.join(', ')}`);
    }
}

export function hashApiKey(apiKey: string): string {
    return `${API_KEY_HASH_PREFIX}${crypto.createHash('sha256').update(apiKey, 'utf8').digest('hex')}`;
}

export function isHashedApiKey(value?: string | null): boolean {
    return Boolean(value && value.startsWith(API_KEY_HASH_PREFIX));
}

export function matchesInternalApiKey(candidate: string, configuredKey?: string): boolean {
    if (!candidate || !configuredKey) {
        return false;
    }

    const candidateBuffer = Buffer.from(candidate, 'utf8');
    const configuredBuffer = Buffer.from(configuredKey, 'utf8');

    if (candidateBuffer.length !== configuredBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(candidateBuffer, configuredBuffer);
}

export function encryptSecret(secret: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', requireCredentialEncryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return `${ENCRYPTED_SECRET_PREFIX}${iv.toString('base64url')}:${authTag.toString('base64url')}:${encrypted.toString('base64url')}`;
}

export function decryptSecret(secret?: string | null): string | null | undefined {
    if (secret === undefined || secret === null || secret === '') {
        return secret;
    }

    if (!secret.startsWith(ENCRYPTED_SECRET_PREFIX)) {
        return secret;
    }

    const payload = secret.slice(ENCRYPTED_SECRET_PREFIX.length);
    const [iv, authTag, encrypted] = payload.split(':');

    if (!iv || !authTag || !encrypted) {
        throw new Error('Invalid encrypted secret payload');
    }

    const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        requireCredentialEncryptionKey(),
        Buffer.from(iv, 'base64url')
    );

    decipher.setAuthTag(Buffer.from(authTag, 'base64url'));

    return Buffer.concat([
        decipher.update(Buffer.from(encrypted, 'base64url')),
        decipher.final()
    ]).toString('utf8');
}

export function isEncryptedSecret(secret?: string | null): boolean {
    return Boolean(secret && secret.startsWith(ENCRYPTED_SECRET_PREFIX));
}

export function normalizeSecretForCreate(secret?: string | null): string | null | undefined {
    if (secret === undefined) {
        return undefined;
    }

    if (secret === null) {
        return null;
    }

    const trimmed = secret.trim();
    if (!trimmed) {
        return null;
    }

    return encryptSecret(trimmed);
}

export function normalizeSecretForUpdate(secret?: string | null): string | null | undefined {
    if (secret === undefined) {
        return undefined;
    }

    if (secret === null) {
        return null;
    }

    const trimmed = secret.trim();
    if (!trimmed) {
        return undefined;
    }

    return encryptSecret(trimmed);
}

export function splitProxyUrlCredentials(proxyUrl?: string | null): {
    sanitizedUrl?: string | null;
    username?: string | null;
    password?: string | null;
} {
    if (proxyUrl === undefined) {
        return { sanitizedUrl: undefined };
    }

    if (proxyUrl === null || proxyUrl === '') {
        return { sanitizedUrl: proxyUrl ?? null };
    }

    try {
        const parsed = new URL(proxyUrl);
        const sanitizedUrl = `${parsed.protocol}//${parsed.host}`;
        const username = parsed.username ? decodeURIComponent(parsed.username) : null;
        const password = parsed.password ? decodeURIComponent(parsed.password) : null;
        return { sanitizedUrl, username, password };
    } catch {
        return { sanitizedUrl: proxyUrl };
    }
}

export function redactProxyUrlCredentials(proxyUrl?: string | null): string | null | undefined {
    return splitProxyUrlCredentials(proxyUrl).sanitizedUrl;
}
