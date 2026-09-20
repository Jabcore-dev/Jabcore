import { ThemeProvider } from 'next-themes'
import type { Metadata } from 'next'
import '../../globals.css'
import RootHtml from '@/components/RootHtml'
import { PORTFOLIO_URL } from '@/lib/site-config'
import { locales, defaultLocale } from '@/lib/i18n-config'

/**
 * Layout of the portfolio site (portfolio.jabcore.cz).
 *
 * Deliberately not the main site's layout: no services, no products, no
 * contact form — the one-pager is the whole site. It also skips I18nProvider,
 * which loads all twelve locale files into the browser; every string on this
 * page is resolved on the server and handed down as a prop, so a visitor
 * downloads one language's worth of text instead of twelve.
 */
export const metadata: Metadata = {
  metadataBase: new URL(PORTFOLIO_URL),
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default async function PortfolioLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale = (locales as readonly string[]).includes(rawLocale) ? rawLocale : defaultLocale

  return (
    <RootHtml lang={locale}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen bg-background text-foreground">{children}</div>
      </ThemeProvider>
    </RootHtml>
  )
}
