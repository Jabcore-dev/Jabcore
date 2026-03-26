import type { Metadata } from 'next'
import { locales, defaultLocale } from '@/lib/i18n-config'
import { t } from '@/lib/server-i18n'
import { buildOrganizationJsonLd } from '@/lib/jsonld'
import Providers from '@/components/providers/Providers'
import Navigation from '@/components/sections/Navigation'
import Footer from '@/components/sections/Footer'
import { Toaster } from '@/components/ui/sonner'
import DynamicSeoTitle from '@/components/DynamicSeoTitle'
import HomePage from '@/views/HomePage'
import RootRedirect from './RootRedirect'

const BASE_URL = 'https://jabcore.cz'

export const metadata: Metadata = {
  title: t(defaultLocale, 'seo.home.title'),
  description: t(defaultLocale, 'seo.home.description'),
  keywords: t(defaultLocale, 'seo.home.keywords'),
  metadataBase: new URL(BASE_URL),
  alternates: {
    canonical: BASE_URL,
    languages: Object.fromEntries([
      ...locales.map((loc) => [loc, loc === 'cs' ? BASE_URL : `${BASE_URL}/${loc}`]),
      ['x-default', BASE_URL],
    ]),
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: t(defaultLocale, 'seo.home.title'),
    description: t(defaultLocale, 'seo.home.description'),
    url: BASE_URL,
    siteName: 'Jabcore',
    locale: 'cs_CZ',
    type: 'website',
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Jabcore' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: t(defaultLocale, 'seo.home.title'),
    description: t(defaultLocale, 'seo.home.description'),
    images: [`${BASE_URL}/og-image.png`],
  },
}

/**
 * Root page — full Czech homepage for crawlers.
 * JS users get redirected to their preferred locale by RootRedirect.
 */
export default function RootPage() {
  return (
    <Providers locale="cs">
      <RootRedirect />
      <DynamicSeoTitle />
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <main>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(buildOrganizationJsonLd()) }}
          />
          <HomePage />
        </main>
        <Footer />
      </div>
      <Toaster position="bottom-right" />
    </Providers>
  )
}
