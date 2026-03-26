'use client'

import { useEffect } from 'react'
import i18n, { SUPPORTED_LANGUAGES, STORAGE_KEY } from '@/lib/i18n'

interface Props {
  children: React.ReactNode
  /** Locale from URL — has highest priority */
  locale?: string
}

export default function I18nProvider({ children, locale }: Props) {
  useEffect(() => {
    // URL locale has priority, then localStorage, then browser language
    const stored = localStorage.getItem(STORAGE_KEY)
    const browserLng = navigator.language.split('-')[0]

    const preferred = locale ?? stored ?? browserLng
    const resolved = (SUPPORTED_LANGUAGES as readonly string[]).includes(preferred) ? preferred : 'cs'

    if (i18n.language !== resolved) {
      i18n.changeLanguage(resolved)
    }

    // Persist for redirect pages and future visits
    if (locale && locale !== stored) {
      localStorage.setItem(STORAGE_KEY, resolved)
    }
  }, [locale])

  return <>{children}</>
}
