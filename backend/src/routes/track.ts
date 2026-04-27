import { Router } from 'express';
import { startSession, trackEvents, getSessionEvents, getHeatmapData } from '../controllers/track';

const router = Router();

router.post('/session', startSession);
router.post('/events', trackEvents);
router.get('/sessions/:id/events', getSessionEvents);
router.get('/projects/:projectId/heatmap', getHeatmapData);

export default router;
