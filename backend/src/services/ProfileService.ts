import { prisma } from '../database/client';
import path from 'path';
import fs from 'fs';
import os from 'os';

export interface Profile {
    id: string;
    name: string;
    description?: string | null;
    screenWidth: number;
    screenHeight: number;
    userAgent?: string | null;
    locale: string;
    timezone?: string | null;
    storageType: 'local' | 'memory';
    proxyMode: 'none' | 'tor' | 'datacenter' | 'residential' | 'custom' | 'saved';
    proxyId?: string | null;
    proxyUrl?: string | null;
    proxyUsername?: string | null;
    proxyPassword?: string | null;
    isActive: boolean;
    isRunning: boolean;
    cookiesCount: number;
    storageSizeMb: number;
    createdAt: Date;
    updatedAt: Date;
    lastUsedAt?: Date | null;
    proxy?: {
        id: string;
        name: string;
        protocol: string;
        host: string;
        port: number;
        username?: string | null;
        password?: string | null;
    } | null;
}

export interface CreateProfileInput {
    name: string;
    description?: string;
    screenWidth?: number;
    screenHeight?: number;
    userAgent?: string;
    locale?: string;
    timezone?: string;
    proxyId?: string;
    proxyUrl?: string;
    proxyUsername?: string;
    proxyPassword?: string;
}

export interface UpdateProfileInput {
    name?: string;
    description?: string;
    screenWidth?: number;
    screenHeight?: number;
    userAgent?: string | null;
    locale?: string;
    timezone?: string;
    proxyId?: string | null;
    proxyUrl?: string | null;
    proxyUsername?: string | null;
    proxyPassword?: string | null;
    isActive?: boolean;
}

// RAM-based profile recommendations
export interface SystemRAMInfo {
    totalRAM: number; // GB
    freeRAM: number; // GB
    usedRAM: number; // GB
    usagePercent: number; // 0-100
    recommendedProfiles: number;
    recommendedPagesPerProfile: number;
}

class ProfileService {
    private static instance: ProfileService;
    private readonly profilesDir: string;

    private constructor() {
        this.profilesDir = path.join(process.cwd(), 'profiles');
        if (!fs.existsSync(this.profilesDir)) {
            fs.mkdirSync(this.profilesDir, { recursive: true });
        }
    }

    public static getInstance(): ProfileService {
        if (!ProfileService.instance) {
            ProfileService.instance = new ProfileService();
        }
        return ProfileService.instance;
    }

    /**
     * Map Prisma model to Profile interface
     */
    private mapToProfile(dbProfile: any): Profile {
        return {
            id: dbProfile.id,
            name: dbProfile.name,
            description: dbProfile.description,
            screenWidth: dbProfile.screen_width,
            screenHeight: dbProfile.screen_height,
            userAgent: dbProfile.user_agent,
            locale: dbProfile.locale,
            timezone: dbProfile.timezone,
            storageType: dbProfile.storage_type,
            proxyMode: dbProfile.proxy_mode,
            proxyId: dbProfile.proxy_id,
            proxyUrl: dbProfile.proxy_url,
            proxyUsername: dbProfile.proxy_username,
            proxyPassword: dbProfile.proxy_password,
            isActive: dbProfile.is_active,
            isRunning: dbProfile.is_running,
            cookiesCount: dbProfile.cookies_count,
            storageSizeMb: dbProfile.storage_size_mb,
            createdAt: dbProfile.created_at,
            updatedAt: dbProfile.updated_at,
            lastUsedAt: dbProfile.last_used_at,
            proxy: dbProfile.proxy ? {
                id: dbProfile.proxy.id,
                name: dbProfile.proxy.name,
                protocol: dbProfile.proxy.protocol,
                host: dbProfile.proxy.host,
                port: dbProfile.proxy.port,
                username: dbProfile.proxy.username,
                password: dbProfile.proxy.password,
            } : null,
        };
    }

