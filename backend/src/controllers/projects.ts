import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const projects = await prisma.project.findMany();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const { name, domain } = req.body;
    // For "no login" mode, we'll assign projects to the first user found
    const firstUser = await prisma.user.findFirst();
    const project = await prisma.project.create({
      data: {
        name,
        domain,
        ownerId: firstUser ? firstUser.id : 'default-owner'
      }
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project' });
  }
};

export const getProjectStats = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findFirst({
      where: { id: id as string }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const sessionsCount = await prisma.session.count({ where: { projectId: id as string } });
    const eventsCount = await prisma.event.count({
      where: { session: { projectId: id as string } }
    });

    const recentSessions = await prisma.session.findMany({
      where: { projectId: id as string },
      take: 10,
      orderBy: { startTime: 'desc' }
    });

    res.json({
      project,
      stats: {
        sessionsCount,
        eventsCount
      },
      recentSessions
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project stats' });
  }
};
