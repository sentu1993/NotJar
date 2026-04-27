'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';
import Link from 'next/link';
import { Plus, Globe, BarChart2, Settings } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  domain: string;
  trackingId: string;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', domain: '' });

  const fetchProjects = useCallback(async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user, fetchProjects]);

  const [isCreating, setIsCreating] = useState(false);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await api.post('/projects', newProject);
      setIsModalOpen(false);
      setNewProject({ name: '', domain: '' });
      await fetchProjects();
    } catch (err: any) {
      console.error('Failed to create project', err);
      alert('Failed to create project: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsCreating(false);
    }
  };


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white text-black min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-black">Projects</h1>
          <p className="text-gray-600">Manage your websites and tracking</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed">
            <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No projects yet</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first project</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </button>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  <Globe className="w-6 h-6" />
                </div>
                <div className="flex space-x-2">
                  <Link href={`/projects/${project.id}`} title="Analytics">
                    <BarChart2 className="w-5 h-5 text-gray-400 hover:text-indigo-600 cursor-pointer" />
                  </Link>
                  <Link href={`/projects/${project.id}/settings`} title="Settings">
                    <Settings className="w-5 h-5 text-gray-400 hover:text-indigo-600 cursor-pointer" />
                  </Link>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-black mb-1">{project.name}</h3>
              <p className="text-gray-700 text-sm mb-4">{project.domain}</p>
              <div className="pt-4 border-t">
                <Link
                  href={`/projects/${project.id}`}
                  className="text-indigo-600 text-sm font-medium hover:text-indigo-500"
                >
                  View Dashboard &rarr;
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add New Project</h2>
            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="My Website"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="example.com"
                  value={newProject.domain}
                  onChange={(e) => setNewProject({ ...newProject, domain: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
