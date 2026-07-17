'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { fetchTestimonials } from '@/app/lib/api';
import type { Testimonial } from '@/app/types/content';

export default function TestimonialsSection() {
  const t = useTranslations('Testimonials');
  const params = useParams();
  const locale = params.locale as string;

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchTestimonials(locale);
        setTestimonials(res.data);
      } catch {
        // Silently fail — testimonials are optional content
      } finally {
        setLoading(false);
      }
    })();
  }, [locale]);

  // Rotate through testimonials every 5 seconds
  useEffect(() => {
    if (testimonials.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-center text-text font-display">
          {t('title')}
        </h2>
        <div className="mt-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 glass-card--light animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (testimonials.length === 0) {
    return null;
  }

  const current = testimonials[activeIndex];

  return (
    <div>
      <h2 className="text-3xl font-bold text-center text-text font-display">
        {t('title')}
      </h2>
      <p className="mt-2 text-center text-text-muted">
        {t('subtitle')}
      </p>

      <div className="mt-10 max-w-2xl mx-auto">
        <div className="glass-card--light p-8 text-center">
          <svg
            className="w-8 h-8 text-primary/30 mx-auto mb-4"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
          <p className="text-lg text-text-muted italic leading-relaxed">
            &ldquo;{current.content}&rdquo;
          </p>
          <div className="mt-6">
            <p className="font-semibold text-text">
              {current.author_name}
            </p>
            {current.role && (
              <p className="text-sm text-text-muted">
                {current.role}
              </p>
            )}
          </div>
        </div>

        {/* Dots navigation */}
        {testimonials.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  idx === activeIndex
                    ? 'bg-primary'
                    : 'bg-text-muted/30 hover:bg-text-muted/50'
                }`}
                aria-label={`Go to testimonial ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
