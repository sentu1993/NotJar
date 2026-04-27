import { Request, Response } from 'express';
import { prisma } from '../index';
import { fallbackStore, shouldUseFallbackStore } from '../store';

const workspaceUser = {
  email: 'workspace@notjar.local',
  password: 'open-source-workspace',
  name: 'Open Workspace'
};

const getWorkspaceUser = async () => prisma.user.upsert({
  where: { email: workspaceUser.email },
  update: {},
  create: workspaceUser
});

export const getProjects = async (_req: Request, res: Response) => {
  try {
    if (shouldUseFallbackStore()) {
      return res.json(fallbackStore.listProjects());
    }

    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { sessions: true }
        }
      }
    });
    res.json(projects);
  } catch (err) {
    console.warn('Prisma unavailable, using fallback project store:', err);
    res.json(fallbackStore.listProjects());
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, domain } = req.body;
    if (!name || !domain) {
      return res.status(400).json({ error: 'Project name and domain are required' });
    }

    const cleanName = name.trim();
    const cleanDomain = domain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');

    if (shouldUseFallbackStore()) {
      return res.status(201).json(fallbackStore.createProject(cleanName, cleanDomain));
    }

    const owner = await getWorkspaceUser();
    const project = await prisma.project.create({
      data: {
        name: cleanName,
        domain: cleanDomain,
        ownerId: owner.id
      }
    });
    res.status(201).json(project);
  } catch (err) {
    console.warn('Prisma unavailable, creating project in fallback store:', err);
    const { name, domain } = req.body;
    res.status(201).json(fallbackStore.createProject(
      name.trim(),
      domain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
    ));
  }
};

export const getProjectStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (shouldUseFallbackStore()) {
      const stats = fallbackStore.getProjectStats(id as string);
      if (!stats) {
        return res.status(404).json({ error: 'Project not found' });
      }
      return res.json(stats);
    }

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
      orderBy: { startTime: 'desc' },
      include: {
        _count: {
          select: { events: true }
        }
      }
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
    console.warn('Prisma unavailable, reading stats from fallback store:', err);
    const stats = fallbackStore.getProjectStats(req.params.id as string);
    if (!stats) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(stats);
  }
};
