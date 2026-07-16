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
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-[#09090B]">
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
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col shrink-0 transform transition-transform lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <Link href="/admin" className="text-xl font-bold text-[#6D28D9]">
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
                    ? 'bg-[#6D28D9]/10 text-[#6D28D9] dark:bg-[#6D28D9]/20'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          {user && (
            <div className="mb-3 px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400 truncate">
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
      <main className="flex-1 overflow-auto min-h-screen">
        {/* Mobile header */}
        <div className="sticky top-0 z-10 lg:hidden bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Open sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-zinc-900 dark:text-[#FAFAFA]">Admin Panel</span>
        </div>

        <div className="max-w-6xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}
