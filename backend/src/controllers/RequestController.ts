import { Request, Response } from 'express';
import { prisma } from '../database/client';
import crypto from 'crypto';

export class RequestController {

    static async getLogs(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const skip = (page - 1) * limit;

            const [total, logs] = await prisma.$transaction([
                prisma.requestLog.count(),
                prisma.requestLog.findMany({
                    orderBy: { created_at: 'desc' },
                    take: limit,
                    skip: skip,
                    include: {
                        api_key: {
                            select: { name: true }
                        }
                    }
                })
            ]);

            res.json({ success: true, pagination: { page, limit, total }, logs });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    static async getStats(req: Request, res: Response) {
        try {
            const [total, successCount, avgDurationAgg] = await prisma.$transaction([
                prisma.requestLog.count(),
                prisma.requestLog.count({
                    where: {
                        status_code: {
                            lt: 400
                        }
                    }
                }),
                prisma.requestLog.aggregate({
                    _avg: {
                        duration_ms: true
                    }
                })
            ]);

            const failed = total - successCount;
            const successRate = total > 0 ? (successCount / total) * 100 : 100;
            const avgLatency = (avgDurationAgg._avg.duration_ms || 0) / 1000;

            res.json({
                success: true,
                stats: {
                    totalRequests: total,
                    successfulRequests: successCount,
                    failedRequests: failed,
                    successRate: successRate.toFixed(1),
                    avgLatency: avgLatency.toFixed(2)
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    static async getApiKeys(req: Request, res: Response) {
        try {
            const keys = await prisma.apiKey.findMany({
                orderBy: { created_at: 'desc' },
                select: {
                    id: true,
                    name: true,
                    prefix: true,
                    last_used_at: true,
                    is_active: true,
                    created_at: true
                }
            });
            res.json({ success: true, keys });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    static async createApiKey(req: Request, res: Response) {
        try {
            const { name } = req.body;
            // Generate key: hx_randomHex
            const randomBytes = crypto.randomBytes(24).toString('hex');
            const key = `hx_${randomBytes}`; // Full key to show ONCE

            await prisma.apiKey.create({
                data: {
                    name: name || 'Unnamed Key',
                    key_hash: key, // Storing plain for MVP as requested, usually hash this!
                    prefix: key.substring(0, 7)
                }
            });

            res.json({ success: true, key });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    static async revokeApiKey(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await prisma.apiKey.update({
                where: { id: id as string },
                data: { is_active: false }
            });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    static async deleteApiKey(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await prisma.apiKey.delete({
                where: { id: id as string }
            });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }
}
