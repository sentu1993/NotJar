import { Router } from 'express';
import { getProjects, createProject, getProjectStats } from '../controllers/projects';

const router = Router();

router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id/stats', getProjectStats);

export default router;
