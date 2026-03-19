import { Request, Response } from 'express';
import { configService } from '../../services/config/ConfigService';
import { browserService } from '../../services/scrape/BrowserService';
import { proxyService } from '../../services/proxy/ProxyService';

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
            const currentConfig = await configService.getConfig();
            const {
                browserHeadless,
                browserTimeout,
                maxConcurrency,
                proxyEnabled,
                proxyUrl,
                proxyProtocol,
                profileRotationInterval,
                camoufoxGeoip,
                camoufoxBlockWebrtc,
                camoufoxBlockImages,
                camoufoxEnableCache,
                camoufoxHumanize
            } = req.body;

            const normalizedProxyUrl = typeof proxyUrl === 'string' ? proxyUrl.trim() : '';
            const normalizedProxyProtocol = typeof proxyProtocol === 'string' && proxyProtocol.trim()
                ? proxyProtocol.trim()
                : 'http';
            const shouldEnableProxy = Boolean(proxyEnabled && normalizedProxyUrl);

            const { config: updated } = await configService.saveConfig({
                ...currentConfig,
                browserHeadless: browserHeadless ?? currentConfig.browserHeadless,
                browserTimeout: browserTimeout ?? currentConfig.browserTimeout,
                maxConcurrency: maxConcurrency ?? currentConfig.maxConcurrency,
                proxyEnabled: shouldEnableProxy,
                proxyUrl: normalizedProxyUrl || undefined,
                proxyProtocol: normalizedProxyProtocol,
                profileRotationInterval: profileRotationInterval ?? currentConfig.profileRotationInterval,
                camoufoxGeoip: camoufoxGeoip ?? currentConfig.camoufoxGeoip,
                camoufoxBlockWebrtc: camoufoxBlockWebrtc ?? currentConfig.camoufoxBlockWebrtc,
                camoufoxBlockImages: camoufoxBlockImages ?? currentConfig.camoufoxBlockImages,
                camoufoxEnableCache: camoufoxEnableCache ?? currentConfig.camoufoxEnableCache,
                camoufoxHumanize: camoufoxHumanize ?? currentConfig.camoufoxHumanize,
            });

            await browserService.restartBrowser();

            res.json({ success: true, config: updated });
        } catch (error) {
            console.error(error);
            const message = (error as Error).message;
            const status = message.includes('EAI_AGAIN') || message.includes('P1001') ? 503 : 500;
            res.status(status).json({ success: false, error: message });
        }
    }

    static async testProxy(req: Request, res: Response) {
        try {
            const { proxyUrl, proxyProtocol } = req.body;

            const normalizedProxyUrl = typeof proxyUrl === 'string' ? proxyUrl.trim() : '';
            const normalizedProxyProtocol = typeof proxyProtocol === 'string' && proxyProtocol.trim()
                ? proxyProtocol.trim()
                : 'http';

            if (!normalizedProxyUrl) {
                return res.status(400).json({
                    success: false,
                    error: 'Enter a proxy URL before running a test.'
                });
            }

            const result = await proxyService.testConfiguredConnection(
                normalizedProxyUrl,
                normalizedProxyProtocol
            );

            res.status(result.success ? 200 : 422).json({
                success: result.success,
                result,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }
}
