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

const BASE_URL = 'https://jabcore.cz'

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
      addressLocality: 'Praha',
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
