'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SUPPORTED_LANGUAGES, STORAGE_KEY } from '@/lib/i18n'
import { defaultLocale } from '@/lib/i18n-config'

/**
 * Client component that redirects to preferred locale.
 * Lives inside the server-rendered root page so crawlers still see content.
 */
export default function RootRedirect() {
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const browserLng = navigator.language.split('-')[0]
    const preferred = stored ?? browserLng
    const locale = (SUPPORTED_LANGUAGES as readonly string[]).includes(preferred)
      ? preferred
      : defaultLocale
    router.replace(`/${locale}`)
  }, [router])

  return null
}
