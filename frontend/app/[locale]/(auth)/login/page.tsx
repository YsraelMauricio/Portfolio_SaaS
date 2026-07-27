'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { login } from '@/app/lib/api';

export default function LoginPage() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loginError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-6">
      <div className="glass-card w-full max-w-md p-8">
        <h1 className="text-2xl font-display font-bold text-text mb-6">{t('loginTitle')}</h1>
        {error && (
          <p className="mb-4 text-sm text-red-400" role="alert">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-text-muted mb-1">{t('email')}</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-transparent border border-[var(--glass-border)] text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm text-text-muted mb-1">{t('password')}</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-transparent border border-[var(--glass-border)] text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent text-bg font-semibold rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
          >
            {loading ? t('loggingIn') : t('loginButton')}
          </button>
        </form>
        <div className="mt-6 space-y-2 text-center text-sm text-text-muted">
          <p>
            <Link href="/register" className="text-accent hover:underline">{t('needAccount')}</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
