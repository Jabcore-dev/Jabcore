'use client'

import { useEffect, useMemo } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n, { SUPPORTED_LANGUAGES, STORAGE_KEY } from '@/lib/i18n'

interface Props {
  children: React.ReactNode
  /** Locale from URL - has highest priority */
  locale?: string
}

/**
 * Pages under /{locale} must render in that language on the server too.
 *
 * The shared instance always starts in Czech (see lib/i18n.ts) and used to switch
 * only in useEffect, so the server sent Czech text for /en, /de, ... and the
 * translation appeared after hydration. Crawlers that don't run JavaScript
 * (most AI search bots) saw twelve copies of the Czech site.
 *
 * With a locale from the URL we render with a clone fixed to that language:
 * server and client agree, so there is no hydration mismatch, and a clone per
 * render keeps parallel requests on the server from switching each other's
 * language. Without a locale we keep the old client-side detection.
 */
export default function I18nProvider({ children, locale }: Props) {
  const urlLocale =
    locale && (SUPPORTED_LANGUAGES as readonly string[]).includes(locale) ? locale : undefined

  const instance = useMemo(
    () => (urlLocale ? i18n.cloneInstance({ lng: urlLocale, initAsync: false }) : i18n),
    [urlLocale],
  )

  useEffect(() => {
    if (urlLocale) {
      // Keep the shared instance in step for code outside the provider tree
      if (i18n.language !== urlLocale) i18n.changeLanguage(urlLocale)
      // Persist for redirect pages and future visits
      if (localStorage.getItem(STORAGE_KEY) !== urlLocale) {
        localStorage.setItem(STORAGE_KEY, urlLocale)
      }
      return
    }

    // No locale in the URL: localStorage, then browser language
    const stored = localStorage.getItem(STORAGE_KEY)
    const browserLng = navigator.language.split('-')[0]
    const preferred = stored ?? browserLng
    const resolved = (SUPPORTED_LANGUAGES as readonly string[]).includes(preferred) ? preferred : 'cs'

    if (i18n.language !== resolved) {
      i18n.changeLanguage(resolved)
    }
  }, [urlLocale])

  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>
}
