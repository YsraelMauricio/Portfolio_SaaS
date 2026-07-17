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
        <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full motion-safe:animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-text font-display">Profile Links</h1>
      <p className="mt-2 text-text-muted">
        Manage the profile links displayed on your public profile.
      </p>

      {error && (
        <div className="mt-4 glass-card--light border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 glass-card--light border border-secondary/30 px-4 py-3 text-sm text-secondary">
          {success}
        </div>
      )}

      <div className="mt-8 glass-card--light overflow-hidden">
        {links.length === 0 ? (
          <div className="p-8 text-center text-sm text-text-muted">
            No profile links found. Add links directly in the database.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--glass-border)] bg-text-muted/10">
                <th className="text-left p-4 text-xs font-medium text-text-muted uppercase tracking-wide">Key</th>
                <th className="text-left p-4 text-xs font-medium text-text-muted uppercase tracking-wide">URL</th>
                <th className="text-center p-4 text-xs font-medium text-text-muted uppercase tracking-wide">Visible</th>
                <th className="text-center p-4 text-xs font-medium text-text-muted uppercase tracking-wide">Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {links.map((link) => (
                <tr key={link.id} className="hover:bg-text-muted/5 motion-safe:transition-colors">
                  <td className="p-4">
                    <code className="text-xs font-mono bg-text-muted/10 px-1.5 py-0.5 rounded text-text-muted">
                      {link.key}
                    </code>
                  </td>
                  <td className="p-4">
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => handleUpdateUrl(link.id, e.target.value)}
                      className="w-full px-2 py-1.5 text-sm rounded border border-[var(--glass-border)] glass-card--light text-text placeholder-text-muted focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </td>
                  <td className="p-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(link.id)}
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium motion-safe:transition-colors ${
                        link.visible
                          ? 'bg-secondary/20 text-secondary'
                          : 'bg-text-muted/20 text-text-muted'
                      }`}
                    >
                      {link.visible ? 'Visible' : 'Hidden'}
                    </button>
                  </td>
                  <td className="p-4 text-center text-sm text-text-muted">
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
            className="px-6 py-2.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 motion-safe:transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}
