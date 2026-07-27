'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { login, register } from '@/app/lib/api';

export default function RegisterPage() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirmation) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      // Auto-login after registration
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('registerError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-6">
      <div className="glass-card w-full max-w-md p-8">
        <h1 className="text-2xl font-display font-bold text-text mb-6">{t('registerTitle')}</h1>
        {error && (
          <p className="mb-4 text-sm text-red-400" role="alert">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm text-text-muted mb-1">{t('name')}</label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-transparent border border-[var(--glass-border)] text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label htmlFor="reg-email" className="block text-sm text-text-muted mb-1">{t('email')}</label>
            <input
              id="reg-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-transparent border border-[var(--glass-border)] text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label htmlFor="reg-password" className="block text-sm text-text-muted mb-1">{t('password')}</label>
            <input
              id="reg-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-transparent border border-[var(--glass-border)] text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label htmlFor="password-confirmation" className="block text-sm text-text-muted mb-1">{t('confirmPassword')}</label>
            <input
              id="password-confirmation"
              type="password"
              required
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-transparent border border-[var(--glass-border)] text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent text-bg font-semibold rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
          >
            {loading ? t('registering') : t('registerButton')}
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-text-muted">
          <p>
            {t('haveAccount')}{' '}
            <Link href="/login" className="text-accent hover:underline">{t('signIn')}</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
