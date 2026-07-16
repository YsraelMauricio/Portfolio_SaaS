'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { fetchPortfolioProjects } from '@/app/lib/api';
import type { PortfolioProject } from '@/app/types/content';

export default function PortfolioListPage() {
  const t = useTranslations('Portfolio');
  const params = useParams();
  const locale = params.locale as string;

  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTech, setSelectedTech] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchPortfolioProjects(locale);
        setProjects(res.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load portfolio');
      } finally {
        setLoading(false);
      }
    })();
  }, [locale]);

  // Extract all unique technologies
  const allTechnologies = useMemo(() => {
    const techSet = new Set<string>();
    projects.forEach((p) => p.technologies?.forEach((t) => techSet.add(t)));
    return Array.from(techSet).sort();
  }, [projects]);

  const filteredProjects = selectedTech
    ? projects.filter((p) => p.technologies?.includes(selectedTech))
    : projects;

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#09090B] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#09090B]">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090B]">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-[#FAFAFA]">{t('title')}</h1>
        <p className="mt-2 text-zinc-500 dark:text-[rgba(250,250,250,0.6)]">{t('subtitle')}</p>

        {/* Technology filter */}
        {allTechnologies.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedTech('')}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                !selectedTech
                  ? 'bg-[#6D28D9] text-white'
                  : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:border-[#6D28D9]/30'
              }`}
            >
              {t('allTechnologies')}
            </button>
            {allTechnologies.map((tech) => (
              <button
                key={tech}
                type="button"
                onClick={() => setSelectedTech(tech)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  selectedTech === tech
                    ? 'bg-[#6D28D9] text-white'
                    : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:border-[#6D28D9]/30'
                }`}
              >
                {tech}
              </button>
            ))}
          </div>
        )}

        {/* Projects grid */}
        {filteredProjects.length === 0 ? (
          <div className="mt-12 text-center py-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <p className="text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">{t('noProjects')}</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/portfolio/${project.slug}`}
                className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden hover:border-[#6D28D9]/30 transition-colors"
              >
                {project.featured_image_url && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={project.featured_image_url}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-[#FAFAFA] group-hover:text-[#6D28D9] transition-colors">
                      {project.title}
                    </h2>
                    {project.is_this_platform && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        {t('thisPlatform')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.6)] line-clamp-2">
                    {project.description}
                  </p>
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {project.technologies.slice(0, 4).map((tech) => (
                        <span
                          key={tech}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.technologies.length > 4 && (
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">
                          +{project.technologies.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="mt-4">
                    <span className="text-sm font-medium text-[#6D28D9] group-hover:underline">
                      {t('viewProject')} →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
