import { Router } from 'express';
import { YoutubeController } from '../../controllers/media/YoutubeController';
import { ApiKeyGuard } from '../../middleware/ApiKeyGuard';
import { RequestLogger } from '../../middleware/RequestLogger';

const router = Router();

router.use(RequestLogger);
router.use(ApiKeyGuard);

router.post('/info/stream', YoutubeController.streamInfo);
router.post('/info', YoutubeController.info);
router.post('/formats', YoutubeController.formats);
router.post('/subtitles', YoutubeController.subtitles);
router.post('/save/stream', YoutubeController.streamSave);
router.post('/save', YoutubeController.save);
router.get('/download/:jobId', YoutubeController.download);
router.delete('/download/:jobId', YoutubeController.deleteDownload);
router.get('/status', YoutubeController.getStatus);

export default router;
