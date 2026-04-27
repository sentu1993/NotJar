import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface StoredProject {
  id: string;
  name: string;
  domain: string;
  trackingId: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredSession {
  id: string;
  projectId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  visitorId: string;
  ip?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  device?: string;
  screenRes?: string;
  createdAt: string;
}

export interface StoredEvent {
  id: string;
  sessionId: string;
  type: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface StoredHeatmapPoint {
  id: string;
  projectId: string;
  pageUrl: string;
  type: string;
  x?: number | null;
  y?: number | null;
  value?: number | null;
  timestamp: string;
}

interface StoreShape {
  projects: StoredProject[];
  sessions: StoredSession[];
  events: StoredEvent[];
  heatmapData: StoredHeatmapPoint[];
}

const dataDir = path.resolve(process.cwd(), 'data');
const dataFile = path.join(dataDir, 'notjar-store.json');

const emptyStore = (): StoreShape => ({
  projects: [],
  sessions: [],
  events: [],
  heatmapData: []
});

const readStore = (): StoreShape => {
  try {
    if (!fs.existsSync(dataFile)) return emptyStore();
    return JSON.parse(fs.readFileSync(dataFile, 'utf8')) as StoreShape;
  } catch {
    return emptyStore();
  }
};

const writeStore = (store: StoreShape) => {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dataFile, JSON.stringify(store, null, 2));
};

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();

export const fallbackStore = {
  listProjects() {
    const store = readStore();
    return store.projects
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((project) => ({
        ...project,
        _count: {
          sessions: store.sessions.filter((session) => session.projectId === project.id).length
        }
      }));
  },

  createProject(name: string, domain: string) {
    const store = readStore();
    const timestamp = now();
    const project: StoredProject = {
      id: id(),
      name,
      domain,
      trackingId: id(),
      ownerId: 'open-workspace',
      createdAt: timestamp,
      updatedAt: timestamp
    };
    store.projects.push(project);
    writeStore(store);
    return project;
  },

  getProjectStats(projectId: string) {
    const store = readStore();
    const project = store.projects.find((item) => item.id === projectId);
    if (!project) return null;

    const sessions = store.sessions.filter((session) => session.projectId === projectId);
    const sessionIds = new Set(sessions.map((session) => session.id));
    const events = store.events.filter((event) => sessionIds.has(event.sessionId));

    return {
      project,
      stats: {
        sessionsCount: sessions.length,
        eventsCount: events.length
      },
      recentSessions: sessions
        .slice()
        .sort((a, b) => b.startTime.localeCompare(a.startTime))
        .slice(0, 10)
        .map((session) => ({
          ...session,
          _count: {
            events: store.events.filter((event) => event.sessionId === session.id).length
          }
        }))
    };
  },

  findProjectByTrackingId(trackingId: string) {
    return readStore().projects.find((project) => project.trackingId === trackingId) || null;
  },

  startSession(input: Omit<StoredSession, 'id' | 'createdAt' | 'startTime'>) {
    const store = readStore();
    const timestamp = now();
    const session: StoredSession = {
      id: id(),
      startTime: timestamp,
      createdAt: timestamp,
      ...input
    };
    store.sessions.push(session);
    writeStore(store);
    return session;
  },

  addEvents(sessionId: string, events: Array<{ type: string; timestamp: number | string; data: Record<string, unknown>; url?: string }>) {
    const store = readStore();
    const session = store.sessions.find((item) => item.id === sessionId);
    if (!session) return null;

    const storedEvents: StoredEvent[] = events.map((event) => ({
      id: id(),
      sessionId,
      type: event.type,
      timestamp: new Date(event.timestamp).toISOString(),
      data: event.data || {}
    }));

    store.events.push(...storedEvents);

    const heatmapPoints: StoredHeatmapPoint[] = events
      .filter((event) => ['click', 'scroll', 'mousemove'].includes(event.type))
      .map((event) => {
        const eventData = event.data || {};
        return {
          id: id(),
          projectId: session.projectId,
          pageUrl: event.url || '',
          type: event.type === 'mousemove' ? 'move' : event.type,
          x: typeof eventData.x === 'number' ? eventData.x : null,
          y: typeof eventData.y === 'number' ? eventData.y : null,
          value: typeof eventData.percentage === 'number' ? eventData.percentage : null,
          timestamp: now()
        };
      });

    store.heatmapData.push(...heatmapPoints);

    const latest = storedEvents.reduce((max, event) => Math.max(max, new Date(event.timestamp).getTime()), new Date(session.startTime).getTime());
    session.endTime = new Date(latest).toISOString();
    session.duration = Math.max(0, Math.round((latest - new Date(session.startTime).getTime()) / 1000));

    writeStore(store);
    return { events: storedEvents, heatmapPoints };
  },

  getSessionEvents(sessionId: string) {
    return readStore().events
      .filter((event) => event.sessionId === sessionId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  },

  getHeatmapData(projectId: string, type?: string, pageUrl?: string) {
    return readStore().heatmapData.filter((point) => (
      point.projectId === projectId &&
      (!type || point.type === type) &&
      (!pageUrl || point.pageUrl === pageUrl)
    ));
  }
};

export const shouldUseFallbackStore = () => !process.env.DATABASE_URL;
