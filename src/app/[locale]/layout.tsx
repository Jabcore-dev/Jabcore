import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { locales, ogLocales, type Locale } from '@/lib/i18n-config'
import { t } from '@/lib/server-i18n'
import '../globals.css'
import RootHtml from '@/components/RootHtml'
import Providers from '@/components/providers/Providers'
import Navigation from '@/components/sections/Navigation'
import Footer from '@/components/sections/Footer'
import { Toaster } from '@/components/ui/sonner'
import ViewTracker from '@/components/ViewTracker'

import { SITE_URL } from '@/lib/site-config'

const BASE_URL = SITE_URL

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params
  // Same check as in the layout below. Without it the 404 for /wp-login.php
  // carried the homepage title and a canonical pointing at /cs.
  if (!(locales as readonly string[]).includes(rawLocale)) notFound()
  const locale = rawLocale as Locale

  const title = t(locale, 'seo.home.title')
  const description = t(locale, 'seo.home.description')
  const ogLocale = ogLocales[locale] ?? 'cs_CZ'

  const languageAlternates: Record<string, string> = {}
  for (const loc of locales) {
    languageAlternates[loc] = `${BASE_URL}/${loc}`
  }
  // Holá doména je rozcestník podle cookie, IP a jazyka prohlížeče.
  languageAlternates['x-default'] = BASE_URL

  const canonical = `${BASE_URL}/${locale}`

  return {
    title: { default: title, template: '%s | Jabcore' },
    description,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical,
      languages: languageAlternates,
    },
    icons: {
      icon: '/favicon.png',
      shortcut: '/favicon.png',
      apple: '/favicon.png',
    },
    openGraph: {
      siteName: 'Jabcore',
      locale: ogLocale,
      type: 'website',
      images: [
        {
          url: `${BASE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: 'Jabcore',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      images: [`${BASE_URL}/og-image.png`],
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  /*
   * Only the twelve locales exist. The middleware skips paths with a dot, so
   * /wp-login.php or a mistyped file used to land here and render the Czech
   * homepage with status 200, which search engines count as a duplicate page
   * (soft 404). Unknown first segments are a real 404 now.
   */
  if (!(locales as readonly string[]).includes(rawLocale)) notFound()
  const locale = rawLocale

  return (
    <RootHtml lang={locale}>
      <Providers locale={locale}>
        <ViewTracker />
        <div className="min-h-screen bg-background text-foreground">
          <Navigation />
          <main>{children}</main>
          <Footer />
        </div>
        <Toaster position="bottom-right" />
      </Providers>
    </RootHtml>
  )
}
