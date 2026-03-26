'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SUPPORTED_LANGUAGES, STORAGE_KEY } from '@/lib/i18n'
import { defaultLocale } from '@/lib/i18n-config'

export default function RedirectServices() {
  const router = useRouter()
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const browserLng = navigator.language.split('-')[0]
    const preferred = stored ?? browserLng
    const locale = (SUPPORTED_LANGUAGES as readonly string[]).includes(preferred) ? preferred : defaultLocale
    router.replace(`/${locale}/services`)
  }, [router])
  return null
}
