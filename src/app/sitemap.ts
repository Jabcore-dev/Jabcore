import type { MetadataRoute } from 'next'
import { locales } from '@/lib/i18n-config'
import { SITE_URL } from '@/lib/site-config'

const pages = [
  { path: '', changeFrequency: 'weekly' as const, priority: 1.0 },
  { path: '/services', changeFrequency: 'monthly' as const, priority: 0.9 },
  { path: '/products', changeFrequency: 'monthly' as const, priority: 0.8 },
  { path: '/stack', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/about', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.8 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  for (const locale of locales) {
    for (const page of pages) {
      entries.push({
        url: `${SITE_URL}/${locale}${page.path}`,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      })
    }
  }

  return entries
}
