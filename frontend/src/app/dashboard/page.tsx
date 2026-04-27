'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, AlertCircle, ArrowRight, BarChart2, Globe, Loader2, Plus, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';

interface Project {
  id: string;
  name: string;
  domain: string;
  trackingId: string;
  createdAt: string;
  _count?: {
    sessions: number;
  };
}

const getErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === 'object' && err && 'response' in err) {
    const response = (err as { response?: { data?: { error?: string } } }).response;
    return response?.data?.error || fallback;
  }
  return fallback;
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', domain: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');

  const fetchProjects = useCallback(async () => {
    setIsFetching(true);
    setError('');
    try {
      const res = await api.get<Project[]>('/projects');
      setProjects(res.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to fetch projects'));
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user, fetchProjects]);

  const totalSessions = useMemo(
    () => projects.reduce((sum, project) => sum + (project._count?.sessions || 0), 0),
    [projects]
  );

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');
    try {
      await api.post('/projects', newProject);
      setIsModalOpen(false);
      setNewProject({ name: '', domain: '' });
      await fetchProjects();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to create project'));
    } finally {
      setIsCreating(false);
    }
  };

  if (loading || (!user && !loading)) {
    return (
      <div className="grid min-h-[calc(100vh-4rem)] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-slate-500">Workspace</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Projects</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Create a tracking project, install the script, then review sessions as they arrive.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Add Project
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Globe className="h-4 w-4" />
                Projects
              </div>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{projects.length}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Users className="h-4 w-4" />
                Sessions
              </div>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{totalSessions}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Activity className="h-4 w-4" />
                Status
              </div>
              <p className="mt-3 text-sm font-semibold text-emerald-700">Ready for tracking</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
            <span>{error}</span>
          </div>
        )}

        {isFetching ? (
          <div className="grid min-h-64 place-items-center rounded-lg border border-slate-200 bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-slate-100 text-slate-600">
              <Globe className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-950">Create your first project</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              Add the site you want to track. NotJar will generate a project-specific snippet for it.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Add Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white">
                    <Globe className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-700" />
                </div>
                <h2 className="mt-5 text-lg font-semibold text-slate-950">{project.name}</h2>
                <p className="mt-1 truncate text-sm text-slate-600">{project.domain}</p>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                  <span className="inline-flex items-center gap-2 text-slate-500">
                    <BarChart2 className="h-4 w-4" />
                    {project._count?.sessions || 0} sessions
                  </span>
                  <span className="font-mono text-xs text-slate-400">{project.trackingId.slice(0, 8)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Add Project</h2>
              <p className="mt-1 text-sm text-slate-600">Use the public domain where the tracker will be installed.</p>
            </div>
            <form className="mt-6 space-y-4" onSubmit={handleCreateProject}>
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="project-name">
                  Project name
                </label>
                <input
                  id="project-name"
                  type="text"
                  required
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-950 transition focus:border-slate-950"
                  placeholder="Marketing site"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="project-domain">
                  Domain
                </label>
                <input
                  id="project-domain"
                  type="text"
                  required
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-950 transition focus:border-slate-950"
                  placeholder="example.com"
                  value={newProject.domain}
                  onChange={(e) => setNewProject({ ...newProject, domain: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 rounded-md px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
