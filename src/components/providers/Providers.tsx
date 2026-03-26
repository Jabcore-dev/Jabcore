'use client'

import { ThemeProvider } from 'next-themes'
import I18nProvider from './I18nProvider'

interface Props {
  children: React.ReactNode
  locale?: string
}

export default function Providers({ children, locale }: Props) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <I18nProvider locale={locale}>{children}</I18nProvider>
    </ThemeProvider>
  )
}
