import type { MetadataRoute } from 'next'
import { SITE_URL, PORTFOLIO_URL, IS_PRODUCTION } from '@/lib/site-config'
import { isPortfolioHost } from '@/lib/request-host'

/**
 * robots.txt for whichever of the two sites was asked.
 *
 * The test deployment serves the same pages on different hosts, so it has to
 * say "do not index" — otherwise the staging copy competes with the real site
 * in search results.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  if (!IS_PRODUCTION) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }

  const portfolio = await isPortfolioHost()

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The admin panel has nothing to index and its URLs should not leak.
      ...(portfolio ? {} : { disallow: '/admin' }),
    },
    // Each host advertises its own sitemap; pointing the portfolio domain at
    // the main one would offer a crawler URLs that host redirects away.
    sitemap: `${portfolio ? PORTFOLIO_URL : SITE_URL}/sitemap.xml`,
  }
}
