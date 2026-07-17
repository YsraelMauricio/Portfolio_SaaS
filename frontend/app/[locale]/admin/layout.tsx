'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, Link } from '@/i18n/navigation';
import { getAuthToken, clearAuthToken, fetchApiWithAuth } from '@/app/lib/api';
import type { User } from '@/app/types/dashboard';

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: '📊' },
  { href: '/admin/dashboard', label: 'BI Dashboard', icon: '📈' },
  { href: '/admin/projects', label: 'Projects', icon: '📁' },
  { href: '/admin/contracts', label: 'Contracts', icon: '📝' },
  { href: '/admin/payments', label: 'Payments', icon: '💳' },
  { href: '/admin/blog', label: 'Blog', icon: '📝' },
  { href: '/admin/portfolio', label: 'Portfolio', icon: '🎨' },
  { href: '/admin/testimonials', label: 'Testimonials', icon: '💬' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
  { href: '/admin/cv', label: 'CV', icon: '📄' },
  { href: '/admin/profile-links', label: 'Profile Links', icon: '🔗' },
  { href: '/admin/deleted-users', label: 'Deleted Users', icon: '🗑️' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }

    fetchApiWithAuth<User>('/auth/user')
      .then((res) => setUser(res.data))
      .catch(() => {
        clearAuthToken();
        router.push('/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    fetchApiWithAuth('/auth/logout', { method: 'POST' }).catch(() => {});
    clearAuthToken();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg">
        <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full motion-safe:animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex bg-bg">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 glass-card--light rounded-none border-r border-[var(--glass-border)] flex flex-col shrink-0 transform motion-safe:transition-transform lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6 border-b border-[var(--glass-border)]">
          <Link href="/admin" className="text-xl font-bold text-primary">
            Admin Panel
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-muted hover:bg-[var(--surface-rgb)]/10'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--glass-border)]">
          {user && (
            <div className="mb-3 px-4 py-2 text-sm text-text-muted truncate">
              {user.email}
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-left"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto min-h-dvh">
        {/* Mobile header */}
        <div className="sticky top-0 z-10 lg:hidden glass-card--light rounded-none border-b border-[var(--glass-border)] px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-[var(--surface-rgb)]/10"
            aria-label="Open sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-text">Admin Panel</span>
        </div>

        <div className="max-w-6xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}
