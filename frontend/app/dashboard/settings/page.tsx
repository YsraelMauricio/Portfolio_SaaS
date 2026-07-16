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
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-[#FAFAFA]">Settings</h1>
      <p className="mt-2 text-zinc-500 dark:text-[rgba(250,250,250,0.6)]">
        Manage your account settings.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6">
        {/* Profile info */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-[#FAFAFA] mb-4">
            Profile Information
          </h2>
          {user && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">Name</p>
                <p className="mt-1 text-sm text-zinc-900 dark:text-[#FAFAFA]">{user.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">Email</p>
                <p className="mt-1 text-sm text-zinc-900 dark:text-[#FAFAFA]">{user.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
            Danger Zone
          </h2>
          <p className="text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)] mb-4">
            Once you delete your account, your data will be anonymized after the retention period.
            This action cannot be undone.
          </p>
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="px-5 py-2.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
