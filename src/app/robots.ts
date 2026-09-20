import type { MetadataRoute } from 'next'
import { SITE_URL, IS_PRODUCTION } from '@/lib/site-config'

/**
 * robots.txt.
 *
 * The test deployment serves the same pages on a different host, so it has to
 * say "do not index" — otherwise the staging copy competes with the real site
 * in search results.
 */
export default function robots(): MetadataRoute.Robots {
  if (!IS_PRODUCTION) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The admin panel has nothing to index and its URLs should not leak.
      disallow: '/admin',
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
