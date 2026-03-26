'use client'

import { usePathname } from 'next/navigation'
import { locales, defaultLocale } from '@/lib/i18n-config'

/**
 * Returns the current locale from the URL path.
 * E.g. /en/services → 'en', /cs → 'cs', /services → 'cs' (default)
 */
export function useLocale(): string {
  const pathname = usePathname()
  const parts = pathname.split('/')
  if (parts.length >= 2 && (locales as readonly string[]).includes(parts[1])) {
    return parts[1]
  }
  return defaultLocale
}

/**
 * Prefix a path with the current locale.
 * localePath('/services') → '/en/services' (if current locale is 'en')
 */
export function useLocalePath() {
  const locale = useLocale()
  return (path: string) => {
    if (path === '/') return `/${locale}`
    return `/${locale}${path}`
  }
}
