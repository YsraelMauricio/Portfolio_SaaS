'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

export default function Footer() {
  const t = useTranslations('Footer');
  const pathname = usePathname();

  const isAdmin = pathname?.startsWith('/admin');
  const isDashboard = pathname?.startsWith('/dashboard');

  // Don't show public footer on admin/dashboard pages
  if (isAdmin || isDashboard) return null;

  return (
    <footer className="bg-[var(--bg)] border-t border-[var(--glass-border)] mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="text-xl font-bold text-primary">
              Portfolio SaaS
            </Link>
            <p className="mt-2 text-sm text-text-muted">
              Professional software development services.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-text mb-3">Links</h3>
            <ul className="space-y-2">
              <li><Link href="/portfolio" className="text-sm text-text-muted hover:text-primary transition-colors">Portfolio</Link></li>
              <li><Link href="/blog" className="text-sm text-text-muted hover:text-primary transition-colors">Blog</Link></li>
              <li><Link href="/cotizar" className="text-sm text-text-muted hover:text-primary transition-colors">Get a Quote</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-text mb-3">{t('contactUs')}</h3>
            <p className="text-sm text-text-muted">
              Contact us for more information about our services.
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--glass-border)] text-center text-xs text-text-muted">
          &copy; {new Date().getFullYear()} Portfolio SaaS. {t('rights')}
        </div>
      </div>
    </footer>
  );
}
