import { Router } from 'express';
import { TavilyController } from '../../controllers/ai/TavilyController';
import { ApiKeyGuard } from '../../middleware/ApiKeyGuard';
import { RequestLogger } from '../../middleware/RequestLogger';

const router = Router();

router.use(RequestLogger);
router.use(ApiKeyGuard);

router.post('/search', TavilyController.search);
router.post('/research', TavilyController.research);
router.get('/research/:requestId', TavilyController.getResearch);
router.get('/status', TavilyController.getStatus);

export default router;
