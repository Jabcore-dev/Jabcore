'use client'

import { useEffect } from 'react'
import i18n, { SUPPORTED_LANGUAGES, STORAGE_KEY } from '@/lib/i18n'

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Spouštíme výhradně na klientovi — localStorage a navigator jsou dostupné
    // až po hydrataci, takže zde nehrozí server/klient mismatch.
    const stored = localStorage.getItem(STORAGE_KEY)
    const browserLng = navigator.language.split('-')[0]

    const preferred = stored ?? browserLng
    const resolved = (SUPPORTED_LANGUAGES as string[]).includes(preferred) ? preferred : 'cs'

    if (i18n.language !== resolved) {
      i18n.changeLanguage(resolved)
    }
  }, [])

  return <>{children}</>
}
