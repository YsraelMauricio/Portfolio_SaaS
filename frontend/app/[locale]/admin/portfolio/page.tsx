'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { fetchApiWithAuth, fetchApi } from '@/app/lib/api';
import type { PortfolioProject } from '@/app/types/content';

export default function AdminPortfolioPage() {
  const t = useTranslations('Admin');

  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'en' | 'es'>('en');

  const [formData, setFormData] = useState({
    en: { title: '', description: '', key_results: '', slug: '' },
    es: { title: '', description: '', key_results: '', slug: '' },
    technologies: '',
    live_url: '',
    source_url: '',
    sort_order: 0,
    is_this_platform: false,
    featured_image: null as File | null,
  });

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await fetchApi<PortfolioProject[]>('/portfolio');
      setProjects(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchApi<PortfolioProject[]>('/portfolio');
        if (!cancelled) setProjects(res.data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load projects');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleEdit = (project: PortfolioProject) => {
    setEditingProject(project);
    setFormData({
      en: { title: project.title, description: project.description, key_results: project.key_results, slug: project.slug },
      es: { title: '', description: '', key_results: '', slug: '' },
      technologies: (project.technologies || []).join(', '),
      live_url: project.live_url || '',
      source_url: project.source_url || '',
      sort_order: project.sort_order,
      is_this_platform: project.is_this_platform,
      featured_image: null,
    });
    setActiveTab('en');
    setShowForm(true);
  };

  const handleCreateNew = () => {
    setEditingProject(null);
    setFormData({
      en: { title: '', description: '', key_results: '', slug: '' },
      es: { title: '', description: '', key_results: '', slug: '' },
      technologies: '',
      live_url: '',
      source_url: '',
      sort_order: 0,
      is_this_platform: false,
      featured_image: null,
    });
    setActiveTab('en');
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const technologies = formData.technologies.split(',').map((t) => t.trim()).filter(Boolean);
      const payload: Record<string, unknown> = {
        translations: {
          en: formData.en,
          es: formData.es,
        },
        technologies,
        live_url: formData.live_url || null,
        source_url: formData.source_url || null,
        sort_order: formData.sort_order,
        is_this_platform: formData.is_this_platform,
        is_published: true,
      };

      if (editingProject) {
        await fetchApiWithAuth(`/admin/portfolio/${editingProject.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        const formPayload = new FormData();
        formPayload.append('translations', JSON.stringify(payload.translations));
        formPayload.append('technologies', JSON.stringify(technologies));
        formPayload.append('live_url', payload.live_url as string);
        formPayload.append('source_url', payload.source_url as string);
        formPayload.append('sort_order', String(payload.sort_order));
        formPayload.append('is_this_platform', payload.is_this_platform ? '1' : '0');
        formPayload.append('is_published', '1');
        if (formData.featured_image) {
          formPayload.append('featured_image', formData.featured_image);
        }
        await fetchApiWithAuth('/admin/portfolio', {
          method: 'POST',
          body: formPayload as unknown as BodyInit,
          headers: {} as Record<string, string>,
        } as RequestInit);
      }
      setShowForm(false);
      loadProjects();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-[#FAFAFA]">{t('portfolio')}</h1>
        <button
          type="button"
          onClick={handleCreateNew}
          className="px-4 py-2 text-sm font-medium bg-[#6D28D9] text-white rounded-lg hover:bg-[#5B21B6] transition-colors"
        >
          New Project
        </button>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-3xl w-full mt-8 p-6 border border-zinc-200 dark:border-zinc-800 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-[#FAFAFA]">
                {editingProject ? 'Edit Project' : 'Create Project'}
              </h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-zinc-400 hover:text-zinc-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Language tabs */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('en')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'en' ? 'bg-[#6D28D9] text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('es')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'es' ? 'bg-[#6D28D9] text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
              >
                Español
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Title ({activeTab === 'en' ? 'English' : 'Spanish'})
                </label>
                <input
                  type="text"
                  required
                  value={formData[activeTab].title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, [activeTab]: { ...prev[activeTab], title: e.target.value } }))}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-[#FAFAFA] focus:ring-2 focus:ring-[#6D28D9] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  required
                  value={formData.en.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, en: { ...prev.en, slug: e.target.value }, es: { ...prev.es, slug: e.target.value } }))}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-[#FAFAFA] focus:ring-2 focus:ring-[#6D28D9] focus:border-transparent font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Description ({activeTab === 'en' ? 'English' : 'Spanish'})
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData[activeTab].description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, [activeTab]: { ...prev[activeTab], description: e.target.value } }))}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-[#FAFAFA] focus:ring-2 focus:ring-[#6D28D9] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Key Results (HTML, {activeTab === 'en' ? 'English' : 'Spanish'})
                </label>
                <textarea
                  rows={6}
                  value={formData[activeTab].key_results}
                  onChange={(e) => setFormData((prev) => ({ ...prev, [activeTab]: { ...prev[activeTab], key_results: e.target.value } }))}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-[#FAFAFA] focus:ring-2 focus:ring-[#6D28D9] focus:border-transparent font-mono"
                  placeholder="Optional: HTML content describing key results"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Technologies (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.technologies}
                    onChange={(e) => setFormData((prev) => ({ ...prev, technologies: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-[#FAFAFA] focus:ring-2 focus:ring-[#6D28D9] focus:border-transparent"
                    placeholder="React, Node.js, PostgreSQL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sort_order: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-[#FAFAFA] focus:ring-2 focus:ring-[#6D28D9] focus:border-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Live Demo URL
                  </label>
                  <input
                    type="url"
                    value={formData.live_url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, live_url: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-[#FAFAFA] focus:ring-2 focus:ring-[#6D28D9] focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Source Code URL
                  </label>
                  <input
                    type="url"
                    value={formData.source_url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, source_url: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-[#FAFAFA] focus:ring-2 focus:ring-[#6D28D9] focus:border-transparent"
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={formData.is_this_platform}
                    onChange={(e) => setFormData((prev) => ({ ...prev, is_this_platform: e.target.checked }))}
                    className="rounded border-zinc-300 text-[#6D28D9] focus:ring-[#6D28D9]"
                  />
                  This is the platform itself
                </label>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Featured Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData((prev) => ({ ...prev, featured_image: e.target.files?.[0] || null }))}
                    className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#6D28D9]/10 file:text-[#6D28D9] hover:file:bg-[#6D28D9]/20"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 text-sm font-medium bg-[#6D28D9] text-white rounded-lg hover:bg-[#5B21B6] disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Projects list */}
      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="mt-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          {projects.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">
              No portfolio projects yet.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase tracking-wide">Title</th>
                  <th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase tracking-wide">Technologies</th>
                  <th className="text-center p-4 text-xs font-medium text-zinc-500 uppercase tracking-wide">Order</th>
                  <th className="text-center p-4 text-xs font-medium text-zinc-500 uppercase tracking-wide">Platform</th>
                  <th className="text-right p-4 text-xs font-medium text-zinc-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {projects
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((project) => (
                    <tr key={project.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="p-4 text-sm font-medium text-zinc-900 dark:text-[#FAFAFA]">
                        {project.title}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {project.technologies?.slice(0, 3).map((tech) => (
                            <span key={tech} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                              {tech}
                            </span>
                          ))}
                          {(project.technologies?.length || 0) > 3 && (
                            <span className="text-xs text-zinc-400">+{project.technologies!.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center text-sm text-zinc-500">{project.sort_order}</td>
                      <td className="p-4 text-center">
                        {project.is_this_platform && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            ✓
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleEdit(project)}
                          className="px-3 py-1.5 text-xs font-medium text-[#6D28D9] bg-[#6D28D9]/10 rounded-lg hover:bg-[#6D28D9]/20 transition-colors"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
