import { Router } from 'express';
import { startSession, trackEvents, getSessionEvents, getHeatmapData } from '../controllers/track';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/session', startSession);
router.post('/events', trackEvents);
router.get('/sessions/:id/events', authenticate, getSessionEvents);
router.get('/projects/:projectId/heatmap', authenticate, getHeatmapData);

export default router;
