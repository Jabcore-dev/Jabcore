import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { Providers } from './providers'
import { generatePageMetadata } from '@/lib/metadata'
import './globals.css'

// Default metadata — each page overrides with generatePageMetadata()
export const metadata: Metadata = generatePageMetadata({
  title: 'Jabcore',
  description: 'Jabcore nabízí profesionální webový vývoj, moderní digitální řešení a konzultace. Specializujeme se na React, TypeScript a moderní technologie.',
  path: '/',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" suppressHydrationWarning>
      <head>
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-ENB3YT49GT" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-ENB3YT49GT');
            `,
          }}
        />
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>
          {/* TODO Honza: Replace with migrated Navigation component (remove react-router-dom, use next/link + usePathname) */}
          <div className="min-h-screen bg-background text-foreground">
            {children}
          </div>
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  )
}
