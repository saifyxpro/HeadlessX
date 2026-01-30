import { Request, Response } from 'express';
import { profileService, type Profile } from '../services/ProfileService';
import { browserService } from '../services/BrowserService';
import { z } from 'zod';

// Transform Profile to snake_case for API response
function toSnakeCase(profile: Profile) {
    return {
        id: profile.id,
        name: profile.name,
        description: profile.description,
        screen_width: profile.screenWidth,
        screen_height: profile.screenHeight,
        locale: profile.locale,
        timezone: profile.timezone,
        storage_type: profile.storageType,
        proxy_mode: profile.proxyMode,
        proxy_id: profile.proxyId,
        proxy_url: profile.proxyUrl,
        proxy_username: profile.proxyUsername,
        proxy_password: profile.proxyPassword,
        is_active: profile.isActive,
        is_running: profile.isRunning,
        cookies_count: profile.cookiesCount,
        storage_size_mb: profile.storageSizeMb,
        created_at: profile.createdAt,
        updated_at: profile.updatedAt,
        last_used_at: profile.lastUsedAt,
        proxy: profile.proxy,
    };
}

// Validation schemas
// Validation schemas
const BaseProfileObject = z.object({
    name: z.string().min(1).max(50),
    description: z.string().max(200).optional(),
    screenWidth: z.number().int().min(800).max(3840).optional(),
    screenHeight: z.number().int().min(600).max(2160).optional(),
    locale: z.string().optional(),
    timezone: z.string().optional(),
    storageType: z.enum(['local', 'memory']).optional().default('local'),
    proxyMode: z.enum(['none', 'tor', 'datacenter', 'residential', 'custom', 'saved']).optional().default('none'),
    proxyId: z.string().nullable().optional().or(z.literal('')),
    proxyUrl: z.string().url().nullable().optional().or(z.literal('')),
    proxyUsername: z.string().nullable().optional(),
    proxyPassword: z.string().nullable().optional(),
});

const CreateProfileSchema = BaseProfileObject.superRefine((data, ctx) => {
    if (data.proxyMode === 'saved' && !data.proxyId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Proxy ID is required when proxy mode is 'saved'",
            path: ["proxyId"],
        });
    }
    if (data.proxyMode === 'custom' && !data.proxyUrl) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Proxy URL is required when proxy mode is 'custom'",
            path: ["proxyUrl"],
        });
    }
});

const UpdateProfileSchema = BaseProfileObject.partial();

