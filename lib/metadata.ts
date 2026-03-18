import type { Metadata } from 'next'

const BASE_URL = 'https://jabcore.cz'
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`

export interface PageMetadataProps {
  /** Page title — will be rendered as "{title} | Jabcore", or just "Jabcore" for homepage */
  title: string
  /** Page meta description */
  description: string
  /** URL path, e.g. '/services'. Used to generate canonical tag. */
  path: string
  /** Optional OG image URL. Defaults to /og-image.png */
  image?: string
  /** Optional locale override. Defaults to 'cs_CZ' */
  locale?: string
}

/**
 * Generate Next.js Metadata object for a page.
 *
 * Usage in page.tsx:
 * ```ts
 * import { generatePageMetadata } from '@/lib/metadata'
 * import type { Metadata } from 'next'
 *
 * export const metadata: Metadata = generatePageMetadata({
 *   title: 'Naše Služby',
 *   description: 'Nabízíme kompletní služby webového vývoje...',
 *   path: '/services',
 * })
 * ```
 */
export function generatePageMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  locale = 'cs_CZ',
}: PageMetadataProps): Metadata {
  const isHome = path === '/'
  const formattedTitle = isHome ? 'Jabcore' : `${title} | Jabcore`
  const canonicalUrl = `${BASE_URL}${path}`

  return {
    title: formattedTitle,
    description,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: formattedTitle,
      description,
      url: canonicalUrl,
      siteName: 'Jabcore',
      locale,
      type: 'website',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: formattedTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: formattedTitle,
      description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}
