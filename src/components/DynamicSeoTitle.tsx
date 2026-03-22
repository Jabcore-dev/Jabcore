'use client'

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { usePathname } from 'next/navigation'

const PAGE_TITLE_KEYS: Record<string, string> = {
  '/': 'seo.home.title',
  '/services': 'seo.services.title',
  '/products': 'seo.products.title',
  '/stack': 'seo.stack.title',
  '/about': 'seo.about.title',
  '/contact': 'seo.contact.title',
}

export default function DynamicSeoTitle() {
  const { t, i18n } = useTranslation()
  const pathname = usePathname()

  useEffect(() => {
    const key = PAGE_TITLE_KEYS[pathname] ?? 'seo.home.title'
    document.title = t(key)
    document.documentElement.lang = i18n.language
  }, [pathname, i18n.language, t])

  return null
}
