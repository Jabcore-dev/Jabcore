import type { Metadata } from 'next'

const BASE_URL = 'https://jabcore.cz'
const OG_IMAGE = `${BASE_URL}/og-image.png`

interface PageMetadataProps {
  /** Název stránky — zobrazí se jako "{title} | Jabcore" */
  title: string
  /** Meta description stránky */
  description: string
  /** URL cesta stránky, napr. "/services" */
  path: string
  /** Pokud true, použije se title bez suffixu "| Jabcore" */
  isHome?: boolean
  /** Locale pro OG tagy, default "cs_CZ" */
  locale?: string
}

/**
 * Generuje Next.js Metadata objekt pro stránku.
 *
 * Použití v page.tsx:
 * ```ts
 * export const metadata = generatePageMetadata({
 *   title: 'Služby',
 *   description: 'Popis stránky...',
 *   path: '/services',
 * })
 * ```
 */
export function generatePageMetadata({
  title,
  description,
  path,
  isHome = false,
  locale = 'cs_CZ',
}: PageMetadataProps): Metadata {
  const url = `${BASE_URL}${path}`
  const fullTitle = isHome ? title : `${title} | Jabcore`

  return {
    title: isHome ? { absolute: title } : title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: 'Jabcore',
      locale,
      type: 'website',
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: 'Jabcore — Build it right, build it once.',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [OG_IMAGE],
    },
  }
}
