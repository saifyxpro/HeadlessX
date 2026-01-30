import { Request, Response } from 'express';
import { prisma } from '../database/client';
import { profileService } from '../services/ProfileService';
import { browserService } from '../services/BrowserService';

export class DashboardController {
    /**
     * Get dashboard statistics
     * GET /api/dashboard/stats
     */
    static async getStats(req: Request, res: Response) {
        try {
            // Run queries in parallel for performance
            const [
                activeProxies,
                totalJobs,
                successfulJobs,
                profileStats
            ] = await Promise.all([
                prisma.proxy.count({ where: { is_active: true } }),
                prisma.requestLog.count(),
                prisma.requestLog.count({ where: { status_code: 200 } }),
                prisma.profile.aggregate({
                    _count: { id: true },
                    _sum: { cookies_count: true, storage_size_mb: true },
                    where: {
                        name: { not: 'Default Profile' }
                    }
                })
            ]);

            // Get Helper Service Stats
            const ramInfo = profileService.getRAMRecommendations();
            const browserStatus = browserService.getStatus();
            const runningBrowsersCount = browserStatus.profiles.length + (browserStatus.default ? 1 : 0);

            // Calculate success rate
            const failedRateVal = totalJobs > 0
                ? ((totalJobs - successfulJobs) / totalJobs) * 100
                : 0;

            // Format to 1 decimal place with %
            const failedRate = `${failedRateVal.toFixed(1)}%`;

            res.json({
                activeProxies,
                totalJobs,
                failedRate,
                credits: 5000,
                // Profile Stats
                totalProfiles: profileStats._count.id,
                totalCookies: profileStats._sum.cookies_count || 0,
                storageUsage: (profileStats._sum.storage_size_mb || 0).toFixed(1),
                // Browser Stats (Fix for System Status)
                runningBrowsers: runningBrowsersCount,
                system: ramInfo
            });
        } catch (error) {
            console.error('Dashboard Stats Error:', error);
            res.status(500).json({ error: 'Failed to fetch dashboard stats' });
        }
    }
}
