import { Router } from 'express';
import { getProjects, createProject, getProjectStats } from '../controllers/projects';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getProjects);
router.post('/', authenticate, createProject);
router.get('/:id/stats', authenticate, getProjectStats);

export default router;
