import { NextResponse, type NextRequest } from 'next/server'
import { FLOW_COOKIE, FLOW_MAX_AGE_SECONDS, isOidcConfigured, startLogin } from '@/lib/auth/oidc'
import { IS_PRODUCTION } from '@/lib/site-config'

/** Sends the browser to the Jabcore Platform login. */
export async function GET(request: NextRequest) {
  const loginPage = new URL('/admin/login', request.url)

  if (!isOidcConfigured()) {
    loginPage.searchParams.set('error', 'not-configured')
    return NextResponse.redirect(loginPage)
  }

  try {
    const { url, flow } = await startLogin(request.nextUrl.searchParams.get('next') ?? '/admin')
    const response = NextResponse.redirect(url)
    response.cookies.set(FLOW_COOKIE, JSON.stringify(flow), {
      httpOnly: true,
      secure: IS_PRODUCTION,
      // lax, not strict: the platform brings the browser back with a top-level
      // GET from another site, and a strict cookie would not come along.
      sameSite: 'lax',
      path: '/admin',
      maxAge: FLOW_MAX_AGE_SECONDS,
    })
    return response
  } catch (error) {
    console.error('OIDC login start failed', error)
    loginPage.searchParams.set('error', 'unavailable')
    return NextResponse.redirect(loginPage)
  }
}
