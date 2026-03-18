import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import Providers from '@/components/providers/Providers'
import Navigation from '@/components/sections/Navigation'
import Footer from '@/components/sections/Footer'
import { Toaster } from '@/components/ui/sonner'

const GA_MEASUREMENT_ID = 'G-ENB3YT49GT'

export const metadata: Metadata = {
  title: {
    default: 'Jabcore — Build it right, build it once.',
    template: '%s | Jabcore',
  },
  description: 'Vývoj softwaru na míru — mobilní aplikace, enterprise systémy, webové aplikace. Lean tým, AI-first přístup, konkurenční ceny.',
  metadataBase: new URL('https://jabcore.cz'),
  alternates: { canonical: 'https://jabcore.cz' },
  openGraph: {
    siteName: 'Jabcore',
    locale: 'cs_CZ',
    type: 'website',
    images: [
      {
        url: 'https://jabcore.cz/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Jabcore — Build it right, build it once.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://jabcore.cz/og-image.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" suppressHydrationWarning>
      <body>
        {/* Google Analytics — loaded after interaction to avoid blocking LCP */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>

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
