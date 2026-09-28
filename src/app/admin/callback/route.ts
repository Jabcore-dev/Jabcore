import { NextResponse, type NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { adminUsers } from '@/db/schema'
import { FLOW_COOKIE, finishLogin, type LoginFlow } from '@/lib/auth/oidc'
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  type SessionPayload,
} from '@/lib/auth/session'
import { IS_PRODUCTION } from '@/lib/site-config'

function readFlow(raw: string | undefined): LoginFlow | null {
  if (!raw) return null
  try {
    const flow = JSON.parse(raw) as Partial<LoginFlow>
    if (!flow.state || !flow.nonce || !flow.verifier || !flow.next) return null
    return flow as LoginFlow
  } catch {
    return null
  }
}

/** Redirect URI of the "Jabcore" application in Jabcore Platform. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const flow = readFlow(request.cookies.get(FLOW_COOKIE)?.value)

  const fail = (error: string) => {
    const url = new URL('/admin/login', request.url)
    url.searchParams.set('error', error)
    const response = NextResponse.redirect(url)
    response.cookies.delete({ name: FLOW_COOKIE, path: '/admin' })
    return response
  }

  const code = params.get('code')
  if (!flow || !code || params.get('state') !== flow.state) return fail('invalid-callback')

  let email: string
  let name: string | null
  try {
    ;({ email, name } = await finishLogin(code, flow))
  } catch (error) {
    console.error('OIDC callback failed', error)
    return fail('unavailable')
  }

  // Signing in to the platform is not enough - the account has to be listed
  // here, which is also where its role comes from.
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1)
  if (!user) return fail('denied')

  await db
    .update(adminUsers)
    .set({ lastLoginAt: new Date(), name: user.name ?? name })
    .where(eq(adminUsers.id, user.id))

  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    name: user.name ?? name,
    role: user.role === 'owner' ? 'owner' : 'editor',
  }

  const response = NextResponse.redirect(new URL(flow.next, request.url))
  response.cookies.delete({ name: FLOW_COOKIE, path: '/admin' })
  response.cookies.set(SESSION_COOKIE, await createSessionToken(payload), {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
  return response
}