    /**
     * Create a new profile
     */
    public async create(input: CreateProfileInput): Promise<Profile> {
        const profile = await prisma.profile.create({
            data: {
                name: input.name,
                description: input.description,
                screen_width: input.screenWidth ?? 1920,
                screen_height: input.screenHeight ?? 1080,
                user_agent: input.userAgent,
                locale: input.locale ?? 'en-US',
                timezone: input.timezone,
                proxy_id: input.proxyId || null,
                proxy_url: input.proxyUrl,
                proxy_username: input.proxyUsername,
                proxy_password: input.proxyPassword,
            },
            include: { proxy: true },
        });

        // Create profile directory
        const profileDir = path.join(this.profilesDir, profile.id);
        if (!fs.existsSync(profileDir)) {
            fs.mkdirSync(profileDir, { recursive: true });
        }

        return this.mapToProfile(profile);
    }

    /**
     * Get all profiles
     */
    public async getAll(): Promise<Profile[]> {
        const profiles = await prisma.profile.findMany({
            orderBy: { created_at: 'desc' },
            include: { proxy: true },
        });
        return profiles.map(p => this.mapToProfile(p));
    }

    /**
     * Get active profiles only
     */
    public async getActive(): Promise<Profile[]> {
        const profiles = await prisma.profile.findMany({
            where: { is_active: true },
            orderBy: { last_used_at: 'desc' },
            include: { proxy: true },
        });
        return profiles.map(p => this.mapToProfile(p));
    }

    /**
     * Get profile by ID
     */
    public async getById(id: string): Promise<Profile | null> {
        const profile = await prisma.profile.findUnique({
            where: { id },
            include: { proxy: true },
        });
        return profile ? this.mapToProfile(profile) : null;
    }

    /**
     * Get profile by name
     */
    public async getByName(name: string): Promise<Profile | null> {
        const profile = await prisma.profile.findUnique({
            where: { name },
            include: { proxy: true },
        });
        return profile ? this.mapToProfile(profile) : null;
    }

    /**
     * Update profile
     */
    public async update(id: string, input: UpdateProfileInput): Promise<Profile> {
        const profile = await prisma.profile.update({
            where: { id },
            data: {
                name: input.name,
                description: input.description,
                screen_width: input.screenWidth,
                screen_height: input.screenHeight,
                user_agent: input.userAgent,
                locale: input.locale,
                timezone: input.timezone,
                proxy_id: input.proxyId !== undefined ? (input.proxyId || null) : undefined,
                proxy_url: input.proxyUrl,
                proxy_username: input.proxyUsername,
                proxy_password: input.proxyPassword,
                is_active: input.isActive,
            },
            include: { proxy: true },
        });
        return this.mapToProfile(profile);
    }

    /**
     * Update last used timestamp
     */
    public async updateLastUsed(id: string): Promise<void> {
        await prisma.profile.update({
            where: { id },
            data: { last_used_at: new Date() },
        });
    }

    /**
     * Update running status
     */
    public async setRunning(id: string, isRunning: boolean): Promise<void> {
        await prisma.profile.update({
            where: { id },
            data: { is_running: isRunning },
        });
    }

    /**
     * Update storage stats for a profile
     */
    public async updateStorageStats(id: string): Promise<void> {
        const profileDir = path.join(this.profilesDir, id);

        if (!fs.existsSync(profileDir)) {
            return;
        }

        // Calculate directory size
        let totalSize = 0;
        const files = this.getAllFiles(profileDir);
        for (const file of files) {
            const stats = fs.statSync(file);
            totalSize += stats.size;
        }

        // Count cookies (approximate from cookies.sqlite)
        let cookiesCount = 0;
        const cookiesFile = path.join(profileDir, 'cookies.sqlite');
        if (fs.existsSync(cookiesFile)) {
            // Simple estimate based on file size
            const cookiesSize = fs.statSync(cookiesFile).size;
            cookiesCount = Math.floor(cookiesSize / 500); // Rough estimate
        }

        await prisma.profile.update({
            where: { id },
            data: {
                storage_size_mb: totalSize / (1024 * 1024),
                cookies_count: cookiesCount,
            },
        });
    }

