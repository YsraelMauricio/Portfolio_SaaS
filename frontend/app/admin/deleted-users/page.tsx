'use client';

import { useEffect, useState } from 'react';
import { fetchApiWithAuth } from '@/app/lib/api';
import type { DeletedUser } from '@/app/types/dashboard';

export default function AdminDeletedUsersPage() {
  const [users, setUsers] = useState<DeletedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApiWithAuth<DeletedUser[]>('/admin/deleted-users')
      .then((res) => setUsers(res.data))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load deleted users'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-[#FAFAFA]">Deleted Users</h1>
      <p className="mt-2 text-zinc-500 dark:text-[rgba(250,250,250,0.6])">
        Users that have been soft-deleted and are still within the retention window. These users
        will be automatically anonymized after the retention period expires.
      </p>

      {users.length === 0 ? (
        <div className="mt-8 text-center py-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
          <p className="text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">
            No users in the retention window.
          </p>
        </div>
      ) : (
        <div className="mt-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                <th className="text-left p-4 text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">ID</th>
                <th className="text-left p-4 text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">Name</th>
                <th className="text-left p-4 text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">Email</th>
                <th className="text-left p-4 text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">Deleted At</th>
                <th className="text-left p-4 text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">Exit Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="p-4 text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">
                    {user.id}
                  </td>
                  <td className="p-4 text-sm font-medium text-zinc-900 dark:text-[#FAFAFA]">
                    {user.name}
                  </td>
                  <td className="p-4 text-sm text-zinc-600 dark:text-zinc-400">
                    {user.email}
                  </td>
                  <td className="p-4 text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">
                    {new Date(user.deleted_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)] max-w-xs truncate">
                    {user.exit_survey_reason ?? (
                      <span className="italic text-zinc-400 dark:text-zinc-600">Not provided</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
