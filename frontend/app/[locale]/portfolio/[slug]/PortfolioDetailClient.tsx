'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { fetchPortfolioProject } from '@/app/lib/api';
import type { PortfolioProject } from '@/app/types/content';

export default function PortfolioDetailClient() {
  const t = useTranslations('Portfolio');
  const params = useParams();
  const slug = params.slug as string;
  const locale = params.locale as string;

  const [project, setProject] = useState<PortfolioProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchPortfolioProject(slug, locale);
        setProject(res.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load project');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, locale]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full motion-safe:animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-dvh bg-bg">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <p className="text-red-600 dark:text-red-400 font-medium">{error ?? 'Project not found'}</p>
            <Link href="/portfolio" className="mt-4 inline-block text-sm text-primary hover:underline">
              {t('backToPortfolio')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link
          href="/portfolio"
          className="text-sm text-text-muted hover:text-primary transition-colors"
        >
          {t('backToPortfolio')}
        </Link>

        {/* Hero */}
        <div className="mt-6">
          {project.featured_image_url && (
            <div className="rounded-xl overflow-hidden mb-8">
              <img
                src={project.featured_image_url}
                alt={project.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-text font-display">
              {project.title}
            </h1>
            {project.is_this_platform && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {t('thisPlatformBadge')}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-text mb-3">{t('description')}</h2>
          <p className="text-text-muted leading-relaxed">{project.description}</p>
        </div>

        {/* Key Results */}
        {project.key_results && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-text mb-3">{t('keyResults')}</h2>
            <div
              className="prose prose-zinc dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: project.key_results }}
            />
          </div>
        )}

        {/* Tech Stack */}
        {project.technologies && project.technologies.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-text mb-3">{t('techStack')}</h2>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium glass-card--light text-text-muted"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        {(project.live_url || project.source_url) && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-text mb-3">{t('links')}</h2>
            <div className="flex flex-wrap gap-4">
              {project.live_url && (
                <a
                  href={project.live_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-bg font-medium rounded-xl hover:brightness-110 transition-all text-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {t('liveDemo')}
                </a>
              )}
              {project.source_url && (
                <a
                  href={project.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 glass-card--light text-text-muted font-medium rounded-lg hover:border-accent/30 transition-all text-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  {t('sourceCode')}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
