/**
 * JSON-LD structured data helpers for jabcore.cz
 *
 * Usage in page.tsx (Server Component):
 * ```tsx
 * import { buildHomeJsonLd, jsonLdScript } from '@/lib/jsonld'
 * // In the component return:
 * <script
 *   type="application/ld+json"
 *   dangerouslySetInnerHTML={{ __html: jsonLdScript(buildHomeJsonLd()) }}
 * />
 * ```
 */

import { SITE_URL } from '@/lib/site-config'

const BASE_URL = SITE_URL

const ORGANIZATION_ID = `${BASE_URL}/#organization`

/**
 * JSON for a <script type="application/ld+json"> body.
 *
 * Plain JSON.stringify leaves "</script>" as is, so a reference title from the
 * database containing it would close the tag early and the rest would run as
 * HTML. Escaping "<" keeps the JSON identical for parsers.
 */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

/**
 * Jabcore as an Organization, with an @id the other nodes point to.
 *
 * Not LocalBusiness: that type is for places customers walk into, and it made
 * structured-data checkers file us as a local shop. `brand` ties the company to
 * onlybrain, so search and AI engines can tell who is behind onlybrain.ai.
 */
export function buildOrganizationJsonLd() {
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: 'Jabcore',
    legalName: 'Jabcore s.r.o.',
    url: BASE_URL,
    // Square, as Google asks for an organization logo (the og-image is 1200 × 630)
    logo: `${BASE_URL}/favicon.png`,
    description:
      'Vývoj softwaru na míru: mobilní aplikace, enterprise systémy, webové aplikace. Lean tým, AI-first přístup, konkurenční ceny.',
    slogan: 'Build it right, build it once.',
    email: 'info@jabcore.cz',
    telephone: '+420792219454',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Brigádnická 208/7',
      postalCode: '46602',
      addressLocality: 'Jablonec nad Nisou',
      addressCountry: 'CZ',
    },
    areaServed: [
      { '@type': 'Country', name: 'Česko' },
      { '@type': 'Country', name: 'Slovensko' },
    ],
    knowsAbout: [
      'Vývoj softwaru na míru',
      'Webové aplikace',
      'Mobilní aplikace',
      'Podnikové informační systémy',
      'Integrace AI do firemních procesů',
      'Napojení na ERP',
    ],
    brand: {
      '@type': 'Brand',
      name: 'onlybrain',
      url: 'https://onlybrain.ai',
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

/**
 * The site itself, published by the organization above. One node for all
 * locales (same @id), so no inLanguage: a value per locale would give the same
 * node twelve different languages. hreflang says which page is which language.
 */
export function buildWebSiteJsonLd() {
  return {
    '@type': 'WebSite',
    '@id': `${BASE_URL}/#website`,
    name: 'Jabcore',
    url: BASE_URL,
    publisher: { '@id': ORGANIZATION_ID },
  }
}

/** Homepage graph: organization and website in one script tag. */
export function buildHomeJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [buildOrganizationJsonLd(), buildWebSiteJsonLd()],
  }
}

/** Breadcrumb trail, e.g. Home > References > project. */
export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
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
  creator: { '@type': 'Organization'; '@id': string; name: string; url: string }
  about?: { '@type': 'Organization'; name: string }
}

/**
 * Structured data for one reference.
 *
 * Used by the detail pages and, on the portfolio one-pager, for every item on
 * the page - there the whole portfolio is a single URL, so without a node per
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
    // Year only - schema.org accepts a partial date and the exact day of a
    // handover is not something we track.
    ...(reference.year ? { dateCreated: String(reference.year) } : {}),
    ...(reference.coverImage ? { image: `${BASE_URL}${reference.coverImage}` } : {}),
    ...(reference.tech.length > 0 ? { keywords: reference.tech.join(', ') } : {}),
    creator: { '@type': 'Organization', '@id': ORGANIZATION_ID, name: 'Jabcore', url: BASE_URL },
    about: { '@type': 'Organization', name: reference.clientName },
  }
}
