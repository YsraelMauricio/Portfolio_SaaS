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
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full motion-safe:animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-dvh bg-bg">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-text font-display">{t('title')}</h1>
        <p className="mt-2 text-text-muted">{t('subtitle')}</p>

        {/* Technology filter */}
        {allTechnologies.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedTech('')}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                !selectedTech
                  ? 'bg-primary text-white'
                  : 'glass-card--light text-text-muted border border-[var(--glass-border)] hover:border-primary/30'
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
                    ? 'bg-primary text-white'
                    : 'glass-card--light text-text-muted border border-[var(--glass-border)] hover:border-primary/30'
                }`}
              >
                {tech}
              </button>
            ))}
          </div>
        )}

        {/* Projects grid */}
        {filteredProjects.length === 0 ? (
          <div className="mt-12 text-center py-16 glass-card--light">
            <p className="text-text-muted">{t('noProjects')}</p>
          </div>
        ) : (
          <div className="@container">
            <div className="mt-8 grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/portfolio/${project.slug}`}
                className="group glass-card--light overflow-hidden hover:border-primary/30 transition-all"
              >
                {project.featured_image_url && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={project.featured_image_url}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 motion-safe:transition-transform motion-safe:duration-300"
                    />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-lg font-semibold text-text group-hover:text-primary transition-colors">
                      {project.title}
                    </h2>
                    {project.is_this_platform && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {t('thisPlatform')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-muted line-clamp-2">
                    {project.description}
                  </p>
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {project.technologies.slice(0, 4).map((tech) => (
                        <span
                          key={tech}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--surface-rgb)] text-text-muted"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.technologies.length > 4 && (
                        <span className="text-xs text-text-muted">
                          +{project.technologies.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="mt-4">
                    <span className="text-sm font-medium text-primary group-hover:underline">
                      {t('viewProject')} →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
