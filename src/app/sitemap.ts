import type { MetadataRoute } from 'next'
import { locales, defaultLocale } from '@/lib/i18n-config'
import { SITE_URL, PORTFOLIO_URL } from '@/lib/site-config'
import { getPublishedSlugs } from '@/lib/references'
import { isPortfolioHost } from '@/lib/request-host'

const pages = [
  { path: '', changeFrequency: 'weekly' as const, priority: 1.0 },
  { path: '/services', changeFrequency: 'monthly' as const, priority: 0.9 },
  { path: '/reference', changeFrequency: 'weekly' as const, priority: 0.9 },
  { path: '/products', changeFrequency: 'monthly' as const, priority: 0.8 },
  { path: '/stack', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/about', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.8 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  /*
   * The portfolio domain is one page per language and nothing else. Listing
   * the main site's URLs here would advertise paths this host redirects away.
   */
  if (await isPortfolioHost()) {
    return locales.map((locale) => ({
      url: locale === defaultLocale ? PORTFOLIO_URL : `${PORTFOLIO_URL}/${locale}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: locale === defaultLocale ? 1.0 : 0.8,
    }))
  }

  const entries: MetadataRoute.Sitemap = []

  for (const locale of locales) {
    for (const page of pages) {
      entries.push({
        /*
         * The Czech homepage declares the bare domain as its canonical (see
         * generatePageMetadata), so the sitemap has to offer that same URL.
         * Listing /cs here would hand crawlers an address that points
         * somewhere else the moment they load it.
         */
        url:
          locale === defaultLocale && page.path === ''
            ? SITE_URL
            : `${SITE_URL}/${locale}${page.path}`,
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      })
    }
  }

  /*
   * A request that cannot reach the database must still produce a sitemap: the
   * static pages are the ones that matter for indexing, and failing the whole
   * route over a connection error would take them down too.
   */
  let slugs: string[] = []
  try {
    slugs = await getPublishedSlugs()
  } catch (error) {
    console.error('sitemap: reference se nepodařilo načíst, pokračuji bez nich', error)
  }

  for (const locale of locales) {
    for (const slug of slugs) {
      entries.push({
        url: `${SITE_URL}/${locale}/reference/${slug}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
  }

  return entries
}
