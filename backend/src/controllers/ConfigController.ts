import { Request, Response } from 'express';
import { prisma } from '../database/client';
import { configService } from '../services/ConfigService';
import { browserService } from '../services/BrowserService';

export class ConfigController {

    static async getConfig(req: Request, res: Response) {
        try {
            const config = await configService.getConfig();
            res.json({ success: true, config });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    static async updateConfig(req: Request, res: Response) {
        try {
            const {
                browserHeadless,
                browserTimeout,
                maxConcurrency,
                // Camoufox settings
                profileRotationInterval,
                // Camoufox settings
                camoufoxGeoip,
                camoufoxBlockWebrtc,
                camoufoxBlockImages,
                camoufoxEnableCache,
                camoufoxHumanize
            } = req.body;

            // Use upsert to create if not exists
            const updated = await prisma.systemSettings.upsert({
                where: { id: 1 },
                update: {
                    browser_headless: browserHeadless,
                    browser_timeout: browserTimeout,
                    max_concurrency: maxConcurrency,
                    profile_rotation_interval: profileRotationInterval,
                    // Camoufox settings
                    camoufox_geoip: camoufoxGeoip,
                    camoufox_block_webrtc: camoufoxBlockWebrtc,
                    camoufox_block_images: camoufoxBlockImages,
                    camoufox_enable_cache: camoufoxEnableCache,
                    camoufox_humanize: camoufoxHumanize
                },
                create: {
                    id: 1,
                    browser_headless: browserHeadless ?? true,
                    browser_timeout: browserTimeout ?? 60000,
                    max_concurrency: maxConcurrency ?? 5,
                    proxy_enabled: false,
                    proxy_url: '',
                    proxy_protocol: 'http',
                    profile_rotation: false,
                    profile_rotation_interval: profileRotationInterval ?? 3600000,
                    // Camoufox settings
                    camoufox_geoip: camoufoxGeoip ?? true,
                    camoufox_block_webrtc: camoufoxBlockWebrtc ?? true,
                    camoufox_block_images: camoufoxBlockImages ?? false,
                    camoufox_enable_cache: camoufoxEnableCache ?? true,
                    camoufox_humanize: camoufoxHumanize ?? 2.5
                }
            });

            // Force refresh cache
            configService.invalidateCache();

            // Restart browser if headless setting changed
            await browserService.restartBrowser();

            res.json({ success: true, config: updated });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }
}
