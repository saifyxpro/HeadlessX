import { Router } from 'express';
import { ProfileController } from '../controllers/ProfileController';

const router = Router();

// Profile statistics & recommendations
router.get('/stats', ProfileController.stats);
router.get('/recommendations', ProfileController.recommendations);

// CRUD operations
router.get('/', ProfileController.list);
router.get('/:id', ProfileController.get);
router.post('/', ProfileController.create);
router.patch('/:id', ProfileController.update);
router.delete('/:id', ProfileController.delete);

// Browser control
router.post('/:id/launch', ProfileController.launch);
router.post('/:id/stop', ProfileController.stop);
router.post('/:id/clear', ProfileController.clear);

export default router;
