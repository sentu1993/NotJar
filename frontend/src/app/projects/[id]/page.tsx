'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api, { API_URL } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { Copy, Check, Users, MousePointer, Layers } from 'lucide-react';

export default function ProjectPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const fetchProjectStats = useCallback(async () => {
    try {
      const res = await api.get(`/projects/${id}/stats`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchProjectStats();
    }
  }, [id, fetchProjectStats]);

  const trackingScript = data ? `
<script>
  (function(n,o,t,j,a,r){
    n.NotJarId=j; a=o.getElementsByTagName('head')[0];
    r=o.createElement('script'); r.async=1;
    r.src='${API_URL.replace('/api', '')}/tracker.js?id='+j;
    a.appendChild(r);
  })(window,document);
</script>`.trim() : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(trackingScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!data) return <div className="p-8 text-black bg-white min-h-screen">Loading project data...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white text-black min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-black">{data.project.name}</h1>
        <p className="text-gray-700">{data.project.domain}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center text-gray-500 mb-2">
            <Users className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Total Sessions</span>
          </div>
          <div className="text-2xl font-bold">{data.stats.sessionsCount}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center text-gray-500 mb-2">
            <MousePointer className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Total Events</span>
          </div>
          <div className="text-2xl font-bold">{data.stats.eventsCount}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center text-gray-500 mb-2">
            <Layers className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Tracking ID</span>
          </div>
          <div className="text-sm font-mono break-all">{data.project.trackingId}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Installation Script</h2>
          <button
            onClick={copyToClipboard}
            className="flex items-center text-sm text-indigo-600 hover:text-indigo-500"
          >
            {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
            {copied ? 'Copied!' : 'Copy Script'}
          </button>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-gray-300 font-mono text-sm overflow-x-auto">
          <pre>{trackingScript}</pre>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Copy and paste this script into the <code>&lt;head&gt;</code> of your website.
        </p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-bold">Recent Sessions</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitor ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Browser</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.recentSessions.map((session: { id: string; startTime: string; visitorId: string; browser?: string }) => (
              <tr key={session.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(session.startTime).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-black">
                  {session.visitorId.substring(0, 8)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {session.browser || 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link href={`/sessions/${session.id}`} className="text-indigo-600 hover:text-indigo-900">
                    Replay
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
