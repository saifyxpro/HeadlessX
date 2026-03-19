import { Router } from 'express';
import { OperatorsController } from '../../controllers/playground/OperatorsController';
import { ApiKeyGuard } from '../../middleware/ApiKeyGuard';
import { RequestLogger } from '../../middleware/RequestLogger';

const router = Router();

router.use(RequestLogger);
router.use(ApiKeyGuard);

router.get('/operators', OperatorsController.list);

export default router;
