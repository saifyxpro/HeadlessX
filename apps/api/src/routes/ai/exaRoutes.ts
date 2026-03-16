import { Router } from 'express';
import { ExaController } from '../../controllers/ai/ExaController';
import { ApiKeyGuard } from '../../middleware/ApiKeyGuard';
import { RequestLogger } from '../../middleware/RequestLogger';

const router = Router();

router.use(RequestLogger);
router.use(ApiKeyGuard);

router.post('/search/stream', ExaController.streamSearch);
router.post('/search', ExaController.search);
router.get('/status', ExaController.getStatus);

export default router;
