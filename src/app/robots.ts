import type { MetadataRoute } from 'next'

// Required for output: 'export' — forces static generation
export const dynamic = 'force-static'

/**
 * Next.js built-in robots.txt generation.
 * Replaces the static public/robots.txt.
 * With output: 'export', this generates out/robots.txt automatically.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://jabcore.cz/sitemap.xml',
  }
}
