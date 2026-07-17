'use client';

import { useEffect, useState } from 'react';
import { fetchApiWithAuth, fetchApi } from '@/app/lib/api';
import type { Settings, PublicSettings } from '@/app/types/dashboard';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [publicSettings, setPublicSettings] = useState<PublicSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [adminRes, publicRes] = await Promise.all([
          fetchApiWithAuth<Settings>('/admin/settings'),
          fetchApi<PublicSettings>('/settings/public'),
        ]);
        setSettings(adminRes.data);
        setPublicSettings(publicRes.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetchApiWithAuth<Settings>('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(settings),
      });
      setSettings(res.data);
      setSuccess('Settings saved successfully.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const currentKeys = Object.keys(settings);

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
        Manage site-wide configuration. All changes are cached and invalidated on save.
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

      <form onSubmit={handleSave} className="mt-8 space-y-6">
        {/* Public settings section */}
        {Object.keys(publicSettings).length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-text font-display mb-4">
              Public Settings
            </h2>
            <div className="glass-card--light divide-y divide-[var(--glass-border)]">
              {Object.entries(publicSettings).map(([key]) => (
                <div key={key} className="p-5">
                  <label className="block text-sm font-medium text-text-muted mb-1">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </label>
                  <input
                    type="text"
                    value={settings[key] ?? ''}
                    onChange={(e) => updateSetting(key, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--glass-border)] glass-card--light text-sm text-text placeholder-text-muted focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All settings section */}
        <div>
          <h2 className="text-lg font-semibold text-text font-display mb-4">
            All Settings ({currentKeys.length})
          </h2>
          <div className="glass-card--light divide-y divide-[var(--glass-border)]">
            {currentKeys.length === 0 ? (
              <div className="p-8 text-center text-sm text-text-muted">
                No settings found. Add settings via the database or API.
              </div>
            ) : (
              currentKeys.map((key) => (
                <div key={key} className="p-5">
                  <label className="block text-sm font-medium text-text-muted mb-1">
                    <code className="text-xs bg-text-muted/10 px-1.5 py-0.5 rounded font-mono">
                      {key}
                    </code>
                  </label>
                  <input
                    type="text"
                    value={settings[key] ?? ''}
                    onChange={(e) => updateSetting(key, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--glass-border)] glass-card--light text-sm text-text placeholder-text-muted focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 motion-safe:transition-colors"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
