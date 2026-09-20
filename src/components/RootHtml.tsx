import Script from 'next/script'

const GA_MEASUREMENT_ID = 'G-ENB3YT49GT'

/**
 * The <html> and <body> shell, shared by every root layout.
 *
 * It takes `lang` as a prop because the site has four independent root layouts
 * - the Czech homepage, the localised site, the portfolio domain and the admin
 * panel - and each knows its own language. A single root layout could only
 * ever hardcode one, which is how /en/services ended up declaring Czech.
 */
export default function RootHtml({
  lang,
  children,
  analytics = true,
}: {
  lang: string
  children: React.ReactNode
  /** Off in the admin panel - there is nothing to measure behind a login. */
  analytics?: boolean
}) {
  return (
    <html lang={lang} suppressHydrationWarning>
      <body suppressHydrationWarning>
        {analytics && (
          <>
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
          </>
        )}
        {children}
      </body>
    </html>
  )
}
