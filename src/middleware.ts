import { NextResponse, type NextRequest } from 'next/server'
import { locales, defaultLocale } from '@/lib/i18n-config'

/**
 * Locale routing.
 *
 * Under the old static export this could not run on the server, so every
 * unprefixed path had its own page.tsx that redirected from a useEffect —
 * the visitor loaded a blank page first and crawlers saw a client-side hop.
 * With a Node runtime the redirect happens before anything is rendered.
 *
 * Host-based routing for portfolio.jabcore.cz is added in phase 5; it belongs
 * in this same matcher.
 */

/** Best supported locale from the Accept-Language header, or the default. */
function preferredLocale(request: NextRequest): string {
  const header = request.headers.get('accept-language')
  if (!header) return defaultLocale

  // "cs-CZ,cs;q=0.9,en;q=0.8" → ["cs", "cs", "en"], already in priority order
  // because the browser sends them sorted by q.
  const requested = header
    .split(',')
    .map((part) => part.split(';')[0].trim().split('-')[0].toLowerCase())

  for (const candidate of requested) {
    if ((locales as readonly string[]).includes(candidate)) return candidate
  }

  return defaultLocale
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Already prefixed with a known locale — nothing to do.
  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  )
  if (hasLocale) return NextResponse.next()

  const locale = preferredLocale(request)

  /*
   * The root URL is the canonical address of the Czech homepage (see
   * generatePageMetadata and the hreflang alternates, where cs points at
   * BASE_URL and not at /cs). Redirecting a Czech visitor away from it would
   * send every crawler to a URL that declares a different one as canonical,
   * so "/" is served as-is and only other languages are moved to their prefix.
   */
  if (pathname === '/' && locale === defaultLocale) return NextResponse.next()

  const url = request.nextUrl.clone()
  url.pathname = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`

  // Temporary: the right locale depends on who is asking, so this must not be
  // cached as a permanent move by browsers or proxies.
  return NextResponse.redirect(url, 307)
}

export const config = {
  /*
   * Everything except Next internals, the API and files with an extension.
   * Without the extension guard the redirect would also catch /og-image.png
   * and the rest of public/.
   */
  matcher: ['/((?!_next|api|admin|.*\\.).*)'],
}