export class ProfileController {
    /**
     * GET /api/profiles
     * List all profiles
     */
    static async list(req: Request, res: Response) {
        try {
            const activeOnly = req.query.active === 'true';
            const profiles = activeOnly
                ? await profileService.getActive()
                : await profileService.getAll();

            res.json({
                success: true,
                profiles: profiles.map(toSnakeCase),
                count: profiles.length,
            });
        } catch (error: any) {
            console.error('❌ Profile list error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to list profiles',
            });
        }
    }

    /**
     * GET /api/profiles/stats
     * Get profile statistics
     */
    static async stats(req: Request, res: Response) {
        try {
            const stats = await profileService.getStats();
            const ramInfo = profileService.getRAMRecommendations();
            const browserStatus = browserService.getStatus();

            res.json({
                success: true,
                stats: {
                    ...stats,
                    runningBrowsers: browserStatus.profiles.length + (browserStatus.default ? 1 : 0),
                },
                system: ramInfo,
            });
        } catch (error: any) {
            console.error('❌ Profile stats error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to get profile stats',
            });
        }
    }

    /**
     * GET /api/profiles/recommendations
     * Get RAM-based recommendations
     */
    static async recommendations(req: Request, res: Response) {
        try {
            const ramInfo = profileService.getRAMRecommendations();

            res.json({
                success: true,
                ...ramInfo,
                message: `With ${ramInfo.totalRAM}GB RAM, you can run up to ${ramInfo.recommendedProfiles} profiles with ${ramInfo.recommendedPagesPerProfile} pages each.`,
            });
        } catch (error: any) {
            console.error('❌ Recommendations error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to get recommendations',
            });
        }
    }

    /**
     * GET /api/profiles/:id
     * Get single profile
     */
    static async get(req: Request, res: Response) {
        try {
            const { id } = req.params as { id: string };
            const profile = await profileService.getById(id);

            if (!profile) {
                return res.status(404).json({
                    success: false,
                    error: 'Profile not found',
                });
            }

            res.json({
                success: true,
                profile: toSnakeCase(profile),
            });
        } catch (error: any) {
            console.error('❌ Profile get error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to get profile',
            });
        }
    }

    /**
     * POST /api/profiles
     * Create new profile
     */
    static async create(req: Request, res: Response) {
        try {
            const validation = CreateProfileSchema.safeParse(req.body);

            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: validation.error.message,
                });
            }

            // Check if name already exists
            const existing = await profileService.getByName(validation.data.name);
            if (existing) {
                return res.status(409).json({
                    success: false,
                    error: 'Profile with this name already exists',
                });
            }

            const profile = await profileService.create({
                ...validation.data,
                proxyUrl: validation.data.proxyUrl || undefined,
            });

            res.status(201).json({
                success: true,
                profile: toSnakeCase(profile),
                message: `Profile "${profile.name}" created successfully`,
            });
        } catch (error: any) {
            console.error('❌ Profile create error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to create profile',
            });
        }
    }

    /**
     * PATCH /api/profiles/:id
     * Update profile
     */
    static async update(req: Request, res: Response) {
        try {
            const { id } = req.params as { id: string };
            const validation = UpdateProfileSchema.safeParse(req.body);

            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: validation.error.message,
                });
            }

            // Check if profile exists
            const existing = await profileService.getById(id);
            if (!existing) {
                return res.status(404).json({
                    success: false,
                    error: 'Profile not found',
                });
            }

            // Check name uniqueness if changing name
            if (validation.data.name && validation.data.name !== existing.name) {
                const nameExists = await profileService.getByName(validation.data.name);
                if (nameExists) {
                    return res.status(409).json({
                        success: false,
                        error: 'Profile with this name already exists',
                    });
                }
            }

            const profile = await profileService.update(id, validation.data);

            res.json({
                success: true,
                profile: toSnakeCase(profile),
                message: `Profile "${profile.name}" updated successfully`,
            });
        } catch (error: any) {
            console.error('❌ Profile update error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to update profile',
            });
        }
    }

    /**
     * DELETE /api/profiles/:id
     * Delete profile
     */
    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params as { id: string };

            // Check if profile exists
            const existing = await profileService.getById(id);
            if (!existing) {
                return res.status(404).json({
                    success: false,
                    error: 'Profile not found',
                });
            }

            // Close browser if running
            await browserService.closeProfile(id);

            // Delete profile
            await profileService.delete(id);

            res.json({
                success: true,
                message: `Profile "${existing.name}" deleted successfully`,
            });
        } catch (error: any) {
            console.error('❌ Profile delete error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to delete profile',
            });
        }
    }

    /**
     * POST /api/profiles/:id/launch
     * Launch browser for profile
     */
    static async launch(req: Request, res: Response) {
        try {
            const { id } = req.params as { id: string };

            // Check if profile exists
            const profile = await profileService.getById(id);
            if (!profile) {
                return res.status(404).json({
                    success: false,
                    error: 'Profile not found',
                });
            }

            // Launch browser with profile
            const { page, context } = await browserService.getPageWithProfile(id);

            // Update running status
            await profileService.setRunning(id, true);

            // Navigate to a test page
            await page.goto('about:blank');

            const updatedProfile = await profileService.getById(id);
            res.json({
                success: true,
                message: `Browser launched for profile "${profile.name}"`,
                profile: updatedProfile ? toSnakeCase(updatedProfile) : null,
            });
        } catch (error: any) {
            console.error('❌ Profile launch error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to launch browser',
            });
        }
    }

    /**
     * POST /api/profiles/:id/stop
     * Stop browser for profile
     */
    static async stop(req: Request, res: Response) {
        try {
            const { id } = req.params as { id: string };

            // Check if profile exists
            const profile = await profileService.getById(id);
            if (!profile) {
                return res.status(404).json({
                    success: false,
                    error: 'Profile not found',
                });
            }

            // Close browser
            await browserService.closeProfile(id);

            // Update running status
            await profileService.setRunning(id, false);

            // Update storage stats
            await profileService.updateStorageStats(id);

            const stoppedProfile = await profileService.getById(id);
            res.json({
                success: true,
                message: `Browser stopped for profile "${profile.name}"`,
                profile: stoppedProfile ? toSnakeCase(stoppedProfile) : null,
            });
        } catch (error: any) {
            console.error('❌ Profile stop error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to stop browser',
            });
        }
    }

    /**
     * POST /api/profiles/:id/clear
     * Clear profile data (cookies, cache, etc.)
     */
    static async clear(req: Request, res: Response) {
        try {
            const { id } = req.params as { id: string };

            // Check if profile exists
            const profile = await profileService.getById(id);
            if (!profile) {
                return res.status(404).json({
                    success: false,
                    error: 'Profile not found',
                });
            }

            // Close browser if running
            await browserService.closeProfile(id);
            await profileService.setRunning(id, false);

            // Clear data
            await profileService.clearData(id);

            const clearedProfile = await profileService.getById(id);
            res.json({
                success: true,
                message: `Data cleared for profile "${profile.name}"`,
                profile: clearedProfile ? toSnakeCase(clearedProfile) : null,
            });
        } catch (error: any) {
            console.error('❌ Profile clear error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to clear profile data',
            });
        }
    }
}
