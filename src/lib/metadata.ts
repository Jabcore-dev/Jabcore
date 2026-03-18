import type { Metadata } from 'next'

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
  const url = `https://jabcore.cz${path}`
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
    },
  }
}
