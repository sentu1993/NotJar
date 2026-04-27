import { Request, Response } from 'express';
import { prisma } from '../index';

export const startSession = async (req: Request, res: Response) => {
  try {
    const { projectId, visitorId, userAgent, screenRes, url, referrer } = req.body;

    const project = await prisma.project.findUnique({
      where: { trackingId: projectId }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const session = await prisma.session.create({
      data: {
        projectId: project.id,
        visitorId,
        userAgent,
        screenRes,
        ip: req.ip,
        // In a real app, use a geo-ip library here
        startTime: new Date()
      }
    });

    res.json({ sessionId: session.id });
  } catch (err) {
    console.error('Start session error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const trackEvents = async (req: Request, res: Response) => {
  try {
    const { sessionId, events } = req.body;

    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'Invalid events data' });
    }

    // Bulk create events
    const eventData = events.map((event: any) => ({
      sessionId,
      type: event.type,
      timestamp: new Date(event.timestamp),
      data: event.data
    }));

    await prisma.event.createMany({
      data: eventData
    });

    // Handle heatmap data aggregation (optional: could be a background job)
    const heatmapEvents = events.filter(e => ['click', 'scroll', 'mousemove'].includes(e.type));
    if (heatmapEvents.length > 0) {
      const project = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { projectId: true }
      });

      if (project) {
        const heatmapData = heatmapEvents.map(e => ({
          projectId: project.projectId,
          pageUrl: e.url || '',
          type: e.type,
          x: e.data.x || null,
          y: e.data.y || null,
          value: e.data.percentage || null
        }));

        await prisma.heatmapData.createMany({
          data: heatmapData
        });
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Track events error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSessionEvents = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const events = await prisma.event.findMany({
      where: { sessionId: id as string },
      orderBy: { timestamp: 'asc' }
    });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

export const getHeatmapData = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { type, pageUrl } = req.query;

    const data = await prisma.heatmapData.findMany({
      where: {
        projectId: projectId as string,
        type: typeof type === 'string' ? type : undefined,
        pageUrl: typeof pageUrl === 'string' ? pageUrl : undefined
      }
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch heatmap data' });
  }
};
