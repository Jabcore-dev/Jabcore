import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/providers/Providers'
import Navigation from '@/components/sections/Navigation'
import Footer from '@/components/sections/Footer'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: {
    default: 'Jabcore — Build it right, build it once.',
    template: '%s | Jabcore',
  },
  description: 'Vývoj softwaru na míru — mobilní aplikace, enterprise systémy, webové aplikace. Lean tým, AI-first přístup, konkurenční ceny.',
  metadataBase: new URL('https://jabcore.cz'),
  alternates: { canonical: '/' },
  openGraph: { siteName: 'Jabcore', locale: 'cs_CZ', type: 'website' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" suppressHydrationWarning>
      <body>
        <Providers>
          <div className="min-h-screen bg-background text-foreground">
            <Navigation />
            <main>{children}</main>
            <Footer />
          </div>
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  )
}
