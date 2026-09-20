import { NextResponse, type NextRequest } from 'next/server'
import { locales, defaultLocale, LOCALE_COOKIE } from '@/lib/i18n-config'
import { PORTFOLIO_HOST, SITE_URL, PORTFOLIO_URL } from '@/lib/site-config'
import { SESSION_COOKIE, readSessionToken } from '@/lib/auth/session'
import { clientIp, countryOfIp } from '@/lib/geo'

/**
 * Host and locale routing.
 *
 * One application serves two sites:
 *
 *   jabcore.cz            the marketing site  (/[locale]/…)
 *   portfolio.jabcore.cz  the portfolio one-pager (/portfolio/[locale])
 *
 * The portfolio host is rewritten, not redirected, so the visible URL stays
 * portfolio.jabcore.cz/ while Next renders an internal path. Caddy must pass
 * the Host header through untouched or everything here falls back to the main
 * site - see deploy/Caddyfile.
 *
 * Under the old static export none of this could run on the server, so every
 * unprefixed path had its own page.tsx redirecting from a useEffect: the
 * visitor loaded a blank page first and crawlers saw a client-side hop.
 */

/** Country → language, for the two countries we can recognise by IP. */
const COUNTRY_LOCALE: Record<string, string> = { CZ: 'cs', SK: 'sk' }

/**
 * Which language to show someone who asked for an unprefixed URL.
 *
 * In priority order:
 *
 *   1. the cookie the language switcher writes - an explicit choice always
 *      wins, otherwise geolocation would undo it on the next click,
 *   2. the country the IP belongs to,
 *   3. Accept-Language,
 *   4. Czech.
 *
 * Step 2 exists because a Czech visitor with an English-language browser sends
 * `Accept-Language: en-US,en` and would otherwise be served English on a Czech
 * company's site. It only ever applies to unprefixed URLs: /en/services is
 * never redirected, so hreflang keeps working and crawlers reach every
 * language regardless of where they crawl from.
 */
function preferredLocale(request: NextRequest): string {
  const chosen = request.cookies.get(LOCALE_COOKIE)?.value
  if (chosen && (locales as readonly string[]).includes(chosen)) return chosen

  const country = countryOfIp(clientIp(request.headers))
  const byCountry = country ? COUNTRY_LOCALE[country] : undefined
  if (byCountry && (locales as readonly string[]).includes(byCountry)) return byCountry

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

/** The locale a path starts with, or null. */
function localePrefix(pathname: string): string | null {
  return (
    locales.find((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) ?? null
  )
}

function handlePortfolioHost(request: NextRequest) {
  const { pathname } = request.nextUrl
  const prefix = localePrefix(pathname)

  // /cs, /en … → the one-pager in that language.
  if (prefix && pathname === `/${prefix}`) {
    const url = request.nextUrl.clone()
    url.pathname = `/portfolio/${prefix}`
    return NextResponse.rewrite(url)
  }

  // The bare domain is the Czech one-pager and its canonical address, so it is
  // rewritten rather than redirected - the same rule the main site uses for
  // its own root.
  if (pathname === '/') {
    const locale = preferredLocale(request)
    const url = request.nextUrl.clone()

    if (locale === defaultLocale) {
      url.pathname = `/portfolio/${defaultLocale}`
      return NextResponse.rewrite(url)
    }

    url.pathname = `/${locale}`
    return NextResponse.redirect(url, 307)
  }

  /*
   * Anything else on this host belongs to the main site - an old link, or a
   * path someone typed. Sending it to jabcore.cz is more useful than a 404,
   * and it keeps the portfolio host from answering on URLs it has no content
   * for, which is what would get them indexed under the wrong domain.
   */
  return NextResponse.redirect(new URL(pathname, SITE_URL), 308)
}

/**
 * Keeps anonymous visitors out of the panel.
 *
 * This is the redirect that sends a human to the login screen; it is not the
 * authorisation check. Every admin page and server action verifies the session
 * again server-side, because an action is reachable by POST on its own.
 */
async function handleAdmin(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isLogin = pathname === '/admin/login'
  const session = await readSessionToken(request.cookies.get(SESSION_COOKIE)?.value)

  if (session && isLogin) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  if (!session && !isLogin) {
    const url = new URL('/admin/login', request.url)
    // Where to come back to once they are in - a bookmarked reference should
    // not drop the visitor on the dashboard after logging in.
    if (pathname !== '/admin') url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.toLowerCase() ?? ''

  // The panel is served from the main host only, and is never localised.
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return handleAdmin(request)
  }

  // Compared without the port so it also works locally, where the same host
  // answers on :3000.
  if (host.split(':')[0] === PORTFOLIO_HOST.split(':')[0]) {
    return handlePortfolioHost(request)
  }

  const { pathname } = request.nextUrl
  const prefix = localePrefix(pathname)

  /*
   * The portfolio lives on its own domain. Serving it from the main one too
   * would put identical content at two addresses, so the main host only ever
   * points at the other domain. 308 keeps the method and tells search engines
   * the move is permanent.
   */
  if (prefix && (pathname === `/${prefix}/portfolio` || pathname.startsWith(`/${prefix}/portfolio/`))) {
    const target = prefix === defaultLocale ? PORTFOLIO_URL : `${PORTFOLIO_URL}/${prefix}`
    return NextResponse.redirect(new URL(target), 308)
  }

  // Internal path of the portfolio site; it must not be reachable directly, or
  // the one-pager would also live at jabcore.cz/portfolio/cs.
  if (pathname === '/portfolio' || pathname.startsWith('/portfolio/')) {
    return NextResponse.redirect(new URL(PORTFOLIO_URL), 308)
  }

  /*
   * The Czech homepage lives at the bare domain - that is what its canonical
   * and the cs hreflang point at. /cs renders the same thing, so it is moved
   * rather than left as a second address for identical content.
   *
   * Safe only because the language switcher writes a cookie: without it, a
   * visitor picking Czech from an English IP would land on /, be sent back to
   * /en, and bounce.
   */
  if (pathname === `/${defaultLocale}`) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url, 308)
  }

  if (prefix) return NextResponse.next()

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
  matcher: ['/((?!_next|api|.*\\.).*)'],
}
