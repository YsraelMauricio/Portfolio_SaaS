import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://ysraelmauricio.com'),
  title: {
    default: 'Ysrael Mauricio — Software Development & AI Solutions',
    template: '%s | Ysrael Mauricio',
  },
  description:
    'Full-stack software development, AI solutions, and technical consulting. Web, mobile, and desktop applications.',
};

/**
 * Minimal root layout — the [locale] layout owns <html> and <body>.
 * This is required by next-intl's plugin-based routing.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
