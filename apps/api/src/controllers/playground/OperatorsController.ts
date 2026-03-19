import { Request, Response } from 'express';
import { operatorCatalogService } from '../../services/playground/OperatorCatalogService';

export class OperatorsController {
    static async list(req: Request, res: Response) {
        try {
            const operators = await operatorCatalogService.listOperators();
            res.json({
                success: true,
                data: {
                    operators,
                },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to list operators',
            });
        }
    }
}
