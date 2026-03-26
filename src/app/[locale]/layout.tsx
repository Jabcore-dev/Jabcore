import type { Metadata } from 'next'
import { locales, defaultLocale, ogLocales, type Locale } from '@/lib/i18n-config'
import { t } from '@/lib/server-i18n'
import Providers from '@/components/providers/Providers'
import Navigation from '@/components/sections/Navigation'
import Footer from '@/components/sections/Footer'
import { Toaster } from '@/components/ui/sonner'
import DynamicSeoTitle from '@/components/DynamicSeoTitle'

const BASE_URL = 'https://jabcore.cz'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale = (locales as readonly string[]).includes(rawLocale)
    ? (rawLocale as Locale)
    : defaultLocale

  const title = t(locale, 'seo.home.title')
  const description = t(locale, 'seo.home.description')
  const ogLocale = ogLocales[locale] ?? 'cs_CZ'

  // hreflang alternates
  const languageAlternates: Record<string, string> = {}
  for (const loc of locales) {
    languageAlternates[loc] = `${BASE_URL}/${loc}`
  }
  languageAlternates['x-default'] = `${BASE_URL}/${defaultLocale}`

  return {
    title: { default: title, template: '%s | Jabcore' },
    description,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
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
  const locale = (locales as readonly string[]).includes(rawLocale)
    ? rawLocale
    : defaultLocale

  return (
    <Providers locale={locale}>
      <DynamicSeoTitle />
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <main>{children}</main>
        <Footer />
      </div>
      <Toaster position="bottom-right" />
    </Providers>
  )
}
