import { Request, Response } from 'express';
import { prisma } from '../database/client';
import { configService } from '../services/ConfigService';
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
                totalProxies,
                totalJobs,
                successfulJobs,
                config
            ] = await Promise.all([
                prisma.proxy.count({ where: { is_active: true } }),
                prisma.proxy.count(),
                prisma.requestLog.count(),
                prisma.requestLog.count({ where: { status_code: 200 } }),
                configService.getConfig()
            ]);

            const browserStatus = browserService.getStatus();
            const runningBrowsersCount = browserStatus.default ? 1 : 0;

            // Calculate success rate
            const failedRateVal = totalJobs > 0
                ? ((totalJobs - successfulJobs) / totalJobs) * 100
                : 0;

            // Format to 1 decimal place with %
            const failedRate = `${failedRateVal.toFixed(1)}%`;

            res.json({
                activeProxies,
                totalProxies,
                totalJobs,
                failedRate,
                runningBrowsers: runningBrowsersCount,
                maxConcurrency: config.maxConcurrency,
                browserHeadless: config.browserHeadless,
                proxyEnabled: config.proxyEnabled
            });
        } catch (error) {
            console.error('Dashboard Stats Error:', error);
            res.status(500).json({ error: 'Failed to fetch dashboard stats' });
        }
    }
}