    /**
     * Delete profile
     */
    public async delete(id: string): Promise<void> {
        // Delete from database
        await prisma.profile.delete({
            where: { id },
        });

        // Delete profile directory
        const profileDir = path.join(this.profilesDir, id);
        if (fs.existsSync(profileDir)) {
            fs.rmSync(profileDir, { recursive: true, force: true });
        }
    }

    /**
     * Clear profile data (cookies, cache, etc.) but keep profile
     */
    public async clearData(id: string): Promise<void> {
        const profileDir = path.join(this.profilesDir, id);

        if (fs.existsSync(profileDir)) {
            fs.rmSync(profileDir, { recursive: true, force: true });
            fs.mkdirSync(profileDir, { recursive: true });
        }

        await prisma.profile.update({
            where: { id },
            data: {
                storage_size_mb: 0,
                cookies_count: 0,
            },
        });
    }

    /**
     * Get RAM-based recommendations
     */
    public getRAMRecommendations(): SystemRAMInfo {
        const total = os.totalmem();
        const free = os.freemem();
        const used = total - free;
        const usagePercent = Math.round((used / total) * 100);

        const totalRAMGb = total / (1024 * 1024 * 1024); // Convert to GB
        const freeRAMGb = free / (1024 * 1024 * 1024);
        const usedRAMGb = used / (1024 * 1024 * 1024);

        let recommendedProfiles: number;
        let recommendedPagesPerProfile: number;

        if (totalRAMGb <= 4) {
            recommendedProfiles = 2;
            recommendedPagesPerProfile = 2;
        } else if (totalRAMGb <= 8) {
            recommendedProfiles = 4;
            recommendedPagesPerProfile = 3;
        } else if (totalRAMGb <= 16) {
            recommendedProfiles = 8;
            recommendedPagesPerProfile = 5;
        } else if (totalRAMGb <= 32) {
            recommendedProfiles = 16;
            recommendedPagesPerProfile = 8;
        } else {
            recommendedProfiles = 24;
            recommendedPagesPerProfile = 10;
        }

        return {
            totalRAM: Math.round(totalRAMGb * 10) / 10,
            freeRAM: Math.round(freeRAMGb * 10) / 10,
            usedRAM: Math.round(usedRAMGb * 10) / 10,
            usagePercent,
            recommendedProfiles,
            recommendedPagesPerProfile,
        };
    }

    /**
     * Update stats for all profiles (cookies, storage)
     */
    public async updateAllStats(): Promise<void> {
        const profiles = await prisma.profile.findMany({ select: { id: true } });
        for (const profile of profiles) {
            await this.updateStorageStats(profile.id);
        }
    }

    /**
     * Get profile stats summary
     */
    public async getStats(): Promise<{
        total: number;
        active: number;
        running: number;
        totalStorageMb: number;
        totalCookies: number;
    }> {
        // Force update statistics to ensure accuracy
        await this.updateAllStats();

        const profiles = await prisma.profile.findMany();

        return {
            total: profiles.length,
            active: profiles.filter(p => p.is_active).length,
            running: profiles.filter(p => p.is_running).length,
            totalStorageMb: profiles.reduce((sum, p) => sum + p.storage_size_mb, 0),
            totalCookies: profiles.reduce((sum, p) => sum + p.cookies_count, 0),
        };
    }

    /**
     * Helper: Get all files in directory recursively
     */
    private getAllFiles(dir: string): string[] {
        const files: string[] = [];

        if (!fs.existsSync(dir)) {
            return files;
        }

        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                files.push(...this.getAllFiles(fullPath));
            } else {
                files.push(fullPath);
            }
        }

        return files;
    }

    /**
     * Ensure at least one default profile exists
     */
    public async ensureDefaultProfile(): Promise<void> {
        const profiles = await prisma.profile.findMany({ take: 1 });

        if (profiles.length === 0) {
            console.log('📦 Creating default profile...');
            await this.create({
                name: 'Default Profile',
                description: 'Auto-created default browser profile',
                screenWidth: 1920,
                screenHeight: 1080,
                locale: 'en-US',
            });
            console.log('✅ Default profile created');
        }
    }
}

export const profileService = ProfileService.getInstance();
