'use client'

import { ThemeProvider } from 'next-themes'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange={false}
    >
      <I18nextProvider i18n={i18n}>
        {children}
      </I18nextProvider>
    </ThemeProvider>
  )
}
