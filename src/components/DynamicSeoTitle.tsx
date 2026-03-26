'use client'

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { usePathname } from 'next/navigation'
import { locales } from '@/lib/i18n-config'

const BASE_URL = 'https://jabcore.cz'

const PAGE_ROUTES = ['', '/services', '/products', '/stack', '/about', '/contact'] as const
const ROUTE_TO_PAGE: Record<string, string> = {
  '': 'home',
  '/services': 'services',
  '/products': 'products',
  '/stack': 'stack',
  '/about': 'about',
  '/contact': 'contact',
}

/** Strip /{locale} prefix from pathname, e.g. /en/services → /services */
function stripLocalePrefix(pathname: string): string {
  const parts = pathname.split('/')
  if (parts.length >= 2 && (locales as readonly string[]).includes(parts[1])) {
    return '/' + parts.slice(2).join('/')
  }
  return pathname
}

function updateMetaTag(selector: string, content: string) {
  let el = document.querySelector(selector) as HTMLMetaElement | null
  if (el) {
    el.setAttribute('content', content)
  } else {
    el = document.createElement('meta')
    const propMatch = selector.match(/property="([^"]+)"/)
    const nameMatch = selector.match(/name="([^"]+)"/)
    if (propMatch) el.setAttribute('property', propMatch[1])
    else if (nameMatch) el.setAttribute('name', nameMatch[1])
    el.setAttribute('content', content)
    document.head.appendChild(el)
  }
}

export default function DynamicSeoTitle() {
  const { t, i18n } = useTranslation()
  const pathname = usePathname()

  useEffect(() => {
    const strippedPath = stripLocalePrefix(pathname)
    const normalizedPath = strippedPath === '/' ? '' : strippedPath
    const page = ROUTE_TO_PAGE[normalizedPath] ?? 'home'
    const url = `${BASE_URL}/${i18n.language}${normalizedPath}`
    const ogImage = `${BASE_URL}/og-image.png`

    const title = t(`seo.${page}.title`)
    const description = t(`seo.${page}.description`)
    const keywords = t(`seo.${page}.keywords`)

    document.title = title
    document.documentElement.lang = i18n.language

    updateMetaTag('meta[name="description"]', description)
    updateMetaTag('meta[name="keywords"]', keywords)

    updateMetaTag('meta[property="og:title"]', title)
    updateMetaTag('meta[property="og:description"]', description)
    updateMetaTag('meta[property="og:image"]', ogImage)
    updateMetaTag('meta[property="og:url"]', url)
    updateMetaTag('meta[property="og:type"]', 'website')
    updateMetaTag('meta[property="og:locale"]', i18n.language)

    updateMetaTag('meta[name="twitter:title"]', title)
    updateMetaTag('meta[name="twitter:description"]', description)
    updateMetaTag('meta[name="twitter:image"]', ogImage)

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (canonical) {
      canonical.href = url
    } else {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      canonical.href = url
      document.head.appendChild(canonical)
    }
  }, [pathname, i18n.language, t])

  return null
}
