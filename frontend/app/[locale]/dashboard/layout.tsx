'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, Link } from '@/i18n/navigation';
import { getAuthToken, clearAuthToken, fetchApiWithAuth } from '@/app/lib/api';
import type { User } from '@/app/types/dashboard';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: '📊' },
  { href: '/dashboard/projects', label: 'Projects', icon: '📁' },
  { href: '/dashboard/quotes', label: 'My Quotes', icon: '📋' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
      {/* Sidebar */}
      <aside className="w-64 glass-card--light rounded-none border-r border-[var(--glass-border)] flex flex-col shrink-0">
        <div className="p-6 border-b border-[var(--glass-border)]">
          <Link href="/dashboard" className="text-xl font-bold text-primary">
            Client Panel
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
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
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}
