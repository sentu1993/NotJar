'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Check, Copy, Layers, Loader2, MousePointer, Play, Users } from 'lucide-react';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

interface Session {
  id: string;
  startTime: string;
  duration?: number | null;
  visitorId: string;
  browser?: string | null;
  device?: string | null;
  screenRes?: string | null;
  _count?: {
    events: number;
  };
}

interface ProjectStats {
  project: {
    id: string;
    name: string;
    domain: string;
    trackingId: string;
  };
  stats: {
    sessionsCount: number;
    eventsCount: number;
  };
  recentSessions: Session[];
}

const getErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === 'object' && err && 'response' in err) {
    return (err as { response?: { data?: { error?: string } } }).response?.data?.error || fallback;
  }
  return fallback;
};

const formatDuration = (seconds?: number | null) => {
  if (!seconds) return '0s';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
};

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const { user, loading } = useAuth();
  const [data, setData] = useState<ProjectStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');
  const [error, setError] = useState('');

  const fetchProjectStats = useCallback(async () => {
    setError('');
    try {
      const res = await api.get<ProjectStats>(`/projects/${id}/stats`);
      setData(res.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to fetch project stats'));
    }
  }, [id]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (user && id) {
      fetchProjectStats();
    }
  }, [id, user, fetchProjectStats]);

  const trackingScript = useMemo(() => {
    if (!data) return '';
    const trackerUrl = `${origin || ''}/tracker.js?id=${data.project.trackingId}`;
    return `
<script>
  (function(n,o,t,j,a,r){
    n.NotJarId=j; a=o.getElementsByTagName('head')[0];
    r=o.createElement('script'); r.async=1;
    r.src='${trackerUrl}';
    a.appendChild(r);
  })(window,document);
</script>`.trim();
  }, [data, origin]);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(trackingScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || (!user && !loading) || (!data && !error)) {
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
          Back to projects
        </Link>

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
            <span>{error}</span>
          </div>
        )}

        {data && (
          <>
            <div className="mt-6 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-medium text-slate-500">{data.project.domain}</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{data.project.name}</h1>
              </div>
              <button
                type="button"
                onClick={copyToClipboard}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy Script'}
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <Users className="h-4 w-4" />
                  Total Sessions
                </div>
                <p className="mt-4 text-3xl font-semibold text-slate-950">{data.stats.sessionsCount}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <MousePointer className="h-4 w-4" />
                  Total Events
                </div>
                <p className="mt-4 text-3xl font-semibold text-slate-950">{data.stats.eventsCount}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <Layers className="h-4 w-4" />
                  Tracking ID
                </div>
                <p className="mt-4 break-all font-mono text-sm text-slate-950">{data.project.trackingId}</p>
              </div>
            </div>

            <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Installation Script</h2>
                  <p className="mt-1 text-sm text-slate-600">Paste this into the head of the site you want to track.</p>
                </div>
              </div>
              <div className="p-5">
                <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm leading-6 text-slate-100">
                  <code>{trackingScript}</code>
                </pre>
              </div>
            </section>

            <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <h2 className="text-lg font-semibold text-slate-950">Recent Sessions</h2>
                <p className="mt-1 text-sm text-slate-600">Newest visitor recordings for this project.</p>
              </div>

              {data.recentSessions.length === 0 ? (
                <div className="p-10 text-center">
                  <Play className="mx-auto h-8 w-8 text-slate-300" />
                  <h3 className="mt-3 text-sm font-semibold text-slate-950">No sessions yet</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                    Install the script, visit your site, then come back here to replay captured activity.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Started</th>
                        <th className="px-5 py-3">Visitor</th>
                        <th className="px-5 py-3">Device</th>
                        <th className="px-5 py-3">Events</th>
                        <th className="px-5 py-3">Duration</th>
                        <th className="px-5 py-3 text-right">Replay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {data.recentSessions.map((session) => (
                        <tr key={session.id}>
                          <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                            {new Date(session.startTime).toLocaleString()}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-slate-950">
                            {session.visitorId.slice(0, 12)}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                            {session.browser || 'Unknown'} <span className="text-slate-400">/</span> {session.device || 'desktop'}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-slate-600">{session._count?.events || 0}</td>
                          <td className="whitespace-nowrap px-5 py-4 text-slate-600">{formatDuration(session.duration)}</td>
                          <td className="whitespace-nowrap px-5 py-4 text-right">
                            <Link
                              href={`/sessions/${session.id}`}
                              className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                            >
                              <Play className="h-4 w-4" />
                              Replay
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
