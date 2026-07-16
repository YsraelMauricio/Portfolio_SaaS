'use client';

import { useEffect, useState } from 'react';
import { fetchApiWithAuth, fetchApi } from '@/app/lib/api';
import type { ProfileLink } from '@/app/types/dashboard';

export default function AdminProfileLinksPage() {
  const [links, setLinks] = useState<ProfileLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchApi<ProfileLink[]>('/profile-links');
        setLinks(res.data);
      } catch {
        setLinks([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleToggleVisibility = (id: number) => {
    setLinks((prev) =>
      prev.map((link) =>
        link.id === id ? { ...link, visible: !link.visible } : link,
      ),
    );
  };

  const handleUpdateUrl = (id: number, url: string) => {
    setLinks((prev) =>
      prev.map((link) => (link.id === id ? { ...link, url } : link)),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        links: links.map((link) => ({
          id: link.id,
          url: link.url,
          visible: link.visible,
          sort_order: link.sort_order,
        })),
      };
      await fetchApiWithAuth('/admin/profile-links', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setSuccess('Profile links updated successfully.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update profile links');
    } finally {
      setSaving(false);
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
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-[#FAFAFA]">Profile Links</h1>
      <p className="mt-2 text-zinc-500 dark:text-[rgba(250,250,250,0.6])">
        Manage the profile links displayed on your public profile.
      </p>

      {error && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 text-sm text-green-600 dark:text-green-400">
          {success}
        </div>
      )}

      <div className="mt-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        {links.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">
            No profile links found. Add links directly in the database.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                <th className="text-left p-4 text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">Key</th>
                <th className="text-left p-4 text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">URL</th>
                <th className="text-center p-4 text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">Visible</th>
                <th className="text-center p-4 text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {links.map((link) => (
                <tr key={link.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                  <td className="p-4">
                    <code className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-700 dark:text-zinc-300">
                      {link.key}
                    </code>
                  </td>
                  <td className="p-4">
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => handleUpdateUrl(link.id, e.target.value)}
                      className="w-full px-2 py-1.5 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-[#FAFAFA] focus:ring-2 focus:ring-[#6D28D9] focus:border-transparent"
                    />
                  </td>
                  <td className="p-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(link.id)}
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        link.visible
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {link.visible ? 'Visible' : 'Hidden'}
                    </button>
                  </td>
                  <td className="p-4 text-center text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">
                    {link.sort_order}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {links.length > 0 && (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 text-sm font-medium bg-[#6D28D9] text-white rounded-lg hover:bg-[#5B21B6] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}
