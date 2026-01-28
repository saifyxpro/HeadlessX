import { Request, Response } from 'express';
import { proxyService } from '../services/ProxyService';

/**
 * List all proxies
 */
export const list = async (req: Request, res: Response) => {
    try {
        const proxies = await proxyService.getAll();
        res.json({ proxies });
    } catch (error: any) {
        console.error('❌ Proxy list error:', error);
        res.status(500).json({ error: 'Failed to fetch proxies' });
    }
};

/**
 * Get active proxies only (for dropdowns)
 */
export const listActive = async (req: Request, res: Response) => {
    try {
        const proxies = await proxyService.getActive();
        res.json({ proxies });
    } catch (error: any) {
        console.error('❌ Active proxy list error:', error);
        res.status(500).json({ error: 'Failed to fetch active proxies' });
    }
};

/**
 * Get a single proxy by ID
 */
export const get = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const proxy = await proxyService.getById(id);

        if (!proxy) {
            return res.status(404).json({ error: 'Proxy not found' });
        }

        res.json({ proxy });
    } catch (error: any) {
        console.error('❌ Proxy get error:', error);
        res.status(500).json({ error: 'Failed to fetch proxy' });
    }
};

/**
 * Create a new proxy
 */
export const create = async (req: Request, res: Response) => {
    try {
        const { name, protocol, host, port, username, password, country, is_rotating } = req.body;

        if (!name || !host || !port) {
            return res.status(400).json({ error: 'Name, host, and port are required' });
        }

        const proxy = await proxyService.create({
            name,
            protocol: protocol || 'http',
            host,
            port: parseInt(port, 10),
            username,
            password,
            country,
            is_rotating: is_rotating || false,
        });

        res.status(201).json({ proxy });
    } catch (error: any) {
        console.error('❌ Proxy create error:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'A proxy with this name already exists' });
        }
        res.status(500).json({ error: 'Failed to create proxy' });
    }
};

/**
 * Update a proxy
 */
export const update = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const data = req.body;

        if (data.port) {
            data.port = parseInt(data.port, 10);
        }

        const proxy = await proxyService.update(id, data);
        res.json({ proxy });
    } catch (error: any) {
        console.error('❌ Proxy update error:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Proxy not found' });
        }
        res.status(500).json({ error: 'Failed to update proxy' });
    }
};

/**
 * Delete a proxy
 */
export const remove = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        await proxyService.delete(id);
        res.json({ success: true });
    } catch (error: any) {
        console.error('❌ Proxy delete error:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Proxy not found' });
        }
        res.status(500).json({ error: 'Failed to delete proxy' });
    }
};

/**
 * Toggle proxy active status
 */
export const toggleActive = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const proxy = await proxyService.toggleActive(id);
        res.json({ proxy });
    } catch (error: any) {
        console.error('❌ Proxy toggle error:', error);
        res.status(500).json({ error: 'Failed to toggle proxy status' });
    }
};

/**
 * Test proxy connection
 */
export const testConnection = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const result = await proxyService.testConnection(id);
        res.json(result);
    } catch (error: any) {
        console.error('❌ Proxy test error:', error);
        res.status(500).json({ error: 'Failed to test proxy' });
    }
};
