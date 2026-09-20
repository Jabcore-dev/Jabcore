/**
 * JSON-LD structured data helpers for jabcore.cz
 *
 * Usage in page.tsx (Server Component):
 * ```tsx
 * import { buildOrganizationJsonLd } from '@/lib/jsonld'
 * // In the component return:
 * <script
 *   type="application/ld+json"
 *   dangerouslySetInnerHTML={{ __html: JSON.stringify(buildOrganizationJsonLd()) }}
 * />
 * ```
 */

import { SITE_URL } from '@/lib/site-config'

const BASE_URL = SITE_URL

export interface OrganizationJsonLd {
  '@context': 'https://schema.org'
  '@type': ['Organization', 'LocalBusiness']
  name: string
  url: string
  logo: string
  description: string
  slogan: string
  email: string
  telephone: string
  address: {
    '@type': 'PostalAddress'
    addressLocality: string
    addressCountry: string
  }
  sameAs: string[]
  contactPoint: {
    '@type': 'ContactPoint'
    contactType: string
    email: string
    telephone: string
    availableLanguage: string[]
  }
}

/**
 * Generates Organization + LocalBusiness JSON-LD schema for Jabcore.
 * Primarily used on the homepage but can be included on any page.
 */
export function buildOrganizationJsonLd(): OrganizationJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'LocalBusiness'],
    name: 'Jabcore',
    url: BASE_URL,
    logo: `${BASE_URL}/og-image.png`,
    description:
      'Vývoj softwaru na míru — mobilní aplikace, enterprise systémy, webové aplikace. Lean tým, AI-first přístup, konkurenční ceny.',
    slogan: 'Build it right, build it once.',
    email: 'info@jabcore.cz',
    telephone: '+420792219454',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Jablonec nad Nisou',
      addressCountry: 'CZ',
    },
    sameAs: [
      'https://github.com/Jabcore-dev',
      'https://www.linkedin.com/company/jabcore',
      'https://www.facebook.com/profile.php?id=61584245041851',
      'https://www.instagram.com/jabcore.dev/',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'info@jabcore.cz',
      telephone: '+420792219454',
      availableLanguage: ['Czech', 'English'],
    },
  }
}

interface CreativeWorkJsonLd {
  '@context': 'https://schema.org'
  '@type': 'CreativeWork'
  name: string
  url: string
  description?: string
  dateCreated?: string
  image?: string
  keywords?: string
  creator: { '@type': 'Organization'; name: string; url: string }
  about?: { '@type': 'Organization'; name: string }
}

/**
 * Structured data for one reference.
 *
 * Used by the detail pages and, on the portfolio one-pager, for every item on
 * the page — there the whole portfolio is a single URL, so without a node per
 * reference a crawler sees one long document instead of a list of projects.
 */
export function buildReferenceJsonLd(reference: {
  slug: string
  title: string
  summary: string | null
  clientName: string
  year: number | null
  coverImage: string | null
  tech: string[]
}, url: string): CreativeWorkJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: reference.title,
    url,
    ...(reference.summary ? { description: reference.summary } : {}),
    // Year only — schema.org accepts a partial date and the exact day of a
    // handover is not something we track.
    ...(reference.year ? { dateCreated: String(reference.year) } : {}),
    ...(reference.coverImage ? { image: `${BASE_URL}${reference.coverImage}` } : {}),
    ...(reference.tech.length > 0 ? { keywords: reference.tech.join(', ') } : {}),
    creator: { '@type': 'Organization', name: 'Jabcore', url: BASE_URL },
    about: { '@type': 'Organization', name: reference.clientName },
  }
}
