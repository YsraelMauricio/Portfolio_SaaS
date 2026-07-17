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
        <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full motion-safe:animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card--light border border-red-200 dark:border-red-800 p-6">
        <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-text font-display">Deleted Users</h1>
      <p className="mt-2 text-text-muted">
        Users that have been soft-deleted and are still within the retention window. These users
        will be automatically anonymized after the retention period expires.
      </p>

      {users.length === 0 ? (
        <div className="mt-8 text-center py-16 glass-card--light">
          <p className="text-sm text-text-muted">
            No users in the retention window.
          </p>
        </div>
      ) : (
        <div className="mt-8 glass-card--light overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--glass-border)] bg-text-muted/10">
                <th className="text-left p-4 text-xs font-medium text-text-muted uppercase tracking-wide">ID</th>
                <th className="text-left p-4 text-xs font-medium text-text-muted uppercase tracking-wide">Name</th>
                <th className="text-left p-4 text-xs font-medium text-text-muted uppercase tracking-wide">Email</th>
                <th className="text-left p-4 text-xs font-medium text-text-muted uppercase tracking-wide">Deleted At</th>
                <th className="text-left p-4 text-xs font-medium text-text-muted uppercase tracking-wide">Exit Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-text-muted/5 motion-safe:transition-colors">
                  <td className="p-4 text-sm text-text-muted">
                    {user.id}
                  </td>
                  <td className="p-4 text-sm font-medium text-text">
                    {user.name}
                  </td>
                  <td className="p-4 text-sm text-text-muted">
                    {user.email}
                  </td>
                  <td className="p-4 text-sm text-text-muted">
                    {new Date(user.deleted_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-sm text-text-muted max-w-xs truncate">
                    {user.exit_survey_reason ?? (
                      <span className="italic text-text-muted/60">Not provided</span>
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
