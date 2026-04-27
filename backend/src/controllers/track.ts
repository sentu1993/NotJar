import { Request, Response } from 'express';
import { prisma } from '../index';
import { fallbackStore, shouldUseFallbackStore } from '../store';

const parseUserAgent = (userAgent = '') => {
  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /Chrome\//.test(userAgent)
      ? 'Chrome'
      : /Firefox\//.test(userAgent)
        ? 'Firefox'
        : /Safari\//.test(userAgent)
          ? 'Safari'
          : 'Unknown';

  const os = /Windows/.test(userAgent)
    ? 'Windows'
    : /Mac OS X/.test(userAgent)
      ? 'macOS'
      : /Android/.test(userAgent)
        ? 'Android'
        : /iPhone|iPad/.test(userAgent)
          ? 'iOS'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : 'Unknown';

  const device = /Mobi|Android|iPhone/.test(userAgent)
    ? 'mobile'
    : /iPad|Tablet/.test(userAgent)
      ? 'tablet'
      : 'desktop';

  return { browser, os, device };
};

export const startSession = async (req: Request, res: Response) => {
  try {
    const { projectId, visitorId, userAgent, screenRes, url, referrer } = req.body;
    if (!projectId || !visitorId) {
      return res.status(400).json({ error: 'Project ID and visitor ID are required' });
    }

    if (shouldUseFallbackStore()) {
      const project = fallbackStore.findProjectByTrackingId(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      const parsedAgent = parseUserAgent(userAgent);
      const session = fallbackStore.startSession({
        projectId: project.id,
        visitorId,
        userAgent,
        browser: parsedAgent.browser,
        os: parsedAgent.os,
        device: parsedAgent.device,
        screenRes,
        ip: req.ip
      });
      return res.json({ sessionId: session.id });
    }

    const project = await prisma.project.findUnique({
      where: { trackingId: projectId }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const parsedAgent = parseUserAgent(userAgent);
    const session = await prisma.session.create({
      data: {
        projectId: project.id,
        visitorId,
        userAgent,
        browser: parsedAgent.browser,
        os: parsedAgent.os,
        device: parsedAgent.device,
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

    if (!sessionId || !events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'Invalid events data' });
    }

    if (shouldUseFallbackStore()) {
      const stored = fallbackStore.addEvents(sessionId, events);
      if (!stored) {
        return res.status(404).json({ error: 'Session not found' });
      }
      return res.json({ success: true });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { projectId: true, startTime: true }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
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
      const heatmapData = heatmapEvents.map(e => ({
        projectId: session.projectId,
        pageUrl: e.url || '',
        type: e.type === 'mousemove' ? 'move' : e.type,
        x: typeof e.data?.x === 'number' ? e.data.x : null,
        y: typeof e.data?.y === 'number' ? e.data.y : null,
        value: typeof e.data?.percentage === 'number' ? e.data.percentage : null
      }));

      await prisma.heatmapData.createMany({
        data: heatmapData
      });
    }

    const lastTimestamp = events.reduce((latest: number, event: any) => {
      const timestamp = new Date(event.timestamp).getTime();
      return Number.isNaN(timestamp) ? latest : Math.max(latest, timestamp);
    }, session.startTime.getTime());

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        endTime: new Date(lastTimestamp),
        duration: Math.max(0, Math.round((lastTimestamp - session.startTime.getTime()) / 1000))
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Track events error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSessionEvents = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (shouldUseFallbackStore()) {
      return res.json(fallbackStore.getSessionEvents(id as string));
    }

    const events = await prisma.event.findMany({
      where: { sessionId: id as string },
      orderBy: { timestamp: 'asc' }
    });
    res.json(events);
  } catch (err) {
    console.warn('Prisma unavailable, reading events from fallback store:', err);
    res.json(fallbackStore.getSessionEvents(req.params.id as string));
  }
};

export const getHeatmapData = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { type, pageUrl } = req.query;
    if (shouldUseFallbackStore()) {
      return res.json(fallbackStore.getHeatmapData(
        projectId as string,
        typeof type === 'string' ? type : undefined,
        typeof pageUrl === 'string' ? pageUrl : undefined
      ));
    }

    const data = await prisma.heatmapData.findMany({
      where: {
        projectId: projectId as string,
        type: typeof type === 'string' ? type : undefined,
        pageUrl: typeof pageUrl === 'string' ? pageUrl : undefined
      }
    });
    res.json(data);
  } catch (err) {
    console.warn('Prisma unavailable, reading heatmap from fallback store:', err);
    const { projectId } = req.params;
    const { type, pageUrl } = req.query;
    res.json(fallbackStore.getHeatmapData(
      projectId as string,
      typeof type === 'string' ? type : undefined,
      typeof pageUrl === 'string' ? pageUrl : undefined
    ));
  }
};
