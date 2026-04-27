'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Loader2, Monitor, MousePointer, Pause, Play, RotateCcw } from 'lucide-react';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

interface EventData {
  x?: number;
  y?: number;
  percentage?: number;
  tagName?: string;
  text?: string;
  url?: string;
  viewport?: {
    width?: number;
    height?: number;
  };
  [key: string]: unknown;
}

interface ReplayEvent {
  id: string;
  timestamp: string;
  type: string;
  data: EventData;
}

const getErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === 'object' && err && 'response' in err) {
    return (err as { response?: { data?: { error?: string } } }).response?.data?.error || fallback;
  }
  return fallback;
};

const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function SessionReplayPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const { user, loading } = useAuth();
  const [events, setEvents] = useState<ReplayEvent[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');
  const [stageSize, setStageSize] = useState({ width: 960, height: 540 });
  const playbackRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const fetchEvents = useCallback(async () => {
    setIsFetching(true);
    setError('');
    try {
      const res = await api.get<ReplayEvent[]>(`/track/sessions/${id}/events`);
      setEvents(res.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to fetch session events'));
    } finally {
      setIsFetching(false);
    }
  }, [id]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (user && id) {
      fetchEvents();
    }
  }, [id, user, fetchEvents]);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      if (entry) {
        setStageSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, []);

  const timeline = useMemo(() => {
    if (events.length === 0) {
      return { start: 0, duration: 0 };
    }
    const start = new Date(events[0].timestamp).getTime();
    const end = new Date(events[events.length - 1].timestamp).getTime();
    return { start, duration: Math.max(0, end - start) };
  }, [events]);

  useEffect(() => {
    if (!isPlaying || events.length === 0) {
      if (playbackRef.current) clearInterval(playbackRef.current);
      return;
    }

    playbackRef.current = setInterval(() => {
      setCurrentTime((previous) => {
        const next = previous + 100;
        if (next >= timeline.duration) {
          setIsPlaying(false);
          return timeline.duration;
        }
        return next;
      });
    }, 100);

    return () => {
      if (playbackRef.current) clearInterval(playbackRef.current);
    };
  }, [events.length, isPlaying, timeline.duration]);

  const visibleEvents = useMemo(() => {
    if (events.length === 0) return [];
    const currentTimestamp = timeline.start + currentTime;
    return events.filter((event) => new Date(event.timestamp).getTime() <= currentTimestamp);
  }, [currentTime, events, timeline.start]);

  const viewport = useMemo(() => {
    const eventWithViewport = events.find((event) => event.data.viewport?.width && event.data.viewport?.height);
    if (eventWithViewport?.data.viewport?.width && eventWithViewport.data.viewport.height) {
      return {
        width: eventWithViewport.data.viewport.width,
        height: eventWithViewport.data.viewport.height
      };
    }

    const maxX = Math.max(960, ...events.map((event) => event.data.x || 0));
    const maxY = Math.max(540, ...events.map((event) => event.data.y || 0));
    return { width: maxX, height: maxY };
  }, [events]);

  const scale = Math.min(stageSize.width / viewport.width, stageSize.height / viewport.height);
  const replayWidth = viewport.width * scale;
  const replayHeight = viewport.height * scale;
  const replayLeft = (stageSize.width - replayWidth) / 2;
  const replayTop = (stageSize.height - replayHeight) / 2;

  const pointerEvent = [...visibleEvents].reverse().find((event) => (
    (event.type === 'mousemove' || event.type === 'click') &&
    typeof event.data.x === 'number' &&
    typeof event.data.y === 'number'
  ));

  const activeClicks = visibleEvents.filter((event) => {
    if (event.type !== 'click') return false;
    const age = timeline.start + currentTime - new Date(event.timestamp).getTime();
    return age >= 0 && age <= 600;
  });

  const reset = () => {
    setCurrentTime(0);
    setIsPlaying(false);
  };

  if (loading || (!user && !loading) || isFetching) {
    return (
      <div className="grid min-h-[calc(100vh-4rem)] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white">
                <Monitor className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Session Replay</p>
                <h1 className="text-xl font-semibold text-slate-950">{id.slice(0, 12)}</h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-sm text-slate-600">
                {formatTime(currentTime)} / {formatTime(timeline.duration)}
              </span>
              <button
                type="button"
                onClick={reset}
                className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                aria-label="Reset replay"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsPlaying((playing) => !playing)}
                disabled={events.length === 0}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>
            </div>
          </div>

          {error ? (
            <div className="m-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
              <span>{error}</span>
            </div>
          ) : events.length === 0 ? (
            <div className="grid min-h-96 place-items-center p-8 text-center">
              <div>
                <MousePointer className="mx-auto h-10 w-10 text-slate-300" />
                <h2 className="mt-3 text-base font-semibold text-slate-950">No events recorded</h2>
                <p className="mt-2 max-w-md text-sm text-slate-600">
                  This session exists, but no interaction events have reached NotJar yet.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-200 p-5">
                <input
                  aria-label="Replay progress"
                  type="range"
                  min={0}
                  max={timeline.duration}
                  step={100}
                  value={currentTime}
                  onChange={(e) => {
                    setIsPlaying(false);
                    setCurrentTime(Number(e.target.value));
                  }}
                  className="w-full accent-slate-950"
                />
              </div>

              <div ref={stageRef} className="relative h-[62vh] min-h-[420px] overflow-hidden bg-slate-100">
                <div
                  className="absolute overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm"
                  style={{ left: replayLeft, top: replayTop, width: replayWidth, height: replayHeight }}
                >
                  <div className="absolute inset-x-0 top-0 h-10 border-b border-slate-200 bg-slate-50" />
                  <div className="absolute left-6 top-16 h-8 w-48 rounded bg-slate-200" />
                  <div className="absolute left-6 top-32 right-6 grid grid-cols-3 gap-4">
                    <div className="h-28 rounded bg-slate-100" />
                    <div className="h-28 rounded bg-slate-100" />
                    <div className="h-28 rounded bg-slate-100" />
                  </div>
                  <div className="absolute left-6 right-6 top-80 space-y-3">
                    <div className="h-4 rounded bg-slate-100" />
                    <div className="h-4 w-5/6 rounded bg-slate-100" />
                    <div className="h-4 w-2/3 rounded bg-slate-100" />
                  </div>
                </div>

                {pointerEvent && typeof pointerEvent.data.x === 'number' && typeof pointerEvent.data.y === 'number' && (
                  <div
                    className="absolute z-10 pointer-events-none transition-all duration-100 ease-linear"
                    style={{
                      left: replayLeft + pointerEvent.data.x * scale,
                      top: replayTop + pointerEvent.data.y * scale,
                      transform: 'translate(-2px, -2px)'
                    }}
                  >
                    <MousePointer className="h-6 w-6 fill-red-500 text-red-700 drop-shadow" />
                  </div>
                )}

                {activeClicks.map((click) => (
                  typeof click.data.x === 'number' && typeof click.data.y === 'number' ? (
                    <div
                      key={click.id}
                      className="absolute z-10 pointer-events-none"
                      style={{
                        left: replayLeft + click.data.x * scale,
                        top: replayTop + click.data.y * scale,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      <div className="h-12 w-12 animate-ping rounded-full border-2 border-red-500" />
                    </div>
                  ) : null
                ))}
              </div>

              <div className="grid gap-0 border-t border-slate-200 lg:grid-cols-[280px_1fr]">
                <div className="border-b border-slate-200 p-5 lg:border-b-0 lg:border-r">
                  <p className="text-sm font-semibold text-slate-950">Event Summary</p>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Total events</dt>
                      <dd className="font-medium text-slate-950">{events.length}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Clicks</dt>
                      <dd className="font-medium text-slate-950">{events.filter((event) => event.type === 'click').length}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Viewport</dt>
                      <dd className="font-medium text-slate-950">{viewport.width}x{viewport.height}</dd>
                    </div>
                  </dl>
                </div>
                <div className="max-h-72 overflow-y-auto p-5">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Event Log</h2>
                  <div className="mt-4 space-y-2 font-mono text-xs">
                    {visibleEvents.slice(-50).map((event) => (
                      <div key={event.id} className="grid gap-2 rounded-md border border-slate-100 bg-slate-50 p-3 md:grid-cols-[96px_120px_1fr]">
                        <span className="text-slate-400">{new Date(event.timestamp).toLocaleTimeString()}</span>
                        <span className="font-semibold uppercase text-slate-950">{event.type}</span>
                        <span className="truncate text-slate-600">{JSON.stringify(event.data)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
