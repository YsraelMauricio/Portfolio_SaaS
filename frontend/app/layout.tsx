import type { ReactNode } from 'react';

/**
 * Minimal root layout — the [locale] layout owns <html> and <body>.
 * This is required by next-intl's plugin-based routing.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
