import { prisma } from '../../database/client';
import { hashApiKey, matchesInternalApiKey } from '../../utils/security';

export type AuthenticatedApiKey = {
    id: string;
    name: string;
    prefix: string;
    isInternal: boolean;
};

class ApiKeyAuthService {
    public async authenticate(apiKey?: string | null): Promise<AuthenticatedApiKey | null> {
        const normalizedApiKey = apiKey?.trim();
        if (!normalizedApiKey) {
            return null;
        }

        const dashboardApiKey = process.env.DASHBOARD_INTERNAL_API_KEY?.trim();

        if (dashboardApiKey && matchesInternalApiKey(normalizedApiKey, dashboardApiKey)) {
            return {
                id: 'internal-dashboard',
                name: 'Internal Dashboard',
                prefix: normalizedApiKey.substring(0, 7),
                isInternal: true,
            };
        }

        const hashedApiKey = hashApiKey(normalizedApiKey);

        let keyRecord = await prisma.apiKey.findFirst({
            where: {
                key_hash: hashedApiKey,
                is_active: true,
            },
            select: {
                id: true,
                name: true,
                prefix: true,
            },
        });

        if (!keyRecord) {
            keyRecord = await prisma.apiKey.findFirst({
                where: {
                    key_hash: normalizedApiKey,
                    is_active: true,
                },
                select: {
                    id: true,
                    name: true,
                    prefix: true,
                },
            });

            if (keyRecord) {
                await prisma.apiKey.update({
                    where: { id: keyRecord.id },
                    data: {
                        key_hash: hashedApiKey,
                        prefix: normalizedApiKey.substring(0, 7),
                    },
                }).catch(() => { });

                keyRecord = {
                    ...keyRecord,
                    prefix: normalizedApiKey.substring(0, 7),
                };
            }
        }

        if (!keyRecord) {
            return null;
        }

        prisma.apiKey.update({
            where: { id: keyRecord.id },
            data: { last_used_at: new Date() },
        }).catch(() => { });

        return {
            id: keyRecord.id,
            name: keyRecord.name,
            prefix: keyRecord.prefix,
            isInternal: false,
        };
    }
}

export const apiKeyAuthService = new ApiKeyAuthService();
