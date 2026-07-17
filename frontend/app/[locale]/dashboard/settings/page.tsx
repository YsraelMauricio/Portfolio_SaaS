'use client';

import { useEffect, useState } from 'react';
import { fetchApiWithAuth, clearAuthToken } from '@/app/lib/api';
import type { User } from '@/app/types/dashboard';
import { useRouter } from 'next/navigation';

export default function DashboardSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApiWithAuth<User>('/auth/user')
      .then((res) => setUser(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone immediately but has a retention period before full anonymization.')) {
      return;
    }
    if (!window.confirm('This will permanently close your account. All your data will be anonymized after the retention period. Continue?')) {
      return;
    }
    try {
      await fetchApiWithAuth('/account', { method: 'DELETE' });
      clearAuthToken();
      router.push('/');
    } catch {
      alert('Failed to delete account. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full motion-safe:animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-text font-display">Settings</h1>
      <p className="mt-2 text-text-muted">
        Manage your account settings.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6">
        {/* Profile info */}
        <div className="glass-card--light p-6">
          <h2 className="text-lg font-semibold text-text mb-4">
            Profile Information
          </h2>
          {user && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Name</p>
                <p className="mt-1 text-sm text-text">{user.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Email</p>
                <p className="mt-1 text-sm text-text">{user.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="glass-card--light border border-red-200 dark:border-red-900/50 p-6">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
            Danger Zone
          </h2>
          <p className="text-sm text-text-muted mb-4">
            Once you delete your account, your data will be anonymized after the retention period.
            This action cannot be undone.
          </p>
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="px-5 py-2.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
