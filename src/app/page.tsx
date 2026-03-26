import type { Metadata } from 'next'
import { locales, defaultLocale } from '@/lib/i18n-config'
import { t } from '@/lib/server-i18n'
import RootRedirect from './RootRedirect'

const BASE_URL = 'https://jabcore.cz'

export const metadata: Metadata = {
  title: 'Jabcore — Jádro vaší nové aplikace.',
  description: t(defaultLocale, 'seo.home.description'),
  keywords: t(defaultLocale, 'seo.home.keywords'),
  metadataBase: new URL(BASE_URL),
  alternates: {
    canonical: BASE_URL,
    languages: Object.fromEntries([
      ...locales.map((loc) => [loc, `${BASE_URL}/${loc}`]),
      ['x-default', `${BASE_URL}/${defaultLocale}`],
    ]),
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'Jabcore — Jádro vaší nové aplikace.',
    description: t(defaultLocale, 'seo.home.description'),
    url: BASE_URL,
    siteName: 'Jabcore',
    locale: 'cs_CZ',
    type: 'website',
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Jabcore' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jabcore — Jádro vaší nové aplikace.',
    description: t(defaultLocale, 'seo.home.description'),
    images: [`${BASE_URL}/og-image.png`],
  },
}

/**
 * Root page — SEO-friendly landing with redirect to locale.
 * Renders real HTML content so crawlers see title, H1, description, and links.
 */
export default function RootPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-8">
      <RootRedirect />
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4">Jabcore — Jádro vaší nové aplikace</h1>
        <p className="text-lg text-muted-foreground mb-8">
          {t(defaultLocale, 'seo.home.description')}
        </p>
        <nav aria-label="Language selection">
          <p className="text-sm text-muted-foreground mb-4">Choose your language:</p>
          <ul className="flex flex-wrap justify-center gap-3">
            {locales.map((loc) => (
              <li key={loc}>
                <a
                  href={`/${loc}`}
                  className="inline-block px-4 py-2 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-sm font-medium"
                >
                  {loc.toUpperCase()}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
