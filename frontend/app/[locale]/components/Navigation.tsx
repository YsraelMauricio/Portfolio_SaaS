'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { logout } from '@/app/lib/api';
import { useAuth } from '@/app/lib/useAuth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Navigation() {
  const t = useTranslations('Navigation');
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { isLoggedIn } = useAuth();
  const isAdmin = pathname?.startsWith('/admin');
  const isDashboard = pathname?.startsWith('/dashboard');

  // Don't show public nav on admin/dashboard pages
  if (isAdmin || isDashboard) return null;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/servicios', label: t('services') },
    { href: '/portfolio', label: t('portfolio') },
    { href: '/mantenimiento', label: t('maintenance') },
    { href: '/blog', label: t('blog') },
    { href: '/sobre-mi', label: t('about') },
    { href: '/cotizar', label: t('getQuote') },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[var(--bg)]/80 backdrop-blur-md border-b border-[var(--glass-border)]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-primary font-display">
            {t('brandName')}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = link.href === '/'
                ? pathname === '/' || pathname === ''
                : pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-muted hover:bg-[var(--surface-rgb)]/10'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text transition-colors"
                >
                  {t('dashboard')}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  {t('signOut')}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium bg-accent text-[#1E1B2E] rounded-lg hover:brightness-110 transition-all"
              >
                {t('signIn')}
              </Link>
            )}
            {/* Language switcher */}
            <LocaleSwitcher />
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-[var(--surface-rgb)]/10"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-[var(--glass-border)] pt-4">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium rounded-lg hover:bg-[var(--surface-rgb)]/10 text-text-muted"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-3 pt-3 border-t border-[var(--glass-border)]">
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-2.5 text-sm font-medium rounded-lg hover:bg-[var(--surface-rgb)]/10 text-text-muted"
                    >
                      {t('dashboard')}
                    </Link>
                    <button
                      type="button"
                      onClick={() => { handleLogout(); setMobileOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      {t('signOut')}
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium bg-accent text-[#1E1B2E] rounded-lg hover:brightness-110 text-center"
                  >
                    {t('signIn')}
                  </Link>
                )}
                <div className="mt-3 px-4">
                  <LocaleSwitcher />
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

function LocaleSwitcher() {
  const t = useTranslations('Navigation');
  const pathname = usePathname();
  const router = useRouter();

  const currentLocale = pathname?.split('/')[1] || 'en';
  const otherLocale = currentLocale === 'en' ? 'es' : 'en';

  const switchLocale = () => {
    // Navigate to the same path but with different locale
    const newPath = pathname?.replace(/^\/[^\/]+/, `/${otherLocale}`) || `/${otherLocale}`;
    router.push(newPath);
  };

  return (
    <button
      type="button"
      onClick={switchLocale}
      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--glass-border)] text-text-muted hover:bg-[var(--surface-rgb)]/10 transition-colors uppercase"
      aria-label={t('language')}
    >
      {otherLocale === 'en' ? 'EN' : 'ES'}
    </button>
  );
}
