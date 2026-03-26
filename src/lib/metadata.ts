import type { Metadata } from 'next'
import { locales, ogLocales, type Locale } from './i18n-config'
import { t } from './server-i18n'

const BASE_URL = 'https://jabcore.cz'
const OG_IMAGE = `${BASE_URL}/og-image.png`

type PageKey = 'home' | 'services' | 'products' | 'stack' | 'about' | 'contact'

interface PageMetadataProps {
  /** SEO key — used to read seo.{page}.title / description / keywords from locale JSON */
  page: PageKey
  /** URL path without locale prefix, e.g. "/services" */
  path: string
  /** Current locale */
  locale: Locale
  /** If true, use title without "| Jabcore" suffix */
  isHome?: boolean
}

/**
 * Generates Next.js Metadata with hreflang alternates for every supported locale.
 */
export function generatePageMetadata({
  page,
  path,
  locale,
  isHome = false,
}: PageMetadataProps): Metadata {
  const title = t(locale, `seo.${page}.title`)
  const description = t(locale, `seo.${page}.description`)
  const keywords = t(locale, `seo.${page}.keywords`)
  const url = `${BASE_URL}/${locale}${path}`
  const ogLocale = ogLocales[locale] ?? 'cs_CZ'

  // Build hreflang alternates for all locales
  const languageAlternates: Record<string, string> = {}
  for (const loc of locales) {
    languageAlternates[loc] = `${BASE_URL}/${loc}${path}`
  }
  languageAlternates['x-default'] = `${BASE_URL}/${locale}${path}`

  return {
    title: isHome ? { absolute: title } : title,
    description,
    keywords,
    alternates: {
      canonical: url,
      languages: languageAlternates,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Jabcore',
      locale: ogLocale,
      type: 'website',
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: 'Jabcore',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [OG_IMAGE],
    },
  }
}
